// plano.js do exemplo do atlas-anatomico: a câmera fica de frente e quase parada (a referência mede 95% sem
// movimento, sem corte nenhum); quem conta a história são as etiquetas de chamada, que entram e saem por frase.
import timing from "./tempos.js";
import { clock } from "./motor/nucleo.js";

const { phraseStart, phraseEnd, duration } = clock(timing);

export const T = {
  first: phraseStart(0),
  last: phraseStart(timing.phrases.length - 1),
  end: duration,
};

// CALLOUTS: a marca do estilo. point é o ponto da estrutura no mundo; side diz de que lado da tela fica o texto.
// os pontos são marcados no próprio modelo (dentro: model), então a etiqueta segue o giro
export const CALLOUTS = [
  { at: phraseStart(0), until: phraseEnd(1), text: "Aorta", point: [0.05, 0.62, 0.05], side: "right" },
  { at: phraseStart(2), until: phraseEnd(3), text: "Ventrículo esquerdo", point: [-0.2, -0.3, 0.2], side: "left" },
  { at: phraseStart(3), until: phraseEnd(4), text: "Artéria coronária", point: [0.16, 0.05, 0.3], side: "right" },
  { at: phraseStart(4), until: duration, text: "Átrio direito", point: [0.28, 0.3, 0.12], side: "right" },
];

export const LABELS = [];
export const CARDS = [{ at: T.last, until: duration + 1, icon: "🔖", text: "SALVE PARA REVISAR", y: 1500 }];
export const HIGHLIGHTS = [timing.phrases[0].words[0].word];

export const CAMERA = {
  start: { position: [0, 0.45, 2.7], target: [0, 0.35, 0] },
  moves: [{ kind: "approach", at: phraseStart(2), position: [0.3, 0.4, 2.3], target: [0, 0.3, 0] }],
};
