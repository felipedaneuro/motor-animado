"""Decupa um vídeo de referência inteiro, só com número, para criar um estilo novo (depois: novo_estilo.py).

Uso:
  ferramentas/py decupar.py <link ou arquivo> --nome <estilo> [--ate 15] [--cookies chrome]

Grava em decupagem/<estilo>/ (cada etapa fica guardada; rodar de novo pula o que já foi feito, --refazer refaz):
  1. referencia/      o vídeo (cortado em --ate segundos), o fps real e os números do post
  2. fala.json        cada palavra com o tempo; palavras por minuto, pausas, o gancho dos 3 primeiros segundos
  3. camera/          cortes, movimentos, % parada, o jeito de cada movimento e a curva da câmera
  4. tomadas/         início, meio e fim de cada tomada, paleta, luz e o degradê do fundo
  5. visao.jsonl      o Vision da Apple em 6 quadros por segundo: textos, foco, pessoas e rostos
  6. legenda          palavras por vez, posição, tamanho, cores, destaque, sincronia com a voz, outros textos
  7. som              LUFS, música por baixo, efeitos e se caem nos cortes e nos movimentos
  8. folhas/          historia (2/s), ritmo (6/s) e cada corte e movimento (todos os quadros)
No fim: decupagem.json (tudo) e decupagem.md (o resumo, com o segundo de cada coisa e as partes [OLHAR]).
Nada sai do Mac: a transcrição e o Vision rodam aqui.
"""
import argparse
import json
import shutil
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import analise_legenda
import analise_som
import analise_tomadas
from comum import SKILL, TOOLS, has_audio, media_duration, phrases_from_words, read_json, require, run, write_json
from decupagem_relatorio import write_markdown
from transcrever import mono_16k, transcribe

VISION_FPS = 6


def stage(folder, name, redo):
    """Uma etapa já feita (o arquivo existe) é pulada, a não ser com --refazer."""
    path = folder / name
    return None if redo or not path.exists() else path


def obtain_video(source, folder, seconds, cookies):
    """O vídeo baixado fica guardado; o ref.mp4 é recortado de novo quando o --ate muda (ou com --refazer)."""
    target, marker = folder / "referencia" / "ref.mp4", folder / "referencia" / "ate.txt"
    wanted = str(seconds or "inteiro")
    if target.exists() and marker.exists() and marker.read_text().strip() == wanted:
        return target
    target.parent.mkdir(parents=True, exist_ok=True)
    downloaded = [p for p in target.parent.glob("*.mp4") if p.name != "ref.mp4"]
    if Path(source).exists():
        original = Path(source)
    elif downloaded:
        original = downloaded[0]
    else:
        command = [sys.executable, TOOLS / "baixar.py", source, "--pasta", target.parent] + (["--cookies", cookies] if cookies else [])
        run(command)
        original = next(p for p in target.parent.glob("*.mp4") if p.name != "ref.mp4")
    cut = ["-t", str(seconds)] if seconds else []
    run(["ffmpeg", "-v", "error", "-y", "-i", original, *cut, "-c:v", "libx264", "-crf", "16", "-c:a", "aac", "-b:a", "192k", target])
    marker.write_text(wanted)
    return target


def speech(video, folder, redo):
    done = stage(folder, "fala.json", redo)
    if done:
        return read_json(done)
    words = []
    if has_audio(video):                                        # vídeo mudo: sem fala, o resto da decupagem segue
        with tempfile.TemporaryDirectory() as tmp:
            words = transcribe(mono_16k(video, tmp), None)
    data = {"duration": round(media_duration(video), 2), "phrases": phrases_from_words(words)}
    write_json(folder / "fala.json", data)
    return data


def camera_stage(video, folder, redo):
    done = stage(folder, "camera/ref.json", redo)
    if done:
        return read_json(done)["summary"]
    run([sys.executable, TOOLS / "camera.py", video, "--saida", folder / "camera"])
    return read_json(folder / "camera" / "ref.json")["summary"]


def vision_binary():
    source, binary = TOOLS / "visao.swift", SKILL / ".bin" / "visao"
    if not binary.exists() or binary.stat().st_mtime < source.stat().st_mtime:
        binary.parent.mkdir(exist_ok=True)
        print("compilando o leitor do Vision (só na primeira vez)...")
        run(["swiftc", "-O", source, "-o", binary])
    return binary


def vision_stage(video, folder, redo):
    done = stage(folder, "visao.jsonl", redo)
    if not done:
        frames = folder / "quadros6"
        shutil.rmtree(frames, ignore_errors=True)
        frames.mkdir(parents=True)
        run(["ffmpeg", "-v", "error", "-i", video, "-vf", f"fps={VISION_FPS},scale=540:-2", frames / "q%05d.png"])
        files = sorted(frames.glob("q*.png"))
        lines = []
        for start in range(0, len(files), 200):
            lines += run([vision_binary(), *files[start:start + 200]]).stdout.strip().splitlines()
        (folder / "visao.jsonl").write_text("\n".join(lines) + "\n", encoding="utf-8")
    rows = [json.loads(line) for line in (folder / "visao.jsonl").read_text().splitlines() if line.strip()]
    for row in rows:
        row["t"] = round((int(Path(row["file"]).stem[1:]) - 1) / VISION_FPS, 3)
    return [r for r in rows if "error" not in r]


def sheets(video, folder, camera_summary, redo):
    target = folder / "folhas"
    if target.exists() and not redo:
        return
    shutil.rmtree(target, ignore_errors=True)
    tool = [sys.executable, TOOLS / "folhas.py", video]
    run(tool + ["--por-segundo", "2", "--saida", target / "historia"])
    run(tool + ["--por-segundo", "6", "--saida", target / "ritmo"])
    events = [("corte", c) for c in camera_summary["cuts"]] + [("movimento", m["t"]) for m in camera_summary["moves"]]
    for kind, t in events[:16]:
        run(tool + ["--por-segundo", "30", "--de", str(max(0, t - 0.3)), "--ate", str(t + 0.7), "--saida", target / f"{kind}-{t:05.2f}s"])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("fonte", help="o link do vídeo ou um arquivo .mp4")
    parser.add_argument("--nome", required=True, help="o nome do estilo novo (ex.: palito-ferrovia)")
    parser.add_argument("--ate", type=float, default=0, help="só os primeiros N segundos (comece com 15)")
    parser.add_argument("--cookies", default="")
    parser.add_argument("--pasta", default="decupagem")
    parser.add_argument("--refazer", action="store_true")
    args = parser.parse_args()
    require("ffmpeg", "yt-dlp", "swiftc")
    folder = Path(args.pasta) / args.nome
    video = obtain_video(args.fonte, folder, args.ate, args.cookies)
    duration = media_duration(video)
    print(f"1/8 referência: {video} ({duration:.1f} s)")
    talk = speech(video, folder, args.refazer)
    words = [w for p in talk["phrases"] for w in p["words"]]
    print(f"2/8 fala: {len(words)} palavras")
    cam = camera_stage(video, folder, args.refazer)
    print(f"3/8 câmera: {len(cam['cuts'])} cortes, {len(cam['moves'])} movimentos, jeito {cam['dominant_profile']}")
    shots = analise_tomadas.describe_shots(video, cam["cuts"], duration, folder / "tomadas")
    print(f"4/8 tomadas: {len(shots)}")
    vision = vision_stage(video, folder, args.refazer)
    shots = analise_tomadas.framing(vision, shots)
    print(f"5/8 Vision: {len(vision)} quadros lidos")
    text = analise_legenda.analyze_text(vision, words)
    print(f"6/8 legenda: {text['captions']['words_per_caption'] if text['captions'] else 'nenhuma'} palavra(s) por vez")
    if has_audio(video):
        sound = analise_som.analyze_sound(video, words, duration, cam["cuts"], cam["moves"])
        print(f"7/8 som: {sound['loudness']['lufs']} LUFS, {sound['speech']['words_per_minute']} palavras por minuto")
    else:
        sound = {"loudness": {"lufs": None}, "speech": {"words_per_minute": 0}, "music": None, "effects": None, "silent": True}
        print("7/8 som: a referência é muda [OLHAR: som e voz vêm do roteiro e da receita]")
    sheets(video, folder, cam, args.refazer)
    print("8/8 folhas prontas")
    info = next((read_json(p) for p in (folder / "referencia").glob("*.info.json")), {})
    result = {"name": args.nome, "source": args.fonte, "duration": round(duration, 2), "fps": cam["fps"],
              "post": {k: info.get(k) for k in ("view_count", "like_count", "comment_count", "uploader", "title")},
              "speech": talk, "camera": cam, "shots": shots, "palette": analise_tomadas.overall_palette(shots),
              "text": text, "sound": sound}
    write_json(folder / "decupagem.json", result)
    write_markdown(folder / "decupagem.md", result)
    print(f"pronto: {folder}/decupagem.md (abra as folhas e complete as partes [OLHAR])")


if __name__ == "__main__":
    main()
