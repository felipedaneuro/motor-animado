# O som e a mixagem

## Efeitos e música em código (sem licença para conferir)
`ferramentas/py sons.py cena` grava `som/efeitos.wav` e `som/musica.wav`:
- um **whoosh** em cada movimento da câmera do `plano.js` (curto no `approach`, longo no `fly`, nada no `cut`);
- um **pop** em cada etiqueta e card;
- os **sons da história** da lista `SOUNDS` do `plano.js`: `{sound, at, volume, options}`.

| Som | Para quê | options |
|---|---|---|
| `glub` | líquido, engolir, bolha | `duration` |
| `lock` | encaixe, receptor, trava | — |
| `thump` | impacto, batida grave, queda | `duration` |
| `heartbeat` | coração | `beats`, `interval` |
| `rise` | subir/descer, entrada, saída | `duration`, `start_hz`, `end_hz` |
| `siren` | emergência | `duration` |
| `sparkle`, `shimmer` | algo aparece, brilho, final | `duration` |
| `party` | comemoração | — |
| `drone` | tensão, noite, ambiente | `duration`, `pitch` |
| `snip` | corte, tesoura | — |
| `portal` | transformação | `duration`, `pitch` |
| `hiss` | chiado, ar, spray | `duration` |
| `whoosh`, `pop` | os mesmos da câmera e das etiquetas | `duration` / `start_hz`, `end_hz` |

Volumes dos whooshes e pops e a música (acordes e duração de cada um) vêm do `estilo.json` (seção `sound`). Sem música: `"music": null`.

## Mixagem
`ferramentas/py mixar.py video.mp4 voz/voz.wav --efeitos som/efeitos.wav --musica som/musica.wav --saida video-final.mp4`
- Voz na frente, efeitos a 0,35 e música a 0,07 (`--efeitos-vol`, `--musica-vol`), -14 LUFS em duas passadas, pico abaixo de -1,5 dB, e um ajuste fino medido no arquivo pronto.
- `--acabamento filmado` dá brilho suave, vinheta e grão (o motor Blender já faz isso no `finalizar.py`).

## Amostra (o que não dá pra sintetizar: risada, aplausos, vinheta)
Risada de platéia, aplausos e vinhetas de abertura não saem de uma fórmula; são gravações. Um evento de `SOUNDS` com
`"sound": "amostra"` toca um `.wav` da pessoa no tempo exato, junto dos outros sons:
```js
export const SOUNDS = [{ sound: "amostra", arquivo: "som/amostras/risada-curta.wav", at: T.piada1, volume: 0.6 }];
```
- `arquivo` é relativo à pasta do vídeo (ponha os `.wav` em `som/amostras/`).
- Precisa ser **16 bits** (qualquer taxa e qualquer número de canais; o `sons.py` reamostra e mistura pra mono). Para converter:
  `ffmpeg -i original.mp3 -ar 48000 -ac 1 -sample_fmt s16 som/amostras/risada-curta.wav`.
- A amostra é sempre **sua** (gravada ou de biblioteca com licença, nunca baixada sem checar — regra 4 do SKILL.md); anote a
  fonte e a licença no `registro.md`.

## Música ou efeito de biblioteca (opcional)
Biblioteca de áudio do YouTube Studio e Pixabay têm sons grátis; confira a licença de cada um e anote no `registro.md`. Junte com o ffmpeg num `som/efeitos.wav` antes da mixagem, ou use `"sound": "amostra"` acima para encaixar no tempo exato de um evento da história.

**O Claude não ouve o vídeo**: ele vê quadros e números. A pessoa assiste com som antes de postar.
