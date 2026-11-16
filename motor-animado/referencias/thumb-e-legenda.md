# Thumb e legenda do post

## Thumb (1080x1920, em `thumb/thumb-<nome>.png`)
Um padrão que funciona em canais desse formato, com cinco elementos:
1. **Fundo**: o momento mais forte do vídeo.
2. **Lupa**: um círculo com borda grossa mostrando o mecanismo.
3. **Texto do personagem**, curto e em caixa alta ("A ANA TOMOU").
4. **O assunto**, bem grande, em amarelo `#ffd21f`.
5. **Selo** com uma pergunta e um emoji ("FAZ MAL? 😱"). Embaixo, opcional: "O QUE ACONTECE NO CORPO?".

Como fazer:
- As imagens saem da própria cena, sem legenda nem cards. Motor web: escolha os tempos no mapa e rode o `mapa.py --instantes <t_fundo>,<t_lupa>` numa cópia da cena sem textos (comente o `overlay(...)` no `cena.js` da cópia). Motor Blender: `blender.py --still <quadro> --samples 96 --escala 100 --saida thumb`.
- Junte com o Pillow (do `.venv`): o fundo, a lupa recortada em círculo com borda branca e preta, os textos em fonte grossa (Arial Black, `/System/Library/Fonts/Supplemental/Arial Black.ttf`) com contorno preto grosso.
- Abra a imagem e confira se tudo se lê numa miniatura de 270 px.

## Legenda (`descricao.txt`, uma parte para Reels/Shorts e outra para TikTok)
- **Primeira linha**: um gancho curto ou uma pergunta com o personagem. Nunca abra com um parágrafo.
- 2 ou 3 linhas com o mecanismo e o principal cuidado (em saúde: quando procurar ajuda).
- O CTA com a palavra: "Comenta <PALAVRA> se quer ver outro assunto desmontado 👇".
- Em saúde: "Conteúdo educativo. Não substitui consulta médica."
- De 8 a 10 hashtags no fim. No TikTok, tudo num parágrafo curto, com menos hashtags.
