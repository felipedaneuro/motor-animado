# Receita: pixel-dungeon-fisiologia

A via bioquímica vira um cenário de masmorra que se monta peça a peça. É o único da família que constrói o cenário em vez de cortar o corpo.

Pixel art de jogo de plataforma: a via bioquímica vira um cenário de masmorra, cada etapa é um bloco ou uma peça que cai no lugar, com título em duas cores no alto e assinatura no rodapé.

Decupada de modelos/recortes/pixel-dungeon-fisiologia.mp4 (25.03 s a 30 qps) pelo `decupar.py`. Os números vieram da medida e as partes de olhar já estão completadas (folhas conferidas quadro a quadro em `decupagem/pixel-dungeon-fisiologia/folhas/` e `tomadas/`). Da referência vem a fórmula; frases, personagens e assunto são sempre da pessoa.

## 1. A fórmula do roteiro
- **5 frases**, **147 palavras por minuto**.
- **Como abre:** título em duas cores no alto (`CASCATA DE COAGULAÇÃO` em branco e vermelho) com uma linha de apoio abaixo, e o cenário de masmorra já montado embaixo. Assinatura `@FELIPEN.MED` no rodapé.
- **O que se repete:** cada etapa da via é um bloco ou uma peça que **cai no lugar** e se encaixa na anterior, como num jogo de plataforma. Cinco frases em 25 s, 147 palavras por minuto, com música por baixo (−2,4 dB abaixo da fala).
- **A virada:** quando as duas vias se encontram no mesmo bloco (o fator X) e a construção vira uma peça só.
- **Como termina:** o cenário montado inteiro na tela, com o título da última etapa (`EVITANDO UMA HEMORRAGIA`) e a assinatura.
- A tabela frase a frase com os tempos está em `decupagem/pixel-dungeon-fisiologia/decupagem.md`.

## 2. A câmera
- **Cortes:** 20.00 s.
- **2 movimentos rápidos**, jeito dominante **linear**, freada de ~0.07 s.
- **Parada 96%** do tempo; o maior trecho parado tem 3.53 s.
- A curva quadro a quadro está em `referencia-curva.json` (câmera medida: `createMeasuredDolly`).
- **Os planos:** um só, de frente, com o cenário inteiro no quadro. Parada 96% do tempo; os dois movimentos medidos são curtos e lineares (5 quadros), acompanhando uma peça que cai.

## 3. O visual
- **Paleta medida:** `#160918`, `#e28288`, `#f0cb6e`, `#0f0916`, `#9e2a40`, `#a54141`, `#4d6087`, `#4c5683`.
- **O estilo:** pixel art de jogo de plataforma: blocos de pedra, tijolo e cristal, paleta de roxo escuro com rosa, amarelo e vermelho. Luz chapada, contorno escuro.
- **O personagem:** não há, com uma exceção: quando a cena precisa de contexto humano, entram bonecos planos de perfil, desenhados bem mais simples que o órgão (cabeça oval, sem rosto, corpo em bloco).
- **O cenário:** um só, que **vai sendo construído** ao longo do vídeo. No fim ele está completo, e é isso que resume a via.

## 4. Como cada coisa entra
- **Como entra:** o objeto entra pela borda do quadro, em linha reta, e trabalha no centro. A malha do stent se expande em cerca de 8 quadros; o balão infla em cerca de 12. Nada aparece do nada.
- **Quando entra:** o rótulo vem **antes** do movimento, não depois: ele nomeia a etapa e então ela acontece.

## 5. Os textos na tela
- **Legenda:** 2 palavra(s) por vez, topo em 301 px, letra ~100 px, `#e6c150` com contorno `#030312`, destaque `#f75c5e`.
- **Os textos:** rótulo de etapa em caixa preta com texto amarelo, no canto superior esquerdo, a cerca de 2% da altura. Mostradores pequenos (manômetro, relógio) no canto direito durante o procedimento. Linha de medida fina, tipo paquímetro, quando é preciso mostrar o estreitamento. A legenda falada tem de 2 a 3 palavras.

## 6. O som
- **Volume da referência:** -14.2 LUFS (o nosso vai a -14). **Música por baixo:** sim.
- **O som:** aqui há efeito ligado ao movimento (40% a 75% dos movimentos têm um ataque junto), diferente do duelo. São estalos curtos no encaixe e no inflar. Volume de −13,4 a −14,2 LUFS.

## 7. Como montar no motor
- **O kit tem:** o fundo e a moldura herdados do duelo. **Falta** o cenário de blocos que se monta peça a peça, que é o que define este estilo.
- **Conferir:** a parede do corte precisa aparecer (nada de órgão transparente); o objeto que entra não pode atravessar a parede sem motivo; e o close extremo não pode durar mais que 2 s, senão o vídeo perde o fio.
