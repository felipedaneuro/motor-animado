"""Troca frases da narração por regravações, cortando no silêncio mais próximo e igualando o volume.
Serve para mudar uma parte do roteiro sem pagar a voz inteira de novo.

Uso: ferramentas/py emendar.py voz/voz-original.wav voz/tempos-original.json voz/novas/ voz/voz.wav
Em voz/novas/ ficam fN.wav, com N contando de 1 (f1.wav troca a 1ª frase), gerados por voz.py --frases.
Depois: transcrever.py e alinhar.py de novo na voz nova, porque os tempos mudam.
"""
import argparse
import subprocess
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import SAMPLE_RATE, read_json

WINDOW = int(0.02 * SAMPLE_RATE)


def read_audio(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "s16le", "-ac", "1", "-ar", str(SAMPLE_RATE), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, "<i2").astype(np.float32) / 32768


def quietest_point(audio, start, end):
    """O meio da janela de 20 ms mais silenciosa entre start e end (segundos)."""
    a, b = max(0, int(start * SAMPLE_RATE)), min(len(audio), int(end * SAMPLE_RATE))
    if b - a <= WINDOW:
        return a
    step = WINDOW // 4
    energy = [np.sqrt(np.mean(audio[k:k + WINDOW] ** 2)) for k in range(a, b - WINDOW, step)]
    return a + int(np.argmin(energy)) * step + WINDOW // 2


def trim_silence(audio, threshold=0.01, margin=int(0.03 * SAMPLE_RATE)):
    alive = np.where(np.abs(audio) > threshold)[0]
    return audio[max(0, alive[0] - margin): alive[-1] + margin] if len(alive) else audio


def rms(audio):
    return float(np.sqrt(np.mean(audio ** 2))) or 1e-9


def splice(original, timing, replacements):
    pieces, cursor = [], 0
    for path in sorted(replacements, key=lambda p: int(p.stem[1:])):
        n = int(path.stem[1:])
        phrase = timing["phrases"][n - 1]
        start = quietest_point(original, phrase["start"] - 0.25, phrase["start"] + 0.03)
        end = quietest_point(original, phrase["end"] - 0.03, phrase["end"] + 0.25)
        if start < cursor:
            sys.exit(f"f{n}.wav começa antes do fim da frase anterior trocada")
        new = trim_silence(read_audio(path))
        new *= rms(trim_silence(original[start:end])) / rms(new)
        pieces += [original[cursor:start], new]
        cursor = end
        print(f"frase {n}: {(end - start) / SAMPLE_RATE:.2f} s -> {len(new) / SAMPLE_RATE:.2f} s")
    pieces.append(original[cursor:])
    return np.clip(np.concatenate(pieces), -1, 1)


def main():
    parser = argparse.ArgumentParser()
    for name in ("original", "tempos", "novas", "saida"):
        parser.add_argument(name)
    args = parser.parse_args()
    original = read_audio(args.original)
    replacements = list(Path(args.novas).glob("f*.wav"))
    if not replacements:
        sys.exit(f"nenhum fN.wav em {args.novas}")
    result = splice(original, read_json(args.tempos), replacements)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ac", "1", "-ar", str(SAMPLE_RATE), "-i", "-", args.saida],
                   input=(result * 32767).astype("<i2").tobytes(), check=True)
    print(f"{args.saida}: {len(original) / SAMPLE_RATE:.2f} s -> {len(result) / SAMPLE_RATE:.2f} s")


if __name__ == "__main__":
    main()
