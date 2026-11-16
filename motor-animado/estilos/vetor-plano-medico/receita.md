# Receita: vetor-plano-medico

Vetor chapado em 2D, sem textura e sem sombra, que troca de escala o tempo todo: corpo, tecido, molécula, máquina.

Vetor chapado em 2D: silhueta de perfil em cor cheia, órgão desenhado em poucas formas, fundo azul-petróleo com pontinhos e raios ou setas marcando o que acontece. Sem textura, sem sombra, sem pixel.

Decupada de modelos/recortes/vetor-plano-medico.mp4 (25.03 s a 30 qps) pelo `decupar.py`. Os números vieram da medida e as partes de olhar já estão completadas (folhas conferidas quadro a quadro em `decupagem/vetor-plano-medico/folhas/` e `tomadas/`). Da referência vem a fórmula; frases, personagens e assunto são sempre da pessoa.

## 1. A fórmula do roteiro
- **1 frases**, **25 palavras por minuto**.
- **Como abre:** a silhueta de cabeça de perfil já na tela, com o cérebro visível e os raios amarelos convergindo num ponto. Sem título e sem cartão.
- **O que se repete:** visão geral → close do detalhe → visão geral. O close pode ser o tecido com células, o mapa de dose em anéis de cor, a dupla hélice, o colimador em anéis concêntricos ou a máquina. Cada ida e volta dura de 2 a 4 s.
- **A virada:** quando os anéis de dose convergem num ponto só e o vermelho aparece no centro: é o quadro que explica o mecanismo inteiro.
- **Como termina:** volta para a silhueta de perfil com os raios, igual à abertura — fecha o círculo.
- A tabela frase a frase com os tempos está em `decupagem/vetor-plano-medico/decupagem.md`.

## 2. A câmera
- **Cortes:** 10.00 s, 20.00 s.
- **16 movimentos rápidos**, jeito dominante **expo_out**, freada de ~0.33 s.
- **Parada 50%** do tempo; o maior trecho parado tem 2.23 s.
- A curva quadro a quadro está em `referencia-curva.json` (câmera medida: `createMeasuredDolly`).
- **Os planos:** silhueta de perfil, close de tecido, corte de aparelho e vista de cima do colimador. É o segundo mais movimentado dos catorze: parada só 50% do tempo, 16 movimentos, mediana de 14 quadros, quase todos `expo_out` (saída rápida que freia). Os 2 cortes medidos (10 s e 20 s) são a emenda do recorte: a referência não corta.

## 3. O visual
- **Paleta medida:** `#0a1526`, `#311924`, `#140d12`, `#93718e`, `#335567`, `#794165`, `#ce7c82`, `#b94962`.
- **O estilo:** vetor chapado em 2D, sem textura, sem sombra e sem pixel. Formas cheias de cor, fundo azul-petróleo escuro com **grade de pontinhos**. A paleta é azul-petróleo, rosa e roxo, com amarelo só nos raios.
- **O personagem:** a silhueta humana de perfil, em cor cheia, sem rosto e sem detalhe. Serve de mapa, não de personagem.
- **O cenário:** um para cada escala — corpo, tecido, molécula, máquina — sempre sobre o mesmo fundo de grade.

## 4. Como cada coisa entra
- **Como entra:** as coisas crescem a partir do centro ou deslizam de lado, com saída rápida que freia no fim (`expo_out`, mediana de 14 quadros). Os anéis de dose se expandem de dentro para fora.
- **Quando entra:** a fala é esparsa (25 palavras por minuto, 29% do vídeo): a imagem vai na frente e a fala comenta depois.

## 5. Os textos na tela
- **Legenda:** 1 palavra(s) por vez, topo em 359 px, letra ~25 px, `#e7f0fa` com contorno `#071224`, destaque `#444d62`.
- **Os textos:** rótulos miúdos em caixa escura presos por **linha de chamada fina** ao ponto — a mesma ideia do `atlas-anatomico`, mas em caixa escura em vez de clara. Legenda de 1 palavra, pequena (25 px), em minúsculas, a 359 px do topo. Escala de cor (`Dose high / low`) no canto quando há mapa de dose.

## 6. O som
- **Volume da referência:** -14.1 LUFS (o nosso vai a -14). **Música por baixo:** sim.
- **O som:** −14,1 LUFS. Pouca fala e muito movimento: é o estilo que mais pede efeito ligado ao movimento dos catorze.

## 7. Como montar no motor
- **O kit tem:** só o básico. **Falta** a silhueta de perfil em vetor, o fundo com grade de pontinhos, os anéis de dose e os rótulos em caixa escura. Os rótulos podem sair do `createCallouts` do `atlas-anatomico`, trocando a cor da caixa.
- **Conferir:** sendo chapado, o que separa as formas é só a cor — duas peças vizinhas não podem ter tons parecidos; e a troca de escala precisa de um elemento em comum entre um plano e o seguinte, senão a pessoa se perde.
