# motor-animado

Shorts verticais animados em código, no Mac com chip Apple: um **motor** que faz o vídeo e **estilos** que dizem como ele fica. Junta o melhor de três skills (estilo-palito, brisa-visual-3d e shorts-3d-realistas, que continuam intactas) e acrescenta a decupagem automática de referências e a criação de estilos novos.

## O que tem
- `SKILL.md`: o passo a passo que o Claude segue.
- `ferramentas/`: tudo em Python (rode com `ferramentas/py <nome>.py`):
  - estudo: `baixar`, `transcrever` (mlx-whisper na GPU), `camera`, `folhas`, `visao.swift` (Vision da Apple), `decupar`, `novo_estilo`, `comparar`
  - produção: `voz` (Mac grátis ou ElevenLabs com cache), `alinhar`, `emendar`, `encaixar`, `montar`, `mapa`, `sons`, `render`, `blender`, `finalizar`, `legendar`, `mixar`, `conferir`, `lado_a_lado`
  - `diagnostico`: confere o Mac e diz o que falta
- `motores/web/`: three.js + HyperFrames (palco, câmera de drone e câmera medida, personagem plano e boneco 3D, legenda, etiquetas, cards, visual retrô). three.js, gsap e as fontes ficam em `vendor/`: o render funciona sem internet.
- `motores/blender/`: Blender 5 + MPFB (corpo, pele, olhos, cabelo e pelos fio a fio, camiseta, luz, câmera medida) e um céu HDR de estúdio (Poly Haven, CC0).
- `estilos/`: `lowpoly-drone`, `palito`, `retro-32bits`, `retro-64bits` (tratamentos por cima de outro estilo), `realista-corpo` e o `_modelo` que o `novo_estilo.py` usa.
- `referencias/`: um guia por etapa (roteiro, voz, cena web, motor Blender, som, estilo novo, thumb e legenda).
- `instalar.sh`, `requirements.txt`, `CREDITOS.md`, `VERSAO.md`.
- `perfil.exemplo.json`: a voz, o idioma, o CTA, os personagens e as regras de cuidado da pessoa.

## Instalar
1. No Mac com chip Apple, com o Homebrew: `brew install python node yt-dlp ffmpeg-full` (o ffmpeg-full traz a legenda queimada e fica separado do ffmpeg comum). Para o motor Blender: `brew install --cask blender` e `/Applications/Blender.app/Contents/MacOS/Blender --online-mode -c extension install mpfb --enable`.
2. Copie a pasta para `~/.claude/skills/motor-animado` e rode `bash ~/.claude/skills/motor-animado/instalar.sh` (ou `instalar.sh --blender`): cria o `.venv` da skill com o `requirements.txt`, compila o leitor do Vision e roda o diagnóstico.
3. Copie `perfil.exemplo.json` para `perfil.json` na pasta dos seus vídeos.
4. Antes de distribuir para outras pessoas, leia `CREDITOS.md`.

## Testar sem gastar
Numa pasta vazia: copie `estilos/palito/exemplo/roteiro.txt` e peça "Use a skill motor-animado e faça o exemplo do estilo palito com a voz de teste do Mac, em rascunho". Sai um vídeo de ~20 s em poucos minutos, sem custo.

## Números dos testes (Mac com chip M)
- Exemplo low-poly (32 s, 6 frases): rascunho 1080p30 em 0,7 min; 0 cortes secos; -14,0 LUFS.
- Decupagem de 32 s: ~1 min. Acertou cortes, legenda (posição, tamanho, cores, sincronia), etiquetas e música contra o gabarito.
- Cabeça realista (Blender): 41 s por quadro em 75% com 96 amostras; rascunho 25% em ~4 s.
