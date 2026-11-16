// cena.js do exemplo do vetor-plano-medico: a silhueta de perfil com o cérebro, os raios convergindo e o mapa de
// dose crescendo no alvo. Tudo chapado, sem textura e sem sombra.
import { createStage } from "./motor/palco.js";
import { createDrone } from "./motor/camera.js";
import { createOverlay } from "./motor/textos.js";
import { dottedBackdrop, headProfile, doseRings, rayBurst, darkTags } from "./estilo/vetor.js";
import style from "./estilo.js";
import timing from "./tempos.js";
import { T, LABELS, CARDS, HIGHLIGHTS, CAMERA, TAGS } from "./plano.js";

export function createScene(canvas, root) {
  const stage = createStage(canvas, style);
  dottedBackdrop(stage.scene, style);
  const head = headProfile(stage.scene, style, { scale: 1.6 });
  const alvo = [head.alvo.x, head.alvo.y, 0.06];
  const dose = doseRings(stage.scene, style, { at: alvo, radius: 0.9 });
  const raios = rayBurst(stage.scene, style, { at: alvo, length: 5 });
  const tags = darkTags(root, style, TAGS);
  const overlay = createOverlay(root, timing, style, { labels: LABELS, cards: CARDS, highlights: HIGHLIGHTS });
  const drone = createDrone(stage.camera, CAMERA, style.camera);
  return function draw(t) {
    const focus = drone.update(t);
    stage.followLight(focus);
    const avanco = Math.max(0, Math.min(1, (t - T.first) / Math.max(0.1, T.last - T.first)));
    raios(t, Math.min(1, avanco * 1.6));
    dose(t, Math.max(0, (avanco - 0.3) / 0.7));
    tags(t, stage.camera);
    overlay(t, stage.camera);
    stage.draw();
  };
}
