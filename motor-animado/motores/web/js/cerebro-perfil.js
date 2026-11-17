// cerebro-perfil.js: o cérebro de perfil em pixel, com lobos, sulcos, cerebelo, tronco e o território de cada artéria.
// Para estilos em pixel (o cérebro 3D continua em anatomia.js para os estilos em 3D).
//
//   brainProfile({box, side, lobes, lobeLabels, highlight, infarct}) -> texto SVG
//     side: "E" (vista lateral esquerda: frente à ESQUERDA da tela, cerebelo embaixo à direita) ou "D" (espelhado)
//     lobes: true pinta frontal, parietal, temporal e occipital em tons diferentes; lobeLabels: true escreve os nomes
//     highlight: "acm" | "aca" | "acp" pinta o território inteiro da artéria
//     infarct: {territory: "acm", core: 0 a 1, penumbra: 0 a 1}: núcleo roxo e penumbra âmbar crescendo (anime com t)
//   profileColor(u, v, opções)   a cor de um ponto; u de 0 (polo frontal) a 1 (polo occipital), v de 0 (topo) a 1 (base)
//
// O território da cerebral média é a face lateral (frontal lateral, parietal, temporal); a cerebral anterior fica na
// faixa de cima, junto da borda; a posterior, no polo occipital e na face inferior do temporal.
import { clamp01, label, raster } from "./pixelsvg.js";

export const BRAIN_COLORS = { cortex: "#e39a96", sulcus: "#8f4d5c", outline: "#3b1c2a", cerebellum: "#c7838c",
  folia: "#9c5a68", stem: "#c99282", frontal: "#e8a39c", parietal: "#f2c39e", temporal: "#d4888f", occipital: "#c58aaa",
  aca: "#8fb3e8", acm: "#f0c46a", acp: "#9fd6b0", core: "#4b2a6b", penumbra: "#e8b04a" };

const ellipse = (u, v, cu, cv, ru, rv) => ((u - cu) / ru) ** 2 + ((v - cv) / rv) ** 2;
const lerp = (a, b, k) => a + (b - a) * clamp01(k);

function segmentDistance(u, v, [au, av], [bu, bv]) {
  const du = bu - au, dv = bv - av, k = clamp01(((u - au) * du + (v - av) * dv) / (du * du + dv * dv || 1));
  return Math.hypot(u - au - k * du, v - av - k * dv);
}

const centralSulcusAt = (v) => lerp(0.5, 0.4, (v - 0.05) / 0.47);                          // o sulco central desce para a frente
const lateralFissureAt = (u) => (u < 0.4 ? lerp(0.56, 0.52, (u - 0.2) / 0.2) : lerp(0.52, 0.44, (u - 0.4) / 0.22));

const isCerebrum = (u, v) => (ellipse(u, v, 0.47, 0.42, 0.46, 0.38) < 1 && !(v > 0.6 && u < 0.18))
  || ellipse(u, v, 0.45, 0.62, 0.27, 0.14) < 1;
const isCerebellum = (u, v) => ellipse(u, v, 0.76, 0.77, 0.17, 0.12) < 1;
const isStem = (u, v) => v > 0.6 && Math.abs(u - lerp(0.6, 0.63, (v - 0.6) / 0.4)) < 0.05;
export const insideBrain = (u, v) => isCerebrum(u, v) || isCerebellum(u, v) || isStem(u, v);

const SULCI = [[[0.5, 0.05], [0.4, 0.52]], [[0.2, 0.56], [0.4, 0.52]], [[0.4, 0.52], [0.62, 0.44]],
  [[0.84, 0.14], [0.88, 0.3]], [[0.32, 0.66], [0.62, 0.58]], [[0.43, 0.08], [0.34, 0.48]], [[0.58, 0.07], [0.5, 0.36]]];

function lobeOf(u, v) {
  if (u > 0.86 || (u > 0.8 && v < 0.32 && u > 0.84)) return "occipital";
  if (v > lateralFissureAt(u) && u < 0.8) return "temporal";
  return u < centralSulcusAt(v) ? "frontal" : "parietal";
}

// o território de cada artéria na face lateral
export function territoryOf(u, v) {
  if (!isCerebrum(u, v)) return null;
  if (u > 0.84 || (ellipse(u, v, 0.45, 0.62, 0.27, 0.14) < 1 && v > 0.71)) return "acp";
  if (ellipse(u, v, 0.47, 0.42, 0.46, 0.38) > 0.66 && v < 0.36 && u < 0.84) return "aca";
  return "acm";
}

function infarctColor(u, v, infarct) {
  if (!infarct || territoryOf(u, v) !== (infarct.territory || "acm")) return null;
  const center = { acm: [0.42, 0.47], aca: [0.4, 0.12], acp: [0.9, 0.42] }[infarct.territory || "acm"];
  const distance = Math.hypot(u - center[0], (v - center[1]) * 1.3);
  const core = 0.16 * clamp01(infarct.core ?? 1), penumbra = core + 0.32 * clamp01(infarct.penumbra ?? 1);
  if (distance < core) return BRAIN_COLORS.core;
  return distance < penumbra ? BRAIN_COLORS.penumbra : null;
}

function surfaceColor(u, v, options) {
  if (isCerebellum(u, v) && !isCerebrum(u, v)) return Math.sin(v * 140) > 0.55 ? BRAIN_COLORS.folia : BRAIN_COLORS.cerebellum;
  if (!isCerebrum(u, v)) return BRAIN_COLORS.stem;
  if (SULCI.some(([a, b]) => segmentDistance(u, v, a, b) < 0.011)) return BRAIN_COLORS.sulcus;
  const infarct = infarctColor(u, v, options.infarct);
  if (infarct) return infarct;
  if (options.highlight && territoryOf(u, v) === options.highlight) return BRAIN_COLORS[options.highlight];
  if (Math.abs(Math.sin(u * 31 + Math.sin(v * 13) * 3) * Math.sin(v * 27 + Math.sin(u * 11) * 3)) > 0.93) return BRAIN_COLORS.sulcus;
  return options.lobes ? BRAIN_COLORS[lobeOf(u, v)] : BRAIN_COLORS.cortex;
}

export function profileColor(u, v, options = {}, step = [0.012, 0.016]) {
  if (!insideBrain(u, v)) return null;
  const [du, dv] = step;
  const edge = !insideBrain(u - du, v) || !insideBrain(u + du, v) || !insideBrain(u, v - dv) || !insideBrain(u, v + dv);
  return edge ? BRAIN_COLORS.outline : surfaceColor(u, v, options);
}

const LOBE_LABELS = [["frontal", 0.24, 0.3], ["parietal", 0.66, 0.24], ["temporal", 0.44, 0.67], ["occipital", 0.84, 0.44]];

export function brainProfile({ box, side = "E", lobes = false, lobeLabels = false, highlight = null, infarct = null }) {
  const mirror = side === "D", step = [12 / box.width, 12 / box.height];
  const options = { lobes, highlight, infarct };
  let markup = raster(box, (x, v) => profileColor(mirror ? 1 - x : x, v, options, step));
  if (!lobeLabels) return markup;
  for (const [name, u, v] of LOBE_LABELS) {
    const x = box.x + (mirror ? 1 - u : u) * box.width, y = box.y + v * box.height;
    markup += label(name, x, y, { size: 32, color: "#2a1520" });
  }
  return markup;
}
