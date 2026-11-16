# Receita: greg-news

Decupado de 3 trechos de 15 s do mesmo episódio ("Amizade", HBO, 29min08s) — início, meio e fim — já que uma faixa só
não bastava pra pegar abertura, corpo e reação de platéia. Fonte e números completos em `pesquisa.md`
(`decupagem/greg-news{,-meio,-fim}/decupagem.md`). Os três caíram no mesmo bloco de tema; **[OLHAR]** continua marcando
o que não foi visto nessas 3 janelas (não é o episódio inteiro). Da referência vem a fórmula; frases, personagem e
assunto são sempre da pessoa (regra 5 do SKILL.md).

## 1. A fórmula do roteiro
- **Abre identificando o tema do dia** como notícia: "Hoje a gente vai falar de ___" (medido, frase 5 do início).
- **Cada bloco de tema é só um assunto**, falado em rajadas rápidas e corridas (o trecho do meio tem **273 palavras
  por minuto** — bem mais rápido que uma fala normal) intercaladas com pausas mais longas pra platéia reagir (o
  trecho do fim tem só 15 palavras por minuto, 55% do tempo em silêncio: é o momento de risada/aplauso, não fala).
- [OLHAR] Onde entra o dado com fonte citada em voz alta — a pesquisa (tese PUC-Rio) confirma que isso existe no
  programa em geral, mas não caiu nos nossos 15s×3 (o tema "amizade" é mais leve que os temas políticos que a tese
  cita como os que mais usam recorte jornalístico).
- [OLHAR] Como termina o bloco e qual é a virada de opinião — não caiu nos 15 s do fim (esse trecho pegou um "thank
  you" de reação de platéia, não o fechamento do episódio).

## 2. A câmera
- **Um só plano por bloco, sem cortes dentro dele** (medido: 0 cortes nos trechos do meio e do fim; o único corte dos
  3 trechos é a troca abertura→bancada, em 5,30 s do início).
- **Nunca 100% parada**: 69-82% parada nos trechos de fala corrida, caindo pra **36%** no trecho de reação de platéia
  (mais movimento ali — câmera reage à risada tanto quanto a platéia). Microajustes suaves o tempo todo (`smooth`
  no início, `expo_out` no meio e no fim), freada entre 4 e 14 quadros (0,17-0,58 s): `approach_seconds: 0.4`,
  `braking_seconds` entre 0.17 e 0.5 conforme o momento, `idle_sway` mais alto que um estilo "congelado" (ficou
  `0.02` no `estilo.json`, maior que o `0.012` estimado antes da decupagem).
- **Mais movimento perto de piada/reação**, mais parado durante um rant rápido — regra prática: se a fala acelera,
  a câmera quase congela; se a platéia reage, a câmera se move mais.

## 3. O visual
- **Apresentador**: um **busto em pixel art** (`motor/busto.js`, o mesmo retrato de caixa de diálogo dos estilos
  retrô), de blazer **azul-petróleo/ciano** (`#1e7aa0`, medido por pixel — não terno escuro sério como a pesquisa
  por fonte secundária sugeria). `ancora(scene, style)` no `kit.js` põe o retrato como um plano atrás da bancada;
  as cores saem de `estilo.json` → `bust`, e a pessoa troca pele, cabelo, corte e roupa em Estilo → Personalizar.
  Na v1 era um `flatCharacter` de corpo inteiro, que ficava **na frente** da bancada e tapava ela inteira.
- **Enquadramento**: o alvo da câmera é `[0, 1.95, 0.6]`, acima da cabeça — não o tampo da bancada. Com o alvo na
  altura da bancada (1,1) ela tomava metade do quadro e a legenda caía na testa. O retrato tem 1,0 m de altura,
  centrado em `y = 1.6`, para a cabeça e os ombros ficarem acima do tampo (1,1) e a bancada virar uma faixa na base.
- **Cenário**: parede azul-marinho bem escuro (`#1f2e58`, muito consistente nos 3 trechos) com um desenho gráfico
  dourado de arcos/colinas onduladas ao fundo (não "prédios de capitais" — isso mudou de temporada; ver
  `pesquisa.md`). Embaixo, tom de madeira (`#654530`): bancada e palco. No plano aberto (antes do corte): platéia ao
  vivo sentada, dois monitores pequenos nas laterais com o feed do apresentador.
- **Card de tema**: canto superior esquerdo, fundo creme `#fbf3e8` (a mesma cor da legenda — um só tom de "texto
  sobre claro" no design), ícone pequeno acima do nome do tema em caixa baixa negrito. Fica no ar o **bloco inteiro**
  (8,5s+ contínuos), não um pop de poucos segundos.
- [OLHAR] Design exato do ícone do card (ilustração, não emoji) — não replicável com os ícones do motor; usar um
  `icon` simples (emoji) como aproximação, ou um `image` se a pessoa desenhar o próprio ícone.

## 4. Como cada coisa entra
- A vinheta de abertura ("GREG NEWS / COM [NOME] / HBO") aparece só no início do bloco/episódio, ~1 a 1,5 s, laranja
  e branco sobre fundo quase preto, com uma faixa diagonal que desliza — no motor, aproxime com um `LABEL`/`CARD` que
  entra em `pop()` rápido sobre um plano bem escuro (`stage.background` quase preto só nesse instante, via
  `estilo-ajustes.json` do vídeo, ou um corte de câmera pra uma posição que enquadra só o fundo escuro).
- O card de tema entra perto do começo do bloco e **não sai até o bloco mudar de assunto** (`until` = fim do bloco,
  não uma duração curta fixa).
- [OLHAR] Quantos quadros exatos leva pra entrar (crescer, aparecer) — não medido com precisão de quadro nestes 3
  trechos (o `analise_legenda.py` pega a posição e o tempo, não a curva de entrada).

## 5. Os textos na tela
- **Legenda**: só apareceu no início (gancho dos 3 primeiros segundos) — 1 palavra por vez, topo em 730/1920 px,
  letra ~98 px, `#fbf3e8` com contorno `#f8790a` (laranja), minúsculas. No meio e no fim, **nenhuma legenda**. Trate
  como um recurso do início de bloco/episódio, não karaokê contínuo do estilo explicador — ou não use, já que 2 dos
  3 trechos não tinham.
- **Card de tema**: ver seção 3 e 4.
- **Ticker**: não apareceu em nenhum dos 3 trechos — o motor tem o recurso (`referencias/cena-web.md`), mas o
  `estilo.json` deste estilo **não** traz a seção `ticker` por padrão (fica desligado). Ligue só se quiser uma
  escolha estética própria, fora da referência.

## 6. O som
- **Música por baixo o tempo todo**, com duck nas pausas (confirmado nos 3 trechos) — `"music"` não é `null` neste
  estilo (diferente do que eu tinha estimado antes da decupagem).
- **Muitos efeitos curtos**, a maioria ligada a um movimento de câmera (29% a 100% dos movimentos, conforme o
  trecho) — bem mais denso que os estilos explicadores (`lowpoly-drone`/`palito` ficam helow dos 40%).
- **Risada e aplauso de platéia são amostras** (`"sound": "amostra"`, nunca sintetizadas — ver `referencias/som.md`),
  postas no segundo da reação (no trecho do fim, a fala quase para — 55% do tempo em silêncio — é esse o momento).
- Volume da referência: -17,5 a -19,8 LUFS (entregamos a -14, igual aos outros estilos).

## 7. Como montar no motor
- `kit.js`: `arcoDourado()` (o fundo de colinas douradas sobre a parede escura, no lugar do `skyline()` de prédios da
  v1 deste estilo — ver `pesquisa.md` sobre a mudança), `bancada()` (madeira, cor medida), `ancora(scene, style)` (o
  busto em pixel de blazer ciano, que já entra na cena sozinho — não precisa de `scene.add`). No `draw`, chame
  `presenter.update(t)`: é o que faz o busto piscar e respirar. Ele não gira, a câmera deste estilo é frontal.
- O exemplo deste estilo tem **roteiro próprio** (`exemplo/roteiro.txt`, sobre trânsito) e o `plano.js` pede
  `wordStart(1, "estudo")`. Montado com a voz de outro roteiro, o motor levanta erro e **a cena fica preta** — o erro
  só aparece no console do navegador, não no terminal. Gere a voz dele com `voz.py exemplo/roteiro.txt --teste`.
- Card de tema: `CARDS` com `image` ou `icon`+`text`, `full: false` (canto, não tela cheia — diferente da v1, que
  assumia recorte jornalístico em tela cheia como o elemento mais comum; isso só foi confirmado pra "recortes
  jornalísticos" específicos, não pro card de tema). Guarde `full: true` pros momentos em que a pessoa realmente
  mostra um print/manchete/infográfico com fonte citada.
- **O que conferir no seu**: a cor do blazer e do fundo batendo com a referência (não um azul genérico qualquer); o
  card de tema no canto certo, não tampado; a câmera mais parada no rant e mais viva na reação; a amostra de
  risada/aplauso no segundo exato da reação, não antes — ouça com som, o Claude não ouve.
