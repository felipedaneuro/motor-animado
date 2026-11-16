// cena.js do exemplo do pixel-arteria-stent: o vaso em corte ocupando a tela em pé, o sangue correndo, a placa
// crescendo de dentro da parede e o rótulo da etapa se escrevendo no canto. É a fórmula da família inteira.
import { createStage } from "./motor/palco.js";
import { createDrone } from "./motor/camera.js";
import { createOverlay } from "./motor/textos.js";
import { starfield } from "./estilo/kit.js";
import { vesselCut, bloodFlow, plaque, stepLabel } from "./estilo/corte.js";
import style from "./estilo.js";
import timing from "./tempos.js";
import { T, LABELS, CARDS, HIGHLIGHTS, CAMERA, PASSOS } from "./plano.js";

export function createScene(canvas, root) {
  const stage = createStage(canvas, style);
  starfield(stage.scene, style, { spread: 12 });
  const vessel = vesselCut(stage.scene, style, { width: 2.3, height: 13, wall: 0.95 });
  const flow = bloodFlow(vessel, { count: 46, speed: 1.8 });
  const left = plaque(vessel, { side: -1, at: 0.4, length: 2.6 });
  const right = plaque(vessel, { side: 1, at: 0.1, length: 2.2, grow: 0.5 });
  const passos = stepLabel(root, style, PASSOS);
  const overlay = createOverlay(root, timing, style, { labels: LABELS, cards: CARDS, highlights: HIGHLIGHTS });
  const drone = createDrone(stage.camera, CAMERA, style.camera);
  return function draw(t) {
    const focus = drone.update(t);
    stage.followLight(focus);
    // a placa cresce da primeira à terceira frase e o sangue vai passando com mais dificuldade
    const grown = Math.max(0, Math.min(1, (t - T.first) / Math.max(0.1, T.last - T.first)));
    left(grown);
    right(grown * 0.8);
    flow(t, 1 - grown * 0.65);
    passos(t);
    overlay(t, stage.camera);
    stage.draw();
  };
}
