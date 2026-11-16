#!/bin/bash
# Prepara a skill motor-animado num Mac com chip Apple: confere o Homebrew, cria o ambiente Python da skill,
# compila o leitor do Vision e roda o diagnóstico. Não instala nada do Homebrew sozinho: diz o comando.
# Uso:  bash instalar.sh            (o motor web)
#       bash instalar.sh --blender  (também o motor Blender)
set -e
SKILL="$(cd "$(dirname "$0")" && pwd)"
cd "$SKILL"

if [ "$(uname -m)" != "arm64" ]; then
  echo "esta skill é só para Mac com chip Apple (M1, M2, M3...)"; exit 1
fi

faltando=()
command -v brew >/dev/null || { echo "instale o Homebrew primeiro: https://brew.sh"; exit 1; }
for programa in python3 node yt-dlp; do command -v "$programa" >/dev/null || faltando+=("$programa"); done
[ -x /opt/homebrew/opt/ffmpeg-full/bin/ffmpeg ] || faltando+=("ffmpeg-full")
command -v swiftc >/dev/null || echo "falta o Swift: rode  xcode-select --install"
if [ "$1" = "--blender" ] && [ ! -d /Applications/Blender.app ]; then
  echo "falta o Blender 5: brew install --cask blender"
fi
if [ ${#faltando[@]} -gt 0 ]; then
  echo "falta instalar: brew install ${faltando[*]/python3/python}"; exit 1
fi

if [ ! -x .venv/bin/python ]; then
  echo "criando o ambiente Python da skill em .venv ..."
  python3 -m venv .venv
fi
.venv/bin/python -m pip install --quiet --upgrade pip
.venv/bin/python -m pip install --quiet -r requirements.txt
chmod +x ferramentas/py

mkdir -p .bin
swiftc -O ferramentas/visao.swift -o .bin/visao && echo "leitor do Vision compilado"

if [ "$1" = "--blender" ] && [ -d /Applications/Blender.app ]; then
  /Applications/Blender.app/Contents/MacOS/Blender -b --python-expr \
    "import addon_utils,sys; sys.exit(0 if any('mpfb' in m.__name__ for m in addon_utils.modules()) else 1)" >/dev/null 2>&1 \
    || echo "falta o MPFB: /Applications/Blender.app/Contents/MacOS/Blender --online-mode -c extension install mpfb --enable"
fi

[ -f "$HOME/perfil.json" ] || echo "dica: copie perfil.exemplo.json para perfil.json na pasta dos seus vídeos e troque pelos seus dados"
ferramentas/py diagnostico.py $1
