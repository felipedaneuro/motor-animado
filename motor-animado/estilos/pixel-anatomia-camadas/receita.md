# Receita: pixel-anatomia-camadas

Corte de pele e tecidos em camadas horizontais, com um objeto entrando de fora. O mais movimentado da família.

Corte anatômico em pixel art sobre fundo escuro estrelado: a pele e os tecidos em camadas horizontais de cor, um objeto (agulha, sonda, tubo) entrando no quadro de fora e a vista abrindo por dentro, com rótulo em caixa alta.

Decupada de modelos/recortes/pixel-anatomia-camadas.mp4 (24.02 s a 30 qps) pelo `decupar.py`. Os números vieram da medida e as partes de olhar já estão completadas (folhas conferidas quadro a quadro em `decupagem/pixel-anatomia-camadas/folhas/` e `tomadas/`). Da referência vem a fórmula; frases, personagens e assunto são sempre da pessoa.

## 1. A fórmula do roteiro
- **1 frases**, **103 palavras por minuto**.
- **Como abre:** a estrutura já está na tela, em corte, e o rótulo da etapa se escreve letra a letra numa **caixa preta com texto amarelo** no canto superior esquerdo (`HEALTHY` → `HEALTHY ARTERY`). Não há título nem apresentação.
- **O que se repete:** rótulo da etapa → a coisa acontece no corte → rótulo da etapa seguinte. Cada etapa dura de 2 a 4 s. O tempo acelerado ganha a marca `@TIME-LAPSE` miúda no rodapé.
- **A virada:** quando a agulha atravessa a última camada e o conteúdo é injetado. Antes disso tudo é aproximação.
- **Como termina:** cartão escuro com o título do vídeo em caixa alta (`HOW CORONARY STENTS WORK`), por cima do último quadro.
- A tabela frase a frase com os tempos está em `decupagem/pixel-anatomia-camadas/decupagem.md`.

## 2. A câmera
- **Cortes:** nenhum.
- **20 movimentos rápidos**, jeito dominante **smooth**, freada de ~0.17 s.
- **Parada 43%** do tempo; o maior trecho parado tem 1.5 s.
- A curva quadro a quadro está em `referencia-curva.json` (câmera medida: `createMeasuredDolly`).
- **Os planos:** só o corte, mas com a câmera bem mais ativa que nos outros da família: 20 movimentos em 25 s, parada só 43% do tempo, com zoom entrando e saindo das camadas. Mediana de 8 quadros por movimento.

## 3. O visual
- **Paleta medida:** `#101d2a`, `#d8a29b`, `#66061c`, `#8d6f67`, `#a1213c`.
- **O estilo:** pixel art em 2D, corte anatômico com as camadas em faixas de cor, sobre fundo azul-noite com estrelas. Sem sombra e sem luz direcional: o volume vem do contorno e do pontilhado.
- **O personagem:** não há, com uma exceção: quando a cena precisa de contexto humano, entram bonecos planos de perfil, desenhados bem mais simples que o órgão (cabeça oval, sem rosto, corpo em bloco).
- **O cenário:** um só — o corte. O que muda é o que entra nele de fora (agulha, balão, malha, sonda) e o quanto a câmera se aproxima.

## 4. Como cada coisa entra
- **Como entra:** o objeto entra pela borda do quadro, em linha reta, e trabalha no centro. A malha do stent se expande em cerca de 8 quadros; o balão infla em cerca de 12. Nada aparece do nada.
- **Quando entra:** o rótulo vem **antes** do movimento, não depois: ele nomeia a etapa e então ela acontece.

## 5. Os textos na tela
- **Legenda:** 1 palavra(s) por vez, topo em 1270 px, letra ~96 px, `#ffffff` com contorno `#000000`, destaque `#ffd21f`.
- **Os textos:** rótulo de etapa em caixa preta com texto amarelo, no canto superior esquerdo, a cerca de 2% da altura. Mostradores pequenos (manômetro, relógio) no canto direito durante o procedimento. Linha de medida fina, tipo paquímetro, quando é preciso mostrar o estreitamento. A legenda falada tem de 2 a 3 palavras.

## 6. O som
- **Volume da referência:** -14.2 LUFS (o nosso vai a -14). **Música por baixo:** não.
- **O som:** aqui há efeito ligado ao movimento (40% a 75% dos movimentos têm um ataque junto), diferente do duelo. São estalos curtos no encaixe e no inflar. Volume de −13,4 a −14,2 LUFS.

## 7. Como montar no motor
- **O kit tem:** o que vem do `pixel-duelo-cardio` (fundo estrelado, moldura, barra). **Falta** a peça própria desta família: o corte de vaso ou de tecido em camadas, com o sangue correndo, e o rótulo amarelo que se escreve.
- **Conferir:** a parede do corte precisa aparecer (nada de órgão transparente); o objeto que entra não pode atravessar a parede sem motivo; e o close extremo não pode durar mais que 2 s, senão o vídeo perde o fio.
