# Pesquisa: Greg News com Gregório Duvivier

Este estilo **não** veio de uma decupagem quadro a quadro (`decupar.py`) de um episódio real — não tínhamos um link
de referência. Veio de pesquisa (duas fontes acadêmicas sérias + busca geral), seguindo a regra 4 do SKILL.md. Tudo
aqui é **conteúdo/formato** confirmado por fonte; os números de câmera, tipografia exata e tempo de corte (que só se
medem olhando o vídeo) estão marcados **[OLHAR]** na `receita.md` e são estimativas até alguém rodar `decupar.py`
num episódio de verdade.

## Fontes
1. **Souza, G. "Greg News" — dissertação de mestrado, PUC-Rio** (maxwell.vrac.puc-rio.br/49583/49583.PDF), sobre
   infotenimento e legitimação da opinião no programa. Extraído por texto (pdftotext), não por leitura visual.
2. Busca geral (imprensa) sobre o cancelamento do programa, formato e produção.
3. A tese de mestrado da UFSCar sobre o programa (2024) existe mas está com acesso restrito ao login institucional;
   não foi possível ler o conteúdo, só o resumo.

## O que está confirmado (com fonte)
- **Produção/formato**: HBO Brasil, semanal (sextas, 20h), ~30 min por episódio, produzido pelo grupo Porta dos
  Fundos. Adaptação brasileira do *Last Week Tonight with John Oliver* (HBO EUA — late night talk show).
- **Apresentador**: Gregório Duvivier, caracterizado de âncora de telejornal — terno completo e gravata, nos moldes
  dos apresentadores masculinos do Jornal Nacional/Jornal Hoje/Bom Dia Brasil (Globo) e Jornal das Dez (GloboNews).
- **Cenário**: bancada simples sobre um palco, com um cenário ao fundo com imagens de construções que representam as
  capitais mais importantes do Brasil (não um prédio só — uma composição de skyline). Props de bancada: caneta e
  papéis sobre a mesa, representando o "script" (sinal de seriedade jornalística). Numa fase posterior do programa, a
  apresentação passou a ser também feita em frente a uma estante de livros, sem bancada — ou seja, **há mais de um
  "estúdio"/enquadramento ao longo das temporadas**; este estilo modela a fase de bancada, a mais citada.
- **Plateia**: formato de talk show com platéia ao vivo, cuja reação às piadas (risada) é parte do programa.
- **Gráficos**: o programa usa, da mesma forma que o telejornalismo de verdade, **selos e infográficos, artes e
  animações**, e **recortes jornalísticos** (manchetes, prints de reportagens, dados de sites oficiais) — sempre
  citando a fonte e a data (ex.: "G1 - 03.fev.2017 - infográfico..."). É o elemento gráfico mais citado na tese.
- **Estrutura narrativa**: um assunto nacional por episódio, com informação + humor entrelaçados em doses pequenas
  ("como remédio homeopático") ao longo do episódio, e um **quadro humorístico fixo com atores perto do final** na
  maioria dos episódios analisados, seguido ou substituído por um **monólogo opinativo/editorial** nos minutos finais
  (mais contundente — funciona como um editorial). Proporção medida pela tese (2ª temporada, 14 episódios): entre 70%
  e 88% do tempo em "infotenimento" (informação + humor), o resto em opinião; dentro do infotenimento, a divisão entre
  informação e humor varia por episódio (ex.: "Plano de Saúde" 43,1% informação / 41,6% entretenimento).
- **Humornalismo brasileiro**: o programa é citado como parte de uma linhagem de humor-jornalismo no Brasil (CQC,
  TV Pirata), não uma criação isolada — o "âncora cosplay" é um traço do género, não uma particularidade do Greg News.

## O que NÃO está confirmado (pesquisa não achou) — fica [OLHAR] pendente decupagem real
- Cores exatas da identidade visual (paleta, tipografia do logotipo e dos grafismos).
- Ritmo de corte (quantos cortes por minuto, duração de cada plano, zoom de piada).
- Se existe e como é um ticker/chamada fixa embaixo da tela (não achei confirmação nem negação).
- O design exato dos "selos e infográficos" (são 2D flat, têm animação de entrada, etc.).
- Trilha sonora, vinheta de abertura, stinger de piada.
- Nome e frequência exata de quadros fixos além do "quadro humorístico com atores" no fechamento.

## Decupagem real (3 trechos de 15 s, `decupar.py`)

Depois da pesquisa, decupamos de verdade: `https://www.youtube.com/watch?v=4w6AAfIxfZc` (episódio "Amizade", 29min08s,
903 mil visualizações), baixado inteiro uma vez e cortado localmente em 3 janelas de 15 s — início (0-15s, pasta
`decupagem/greg-news/`), meio (14:33-14:48, `decupagem/greg-news-meio/`) e fim (28:20-28:35,
`decupagem/greg-news-fim/`). Os três caíram dentro do mesmo bloco de tema ("amizade"); não é uma amostra do episódio
inteiro, mas já contradiz e confirma pontos da pesquisa:

- **Apresentador**: blazer **azul-petróleo/ciano** (`#1e7aa0` medido por pixel), não terno escuro sério — mais colorido
  que o âncora de telejornal clássico que a tese descrevia (a identidade visual mudou entre 2018 e esta temporada).
  Camisa branca, gravata fina escura.
- **Cenário**: parede de fundo azul-marinho bem escuro (`#1f2e58`, medido nos 3 trechos de forma muito consistente) com
  um desenho gráfico dourado estilizado (arcos/colinas onduladas), **não** "prédios de capitais" como a tese de 2018
  descrevia — mudou. Embaixo, tom de madeira (`#654530`, também consistente nos 3 trechos): bancada e/ou palco.
  Plano aberto (início, antes do corte) mostra **plateia ao vivo sentada em fileiras**, dois monitores pequenos nas
  laterais com o feed do apresentador, e um selo "16" (classificação indicativa, não é estético).
- **Card de tema** ("amizade"): canto **superior esquerdo**, fundo creme (mesmo tom da legenda, `#fbf3e8` — o design usa
  a mesma cor em dois lugares), ícone ilustrado pequeno acima do título em caixa baixa negrito. Fica no ar o
  **bloco inteiro do tema** (8,5 a 14+ s contínuos, não um pop rápido) — mais parecido com uma etiqueta persistente do
  que um card de entrada/saída rápida.
- **Vinheta de abertura** (só no início): "GREG NEWS / COM GREGÓRIO / DUVIVIER" + logo HBO, laranja/branco sobre fundo
  quase preto, com uma faixa diagonal que desliza, ~1 a 1,5 s, sobre um plano aberto escuro.
- **Câmera**: **nunca corta dentro do mesmo plano** (só 1 corte nos 3 trechos: abertura → bancada, em 5,30s). Fora
  isso, quase sempre parada (69-82%) mas nunca 100% congelada — microajustes suaves (`smooth`/`expo_out`) o tempo
  todo, mais movimento perto de reação da platéia (fim: só 36% parada — mais dinâmico que o esperado) e menos durante
  um rant rápido (meio: 82% parada, 273 palavras por minuto!). Freada mediana entre 4 e 14 quadros (0,17-0,58 s).
- **Legenda**: **só no início** (o gancho dos 3 primeiros segundos) — 1 palavra por vez, topo em 730/1920 px, ~98 px,
  `#fbf3e8` com contorno `#f8790a` (laranja!), minúsculas. No meio e no fim, **nenhuma legenda** — pode ser um recurso
  só da abertura, ou um artefato de quem recortou esse vídeo pro YouTube; marcado [OLHAR] com mais amostras.
- **Som**: música por baixo o tempo todo (confirmado, com duck nas pausas); muitos efeitos curtos ligados a quase
  todo movimento de câmera (29% a 100% dos movimentos, conforme o trecho) — mais denso que os estilos explicadores
  da skill. -17,5 a -19,8 LUFS na referência (entregamos a -14, como os outros estilos).
- **Ticker/chyron**: **não apareceu em nenhum dos 3 trechos.** A pesquisa não confirmava nem negava; a decupagem real
  aponta pra ausência. Tirei a seção `ticker` do `estilo.json` por padrão (o recurso continua existindo no motor,
  documentado em `referencias/cena-web.md`, pra quem quiser usar numa escolha estética própria).
- **Recorte jornalístico em tela cheia** (print/manchete/infográfico citando fonte): **não apareceu** nos 3 trechos —
  mas o tema "amizade" é mais leve que os temas políticos/econômicos que a tese cita como os que mais usam esse
  recurso. Fica [OLHAR]: não decupado ainda, nem confirmado nem descartado pra este estilo.

Imagens de referência (frames reais, não desenhados): `decupagem/greg-news/tomadas/tomada02-meio.jpg` (plano principal),
`decupagem/greg-news/tomadas/tomada01-meio.jpg` (plano aberto com platéia), `decupagem/greg-news-meio/tomadas/tomada01-meio.jpg`
(o rant, mesmo plano) e `decupagem/greg-news/folhas/historia/folha_001.jpg` (a abertura quadro a quadro, 2/s).

## Como isto virou um estilo desta skill (decisão de design)
A skill produz **shorts verticais** (9:16); o programa real é um talk show de ~30 min em 16:9. Este estilo adapta a
**gramática** (âncora de terno numa bancada fixa, recortes jornalísticos reais citando fonte, ticker, risada de
platéia no tempo da piada, corte seco pra infográfico) para um vídeo curto vertical — não é uma recriação literal do
quadro de TV. Isso é uma escolha de design, não um fato medido; está documentado aqui pra não confundir com dado
da decupagem.
