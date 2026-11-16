// cena.js de partida de um estilo novo: o chão, um personagem plano e uma peça que entra na frase 2.
// Serve para testar o estilo medido (câmera, legenda, cores) antes de escrever o mundo de verdade.
import { pop } from "./motor/nucleo.js";
import { createStage } from "./motor/palco.js";
import { createDrone } from "./motor/camera.js";
import { createOverlay } from "./motor/textos.js";
import { flatCharacter, FLAT_POSES } from "./motor/personagens.js";
import { ball } from "./motor/formas.js";
import { ground } from "./estilo/kit.js";
import style from "./estilo.js";
import timing from "./tempos.js";
import { T, LABELS, CARDS, HIGHLIGHTS, CAMERA } from "./plano.js";

export function createScene(canvas, root) {
  const stage = createStage(canvas, style);
  ground(stage.scene, style);
  const person = flatCharacter({ shirt: style.palette?.[1] || "#ff7a1a" });
  person.group.position.set(-0.5, 0, 0);
  stage.scene.add(person.group);
  const prop = ball(0.35, style.palette?.[2] || "#3a7bd5", [0.6, 1.2, 0.2]);
  stage.scene.add(prop);
  const overlay = createOverlay(root, timing, style, { labels: LABELS, cards: CARDS, highlights: HIGHLIGHTS });
  const drone = createDrone(stage.camera, CAMERA, style.camera);
  return function draw(t) {
    const focus = drone.update(t);
    stage.followLight(focus);
    person.setPose(t >= T.prop && t < T.prop + 1.5 ? FLAT_POSES.pointing : FLAT_POSES.standing);
    person.faceCamera(stage.camera);
    prop.scale.setScalar(pop(t, T.prop));
    overlay(t, stage.camera);
    stage.draw();
  };
}
