// busto.js: o retrato de diálogo em pixel art — aquele busto fixo que aparece na caixa de fala dos jogos antigos.
// Nada de boneco 3D articulado: aqui o personagem é um desenho, feito numa grade pequena de pixels e ampliado sem
// suavizar. O que se mexe é o rosto (olhos, sobrancelhas, boca) e uma respiração de um pixel.
//
//   bustTexture(opcoes)              -> {canvas, texture, repaint(face)}: só o desenho
//   bustPlane(cena, style, opcoes)   -> {mesh, group, setFace, pose, update}: o retrato como plano na cena 3D
//   dialogPortrait(root, style, op)  -> {element, setFace, say(texto), draw(t)}: retrato + caixa de fala, em HTML
//
// opcoes: {skin, hair, hairStyle: "black-power"|"curto"|"franja", cloth, band, accent, grid, scale}
// face: {eyes: "open"|"happy"|"closed"|"wide"|"side", brows: "calm"|"up"|"worried"|"angry", mouth: "smile"|"open"|"o"|"flat"|"sad"}
import * as THREE from "three";

const GRID = 56;                     // o desenho tem 56 por 64 "pixels": é essa grade que dá o ar de 8 bits
const ROWS = 64;

const DEFAULTS = {
  skin: "#e0a173", shadow: "#b87a52", ink: "#17131f", hair: "#1b1620", hairStyle: "black-power",
  cloth: "#23202b", clothDark: "#17151d", band: "#f2efe6", accent: "#e9b53c", white: "#f6f2e8",
  scale: 10,
};

// ---------- as ferramentas de desenho em grade ----------
function painter(c, scale) {
  const px = (x, y, w, h, color) => { c.fillStyle = color; c.fillRect(x * scale, y * scale, w * scale, h * scale); };
  // uma elipse cheia, pintada linha a linha: é assim que o pixel art faz curva
  const ellipse = (cx, cy, rx, ry, color) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      const dy = (y + 0.5 - cy) / ry;
      if (Math.abs(dy) > 1) continue;
      const half = Math.floor(rx * Math.sqrt(1 - dy * dy));
      px(Math.round(cx - half), y, half * 2, 1, color);
    }
  };
  return { px, ellipse };
}

// ---------- o rosto ----------
function drawEyes(p, o, face) {
  const kind = face.eyes || "open", y = 31;
  for (const x of [20, 32]) {
    if (kind === "closed" || kind === "happy") {
      p.px(x, y + 2, 5, 1, o.ink);
      if (kind === "happy") { p.px(x, y + 1, 1, 1, o.ink); p.px(x + 4, y + 1, 1, 1, o.ink); }
      continue;
    }
    const tall = kind === "wide" ? 6 : 5;
    p.px(x, y, 5, tall, o.white);
    p.px(x, y, 5, 1, o.ink);
    const look = kind === "side" ? 2 : 1;
    p.px(x + look, y + 1, 2, tall - 2, o.ink);        // a íris
    p.px(x + look, y + 1, 1, 1, o.white);             // o brilho
  }
}

function drawBrows(p, o, face) {
  const kind = face.brows || "calm";
  const lift = { calm: 0, up: -2, worried: 0, angry: 1 }[kind] ?? 0;
  for (const [x, side] of [[19, -1], [31, 1]]) {
    const tilt = { calm: 0, up: 0, worried: -side, angry: side }[kind] ?? 0;
    p.px(x, 28 + lift + Math.max(0, tilt), 3, 2, o.hair);
    p.px(x + 3, 28 + lift + Math.max(0, -tilt), 4, 2, o.hair);
  }
}

function drawMouth(p, o, face) {
  const kind = face.mouth || "smile", y = 41;
  if (kind === "open") { p.px(25, y, 6, 5, "#7a2230"); p.px(26, y + 1, 4, 2, "#c2566a"); return; }
  if (kind === "o") { p.px(26, y, 4, 4, "#7a2230"); return; }
  if (kind === "flat") { p.px(24, y + 1, 8, 1, o.ink); return; }
  if (kind === "sad") { p.px(25, y + 2, 6, 1, o.ink); p.px(24, y + 1, 1, 1, o.ink); p.px(31, y + 1, 1, 1, o.ink); return; }
  p.px(25, y + 1, 6, 1, o.ink);                        // sorriso
  p.px(24, y, 1, 1, o.ink);
  p.px(31, y, 1, 1, o.ink);
}

// ---------- o cabelo ----------
function drawHair(p, o) {
  const estilo = o.hairStyle;
  if (estilo === "black-power") {
    p.ellipse(26, 17, 20, 15, o.hair);                 // o volume redondo por cima e dos lados
    p.ellipse(26, 20, 17, 13, o.hair);
    for (let k = 0; k < 14; k++) {                     // as pontas soltas na borda
      const a = (k / 14) * Math.PI * 2;
      p.px(Math.round(26 + Math.sin(a) * 20), Math.round(17 + Math.cos(a) * 15), 3, 3, o.hair);
    }
    return;
  }
  if (estilo === "franja") {
    p.ellipse(26, 18, 16, 12, o.hair);
    p.px(12, 22, 28, 6, o.hair);
    return;
  }
  p.ellipse(26, 17, 15, 10, o.hair);                   // curto
  p.px(12, 20, 6, 10, o.hair);
  p.px(34, 20, 6, 10, o.hair);
}

// ---------- o busto inteiro ----------
function drawBust(c, o, face, scale) {
  const p = painter(c, scale);
  c.clearRect(0, 0, GRID * scale, ROWS * scale);
  // o halo atrás, como nos retratos de diálogo
  if (o.accent) { p.ellipse(26, 26, 25, 25, o.accent + "22"); p.ellipse(26, 26, 21, 21, o.accent + "33"); }
  // ombros e peito
  p.ellipse(26, 70, 27, 27, o.ink);
  p.ellipse(26, 70, 26, 26, o.clothDark);
  p.ellipse(26, 72, 23, 23, o.cloth);
  p.px(22, 44, 9, 8, o.skin);                          // o pescoço
  p.px(22, 44, 9, 2, o.shadow);
  // a cabeça, com o contorno escuro de 1 pixel por baixo
  p.ellipse(26, 32, 16, 18, o.ink);
  p.ellipse(26, 32, 15, 17, o.skin);
  p.px(10, 30, 3, 5, o.skin);                          // as orelhas
  p.px(39, 30, 3, 5, o.skin);
  p.ellipse(26, 36, 14, 13, o.skin);
  drawHair(p, o);
  p.ellipse(26, 34, 13, 12, o.skin);                   // o rosto por cima do cabelo (a testa aparece)
  if (o.band) { p.px(12, 22, 28, 3, o.band); p.px(12, 22, 28, 1, "#ffffff"); p.px(12, 25, 28, 1, o.shadow); }
  drawBrows(p, o, face);
  drawEyes(p, o, face);
  p.px(25, 36, 2, 3, o.shadow);                        // o nariz
  p.px(16, 38, 4, 2, "#d98f78");                       // as bochechas
  p.px(33, 38, 4, 2, "#d98f78");
  drawMouth(p, o, face);
}

export function bustTexture(options = {}) {
  const o = { ...DEFAULTS, ...options }, scale = o.scale;
  const canvas = document.createElement("canvas");
  canvas.width = GRID * scale;
  canvas.height = ROWS * scale;
  const c = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  let painted = "";
  const repaint = (face) => {
    const key = JSON.stringify(face);
    if (key === painted) return;
    drawBust(c, o, face, scale);
    texture.needsUpdate = true;
    painted = key;
  };
  repaint({ eyes: "open", mouth: "smile", brows: "calm" });
  return { canvas, texture, repaint };
}

// ---------- o retrato como plano na cena ----------
export function bustPlane(scene, style, options = {}) {
  const o = { ...DEFAULTS, ...(style.bust || {}), ...options };
  const { texture, repaint } = bustTexture(o);
  const height = o.height || 3.2, width = (height * GRID) / ROWS;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.35 }));
  mesh.userData.keepGeometry = true;
  const group = new THREE.Group();
  group.add(mesh);
  scene.add(group);
  let face = { eyes: "open", mouth: "smile", brows: "calm" };
  // as poses do boneco antigo viram expressão: o busto não tem braço nem perna
  const PORPOSE = { standing: {}, handsOnHips: { brows: "up" }, point: { eyes: "wide", mouth: "open" },
    think: { eyes: "side", brows: "worried", mouth: "flat" }, cheer: { eyes: "happy", mouth: "open" },
    wave: { eyes: "happy", mouth: "smile" } };
  return {
    mesh, group, texture,
    setFace(next) { face = { ...face, ...next }; },
    pose(value) { if (typeof value === "string" && PORPOSE[value]) face = { ...face, ...PORPOSE[value] }; },
    update(t) {
      const blink = (t % 4.3) < 0.12 && face.eyes === "open";
      repaint(blink ? { ...face, eyes: "closed" } : face);
      group.position.y = (o.y || 0) + 0.03 * Math.sin(t * 1.8);      // a respiração, de um pixel
    },
  };
}

// ---------- o retrato com caixa de fala, em HTML ----------
const CSS = `
.bust-dialogo { position: absolute; z-index: 7; display: flex; align-items: flex-end; gap: 0; }
.bust-dialogo .retrato { image-rendering: pixelated; border: 6px solid var(--bust-borda, #f2efe6);
  border-right-width: 0; background: var(--bust-fundo, #1b1430); }
.bust-dialogo .fala { flex: 1; align-self: stretch; background: var(--bust-fundo, #1b1430);
  border: 6px solid var(--bust-borda, #f2efe6); color: var(--bust-cor, #f6f2e8); font-family: var(--font);
  font-size: var(--bust-tamanho, 34px); line-height: 1.3; padding: 18px 20px; }
.bust-dialogo .nome { position: absolute; top: -26px; left: 18px; background: var(--bust-borda, #f2efe6);
  color: var(--bust-fundo, #1b1430); font-size: 24px; font-weight: 800; padding: 3px 14px; letter-spacing: 2px; }
`;

// o retrato sozinho num canto, com moldura, sem caixa de fala: o jeito mais comum de usar o busto num vídeo em que
// a legenda já conta o que está sendo dito. Fica preso à tela, então a câmera pode andar pelo mundo à vontade.
export function bustCorner(root, style, options = {}) {
  if (!document.getElementById("bust-css")) {
    const tag = document.createElement("style");
    tag.id = "bust-css";
    tag.textContent = CSS;
    document.head.append(tag);
  }
  const o = { ...DEFAULTS, ...(style.bust || {}), ...options };
  const { canvas, repaint } = bustTexture({ ...o, scale: 4 });
  const largura = o.portrait ?? 300;
  const box = document.createElement("div");
  box.className = "bust-canto";
  box.style.cssText = `position:absolute; z-index:7; ${o.lado === "direita" ? "right" : "left"}:${o.margem ?? 44}px;` +
    ` bottom:${o.bottom ?? 300}px; border:6px solid var(--bust-borda, #f2efe6); background: var(--bust-fundo, rgba(20,16,38,.82));`;
  canvas.style.cssText = `image-rendering: pixelated; width:${largura}px; height:${Math.round(largura * ROWS / GRID)}px; display:block;`;
  box.append(canvas);
  if (o.nome) {
    const nome = document.createElement("span");
    nome.className = "nome";
    nome.textContent = o.nome;
    box.style.position = "absolute";
    box.append(nome);
  }
  root.append(box);
  let face = { eyes: "open", mouth: "smile", brows: "calm" };
  const PORPOSE = { standing: {}, handsOnHips: { brows: "up" }, point: { eyes: "wide", mouth: "open" },
    think: { eyes: "side", brows: "worried", mouth: "flat" }, cheer: { eyes: "happy", mouth: "open" },
    wave: { eyes: "happy", mouth: "smile" } };
  return {
    element: box,
    setFace(next) { face = { ...face, ...next }; },
    pose(value) { if (typeof value === "string" && PORPOSE[value]) face = { ...face, ...PORPOSE[value] }; },
    // falando: deixa a boca se mexer enquanto a frase corre (passe true nos trechos com voz)
    update(t, falando = true) {
      const blink = (t % 4.3) < 0.12;
      const boca = falando && Math.floor(t * 6) % 2 ? "open" : face.mouth;
      repaint({ ...face, eyes: blink && face.eyes === "open" ? "closed" : face.eyes, mouth: boca });
    },
  };
}

export function dialogPortrait(root, style, options = {}) {
  if (!document.getElementById("bust-css")) {
    const tag = document.createElement("style");
    tag.id = "bust-css";
    tag.textContent = CSS;
    document.head.append(tag);
  }
  const o = { ...DEFAULTS, ...(style.bust || {}), ...options };
  const { canvas, repaint } = bustTexture({ ...o, scale: 4 });
  const box = document.createElement("div");
  box.className = "bust-dialogo";
  box.style.cssText = `left:${o.left ?? 40}px; right:${o.right ?? 40}px; bottom:${o.bottom ?? 160}px;`;
  const retrato = document.createElement("div"), fala = document.createElement("div");
  retrato.className = "retrato";
  fala.className = "fala";
  canvas.style.cssText = `width:${o.portrait ?? 220}px; height:${Math.round((o.portrait ?? 220) * ROWS / GRID)}px; display:block;`;
  retrato.append(canvas);
  if (o.nome) {
    const nome = document.createElement("span");
    nome.className = "nome";
    nome.textContent = o.nome;
    box.append(nome);
  }
  box.append(retrato, fala);
  root.append(box);
  let face = { eyes: "open", mouth: "smile", brows: "calm" }, texto = "";
  return {
    element: box,
    setFace(next) { face = { ...face, ...next }; },
    say(novo) { texto = novo || ""; },
    draw(t, { chars = Infinity } = {}) {
      // a boca se mexe enquanto o texto corre, como nos diálogos antigos
      const falando = chars < texto.length;
      const blink = (t % 4.3) < 0.12;
      repaint({ ...face, mouth: falando && Math.floor(t * 7) % 2 ? "open" : face.mouth, eyes: blink ? "closed" : face.eyes });
      fala.textContent = texto.slice(0, Math.max(0, Math.floor(chars)));
    },
  };
}
