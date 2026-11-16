# Receita: saga-64

Uma **saga de sobrevivência em capítulos**, com cara de jogo da era 64 bits, por cima do visual `retro-64bits` (formas macias e redondas, imagem levemente embaçada, névoa). O corpo vira o mapa do jogo: cada lugar é uma plataforma de fase, o problema é o chefão, e quem assiste aprende a "zerar" a situação.

## O roteiro
- **Capítulos narrados**: "Capítulo um: o vilão nasce." Cada capítulo é um bloco da receita do lowpoly-drone (o vilão nasce · a emboscada · o teste · sobreviver até o socorro · a batalha final · missão cumprida).
- **Emoção na voz**: marcações do ElevenLabs v3 no começo da linha (`[dramatic, low voice]`, `[whispers]`, `[urgent]`, `[triumphant]`), gravando com `voz.py --elevenlabs --modelo eleven_v3`. Elas vão para a voz e nunca para a legenda.
- As frases de cada capítulo seguem as regras de saúde do perfil (mecanismo, sinais, o que fazer, quando procurar ajuda; nunca dose).

## A camada de jogo (motores/web/js/hud.js, configurada no `HUD` do plano.js)
| Peça | Para quê |
|---|---|
| `life` | a barra de vida (ex.: "CÉREBRO"): cai com o problema e enche com a solução |
| `timer` | o cronômetro da história, com um contador (ex.: neurônios perdidos por minuto) |
| `chapters` | as telas de capítulo, no segundo em que o narrador anuncia |
| `mission` | a missão com caixinhas que se marcam na palavra (ex.: S, A, M, U) |
| `inventory` | itens; os proibidos ganham um X vermelho (ex.: nada pela boca) |
| `boss` | a barra de vida do chefão na batalha final |
| `banners` | os avisos grandes ("MISSÃO CUMPRIDA") |

## A lupa (motores/web/js/lupa.js)
Um círculo na tela que mostra de perto um ponto da cena, ligado por uma linha ao lugar de onde vem (como a ilustração médica de referência: o coágulo dentro da artéria). `createLens(stage, {center, radius})` e, depois do `stage.draw()`, `lens(t, {visible, look, from, anchor})`.

## O visual (saga.js)
- `gameWorld(scene, [x das estações])`: plataformas hexagonais de fase com borda verde que pulsa, montanhas e estrelas.
- `detailedBrain(scene, posição)`: córtex com giros e sulcos, fissura no meio, cerebelo, tronco, árvore de artérias por cima e `setDamage(0..1)` para escurecer a região sem sangue.
- Personagens: os bonecos do motor (`puppet`), com acessórios de jogo quando fizer sentido.

## O som
- Vinheta de capítulo (`chapter`), alerta (`siren`), dano ao chefão (`thump`), vitória (`victory`).
- Música mais grave e tensa (Lá menor, Sol, Fá, Sol#), a 0,08.
