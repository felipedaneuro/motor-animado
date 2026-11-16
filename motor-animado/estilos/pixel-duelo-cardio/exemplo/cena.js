// cena.js do exemplo do pixel-duelo: a fórmula do estilo, com dois painéis lado a lado e um coração em cada um.
// À esquerda o coração que ainda bate; à direita o que só treme. A barra embaixo de cada painel conta o estado.
import { createStage } from "./motor/palco.js";
import { createDrone } from "./motor/camera.js";
import { createOverlay } from "./motor/textos.js";
import { anatomicalHeart } from "./motor/anatomia.js";
import { starfield, duelStage, stateBar, divider, duelText, PANEL } from "./estilo/kit.js";
import style from "./estilo.js";
import timing from "./tempos.js";
import { T, LABELS, CARDS, HIGHLIGHTS, CAMERA, FALAS, FOCOS } from "./plano.js";

// um coração dentro de um painel, na escala que cabe na moldura
function heartIn(panel, scale) {
  const holder = new (panel.constructor)();
  panel.add(holder);
  anatomicalHeart(holder, [0, 0.1, 0.1], scale);
  return holder;
}

export function createScene(canvas, root) {
  const stage = createStage(canvas, style);
  starfield(stage.scene, style);
  const duel = duelStage(stage.scene, style);
  divider(stage.scene, style, { y: PANEL.height / 2 + 0.9 });
  const hearts = [heartIn(duel.left, 0.55), heartIn(duel.right, 0.55)];
  const bars = [stateBar(duel.left, style, { color: duel.colors[0] }), stateBar(duel.right, style, { color: duel.colors[1] })];
  const texto = duelText(root, style, FALAS);
  const overlay = createOverlay(root, timing, style, { labels: LABELS, cards: CARDS, highlights: HIGHLIGHTS });
  const drone = createDrone(stage.camera, CAMERA, style.camera);
  return function draw(t) {
    const focus = drone.update(t);
    stage.followLight(focus);
    const beat = Math.max(0, Math.sin(t * 6.6));                       // o lado esquerdo bate; o direito só treme
    hearts[0].scale.setScalar(1 + 0.08 * beat * beat);
    hearts[1].scale.setScalar(1 + 0.012 * Math.sin(t * 41));
    bars[0].set(t < T.prop ? 1 : 0.62);
    bars[1].set(t < T.prop ? 1 : 0.06 + 0.04 * Math.sin(t * 37));
    const foco = FOCOS.find((f) => t >= f.at && t < f.until);
    duel.focus(foco ? foco.lado : null, foco ? Math.min(1, (t - foco.at) / 0.5) : 0);
    texto(t);
    overlay(t, stage.camera);
    stage.draw();
  };
}
