"""Transcreve áudio ou vídeo palavra por palavra, com o tempo de cada uma, no próprio Mac (mlx-whisper, na GPU).

Uso:
  ferramentas/py transcrever.py <arquivo ou pasta> [...] --saida transcricoes [--lingua pt]

Grava, para cada arquivo, <nome>.json no formato de tempos da skill (frases separadas pela pontuação) e <nome>.txt.
Na primeira vez baixa o modelo large-v3-turbo (uns 1,6 GB) e demora alguns minutos.
"""
import argparse
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import media_duration, phrases_from_words, require, run, write_json

MEDIA = {".mp4", ".mov", ".m4a", ".mp3", ".wav", ".webm", ".mkv", ".aac", ".flac", ".ogg", ".aiff"}
MODEL = "mlx-community/whisper-large-v3-turbo"


def mono_16k(source, folder):
    target = Path(folder) / (source.stem + ".wav")
    run(["ffmpeg", "-v", "error", "-y", "-i", source, "-vn", "-ac", "1", "-ar", "16000", target])
    return target


def transcribe(wav, language):
    try:
        import mlx_whisper
    except ImportError:
        sys.exit("falta o mlx-whisper no ambiente virtual (rode ferramentas/diagnostico.py)")
    result = mlx_whisper.transcribe(str(wav), path_or_hf_repo=MODEL, word_timestamps=True, language=language)
    return [{"word": w["word"].strip(), "start": round(w["start"], 3), "end": round(w["end"], 3)}
            for segment in result["segments"] for w in segment.get("words", []) if w["word"].strip()]


def collect(entries):
    files = []
    for entry in map(Path, entries):
        files += sorted(p for p in entry.iterdir() if p.suffix.lower() in MEDIA) if entry.is_dir() else [entry]
    return files


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("entradas", nargs="+")
    parser.add_argument("--saida", default="transcricoes")
    parser.add_argument("--lingua", default=None, help="pt, en, es... (vazio: descobre sozinho)")
    args = parser.parse_args()
    require("ffmpeg")
    files = collect(args.entradas)
    if not files:
        sys.exit("nenhum vídeo ou áudio encontrado")
    out = Path(args.saida)
    with tempfile.TemporaryDirectory() as tmp:
        for source in files:
            words = transcribe(mono_16k(source, tmp), args.lingua)
            data = {"duration": round(media_duration(source), 2), "phrases": phrases_from_words(words)}
            write_json(out / f"{source.stem}.json", data)
            (out / f"{source.stem}.txt").write_text(" ".join(w["word"] for w in words) + "\n", encoding="utf-8")
            print(f"{source.name}: {len(words)} palavras, {len(data['phrases'])} frases -> {out}/{source.stem}.json")


if __name__ == "__main__":
    main()
