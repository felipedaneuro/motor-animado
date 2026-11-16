"""A narração: mostra o custo, gera a voz de teste do Mac (grátis) ou a voz da ElevenLabs (paga, com cache).

Uso:
  ferramentas/py voz.py roteiro.txt --custo                 caracteres e custo estimado, sem gastar nada
  ferramentas/py voz.py roteiro.txt --teste                 voz/voz.wav com a voz do Mac (say), de graça
  ferramentas/py voz.py roteiro.txt --elevenlabs            voz/voz.wav na ElevenLabs (espere o ok da pessoa antes)
  ferramentas/py voz.py roteiro.txt --elevenlabs --frases 1,3-4    só essas frases, em voz/novas/fN.wav (para o emendar.py)
  ferramentas/py voz.py roteiro.txt --chatterbox --amostra voz.wav  Chatterbox multilíngue v3 no Mac (grátis), clonando a amostra;
                                                                  a marcação de emoção de cada frase vira a intensidade

A voz e o modelo vêm do perfil.json (voice.voice_id, voice.model_id); --voz troca o ID.
A chave fica no .env da pasta do vídeo ou da pasta acima (ELEVENLABS_API_KEY=...) e nunca aparece na tela.
Pronúncias: voz/pronuncias.txt com linhas "NMDA = ene-eme-dê-á". Valem só para o áudio; a legenda usa o roteiro.
Grava sempre voz/texto-voz.txt (o texto falado), que também serve para gerar a voz pelo conector da ElevenLabs.
Depois da voz: transcrever.py voz/voz.wav --saida voz  e  alinhar.py roteiro.txt voz/voz.json voz/voz.wav voz/tempos.json
"""
import argparse
import hashlib
import json
import os
import re
import sys
import tempfile
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import EMOTION_TAG, SAMPLE_RATE, load_profile, log_step, require, run, script_lines, strip_tags

API = "https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128"
CHATTERBOX = "mlx-community/chatterbox-multilingual-v3"
PAUSE_S = 0.32   # o respiro entre as frases na Chatterbox (o vídeo de referência corta os silêncios longos)
# a marcação de emoção vira a intensidade (exaggeration) da Chatterbox
INTENSITY = [(("excited", "triumphant", "urgent", "dramatic"), 0.8), (("tense", "suspenseful", "determined", "firm", "worried"), 0.65),
             (("calm", "caring", "whispers", "relieved", "sighs"), 0.35)]


def chosen_phrases(spec, total):
    if not spec:
        return list(range(total))
    chosen = []
    for part in spec.split(","):
        first, _, last = part.strip().partition("-")
        chosen += range(int(first) - 1, int(last or first))
    return [i for i in chosen if 0 <= i < total]


def pronunciation_rules(folder):
    path = Path(folder) / "pronuncias.txt"
    rules = []
    if path.exists():
        for line in path.read_text(encoding="utf-8-sig").splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                written, spoken = (x.strip() for x in line.split("=", 1))
                rules.append((re.compile(rf"(?<!\w){re.escape(written)}(?!\w)"), spoken))
    return rules


def spoken(text, rules):
    for pattern, replacement in rules:
        text = pattern.sub(replacement, text)
    return text


def api_key():
    if os.environ.get("ELEVENLABS_API_KEY"):
        return os.environ["ELEVENLABS_API_KEY"]
    # o .env da pasta atual ou de até 3 pastas acima (uma chave só para todos os vídeos)
    here = Path.cwd()
    env = next((d / ".env" for d in [here, *list(here.parents)[:3]] if (d / ".env").exists()), None)
    if env:
        for line in env.read_text().splitlines():
            if line.strip().startswith("ELEVENLABS_API_KEY"):
                return line.split("=", 1)[1].strip().strip("\"'")
    sys.exit("faltou a chave: crie um arquivo .env na pasta com ELEVENLABS_API_KEY=sua_chave")


def elevenlabs(text, voice, model, target, settings):
    """Uma tomada na ElevenLabs. O mesmo texto com a mesma voz não é gerado duas vezes (cache em voz/cache/)."""
    key = hashlib.sha1(f"{voice}|{model}|{settings}|{text}".encode()).hexdigest()[:16]
    cache = target.parent / "cache" / f"{key}.mp3"
    if not cache.exists():
        body = json.dumps({"text": text, "model_id": model, "voice_settings": settings})
        request = urllib.request.Request(API.format(voice=voice), data=body.encode(),
                                         headers={"xi-api-key": api_key(), "Content-Type": "application/json"})
        try:
            audio = urllib.request.urlopen(request, timeout=600).read()
        except urllib.error.HTTPError as error:
            sys.exit(f"a ElevenLabs recusou ({error.code}): {error.read().decode()[:300]}")
        cache.parent.mkdir(parents=True, exist_ok=True)
        cache.write_bytes(audio)
    run(["ffmpeg", "-v", "error", "-y", "-i", cache, "-ar", SAMPLE_RATE, "-ac", "1", target])


def voice_settings(profile):
    """No eleven_v3 a estabilidade é 0 (criativa, mais emoção), 0,5 (natural) ou 1 (robusta, ignora as marcações)."""
    if profile["model_id"].startswith("eleven_v3"):
        return {"stability": profile.get("stability_v3", 0.5), "similarity_boost": 0.8}
    return {"stability": profile.get("stability", 0.5), "similarity_boost": 0.8}


def intensity(line):
    tag = " ".join(EMOTION_TAG.findall(line)).lower()
    return next((value for words, value in INTENSITY if any(w in tag for w in words)), 0.5)


def chatterbox_phrase(text, sample, strength, target):
    """Uma frase na Chatterbox, com cache: o mesmo texto, amostra e intensidade não é gerado duas vezes."""
    key = hashlib.sha1(f"{CHATTERBOX}|{Path(sample).resolve()}|{strength}|{text}".encode()).hexdigest()[:16]
    cache = target.parent / "cache" / f"{key}.wav"
    if not cache.exists():
        cache.parent.mkdir(parents=True, exist_ok=True)
        cfg = 0.35 if strength >= 0.7 else 0.5        # muita emoção com cfg alto acelera a fala
        run([sys.executable, "-m", "mlx_audio.tts.generate", "--model", CHATTERBOX, "--text", text, "--ref_audio", sample,
             "--lang_code", "pt", "--exaggeration", str(strength), "--cfg_scale", str(cfg),
             "--output_path", cache.parent, "--file_prefix", key, "--audio_format", "wav", "--join_audio"])
    trim = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
    run(["ffmpeg", "-v", "error", "-y", "-i", cache, "-af", trim, "-ar", SAMPLE_RATE, "-ac", "1", target])   # corta o silêncio das pontas


def chatterbox(lines, sample, out, jobs):
    """Cada frase sai separada (uma emoção por frase) e as frases são unidas com um respiro curto."""
    parts = []
    for line, target in jobs:
        part = target if target.name != "voz.wav" else out / "frases" / f"{len(parts) + 1:02d}.wav"
        part.parent.mkdir(parents=True, exist_ok=True)
        chatterbox_phrase(strip_tags(line), sample, intensity(line), part)
        parts.append(part)
        print(f"  {len(parts)}/{len(jobs)} {strip_tags(line)[:50]}")
    if jobs[0][1].name == "voz.wav":
        with tempfile.TemporaryDirectory() as tmp:
            pause = Path(tmp) / "pausa.wav"
            run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"anullsrc=r={SAMPLE_RATE}:cl=mono", "-t", str(PAUSE_S), pause])
            listing = Path(tmp) / "lista.txt"
            listing.write_text("".join(f"file '{p.resolve()}'\nfile '{pause}'\n" for p in parts))
            run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", listing, "-ar", SAMPLE_RATE, "-ac", "1", out / "voz.wav"])


def mac_voice(text, voice, target):
    """A voz do Mac, só para testar o fluxo sem gastar. Lista de vozes: say -v '?' | grep pt_BR"""
    with tempfile.TemporaryDirectory() as tmp:
        source = Path(tmp) / "texto.txt"
        source.write_text(text, encoding="utf-8")
        aiff = Path(tmp) / "voz.aiff"
        run(["say", "-v", voice, "-f", source, "-o", aiff])
        run(["ffmpeg", "-v", "error", "-y", "-i", aiff, "-ar", SAMPLE_RATE, "-ac", "1", target])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("roteiro")
    parser.add_argument("--saida", default="voz")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--custo", action="store_true")
    group.add_argument("--teste", action="store_true")
    group.add_argument("--elevenlabs", action="store_true")
    group.add_argument("--chatterbox", action="store_true")
    parser.add_argument("--amostra", help="a voz que a Chatterbox clona (um .wav de 5 a 20 s)")
    parser.add_argument("--frases", help="só estas frases (1,3-5), em voz/novas/fN.wav")
    parser.add_argument("--voz", help="o voice_id da ElevenLabs ou o nome da voz do Mac")
    parser.add_argument("--modelo", help="o modelo da ElevenLabs (ex.: eleven_v3, que aceita marcações de emoção)")
    args = parser.parse_args()
    require("ffmpeg")
    out = Path(args.saida)
    out.mkdir(parents=True, exist_ok=True)
    profile = load_profile()["voice"]
    model = args.modelo or profile["model_id"]
    # as marcações de emoção ([excited], [whispers]...) só funcionam no eleven_v3; nos outros, saem do texto
    lines = script_lines(args.roteiro, keep_tags=args.chatterbox or (args.elevenlabs and model.startswith("eleven_v3")))
    rules = pronunciation_rules(out)
    chosen = chosen_phrases(args.frases, len(lines))
    texts = [spoken(lines[i], rules) for i in chosen]
    chars = sum(len(t) for t in texts) + len(texts) - 1
    price = "grátis (Chatterbox no Mac)" if args.chatterbox else f"≈ US$ {chars * profile['usd_per_1000_chars'] / 1000:.2f} na ElevenLabs"
    print(f"{len(chosen)} frases, {chars} caracteres, {price}")
    (out / "texto-voz.txt").write_text("\n".join(texts), encoding="utf-8")
    if args.custo:
        return
    if args.chatterbox:
        return local_voice(args, lines, chosen, out, rules)
    generate(args, {**profile, "model_id": model}, chosen, texts, out)


def local_voice(args, lines, chosen, out, rules):
    if not args.amostra or not Path(args.amostra).exists():
        sys.exit("a Chatterbox precisa de --amostra com a voz a clonar")
    texts = [spoken(lines[i], rules) for i in chosen]
    jobs = [(t, out / "novas" / f"f{i + 1}.wav") for i, t in zip(chosen, texts)] if args.frases else [(t, out / "voz.wav") for t in texts]
    chatterbox(texts, args.amostra, out, jobs)
    (out / "texto-voz.txt").write_text("\n".join(strip_tags(t) for t in texts), encoding="utf-8")
    log_step(f"voz: Chatterbox v3 no Mac (grátis), {len(texts)} frases, amostra {Path(args.amostra).name}")


def generate(args, profile, chosen, texts, out):
    voice = args.voz or (profile["test_voice"] if args.teste else profile["voice_id"])
    jobs = [(t, out / "novas" / f"f{i + 1}.wav") for i, t in zip(chosen, texts)] if args.frases else [("\n".join(texts), out / "voz.wav")]
    for text, target in jobs:
        target.parent.mkdir(parents=True, exist_ok=True)
        if args.teste:
            mac_voice(text, voice, target)
        else:
            elevenlabs(text, voice, profile["model_id"], target, voice_settings(profile))
        print(f"voz em {target}")
    kind = "voz de teste do Mac" if args.teste else f"ElevenLabs ({sum(len(t) for t in texts)} caracteres)"
    log_step(f"voz: {kind}, {len(texts)} frases, voz {voice}")


if __name__ == "__main__":
    main()
