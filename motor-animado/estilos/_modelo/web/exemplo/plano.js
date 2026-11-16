// plano.js de partida de um estilo novo: uma aproximação por frase em volta do personagem, no jeito de câmera medido
// (estilo.json, "camera"). Com "sync": "beats" e cortes medidos, a câmera também corta nos segundos da referência.
// Troque pelos tempos-chave e pela câmera do vídeo de verdade (veja referencias/cena-web.md).
import timing from "./tempos.js";
import style from "./estilo.js";
import { clock, orbit } from "./motor/nucleo.js";

const { wordStart, phraseStart, phraseEnd, duration } = clock(timing);

export const T = {
  first: phraseStart(0),
  prop: phraseStart(1),
  last: phraseStart(timing.phrases.length - 1),
  end: duration,
};
export const STATION = { A: 0 };

export const LABELS = [{ at: phraseStart(1), until: phraseEnd(1) + 0.3, title: "EXEMPLO", subtitle: "troque pelo nome técnico" }];
export const CARDS = [{ at: T.last, until: duration + 1, icon: "💬", text: "COMENTE", y: 1530 }];
export const HIGHLIGHTS = [timing.phrases[0].words[0].word];

const target = [0, 1.1, 0];
const approaches = timing.phrases.map((phrase, i) => ({
  kind: "approach", at: phrase.start - 0.15, target,
  position: orbit(target, (i % 2 ? -1 : 1) * (18 + 6 * i), 10 + 3 * (i % 3), 4.2 - 0.25 * (i % 3)),
}));
const cuts = style.sync === "beats" && style.camera.cuts === "measured"
  ? style.reference.cuts.map((at, i) => ({ kind: "cut", at, target, position: orbit(target, 40 - 25 * i, 14, 5) }))
  : [];

export const CAMERA = { start: { position: orbit(target, 25, 14, 5.5), target }, moves: [...approaches, ...cuts] };
export const SOUNDS = [{ sound: "pop", at: T.prop, volume: 0.4 }];
export { wordStart };
