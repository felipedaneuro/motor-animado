# Artéria, veia e capilar

## O que define cada um: a direção, não o oxigênio
**Artéria é o vaso que sai do coração; veia é o que volta para ele.** O oxigênio não entra nessa definição, e é aí que
quase todo desenho erra:
- a **artéria pulmonar** sai do ventrículo direito levando sangue **pobre** em oxigênio para o pulmão;
- as **veias pulmonares** voltam ao átrio esquerdo com sangue **rico** em oxigênio;
- no feto, as **artérias umbilicais** levam sangue **pobre** em oxigênio para a placenta, e a **veia umbilical** traz
  o sangue rico de volta.

Então o vermelho e o azul do desenho são uma convenção sobre **oxigênio**, não sobre artéria e veia. Num vídeo que
mostra o pulmão ou o feto, os dois se cruzam: ou você pinta pelo oxigênio (e a artéria pulmonar fica azul) ou pinta
pelo tipo de vaso (e some a informação do oxigênio). Escolha uma, diga qual na primeira aparição e não troque no meio.

## A rede, em ordem
Coração → **artérias** (vão se ramificando e afinando) → **arteríolas** → **capilares** (onde a troca acontece) →
**vênulas** → **veias** (vão se juntando e engrossando) → coração. A troca de oxigênio e nutrientes acontece **só no
capilar**: mostrar oxigênio saindo da parede de uma artéria grossa é erro.

## Medida de verdade
- A aorta tem cerca de **2,5 cm** de diâmetro na saída do coração; dali até o capilar o calibre cai até perto de
  **10 µm** (micrômetros) — uma diferença de umas 2.500 vezes.
- Uma hemácia passa pelo capilar praticamente uma de cada vez, às vezes dobrando-se.
- A rede inteira de vasos de um adulto soma da ordem de **100 mil quilômetros**.
- Escala para desenhar junto: se a aorta é um polegar, uma coronária é um espaguete e um capilar é invisível a olho nu.

## As três túnicas (a parede, de fora para dentro)
1. **Túnica externa** (adventícia): tecido conjuntivo; leva os vasinhos e os nervos da própria parede. Só nas artérias grandes.
2. **Túnica média**: músculo liso + tecido elástico. É a mais grossa na artéria e a que faz o vaso apertar e relaxar.
3. **Túnica íntima**: endotélio, uma camada lisa de células, sem interrupção, que forra até o capilar.

**Artéria × veia, no corte:** a artéria tem a **túnica média muito mais espessa** e fica **redonda** quando vazia; a
veia tem parede fina, fica **achatada** e tem **valvas** que impedem o sangue de voltar. O capilar é só a túnica
íntima — uma camada de célula de espessura. Desenhar a veia com a mesma parede da artéria é o erro mais comum.

## Anastomose e circulação colateral
Duas artérias se ligam por **ramos**, nunca por troncos principais. Essa ligação é o que garante que, se um vaso
entope, a região ainda recebe sangue por outro caminho. O exemplo clássico é o **polígono de Willis**, no cérebro
(ficha própria em [circulacao-cerebral.md](circulacao-cerebral.md)).

## Placa, trombo e entupimento (para vídeos de infarto, AVC e stent)
- A **placa de ateroma** cresce **dentro da parede**, por baixo do endotélio, empurrando a túnica íntima para dentro
  do canal. Não é sujeira grudada na superfície do tubo: desenhe a placa dentro da parede, não boiando no sangue.
- O estreitamento reduz o fluxo; o entupimento agudo quase sempre é a **placa que rompe e o coágulo (trombo) que se
  forma ali em cima**, fechando o que sobrou do canal.
- Depois do bloqueio, o sangue **chega até ele e para**. O trecho adiante fica pálido, não vermelho.
- No **stent**, o balão infla dentro do estreitamento, achata a placa contra a parede e a malha fica segurando o canal
  aberto; o balão esvazia e sai, a malha fica. Mostrar o balão ficando lá dentro é erro.

## Aneurisma
É uma **dilatação da parede**, não um balão colado por fora do tubo: as três túnicas se afinam e o vaso abaúla naquele
trecho. O risco é a parede afinada romper. No cérebro ele costuma aparecer numa bifurcação do polígono de Willis.

## Cor
- De verdade: sangue **vermelho-vivo** quando cheio de oxigênio e **vermelho-escuro** quando pobre em oxigênio.
  **Sangue venoso não é azul.** A veia parece azulada sob a pele por causa da luz atravessando o tecido.
- Convenção de desenho: vermelho = oxigenado, azul = pobre em oxigênio. Vale usar, desde que a primeira aparição
  explique e o vídeo inteiro mantenha.
- Parede do vaso: rosa-claro a bege; placa: amarelo-pálido; trombo: vermelho-escuro com fiapos.

## Erros comuns de desenho
- **Pintar toda artéria de vermelho e toda veia de azul** — a artéria pulmonar e as umbilicais desmentem isso.
- Veia com parede grossa igual à da artéria, e sem valvas.
- Lúmen da artéria desenhado largo e frouxo: no corte, a artéria tem **lúmen estreito e bem redondo**, porque a túnica
  média espessa a mantém aberta; o da veia é largo e de contorno irregular.
- Placa boiando no meio do sangue em vez de crescendo dentro da parede.
- Sangue continuando a correr do outro lado de um bloqueio total.
- Capilar desenhado com a grossura de uma artéria só para caber a hemácia: prefira ampliar a cena inteira.
- Vaso como um tubo liso e reto sem nenhuma ramificação: artéria real se ramifica o tempo todo.

## O que o motor já tem
`motores/web/js/anatomia.js` → `TREE`, `arteryCurve`, `onSurface`: a árvore de artérias que corre sobre a superfície do
cérebro, e uma região que escurece quando fica sem sangue.

## Fonte
- Aula de Anatomia, *Vasos Sanguíneos*: https://www.auladeanatomia.com/sistemas/379/vasos-sanguineos
  (as três túnicas, artéria × veia, anastomose, polígono de Willis).
- Aula de Anatomia, *Sistema Cardiovascular*: https://www.auladeanatomia.com/sistemas/233/sistema-cardiovascular
  (cerca de 100 mil quilômetros de vasos; circulação pulmonar e sistêmica).
- Diâmetro da aorta de cerca de 2,5 cm e queda até cerca de 10 µm no capilar: Grishenkov et al., *Journal of Ultrasound
  in Medicine*, 2015, https://onlinelibrary.wiley.com/doi/full/10.7863/ultra.15.14.10019
- Kenhub Português, *Artérias e veias são muito diferentes*: https://www.instagram.com/reel/DfhsdU0sLUD/
  (a direção do fluxo como definição, a artéria pulmonar e as umbilicais, o lúmen estreito e arredondado da artéria).
