# Receita: med3d-decisao

Cena 3D com interface de decisão clínica por cima: o caso vira um jogo de três escolhas. É o exemplar mais completo dos três: 12 frases, fala em 98% do vídeo.

Cena 3D com interface de decisão por cima: o paciente no fundo, cartões de conduta e sinais vitais na frente, um passo de cada vez, como numa simulação clínica.

> **Atenção ao motor.** A referência é 3D realista (pessoa, pele, luz de ambiente). Este estilo nasceu no motor
> `web`, que é estilizado: aqui ele entrega o enquadramento, a interface e o ritmo medidos, não o realismo.
> Para realismo de verdade, use o motor Blender (`realista-corpo`) com os números desta ficha.


Decupada de modelos/recortes/med3d-decisao.mp4 (25.03 s a 30 qps) pelo `decupar.py`. Os números vieram da medida e as partes de olhar já estão completadas (folhas conferidas quadro a quadro em `decupagem/med3d-decisao/folhas/` e `tomadas/`). Da referência vem a fórmula; frases, personagens e assunto são sempre da pessoa.

## 1. A fórmula do roteiro
- **12 frases**, **131 palavras por minuto**.
- **Como abre:** um **cartão branco** no terço inferior, por cima da cena, com uma etiqueta vermelha de urgência, a queixa em caixa alta e o contrato do vídeo em uma linha (`3 decisões. Você é o médico.`). O paciente já está em quadro atrás dele.
- **O que se repete:** achado → etiqueta → decisão. Cada achado entra como uma **etiqueta branca pequena** presa ao ponto do corpo (idade, alérgeno, placas, lábio inchado, chiado), uma de cada vez; depois vem o cartão de decisão com as opções.
- **A virada:** a escolha. O cartão mostra as alternativas, um círculo conta 3 → 2 → 1, a certa fica verde com ✓ e a errada apaga, e aparece a etiqueta vermelha do que daria errado (`RISCO DE ARRITMIA FATAL`).
- **Como termina:** a faixa de sinais vitais no topo volta ao normal (de 80/50, 88%, 132 para 112/70, 97%, 98) e um cartão resume as decisões numeradas, com `Salve pra revisar no plantão` e um botão de envio para um colega.
- A tabela frase a frase com os tempos está em `decupagem/med3d-decisao/decupagem.md`.

## 2. A câmera
- **Cortes:** 3.00 s, 8.50 s, 9.57 s, 10.00 s, 14.47 s, 17.53 s, 20.00 s.
- **11 movimentos rápidos**, jeito dominante **expo_out**, freada de ~0.13 s.
- **Parada 79%** do tempo; o maior trecho parado tem 4.97 s.
- A curva quadro a quadro está em `referencia-curva.json` (câmera medida: `createMeasuredDolly`).
- **Os planos:** plano médio do paciente na maca, close do rosto, close das mãos trabalhando e plano do monitor. Corte seco entre eles, sem transição.

## 3. O visual
- **Paleta medida:** `#fafbfa`, `#5d6c6c`, `#687776`, `#413c40`, `#417f7d`, `#8c8584`, `#a7afb0`, `#b0b0af`.
- **O estilo:** cena 3D de hospital com modelos estilizados (quase low-poly nas roupas e no rosto) e iluminação realista de ambiente — luz fria de teto, sem sombra dura. Cores reais: verde do campo cirúrgico, azul da luva, bege da pele.
- **O personagem:** pessoas 3D, mostradas em pedaços (mãos, braço, rosto), raramente de corpo inteiro. O espectador é quem atende: a câmera fica do lado de quem decide.
- **O cenário:** um só — o box de emergência — visto de ângulos diferentes.

## 4. Como cada coisa entra
- **Como entra:** as etiquetas e os cartões **deslizam de baixo para cima** e somem por opacidade, em cerca de 6 a 10 quadros. A cena 3D não corta dentro do movimento.
- **Quando entra:** a etiqueta vem junto com a palavra do achado e fica até o achado seguinte.

## 5. Os textos na tela
- **Legenda:** 3 palavra(s) por vez, topo em 1136 px, letra ~41 px, `#fde7f0` com contorno `#2d60dd`, destaque `#ffd21f`.
- **Os textos:** faixa de estado no topo (queixa à esquerda, contador de decisões à direita, que vai ficando verde); faixa de sinais vitais logo abaixo, em vermelho quando alterado e verde quando corrigido; etiquetas brancas presas por linha curta ao ponto do corpo; cartões brancos no terço inferior. A legenda falada tem 3 palavras.

## 6. O som
- **Volume da referência:** -14.0 LUFS (o nosso vai a -14). **Música por baixo:** sim.
- **O som:** música por baixo bem abaixo da fala (−8,5 a −11,5 dB) e efeitos ligados aos cortes e aos movimentos (de 16% a 64% deles). Volume de −14,0 a −14,1 LUFS.

## 7. Como montar no motor
- **O kit tem:** só o básico. **Falta** tudo o que define este estilo: a faixa de estado com contador, a faixa de sinais vitais, o cartão de decisão com contagem regressiva e a etiqueta presa ao corpo. A etiqueta com linha de chamada já existe pronta no `atlas-anatomico` (`createCallouts`) e pode ser reaproveitada.
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
