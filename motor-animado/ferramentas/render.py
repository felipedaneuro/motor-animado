"""Renderiza a cena do motor web com o HyperFrames.

Uso:
  ferramentas/py render.py cena video-v1.mp4 --rascunho     1080x1920 a 30 qps, rápido, para conferir
  ferramentas/py render.py cena video-v1.mp4                final: o fps e a resolução do estilo (ex.: 4K a 60 qps)
Para ver só alguns instantes sem renderizar, use o mapa.py (imagens soltas) em vez do render.
Nunca escreve por cima de um vídeo que já existe: cada versão tem um nome novo (v1, v2...).
Rode em segundo plano no render final: 2:25 em 4K60 leva uns 10 a 15 minutos num Mac com chip M.
"""
import argparse
import json
import shutil
import sys
import tempfile
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import HYPERFRAMES, log_step, require, run


def style_of(scene):
    text = (scene / "js" / "estilo.js").read_text(encoding="utf-8")
    return json.loads(text[text.index("{"):text.rstrip().rstrip(";").rindex("}") + 1])


def quality_flags(args, style):
    if args.rascunho:
        return ["--fps", "30", "--quality", "draft"]
    fmt = style["format"]
    flags = ["--fps", str(fmt.get("fps_final", 60)), "--quality", "high"]
    return flags + (["--resolution", fmt["resolution_final"]] if fmt.get("resolution_final") else [])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("cena")
    parser.add_argument("saida")
    parser.add_argument("--rascunho", action="store_true")
    parser.add_argument("--workers", default="3")
    args = parser.parse_args()
    require("npx")
    output = Path(args.saida)
    if output.exists():
        sys.exit(f"{output} já existe: use um nome novo (v2, v3...) para não perder a versão anterior")
    scene = Path(args.cena)
    flags = quality_flags(args, style_of(scene))
    start = time.time()
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp) / "cena"
        shutil.copytree(scene, work, ignore=shutil.ignore_patterns("renders", ".hyperframes"))
        run(HYPERFRAMES + ["render", work, "-o", work / "out.mp4", "--workers", args.workers, "--quiet"] + flags)
        output.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(work / "out.mp4", output)
    minutes = (time.time() - start) / 60
    log_step(f"render {'rascunho' if args.rascunho else 'final'}: {output} em {minutes:.1f} min")
    print(f"{output} em {minutes:.1f} min")


if __name__ == "__main__":
    main()
