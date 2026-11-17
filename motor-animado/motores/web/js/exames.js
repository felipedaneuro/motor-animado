// exames.js: exames de imagem redesenhados em pixel, para vídeos de neuro e neurovascular. Nunca a imagem de um exame
// real: cada peça é um esquema com a anatomia e o achado no lugar certo.
//
//   axialCT({box, level, findings, markers})      tomografia axial sem contraste
//     level: "ventricular" (ventrículos laterais, sulcos) ou "basal" (lobos temporais, mesencéfalo, cisternas)
//     findings: [{type, side, territory, amount}]
//       type: "epidural" (lente), "subdural" (crescente), "intraparenquimatosa", "hsa" (sangue nas cisternas e sulcos),
//             "isquemia" (escura no território: territory "acm", "aca" ou "acp"), "acm-hiperdensa" (só no nível basal)
//       side: "D" ou "E" (o lado do PACIENTE); amount: 0 a 1 (cresce com o tempo, para animar)
//   ctAngiography({box, occlusion, arrowAmount, pulse, markers})   angiotomografia no nível do polígono de Willis
//     occlusion: {artery: "ICA" | "M1" | "M2" | "A1" | "P1" | "basilar", side: "D" | "E"} ou null
//     arrowAmount: 0 a 1 (a seta entra); pulse: 0 a 1 (opacidade do quadrado em volta do ponto da oclusão)
//   angiography({box, side, occlusion, reperfused})   angiografia digital de frente (injeção numa carótida interna)
//   angiographyCompare({box, side, occlusion})         antes e depois da reperfusão, lado a lado
//   pulseAt(t, from)                                   o pulso de 1 por segundo (fotossensibilidade: até 1,5 por segundo)
//
// Convenção radiológica em todas: o lado DIREITO do paciente aparece à ESQUERDA da tela. box = {x, y, width, height}.
import { arrow, blob, clamp01, label, line, raster, rect, ring } from "./pixelsvg.js";

export const COLORS = { bone: "#eef2fb", tissue: "#80849a", cortex: "#8c90a6", csf: "#1c2133", blood: "#f6f8ff",
  edema: "#6c7088", early: "#737790", infarct: "#5d6178", contrast: "#ffffff", amber: "#ffd267",
  dsaBackground: "#c4c8d0", dsaVessel: "#23262f" };

export const screenSign = (side) => (side === "E" ? 1 : -1);   // E à direita da tela, D à esquerda
export const pulseAt = (t, from) => (t < from ? 1 : 0.6 + 0.4 * Math.cos((t - from) * Math.PI * 2));
const ellipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
const lerp = (a, b, k) => a + (b - a) * clamp01(k);

function segmentDistance(x, y, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay, k = clamp01(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1));
  return Math.hypot(x - ax - k * dx, y - ay - k * dy);
}

// ---------- o corte axial: x e y de -1 a 1 (x negativo = esquerda da tela = direito do paciente; y negativo = frente) ----------
// os ventrículos laterais em borboleta: os cornos frontais abrem para a frente e para fora a partir do forame de Monro,
// os corpos correm junto da linha média e os cornos occipitais abrem para trás e para fora
function lateralVentricle(ax, y) {
  if (y >= -0.4 && y <= -0.08) {
    const k = (-0.08 - y) / 0.32, tip = y < -0.34 ? (y + 0.4) / 0.06 : 1;
    const inner = 0.025 + 0.05 * k, outer = inner + (0.06 + 0.07 * Math.sin(Math.PI * Math.min(1, k * 1.1))) * tip;
    return ax >= inner && ax <= outer;
  }
  if (y > -0.08 && y <= 0.44) {
    const k = (y + 0.08) / 0.52, inner = 0.03 + 0.17 * k * k;
    const width = (0.05 + 0.04 * Math.sin(Math.PI * k)) * (y > 0.38 ? (0.44 - y) / 0.06 : 1);
    return ax >= inner && ax <= inner + width;
  }
  return false;
}

function ventricularCsf(x, y, radius) {
  const ax = Math.abs(x);
  if (ax < 0.025 && (y < -0.5 || y > 0.6)) return "cistern";                  // fissura inter-hemisférica
  if (ax < 0.025 && y > -0.1 && y < 0.12) return "ventricle";                 // terceiro ventrículo
  if (radius > 0.62 && radius < 0.86 && Math.sin(Math.atan2(ax, -y) * 14 + radius * 6) > 0.93) return "cistern";   // sulcos
  return lateralVentricle(ax, y) ? "ventricle" : null;
}

// o mesencéfalo no corte basal: os dois pedúnculos na frente e o teto atrás (forma de "orelhas de rato")
export const isMidbrain = (x, y) => ellipse(Math.abs(x), y, 0.085, 0.2, 0.09, 0.085) < 1 || ellipse(x, y, 0, 0.27, 0.14, 0.09) < 1;

function basalCsf(x, y) {
  const ax = Math.abs(x);
  if (ax < 0.022 && Math.abs(y - 0.3) < 0.022) return "ventricle";            // aqueduto
  if (ellipse(ax, y, 0.42, 0.14, 0.03, 0.035) < 1) return "ventricle";        // cornos temporais
  if (ellipse(x, y, 0, -0.02, 0.13, 0.09) < 1) return "cistern";              // cisterna suprasselar
  if (segmentDistance(ax, y, [0.12, -0.04], [0.32, -0.1]) < 0.022
    || segmentDistance(ax, y, [0.32, -0.1], [0.56, -0.08]) < 0.022) return "cistern";   // fissuras de Sylvius
  if (ax < 0.03 && y > 0.1 && y < 0.17) return "cistern";                     // fossa interpeduncular
  if (!isMidbrain(x, y) && y > 0.14 && ellipse(x, y, 0, 0.25, 0.25, 0.18) < 1) return "cistern";   // cisterna ambiens
  return ax < 0.02 && (y < -0.45 || y > 0.5) ? "cistern" : null;              // fissura inter-hemisférica e foice
}

// os territórios no corte: hemisfério do lado pedido e a fatia de cada artéria
function inTerritory(x, y, side, territory, level) {
  if (x * screenSign(side) < 0.03) return false;
  const ax = Math.abs(x);
  const aca = level === "basal" ? y < -0.3 && ax < 0.25 : (y < -0.05 && ax < 0.3) || (ax < 0.18 && y < 0.35);
  const acp = level === "basal" ? y > 0.5 : y > 0.45 && ax < 0.6;
  if (territory === "aca") return aca;
  if (territory === "acp") return acp && !aca;
  const lateral = level === "basal" ? ax > 0.3 && y > -0.5 && y < 0.5 : true;
  return lateral && !aca && !acp;
}

// a espessura do sangue colado ao crânio: lente curta e grossa (epidural) ou crescente longa e fina (subdural)
function extraAxialThickness(finding, y) {
  const epidural = finding.type === "epidural";
  const center = epidural ? -0.1 : -0.05, half = epidural ? 0.32 : 0.68;
  const u = (y - center) / half;
  if (Math.abs(u) >= 1) return 0;
  const amount = clamp01(finding.amount ?? 1);
  return epidural ? 0.22 * amount * (1 - u * u) : 0.08 * amount * Math.pow(1 - u * u, 0.25);
}

function findingColor(findings, x, y, radius, level) {
  for (const finding of findings) {
    const sign = screenSign(finding.side), amount = clamp01(finding.amount ?? 1);
    if ((finding.type === "epidural" || finding.type === "subdural") && x * sign > 0
      && radius >= 0.88 - extraAxialThickness(finding, y)) return COLORS.blood;
    if (finding.type === "intraparenquimatosa") {
      const distance = ellipse(x, y, sign * 0.25, 0, 0.13 * amount + 0.01, 0.11 * amount + 0.01);
      if (distance < 1) return COLORS.blood;
      if (distance < 1.7) return COLORS.edema;
    }
    if (finding.type === "isquemia" && inTerritory(x, y, finding.side, finding.territory || "acm", level)) {
      return amount < 0.5 ? COLORS.early : COLORS.infarct;
    }
    if (finding.type === "acm-hiperdensa" && level === "basal"
      && segmentDistance(x, y, [sign * 0.14, -0.02], [sign * 0.48, -0.12]) < 0.03) return COLORS.blood;
  }
  return null;
}

// a cor de um ponto do corte (exportada para os testes conferirem o lado de cada achado)
export function sliceColor(x, y, { level = "ventricular", findings = [] } = {}) {
  const radius = Math.hypot(x, y);
  if (radius > 0.98) return null;
  if (radius > 0.88) return COLORS.bone;
  const csf = level === "basal" ? basalCsf(x, y) : ventricularCsf(x, y, radius);
  const bleedingCsf = findings.some((f) => f.type === "hsa" && clamp01(f.amount ?? 1) >= 0.5);
  if (csf) return bleedingCsf && csf === "cistern" ? COLORS.blood : COLORS.csf;   // a HSA enche cisternas e sulcos, não os ventrículos
  const found = findingColor(findings, x, y, radius, level);
  if (found) return found;
  if (level === "basal" && isMidbrain(x, y)) return COLORS.cortex;
  return radius > 0.8 ? COLORS.cortex : COLORS.tissue;
}

function sideMarkers(box, size = 40) {
  const middle = box.y + box.height / 2 + size / 3;
  return label("D", box.x - 40, middle, { size }) + label("E", box.x + box.width + 40, middle, { size });
}

export function axialCT({ box, level = "ventricular", findings = [], markers = true }) {
  const slice = raster(box, (u, v) => sliceColor(u * 2 - 1, v * 2 - 1, { level, findings }));
  return slice + (markers ? sideMarkers(box) : "");
}

// ---------- a angiotomografia: o polígono de Willis no corte basal ----------
const toScreen = (box, [x, y]) => [box.x + ((x + 1) / 2) * box.width, box.y + ((y + 1) / 2) * box.height];

function willisSegments(sign) {
  return [
    { id: "A1", points: [[sign * 0.14, -0.02], [sign * 0.035, -0.2]] },
    { id: "A2", points: [[sign * 0.035, -0.2], [sign * 0.035, -0.62]] },
    { id: "M1", points: [[sign * 0.14, -0.02], [sign * 0.48, -0.12]] },
    { id: "M2", points: [[sign * 0.48, -0.12], [sign * 0.62, -0.38]] },
    { id: "M2-inferior", points: [[sign * 0.48, -0.12], [sign * 0.66, 0.08]] },
    { id: "PCom", points: [[sign * 0.14, -0.02], [sign * 0.12, 0.1]] },
    { id: "P1", points: [[0, 0.09], [sign * 0.12, 0.1]] },
    { id: "P2", points: [[sign * 0.12, 0.1], [sign * 0.27, 0.3], [sign * 0.22, 0.6]] },
  ];
}

// o que fica sem contraste depois de cada oclusão (o próprio segmento vira um coto de 30%)
const DOWNSTREAM = { ICA: ["A1", "M1", "M2", "M2-inferior", "PCom"], M1: ["M2", "M2-inferior"], M2: [], A1: [],
  P1: ["P2"], basilar: ["P1", "P2"] };

// os segmentos com contraste e o ponto da oclusão, em pixels da tela (exportado para os testes)
export function ctaVessels({ box, occlusion = null }) {
  const segments = [], cut = occlusion?.artery || null;
  let cutoff = null;
  for (const side of ["D", "E"]) {
    const sign = screenSign(side), hit = occlusion && (occlusion.side === side || cut === "basilar");
    for (const segment of willisSegments(sign)) {
      if (hit && DOWNSTREAM[cut]?.includes(segment.id)) continue;
      let points = segment.points;
      if (hit && segment.id === cut) {
        const [a, b] = points;
        points = [a, [a[0] + (b[0] - a[0]) * 0.3, a[1] + (b[1] - a[1]) * 0.3]];
        cutoff = toScreen(box, points[1]);
      }
      segments.push({ id: segment.id, side, points: points.map((point) => toScreen(box, point)) });
    }
  }
  if (cut === "basilar") cutoff = toScreen(box, [0, 0.09]);
  if (cut === "ICA") cutoff = toScreen(box, [screenSign(occlusion.side) * 0.14, -0.02]);
  return { segments, cutoff };
}

export function ctAngiography({ box, occlusion = null, arrowAmount = 1, pulse = 1, markers = true }) {
  const { segments, cutoff } = ctaVessels({ box, occlusion });
  let markup = axialCT({ box, level: "basal", markers });
  markup += `<path d="M${toScreen(box, [-0.035, -0.2]).join(" ")} H${toScreen(box, [0.035, -0.2])[0]}" stroke="${COLORS.contrast}" stroke-width="10"/>`;
  markup += segments.map((segment) => line(segment.points, COLORS.contrast, segment.id.startsWith("M2") ? 9 : 12)).join("");
  for (const side of ["D", "E"]) {
    if (occlusion?.artery === "ICA" && occlusion.side === side) continue;   // a carótida ocluída não enche
    markup += blob(...toScreen(box, [screenSign(side) * 0.14, -0.02]), 12, COLORS.contrast);
  }
  if (occlusion?.artery !== "basilar") markup += blob(...toScreen(box, [0, 0.09]), 12, COLORS.contrast);
  if (!cutoff || arrowAmount <= 0) return markup;
  const outward = cutoff[0] >= box.x + box.width / 2 ? 1 : -1;
  const from = [cutoff[0] + outward * 150, cutoff[1] - 190];
  const tip = [cutoff[0] + outward * 22, cutoff[1] - 26];
  return markup + `<g opacity="${clamp01(arrowAmount)}">${arrow(from, tip)}${ring(cutoff[0], cutoff[1], 56, COLORS.amber, { opacity: pulse })}</g>`;
}

// ---------- a angiografia digital, de frente: vasos escuros no fundo cinza, como na subtração ----------
// L: 0 = linha do meio, 1 = borda lateral do lado injetado; v: 0 = topo, 1 = base do painel
const DSA_TREE = {
  ICA: [[0.18, 1.0], [0.2, 0.76], [0.13, 0.64], [0.22, 0.56], [0.18, 0.48]],
  ACA: [[0.18, 0.48], [0.07, 0.42], [0.05, 0.25], [0.08, 0.08]],
  M1: [[0.18, 0.48], [0.42, 0.46]],
  MCA: [[[0.42, 0.46], [0.52, 0.3], [0.58, 0.12]], [[0.46, 0.42], [0.66, 0.3], [0.8, 0.18]],
    [[0.44, 0.47], [0.7, 0.5], [0.84, 0.4]], [[0.43, 0.48], [0.6, 0.62], [0.76, 0.64]]],
};

export function angiography({ box, side = "E", occlusion = "M1", reperfused = false }) {
  const sign = screenSign(side);
  const place = ([lateral, v]) => [box.x + box.width * (0.5 + sign * lateral * 0.46), box.y + box.height * v];
  let markup = rect(box.x, box.y, box.width, box.height, COLORS.dsaBackground);
  markup += raster(box, (u, v) => {
    const r = Math.hypot((u - 0.5) / 0.48, (v - 0.48) / 0.5);
    return r > 0.94 && r < 1 ? "#b3b7c1" : null;   // o contorno do crânio, bem apagado
  });
  const vessel = (points, width) => line(points.map(place), COLORS.dsaVessel, width);
  markup += vessel(DSA_TREE.ICA, 14) + vessel(DSA_TREE.ACA, 10);
  const open = reperfused || occlusion !== "M1";
  markup += vessel(open ? DSA_TREE.M1 : [DSA_TREE.M1[0], [0.25, 0.474]], 12);
  if (open) markup += DSA_TREE.MCA.map((branch) => vessel(branch, 8)).join("");
  const markerY = box.y + 52;
  return markup + label("D", box.x + 30, markerY, { size: 34, color: "#3a3e4a" })
    + label("E", box.x + box.width - 30, markerY, { size: 34, color: "#3a3e4a" });
}

export function angiographyCompare({ box, side = "E", occlusion = "M1", titles = ["antes", "depois"] }) {
  const gap = 24, width = (box.width - gap) / 2;
  const left = { x: box.x, y: box.y, width, height: box.height };
  const right = { x: box.x + width + gap, y: box.y, width, height: box.height };
  return angiography({ box: left, side, occlusion, reperfused: false })
    + angiography({ box: right, side, occlusion, reperfused: true })
    + label(titles[0], left.x + width / 2, box.y - 24) + label(titles[1], right.x + width / 2, box.y - 24);
}
