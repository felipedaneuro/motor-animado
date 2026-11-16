// cena.js de partida do estilo greg-news: a bancada fixa, o apresentador em busto de pixel e os arcos
// dourados ao fundo.
// Serve para testar o estilo medido (câmera, legenda, ticker, card em full) antes de escrever o vídeo de verdade.
import { createStage } from "./motor/palco.js";
import { createDrone } from "./motor/camera.js";
import { createOverlay } from "./motor/textos.js";
import { arcoDourado, bancada, ancora } from "./estilo/kit.js";
import style from "./estilo.js";
import timing from "./tempos.js";
import { T, CARDS, HIGHLIGHTS, CAMERA } from "./plano.js";

export function createScene(canvas, root) {
  const stage = createStage(canvas, style);
  arcoDourado(stage.scene);
  bancada(stage.scene);
  // o busto entra atrás da bancada (ela vai de z=0,25 a z=0,95): num telejornal o âncora fica por trás dela.
  // O `ancora()` já põe o retrato na cena — não precisa de `scene.add`.
  const presenter = ancora(stage.scene, style);
  const overlay = createOverlay(root, timing, style, { cards: CARDS, highlights: HIGHLIGHTS });
  const drone = createDrone(stage.camera, CAMERA, style.camera);
  return function draw(t) {
    const focus = drone.update(t);
    stage.followLight(focus);
    presenter.update(t);                  // o busto pisca e respira um pixel; não gira, a câmera é frontal
    overlay(t, stage.camera);
    stage.draw();
  };
}
