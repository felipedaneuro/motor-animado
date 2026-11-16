#!/bin/bash
# Baixa e refaz, neste computador, o material de estudo pesado que não vem no pacote (vídeos de referência das
# decupagens). É opcional: o painel e todos os estilos funcionam sem ele.
# Uso:  bash baixar-extras.sh            (baixa o que falta)
#       bash baixar-extras.sh --listar   (só mostra o que existe e o que falta)
set -e
AQUI="$(cd "$(dirname "$0")" && pwd)"
cd "$AQUI"

ler() { python3 -c "
import json;d=json.load(open('extras.json'))['decupagens']
print('\n'.join(f\"{x['nome']}|{x['link']}|{x['segundos']}|{x['tamanho']}|{x['sobre']}\" for x in d))"; }

if [ "$1" = "--listar" ]; then
  echo "Material de estudo (opcional):"
  ler | while IFS='|' read -r nome link segundos tamanho sobre; do
    [ -f "motor-animado/decupagem/$nome/referencia/ref.mp4" ] && estado="já baixado" || estado="falta ($tamanho)"
    printf "  %-14s %s\n     %s\n" "$nome" "$estado" "$sobre"
  done
  exit 0
fi

command -v yt-dlp >/dev/null || { echo "Falta o yt-dlp: brew install yt-dlp"; exit 1; }
[ -x .venv/bin/python ] || { echo "Rode antes: bash instalar.sh"; exit 1; }

ler | while IFS='|' read -r nome link segundos tamanho sobre; do
  if [ -f "motor-animado/decupagem/$nome/referencia/ref.mp4" ]; then
    echo "✓ $nome já está aqui"
    continue
  fi
  echo
  echo "baixando e estudando $nome ($tamanho, alguns minutos)..."
  echo "   $sobre"
  motor-animado/ferramentas/py decupar.py "$link" --nome "$nome" --ate "$segundos" --pasta motor-animado/decupagem || {
    echo "não deu certo com $nome. O vídeo pode ter saído do ar. O resto do pacote continua funcionando."
  }
done

echo
echo "pronto. A análise escrita de cada um está em motor-animado/decupagem/<nome>/decupagem.md"
