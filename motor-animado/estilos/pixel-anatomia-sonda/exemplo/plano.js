// plano.js do exemplo do pixel-arteria-stent: a câmera fica de frente, com o vaso inteiro no quadro; quem conta a
// história é o rótulo da etapa, que se escreve antes de cada coisa acontecer.
import timing from "./tempos.js";
import { clock } from "./motor/nucleo.js";

const { phraseStart, phraseEnd, duration } = clock(timing);

export const T = { first: phraseStart(0), last: phraseStart(timing.phrases.length - 1), end: duration };

// o rótulo da etapa: um por frase, escrito letra a letra ANTES do que ele nomeia
export const PASSOS = timing.phrases.map((frase, i) => ({
  at: Math.max(0, frase.start - 0.3), until: (timing.phrases[i + 1]?.start ?? duration) - 0.1,
  text: ["ARTÉRIA SAUDÁVEL", "A PLACA COMEÇA", "ANOS DEPOIS", "A ARTÉRIA ESTREITA", "MENOS SANGUE PASSA", "O MÚSCULO RECLAMA"][i] || "",
}));

export const LABELS = [];
export const CARDS = [{ at: T.last, until: duration + 1, icon: "🔖", text: "SALVE PARA REVISAR", y: 1540 }];
export const HIGHLIGHTS = [timing.phrases[0].words[0].word];

export const CAMERA = { start: { position: [0, 0, 10.5], target: [0, 0, 0] }, moves: [] };
