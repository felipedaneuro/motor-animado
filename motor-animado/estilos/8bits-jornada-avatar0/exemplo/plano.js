// Exemplo fictício. As trocas seguem a voz; os tempos medidos da referência ficam no estilo.json.
import timing from "./tempos.js";
import { clock } from "./motor/nucleo.js";

const { phraseStart, phraseEnd, wordStart, duration } = clock(timing);
export const T = {
  first: phraseStart(0),
  landscape: phraseStart(0) + (phraseEnd(0) - phraseStart(0)) * 0.62,
  letter: phraseStart(1),
  travel: phraseStart(2),
  village: phraseStart(2) + (phraseEnd(2) - phraseStart(2)) * 0.48,
  quest: phraseStart(3),
  choice: phraseStart(4),
  choiceA: wordStart(4, "preparar"),
  choiceB: wordStart(4, "conversar"),
  vote: phraseStart(5),
  endCard: phraseEnd(5),
  end: duration,
};
export const STATION = { VILLAGE: 0 };
// A interface de RPG é desenhada pelo kit para não duplicar títulos e cards.
export const LABELS = [];
export const CARDS = [];
export const HIGHLIGHTS = ["A", "B", "escolher"];
export const CAMERA = {
  start: { position: [0, 0, 12], target: [0, 0, 0] },
  moves: [],
};
// Escolhas de sonorização autoral. Não são identificação dos ataques da referência.
export const SOUNDS = [
  { sound: "snip", at: T.letter + 1, volume: 0.14 },
  { sound: "lock", at: T.quest, volume: 0.12 },
  { sound: "shimmer", at: T.choiceA, volume: 0.12 },
  { sound: "shimmer", at: T.choiceB, volume: 0.12 },
];
