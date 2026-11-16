// plano.js do exemplo do vetor-plano-medico: a câmera fica de frente, com a silhueta inteira no quadro, e os
// rótulos em caixa escura marcam o ponto de cada estrutura.
import timing from "./tempos.js";
import { clock } from "./motor/nucleo.js";

const { phraseStart, phraseEnd, duration } = clock(timing);
const f = (i) => phraseStart(Math.min(i, timing.phrases.length - 1));

export const T = { first: f(0), last: f(timing.phrases.length - 1), end: duration };

export const TAGS = [
  { at: f(0), until: phraseEnd(1), text: "Alvo no cérebro", point: [-0.16, 1.2, 0.1], side: "right" },
  { at: f(2), until: phraseEnd(3), text: "Feixes convergentes", point: [-1.9, 1.2, 0.1], side: "left" },
  { at: f(4), until: duration, text: "Dose máxima no centro", point: [-0.16, 1.2, 0.1], side: "right" },
];

export const LABELS = [];
export const CARDS = [];
export const HIGHLIGHTS = [timing.phrases[0].words[0].word];
export const CAMERA = { start: { position: [0, 0.4, 9.5], target: [0, 0.4, 0] }, moves: [] };
