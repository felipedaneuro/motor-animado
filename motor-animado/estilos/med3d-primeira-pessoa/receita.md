# Receita: med3d-primeira-pessoa

Cena 3D em primeira pessoa, do ponto de vista de quem atende. Sem interface: só a cena e a legenda. É o mais movimentado dos catorze.

Cena 3D em primeira pessoa, do ponto de vista de quem está atendendo: mãos no centro do quadro, ambiente de hospital em volta e legenda em caixa alta na parte de baixo.

> **Atenção ao motor.** A referência é 3D realista (pessoa, pele, luz de ambiente). Este estilo nasceu no motor
> `web`, que é estilizado: aqui ele entrega o enquadramento, a interface e o ritmo medidos, não o realismo.
> Para realismo de verdade, use o motor Blender (`realista-corpo`) com os números desta ficha.


Decupada de modelos/recortes/med3d-primeira-pessoa.mp4 (25.03 s a 30 qps) pelo `decupar.py`. Os números vieram da medida e as partes de olhar já estão completadas (folhas conferidas quadro a quadro em `decupagem/med3d-primeira-pessoa/folhas/` e `tomadas/`). Da referência vem a fórmula; frases, personagens e assunto são sempre da pessoa.

## 1. A fórmula do roteiro
- **7 frases**, **85 palavras por minuto**.
- **Como abre:** já dentro da cena, em primeira pessoa: as mãos de quem atende no centro do quadro, sem cartão e sem título. A narração entra em 1 s.
- **O que se repete:** um gesto por frase, mostrado de perto. Sem interface: a informação é a própria cena.
- **A virada:** quando o plano abre e mostra o que estava fora do quadro.
- **Como termina:** a cena continua e a narração fecha; sem cartão de resumo.
- A tabela frase a frase com os tempos está em `decupagem/med3d-primeira-pessoa/decupagem.md`.

## 2. A câmera
- **Cortes:** 10.00 s, 11.40 s, 16.00 s, 17.73 s, 20.00 s, 20.33 s.
- **25 movimentos rápidos**, jeito dominante **expo_out**, freada de ~0.17 s.
- **Parada 28%** do tempo; o maior trecho parado tem 0.83 s.
- A curva quadro a quadro está em `referencia-curva.json` (câmera medida: `createMeasuredDolly`).
- **Os planos:** primeira pessoa quase o tempo todo. É o mais inquieto dos 14: parada só 28% do tempo, 25 movimentos em 25 s, 6 cortes. Mediana de 14 quadros por movimento.

## 3. O visual
- **Paleta medida:** `#3c5e65`, `#173031`, `#7a8a85`, `#927b62`, `#88b8ac`, `#678791`, `#9e866c`, `#9b8b8f`.
- **O estilo:** cena 3D de hospital com modelos estilizados (quase low-poly nas roupas e no rosto) e iluminação realista de ambiente — luz fria de teto, sem sombra dura. Cores reais: verde do campo cirúrgico, azul da luva, bege da pele.
- **O personagem:** as mãos de quem atende, e o paciente visto de cima. Nunca se vê o rosto de quem narra.
- **O cenário:** um só — o box de emergência — visto de ângulos diferentes.

## 4. Como cada coisa entra
- **Como entra:** as etiquetas e os cartões **deslizam de baixo para cima** e somem por opacidade, em cerca de 6 a 10 quadros. A cena 3D não corta dentro do movimento.
- **Quando entra:** a etiqueta vem junto com a palavra do achado e fica até o achado seguinte.

## 5. Os textos na tela
- **Legenda:** 3 palavra(s) por vez, topo em 1382 px, letra ~102 px, `#d9dddf` com contorno `#342c28`, destaque `#ffd21f`.
- **Os textos:** só a legenda, grande (102 px), em caixa alta, no terço inferior (1382 px de 1920). Sem etiqueta, sem cartão, sem faixa de estado.

## 6. O som
- **Volume da referência:** -14.1 LUFS (o nosso vai a -14). **Música por baixo:** sim.
- **O som:** música por baixo bem abaixo da fala (−8,5 a −11,5 dB) e efeitos ligados aos cortes e aos movimentos (de 16% a 64% deles). Volume de −14,0 a −14,1 LUFS.

## 7. Como montar no motor
- **O kit tem:** só o básico. **Falta** o essencial deste: uma câmera de mão em primeira pessoa, com o balanço e a imprecisão que a medida mostra (45% do tempo em movimento rápido).
- **Conferir:** o cartão não pode tampar o que ele comenta; os números dos sinais vitais têm que mudar quando a conduta muda; e a decisão errada precisa ficar visível tempo suficiente para a pessoa ler antes de apagar.

## O cenário: dois visuais

O box de emergência inteiro — sala, maca, paciente, médico, soro e monitor — vem de `motor/clinica.js`, por
`clinicRoom(scene, style, { look })`. Não há boneco 3D articulado: as pessoas são desenhos num plano virado para a
câmera, e **maca e paciente vêm no mesmo desenho** (numa maca em 3D com o paciente num plano em pé os dois brigam:
o colchão tapa o corpo e sobra só a cabeça boiando).

- **`look: "palito"`** — formas simples, cores saturadas e traço liso, como o estilo `palito`.
- **`look: "pixel"`** — tudo em pixel art chapada, sem luz e sem névoa, como o cenário do `retro-64bits`.

Quem escolhe é `estilo.json` → `clinic.look`, e a pessoa troca em **Estilo → Personalizar** (campo "Visual da
cena"), junto com a cor da roupa. `clinic` também aceita `parede` e `roupa` para mandar por cima das cores medidas.

O monitor é a única coisa que anda sozinha: a curva de ECG atravessa a tela e volta, a 14 quadros por segundo.
A câmera do exemplo olha para `[0, -0.15, 0]`, não para `[0, 0.8, 0]`: a cena toda fica perto do chão, e com o
alvo alto sobrava metade do quadro de parede vazia.
