# Versões

## 1.1 (2026-11-15)

- **Quinze estilos novos** (são 23 no total): catorze decupados de vídeos de referência — `pixel-duelo-cardio`,
  `pixel-duelo-hormonio`, `pixel-duelo-neuro`, `pixel-anatomia-camadas`, `pixel-anatomia-sonda`,
  `pixel-arteria-stent`, `pixel-dungeon-fisiologia`, `pixel-menu-rpg`, `pixel-kinetic-apresentador`,
  `kinetic-creme`, `vetor-plano-medico`, `med3d-primeira-pessoa`, `med3d-decisao`, `med3d-hud-rpg` — mais
  `atlas-anatomico`, com etiqueta presa por linha de chamada ao ponto da estrutura (`createCallouts`).
  As receitas vêm completas; só `greg-news` ainda tem partes `[OLHAR]`.
- **Apresentador dos estilos retrô: busto em pixel** (`motores/web/js/busto.js`) — o retrato fixo das caixas de
  diálogo antigas, numa grade de 56 por 64 ampliada sem suavizar, que pisca e mexe a boca com a fala. Saiu o boneco
  3D articulado; `pessoa.js` e `mascote.js` continuam no kit para quem precisar de corpo inteiro.
- **Cenário dos estilos retrô: pixel art** (`motores/web/js/cenario.js`). `pixelWorld` pinta céu, serra, mata, moita
  e chão em cinco camadas de painéis desenhados, com nuvem que anda e moita que balança em dois quadros;
  `pixelSprite` faz objetos na mesma grade, com sete desenhos prontos de 16 por 16. `dayWorld` aponta para ele e o
  mundo low-poly ficou como `lowpolyWorld`. As camadas ficam perto de propósito: o contorno do retrô marca o chão
  visto rasante além de uns 40 metros, e aquilo virava uma tarja preta no horizonte.
- **Texto que se escreve letra a letra** (`motores/web/js/escrita.js`), usado em quatro dos estilos novos.
- **Acervo de anatomia** em `referencias/anatomia/`: coração, vasos, circulação cerebral e medula espinal, com
  medida, posição, cor, o que não pode faltar e os erros comuns de desenho, mais o mapa das fontes.
- Corrigido: criar um estilo a partir de um vídeo sem narração quebrava o `novo_estilo.py`.

### Testado
Os exemplos dos estilos retrô (busto e cenário em pixel) por folha de contato, nos cenários de campo e de cidade;
os quinze estilos novos montam o exemplo. Nada foi ouvido com som.

## 1.0 (2026-11-10)
Primeira versão.
- **Motor web** (three.js + HyperFrames): palco, câmera de drone, câmera medida, personagem plano e boneco 3D, legenda, etiquetas e cards, visual retrô; three.js, gsap e fontes dentro do pacote (render sem internet).
- **Motor Blender** (Blender 5 + MPFB): corpo, pele, olhos, sobrancelhas, cabelo e pelos fio a fio, camiseta, luz, câmera medida, rascunho rápido.
- **Estilos:** `lowpoly-drone`, `palito`, `retro-32bits`, `retro-64bits` (tratamentos por cima de outro estilo, com `"extends"`) e `realista-corpo` (presets cabeça, braço e perna).
- **Estudo:** `decupar.py` (câmera, legenda pelo Vision da Apple, paleta, som, folhas), `novo_estilo.py`, `comparar.py`, `encaixar.py`.
- **Produção:** voz do Mac ou ElevenLabs com cache, alinhamento, emenda, sons sintetizados (também sem `plano.js`), mixagem em -14 LUFS, legenda queimada (`legendar.py`, ffmpeg-full), conferência (cortes × piscas, fotossensibilidade, volume).
- **Instalação:** `instalar.sh` e `requirements.txt`.

### Testado
Exemplos low-poly, palito, retrô 32 e 64 bits de ponta a ponta (rascunho, mixagem e conferência), decupagem contra gabarito, quadros da cabeça realista.

### Ainda não testado
Vídeo inteiro do motor Blender, decupagem com link real, voz da ElevenLabs, render final em 4K60.
