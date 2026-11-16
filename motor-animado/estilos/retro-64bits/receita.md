# Receita: retro-64bits

**Estilo próprio** da era 64 bits, com o mesmo **busto em pixel** do `retro-32bits` no canto da tela e o mesmo
**cenário desenhado em pixel** atrás (céu, serra, mata, moita e chão em camadas pintadas). A diferença para o
`retro-32bits` é o acabamento: resolução interna maior, imagem macia e sem contorno, que deixa o pixel do cenário com
a borda suave em vez de dura. As cores saem do tema (`estilos/_temas.json`).

## O que ele faz
- **Apresentador** (`presenter(cena, style)`): poses, rosto e acessórios iguais aos do retro-32bits (ver a receita dele).
- **Cenário em pixel** (`pixelWorld`, do `motor/cenario.js`) e **objetos em pixel** (`pixelSprite`): iguais aos do
  `retro-32bits` — ver a receita dele para as camadas, as distâncias e os ícones prontos.
- **Facetado** (`stage.flat_shading`, `retro.smooth_normals: false`): vale para o que o vídeo modelar em 3D; o cenário
  e o busto são desenhos e não têm faceta.
- **Busto em 56 por 64 pixels**, ampliado sem suavizar: fica nítido por cima de qualquer mundo.
- **Mascote de cabeça grande**, se o vídeo quiser um: `import { mascot } from "./estilo/kit.js"`.
- **Resolução interna de 540x960**, ampliada com suavização e um embaçado leve; cor de 18 bits com pouco pontilhado.
- Sem contorno (o desenho de referência não tem); legenda arredondada (Fredoka, 104 px).

## Como usar
- Sozinho: `montar.py ... --estilo retro-64bits` (o exemplo do Doutor Cérebro vem junto).
- Trocar o tema: `{"theme": "saude"}`. Por cima de outro estilo: `{"extends": "palito"}` (só o tratamento visual vai junto).
- A saga (`saga-64`) se apoia neste estilo, mas continua lisa e redonda: os números dela valem por cima.

## Ajustes finos (estilo-ajustes.json)
- Outro apresentador: `{"bust": {"hair": "#1d1a18", "hairStyle": "curto"}}`. Mais macio: `{"retro": {"blur": 0.8}}`.
- Liso em vez de facetado: `{"stage": {"flat_shading": false}, "retro": {"smooth_normals": true}}`.

## Conferir
- Medido no exemplo do Doutor Cérebro (voz do Mac): rascunho em 0,5 min, 0 cortes, −14,0 LUFS.
