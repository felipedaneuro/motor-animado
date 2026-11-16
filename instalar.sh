#!/bin/bash
# Prepara o Motor Animado · Painel neste Mac: confere os programas, cria o ambiente Python, liga a skill e
# deixa o painel pronto para abrir. Não instala nada do Homebrew sozinho: mostra o comando para você rodar.
# Uso:  bash instalar.sh
set -e
AQUI="$(cd "$(dirname "$0")" && pwd)"
cd "$AQUI"

echo "Motor Animado · Painel — instalação"
echo

# ---------- 1. o computador ----------
[ "$(uname)" = "Darwin" ] || { echo "Este pacote é para Mac. Pare por aqui."; exit 1; }
if [ "$(uname -m)" != "arm64" ]; then
  echo "Este pacote é para Mac com chip Apple (M1 ou mais novo)."; exit 1
fi

# ---------- 2. os programas ----------
command -v brew >/dev/null || { echo "Falta o Homebrew. Instale por https://brew.sh e rode este instalador de novo."; exit 1; }

faltando=()
command -v python3 >/dev/null || faltando+=("python")
command -v node >/dev/null || faltando+=("node")
command -v yt-dlp >/dev/null || faltando+=("yt-dlp")
[ -x /opt/homebrew/opt/ffmpeg-full/bin/ffmpeg ] || command -v ffmpeg >/dev/null || faltando+=("ffmpeg-full")
if [ ${#faltando[@]} -gt 0 ]; then
  echo "Falta instalar. Copie, rode este comando e depois rode este instalador de novo:"
  echo
  echo "    brew install ${faltando[*]}"
  echo
  exit 1
fi
[ -x /opt/homebrew/opt/ffmpeg-full/bin/ffmpeg ] || echo "Aviso: sem o ffmpeg-full a legenda queimada no vídeo pode falhar (brew install ffmpeg-full)."
command -v swiftc >/dev/null || echo "Aviso: falta o Xcode Command Line Tools (xcode-select --install). Só é preciso para estudar vídeos de referência."

NODE_MAIOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAIOR" -ge 18 ] || { echo "O Node precisa ser 18 ou mais novo (o seu é $NODE_MAIOR). Atualize com: brew upgrade node"; exit 1; }
echo "✓ programas do sistema"

# ---------- 3. o ambiente Python ----------
if [ ! -x .venv/bin/python ]; then
  echo "criando o ambiente Python em .venv (demora alguns minutos na primeira vez)..."
  python3 -m venv .venv
fi
.venv/bin/python -m pip install --quiet --upgrade pip
.venv/bin/python -m pip install --quiet -r motor-animado/requirements.txt
[ -e motor-animado/.venv ] || ln -s ../.venv motor-animado/.venv
echo "✓ ambiente Python"

# ---------- 4. o leitor de imagens do macOS ----------
if [ -f motor-animado/ferramentas/visao.swift ] && command -v swiftc >/dev/null; then
  mkdir -p motor-animado/.bin
  [ -x motor-animado/.bin/visao ] || swiftc -O -o motor-animado/.bin/visao motor-animado/ferramentas/visao.swift 2>/dev/null || true
fi

# ---------- 5. a pasta dos vídeos ----------
mkdir -p videos
[ -f videos/perfil.json ] || cp motor-animado/perfil.exemplo.json videos/perfil.json
echo "✓ pasta videos (o seu perfil está em videos/perfil.json)"

# ---------- 6. um agente de IA ----------
echo
agentes=()
command -v claude >/dev/null && agentes+=("Claude Code")
command -v codex >/dev/null && agentes+=("Codex")
command -v gemini >/dev/null && agentes+=("Gemini")
if [ ${#agentes[@]} -eq 0 ]; then
  echo "Falta um agente de IA. Instale pelo menos um e entre na conta dele:"
  echo "    npm install -g @anthropic-ai/claude-code     # depois rode: claude"
  echo "    npm install -g @openai/codex                 # depois rode: codex"
  echo "    npm install -g @google/gemini-cli            # depois rode: gemini"
else
  echo "✓ agentes de IA encontrados: ${agentes[*]}"
fi

# ---------- 7. diagnóstico ----------
echo
motor-animado/ferramentas/py diagnostico.py || true

# ---------- 8. material de estudo (opcional, pesado) ----------
echo
if [ ! -f motor-animado/decupagem/greg-news/referencia/ref.mp4 ]; then
  echo "O material de estudo das referências (vídeos originais, cerca de 380 MB) não vem no pacote."
  if [ -t 0 ]; then
    read -r -p "Baixar agora? Leva alguns minutos e é opcional [s/N] " resposta
    case "$resposta" in [sSyY]*) bash baixar-extras.sh || true ;; *) echo "ok, fica para depois: bash baixar-extras.sh" ;; esac
  else
    echo "Para baixar quando quiser:  bash baixar-extras.sh"
  fi
fi

cat <<'FIM'

Pronto. Para abrir o painel:

    node painel/servidor.mjs

e abra http://127.0.0.1:4747 no navegador (ou dois cliques em abrir-painel.command).
FIM
