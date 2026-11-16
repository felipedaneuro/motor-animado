"""Efeitos e música do vídeo, sintetizados aqui (nenhum arquivo de terceiros, nenhuma licença), no tempo de cada evento.

Uso, na pasta do vídeo:
  ferramentas/py sons.py cena                          motor web: lê cena/js/plano.js
  ferramentas/py sons.py --plano som/plano-sons.json   motor Blender: a mesma lista de eventos, em JSON
Grava som/efeitos.wav e som/musica.wav (48 kHz, mono).

Lê o cena/js/plano.js pelo Node (sem adivinhar nada no código):
  - cada movimento da câmera ganha um whoosh (curto no approach, longo no fly; nada no cut)
  - cada etiqueta (LABELS) e cada card (CARDS) ganha um pop
  - a lista SOUNDS traz os sons da história: {sound, at, volume, options}
Volumes dos whooshes e pops e a música vêm do estilo.json (seção "sound").
Sons da biblioteca: whoosh, pop, thump, hiss, glub, rise, siren, sparkle, party, drone, shimmer, snip, lock, portal, heartbeat,
chapter (vinheta de capítulo), victory (fanfarra de vitória).

Sons que não dá pra sintetizar (risada de platéia, aplausos, vinheta de abertura): `{"sound": "amostra", "arquivo": "som/amostras/<nome>.wav",
"at": ..., "volume": ...}` toca um .wav da pessoa (gravado ou de biblioteca com licença, nunca baixado sem checar) na pasta do vídeo,
16 bits, qualquer taxa (reamostrado aqui) e qualquer número de canais (misturado pra mono). Ver `referencias/som.md`.
"""
import argparse
import json
import os
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import SAMPLE_RATE, TAIL_SECONDS, load_style, read_json, require

RNG = np.random.default_rng(7)
EXTRACT = ("const p = await import(process.env.PLANO_URL);"
           "console.log(JSON.stringify({moves: (p.CAMERA?.moves ?? []).map(m => ({kind: m.kind, at: m.at})),"
           "labels: (p.LABELS ?? []).map(l => l.at), cards: (p.CARDS ?? []).map(c => c.at), sounds: p.SOUNDS ?? []}));")


def seconds(duration):
    return np.arange(int(duration * SAMPLE_RATE)) / SAMPLE_RATE


# ---------- a biblioteca ----------
def whoosh(duration=0.45):
    x = np.cumsum(RNG.standard_normal(int(duration * SAMPLE_RATE)))
    x -= np.convolve(x, np.ones(400) / 400, "same")
    return x / np.abs(x).max() * np.sin(np.pi * seconds(duration) / duration) ** 2


def pop(start_hz=900, end_hz=350, duration=0.09):
    t = seconds(duration)
    return np.sin(2 * np.pi * (start_hz + (end_hz - start_hz) * t / duration) * t) * np.exp(-t * 40)


def thump(duration=0.5):
    t = seconds(duration)
    return np.sin(2 * np.pi * (85 - 40 * t / duration) * t) * np.exp(-t * 9) + RNG.standard_normal(len(t)) * np.exp(-t * 60) * 0.5


def hiss(duration=1.5, smooth=8):
    x = RNG.standard_normal(int(duration * SAMPLE_RATE))
    x -= np.convolve(x, np.ones(smooth) / smooth, "same")
    t = seconds(duration)
    return x * np.minimum(1, np.minimum(t / 0.15, (duration - t) / 0.3)) * 0.5


def glub(duration=0.18):
    t = seconds(duration)
    return np.sin(2 * np.pi * np.cumsum(180 + 500 * t / duration) / SAMPLE_RATE) * np.sin(np.pi * t / duration)


def rise(duration=1.0, start_hz=300, end_hz=900):
    t = seconds(duration)
    return np.sin(2 * np.pi * np.cumsum(start_hz + (end_hz - start_hz) * t / duration) / SAMPLE_RATE) * np.minimum(1, (duration - t) / 0.1) * 0.5


def siren(duration=1.4):
    t = seconds(duration)
    freq = np.where((t * 4).astype(int) % 2 == 0, 960, 720)
    return np.sin(2 * np.pi * np.cumsum(freq) / SAMPLE_RATE) * 0.5 * np.minimum(1, (duration - t) / 0.2)


def sparkle(duration=0.9):
    return np.concatenate([pop(f, f * 1.01, duration / 6) * 0.6 for f in (1047, 1319, 1568, 2093, 1568, 2093)])


def party(duration=0.8):
    return np.concatenate([pop(f, f * 1.02, duration / 3) * 0.8 for f in (784, 988, 1319)])


def drone(duration=3.0, pitch=55):
    t = seconds(duration)
    x = np.sin(2 * np.pi * pitch * t) + 0.6 * np.sin(2 * np.pi * pitch * 1.06 * t) + 0.3 * np.sin(2 * np.pi * pitch * 2.9 * t)
    return x * np.minimum(1, np.minimum(t / 0.6, (duration - t) / 0.8)) * 0.5


def shimmer(duration=2.5):
    t = seconds(duration)
    x = sum(np.sin(2 * np.pi * f * t + k) * (0.5 + 0.5 * np.sin(t * (3 + k))) for k, f in enumerate((1568, 2093, 2637, 3136)))
    return x * np.minimum(1, (duration - t) / duration) * np.minimum(1, t / 0.3) * 0.25


def snip():
    t = seconds(0.07)
    click = np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 70) + RNG.standard_normal(len(t)) * np.exp(-t * 120) * 0.6
    return np.concatenate([click, np.zeros(int(0.05 * SAMPLE_RATE)), click])


def lock():
    return np.concatenate([pop(2600, 2400, 0.03), np.zeros(int(0.04 * SAMPLE_RATE)), thump(0.25) * 0.6])


def portal(duration=2.5, pitch=110):
    t = seconds(duration)
    wobble = (1 + 0.6 * t / duration) * (1 + 0.01 * np.sin(2 * np.pi * 6 * t))
    x = sum(np.sin(2 * np.pi * np.cumsum(f * wobble) / SAMPLE_RATE) for f in (pitch, pitch * 1.5, pitch * 2, pitch * 3))
    return x * np.minimum(1, np.minimum(t / 0.4, (duration - t) / 0.8)) * 0.25


def heartbeat(beats=8, interval=0.38):
    gap = np.zeros(int(0.06 * SAMPLE_RATE)), np.zeros(int(max(0.0, interval - 0.06) * SAMPLE_RATE))
    one = np.concatenate([thump(0.12), gap[0], thump(0.12) * 0.7, gap[1]])
    return np.concatenate([one] * beats)


def chapter(duration=1.8):
    """A vinheta de capítulo: uma batida grave e um acorde que cresce."""
    boom = np.concatenate([thump(0.6), np.zeros(int(max(0.0, duration - 0.6) * SAMPLE_RATE))])
    return boom * 0.9 + portal(duration, 82) * 1.2


def victory(duration=1.4):
    """A fanfarra de vitória: um arpejo maior subindo e a nota final segurada."""
    notes = np.concatenate([pop(f, f * 1.01, 0.14) * 0.8 for f in (523, 659, 784, 1047)])
    t = seconds(max(0.2, duration - 0.56))
    hold = sum(np.sin(2 * np.pi * f * t) for f in (523, 659, 784, 1047)) * np.exp(-t * 2.5) * 0.25
    return np.concatenate([notes, hold])


LIBRARY = {f.__name__: f for f in (whoosh, pop, thump, hiss, glub, rise, siren, sparkle, party, drone, shimmer, snip, lock, portal,
                                   heartbeat, chapter, victory)}


def load_amostra(path):
    """Lê um .wav da pessoa (risada, aplausos, vinheta) e converte pra mono em SAMPLE_RATE. Sem libs externas: só o `wave` da
    biblioteca padrão, 16 bits (converta outro formato com o ffmpeg antes), reamostrado por interpolação linear se a taxa for outra."""
    with wave.open(str(path), "rb") as handle:
        channels, width, rate, count = handle.getnchannels(), handle.getsampwidth(), handle.getframerate(), handle.getnframes()
        raw = handle.readframes(count)
    if width != 2:
        sys.exit(f"'{path}' precisa ser .wav de 16 bits (esse é de {width * 8}). Converta: ffmpeg -i entrada -ar {SAMPLE_RATE} -ac 1 -sample_fmt s16 saida.wav")
    data = np.frombuffer(raw, dtype="<i2").astype(np.float64) / 32768.0
    if channels > 1:
        data = data.reshape(-1, channels).mean(axis=1)
    if rate != SAMPLE_RATE and len(data):
        old_t = np.arange(len(data)) / rate
        new_t = np.arange(int(len(data) * SAMPLE_RATE / rate)) / SAMPLE_RATE
        data = np.interp(new_t, old_t, data)
    return data


# ---------- montar as faixas ----------
def place(track, sound, at, volume):
    start = max(0, int(at * SAMPLE_RATE))
    piece = sound[: max(0, len(track) - start)] * volume
    track[start:start + len(piece)] += piece


def read_plan(scene):
    plan_file = (Path(scene) / "js" / "plano.js").resolve()
    result = subprocess.run(["node", "--no-warnings", "--input-type=module", "-e", EXTRACT], capture_output=True, text=True,
                            env={**os.environ, "PLANO_URL": plan_file.as_uri()})
    if result.returncode:
        sys.exit(f"não consegui ler o plano.js pelo Node:\n{result.stderr[-1000:]}")
    return json.loads(result.stdout)


def effects_track(plan, settings, duration, folder=None):
    track = np.zeros(int((duration + 1) * SAMPLE_RATE))
    for move in plan["moves"]:
        if move["kind"] == "fly":
            place(track, whoosh(1.1), move["at"] - 0.6, settings["whoosh"]["fly"])
        elif move["kind"] == "approach":
            place(track, whoosh(), move["at"] - 0.3, settings["whoosh"]["approach"])
    for at in plan["labels"]:
        place(track, pop(), at + 0.07, settings["pop"]["label"])
    for at in plan["cards"]:
        place(track, pop(1200, 600), at, settings["pop"]["card"])
    for event in plan["sounds"]:
        if event["sound"] == "amostra":
            path = (folder or Path.cwd()) / event["arquivo"]
            if not path.exists():
                sys.exit(f"amostra '{event['arquivo']}' não existe em {folder or Path.cwd()}. Grave ou baixe (com licença) e ponha lá.")
            place(track, load_amostra(path), event["at"], event.get("volume", 0.6))
            continue
        if event["sound"] not in LIBRARY:
            sys.exit(f"o som '{event['sound']}' não existe. Sons: {', '.join(LIBRARY)}, amostra")
        place(track, LIBRARY[event["sound"]](**event.get("options", {})), event["at"], event.get("volume", 0.4))
    return track


def music_track(music, duration):
    """Acordes flutuantes com tremolo e pulso no baixo, um bloco por acorde, com entrada e saída suaves."""
    track = np.zeros(int((duration + 1) * SAMPLE_RATE))
    if not music:
        return track
    block = music["block_seconds"]
    t = seconds(block)
    envelope = np.minimum(1, np.minimum(t / 0.5, (block - t) / 0.5)) * (0.8 + 0.2 * np.sin(2 * np.pi * 5 * t))
    pulse = 0.6 + 0.4 * (np.sin(2 * np.pi * 4 * t) > 0)
    for k in range(int(duration / block) + 1):
        notes = music["chords"][k % len(music["chords"])]
        sound = sum(np.sin(2 * np.pi * f * t + 0.6 * np.sin(2 * np.pi * 0.4 * t)) + 0.3 * np.sin(4 * np.pi * f * t) for f in notes) * envelope
        sound += np.sin(np.pi * notes[0] * t) * envelope * pulse * 0.8
        place(track, sound, k * block, 1.0)
    clock = np.arange(len(track)) / SAMPLE_RATE
    return track * np.minimum(1, np.minimum(clock / 1.5, (duration + 1 - clock) / 2.0))


def save(path, audio):
    peak = max(1e-9, np.abs(audio).max())
    data = (np.clip(audio / peak * 0.9, -1, 1) * 32767).astype("<i2")
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(SAMPLE_RATE)
        handle.writeframes(data.tobytes())


def plan_from_json(path):
    """A lista de eventos sem plano.js (motor Blender): {"moves": [{kind, at}], "labels": [at], "cards": [at], "sounds": [...]}"""
    data = read_json(path)
    return {key: data.get(key, []) for key in ("moves", "labels", "cards", "sounds")}


def style_of(scene, name):
    if scene:
        text = (scene / "js" / "estilo.js").read_text(encoding="utf-8")
        return json.loads(text[text.index("{"):text.rstrip().rstrip(";").rindex("}") + 1])
    marker = Path(".estilo")
    return load_style(name or (marker.read_text().strip() if marker.exists() else "realista-corpo"))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("cena", nargs="?", help="a pasta cena/ do motor web (lê cena/js/plano.js)")
    parser.add_argument("--plano", help="no motor Blender: som/plano-sons.json com os eventos")
    parser.add_argument("--estilo", help="com --plano: o estilo (padrão: o do .estilo da pasta)")
    args = parser.parse_args()
    if not args.cena and not args.plano:
        sys.exit("passe a pasta cena (motor web) ou --plano som/plano-sons.json (motor Blender)")
    scene = Path(args.cena) if args.cena else None
    folder = scene.resolve().parent if scene else Path.cwd()
    style = style_of(scene, args.estilo)
    timing = read_json(folder / "voz" / "tempos.json")
    duration = timing["duration"] + TAIL_SECONDS
    if args.plano:
        plan = plan_from_json(args.plano)
    else:
        require("node")
        plan = read_plan(scene)
    save(folder / "som" / "efeitos.wav", effects_track(plan, style["sound"], duration, folder))
    save(folder / "som" / "musica.wav", music_track(style["sound"].get("music"), duration))
    print(f"{len(plan['moves'])} movimentos de câmera, {len(plan['labels']) + len(plan['cards'])} pops, "
          f"{len(plan['sounds'])} sons da história; {duration:.1f} s em {folder / 'som'}/")


if __name__ == "__main__":
    main()
