# Receita: med3d-hud-rpg

Cena 3D de hospital com uma camada de menu de videogame por cima: o caso clínico vira tela de RPG. O mais cortado dos catorze.

Cena 3D de hospital com uma camada de menu de videogame por cima: caixas de diagnóstico com ícone, texto em pixel e cor de destaque, como se o caso clínico fosse a tela de um jogo.

> **Atenção ao motor.** A referência é 3D realista (pessoa, pele, luz de ambiente). Este estilo nasceu no motor
> `web`, que é estilizado: aqui ele entrega o enquadramento, a interface e o ritmo medidos, não o realismo.
> Para realismo de verdade, use o motor Blender (`realista-corpo`) com os números desta ficha.


Decupada de modelos/recortes/med3d-hud-rpg.mp4 (25.03 s a 30 qps) pelo `decupar.py`. Os números vieram da medida e as partes de olhar já estão completadas (folhas conferidas quadro a quadro em `decupagem/med3d-hud-rpg/folhas/` e `tomadas/`). Da referência vem a fórmula; frases, personagens e assunto são sempre da pessoa.

## 1. A fórmula do roteiro
- **8 frases**, **152 palavras por minuto**.
- **Como abre:** o paciente em quadro e, por cima, uma **caixa de menu de videogame** com a pergunta (`ELE CHEGOU ASSIM. O QUE ELE TEM?`), em fonte de pixel sobre barra colorida.
- **O que se repete:** cada achado vira uma linha de menu com ícone e cor, empilhando como numa tela de diagnóstico de RPG (`HIPERGLICEMIA`, `ACIDOSE METABÓLICA`).
- **A virada:** quando o menu fecha e a cena volta sozinha, com o paciente no leito e a pergunta devolvida ao espectador.
- **Como termina:** faixa em pixel com `SUA CONDUTA NOS COMENTÁRIOS` e o leito ao fundo.
- A tabela frase a frase com os tempos está em `decupagem/med3d-hud-rpg/decupagem.md`.

## 2. A câmera
- **Cortes:** 1.30 s, 2.77 s, 4.40 s, 5.13 s, 6.13 s, 7.17 s, 9.03 s, 13.77 s, 18.60 s, 19.50 s, 20.00 s, 22.80 s.
- **1 movimentos rápidos**, jeito dominante **expo_out**, freada de ~0.17 s.
- **Parada 96%** do tempo; o maior trecho parado tem 2.77 s.
- A curva quadro a quadro está em `referencia-curva.json` (câmera medida: `createMeasuredDolly`).
- **Os planos:** 12 cortes em 25 s — o mais cortado dos catorze —, mas com a câmera parada 96% do tempo dentro de cada plano. Corta muito, mexe pouco.

## 3. O visual
- **Paleta medida:** `#53565d`, `#a8c1c4`, `#4c3c42`, `#333447`, `#fbfcf9`, `#8b8f88`, `#686264`, `#b2bcb6`.
- **O estilo:** cena 3D de hospital com modelos estilizados (quase low-poly nas roupas e no rosto) e iluminação realista de ambiente — luz fria de teto, sem sombra dura. Cores reais: verde do campo cirúrgico, azul da luva, bege da pele.
- **O personagem:** pessoas 3D, mostradas em pedaços (mãos, braço, rosto), raramente de corpo inteiro. O espectador é quem atende: a câmera fica do lado de quem decide.
- **O cenário:** um só — o box de emergência — visto de ângulos diferentes.

## 4. Como cada coisa entra
- **Como entra:** as etiquetas e os cartões **deslizam de baixo para cima** e somem por opacidade, em cerca de 6 a 10 quadros. A cena 3D não corta dentro do movimento.
- **Quando entra:** a etiqueta vem junto com a palavra do achado e fica até o achado seguinte.

## 5. Os textos na tela
- **Legenda:** 3 palavra(s) por vez, topo em 1511 px, letra ~87 px, `#aaced8` com contorno `#252f39`, destaque `#d6bf6b`.
- **Os textos:** caixas de menu em pixel com barra de título colorida e ícone, por cima da cena 3D; legenda grande (87 px) em caixa alta no rodapé (1511 px de 1920), em azul-claro com destaque dourado. A mistura de 3D realista com fonte de pixel é a marca deste.

## 6. O som
- **Volume da referência:** -14.0 LUFS (o nosso vai a -14). **Música por baixo:** sim.
- **O som:** música por baixo bem abaixo da fala (−8,5 a −11,5 dB) e efeitos ligados aos cortes e aos movimentos (de 16% a 64% deles). Volume de −14,0 a −14,1 LUFS.

## 7. Como montar no motor
- **O kit tem:** só o básico. **Falta** a caixa de menu em pixel por cima da cena 3D, com barra de título, ícone e linhas que empilham.
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
