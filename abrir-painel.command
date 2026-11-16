#!/bin/bash
# Dois cliques aqui abrem o painel no navegador. Para fechar, feche esta janela do Terminal.
cd "$(dirname "$0")"
PORTA="${PORTA:-4747}"
if lsof -ti tcp:$PORTA -sTCP:LISTEN >/dev/null 2>&1; then
  echo "O painel já está aberto nesta porta."
else
  node painel/servidor.mjs &
  sleep 2
fi
open "http://127.0.0.1:$PORTA"
wait
