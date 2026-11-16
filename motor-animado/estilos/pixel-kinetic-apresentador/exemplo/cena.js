// cena.js do exemplo do pixel-kinetic-apresentador: o apresentador humano pequeno no canto, a moldura de filme,
// o título em duas linhas e a janela que mostra a prova de cada ideia.
import { createStage } from "./motor/palco.js";
import { createDrone } from "./motor/camera.js";
import { createOverlay } from "./motor/textos.js";
import { bustCorner } from "./motor/busto.js";
import { filmFrame, twoLineTitle, stageWindow, xpBar } from "./estilo/filme.js";
import style from "./estilo.js";
import timing from "./tempos.js";
import { LABELS, CARDS, HIGHLIGHTS, CAMERA, IDEIAS } from "./plano.js";

export function createScene(canvas, root) {
  const stage = createStage(canvas, style);
  const host = bustCorner(root, style);     // o retrato fixo, no canto: nada de boneco andando
  filmFrame(root, style);
  const titulo = twoLineTitle(root, style, IDEIAS);
  const janela = stageWindow(root, style);
  const xp = xpBar(root, style);
  const overlay = createOverlay(root, timing, style, { labels: LABELS, cards: CARDS, highlights: HIGHLIGHTS });
  const drone = createDrone(stage.camera, CAMERA, style.camera);
  return function draw(t) {
    const focus = drone.update(t);
    stage.followLight(focus);
    const i = Math.max(0, IDEIAS.findIndex((x) => t >= x.at && t < x.until));
    const ideia = IDEIAS[i] || IDEIAS[0];
    host.pose(ideia.pose || "standing");
    host.setFace(ideia.face || { eyes: "open", mouth: "smile" });
    host.update(t);
    titulo(t);
    janela.draw(t, ideia.janela);
    xp(t, (i + 1) / IDEIAS.length);
    overlay(t, stage.camera);
    stage.draw();
  };
}
