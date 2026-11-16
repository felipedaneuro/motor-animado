# Receita: lowpoly-drone

O "você" é uma coisa que viaja (uma molécula, um remédio, um impulso nervoso, uma célula) e a câmera de drone segue o caminho dela por **estações** ao longo do chão. Mundo 3D low-poly com cara de brinquedo, num ambiente neutro e natural com a paleta do tema, nada de corte seco. Medido nos 16 vídeos do canal de origem e testado com o exemplo da cafeína.

## O teste do "você" (antes de escrever)
1. **Ele viaja?** Passa por 4 a 6 lugares. Cada lugar vira uma estação.
2. **Ele se transforma ou faz algo acontecer?** É o mecanismo, a parte que o espectador não sabia.
3. **Tem uma pessoa comum no começo?** Um personagem numa situação do dia a dia.
Se uma falhar, escolha outro "você".

## O roteiro (~42 frases, ~2:25, ~2.500 caracteres; o teste curto tem 6)

| Bloco | O que faz | Exemplo em saúde |
|---|---|---|
| Gancho | "Se você fosse..." + um personagem numa situação comum | "Se você fosse uma molécula de paracetamol, estaria no comprimido que a Ana tomou pra dor de cabeça." |
| Origem | De onde vem e para que serve de verdade | "Você foi feito pra baixar febre e aliviar dor." |
| O caminho | Entrada → sangue → órgão, frases curtas | "Você desce pelo estômago, cai no sangue e chega no fígado." |
| O mecanismo | Uma metáfora visual + o nome técnico como recompensa ("Esse é o...") | "...como uma tesoura cortando o sinal. Essa é a inibição da COX." |
| O que a pessoa sente | O efeito mostrado na tela | "Em meia hora, a dor de cabeça da Ana some." |
| Os riscos | Dose alta, misturas, longo prazo | "Mas o fígado tem limite: passar da dose machuca ele." |
| Quando procurar ajuda | Sinais de alerta | "Tomou demais? Procure um pronto-socorro, mesmo sem sintoma." |
| Fecho + CTA | Resumo de uma linha, "Parabéns! Você desmontou...", "comente <palavra>" | "Comente FÍGADO e segue o canal." |

Frases curtas, uma ideia cada, e cada frase com algo que dê para **mostrar**. O roteiro sai sem marcações, uma frase por linha. As regras de cuidado vêm do `perfil.json` (`care_rules`).

## O visual
- Low-poly facetado (`flat_shading`) num mundo de dia, neutro e natural (`themedWorld(cena, style)`): campo com morros,
  árvores, pedras, flores e nuvens, ou cidade com prédios baixos.
- **O tema escolhe as cores** pelo assunto do vídeo, em `estilo-ajustes.json` da pasta do vídeo: `{"theme": "saude"}`.
  | Tema | Para quê | Mundo |
  |---|---|---|
  | `natural` (padrão) | quase tudo | campo, céu azul, verdes e terra |
  | `saude` | corpo, remédio, hábitos | parque claro, menta, branco, azul calmo |
  | `financas` | economia, trabalho, consumo | cidade bege, dourado, verde-dinheiro |
  | `tecnologia` | celular, internet, ciência | cidade cinza-azulada, azul e ciano |
  | `infantil` | escola, família, crianças | campo pastel |
  | `noite` | o visual antigo | noite psicodélica, malha neon, mandala |
  Um tema novo é só mais uma entrada em `themes` no `estilo.json`; um ajuste fino vai por cima no `estilo-ajustes.json`
  (ex.: `{"theme": "saude", "world": {"ground": "#d8eadf"}}`).
- Peças e personagens podem combinar com o tema: `accent(style, k)` devolve a cor de destaque k do tema.
- **Estações** a cada 12 unidades no eixo x: a situação, a origem, o corpo, o mecanismo, os efeitos, os riscos, o final.
- **Câmera de drone**: `approach` para aproximar, `fly` para viajar entre estações (com arco), balanço leve sempre. Nada de `cut`.
- **Etiqueta amarela** no topo quando o nome técnico é falado; **legenda de uma palavra por vez** (destaques em amarelo); **cards** brancos com ícone ("⏱️ 20 MIN") no terço de cima.
- Final em 4K vertical a 60 qps.

## Como cada coisa entra
- Peças entram com `pop(t, t0)` (pulinho) na palavra que fala delas; saem com `pop(t, t0, t1)`. Nada some de uma vez.
- Objetos trocam de lugar só com a câmera longe, no começo de um `fly`.
- Estações parecidas com cores diferentes (o estômago rosa parecia o cérebro e virou laranja).

## O som
- Whoosh em cada `approach`/`fly`, pop em cada etiqueta e card (saem sozinhos do plano.js).
- Sons da história na lista `SOUNDS` do plano.js (glub, lock, thump, heartbeat, siren, party...).
- Música: acordes calmos (Ré menor, Si bemol, Fá, Dó), 2,8 s cada, a 0,07; efeitos a 0,35; −14 LUFS.

## O que os números do canal de origem ensinaram
- Personagem e situação comum no gancho rendem mais que tema de nicho sem personagem.
- Um post a cada ~24 h.
