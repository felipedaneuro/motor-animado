# Receita: retro-32bits

**Estilo próprio** em pixel art da era 32 bits, com o apresentador em **busto de pixel** — o retrato fixo que aparece
na caixa de diálogo dos jogos antigos. Ele fica preso num canto da tela, com moldura clara e halo atrás, e o que se
mexe nele é só o rosto: os olhos piscam, as sobrancelhas mudam e a boca abre e fecha enquanto a frase corre. Não é um
boneco 3D que anda pelo mundo. **O cenário atrás também é pixel art**: céu, serra, mata, moita e chão desenhados em
camadas pintadas, não modelados em low-poly. As cores saem do tema (`natural`, `saude`, `financas`, `tecnologia`,
`infantil`; ver `estilos/_temas.json`).

## O que ele faz
- **Apresentador** (`presenter(root, style)` = `bustCorner`, do `motor/busto.js`): o busto é desenhado numa grade de
  56 por 64 pixels e ampliado sem suavizar. `setFace({eyes, mouth, brows})` (olhos `open`/`happy`/`closed`/`wide`/`side`;
  boca `smile`/`open`/`o`/`sad`/`flat`; sobrancelhas `calm`/`worried`/`angry`/`up`), e `pose("think")` e companhia viram
  expressões, já que não há braço nem perna. `update(t, falando)` pisca sozinho e mexe a boca quando `falando` é true.
  Trocam pelo `"bust"` do estilo.json: `skin`, `hair`, `hairStyle` (`black-power`/`curto`/`franja`), `cloth`, `band`,
  `accent`, `portrait` (a largura na tela), `bottom`, `lado` e `nome`.
- **Com caixa de fala** (`dialogPortrait`), para o diálogo clássico: retrato à esquerda, texto correndo à direita.
- **Corpo inteiro**, se o vídeo precisar: `person` (3D) ou `mascot` (cabeça grande) continuam no kit.
- **Resolução interna de 270x480** ampliada sem filtro (pixel de 4x4), **cor de 15 bits** com pontilhado,
  **sombreado suave** e o **contorno de 1 pixel** onde a profundidade salta (`retro.outline`).
- **Cenário** (`pixelWorld(cena, style, {x0, x1})`, do `motor/cenario.js`): cinco camadas em pixel — céu em faixas com
  pontilhado e sol, serra desbotada com neve, linha de mata (ou casario, nos temas de cidade), moitas e pedras dos dois
  lados da trilha, e o chão de grama ladrilhada com a trilha de terra. As nuvens andam e as moitas balançam em dois
  quadros, como num sprite de jogo. `dayWorld` aponta para ele, então uma cena antiga continua certa.
- **As camadas ficam perto de propósito** (mata a 34 m, serra a 40, céu a 44): o contorno do retrô marca o chão rasante
  além de uns 40 metros, e vira uma tarja preta no horizonte se a mata não tampar. A profundidade vem da diferença
  entre as camadas, não da distância. Quem quiser o mundo low-poly antigo tem `lowpolyWorld` no kit.
- **Objetos em pixel** (`pixelSprite(cena, style, {kind, position, size})`): `agua`, `sono`, `passos`, `coracao`,
  `estrela`, `aviso`, `gota`, desenhados em grade de 16 por 16 (`ICONS`); ou um desenho seu, com `pixelTile`.
  Tamanho útil: 0,55 a 0,65 m a uns 4 m da câmera — maior que isso toma o quadro inteiro, que é vertical e estreito.
- Para um fundo liso, com o apresentador falando com a câmera: `studio(cena, style)`.
- Legenda em fonte de pixel (Jersey 10, 102 px; reserva VT323). A Press Start 2P saiu em 16/11/2026: desenhava as maiúsculas acentuadas (Í, É) do tamanho de minúscula.

## Como usar
- Sozinho: `montar.py ... --estilo retro-32bits` (vem o exemplo do Doutor Cérebro: 6 frases, 3 hábitos).
- Trocar o tema: `estilo-ajustes.json` com `{"theme": "saude"}`.
- **Por cima de outro estilo**: `{"extends": "palito"}` (ou qualquer estilo web). Aí só o tratamento visual vai junto
  (a parte `"overlay"` do estilo.json: retrô, contorno, fontes e o apresentador); o resto é do outro estilo.
- O apresentador também entra em qualquer outro estilo: `import { presenter } from "./motor/pessoa.js"`.

## Ajustes finos (estilo-ajustes.json)
- Cores do cenário: `{"pixel_world": {"grass": "#7cc45a", "sky": "#8fd3f4", "far": "#9fb6cf"}}` (por cima do tema).
- Mais pixel: `{"retro": {"internal": [216, 384]}}`; menos: `[360, 640]`. Sem contorno: `{"retro": {"outline": null}}`.
- Tremido da época: `{"retro": {"vertex_snap": [180, 320]}}`. Menos pontilhado: `{"retro": {"dither": 0.5}}`.
- Outro apresentador: `{"bust": {"hair": "#1d1a18", "hairStyle": "curto", "cloth": "#2e8b57", "band": null}}`.
- Busto maior ou do outro lado: `{"bust": {"portrait": 420, "lado": "direita", "bottom": 180}}`.

## Conferir
- Texto pequeno some no pixel: legenda com 60 px ou mais; cards curtos. A fonte de pixel não tem todas as letras
  maiúsculas com acento (o "É" sai minúsculo): prefira palavras sem acento nos cards.
- Medido no exemplo do Doutor Cérebro (voz do Mac): rascunho em 0,5 min, 0 cortes, −14,0 LUFS.
