# Receita: pixel-duelo-neuro

A fórmula do canal aplicada à cabeça: dois cortes de crânio lado a lado, em azul e vermelho.

O duelo de dois painéis em pixel art aplicado à cabeça: dois cortes de crânio lado a lado, em azul e vermelho, cada um com a sua etiqueta de origem e de velocidade, sobre fundo riscado escuro.

Decupada de modelos/recortes/pixel-duelo-neuro.mp4 (25.03 s a 30 qps) pelo `decupar.py`. Os números vieram da medida e as partes de olhar já estão completadas (folhas conferidas quadro a quadro em `decupagem/pixel-duelo-neuro/folhas/` e `tomadas/`). Da referência vem a fórmula; frases, personagens e assunto são sempre da pessoa.

## 1. A fórmula do roteiro
- **1 frases**, **73 palavras por minuto**.
- **Como abre:** os dois painéis já estão na tela no quadro 1, com o título `A × B` em cima (cada nome na cor do seu lado) e, logo abaixo, uma barra de estado por lado. Nada de vinheta: a comparação é o primeiro quadro. Aqui: `HEMATOMA EPIDURAL × SUBDURAL`, com a origem (artéria ou veia) na etiqueta de cada painel.
- **O que se repete:** o par abre, um lado toma a tela inteira para um close, o par volta. No exemplo medido isso acontece quatro vezes em 25 s (par em 0–4,5 s, close em 4,5–9 s, close em 12–15 s, hipotálamo em 15,5–19 s, par de volta em 19,5 s). A frase vai numa **caixa de texto com borda logo abaixo do título**, escrita letra a letra, e não como legenda solta.
- **A virada:** quando aparecem as barras de velocidade (`LENTE` e `CRESCENTE`, depois `8 H` e `21 DIAS`): o que separa os dois não é o lugar, é o tempo.
- **Como termina:** o par na tela com as barras no estado final e a assinatura `@FELIPENMED` no rodapé de cada painel. O pedido final vem na legenda do post, não na tela.
- A tabela frase a frase com os tempos está em `decupagem/pixel-duelo-neuro/decupagem.md`.

## 2. A câmera
- **Cortes:** nenhum.
- **1 movimentos rápidos**, jeito dominante **smooth**, freada de ~0.07 s.
- **Parada 99%** do tempo; o maior trecho parado tem 14.97 s.
- A curva quadro a quadro está em `referencia-curva.json` (câmera medida: `createMeasuredDolly`).
- **Os planos:** só dois. O **par** (câmera de frente, parada, os dois painéis inteiros) e o **close** (um lado ocupando a tela). Não há drone, órbita nem travelling. A câmera fica parada 98–99% do tempo e nunca corta: a troca entre par e close é feita pelo conteúdo, não pelo corte.

## 3. O visual
- **Paleta medida:** `#0b0e1a`, `#8c8193`, `#d9d2e3`, `#78444f`, `#9c82e5`.
- **O estilo:** pixel art em 2D sobre fundo azul quase preto com estrelas, desenhado em tela pequena e ampliada sem suavizar. Luz chapada, sem sombra projetada; o volume vem da cor, não da iluminação. Cada painel tem moldura fina de néon na cor do seu lado.
- **O personagem:** não existe. Quem atua é o órgão ou a via dentro de cada painel.
- **O cenário:** um só, o fundo estrelado, do começo ao fim. O que muda é o que está dentro dos painéis.

## 4. Como cada coisa entra
- **Como entra:** nada voa nem cresce. As peças trocam de estado no lugar (a barra enche, o sangue muda de cor, a seta acende) e o texto da caixa aparece letra a letra, a cerca de 12 caracteres por segundo.
- **Quando entra:** junto com a palavra (atraso medido de 0,01 s no exemplo com fala limpa). O texto da caixa termina de se escrever antes da frase seguinte começar.

## 5. Os textos na tela
- **Legenda:** 1 palavra(s) por vez, topo em 1328 px, letra ~56 px, `#e3674f` com contorno `#07080d`, destaque `#9885e2`.
- **Os textos:** título `A × B` a cerca de 15% da altura, com cada nome na cor do seu painel e o × em branco. A caixa de texto fica logo abaixo, a 25–30%. As etiquetas de cada painel (nome, estado) ficam dentro da moldura, no topo e na base. A assinatura fica a 77% da altura. A legenda falada é de 1 a 2 palavras em caixa alta. Neste a legenda falada fica embaixo (1328 px de 1920), não no alto: o espaço de cima é todo do título e dos cortes de crânio.

## 6. O som
- **Volume da referência:** -14.3 LUFS (o nosso vai a -14). **Música por baixo:** não.
- **O som:** sem efeito em movimento (não há movimento). Os 20 a 45 ataques medidos são a própria fala e, quando há, uma música por baixo baixa (−0,7 dB abaixo da fala no exemplo). Volume de −13,9 a −14,3 LUFS.

## 7. Como montar no motor
- **O kit tem:** `starfield` (fundo), `duelStage` (os dois painéis com moldura), `stateBar` (a barra de cada lado), `divider` (o × do título) e `ground` para quem se apoia neste estilo. **Falta** a alternância par ↔ close e a caixa de texto que se escreve: as duas estão medidas aqui e são o próximo pedaço do kit.
- **Conferir:** os dois painéis têm que ter o mesmo tamanho e a mesma distância da borda; o conteúdo não pode encostar na moldura; as barras precisam contar a mesma história que a fala; e o close tem que ser de um lado só, nunca dos dois ao mesmo tempo.
