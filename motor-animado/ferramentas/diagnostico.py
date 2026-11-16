"""Confere se o Mac tem tudo o que a skill usa e diz como resolver o que faltar. Não instala nada.

Uso: ferramentas/py diagnostico.py [--blender]
  --blender   confere também o motor Blender (Blender 5+ e MPFB), usado pelos estilos realistas
"""
import argparse
import importlib
import os
import platform
import re
import shutil
import subprocess
import sys
from pathlib import Path

BLENDER = "/Applications/Blender.app/Contents/MacOS/Blender"
FFMPEG_FULL = "/opt/homebrew/opt/ffmpeg-full/bin"
if Path(FFMPEG_FULL).exists():   # o mesmo ffmpeg que as ferramentas usam (comum.py)
    os.environ["PATH"] = f"{FFMPEG_FULL}:{os.environ.get('PATH', '')}"
PACKAGES = {"cv2": "opencv-python", "numpy": "numpy", "PIL": "Pillow", "mlx_whisper": "mlx-whisper", "matplotlib": "matplotlib"}


def version_of(command, pattern=r"(\d+)\.(\d+)"):
    try:
        output = subprocess.run(command, capture_output=True, text=True, timeout=30).stdout
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return None
    found = re.search(pattern, output)
    return tuple(int(x) for x in found.groups()) if found else None


def check_system():
    rows = [("Mac com chip Apple", platform.machine() == "arm64" and sys.platform == "darwin", "esta skill é só para Apple Silicon")]
    rows.append(("Python 3.10+", sys.version_info >= (3, 10), "brew install python"))
    for program in ("ffmpeg", "ffprobe", "yt-dlp"):
        rows.append((program, bool(shutil.which(program)), f"brew install {'ffmpeg' if program.startswith('ff') else program}"))
    full = "/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"
    filters = subprocess.run([full, "-hide_banner", "-filters"], capture_output=True, text=True).stdout if Path(full).exists() else ""
    rows.append(("ffmpeg-full (libass: legenda queimada, drawtext)", "subtitles" in filters and "drawtext" in filters, "brew install ffmpeg-full"))
    node = version_of(["node", "--version"])
    rows.append(("Node.js 22+ (HyperFrames)", bool(node and node[0] >= 22), "brew install node"))
    rows.append(("Swift (Vision da Apple, decupagem)", bool(shutil.which("swift")), "xcode-select --install"))
    voices = subprocess.run(["say", "-v", "?"], capture_output=True, text=True).stdout
    rows.append(("voz de teste pt-BR (say)", "pt_BR" in voices, "Ajustes > Acessibilidade > Conteúdo Falado > Vozes"))
    return rows


def check_packages():
    rows = []
    for module, package in PACKAGES.items():
        try:
            importlib.import_module(module)
            rows.append((package, True, ""))
        except ImportError:
            rows.append((package, False, f"{sys.executable} -m pip install {package}"))
    return rows


def check_blender():
    exists = Path(BLENDER).exists()
    version = version_of([BLENDER, "--version"]) if exists else None
    rows = [("Blender 5+", bool(version and version[0] >= 5), "brew install --cask blender")]
    if exists:
        listing = subprocess.run([BLENDER, "-b", "--python-expr",
                                  "import addon_utils;print('MPFB' if any('mpfb' in m.__name__ for m in addon_utils.modules()) else '')"],
                                 capture_output=True, text=True, timeout=120).stdout
        rows.append(("MPFB (corpo de código aberto)", "MPFB" in listing, f"{BLENDER} -c extension install mpfb --enable"))
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--blender", action="store_true")
    args = parser.parse_args()
    rows = check_system() + check_packages() + (check_blender() if args.blender else [])
    key = Path(".env").exists() and "ELEVENLABS_API_KEY" in Path(".env").read_text()
    rows.append(("chave da ElevenLabs no .env (opcional)", key, "só para a voz paga: ELEVENLABS_API_KEY=... no .env"))
    width = max(len(name) for name, _, _ in rows)
    for name, ok, fix in rows:
        print(f"{'ok ' if ok else 'FALTA'} {name:<{width}}  {'' if ok else '-> ' + fix}")
    missing = [name for name, ok, _ in rows if not ok and "opcional" not in name]
    print("\ntudo certo" if not missing else f"\nfaltam {len(missing)}: resolva antes de seguir")
    sys.exit(1 if missing else 0)


if __name__ == "__main__":
    main()
