// Exemplo original em seis frases. O kit pinta os pixels; o motor mantém palco e legendas.
import { createStage } from "./motor/palco.js";
import { createDrone } from "./motor/camera.js";
import { createOverlay } from "./motor/textos.js";
import { createJourney } from "./estilo/kit.js";
import style from "./estilo.js";
import timing from "./tempos.js";
import { T, LABELS, CARDS, HIGHLIGHTS, CAMERA } from "./plano.js";

function stateAt(t) {
  const base = { name: "Nara", avatar: { skin: "#a96f48", hair: "#252329", shirt: "#3c7777" } };
  if (t < T.landscape) return { ...base, mode: "character", at: T.first };
  if (t < T.letter) return { ...base, mode: "landscape", reveal: (t - T.landscape) / 2, cutAt: T.landscape };
  if (t < T.travel) return { ...base, mode: "letter", at: T.letter, message: "Volte para ajudar a reabrir nosso centro.", cutAt: T.letter };
  if (t < T.village) return { ...base, mode: "travel", at: T.travel, arrived: t > T.travel + 0.6, cutAt: T.travel };
  if (t < T.quest) return { ...base, mode: "village", at: T.village, message: "O centro precisa da nossa ajuda.", cutAt: T.village };
  if (t < T.choice) return { ...base, mode: "quest", at: T.quest, cost: 8, balance: 3, cutAt: T.quest };
  if (t < T.endCard) return { ...base, mode: "choice", at: T.choice, firstAt: T.choiceA, secondAt: T.choiceB, selected: t >= T.vote ? "cycle" : "", cutAt: T.choice };
  return { ...base, mode: "end", at: T.endCard };
}

export function createScene(canvas, root) {
  const stage = createStage(canvas, style);
  const drone = createDrone(stage.camera, CAMERA, { ...style.camera, idle_sway: 0 });
  const journey = createJourney(root, style);
  const overlay = createOverlay(root, timing, style, { labels: LABELS, cards: CARDS, highlights: HIGHLIGHTS });
  return function draw(t) {
    drone.update(t);
    stage.draw();
    const speaking = timing.phrases.some((phrase) => t >= phrase.start && t <= phrase.end);
    journey(t, { ...stateAt(t), speaking });
    overlay(t, stage.camera);
  };
}
