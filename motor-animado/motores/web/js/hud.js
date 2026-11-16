// hud.js: a camada de jogo por cima da cena (estilo saga), toda função de t, configurada pelo plano.js (HUD).
//   life:      {label, keyframes: [[t, 0..100], ...]}            barra de vida (interpola entre os pontos)
//   timer:     {label, start, stop, rate, counter?: {label, perMinute}}  cronômetro (rate: segundos da história por
//              segundo de vídeo) e um contador opcional (ex.: neurônios perdidos por minuto da história)
//   chapters:  [{at, until, number, title}]                       telas de capítulo
//   banners:   [{at, until, text, tone: "win" | "alert"}]          avisos grandes ("MISSÃO CUMPRIDA")
//   mission:   {title, from, until, items: [{label, at}]}          missão com caixinhas que se marcam
//   inventory: {from, until, items: [{icon, label, blockedAt}]}    itens; os bloqueados ganham um X
//   boss:      {name, from, until, keyframes: [[t, 0..100]]}       barra de vida do chefão
import { clamp, pop } from "./nucleo.js";

const CSS = `
.hud { position:absolute; inset:0; pointer-events:none; font-family: var(--font); color:#fff; }
.hud .panel { position:absolute; background:rgba(12,10,30,.78); border:6px solid #fff; border-radius:22px; padding:14px 22px;
  box-shadow:0 10px 0 rgba(0,0,0,.45); }
.hud .life { left:40px; top:60px; width:470px; }
.hud .life b, .hud .boss b { display:block; font-size:30px; letter-spacing:2px; margin-bottom:8px; }
.hud .bar { height:30px; border-radius:12px; background:#2a2440; overflow:hidden; border:4px solid #000; }
.hud .bar i { display:block; height:100%; width:100%; background:linear-gradient(#7dff8a,#22b04a); transition:none; }
.hud .bar i.low { background:linear-gradient(#ff8a7d,#d0202a); }
.hud .timer { right:40px; top:60px; text-align:right; font-size:30px; }
.hud .timer big { display:block; font-size:62px; font-weight:900; color:#ffd21f; -webkit-text-stroke:4px #000; paint-order:stroke fill; }
.hud .timer small { display:block; font-size:24px; margin-top:4px; color:#ff9a9a; }
.hud .chapter { left:50%; top:620px; width:940px; transform-origin:50% 50%; text-align:center; background:rgba(12,10,30,.88); }
.hud .chapter small { display:block; font-size:38px; letter-spacing:8px; color:#ffd21f; }
.hud .chapter strong { display:block; font-size:76px; font-weight:900; line-height:1.05; }
.hud .banner { position:absolute; left:50%; top:560px; width:1000px; text-align:center; font-size:88px; font-weight:900; line-height:1.05; -webkit-text-stroke:10px #000; paint-order:stroke fill; }
.hud .banner.win { color:#ffd21f; } .hud .banner.alert { color:#ff4a4a; }
.hud .mission { left:40px; top:250px; font-size:34px; line-height:1.5; }
.hud .mission b { display:block; color:#ffd21f; font-size:30px; letter-spacing:2px; }
.hud .mission span.done { color:#7dff8a; }
.hud .inventory { position:absolute; left:50%; top:1540px; display:flex; gap:18px; }
.hud .slot { position:relative; width:150px; height:150px; border-radius:20px; background:#2a2440; border:5px solid #fff; font-size:70px;
  display:flex; align-items:center; justify-content:center; }
.hud .slot em { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-style:normal; font-size:150px;
  color:#ff2a2a; -webkit-text-stroke:6px #000; paint-order:stroke fill; }
.hud .slot small { position:absolute; bottom:-46px; left:0; right:0; text-align:center; font-size:26px; }
.hud .boss { left:50%; top:200px; width:640px; transform:translateX(-50%); border-color:#ff4a4a; }
.hud .boss .bar i { background:linear-gradient(#ff7a7a,#a01020); }
`;

const el = (parent, className, html = "") => {
  const div = document.createElement("div");
  div.className = className;
  div.innerHTML = html;
  parent.appendChild(div);
  return div;
};
const show = (node, scale) => { node.style.opacity = scale > 0 ? 1 : 0; return scale; };

export function keyframed(keyframes, t) {
  if (t <= keyframes[0][0]) return keyframes[0][1];
  for (let i = 1; i < keyframes.length; i++) {
    const [t1, v1] = keyframes[i], [t0, v0] = keyframes[i - 1];
    if (t < t1) return v0 + (v1 - v0) * clamp((t - t0) / Math.max(1e-6, t1 - t0));
  }
  return keyframes[keyframes.length - 1][1];
}

function clockText(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function buildBars(layer, hud) {
  const parts = {};
  if (hud.life) parts.life = el(layer, "panel life", `<b>${hud.life.label}</b><div class="bar"><i></i></div>`);
  if (hud.timer) parts.timer = el(layer, "panel timer", `${hud.timer.label}<big>00:00</big><small></small>`);
  if (hud.boss) parts.boss = el(layer, "panel boss", `<b>${hud.boss.name}</b><div class="bar"><i></i></div>`);
  if (hud.mission) parts.mission = el(layer, "panel mission", `<b>${hud.mission.title}</b>` + hud.mission.items.map((i) => `<span>☐ ${i.label}</span>`).join("<br>"));
  if (hud.inventory) parts.inventory = el(layer, "inventory", hud.inventory.items.map((i) => `<div class="slot">${i.icon}<em>✕</em><small>${i.label}</small></div>`).join(""));
  parts.chapters = (hud.chapters || []).map((c) => ({ ...c, node: el(layer, "panel chapter", `<small>CAPÍTULO ${c.number}</small><strong>${c.title}</strong>`) }));
  parts.banners = (hud.banners || []).map((b) => ({ ...b, node: el(layer, `banner ${b.tone || "win"}`, b.text) }));
  return parts;
}

function updateTimer(node, timer, t) {
  const running = clamp(t, timer.start, timer.stop ?? Infinity) - timer.start;
  const visible = t >= timer.start - 0.3 && t < (timer.hideAt ?? Infinity);
  node.style.opacity = visible ? 1 : 0;
  const story = running * (timer.rate || 1);
  node.querySelector("big").textContent = clockText(story);
  if (timer.counter) {
    const lost = Math.round(story / 60 * timer.counter.perMinute);
    node.querySelector("small").textContent = `${timer.counter.label}: ${lost.toLocaleString("pt-BR")}`;
  }
}

function updateMission(node, mission, t) {
  node.style.opacity = t >= mission.from && t < mission.until ? 1 : 0;
  node.querySelectorAll("span").forEach((span, k) => {
    const done = t >= mission.items[k].at;
    span.className = done ? "done" : "";
    span.textContent = `${done ? "☑" : "☐"} ${mission.items[k].label}`;
  });
}

export function createHud(root, hud) {
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);
  const layer = el(root, "hud");
  const parts = buildBars(layer, hud);
  return function update(t) {
    if (parts.life) {
      parts.life.style.opacity = t >= (hud.life.from ?? 0) && t < (hud.life.until ?? Infinity) ? 1 : 0;
      const value = keyframed(hud.life.keyframes, t), fill = parts.life.querySelector("i");
      fill.style.width = `${value}%`;
      fill.className = value < 40 ? "low" : "";
    }
    if (parts.timer) updateTimer(parts.timer, hud.timer, t);
    if (parts.boss) {
      parts.boss.style.opacity = t >= hud.boss.from && t < hud.boss.until ? 1 : 0;
      parts.boss.querySelector("i").style.width = `${keyframed(hud.boss.keyframes, t)}%`;
    }
    if (parts.mission) updateMission(parts.mission, hud.mission, t);
    if (parts.inventory) {
      parts.inventory.style.opacity = t >= hud.inventory.from && t < hud.inventory.until ? 1 : 0;
      parts.inventory.style.transform = `translateX(-50%) scale(${pop(t, hud.inventory.from, hud.inventory.until)})`;
      parts.inventory.querySelectorAll("em").forEach((x, k) => (x.style.opacity = t >= hud.inventory.items[k].blockedAt ? 1 : 0));
    }
    for (const c of parts.chapters) c.node.style.transform = `translateX(-50%) scale(${show(c.node, pop(t, c.at, c.until))})`;
    for (const b of parts.banners) b.node.style.transform = `translateX(-50%) scale(${show(b.node, pop(t, b.at, b.until))}) rotate(-3deg)`;
  };
}
