# Receita: pixel-arteria-stent

Vaso em corte longitudinal ocupando a tela em pé. É o exemplar mais completo da família: 5 cortes, 12 movimentos, 75% deles com efeito de som.

Vaso em corte longitudinal ocupando a tela em pé, em pixel art: parede vermelha dos dois lados, sangue correndo no meio, e o aparelho (balão, malha, cateter) entrando e trabalhando dentro dele, com rótulo de etapa no alto.

Decupada de modelos/recortes/pixel-arteria-stent.mp4 (25.03 s a 30 qps) pelo `decupar.py`. Os números vieram da medida e as partes de olhar já estão completadas (folhas conferidas quadro a quadro em `decupagem/pixel-arteria-stent/folhas/` e `tomadas/`). Da referência vem a fórmula; frases, personagens e assunto são sempre da pessoa.

## 1. A fórmula do roteiro
- **1 frases**, **61 palavras por minuto**.
- **Como abre:** a estrutura já está na tela, em corte, e o rótulo da etapa se escreve letra a letra numa **caixa preta com texto amarelo** no canto superior esquerdo (`HEALTHY` → `HEALTHY ARTERY`). Não há título nem apresentação.
- **O que se repete:** rótulo da etapa → a coisa acontece no corte → rótulo da etapa seguinte. Cada etapa dura de 2 a 4 s. O tempo acelerado ganha a marca `@TIME-LAPSE` miúda no rodapé.
- **A virada:** o close extremo. No exemplo do stent, em 15,5–17 s a câmera entra tanto na malha que o quadro vira textura (fundo turquesa, só os fios). É pontuação, não informação: dura pouco e volta para o corte.
- **Como termina:** cartão escuro com o título do vídeo em caixa alta (`HOW CORONARY STENTS WORK`), por cima do último quadro.
- A tabela frase a frase com os tempos está em `decupagem/pixel-arteria-stent/decupagem.md`.

## 2. A câmera
- **Cortes:** 6.00 s, 10.00 s, 20.00 s, 21.90 s, 22.80 s.
- **12 movimentos rápidos**, jeito dominante **ease_in**, freada de ~0.03 s.
- **Parada 75%** do tempo; o maior trecho parado tem 4.33 s.
- A curva quadro a quadro está em `referencia-curva.json` (câmera medida: `createMeasuredDolly`).
- **Os planos:** o corte em pé ocupando a tela (o plano de trabalho), o close extremo (a pontuação) e, em alguns, uma cena de contexto desenhada mais simples — na do stent, a sala de cateterismo com bonecos planos de perfil, em 7,5–9,5 s. Parada de 43% a 82% do tempo, conforme o vídeo; os movimentos são curtos (7 a 12 quadros) e quase sempre um zoom.

## 3. O visual
- **Paleta medida:** `#43031b`, `#0a0f1e`, `#0d1223`, `#3f4a6e`, `#8f304a`, `#435668`, `#3e041a`, `#9f3b57`.
- **O estilo:** pixel art em 2D, corte anatômico com as camadas em faixas de cor, sobre fundo azul-noite com estrelas. Sem sombra e sem luz direcional: o volume vem do contorno e do pontilhado.
- **O personagem:** não há, com uma exceção: quando a cena precisa de contexto humano, entram bonecos planos de perfil, desenhados bem mais simples que o órgão (cabeça oval, sem rosto, corpo em bloco).
- **O cenário:** um só — o corte. O que muda é o que entra nele de fora (agulha, balão, malha, sonda) e o quanto a câmera se aproxima.

## 4. Como cada coisa entra
- **Como entra:** o objeto entra pela borda do quadro, em linha reta, e trabalha no centro. A malha do stent se expande em cerca de 8 quadros; o balão infla em cerca de 12. Nada aparece do nada.
- **Quando entra:** o rótulo vem **antes** do movimento, não depois: ele nomeia a etapa e então ela acontece.

## 5. Os textos na tela
- **Legenda:** 2 palavra(s) por vez, topo em 155 px, letra ~68 px, `#f3f6fd` com contorno `#070c16`, destaque `#ffd21f`.
- **Os textos:** rótulo de etapa em caixa preta com texto amarelo, no canto superior esquerdo, a cerca de 2% da altura. Mostradores pequenos (manômetro, relógio) no canto direito durante o procedimento. Linha de medida fina, tipo paquímetro, quando é preciso mostrar o estreitamento. A legenda falada tem de 2 a 3 palavras.

## 6. O som
- **Volume da referência:** -13.4 LUFS (o nosso vai a -14). **Música por baixo:** não.
- **O som:** aqui há efeito ligado ao movimento (40% a 75% dos movimentos têm um ataque junto), diferente do duelo. São estalos curtos no encaixe e no inflar. Volume de −13,4 a −14,2 LUFS.

## 7. Como montar no motor
- **O kit tem:** o que vem do `pixel-duelo-cardio` (fundo estrelado, moldura, barra). **Falta** a peça própria desta família: o corte de vaso ou de tecido em camadas, com o sangue correndo, e o rótulo amarelo que se escreve.
- **Conferir:** a parede do corte precisa aparecer (nada de órgão transparente); o objeto que entra não pode atravessar a parede sem motivo; e o close extremo não pode durar mais que 2 s, senão o vídeo perde o fio.
