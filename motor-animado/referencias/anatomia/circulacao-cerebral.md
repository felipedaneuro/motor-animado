# Circulação do cérebro

A ficha mais usada do canal: AVC, aneurisma, hematoma e tudo que depende de sangue chegando ou deixando de chegar
ao cérebro.

## Os números que sustentam a urgência
- A parada da circulação cerebral por **mais de sete segundos** já leva à perda da consciência.
- Depois de cerca de **cinco minutos** começam as lesões **irreversíveis**: a célula nervosa não se regenera.
- Em **um minuto** passa pelo encéfalo uma quantidade de sangue perto do **peso dele**.
- Só o rim e o coração recebem fluxo maior que o do cérebro.

Esses quatro números são a razão de "tempo é cérebro" num roteiro de AVC.

## Os dois sistemas que irrigam o encéfalo
1. **Carotídeo** (circulação **anterior**): a **carótida interna**, ramo da carótida comum, sobe pelo pescoço, entra
   pelo **canal carotídeo** do osso temporal, fura a dura-máter e a aracnoide e se divide em **artéria cerebral média**
   e **artéria cerebral anterior**.
2. **Vértebro-basilar** (circulação **posterior**): as duas **artérias vertebrais** sobem pelos **forames transversos
   das seis primeiras vértebras cervicais**, entram pelo **forame magno**, correm na frente do bulbo e se fundem na
   **artéria basilar**, que termina se dividindo nas duas **artérias cerebrais posteriores**.

## O polígono de Willis
Na base do crânio os dois sistemas se encontram num anel:
- as duas **cerebrais anteriores** ligadas pela **comunicante anterior**;
- cada **cerebral posterior** ligada à **carótida interna** do seu lado pela **comunicante posterior**.

É esse anel que faz a circulação colateral: entupiu de um lado, a região ainda pode receber sangue pelo outro caminho.
Num desenho, o polígono é visto **por baixo do cérebro** — de cima ou de lado ele não aparece.

A artéria basilar ainda dá a **cerebelar superior**, a **cerebelar inferior anterior** e a **artéria do labirinto**;
as vertebrais dão as **espinhais** e as **cerebelares inferiores posteriores**.

## A volta do sangue
As veias do cérebro **não acompanham as artérias** e são **mais calibrosas** que elas. Drenam para os **seios da
dura-máter** e dali para as **veias jugulares internas** (as externas drenam a parte de fora e de trás da cabeça e do
pescoço). As jugulares internas se juntam às subclávias nas **braquiocefálicas**, que levam à **veia cava superior**.
- **Sistema superficial**: córtex e substância branca logo abaixo.
- **Sistema profundo**: corpo estriado, cápsula interna, diencéfalo; a veia principal é a **cerebral magna (veia de
  Galeno)**.

## Para cada tipo de vídeo
- **AVC isquêmico**: um ramo entope (em geral a cerebral média) e o **território daquele ramo** fica sem sangue — uma
  área com forma definida, não o cérebro inteiro escurecendo por igual. Mostre o sangue chegando até o bloqueio e parando.
- **AVC hemorrágico**: o vaso **rompe** e o sangue sai para dentro do tecido, empurrando o que está em volta.
- **Aneurisma cerebral**: abaulamento da parede, em geral numa **bifurcação do polígono de Willis**; o perigo é romper
  na direção do espaço subaracnóideo.
- **Hematoma epidural × subdural**: o epidural fica **entre o osso e a dura-máter** e costuma vir de **artéria**
  rompida (enche rápido, forma de lente biconvexa); o subdural fica **entre a dura-máter e a aracnoide** e costuma vir
  de **veia ponte** rompida (enche devagar, acompanha a curva do crânio). Desenhe as meninges na ordem certa, de fora
  para dentro: osso → **dura-máter** → **aracnoide** → espaço subaracnóideo com líquor → **pia-máter** → cérebro.

## Cor
- Artérias do polígono: vermelho-vivo; seios e veias: vermelho-escuro (ou azul, se o vídeo usar a convenção).
- Córtex: rosa-acinzentado; substância branca: creme; área sem sangue: roxo-escuro ou cinza-azulado, nunca preta.
- Sangue extravasado em hematoma: vermelho-escuro quase marrom.

## Erros comuns de desenho
- Polígono de Willis desenhado por cima do cérebro, ou aberto, sem fechar o anel.
- Artéria cerebral média saindo da basilar (ela sai da carótida interna).
- Veias desenhadas como sombra das artérias, acompanhando o mesmo caminho.
- Cérebro inteiro apagando no AVC, em vez do território de um ramo.
- Meninges na ordem errada, ou hematoma epidural desenhado por dentro da dura-máter.

## O que o motor já tem
`motores/web/js/anatomia.js` → `detailedBrain(cena, posicao, escala)`: giros, sulcos, cerebelo, tronco, a árvore de
artérias sobre a superfície e uma região que escurece quando fica sem sangue. `brainGeometry`, `onSurface`, `TREE` e
`RADII` servem para desenhar o mesmo cérebro de outro jeito (holograma, pixel, low-poly).

## Fonte
- Aula de Anatomia, *Vascularização do Sistema Nervoso*: https://www.auladeanatomia.com/sistemas/372/vascularizacao
  (os sete segundos, os cinco minutos, o fluxo igual ao peso do encéfalo por minuto, os dois sistemas, o polígono de
  Willis, a drenagem venosa; pranchas de NETTER, *Atlas de Anatomia Humana*, 2ª ed., Artmed, 2000).
- Aula de Anatomia, *Vasos Sanguíneos*: https://www.auladeanatomia.com/sistemas/379/vasos-sanguineos
  (anastomose e circulação colateral no polígono).
- Aula de Anatomia, *Meninges e Líquor*: https://www.auladeanatomia.com/sistemas/370/meninges-e-liquor
  (ordem das meninges; confira nesta página antes de desenhar hematoma).
- Kenhub Português, *O polígono de Willis*: https://www.instagram.com/reel/DewTvStRagF/
  (o anel ligando a circulação anterior à posterior e o caminho alternativo quando uma artéria oclui).
