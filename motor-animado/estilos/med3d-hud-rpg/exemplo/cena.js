// cena.js do exemplo dos estilos med3d: o box de emergência com a camada de decisão por cima. A sala, a maca, o
// paciente, o médico e o monitor vêm do motor (`clinicRoom`), no visual que o `estilo.json` pedir — **palito** ou
// **pixel**; o que este estilo entrega de verdade é a interface clínica em HTML por cima.
import { createStage } from "./motor/palco.js";
import { createDrone } from "./motor/camera.js";
import { createOverlay } from "./motor/textos.js";
import { clinicRoom } from "./estilo/kit.js";
import { statusBar, vitals, findingTags, decisionCard, summaryCard } from "./estilo/hud-clinico.js";
import style from "./estilo.js";
import timing from "./tempos.js";
import { T, LABELS, CARDS, HIGHLIGHTS, CAMERA, ACHADOS, DECISOES, VITAIS, RESUMO } from "./plano.js";

export function createScene(canvas, root) {
  const stage = createStage(canvas, style);
  const sala = clinicRoom(stage.scene, style, { look: (style.clinic || {}).look });
  const topo = statusBar(root, style, { queixa: "FALTA DE AR", decisoes: DECISOES.length, at: T.first });
  const sinais = vitals(root, style, VITAIS);
  const achados = findingTags(root, style, ACHADOS);
  const decisao = decisionCard(root, style, DECISOES);
  const resumo = summaryCard(root, style, RESUMO);
  const overlay = createOverlay(root, timing, style, { labels: LABELS, cards: CARDS, highlights: HIGHLIGHTS });
  const drone = createDrone(stage.camera, CAMERA, style.camera);
  return function draw(t) {
    const focus = drone.update(t);
    stage.followLight(focus);
    sala(t);
    topo(t, DECISOES.filter((d) => t >= d.until).length);
    sinais(t);
    achados(t);
    decisao(t);
    resumo(t);
    overlay(t, stage.camera);
    stage.draw();
  };
}
