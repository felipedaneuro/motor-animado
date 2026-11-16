# Receita: pixel-menu-rpg

Interface de menu de videogame antigo: cada etapa do assunto é uma tela do menu, com contador e barra de progresso.

Interface de menu de videogame antigo: janela com borda dupla dourada sobre fundo roxo escuro, fonte de pixel, barra de progresso e a informação entrando linha por linha, como num RPG de 8 bits.

Decupada de modelos/recortes/pixel-menu-rpg.mp4 (6.0 s a 30 qps) pelo `decupar.py`. Os números vieram da medida e as partes de olhar já estão completadas (folhas conferidas quadro a quadro em `decupagem/pixel-menu-rpg/folhas/` e `tomadas/`). Da referência vem a fórmula; frases, personagens e assunto são sempre da pessoa.

## 1. A fórmula do roteiro
- **0 frases**, **0 palavras por minuto**.
- **Como abre:** a janela de menu já montada no centro, com o título da etapa em fonte de pixel dourada no alto e o contador `1/7` na barra de título. O primeiro item da lista já está marcado.
- **O que se repete:** uma etapa por tela. O título troca a palavra-chave (AUTOMAÇÃO → PAUTA → ROTEIRO → NARRAÇÃO → CENA → MONTAGEM → VERTICAIS), o contador anda (`1/7`, `2/7`…), o conteúdo da janela troca e a caixa de legenda embaixo continua a frase. Sete etapas em 6 s: é rápido.
- **A virada:** quando a janela deixa de mostrar documento (lista, papel, .TXT) e passa a mostrar imagem em movimento (onda de áudio, miniaturas, cena de jogo, timeline). A metade de cima do vídeo é texto; a de baixo é vídeo.
- **Como termina:** a janela com a timeline e o split-screen do corte vertical, e a legenda completando a frase inteira.
- A tabela frase a frase com os tempos está em `decupagem/pixel-menu-rpg/decupagem.md`.

## 2. A câmera
- **Cortes:** 0.33 s, 1.33 s.
- **1 movimentos rápidos**, jeito dominante **expo_out**, freada de ~0.23 s.
- **Parada 69%** do tempo; o maior trecho parado tem 1.03 s.
- A curva quadro a quadro está em `referencia-curva.json` (câmera medida: `createMeasuredDolly`).
- **Os planos:** um só, de frente, com a janela centrada. Parada 69% do tempo; os dois cortes medidos (0,33 s e 1,33 s) são trocas de conteúdo dentro da janela, não movimento de câmera.

## 3. O visual
- **Paleta medida:** `#12091c`, `#26143b`, `#4a3a64`, `#7c5420`, `#cf9b3a`, `#f3eecb`, `#97671f`, `#a99694`.
- **O estilo:** interface de menu de videogame antigo. Fundo roxo muito escuro com estrelas e uma faixa de chão de pixels na base. Janela com **moldura dourada dupla**, orelhas nos cantos e engrenagens nos dois cantos de cima. Fonte de pixel dourada com contorno no título; cinza na legenda.
- **O personagem:** não existe. O protagonista é a interface.
- **O cenário:** um só, o fundo estrelado com o chão de pixels. O que muda é o que está dentro da janela.

## 4. Como cada coisa entra
- **Como entra:** o conteúdo da janela troca de uma vez, sem transição. O texto da legenda se escreve letra a letra, e a barra de progresso dourada na base da janela avança junto.
- **Quando entra:** o título troca **antes** do conteúdo, como um cabeçalho que anuncia o que vem.

## 5. Os textos na tela
- **Legenda:** 4 palavra(s) por vez, topo em 1359 px, letra ~64 px, `#aaa4a6` com contorno `#1a0c24`, destaque `#ffd21f`.
- **Os textos:** título em pixel dourado no alto (a legenda corrente aparece acima dele, miúda e cinza); barra de título da janela com `AUTO`, o contador `N/7` e o nome da etapa; etiquetas pequenas coloridas na base da janela (verde, azul, laranja); caixa de legenda separada embaixo (1359 px de 1920), com moldura fina, 4 palavras por vez, em caixa alta.

## 6. O som
- **Volume da referência:** None LUFS (o nosso vai a -14). **Música por baixo:** não.
- **O som:** o recorte não tem narração medida (0 palavras por minuto): é uma peça de demonstração. Para um vídeo de verdade, use estalo curto de menu na troca de etapa e um bipe na barra de progresso.

## 7. Como montar no motor
- **O kit tem:** só o básico. **Falta** a janela de menu (moldura dourada dupla, barra de título com contador, orelhas e engrenagens), a caixa de legenda com moldura e o texto que se escreve.
- **Conferir:** o contador tem que bater com o número de etapas do roteiro; a fonte de pixel não tem todas as maiúsculas acentuadas (o `É` sai minúsculo), então prefira palavras sem acento no título; e a janela não pode encostar na caixa de legenda.
