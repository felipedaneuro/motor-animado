"""Junta as palavras do roteiro (a grafia certa, que vai para a legenda) com o tempo que o Whisper ouviu na voz.

Uso: ferramentas/py alinhar.py roteiro.txt voz/voz.json voz/voz.wav voz/tempos.json

Palavras que o Whisper escreveu diferente (número por extenso, "pra", siglas) ficam sem par e recebem o tempo
repartido entre as vizinhas. Isso é normal; muitas sem par num trecho indicam que a voz não leu o roteiro certo.
"""
import argparse
import sys
from difflib import SequenceMatcher
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import media_duration, normalize_word, read_json, script_lines, write_json


def heard_words(transcript):
    return [w for phrase in transcript["phrases"] for w in phrase["words"]]


def match_times(script_words, heard):
    times = [None] * len(script_words)
    matcher = SequenceMatcher(None, [normalize_word(w) for _, w in script_words],
                              [normalize_word(h["word"]) for h in heard], autojunk=False)
    for a, b, size in matcher.get_matching_blocks():
        for k in range(size):
            times[a + k] = (heard[b + k]["start"], heard[b + k]["end"])
    return times


def fill_gaps(times, duration):
    """Cada trecho sem par recebe o tempo entre a palavra com par de antes e a de depois, em partes iguais."""
    k = 0
    while k < len(times):
        if times[k] is not None:
            k += 1
            continue
        j = k
        while j < len(times) and times[j] is None:
            j += 1
        start = times[k - 1][1] if k else 0.0
        end = times[j][0] if j < len(times) else min(duration, start + 0.35 * (j - k))
        step = max(0.0, end - start) / (j - k)
        for q in range(k, j):
            times[q] = (round(start + step * (q - k), 3), round(start + step * (q - k + 1), 3))
        k = j
    return times


def align(lines, transcript, duration):
    script_words = [(i, w) for i, line in enumerate(lines) for w in line.split()]
    times = match_times(script_words, heard_words(transcript))
    unmatched = [w for (_, w), t in zip(script_words, times) if t is None]
    times = fill_gaps(times, duration)
    phrases = []
    for i, line in enumerate(lines):
        words = [{"word": w, "start": t[0], "end": t[1]} for (p, w), t in zip(script_words, times) if p == i]
        phrases.append({"text": line, "start": words[0]["start"], "end": words[-1]["end"], "words": words})
    return {"duration": round(duration, 2), "phrases": phrases}, unmatched


def main():
    parser = argparse.ArgumentParser()
    for name in ("roteiro", "ouvido", "voz", "saida"):
        parser.add_argument(name)
    args = parser.parse_args()
    data, unmatched = align(script_lines(args.roteiro), read_json(args.ouvido), media_duration(args.voz))
    phrases = data["phrases"]
    if any(a["start"] > b["start"] for a, b in zip(phrases, phrases[1:])):
        sys.exit("tempos fora de ordem: a voz não segue o roteiro (confira voz/texto-voz.txt)")
    write_json(args.saida, data)
    share = len(unmatched) / max(1, sum(len(p["words"]) for p in phrases))
    print(f"{len(phrases)} frases, {data['duration']:.1f} s; sem par no Whisper: {len(unmatched)} ({share:.0%}) {' '.join(unmatched)}")
    if share > 0.15:
        print("atenção: mais de 15% sem par. Ouça a voz: ela pode ter pulado ou trocado frases.")


if __name__ == "__main__":
    main()
