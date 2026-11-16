# Receita: kinetic-creme

O único estilo claro dos catorze: fundo creme, cartões brancos e tipografia com destaque laranja. Para assunto leve, produto e processo.

Fundo creme claro, cartões brancos com sombra suave entrando um a um, tipografia escura grande e uma silhueta de cidade ao fundo: o oposto do pixel escuro, para assunto leve e de produto.

Decupada de modelos/recortes/kinetic-creme.mp4 (6.0 s a 30 qps) pelo `decupar.py`. Os números vieram da medida e as partes de olhar já estão completadas (folhas conferidas quadro a quadro em `decupagem/kinetic-creme/folhas/` e `tomadas/`). Da referência vem a fórmula; frases, personagens e assunto são sempre da pessoa.

## 1. A fórmula do roteiro
- **0 frases**, **0 palavras por minuto**.
- **Como abre:** uma **cápsula branca** no alto com o contador da etapa (`SKILL 1 › ROTEIRO`) e, logo abaixo, o título grande aparecendo palavra por palavra (`Uma` → `Uma escreve` → `Uma escreve o roteiro`), com as palavras-chave em laranja.
- **O que se repete:** uma habilidade por etapa. A cápsula troca o número, o título se escreve palavra por palavra e o cartão branco central mostra o resultado daquela etapa (arquivo de texto com cursor, roteiro pronto, thumbnail, editor com timeline).
- **A virada:** quando o cartão deixa de ser documento e vira o editor de vídeo com a timeline: o texto virou imagem.
- **Como termina:** o cartão do editor e o título completo (`Uma monta e edita o vídeo`).
- A tabela frase a frase com os tempos está em `decupagem/kinetic-creme/decupagem.md`.

## 2. A câmera
- **Cortes:** nenhum.
- **8 movimentos rápidos**, jeito dominante **expo_out**, freada de ~0.1 s.
- **Parada 73%** do tempo; o maior trecho parado tem 1.97 s.
- A curva quadro a quadro está em `referencia-curva.json` (câmera medida: `createMeasuredDolly`).
- **Os planos:** um só, de frente. Parada 73% do tempo, com 8 movimentos curtos (4 quadros) que acompanham a troca de cartão. Sem corte nenhum.

## 3. O visual
- **Paleta medida:** `#e9e1d1`, `#faf9f4`, `#543820`, `#805534`, `#bcb1a2`.
- **O estilo:** o oposto do pixel escuro. Fundo creme claro (`#e9e1d1`), **skyline de prédios desenhado em traço fino** na base, cartão branco com sombra suave no centro, tipografia escura moderna com destaque em laranja. Luz difusa, sem sombra dura.
- **O personagem:** um robozinho em pixel miúdo no canto inferior esquerdo — um ícone de mascote, não um personagem que atua.
- **O cenário:** um só, o fundo creme com a cidade em traço. O que muda é o cartão.

## 4. Como cada coisa entra
- **Como entra:** o título aparece palavra por palavra; o cartão troca com um deslize curto (4 quadros) e sombra que acompanha.
- **Quando entra:** a palavra do título entra junto com a palavra falada; o cartão entra logo depois dela.

## 5. Os textos na tela
- **Legenda:** 3 palavra(s) por vez, topo em 330 px, letra ~63 px, `#fbf7f2` com contorno `#221c14`, destaque `#ffd21f`.
- **Os textos:** cápsula de etapa no alto, título grande abaixo (330 px de 1920), legenda de 3 palavras em minúsculas, barra de progresso laranja fina no rodapé com o nome do canal e o contador.

## 6. O som
- **Volume da referência:** None LUFS (o nosso vai a -14). **Música por baixo:** não.
- **O som:** sem narração no recorte medido. Para um vídeo de verdade: um toque suave por palavra do título e um deslize curto na troca de cartão.

## 7. Como montar no motor
- **O kit tem:** só o básico. **Falta** o fundo creme com o skyline em traço, a cápsula de etapa, o cartão branco com sombra e a barra de progresso.
- **Conferir:** com fundo claro, o contorno da legenda precisa ser escuro (senão some); o cartão branco não pode se confundir com o fundo creme sem a sombra; e o laranja do destaque precisa passar no contraste contra o creme.
