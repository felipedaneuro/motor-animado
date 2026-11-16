// cena.js do exemplo do atlas-anatomico: o coração no centro, girando devagar sobre o fundo de estúdio, com as
// etiquetas de chamada presas ao ponto exato de cada estrutura. É a fórmula inteira do estilo em seis frases.
import * as THREE from "three";
import { createStage } from "./motor/palco.js";
import { createDrone } from "./motor/camera.js";
import { createOverlay } from "./motor/textos.js";
import { anatomicalHeart } from "./motor/anatomia.js";
import { studioBackdrop, createCallouts, turntable, shadowDisc } from "./estilo/kit.js";
import style from "./estilo.js";
import timing from "./tempos.js";
import { CARDS, HIGHLIGHTS, CAMERA, CALLOUTS } from "./plano.js";

export function createScene(canvas, root) {
  const stage = createStage(canvas, style);
  studioBackdrop(stage.scene, style);
  shadowDisc(stage.scene, style, { y: -1.25, radius: 1.4 });
  const model = new THREE.Group();
  stage.scene.add(model);
  anatomicalHeart(model, [0, 0, 0], 0.42);
  const spin = turntable(model, { speed: 0.16 });
  // as etiquetas do atlas: o texto fica de um lado da tela e a linha vai até o ponto da estrutura
  const callouts = createCallouts(root, style, CALLOUTS.map((item) => ({ ...item, dentro: model })));
  const overlay = createOverlay(root, timing, style, { labels: [], cards: CARDS, highlights: HIGHLIGHTS });
  const drone = createDrone(stage.camera, CAMERA, style.camera);
  return function draw(t) {
    const focus = drone.update(t);
    stage.followLight(focus);
    spin(t);
    overlay(t, stage.camera);
    callouts(t, stage.camera);
    stage.draw();
  };
}
