"""Modo "a imagem manda": põe cada frase da nossa voz no segundo em que a frase equivalente começa na referência.
Serve para copiar o ritmo exato de uma referência (os cortes e as batidas caem no mesmo segundo).

Uso: ferramentas/py encaixar.py voz/voz.wav voz/tempos.json decupagem/<estilo>/fala.json voz/voz-encaixada.wav
Grava voz/voz-encaixada.wav e voz/voz-encaixada.json (os tempos novos, para o montar.py).

Cada frase vai para a janela da frase de mesmo número na referência. Se não couber, acelera até 12% (mais que isso
soa apressado); se ainda não couber, avisa qual frase encurtar. Frase que sobra no fim vai logo depois da anterior.
"""
import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import SAMPLE_RATE, read_json, write_json

MAX_SPEEDUP = 1.12
LEAD, TRAIL = 0.04, 0.10


def read_audio(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "s16le", "-ac", "1", "-ar", str(SAMPLE_RATE), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, "<i2").astype(np.float32) / 32768


def speed_up(audio, factor):
    if factor <= 1.0001:
        return audio
    with tempfile.TemporaryDirectory() as tmp:
        source, target = Path(tmp) / "a.raw", Path(tmp) / "b.raw"
        source.write_bytes((audio * 32767).astype("<i2").tobytes())
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ac", "1", "-ar", str(SAMPLE_RATE), "-i", source,
                        "-af", f"atempo={factor:.4f}", "-f", "s16le", target], check=True)
        return np.frombuffer(target.read_bytes(), "<i2").astype(np.float32) / 32768


def windows(reference, count):
    ref = reference["phrases"]
    starts = [p["start"] for p in ref]
    result = []
    for i in range(count):
        if i < len(ref):
            end = starts[i + 1] if i + 1 < len(ref) else ref[-1]["end"] + 0.6
            result.append((starts[i], end))
        else:
            result.append((None, None))
    return result


def fit_phrase(audio, phrase, window, cursor):
    """Corta a frase da nossa voz, acelera se precisar e devolve (pedaço, onde começa, fator, aviso)."""
    piece = audio[int(max(0, phrase["start"] - LEAD) * SAMPLE_RATE):int((phrase["end"] + TRAIL) * SAMPLE_RATE)]
    start, end = window
    if start is None:
        return piece, cursor + 0.25, 1.0, "sem frase equivalente na referência: entra logo depois da anterior"
    start = max(start, cursor)
    room = max(0.1, end - start)
    needed = len(piece) / SAMPLE_RATE / room
    factor = min(MAX_SPEEDUP, max(1.0, needed))
    warning = f"não cabe nem com +12% (precisa de {needed:.2f}x): encurte a frase" if needed > MAX_SPEEDUP else ""
    return speed_up(piece, factor), start, factor, warning


def shifted_words(phrase, start, factor):
    origin = phrase["start"] - LEAD
    move = lambda t: round(start + (t - origin) / factor, 3)
    words = [{"word": w["word"], "start": move(w["start"]), "end": move(w["end"])} for w in phrase["words"]]
    return {"text": phrase["text"], "start": words[0]["start"], "end": words[-1]["end"], "words": words}


def main():
    parser = argparse.ArgumentParser()
    for name in ("voz", "tempos", "referencia", "saida"):
        parser.add_argument(name)
    args = parser.parse_args()
    audio, timing, reference = read_audio(args.voz), read_json(args.tempos), read_json(args.referencia)
    if len(timing["phrases"]) != len(reference["phrases"]):
        print(f"atenção: o nosso tem {len(timing['phrases'])} frases e a referência {len(reference['phrases'])}")
    pieces, phrases, cursor = [], [], 0.0
    for i, (phrase, window) in enumerate(zip(timing["phrases"], windows(reference, len(timing["phrases"])))):
        piece, start, factor, warning = fit_phrase(audio, phrase, window, cursor)
        pieces.append((start, piece))
        phrases.append(shifted_words(phrase, start, factor))
        cursor = start + len(piece) / SAMPLE_RATE
        print(f"frase {i + 1}: em {start:.2f} s, {'+' + format((factor - 1) * 100, '.0f') + '%' if factor > 1 else 'sem acelerar'} {warning}")
    total = np.zeros(int((cursor + 0.6) * SAMPLE_RATE), dtype=np.float32)
    for start, piece in pieces:
        k = int(start * SAMPLE_RATE)
        total[k:k + len(piece)] += piece[: len(total) - k]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ac", "1", "-ar", str(SAMPLE_RATE), "-i", "-", args.saida],
                   input=(np.clip(total, -1, 1) * 32767).astype("<i2").tobytes(), check=True)
    write_json(Path(args.saida).with_suffix(".json"), {"duration": round(len(total) / SAMPLE_RATE, 2), "phrases": phrases})
    print(f"{args.saida} e {Path(args.saida).with_suffix('.json')}: use os dois no montar.py")


if __name__ == "__main__":
    main()
