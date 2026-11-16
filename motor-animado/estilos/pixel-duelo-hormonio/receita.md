# Receita: pixel-duelo-hormonio

A fórmula do canal aplicada aos hormônios, na chave roxo e amarelo. É o exemplar mais completo dos três: 15 frases, fala em 100% do vídeo, música por baixo.

O mesmo duelo de dois painéis em pixel art, na chave roxo e verde dos hormônios: dois caminhos do mesmo corpo correndo em paralelo, com barra de intensidade embaixo de cada um e o título A × B no alto.

Decupada de modelos/recortes/pixel-duelo-hormonio.mp4 (25.03 s a 30 qps) pelo `decupar.py`. Os números vieram da medida e as partes de olhar já estão completadas (folhas conferidas quadro a quadro em `decupagem/pixel-duelo-hormonio/folhas/` e `tomadas/`). Da referência vem a fórmula; frases, personagens e assunto são sempre da pessoa.

## 1. A fórmula do roteiro
- **15 frases**, **149 palavras por minuto**.
- **Como abre:** os dois painéis já estão na tela no quadro 1, com o título `A × B` em cima (cada nome na cor do seu lado) e, logo abaixo, uma barra de estado por lado. Nada de vinheta: a comparação é o primeiro quadro. Aqui: `LEPTINA × GRELINA`, com `FOME ↓` e `FOME ↑` nas barras.
- **O que se repete:** o par abre, um lado toma a tela inteira para um close, o par volta. No exemplo medido isso acontece quatro vezes em 25 s (par em 0–4,5 s, close em 4,5–9 s, close em 12–15 s, hipotálamo em 15,5–19 s, par de volta em 19,5 s). A frase vai numa **caixa de texto com borda logo abaixo do título**, escrita letra a letra, e não como legenda solta. Os closes deste são: tecido adiposo (4,5 s), estômago com relógio (9 s), reservas com ícone de bateria (12 s) e hipotálamo com neurônios acendendo (15,5 s).
- **A virada:** em 16 s, no hipotálamo: as duas vias chegam no mesmo lugar e a barra `FOME` se move. É o único momento em que os dois lados se encontram numa cena só.
- **Como termina:** o par na tela com as barras no estado final e a assinatura `@FELIPENMED` no rodapé de cada painel. O pedido final vem na legenda do post, não na tela.
- A tabela frase a frase com os tempos está em `decupagem/pixel-duelo-hormonio/decupagem.md`.

## 2. A câmera
- **Cortes:** nenhum.
- **0 movimentos rápidos**, jeito dominante **None**, freada de ~0.0 s.
- **Parada 99%** do tempo; o maior trecho parado tem 13.03 s.
- A curva quadro a quadro está em `referencia-curva.json` (câmera medida: `createMeasuredDolly`).
- **Os planos:** só dois. O **par** (câmera de frente, parada, os dois painéis inteiros) e o **close** (um lado ocupando a tela). Não há drone, órbita nem travelling. A câmera fica parada 98–99% do tempo e nunca corta: a troca entre par e close é feita pelo conteúdo, não pelo corte.

## 3. O visual
- **Paleta medida:** `#0c1326`, `#ece7c7`, `#713750`, `#e5c843`, `#628492`.
- **O estilo:** pixel art em 2D sobre fundo azul quase preto com estrelas, desenhado em tela pequena e ampliada sem suavizar. Luz chapada, sem sombra projetada; o volume vem da cor, não da iluminação. Cada painel tem moldura fina de néon na cor do seu lado.
- **O personagem:** não existe. Quem atua é o órgão ou a via dentro de cada painel.
- **O cenário:** um só, o fundo estrelado, do começo ao fim. O que muda é o que está dentro dos painéis.

## 4. Como cada coisa entra
- **Como entra:** nada voa nem cresce. As peças trocam de estado no lugar (a barra enche, o sangue muda de cor, a seta acende) e o texto da caixa aparece letra a letra, a cerca de 12 caracteres por segundo.
- **Quando entra:** junto com a palavra (atraso medido de 0,01 s no exemplo com fala limpa). O texto da caixa termina de se escrever antes da frase seguinte começar.

## 5. Os textos na tela
- **Legenda:** 2 palavra(s) por vez, topo em 324 px, letra ~60 px, `#e4e4f2` com contorno `#050413`, destaque `#5debe9`.
- **Os textos:** título `A × B` a cerca de 15% da altura, com cada nome na cor do seu painel e o × em branco. A caixa de texto fica logo abaixo, a 25–30%. As etiquetas de cada painel (nome, estado) ficam dentro da moldura, no topo e na base. A assinatura fica a 77% da altura. A legenda falada é de 1 a 2 palavras em caixa alta.

## 6. O som
- **Volume da referência:** -14.0 LUFS (o nosso vai a -14). **Música por baixo:** sim.
- **O som:** sem efeito em movimento (não há movimento). Os 20 a 45 ataques medidos são a própria fala e, quando há, uma música por baixo baixa (−0,7 dB abaixo da fala no exemplo). Volume de −13,9 a −14,3 LUFS.

## 7. Como montar no motor
- **O kit tem:** `starfield` (fundo), `duelStage` (os dois painéis com moldura), `stateBar` (a barra de cada lado), `divider` (o × do título) e `ground` para quem se apoia neste estilo. **Falta** a alternância par ↔ close e a caixa de texto que se escreve: as duas estão medidas aqui e são o próximo pedaço do kit.
- **Conferir:** os dois painéis têm que ter o mesmo tamanho e a mesma distância da borda; o conteúdo não pode encostar na moldura; as barras precisam contar a mesma história que a fala; e o close tem que ser de um lado só, nunca dos dois ao mesmo tempo.
