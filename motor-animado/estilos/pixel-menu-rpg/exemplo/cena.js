// cena.js do exemplo do pixel-menu-rpg: o fundo estrelado com o chão de pixels e, por cima, a janela de menu que
// troca de conteúdo a cada etapa. Quem conta a história é a interface: a cena 3D é só o fundo.
import { createStage } from "./motor/palco.js";
import { createDrone } from "./motor/camera.js";
import { createOverlay } from "./motor/textos.js";
import { starfield } from "./estilo/kit.js";
import { menuWindow, stepTitle, captionBox } from "./estilo/menu.js";
import style from "./estilo.js";
import timing from "./tempos.js";
import { LABELS, CARDS, HIGHLIGHTS, CAMERA, ETAPAS, FALAS } from "./plano.js";

export function createScene(canvas, root) {
  const stage = createStage(canvas, style);
  starfield(stage.scene, style, { spread: 14, count: 110 });
  const titulo = stepTitle(root, style, ETAPAS);
  const janela = menuWindow(root, style, { total: ETAPAS.length });
  const legenda = captionBox(root, style, FALAS);
  const overlay = createOverlay(root, timing, style, { labels: LABELS, cards: CARDS, highlights: HIGHLIGHTS });
  const drone = createDrone(stage.camera, CAMERA, style.camera);
  return function draw(t) {
    const focus = drone.update(t);
    stage.followLight(focus);
    const i = Math.max(0, ETAPAS.findIndex((e) => t >= e.at && t < e.until));
    const etapa = ETAPAS[i] || ETAPAS[ETAPAS.length - 1];
    titulo(t);
    janela.draw(t, { passo: i + 1, etapa: etapa.chave, itens: etapa.itens });
    legenda(t);
    overlay(t, stage.camera);
    stage.draw();
  };
}
