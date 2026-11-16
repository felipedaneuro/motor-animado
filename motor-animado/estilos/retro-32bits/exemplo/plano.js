// plano.js do exemplo "Doutor Cérebro" (retrô 32 e 64 bits): QUANDO cada coisa acontece e ONDE a câmera vai.
// Sem three.js, de propósito: o sons.py lê este arquivo pelo Node. As frases contam do 0.
import timing from "./tempos.js";
import { clock } from "./motor/nucleo.js";

const { wordStart, phraseEnd, duration } = clock(timing);

export const T = {
  hello: wordStart(0, "oi"), name: wordStart(0, "cerebro"), secrets: wordStart(0, "segredos"),
  water: wordStart(1, "agua"), slow: wordStart(1, "lento"), ache: wordStart(1, "doi"),
  sleep: wordStart(2, "sono"), clean: wordStart(2, "faxina"), learned: wordStart(2, "aprendeu"),
  move: wordStart(3, "movimento"), walk: wordStart(3, "caminhada"), oxygen: wordStart(3, "oxigenio"),
  trio: wordStart(4, "trio"), sharp: wordStart(4, "afiado"), comment: wordStart(5, "comente"), end: duration,
};

// o mascote: rosto e pose em cada momento (a cena só obedece)
export const ACTING = [
  { at: 0, pose: "wave", face: { eyes: "happy", mouth: "open" } },
  { at: T.name, pose: "handsOnHips", face: { eyes: "open", mouth: "smile" } },
  { at: T.water - 0.2, pose: "point", face: { eyes: "open", mouth: "smile" } },
  { at: T.slow, pose: "think", face: { eyes: "open", mouth: "sad", brows: "worried" } },
  { at: T.sleep - 0.2, pose: "standing", face: { eyes: "closed", mouth: "flat", brows: "calm" } },
  { at: T.learned, pose: "handsOnHips", face: { eyes: "happy", mouth: "smile" } },
  { at: T.move - 0.2, pose: "cheer", face: { eyes: "wide", mouth: "open" } },
  { at: T.trio, pose: "handsOnHips", face: { eyes: "open", mouth: "smile", brows: "up" } },
  { at: T.comment, pose: "wave", face: { eyes: "happy", mouth: "open", brows: "calm" } },
];

export const LABELS = [{ at: T.trio, until: phraseEnd(4) + 0.3, title: "O TRIO DO CÉREBRO" }];
export const CARDS = [
  { at: T.water, until: phraseEnd(1), icon: "💧", text: "ÁGUA" },
  { at: T.sleep, until: phraseEnd(2), icon: "😴", text: "SONO" },
  { at: T.move, until: phraseEnd(3), icon: "👟", text: "MOVIMENTO" },
  { at: T.comment, until: duration + 1, icon: "💬", text: "COMENTE CÉREBRO", y: 1560 },
];
export const HIGHLIGHTS = ["cérebro", "água", "sono", "movimento", "trio", "CÉREBRO"];

const wide = { position: [0, 1.5, 6.2], target: [0, 1.1, 0] };
export const CAMERA = {
  start: wide,
  moves: [
    { kind: "approach", at: T.hello + 0.3, position: [0, 1.45, 3.6], target: [0, 1.25, 0] },
    { kind: "approach", at: T.water - 0.3, position: [-1.4, 1.35, 4.6], target: [-1.25, 0.95, 0] },
    { kind: "approach", at: T.sleep - 0.3, position: [1.4, 1.35, 4.6], target: [1.25, 0.95, 0] },
    { kind: "approach", at: T.move - 0.3, position: [0, 1.25, 4.6], target: [0, 0.8, 0.6] },
    { kind: "approach", at: T.trio - 0.3, ...wide },
    { kind: "approach", at: T.comment - 0.2, position: [0, 1.45, 3.8], target: [0, 1.25, 0] },
  ],
};

export const SOUNDS = [
  { sound: "pop", at: T.water, volume: 0.4 }, { sound: "glub", at: T.slow, volume: 0.3, options: { duration: 0.3 } },
  { sound: "shimmer", at: T.clean, volume: 0.3, options: { duration: 1.5 } }, { sound: "pop", at: T.move, volume: 0.4 },
  { sound: "victory", at: T.sharp, volume: 0.4 }, { sound: "party", at: T.comment, volume: 0.3 },
];
