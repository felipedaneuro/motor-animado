"""Roda a cena do motor Blender (estilos realistas) na pasta do vídeo, sem abrir a janela do Blender.

Uso, na pasta do vídeo:
  ferramentas/py blender.py --estilo realista-corpo --still 1 --samples 16 --escala 25      um teste rápido
  ferramentas/py blender.py --still 1,150,300 --samples 40 --escala 75                      qualidade final: diz o tempo do vídeo
  ferramentas/py blender.py --anim                                                          os quadros em renders/quadros/
  ferramentas/py blender.py --anim --rascunho                                               rascunho rápido do movimento
  ferramentas/py blender.py --anim --quadros 1-150                                          um trecho (para dividir o trabalho)
  ... --enquadramento cabeca|braco|perna     troca o preset de enquadramento do estilo só neste vídeo
  ... --curva camera/ref-curva.json          a câmera medida na referência   ... --salvar   grava cena.blend

Lembra o estilo da primeira vez (.estilo). Ajustes só deste vídeo vão em estilo-ajustes.json (ex.: {"blender": {"hair": "medium"}}).
Depois: ferramentas/py finalizar.py renders/quadros --saida video-v1.mp4 --voz voz/voz.wav ...
"""
import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import ENGINES, deep_merge, load_style, log_step, read_json, style_folder

BLENDER = "/Applications/Blender.app/Contents/MacOS/Blender"


def merged_style(name, framing):
    style = load_style(name)
    if style["engine"] != "blender":
        sys.exit(f"o estilo {name} usa o motor {style['engine']}: use montar.py e render.py")
    if Path("estilo-ajustes.json").exists():
        style = deep_merge(style, read_json("estilo-ajustes.json"))
    if framing:
        presets = style["blender"].get("presets", {})
        if framing not in presets:
            sys.exit(f"enquadramento '{framing}' não existe no estilo: {', '.join(presets)}")
        style["blender"] = deep_merge(style["blender"], presets[framing])
    return style


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--estilo")
    parser.add_argument("--enquadramento")
    parser.add_argument("--still")
    parser.add_argument("--anim", action="store_true")
    parser.add_argument("--quadros")
    parser.add_argument("--samples", default="40")
    parser.add_argument("--escala", default="75")
    parser.add_argument("--segundos", default="10")
    parser.add_argument("--curva")
    parser.add_argument("--saida", default="teste")
    parser.add_argument("--salvar", action="store_true")
    parser.add_argument("--rascunho", action="store_true", help="16 amostras, 25%% e redutor de ruído: para ver o movimento")
    return parser.parse_args()


def main():
    args = parse_args()
    if not Path(BLENDER).exists():
        sys.exit("falta o Blender 5: brew install --cask blender (rode ferramentas/diagnostico.py --blender)")
    marker = Path(".estilo")
    name = args.estilo or (marker.read_text().strip() if marker.exists() else None)
    if not name:
        sys.exit("faltou --estilo na primeira vez (ex.: --estilo realista-corpo)")
    marker.write_text(name)
    style = merged_style(name, args.enquadramento)
    if args.rascunho:   # para ver o movimento rápido: pouca amostra, resolução baixa e o redutor de ruído ligado
        args.samples, args.escala = "16", "25"
        style["blender"]["denoise"] = True
    measured = style_folder(name) / "referencia-curva.json"
    if not args.curva and measured.exists():   # a câmera medida na referência do estilo, se houver
        args.curva = str(measured)
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as handle:
        json.dump(style, handle, ensure_ascii=False)
    passthrough = [f"--{k}" for k in ("anim", "salvar") if getattr(args, k)]
    for key in ("still", "quadros", "samples", "escala", "segundos", "curva", "saida"):
        if getattr(args, key):
            passthrough += [f"--{key}", str(getattr(args, key))]
    command = [BLENDER, "-b", "-P", str(ENGINES / "blender" / "cena.py"), "--", "--estilo", handle.name, "--pasta", str(Path.cwd())] + passthrough
    result = subprocess.run(command, capture_output=True, text=True)
    lines = [l for l in (result.stdout + result.stderr).splitlines() if l.startswith(("PASSO", "QUADRO", "QUADROS", "SALVO"))]
    print("\n".join(lines))
    if result.returncode or not any(l.startswith(("QUADRO", "SALVO")) for l in lines):
        sys.exit("o Blender falhou:\n" + "\n".join((result.stdout + result.stderr).splitlines()[-25:]))
    log_step(f"blender ({name}): {' '.join(passthrough)}")


if __name__ == "__main__":
    main()
