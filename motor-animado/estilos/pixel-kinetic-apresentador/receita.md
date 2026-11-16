# Receita: pixel-kinetic-apresentador

Tipografia grande com destaque amarelo sobre fundo de filme, com um apresentador em pixel no canto que acompanha a fala.

Tipografia grande com destaque amarelo sobre fundo escuro, molduras de filme nas bordas e um apresentador em pixel no canto de baixo, que acompanha a fala; barra de progresso lateral.

Decupada de modelos/recortes/pixel-kinetic-apresentador.mp4 (6.0 s a 30 qps) pelo `decupar.py`. Os números vieram da medida e as partes de olhar já estão completadas (folhas conferidas quadro a quadro em `decupagem/pixel-kinetic-apresentador/folhas/` e `tomadas/`). Da referência vem a fórmula; frases, personagens e assunto são sempre da pessoa.

## 1. A fórmula do roteiro
- **0 frases**, **0 palavras por minuto**.
- **Como abre:** título em duas linhas no alto — a primeira em branco, a segunda **dentro de uma etiqueta amarela** (`ANTES EU / ACHAVA...`) — com o apresentador já no canto de baixo e a janela central vazia.
- **O que se repete:** o par de linhas do título troca a cada ideia (`HOJE EU / SÓ PEÇO`, `VERGONHA / DE CÂMERA?`), e a janela central mostra a prova daquela ideia (lista com caixas marcadas, campo de pedido, miniatura de vídeo com barra, céu estrelado).
- **A virada:** em 5 s, quando a janela vira partículas douradas que se juntam e formam a frase de efeito (`ISSO MUDA O JOGO.`).
- **Como termina:** a frase de efeito montada na janela e o apresentador com as mãos no rosto.
- A tabela frase a frase com os tempos está em `decupagem/pixel-kinetic-apresentador/decupagem.md`.

## 2. A câmera
- **Cortes:** 0.97 s, 5.97 s.
- **1 movimentos rápidos**, jeito dominante **expo_out**, freada de ~0.13 s.
- **Parada 94%** do tempo; o maior trecho parado tem 2.53 s.
- A curva quadro a quadro está em `referencia-curva.json` (câmera medida: `createMeasuredDolly`).
- **Os planos:** um só, de frente, fixo. Parada 94% do tempo; os dois cortes medidos (0,97 s e 5,97 s) são trocas de conteúdo, não de câmera.

## 3. O visual
- **Paleta medida:** `#0b0a03`, `#151209`, `#64543e`, `#ece1c5`, `#dfac58`, `#c9c4b7`, `#393121`, `#c7ad80`.
- **O estilo:** fundo quase preto com **textura de filme** — perfurações de película tracejadas nas laterais e marcas `+` de corte nos cantos. Tipografia condensada em caixa alta, destaque em etiqueta amarela de cantos arredondados. Tudo em tom sépia e dourado.
- **O personagem:** um **busto em pixel** no canto inferior esquerdo (`bustCorner`, do `motor/busto.js`): cabelo
  volumoso, bandana, moletom escuro e um **halo dourado** atrás, com moldura clara em volta. Muda de expressão por
  ideia e mexe a boca enquanto a frase corre. É o mesmo apresentador dos estilos retrô.
- **O cenário:** um só, o fundo de filme. O que muda é a janela central.

## 4. Como cada coisa entra
- **Como entra:** a etiqueta amarela do título cresce um pouco ao entrar; o conteúdo da janela troca de uma vez; as partículas douradas levam cerca de 15 quadros para formar o texto.
- **Quando entra:** o título vem antes, a janela depois.

## 5. Os textos na tela
- **Legenda:** 4 palavra(s) por vez, topo em 705 px, letra ~38 px, `#ecdfca` com contorno `#c29d85`, destaque `#e1ae52`.
- **Os textos:** título em duas linhas no alto (a segunda na etiqueta amarela); crédito miúdo no canto superior direito; **barra XP** azul no canto inferior direito, com rótulo; legenda de 4 palavras em minúsculas no meio da tela (705 px de 1920).

## 6. O som
- **Volume da referência:** None LUFS (o nosso vai a -14). **Música por baixo:** não.
- **O som:** sem narração no recorte medido. Para um vídeo de verdade: estalo seco na troca de título e um som de brilho na formação das partículas.

## 7. Como montar no motor
- **O kit tem:** só o básico. **Falta** a moldura de filme com perfurações, a etiqueta amarela de destaque, a barra XP e as partículas que formam texto. O apresentador vem de `motor/busto.js` (`bustCorner`), já pronto.
- **Conferir:** o apresentador não pode cobrir a janela nem a barra XP; a etiqueta amarela precisa caber na largura sem quebrar a palavra; e o halo não pode virar um borrão quando o fundo é escuro.
