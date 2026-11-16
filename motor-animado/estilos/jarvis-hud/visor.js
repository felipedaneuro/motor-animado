// visor.js do estilo jarvis-hud: o HUD de visor de câmera por cima da cena, tudo função de t, configurado pelo plano.js.
//   createVisor(root, VISOR, duração, cores):
//     sections:  [{at, code, title}]               "02 · UPLOAD" no canto, com um clarão curto na troca
//     headlines: [{at, until, lines: [a, b]}]      o título de duas linhas que se escreve palavra por palavra
//     gauge:     {label, keyframes: [[t, %]]}      o medidor vertical da direita
//     terminal:  [{at, text}]                      as linhas de terminal do canto de baixo (as 3 últimas)
//     ecg:       {from, until, label, irregularFrom}  o traçado do coração (fica irregular a partir de irregularFrom)
//     flashes:   [t, ...]                         clarões extras (cada corte seco de câmera fica escondido por um)
//   createCallouts(root, câmera, CALLOUTS, cores): [{at, until, anchor: () => Vector3, text, side, tone, dy}]
//     etiquetas presas a pontos 3D: o ponto, a linha com cotovelo e a pílula seguem o objeto a cada quadro
import * as THREE from "three";
import { between, clamp, seeded } from "../motor/nucleo.js";
import { keyframed } from "../motor/hud.js";

const W = 1080, H = 1920;

function css(c) {
  return `
.visor { position:absolute; inset:0; pointer-events:none; font-family: Menlo, "SF Mono", monospace; color:${c.ink}; }
.visor .fx { position:absolute; inset:0; background: radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,4,14,.65) 100%),
  repeating-linear-gradient(0deg, rgba(140,200,255,.035) 0 2px, transparent 2px 5px); }
.visor .corner { position:absolute; width:58px; height:58px; border:4px solid rgba(190,225,255,.75); }
.visor .rec { position:absolute; left:92px; top:132px; font-size:26px; letter-spacing:2px; }
.visor .rec i { display:inline-block; width:16px; height:16px; border-radius:50%; background:${c.alert}; margin-right:12px; }
.visor .section { position:absolute; right:92px; top:132px; font-size:26px; letter-spacing:3px; text-align:right; }
.visor .progress { position:absolute; left:92px; right:92px; top:112px; height:4px; background:rgba(140,190,255,.25); }
.visor .progress b { display:block; height:100%; background:${c.blue}; box-shadow:0 0 12px ${c.blue}; }
.visor .gauge { position:absolute; right:70px; top:420px; width:16px; height:420px; background:rgba(140,190,255,.18); }
.visor .gauge b { position:absolute; left:0; right:0; bottom:0; background:${c.blue}; box-shadow:0 0 14px ${c.blue}; }
.visor .gauge small { position:absolute; right:-6px; font-size:22px; letter-spacing:2px; white-space:nowrap; }
.visor .terminal { position:absolute; left:92px; top:1620px; font-size:26px; line-height:1.55; color:rgba(200,230,255,.85); }
.visor .headline { position:absolute; left:60px; right:60px; top:236px; text-align:center; font-family: var(--font);
  font-weight:900; font-size:84px; line-height:1.02; text-transform:uppercase; }
.visor .headline span { display:inline-block; margin:0 10px; }
.visor .headline .l2 { color:${c.blue}; text-shadow:0 0 26px rgba(80,170,255,.85); }
.visor .headline .l1 { color:#fff; text-shadow:0 0 18px rgba(160,210,255,.6); }
.visor .ecg { position:absolute; right:92px; top:1600px; width:420px; padding:10px 14px; background:${c.panel};
  border:2px solid rgba(143,211,255,.6); border-radius:12px; font-size:22px; letter-spacing:2px; }
.visor .flash { position:absolute; inset:0; background:#cfe8ff; opacity:0; }
.callouts { position:absolute; inset:0; pointer-events:none; }
.callouts svg { position:absolute; inset:0; overflow:visible; }
.callouts .pill { position:absolute; padding:8px 18px; border-radius:10px; border:2px solid currentColor; background:${c.panel};
  font-family: Menlo, "SF Mono", monospace; font-size:28px; letter-spacing:2px; white-space:nowrap; transform:translate(-50%,-50%); }
.caption { text-shadow: 0 0 22px rgba(80,170,255,.55); }
.caption em { text-shadow: 0 0 26px rgba(80,170,255,.95); }
.card { border:3px solid ${c.blue}; border-radius:16px; box-shadow:0 0 34px rgba(80,170,255,.45); }`;
}

const el = (parent, className, html = "") => {
  const node = document.createElement("div");
  node.className = className;
  node.innerHTML = html;
  parent.appendChild(node);
  return node;
};
const current = (list, t) => list.filter((item) => t >= item.at).pop();
const timecode = (t) => {
  const frames = Math.floor(t * 30);
  return [Math.floor(frames / 1800), Math.floor(frames / 30) % 60, frames % 30].map((n) => String(n).padStart(2, "0")).join(":");
};

function frameCorners(layer) {
  const spots = [["left:40px;top:60px", "border-right:none;border-bottom:none"], ["right:40px;top:60px", "border-left:none;border-bottom:none"],
    ["left:40px;bottom:60px", "border-right:none;border-top:none"], ["right:40px;bottom:60px", "border-left:none;border-top:none"]];
  spots.forEach(([where, cut]) => { el(layer, "corner").style.cssText = `${where};${cut}`; });
}

function buildVisor(root, visor, colors) {
  const style = document.createElement("style");
  style.textContent = css(colors);
  document.head.appendChild(style);
  const layer = el(root, "visor");
  el(layer, "fx");
  frameCorners(layer);
  const parts = {
    progress: el(layer, "progress", "<b></b>"), rec: el(layer, "rec"), section: el(layer, "section"),
    headline: el(layer, "headline"), terminal: el(layer, "terminal"), flash: el(layer, "flash"),
  };
  if (visor.gauge) parts.gauge = el(layer, "gauge", `<b></b><small style="top:-40px"></small><small style="bottom:-40px">${visor.gauge.label}</small>`);
  if (visor.ecg) parts.ecg = el(layer, "ecg", `<div></div><svg width="390" height="110"><polyline fill="none" stroke="${colors.lime}" stroke-width="3"/></svg>`);
  return parts;
}

function updateHeadline(node, headlines, t) {
  const item = headlines.find((h) => t >= h.at && t < h.until);
  if (!item) { node.style.opacity = 0; return; }
  if (node.dataset.key !== String(item.at)) {
    node.dataset.key = String(item.at);
    node.innerHTML = item.lines.map((line, k) => `<div class="l${k + 1}">${line.split(" ").map((w) => `<span>${w}</span>`).join("")}</div>`).join("");
  }
  node.style.opacity = 1 - between(t, item.until - 0.25, 0.25);
  node.querySelectorAll("span").forEach((word, k) => {
    const u = between(t, item.at + k * 0.09, 0.22);
    word.style.opacity = u;
    word.style.transform = `translateY(${(1 - u) * 18}px)`;
    word.style.filter = `blur(${(1 - u) * 8}px)`;
  });
}

function updateTerminal(node, lines, t) {
  const started = lines.filter((line) => t >= line.at).slice(-3);
  node.innerHTML = started.map((line) => {
    const shown = Math.floor(clamp((t - line.at) / 0.5) * line.text.length);
    return `&gt; ${line.text.slice(0, shown)}${shown < line.text.length ? "▌" : ""}`;
  }).join("<br>");
}

function beatTimes(duration, irregularFrom) {
  const beats = [0];
  for (let k = 0; beats[beats.length - 1] < duration + 4; k++) {
    const last = beats[beats.length - 1];
    beats.push(last + (last >= irregularFrom ? 0.45 + seeded(k + 4100) * 0.75 : 0.82));
  }
  return beats;
}

function ecgValue(tau, beats, irregular) {
  let value = irregular ? 0.07 * Math.sin(tau * 41) * Math.sin(tau * 13) : 0;   // a linha tremida da fibrilação
  for (const b of beats) {
    const d = tau - b;
    if (d < -0.1 || d > 0.5) continue;
    value += Math.exp(-((d / 0.018) ** 2)) - 0.25 * Math.exp(-(((d - 0.05) / 0.03) ** 2)) + 0.2 * Math.exp(-(((d - 0.26) / 0.06) ** 2));
  }
  return value;
}

function updateEcg(node, ecg, beats, t) {
  node.style.opacity = t >= ecg.from && t < ecg.until ? 1 : 0;
  if (node.style.opacity === "0") return;
  const irregular = t >= ecg.irregularFrom;
  node.querySelector("div").textContent = irregular ? ecg.label : "RITMO: NORMAL";
  const points = [];
  for (let i = 0; i < 130; i++) {
    const tau = t - 2.6 + (2.6 * i) / 129;
    points.push(`${(i * 3).toFixed(1)},${(78 - ecgValue(tau, beats, tau >= ecg.irregularFrom) * 60).toFixed(1)}`);
  }
  node.querySelector("polyline").setAttribute("points", points.join(" "));
}

export function createVisor(root, visor, duration, colors) {
  const parts = buildVisor(root, visor, colors);
  const beats = visor.ecg ? beatTimes(duration, visor.ecg.irregularFrom) : [];
  return function update(t) {
    parts.progress.firstChild.style.width = `${clamp(t / duration) * 100}%`;
    parts.rec.innerHTML = `<i style="opacity:${Math.floor(t * 1.2) % 2 ? 0.35 : 1}"></i>REC ${timecode(t)}`;
    const section = current(visor.sections, t);
    parts.section.textContent = section ? `${section.code} · ${section.title}` : "";
    const flashAt = [...visor.sections.map((s) => s.at).filter((at) => at > 0), ...(visor.flashes || [])].filter((at) => t >= at && t - at < 0.3).pop();
    parts.flash.style.opacity = flashAt === undefined ? 0 : 0.3 * (1 - (t - flashAt) / 0.3);
    updateHeadline(parts.headline, visor.headlines, t);
    updateTerminal(parts.terminal, visor.terminal, t);
    if (parts.gauge) {
      const value = keyframed(visor.gauge.keyframes, t), bar = parts.gauge.querySelector("b");
      bar.style.height = `${value}%`;
      bar.style.background = value < 40 ? colors.alert : colors.blue;
      parts.gauge.querySelector("small").textContent = `${Math.round(value)}%`;
    }
    if (parts.ecg) updateEcg(parts.ecg, visor.ecg, beats, t);
  };
}

// ---------- etiquetas presas aos objetos (o "tracking") ----------
function buildCallout(layer, svg, item, colors) {
  const color = colors[item.tone || "blue"];
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.innerHTML = `<polyline fill="none" stroke="${color}" stroke-width="3"/><circle r="9" fill="${color}"/><circle r="18" fill="none" stroke="${color}" stroke-width="2"/>`;
  svg.appendChild(group);
  const pill = el(layer, "pill", item.text);
  pill.style.color = color;
  return { ...item, group, pill };
}

function screenOf(anchor, camera) {
  const v = (typeof anchor === "function" ? anchor() : new THREE.Vector3(...anchor)).clone().project(camera);
  return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, behind: v.z > 1 };
}

export function createCallouts(root, camera, list, colors) {
  const layer = el(root, "callouts");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", W);
  svg.setAttribute("height", H);
  layer.appendChild(svg);
  const items = list.map((item) => buildCallout(layer, svg, item, colors));
  return function update(t) {
    for (const c of items) {
      const on = t >= c.at && t < c.until;
      c.group.style.display = c.pill.style.display = on ? "" : "none";
      if (!on) continue;
      const p = screenOf(c.anchor, camera), dx = (c.side === "left" ? -1 : 1) * (c.dx ?? 230), dy = c.dy ?? -150;
      const grow = between(t, c.at, 0.35), fade = 1 - between(t, c.until - 0.25, 0.25);
      const label = { x: p.x + dx, y: p.y + dy }, elbow = { x: p.x + dx * 0.35, y: p.y + dy };
      const end = { x: elbow.x + (label.x - elbow.x) * grow, y: elbow.y };
      const line = c.group.querySelector("polyline");
      line.setAttribute("points", `${p.x},${p.y} ${p.x + (elbow.x - p.x) * Math.min(1, grow * 2)},${p.y + (elbow.y - p.y) * Math.min(1, grow * 2)} ${grow > 0.5 ? `${end.x},${end.y}` : ""}`);
      c.group.querySelectorAll("circle").forEach((dot) => { dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y); });
      c.group.querySelectorAll("circle")[1].setAttribute("r", 14 + 6 * Math.sin(t * 5));
      c.group.style.opacity = p.behind ? 0 : fade;
      Object.assign(c.pill.style, { left: `${label.x + (c.side === "left" ? -1 : 1) * c.pill.offsetWidth / 2}px`, top: `${label.y}px`,
        opacity: p.behind ? 0 : between(t, c.at + 0.25, 0.2) * fade });
    }
  };
}
