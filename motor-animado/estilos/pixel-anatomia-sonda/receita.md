# Receita: pixel-anatomia-sonda

Órgão inteiro em pixel, de frente e em corte, com o caminho de um tubo desenhado por dentro.

Órgão inteiro em pixel art, de frente e em corte, com o caminho de um tubo ou de um fluido desenhado por dentro; fundo azul-noite, balão de fala simples e rótulo curto em caixa alta.

Decupada de modelos/recortes/pixel-anatomia-sonda.mp4 (25.03 s a 30 qps) pelo `decupar.py`. Os números vieram da medida e as partes de olhar já estão completadas (folhas conferidas quadro a quadro em `decupagem/pixel-anatomia-sonda/folhas/` e `tomadas/`). Da referência vem a fórmula; frases, personagens e assunto são sempre da pessoa.

## 1. A fórmula do roteiro
- **1 frases**, **343 palavras por minuto**.
- **Como abre:** a estrutura já está na tela, em corte, e o rótulo da etapa se escreve letra a letra numa **caixa preta com texto amarelo** no canto superior esquerdo (`HEALTHY` → `HEALTHY ARTERY`). Não há título nem apresentação.
- **O que se repete:** rótulo da etapa → a coisa acontece no corte → rótulo da etapa seguinte. Cada etapa dura de 2 a 4 s. O tempo acelerado ganha a marca `@TIME-LAPSE` miúda no rodapé.
- **A virada:** o close extremo. No exemplo do stent, em 15,5–17 s a câmera entra tanto na malha que o quadro vira textura (fundo turquesa, só os fios). É pontuação, não informação: dura pouco e volta para o corte.
- **Como termina:** cartão escuro com o título do vídeo em caixa alta (`HOW CORONARY STENTS WORK`), por cima do último quadro.
- A tabela frase a frase com os tempos está em `decupagem/pixel-anatomia-sonda/decupagem.md`.

## 2. A câmera
- **Cortes:** 6.00 s, 10.00 s, 20.00 s.
- **5 movimentos rápidos**, jeito dominante **expo_out**, freada de ~0.27 s.
- **Parada 82%** do tempo; o maior trecho parado tem 3.93 s.
- A curva quadro a quadro está em `referencia-curva.json` (câmera medida: `createMeasuredDolly`).
- **Os planos:** o órgão inteiro de frente, o corte dele e o caminho do tubo por dentro. 3 cortes medidos, mas dois deles (10 s e 20 s) são a emenda do recorte: o corte real é um só, em 6 s. Parada 82% do tempo.

## 3. O visual
- **Paleta medida:** `#57491b`, `#1d2538`, `#040910`, `#825857`, `#c8ac4c`, `#386289`, `#282317`, `#985f60`.
- **O estilo:** pixel art em 2D, corte anatômico com as camadas em faixas de cor, sobre fundo azul-noite com estrelas. Sem sombra e sem luz direcional: o volume vem do contorno e do pontilhado.
- **O personagem:** não há, com uma exceção: quando a cena precisa de contexto humano, entram bonecos planos de perfil, desenhados bem mais simples que o órgão (cabeça oval, sem rosto, corpo em bloco).
- **O cenário:** um só — o corte. O que muda é o que entra nele de fora (agulha, balão, malha, sonda) e o quanto a câmera se aproxima.

## 4. Como cada coisa entra
- **Como entra:** o objeto entra pela borda do quadro, em linha reta, e trabalha no centro. A malha do stent se expande em cerca de 8 quadros; o balão infla em cerca de 12. Nada aparece do nada.
- **Quando entra:** o rótulo vem **antes** do movimento, não depois: ele nomeia a etapa e então ela acontece.

## 5. Os textos na tela
- **Legenda:** 3 palavra(s) por vez, topo em 188 px, letra ~51 px, `#edf0f7` com contorno `#040711`, destaque `#878e9b`.
- **Os textos:** rótulo de etapa em caixa preta com texto amarelo, no canto superior esquerdo, a cerca de 2% da altura. Mostradores pequenos (manômetro, relógio) no canto direito durante o procedimento. Linha de medida fina, tipo paquímetro, quando é preciso mostrar o estreitamento. A legenda falada tem de 2 a 3 palavras. Este usa também um **balão de fala** com pergunta direta no começo ("Where does this tube actually go?"), em caixa clara com rabicho.

## 6. O som
- **Volume da referência:** -13.7 LUFS (o nosso vai a -14). **Música por baixo:** não.
- **O som:** aqui há efeito ligado ao movimento (40% a 75% dos movimentos têm um ataque junto), diferente do duelo. São estalos curtos no encaixe e no inflar. Volume de −13,4 a −14,2 LUFS.

## 7. Como montar no motor
- **O kit tem:** o que vem do `pixel-duelo-cardio` (fundo estrelado, moldura, barra). **Falta** a peça própria desta família: o corte de vaso ou de tecido em camadas, com o sangue correndo, e o rótulo amarelo que se escreve.
- **Conferir:** a parede do corte precisa aparecer (nada de órgão transparente); o objeto que entra não pode atravessar a parede sem motivo; e o close extremo não pode durar mais que 2 s, senão o vídeo perde o fio.
