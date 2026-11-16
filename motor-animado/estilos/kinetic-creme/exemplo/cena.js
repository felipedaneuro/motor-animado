// cena.js do exemplo do kinetic-creme: não há cena 3D. O estilo inteiro é a camada clara por cima: fundo creme
// com a cidade em traço, cápsula de etapa, título palavra por palavra e o cartão branco que troca de conteúdo.
import { createStage } from "./motor/palco.js";
import { createDrone } from "./motor/camera.js";
import { createOverlay } from "./motor/textos.js";
import { cremeBackdrop, stepChip, wordTitle, whiteCard, progressBar } from "./estilo/creme.js";
import style from "./estilo.js";
import timing from "./tempos.js";
import { LABELS, CARDS, HIGHLIGHTS, CAMERA, ETAPAS } from "./plano.js";

export function createScene(canvas, root) {
  const stage = createStage(canvas, style);
  cremeBackdrop(root, style);
  const chip = stepChip(root, style, ETAPAS);
  const titulo = wordTitle(root, style, ETAPAS);
  const cartao = whiteCard(root, style);
  const barra = progressBar(root, style, { nome: "PAINEL DO CANAL", total: ETAPAS.length });
  const overlay = createOverlay(root, timing, style, { labels: LABELS, cards: CARDS, highlights: HIGHLIGHTS });
  const drone = createDrone(stage.camera, CAMERA, style.camera);
  return function draw(t) {
    const focus = drone.update(t);
    stage.followLight(focus);
    const i = Math.max(0, ETAPAS.findIndex((e) => t >= e.at && t < e.until));
    chip(t);
    titulo(t);
    cartao.draw(t, (ETAPAS[i] || ETAPAS[0]).cartao);
    barra(t, i + 1);
    overlay(t, stage.camera);
    stage.draw();
  };
}
