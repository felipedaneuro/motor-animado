"""Mapa de cenas: uma imagem do meio de cada frase, numa grade com o número e o começo da frase, antes do render.
É onde aparecem quase todos os defeitos: personagem fora do quadro, card tampando, câmera perto demais, peça afundando.

Uso:
  ferramentas/py mapa.py cena voz/tempos.json mapa
  ferramentas/py mapa.py cena voz/tempos.json mapa --referencia referencia/<id>.mp4 --tempos-ref transcricoes/<id>.json
  ferramentas/py mapa.py cena voz/tempos.json mapa --instantes 1.5,3.2,8         (só esses instantes)

Com --referencia, cada frase ganha ao lado o quadro da referência no meio da frase equivalente (mesma ordem).
Grava mapa/fNN.png e mapa/mapa.jpg. Abra o mapa.jpg e olhe tudo antes do render.
As imagens não saem do Mac: a análise automática do HyperFrames (Gemini) fica desligada.
"""
import argparse
import shutil
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import BOLD_FONT, HYPERFRAMES, read_json, run

TILE_W, TILE_H, CAPTION_H = 216, 384, 40


def snapshot_name(seconds):   # o snapshot grava at-<segundos>s.png, sem zeros no fim
    return f"at-{('%.2f' % seconds).rstrip('0').rstrip('.')}s.png"


def take_snapshots(scene, instants, folder):
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp) / "cena"
        shutil.copytree(scene, work, ignore=shutil.ignore_patterns("renders", ".hyperframes"))
        run(HYPERFRAMES + ["snapshot", work, "--at", ",".join(f"{t:.2f}" for t in instants), "--no-end", "--keep",
                           "--describe", "false", "--timeout", "20000", "-o", folder])


def reference_frames(video, transcript, count, folder):
    frames = []
    for i, phrase in enumerate(read_json(transcript)["phrases"][:count]):
        target = folder / f"ref-{i + 1:02d}.png"
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{(phrase['start'] + phrase['end']) / 2:.2f}", "-i", video, "-frames:v", "1", target])
        frames.append(target)
    return frames


def build_grid(items, columns, out):
    """items: [(rótulo, texto, [imagens])]. Cada item ocupa uma célula; com referência, as duas imagens lado a lado."""
    per_item = max(len(images) for _, _, images in items)
    cell_w = TILE_W * per_item + 6
    rows = (len(items) + columns - 1) // columns
    grid = Image.new("RGB", (columns * cell_w, rows * (TILE_H + CAPTION_H)), "black")
    draw = ImageDraw.Draw(grid)
    font = ImageFont.truetype(BOLD_FONT, 15) if Path(BOLD_FONT).exists() else ImageFont.load_default()
    for i, (label, text, images) in enumerate(items):
        x, y = (i % columns) * cell_w, (i // columns) * (TILE_H + CAPTION_H)
        for k, image in enumerate(images):
            grid.paste(Image.open(image).convert("RGB").resize((TILE_W, TILE_H)), (x + k * TILE_W, y))
        draw.text((x + 4, y + TILE_H + 2), label, fill="yellow", font=font)
        draw.text((x + 4, y + TILE_H + 20), text[:28 * per_item], fill="white", font=font)
    grid.save(out, quality=88)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("cena")
    parser.add_argument("tempos")
    parser.add_argument("saida")
    parser.add_argument("--referencia")
    parser.add_argument("--tempos-ref")
    parser.add_argument("--instantes", help="instantes em segundos, separados por vírgula, no lugar do meio das frases")
    parser.add_argument("--colunas", type=int, default=6)
    args = parser.parse_args()
    phrases = read_json(args.tempos)["phrases"]
    if args.instantes:
        instants = [float(x) for x in args.instantes.split(",")]
        texts = [""] * len(instants)
    else:
        instants = [round((p["start"] + p["end"]) / 2, 2) for p in phrases]
        texts = [p["text"] for p in phrases]
    out = Path(args.saida)
    shutil.rmtree(out, ignore_errors=True)
    (out / "fotos").mkdir(parents=True)
    take_snapshots(Path(args.cena), instants, (out / "fotos").resolve())
    refs = reference_frames(args.referencia, args.tempos_ref, len(instants), out / "fotos") if args.referencia and args.tempos_ref else []
    items = []
    for i, (t, text) in enumerate(zip(instants, texts)):
        shot = out / "fotos" / snapshot_name(t)
        if not shot.exists():
            print(f"faltou a imagem do instante {t} ({shot.name})")
            continue
        shutil.copy(shot, out / f"f{i + 1:02d}.png")
        items.append((f"{i + 1}. {t:.1f}s", text, [shot] + ([refs[i]] if i < len(refs) else [])))
    build_grid(items, args.colunas if not refs else max(2, args.colunas // 2), out / "mapa.jpg")
    print(f"{out / 'mapa.jpg'}: {len(items)} imagens" + (" com a referência ao lado" if refs else ""))


if __name__ == "__main__":
    main()
