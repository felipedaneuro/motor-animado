// Peças originais em SVG de pixels, sem quadros, marcas ou áudio da referência.
const COLORS = {
  ink: "#2b241e", paper: "#e1c7a1", pale: "#f1dfb8", wood: "#915d2d",
  sky: "#4981c5", far: "#8bb4d6", grass: "#526b35", shade: "#2b3723",
  teal: "#335054", gold: "#d7b382", green: "#527846", red: "#a35445",
};
const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const ease = (value) => 1 - Math.pow(1 - clamp(value), 3);
const escapeText = (value) => String(value).replace(/[&<>"']/g, (letter) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[letter]);
const rect = (x, y, width, height, fill, extra = "") =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" ${extra}/>`;
const polygon = (points, fill) => `<polygon points="${points}" fill="${fill}"/>`;
const group = (content, x = 0, y = 0, scale = 1, extra = "") =>
  `<g transform="translate(${x} ${y}) scale(${scale})" ${extra}>${content}</g>`;
const text = (value, x, y, size = 34, fill = COLORS.ink) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}">${escapeText(value)}</text>`;

function textBlock(value, x, y, width, size = 34, fill = COLORS.ink) {
  const lines = [""];
  const limit = Math.max(1, Math.floor(width / (size * 0.62)));
  for (const word of String(value).split(/\s+/)) {
    const last = lines.length - 1;
    if (lines[last] && lines[last].length + word.length + 1 > limit) lines.push(word);
    else lines[last] += (lines[last] ? " " : "") + word;
  }
  return lines.map((line, index) => text(line, x, y + index * size * 1.4, size, fill)).join("");
}

function typed(value, t, at, rate = 27) {
  return String(value).slice(0, Math.max(0, Math.floor((t - at) * rate)));
}

export function parchmentPanel(x, y, width, height, title = "") {
  return rect(x + 8, y + 8, width, height, COLORS.ink)
    + rect(x, y, width, height, COLORS.ink)
    + rect(x + 6, y + 6, width - 12, height - 12, COLORS.wood)
    + rect(x + 14, y + 14, width - 28, height - 28, COLORS.pale)
    + rect(x + 22, y + 22, width - 44, 6, "#fff0ce")
    + (title ? text(title, x + 32, y + 66, 38) : "");
}

function face(t, { skin = "#a96f48", hair = "#252329", speaking = false } = {}) {
  const blink = Math.floor(t * 30) % 121 < 4;
  const mouth = speaking && Math.floor(t * 8) % 2 ? 2 : 1;
  return rect(4, 0, 16, 4, COLORS.ink) + rect(2, 4, 20, 16, COLORS.ink)
    + rect(4, 4, 16, 14, skin) + rect(4, 2, 16, 5, hair)
    + rect(2, 6, 4, 12, hair) + rect(18, 6, 4, 12, hair)
    + rect(6, 10, 3, blink ? 1 : 3, COLORS.ink)
    + rect(15, 10, 3, blink ? 1 : 3, COLORS.ink)
    + rect(10, 15, 4, mouth, COLORS.ink) + rect(9, 18, 6, 4, skin);
}

export function avatarSprite(t, options = {}) {
  const { x = 540, y = 1030, scale = 4, walking = false, shirt = "#3c7777" } = options;
  const stride = walking ? Math.floor(t * 7) % 2 : 0;
  const body = rect(4, 21, 16, 13, COLORS.ink) + rect(6, 22, 12, 11, shirt)
    + rect(2, 23, 4, 9, COLORS.ink) + rect(18, 23, 4, 9, COLORS.ink)
    + rect(7, 21, 10, 3, "#bf7350") + rect(6, 33, 5, 8 - stride, "#383947")
    + rect(13, 33, 5, 7 + stride, "#383947")
    + rect(4, 39 - stride, 7, 3, COLORS.ink) + rect(13, 38 + stride, 7, 3, COLORS.ink);
  return group(face(t, options) + body, x - 12 * scale, y - 42 * scale, scale);
}

export function portrait(t, options = {}) {
  const shirt = options.shirt || "#3c7777";
  return group(rect(0, 23, 24, 15, COLORS.ink) + rect(2, 25, 20, 13, shirt)
    + rect(8, 22, 8, 4, "#bf7350") + face(t, options),
  options.x ?? 140, options.y ?? 270, options.scale ?? 12);
}

function tree(x, y, scale = 1) {
  const crown = polygon("4,0 14,0 14,3 19,3 19,8 22,8 22,17 18,17 18,21 3,21 3,17 0,17 0,7 4,7", COLORS.ink)
    + rect(4, 4, 14, 13, COLORS.shade) + rect(5, 3, 9, 8, COLORS.grass)
    + rect(4, 16, 14, 4, COLORS.teal);
  return group(rect(9, 16, 5, 16, COLORS.wood) + crown, x, y, scale);
}

function grassTiles() {
  return Array.from({ length: 96 }, (_, index) => {
    const x = (index * 137 + 29) % 1060;
    const y = 550 + (index * 83) % 1130;
    return rect(x, y, 6, 6, index % 5 ? "#678449" : "#9c9b58");
  }).join("");
}

export function building({ x = 330, y = 620, scale = 1, repaired = false } = {}) {
  const roof = polygon("0,70 30,70 30,45 65,45 65,20 345,20 345,45 380,45 380,70 410,70 410,100 0,100", COLORS.ink)
    + polygon("15,75 45,75 45,50 80,50 80,35 330,35 330,50 365,50 365,75 395,75 395,85 15,85", repaired ? COLORS.teal : COLORS.wood);
  const wall = rect(25, 100, 360, 240, COLORS.ink) + rect(35, 105, 340, 225, COLORS.paper)
    + rect(57, 140, 80, 95, COLORS.ink) + rect(67, 150, 60, 75, COLORS.far)
    + rect(270, 140, 80, 95, COLORS.ink) + rect(280, 150, 60, 75, COLORS.far)
    + rect(170, 190, 75, 150, COLORS.ink) + rect(182, 202, 51, 125, repaired ? COLORS.teal : "#70513c");
  const damage = repaired ? rect(190, 250, 8, 8, COLORS.gold)
    : polygon("200,210 215,226 205,240 225,256 211,268 220,288 204,279 194,253 204,240 194,226", COLORS.shade);
  return group(roof + wall + damage, x, y, scale);
}

function sky(t) {
  const cloud = (x, y) => group(rect(24, 0, 90, 18, "#e2dfca")
    + rect(0, 18, 150, 30, "#e2dfca") + rect(18, 48, 120, 12, COLORS.far), x, y);
  return rect(0, 0, 1080, 1920, COLORS.sky) + rect(0, 330, 1080, 260, "#5f98c4")
    + rect(0, 590, 1080, 430, COLORS.far)
    + cloud(90 + Math.floor(t / 3) % 24, 220) + cloud(760, 420)
    + polygon("0,920 0,810 130,810 130,720 240,720 240,670 350,670 350,780 500,780 500,850 680,850 680,730 800,730 800,650 920,650 920,800 1080,800 1080,1020", "#678e9d");
}

export function landscapeWorld(t, { reveal = 1, avatar = {} } = {}) {
  const scale = 1.25 - 0.25 * ease(reveal);
  const content = sky(t) + rect(0, 960, 1080, 960, COLORS.grass)
    + rect(0, 1430, 1080, 110, "#b09972")
    + Array.from({ length: 7 }, (_, index) => tree(index * 165 - 40, 850, 5)).join("")
    + building({ x: 335, y: 990 }) + avatarSprite(t, { x: 540, y: 1400, scale: 5, ...avatar });
  return group(content, 540 * (1 - scale), 950 * (1 - scale), scale);
}

export function villageWorld(t, { avatar = {}, mission = true } = {}) {
  const stones = Array.from({ length: 18 }, (_, index) =>
    rect(440 + index % 3 * 66, 1080 + Math.floor(index / 3) * 75, 45, 22, "#b09972")).join("");
  const trees = [20, 190, 790, 950].map((x, index) => tree(x, 360 + index % 2 * 60, 5)).join("");
  const pointer = mission ? group(polygon("0,0 54,0 54,26 70,26 27,65 -16,26 0,26", COLORS.gold),
    510, 560 + (Math.floor(t * 3) % 2) * 8) : "";
  return rect(0, 0, 1080, 1920, COLORS.grass) + grassTiles()
    + rect(440, 500, 210, 1420, "#8d7756") + rect(0, 1250, 1080, 140, "#8d7756")
    + stones + trees + building({ x: 325, y: 680 }) + pointer
    + rect(80, 1040, 210, 20, COLORS.wood) + rect(95, 1060, 18, 65, COLORS.ink)
    + avatarSprite(t, { x: 540, y: 1215, scale: 5, ...avatar })
    + avatarSprite(t, { x: 810, y: 1225, scale: 4, hair: "#92917f", shirt: COLORS.wood })
    + journeyHud(t);
}

export function journeyHud(t, { chapter = 1, resources = 3 } = {}) {
  const tools = [0, 1, 2].map((index) => group(
    rect(0, 0, 84, 84, COLORS.ink) + rect(6, 6, 72, 72, COLORS.paper)
    + rect(22, 26, 40, 35, index === 0 ? COLORS.wood : COLORS.teal)
    + rect(30, 17, 24, 8, COLORS.ink)
    + (index === 1 ? rect(39, 26, 6, 35, COLORS.pale) : "")
    + (index === 2 ? rect(22, 40, 40, 6, COLORS.gold) : ""), 75 + index * 100, 1280)).join("");
  return parchmentPanel(60, 80, 960, 130)
    + text("Capítulo " + chapter, 95, 162, 38)
    + text("Recursos " + resources, 660, 162, 34)
    + tools;
}

export function officeRoom(t, { avatar = {} } = {}) {
  const rain = Array.from({ length: 19 }, (_, index) => {
    const x = 655 + index * 47 % 290;
    const y = 280 + (index * 61 + Math.floor(t * 150)) % 430;
    return rect(x, y, 4, 28, COLORS.far);
  }).join("");
  return rect(0, 0, 1080, 1920, COLORS.teal) + rect(620, 230, 380, 540, COLORS.ink)
    + rect(640, 250, 340, 500, "#27394e") + rain
    + rect(800, 250, 15, 500, COLORS.ink) + rect(640, 480, 340, 15, COLORS.ink)
    + portrait(t, { x: 220, y: 610, scale: 19, ...avatar })
    + rect(0, 1180, 1080, 740, COLORS.wood) + rect(0, 1180, 1080, 28, COLORS.gold)
    + rect(200, 1240, 280, 155, COLORS.pale) + rect(750, 1220, 110, 110, COLORS.ink)
    + rect(760, 1230, 90, 80, COLORS.paper);
}

export function travelStop(t, { avatar = {}, arrived = false } = {}) {
  const bus = rect(80, 910, 610, 310, COLORS.ink) + rect(92, 925, 586, 265, COLORS.gold)
    + rect(112, 950, 160, 110, COLORS.teal) + rect(290, 950, 160, 110, COLORS.teal)
    + rect(500, 950, 145, 230, COLORS.teal) + rect(150, 1190, 95, 70, COLORS.ink)
    + rect(545, 1190, 95, 70, COLORS.ink);
  return sky(t) + rect(0, 960, 1080, 960, COLORS.grass)
    + rect(0, 1260, 1080, 660, "#8d7756") + bus
    + avatarSprite(t, { x: arrived ? 820 : 730, y: 1320, scale: 5, ...avatar })
    + avatarSprite(t, { x: 950, y: 1320, scale: 4, hair: "#92917f", shirt: COLORS.wood });
}

export function dialoguePanel(t, { text: message = "", at = 0, avatar = {} } = {}) {
  return parchmentPanel(60, 1400, 960, 250)
    + portrait(t, { x: 90, y: 1420, scale: 5, ...avatar })
    + textBlock(typed(message, t, at), 245, 1475, 730, 34);
}

export function characterSheet(t, { at = 0, name = "Nara", avatar = {} } = {}) {
  return rect(0, 0, 1080, 1920, COLORS.sky)
    + parchmentPanel(50, 100, 980, 1240, "Seu personagem")
    + parchmentPanel(95, 220, 390, 520) + portrait(t, { x: 140, y: 270, scale: 12, ...avatar })
    + parchmentPanel(560, 220, 370, 520)
    + avatarSprite(t, { x: 745, y: 670, scale: 8, ...avatar })
    + text("Nome", 100, 850, 38) + rect(350, 790, 580, 90, COLORS.paper)
    + text(typed(name, t, at + 0.6, 6), 380, 850, 38)
    + text("Missão", 100, 990, 38)
    + textBlock("Reabrir o centro", 350, 990, 580, 36)
    + rect(630, 1160, 300, 100, COLORS.green) + text("Continuar", 650, 1225, 36, COLORS.pale);
}

export function letterScene(t, { at = 0, message = "A vila precisa de você." } = {}) {
  const elapsed = t - at;
  const y = 150 + ease(elapsed / 0.75) * 430;
  const opened = clamp((elapsed - 1) / 0.24);
  const envelope = rect(240, y, 600, 350, COLORS.ink) + rect(252, y + 12, 576, 326, COLORS.paper)
    + polygon(`252,${y + 12} 540,${y + 195 - opened * 330} 828,${y + 12}`, COLORS.pale)
    + polygon(`252,${y + 338} 540,${y + 150} 828,${y + 338}`, COLORS.gold);
  const paper = parchmentPanel(200, 500, 680, 720, "Uma nova missão")
    + textBlock(message, 245, 640, 590, 38);
  return rect(0, 0, 1080, 1920, COLORS.wood)
    + Array.from({ length: 14 }, (_, index) => rect(0, index * 150, 1080, 6, "#78502d")).join("")
    + envelope + group(paper, 0, 0, 1, `opacity="${clamp((elapsed - 1.5) / 0.27)}"`);
}

export function questWindow(t, { title = "Reabrir o centro", cost = 8, balance = 3 } = {}) {
  const enabled = balance >= cost;
  return rect(0, 0, 1080, 1920, "#101c18", 'opacity=".62"')
    + parchmentPanel(60, 260, 960, 1100, title)
    + building({ x: 125, y: 430, scale: 0.8 })
    + building({ x: 600, y: 430, scale: 0.8, repaired: true })
    + text("Agora", 210, 800, 34) + text("Objetivo", 640, 800, 34)
    + text("Materiais: " + balance + " / " + cost, 125, 915, 38, enabled ? COLORS.green : COLORS.red)
    + rect(125, 960, 830, 40, COLORS.ink) + rect(133, 968, 814 * clamp(balance / Math.max(1, cost)), 24, COLORS.green)
    + textBlock(enabled ? "Tudo pronto para começar" : "Ainda faltam recursos", 125, 1080, 800, 36)
    + rect(300, 1170, 480, 105, enabled ? COLORS.green : "#8e8874")
    + text(enabled ? "Iniciar missão" : "Aguardar", 340, 1237, 38, COLORS.pale);
}

function actionCard(t, at, { y, letter, message, selected }) {
  return group(parchmentPanel(105, y, 870, 205)
    + rect(130, y + 36, 105, 120, selected ? COLORS.green : COLORS.teal)
    + text(letter, 160, y + 118, 52, COLORS.pale)
    + textBlock(message, 270, y + 75, 650, 36)
    + (selected ? rect(120, y + 186, 840, 7, COLORS.green) : ""), 0, 0, 1,
    `opacity="${clamp((t - at) / (5 / 30))}"`);
}

export function choiceWindow(t, { at = 0, firstAt = at + 0.4, secondAt = at + 1.4, options = ["Preparar o mutirão", "Ouvir os moradores"], selected = "" } = {}) {
  const selection = selected === "cycle" ? (Math.floor(Math.max(0, t - at - 2) / 1.5) % 2 ? "B" : "A") : selected;
  return rect(0, 0, 1080, 1920, "#101c18", 'opacity=".65"')
    + parchmentPanel(60, 300, 960, 1010, "Qual será o próximo passo?")
    + actionCard(t, firstAt, { y: 495, letter: "A", message: options[0], selected: selection === "A" })
    + actionCard(t, secondAt, { y: 755, letter: "B", message: options[1], selected: selection === "B" })
    + textBlock("Comente A ou B", 240, 1150, 680, 42);
}

export function endCard(t, { at = 0 } = {}) {
  return rect(0, 0, 1080, 1920, "#202b27")
    + parchmentPanel(80, 600, 920, 530, "A jornada continua")
    + textBlock("Você escolhe o próximo capítulo", 145, 800, 780, 42)
    + rect(145, 990, 790 * clamp((t - at) / 0.3), 12, COLORS.gold);
}

function sceneMarkup(t, state) {
  const avatar = { ...state.avatar, speaking: Boolean(state.speaking) };
  if (state.mode === "character") return characterSheet(t, { ...state, avatar });
  if (state.mode === "letter") return letterScene(t, state);
  if (state.mode === "office") return officeRoom(t, { avatar });
  if (state.mode === "travel") return travelStop(t, { ...state, avatar });
  if (state.mode === "end") return endCard(t, state);
  if (state.mode === "landscape") return landscapeWorld(t, { ...state, avatar });
  let content = villageWorld(t, { ...state, avatar });
  if (state.mode === "quest") content += questWindow(t, state);
  if (state.mode === "choice") content += choiceWindow(t, state);
  if (state.message) content += dialoguePanel(t, { ...state, text: state.message, avatar });
  return content;
}

export function createJourney(root, style, defaults = {}) {
  const layer = document.createElement("div");
  const { width, height } = style.format;
  Object.assign(layer.style, { position: "absolute", inset: "0", pointerEvents: "none", overflow: "hidden" });
  layer.className = "journey-pixel-world";
  root.appendChild(layer);   // depois do canvas 3D (que é opaco) e antes das legendas, que o createOverlay põe por cima
  return function draw(t, state = {}) {
    const content = sceneMarkup(t, { ...defaults, ...state });
    const flash = clamp(1 - (t - (state.cutAt ?? -100)) / (4 / 30));
    layer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920"
      width="${width}" height="${height}" shape-rendering="crispEdges"
      style="display:block;width:100%;height:100%;image-rendering:pixelated;font-family:monospace;font-weight:700"
      role="img" aria-label="Cena original de jornada em pixel art">${content}
      ${rect(0, 0, 1080, 1920, COLORS.pale, 'opacity="' + flash + '"')}</svg>`;
  };
}
