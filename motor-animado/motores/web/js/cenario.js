// cenario.js: o cenário em pixel art — o fundo dos estilos retrô, desenhado pixel a pixel em vez de modelado em
// low-poly. Nada de morro de icosaedro nem pinheiro de cone: aqui o mundo é pintado numa grade pequena, ampliado
// sem suavizar, em camadas a distâncias diferentes (céu, serra, mata, moita e chão). Quem anda é a câmera, e a
// perspectiva entre as camadas faz a profundidade, como no cenário de um jogo antigo.
//
//   pixelWorld(cena, style, {x0, x1})          -> update(t): troca direta do dayWorld (campo ou cidade)
//   pixelSprite(cena, style, {kind|desenho})   -> {group, mesh}: um objeto em pixel, de frente pra câmera
//   pixelTile(largura, altura, escala)         -> {texture, px}: uma folha de pixels para desenhar à mão
//   ICONS                                      -> os desenhos prontos, em grade de 16 por 16
//
// As cores vêm do tema (style.world), e style.pixel_world sobrescreve qualquer uma. A serra do fundo é pintada
// desbotada de propósito: em pixel art a distância se faz com a paleta, não com névoa.
import * as THREE from "three";
import { seeded } from "./nucleo.js";

const DEFAULT = {
  sky: "#8fd3f4", grass: "#6ab04c", dirt: "#c9a86a", far: "#8fa3c0", snow: "#f2f7ff", mid: "#4f7a52",
  leaf: "#6a9c57", trunk: "#6b4a2f", stone: "#9a9a93", cloud: "#ffffff", flower: "#ffd21f",
  wall: "#c9b48a", window: "#ffe9a8", ink: "#1d2433", water: "#7fd0ef", white: "#f6f2e8",
};

// ---------- cor ----------
const full = (c) => (typeof c === "string" && c.length === 4 ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}` : c);
const rgb = (c) => [1, 3, 5].map((i) => parseInt(full(c).slice(i, i + 2), 16));
const hex = (parts) => `#${parts.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
const mix = (a, b, k) => hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * k));
const shade = (color, k) => mix(color, k < 0 ? "#000000" : "#ffffff", Math.abs(k));

function palette(style) {
  const w = style.world || {}, leaves = w.foliage || [DEFAULT.mid, DEFAULT.leaf];
  // o que vier vazio do painel quer dizer "do tema", então não entra por cima
  const escolhas = Object.fromEntries(Object.entries(style.pixel_world || {}).filter(([, v]) => v !== "" && v != null));
  const grass = w.ground || DEFAULT.grass, dirt = w.path || DEFAULT.dirt;
  const sky = (style.stage || {}).background || DEFAULT.sky, hills = w.hills || DEFAULT.far;
  return {
    ...DEFAULT, sky, scenery: w.scenery || "campo",
    grass, grassDark: shade(grass, -0.22), grassLight: shade(grass, 0.16),
    dirt, dirtDark: shade(dirt, -0.2),
    mid: leaves[0], midDark: shade(leaves[0], -0.32), hill: mix(leaves[0], grass, 0.45),
    leaf: leaves[1] || shade(leaves[0], 0.18),
    far: mix(hills, sky, 0.5), farDark: mix(shade(hills, -0.25), sky, 0.4),
    trunk: w.trunk || DEFAULT.trunk, stone: w.rock || DEFAULT.stone, cloud: w.cloud || DEFAULT.cloud,
    wall: (w.buildings || [DEFAULT.wall])[0], wall2: (w.buildings || [])[1] || shade((w.buildings || [DEFAULT.wall])[0], -0.18),
    window: w.windows || DEFAULT.window, flower: (style.accents || [DEFAULT.flower])[0],
    ...escolhas,
  };
}

// ---------- a folha de pixels ----------
export function pixelTile(width, height, scale = 6) {
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext("2d");
  context.imageSmoothingEnabled = false;
  const px = (x, y, w, h, color) => { context.fillStyle = color; context.fillRect(Math.round(x) * scale, Math.round(y) * scale, Math.round(w) * scale, Math.round(h) * scale); };
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return { canvas, texture, px, context, width, height };
}

// um painel: o desenho vira um plano chapado, sem luz e sem névoa, para a cor do pixel chegar inteira na tela
function board(scene, texture, { width, height, position, cutout = true }) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({
    map: texture, transparent: !cutout, alphaTest: cutout ? 0.5 : 0, fog: false, side: THREE.DoubleSide,
  }));
  mesh.position.set(...position);
  scene.add(mesh);
  return mesh;
}

// uma camada do fundo: o desenho acima do chão e a saia enterrada, para o contorno do retrô não achar beirada
function layer(scene, texture, { width, art, rows, skirt, z, center }) {
  const height = art * ((rows + skirt) / rows);
  return board(scene, texture, { width, height, position: [center, art - height / 2, z] });
}

// ---------- o céu ----------
function skySheet(p) {
  const sheet = pixelTile(64, 56, 8), top = mix(p.sky, "#15508c", 0.45), base = shade(p.sky, 0.4), bands = [0, 18, 32, 44, 56];
  for (let b = 0; b < 4; b++) sheet.px(0, bands[b], 64, bands[b + 1] - bands[b], mix(top, base, b / 3));
  for (let b = 1; b < 4; b++) {                                   // o pontilhado entre as faixas, como na era 16 bits
    for (let x = b % 2; x < 64; x += 2) sheet.px(x, bands[b] - 1, 1, 1, mix(top, base, b / 3));
  }
  for (let y = 0; y < 9; y++) {                                   // o sol: um disco de dois tons no alto, à direita
    const half = Math.floor(4.5 * Math.sqrt(1 - ((y - 4) / 4.5) ** 2));
    sheet.px(48 - half, 7 + y, half * 2, 1, y < 4 ? "#fff6d0" : "#ffe9a0");
  }
  return sheet.texture;
}

// ---------- a serra do fundo ----------
const FAR_SKIRT = 18, MID_SKIRT = 14;               // as fileiras extras que entram no chão

const ridgeLine = (count, seed, height) => [...Array(count)].map((_, x) =>
  Math.round(height * (0.45 + 0.3 * Math.sin(x / 11 + seed) + 0.16 * Math.sin(x / 4.3 + seed * 2) + 0.1 * seeded(x + seed * 97))));

function farSheet(p) {
  const art = 40, sheet = pixelTile(384, art + FAR_SKIRT, 6);
  const back = ridgeLine(384, 3.1, 36), front = ridgeLine(384, 7.7, 25);
  sheet.px(0, art, 384, FAR_SKIRT, p.farDark);                     // a saia: afunda no chão, sem deixar beirada
  for (let x = 0; x < 384; x++) {
    sheet.px(x, art - back[x], 1, back[x], p.farDark);
    if (back[x] > 27) sheet.px(x, art - back[x], 1, 3, p.snow);     // a neve só no topo das mais altas
  }
  for (let x = 0; x < 384; x++) {
    sheet.px(x, art - front[x], 1, front[x] + FAR_SKIRT, p.far);
    if (front[x] > front[x + 1]) sheet.px(x, art - front[x], 1, 2, shade(p.far, 0.18));
  }
  return sheet.texture;
}

// ---------- a linha de mata (campo) ou o casario (cidade), no horizonte ----------
// de longe não se vê tronco: a árvore é só a copa, e é a silhueta que conta
function pine(sheet, p, x, base, h) {
  for (let row = 0; row < h; row++) {
    const half = Math.max(1, Math.round((h - row) * 0.34));
    sheet.px(x - half, base - 1 - row, half * 2 + 2, 1, row % 3 === 0 ? p.leaf : p.mid);
  }
}

function midSheet(p) {
  const art = 30, sheet = pixelTile(480, art + MID_SKIRT, 6);
  if (p.scenery === "cidade") {
    sheet.px(0, art, 480, MID_SKIRT, p.wall2);
    for (let k = 0; k < 80; k++) {
      const x = 2 + k * 6, w = 4 + Math.round(seeded(k + 11) * 3), h = 7 + Math.round(seeded(k + 12) * 19);
      sheet.px(x, art - h, w, h + MID_SKIRT, k % 2 ? p.wall : p.wall2);
      for (let row = art + 2 - h; row < art - 2; row += 3) for (let q = 1; q < w - 1; q += 2) sheet.px(x + q, row, 1, 1, p.window);
    }
    return sheet.texture;
  }
  const hill = ridgeLine(480, 1.3, 11);
  sheet.px(0, art, 480, MID_SKIRT, p.hill);
  for (let x = 0; x < 480; x++) sheet.px(x, art - hill[x], 1, hill[x], p.hill);
  for (let k = 0; k < 150; k++) {
    const x = Math.round(3 + k * 3.2);
    pine(sheet, p, x, art - hill[x], 7 + Math.round(seeded(k + 40) * 9));
  }
  return sheet.texture;
}

// ---------- o chão: ladrilho de grama e a trilha de terra ----------
function groundTexture(p, dark) {
  const sheet = pixelTile(16, 16, 8);
  sheet.px(0, 0, 16, 16, dark ? p.dirt : p.grass);
  for (let k = 0; k < 26; k++) {
    const x = Math.round(seeded(k + 200) * 15), y = Math.round(seeded(k + 201) * 15);
    sheet.px(x, y, 1 + (k % 2), 1, k % 3 ? (dark ? p.dirtDark : p.grassDark) : (dark ? p.dirt : p.grassLight));
  }
  return sheet.texture;
}

function floor(scene, p, center, width) {
  for (const [dark, w, z, y] of [[false, width, 0, 0], [true, 3.2, 0.2, 0.02]]) {
    const texture = groundTexture(p, dark);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(Math.max(1, Math.round(w / 3)), 74);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, 220), new THREE.MeshBasicMaterial({ map: texture, fog: false }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(center, y, z - 40);
    scene.add(mesh);
  }
}

// ---------- as nuvens ----------
function cloudTexture(p) {
  const sheet = pixelTile(28, 11, 8), lumps = [[2, 6, 24, 5], [6, 3, 14, 4], [10, 1, 7, 3]];
  for (const [x, y, w, h] of lumps) sheet.px(x, y, w, h, p.cloud);
  for (const [x, y, w] of lumps) sheet.px(x, y, w, 1, shade(p.cloud, -0.08));
  return sheet.texture;
}

function clouds(scene, p, x0, x1) {
  const texture = cloudTexture(p);
  return [...Array(7)].map((_, k) => {
    const mesh = board(scene, texture, { width: 4.6 + seeded(k + 300) * 3.4, height: 1.9, position: [0, 0, -42] });
    mesh.userData = { x: x0 + seeded(k + 301) * (x1 - x0 + 40), y: 10.5 + seeded(k + 302) * 6, speed: 0.2 + seeded(k + 303) * 0.25 };
    return mesh;
  });
}

// ---------- a moita: moitas, pedras e flores espalhadas dos dois lados da trilha ----------
function bushTexture(p, kind, frame) {
  const sheet = pixelTile(16, 16, 8), sway = frame ? 1 : 0;
  if (kind === 2) {                                                // pedra
    sheet.px(3, 9, 10, 6, p.stone); sheet.px(4, 8, 8, 1, p.stone);
    sheet.px(4, 9, 5, 2, shade(p.stone, 0.22)); sheet.px(3, 14, 10, 1, shade(p.stone, -0.3));
    return sheet.texture;
  }
  if (kind === 1) {                                                // tufo de capim com uma flor
    for (const [x, h] of [[4, 7], [7, 10], [10, 6]]) sheet.px(x + (h > 8 ? sway : 0), 15 - h, 2, h, p.midDark);
    sheet.px(7 + sway, 4, 3, 3, p.flower);
    sheet.px(8 + sway, 5, 1, 1, shade(p.flower, 0.4));
    return sheet.texture;
  }
  sheet.px(2, 8, 12, 7, p.mid);                                    // moita
  sheet.px(4, 6, 8, 3, p.mid);
  sheet.px(4 + sway, 5, 4, 2, p.leaf);
  sheet.px(9, 7, 4, 2, p.leaf);
  sheet.px(2, 14, 12, 1, shade(p.mid, -0.3));
  return sheet.texture;
}

function scatterBushes(scene, p, x0, x1) {
  const frames = [0, 1].map((f) => [0, 1, 2].map((kind) => bushTexture(p, kind, f)));
  const made = [...Array(74)].map((_, k) => {
    const kind = k % 7 === 6 ? 2 : k % 3 === 2 ? 1 : 0, size = kind === 2 ? 0.7 : 0.9 + seeded(k + 410) * 0.7;
    const side = seeded(k + 411) > 0.5 ? 1 : -1, z = -2.6 - seeded(k + 412) * 23;
    const x = (x0 + x1) / 2 + side * (2.1 + seeded(k + 413) * ((x1 - x0) / 2 + 10));   // fora da trilha, dos dois lados
    const mesh = board(scene, frames[0][kind], { width: size, height: size, position: [x, size / 2, z] });
    return { mesh, kind };
  });
  return (frame) => made.forEach((bush) => { bush.mesh.material.map = frames[frame][bush.kind]; });
}

// ---------- o mundo ----------
export function pixelWorld(scene, style, { x0 = -20, x1 = 100 } = {}) {
  const p = palette(style), center = (x0 + x1) / 2, span = x1 - x0;
  // As camadas ficam perto de propósito: o contorno do retrô marca o chão rasante além de uns 40 metros, então a
  // linha de mata tem de tampar o horizonte. Daí a profundidade vir da diferença entre as camadas, não da distância.
  board(scene, skySheet(p), { width: span + 160, height: 120, position: [center, 18, -44], cutout: false });
  layer(scene, farSheet(p), { width: span + 110, art: 10, rows: 40, skirt: FAR_SKIRT, z: -40, center });
  layer(scene, midSheet(p), { width: span + 60, art: 6.5, rows: 30, skirt: MID_SKIRT, z: -34, center });
  floor(scene, p, center, span + 80);
  const wind = scatterBushes(scene, p, x0, x1);
  const sky = clouds(scene, p, x0, x1);
  return function update(t) {
    wind(Math.floor(t / 0.42) % 2);                               // o vento: dois quadros, como num sprite de jogo
    sky.forEach((cloud) => {
      const range = span + 80;
      cloud.position.setX(x0 - 40 + ((cloud.userData.x - x0 + 40 + t * cloud.userData.speed) % range));
      cloud.position.setY(cloud.userData.y);
    });
  };
}

// ---------- os objetos desenhados em pixel ----------
// Cada ícone é um desenho de 16 por 16 escrito à mão, uma letra por pixel: dá para ler o bicho no próprio código.
//   k tinta  w branco  g claro  d escuro  a destaque  b água  r vermelho  y amarelo  t madeira
const ICON_ART = {
  agua: [
    "................", "...kkkkkkkkkk...", "...kwwwwwwwwk...", "...kwwwwwwwwk...",
    "...kbbbbbbbbk...", "...kcbbbbbbbk...", "...kcbbbbbbbk...", "...kbbbbbbbbk...",
    "....kbbbbbbk....", "....kcbbbbbk....", "....kbbbbbbk....", ".....kbbbbk.....",
    ".....kbbbbk.....", ".....kkkkkk.....", "................", "................"],
  sono: [
    "................", "......kkkk......", "....kkyyyykk....", "...kyyyyyyyyk...",
    "..kyyyyykkkkk...", "..kyyyykk.......", ".kyyyyk.........", ".kyyyyk.........",
    ".kyyyyk.........", "..kyyyykk.......", "..kyyyyykkkkk...", "...kyyyyyyyyk...",
    "....kkyyyykk....", "......kkkk......", "................", "................"],
  passos: [
    "................", "................", "................", "....kkkk........",
    "...kwwwwk.......", "...kwkwwk.......", "...kwwkwkkk.....", "..kwkwwkwwwkk...",
    "..kwwkwwwwwwwwk.", "..kwaaaaaaaaawk.", "..kwwwwwwwwwwwk.", "..kwwwwwwwwwwwk.",
    "..kkkkkkkkkkkkk.", "..kdddddddddddk.", "..kkkkkkkkkkkkk.", "................"],
  coracao: [
    "................", "...kkk....kkk...", "..krrrkkkrrrk...", ".krprrrrrrrrrk..",
    ".krprrrrrrrrrk..", ".krrrrrrrrrrrk..", "..krrrrrrrrrk...", "..krrrrrrrrrk...",
    "...krrrrrrrk....", "....krrrrrk.....", ".....krrrk......", "......krk.......",
    ".......k........", "................", "................", "................"],
  estrela: [
    "................", ".......kk.......", "......kaak......", "......kaak......",
    "..kkkkkaakkkkk..", "..kaaaaaaaaaak..", "...kaaaaaaaak...", "....kaaaaaak....",
    "....kaayaaak....", "...kaak..kaak...", "..kaak....kaak..", "..kk........kk..",
    "................", "................", "................", "................"],
  aviso: [
    "................", ".......kk.......", "......kaak......", "......kaak......",
    ".....kaaaak.....", ".....kakkak.....", "....kaakkaak....", "....kaakkaak....",
    "...kaaakkaaak...", "...kaaaaaaaak...", "..kaaaakkaaaak..", "..kaaaakkaaaak..",
    ".kaaaaaaaaaaaak.", ".kkkkkkkkkkkkkk.", "................", "................"],
  gota: [
    "................", "......kk........", "......kk........", ".....kbbk.......",
    ".....kbbk.......", "....kbbbbk......", "....kcbbbk......", "...kcbbbbbk.....",
    "...kcbbbbbk.....", "..kcbbbbbbbk....", "..kbbbbbbbk.....", "...kbbbbbk......",
    "....kkkkk.......", "................", "................", "................"],
};

const PALETTE = (p) => ({ k: p.ink, w: p.white, d: shade(p.ink, 0.25), a: p.flower, y: "#ffe9a8",
  b: p.water, c: shade(p.water, 0.35), r: "#e0415a", p: "#ff8a9c", t: p.trunk, ".": null });

function stamp(px, rows, colors) {
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (colors[ch]) px(x, y, 1, 1, colors[ch]); }));
}

export const ICONS = Object.fromEntries(Object.keys(ICON_ART).map((name) =>
  [name, (px, p) => stamp(px, ICON_ART[name], PALETTE(p))]));

// um objeto em pixel na cena: 16 por 16, no tamanho pedido em metros, chapado de frente para a câmera
export function pixelSprite(scene, style, { kind = "estrela", desenho, position = [0, 1, 0], size = 1, grid = 16 } = {}) {
  const p = palette(style), sheet = pixelTile(grid, grid, 8);
  (desenho || ICONS[kind] || ICONS.estrela)(sheet.px, p);
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({
    map: sheet.texture, transparent: true, alphaTest: 0.5, fog: false, side: THREE.DoubleSide,
  }));
  group.add(mesh);
  group.position.set(...position);
  scene.add(group);
  return { group, mesh, texture: sheet.texture, px: sheet.px };
}
