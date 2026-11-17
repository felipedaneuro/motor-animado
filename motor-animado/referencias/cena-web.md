# Como escrever a cena no motor web (three.js + HyperFrames)

Uma cena tem dois arquivos, na pasta `cena/js/` do vídeo. O `montar.py` copia o exemplo do estilo na primeira vez.

| Arquivo | O que tem | Quem lê |
|---|---|---|
| `plano.js` | **Quando** cada coisa acontece e **onde** a câmera vai: `T` (tempos-chave), `STATION`, `LABELS`, `CARDS`, `TICKER`, `HIGHLIGHTS`, `CAMERA`, `SOUNDS` | a cena, a legenda e o `sons.py` (pelo Node) |
| `cena.js` | **O que** aparece: as estações em 3D, os personagens e como se mexem | o HyperFrames |

O `plano.js` não importa three.js, de propósito: assim o Node lê os tempos e o `sons.py` põe cada whoosh e cada pop sem adivinhar nada.

## plano.js
- **Tempos-chave** saem da voz: `wordStart(i, "palavra", n)` é quando começa a n-ésima palavra que começa com "palavra" na frase i (a 1ª frase é a 0; sem acento, sem maiúscula). `phraseStart(i)` e `phraseEnd(i)` são o começo e o fim da frase.
- **LABELS**: `{at, until, title, subtitle, point?}`. Sem `point`, a etiqueta fica no topo; com `point: [x, y, z]`, ela segue esse ponto 3D na tela.
- **CARDS**: `{at, until, icon, text, x?, y?}` (balão com ícone). Com `image` em vez de `icon`, o card mostra um recorte jornalístico real
  (print, meme, infográfico, manchete): `{at, until, image, text?, full?}`. Sem `full`, fica no balão (`media`, no ponto `x/y`, padrão
  centro); com `full: true`, cobre a tela inteira (corte seco pra manchete/infográfico/tweet, como o "quadro de recortes" dos
  telejornais) e `text` vira a legenda da fonte, embaixo. `image` é um caminho **dentro de `cena/`** (o navegador resolve relativo
  ao `index.html`): ponha o arquivo em `cena/imagens/<nome>.png` e use `"image": "imagens/<nome>.png"` — nunca um caminho absoluto
  nem relativo à pasta do vídeo (essa é a pasta de `som/amostra`, ver `referencias/som.md`, uma base diferente). Sempre um print
  feito por você ou com licença, nunca baixado sem checar a fonte (regra 4 do SKILL.md). O y padrão (cards sem imagem) vem do
  estilo (terço de cima).
- **TICKER** (opcional): lista de `{at, until, text, tag?}`, a chamada fixa embaixo (chyron/"breaking news"). `tag` é a tarja
  colorida à esquerda ("AO VIVO", "URGENTE", o nome do quadro); `text` corre da direita pra esquerda se não couber na tela.
  As cores e o tamanho vêm de `estilo.json` (seção `ticker`); sem essa seção, nenhum ticker aparece mesmo se `TICKER` existir.
- **CAMERA**: `{start: {position, target}, moves: [{kind, at, position, target, duration?}]}`. `approach` aproxima, `fly` viaja com arco, `cut` troca seco (só se o estilo corta).
- **SOUNDS**: `{sound, at, volume, options}` com os sons do `sons.py` (glub, lock, thump, heartbeat, siren, sparkle, party, drone, shimmer, snip, portal, rise, hiss).

## cena.js
- Exporta `createScene(canvas, root)`, que monta tudo **uma vez** e devolve `draw(t)`.
- Cada estação é uma função `buildAlgo(scene)` que monta as peças e devolve `update(t)`. O `draw(t)` chama todas.
- Do motor: `createStage` (palco do estilo), `createDrone`/`createMeasuredDolly` (câmera), `createOverlay` (legenda, etiquetas, cards), `puppet` + `POSES` + `blendPose` (bonecos), `box`, `ball`, `tube`, `piece`, `link`, `material`, `glow`, `lightUp`, `rainbow` (peças), `between`, `pop`, `path`, `seeded`, `blink` (tempo).
- Do estilo: o que estiver em `estilo/kit.js` (no lowpoly-drone: `themedWorld`, `accent`, `molecule`, `confetti`; o tema vem do `estilo-ajustes.json`).
- Do motor, para qualquer estilo: `mundo.js` (`dayWorld`, `studio`, `accent`: o mundo de dia nas cores do tema) e
  `mascote.js` (`presenter`/`mascot`: o apresentador de cabeça grande, com poses, rosto que muda e acessórios).
- Temas de cor e de mundo: `estilos/_temas.json`; o vídeo escolhe com `{"theme": "<nome>"}` no `estilo-ajustes.json`.

## Regras que evitam retrabalho
- **Tudo é função de t.** Nada de `Math.random` (use `seeded(i)`), relógio ou variável que acumula entre quadros: o HyperFrames pede os quadros fora de ordem e em vários processos.
- **Nada some de uma vez.** Entrar e sair com `pop(t, t0, t1)`. Sumir de repente vira corte seco no `conferir.py`.
- **Objetos trocam de lugar só com a câmera longe**, no começo de um `fly`.
- **O que importa fora das faixas de texto:** a legenda e a etiqueta têm altura fixa no estilo; o mapa de cenas mostra quando algo fica atrás delas.
- **Estações parecidas com cores diferentes** (o estômago rosa parecia o cérebro e virou laranja).
- **Um arquivo do kit para mudar só neste vídeo?** Copie para `kit/` na pasta do vídeo e mude lá: o `montar.py` usa a cópia. Ajustes pequenos de estilo (cor do fundo, tamanho da legenda) vão em `estilo-ajustes.json` na pasta do vídeo.

## Visual retrô (por cima de qualquer cena)
Com uma seção `"retro"` no estilo (os estilos `retro-32bits` e `retro-64bits`), o palco renderiza a cena em baixa resolução e passa por `retro.js`: sombreado suave ou facetado, cor de 15 a 18 bits, pontilhado, ampliação com ou sem filtro, embaçado, vértices presos na grade e contorno de 1 pixel (`outline`). Não precisa mudar nada no `cena.js`. Peças com textura (o personagem plano) não são suavizadas.

## Exames e cérebro em pixel (vídeos de neuro e neurovascular)
Peças prontas em `./cena/js/motor/exames.js` e `./cena/js/motor/cerebro-perfil.js`, desenhadas numa camada SVG por cima
da cena (`createSvgLayer` de `pixelsvg.js`). Não redesenhe tomografia, angiografia ou cérebro de perfil à mão: use estas.
Todas seguem a convenção radiológica (o lado direito do paciente à esquerda da tela) e recebem o lado do PACIENTE.

```js
import { createSvgLayer, progress } from "./motor/pixelsvg.js";
import { axialCT, ctAngiography, angiographyCompare, pulseAt } from "./motor/exames.js";
import { brainProfile } from "./motor/cerebro-perfil.js";
const draw = createSvgLayer(root, { label: "exames" });
const box = { x: 210, y: 700, width: 660, height: 780 };          // onde a peça fica na tela 1080x1920
// dentro do draw(t) da cena, uma por frase:
draw(axialCT({ box, findings: [{ type: "epidural", side: "D", amount: progress(t, T.lente, T.lente + 0.6) }] }));
draw(ctAngiography({ box, occlusion: { artery: "M1", side: "E" }, arrowAmount: progress(t, T.oclusao, T.oclusao + 0.3), pulse: pulseAt(t, T.oclusao) }));
draw(angiographyCompare({ box: { x: 60, y: 700, width: 960, height: 760 }, side: "E" }));
draw(brainProfile({ box: { x: 120, y: 700, width: 840, height: 640 }, side: "E", infarct: { territory: "acm", core: 0.6, penumbra: progress(t, a, b) } }));
```

- `axialCT`: `level` "ventricular" ou "basal"; achados `epidural`, `subdural`, `intraparenquimatosa`, `hsa`, `isquemia`
  (com `territory` "acm", "aca" ou "acp") e `acm-hiperdensa` (só no basal). `amount` de 0 a 1 faz o achado crescer.
- `ctAngiography`: oclusão em `ICA`, `M1`, `M2`, `A1`, `P1` ou `basilar`, com seta e quadrado que pulsa no ponto exato.
- `angiography` / `angiographyCompare`: angiografia de frente, vasos escuros no fundo cinza (como na subtração).
- `brainProfile`: `side` "E" mostra o hemisfério esquerdo (frente à esquerda da tela); `lobes`, `lobeLabels`, `highlight`
  e `infarct` (núcleo roxo e penumbra âmbar). Para estilos em 3D, o cérebro continua sendo `detailedBrain` de anatomia.js.
- Tudo é função de t: o mesmo quadro sai sempre igual. O pulso é de 1 por segundo (o limite é 1,5).
- Para ver todas as variações: `motores/web/vitrine-exames.html` (servida por um servidor local; `?painel=N` mostra uma).
