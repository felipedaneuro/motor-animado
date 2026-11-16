"""Queima a legenda no vídeo (libass, do ffmpeg-full), no estilo da legenda do estilo.json: N palavras por vez,
a altura, o tamanho, a cor, o contorno, as palavras de destaque e o pulinho de entrada. Serve para os vídeos do
motor Blender (que não têm a camada de textos do motor web) e para qualquer vídeo pronto.

Uso:
  ferramentas/py legendar.py video.mp4 voz/tempos.json --estilo realista-corpo --saida video-legendado.mp4
  ... --destaques "cérebro,neurônio"      palavras que saem na cor de destaque
  ... --fonte "Arial Black"               a fonte instalada no Mac (padrão: captions.burn_font do estilo, ou Arial Black)
Precisa do ffmpeg-full (brew install ffmpeg-full); o diagnostico.py confere.
"""
import argparse
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import load_style, log_step, normalize_word, read_json, run

HEADER = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Legenda,{font},{size},{color},{color},{stroke},&H80000000,1,0,0,0,100,100,1,0,1,{outline},4,8,60,60,{top},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def ass_color(hex_value):
    r, g, b = (hex_value[i:i + 2] for i in (1, 3, 5))
    return f"&H00{b}{g}{r}".upper()


def ass_time(seconds):
    hours, rest = divmod(max(0.0, seconds), 3600)
    minutes, secs = divmod(rest, 60)
    return f"{int(hours)}:{int(minutes):02d}:{secs:05.2f}"


def chunks(timing, per_caption):
    """As palavras em blocos de N, sem atravessar frases; cada bloco fica até o próximo começar."""
    out = []
    for phrase in timing["phrases"]:
        for i in range(0, len(phrase["words"]), per_caption):
            out.append(phrase["words"][i:i + per_caption])
    return [(c, c[0]["start"], out[k + 1][0]["start"] if k + 1 < len(out) and out[k + 1][0]["start"] - c[-1]["end"] < 0.6
             else c[-1]["end"] + 0.35) for k, c in enumerate(out)]


def caption_text(words, captions, highlights):
    pieces = []
    for w in words:
        text = w["word"].rstrip(".,!?;:…\"")
        text = text.upper() if captions.get("uppercase") else text
        pieces.append(f"{{\\c{ass_color(captions['highlight'])}}}{text}{{\\c{ass_color(captions['color'])}}}"
                      if normalize_word(w["word"]) in highlights else text)
    # o pulinho de entrada: começa 18% maior e assenta em 120 ms
    return "{\\fscx118\\fscy118\\t(0,120,\\fscx100\\fscy100)}" + " ".join(pieces)


def build_ass(timing, captions, highlights, font):
    lines = [HEADER.format(font=font, size=captions["font_px"], color=ass_color(captions["color"]),
                           stroke=ass_color(captions["stroke"]), outline=max(2, captions.get("stroke_px", 12) // 2),
                           top=captions["top_px"])]
    marked = {normalize_word(h) for h in highlights}
    for words, start, end in chunks(timing, captions.get("words_per_caption", 1)):
        lines.append(f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Legenda,,0,0,0,,{caption_text(words, captions, marked)}")
    return "\n".join(lines) + "\n"


def burn(video, timing_path, captions, highlights, font, output):
    with tempfile.TemporaryDirectory() as tmp:
        subtitles = Path(tmp) / "legenda.ass"
        subtitles.write_text(build_ass(read_json(timing_path), captions, highlights, font), encoding="utf-8")
        run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vf", f"subtitles={subtitles}", "-c:v", "libx264", "-preset", "slow",
             "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", output])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("video")
    parser.add_argument("tempos")
    parser.add_argument("--estilo", required=True)
    parser.add_argument("--saida", required=True)
    parser.add_argument("--destaques", default="")
    parser.add_argument("--fonte")
    args = parser.parse_args()
    if Path(args.saida).exists():
        sys.exit(f"{args.saida} já existe: use um nome novo")
    if "subtitles" not in run(["ffmpeg", "-hide_banner", "-filters"]).stdout:
        sys.exit("este ffmpeg não tem libass: brew install ffmpeg-full (rode ferramentas/diagnostico.py)")
    captions = load_style(args.estilo)["captions"]
    font = args.fonte or captions.get("burn_font", "Arial Black")
    burn(args.video, args.tempos, captions, [h for h in args.destaques.split(",") if h], font, args.saida)
    log_step(f"legenda queimada: {args.saida} (estilo {args.estilo}, fonte {font})")
    print(f"{args.saida}: legenda queimada ({captions.get('words_per_caption', 1)} palavra(s) por vez, fonte {font})")


if __name__ == "__main__":
    main()
