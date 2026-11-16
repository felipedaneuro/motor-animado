// plano.js do exemplo "Estetoscópio" (estilo palito): cada peça entra na palavra que fala dela; a câmera dá uma
// aproximação rápida na peça (sai rápido e freia aos poucos, ver estilo.json) e desliza devagar até a próxima.
// A etiqueta presa à peça aparece no começo da frase que dá o nome a ela, um pouco antes do nome ser falado.
import timing from "./tempos.js";
import { clock, orbit } from "./motor/nucleo.js";

const { wordStart, phraseStart, phraseEnd, duration } = clock(timing);
const last = timing.phrases.length - 1;

export const T = {
  intro: wordStart(0, "estetoscopio"),
  diaphragm: wordStart(1, "diafragma"),
  tube: wordStart(2, "tubo"),
  earpieces: wordStart(3, "olivas"),
  done: phraseStart(last),
  end: duration,
};

// as peças: onde ficam, de onde voam e para onde a câmera olha quando chega nelas
export const PARTS = [
  { id: "diaphragm", word: T.diaphragm, phrase: 1, title: "DIAFRAGMA", point: [1.75, 0.55, 0.2], target: [1.25, 0.7, 0], from: [3, -1, 1], focus: 3.2 },
  { id: "tube", word: T.tube, phrase: 2, title: "TUBO", point: [1.9, 1.5, 0.2], target: [1.3, 1.5, 0], from: [-3, 3, 0], focus: 4.0 },
  { id: "earpieces", word: T.earpieces, phrase: 3, title: "OLIVAS", point: [1.25, 3.35, 0.2], target: [1.2, 2.9, 0], from: [0, 5, 0], focus: 3.4 },
];

export const LABELS = PARTS.map((p) => ({ at: phraseStart(p.phrase), until: phraseStart(p.phrase) + 2.6, title: p.title, point: p.point }));
export const CARDS = [{ at: T.done, until: duration + 1, icon: "🩺", text: "AGORA VOCÊ SABE", y: 1530 }];
// as frases que dão nome a uma peça ficam amarelas na legenda
export const HIGHLIGHTS = ["diafragma", "tubo", "olivas"];

const wide = [0.6, 1.8, 0];
export const CAMERA = {
  start: { position: orbit(wide, 25, 14, 8.5), target: wide },
  moves: [
    ...PARTS.map((p, i) => ({ kind: "approach", at: p.word - 0.1, position: orbit(p.target, 28 - i * 16, 10, p.focus), target: p.target })),
    { kind: "approach", at: phraseStart(last) + 0.2, position: orbit(wide, -8, 16, 8.0), target: wide },
  ],
};

export const SOUNDS = [
  ...PARTS.map((p) => ({ sound: "pop", at: p.word + 0.4, volume: 0.45 })),
  { sound: "heartbeat", at: wordStart(last, "coracao"), volume: 0.6, options: { beats: 3, interval: 0.5 } },
  { sound: "party", at: phraseStart(last), volume: 0.35 },
];
