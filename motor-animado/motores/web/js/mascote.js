// mascote.js: o apresentador de cabeça grande (traço de mascote): cabeça redonda ou de cérebro com vasos, rosto pintado em
// pixel (olhos grandes com brilho, sobrancelhas, bochechas, boca), jaleco aberto com colete, camisa e gravata,
// estetoscópio, crachá, mãos e tênis. O sombreado (liso ou facetado) vem do estilo, como em todas as peças do motor.
//   mascot({head: "cerebro" | "bola", cores..., faceSize}) -> {group, parts, setFace, pose, update}
//   setFace({eyes: "open"|"happy"|"closed"|"wide", mouth: "smile"|"open"|"o"|"sad"|"flat", brows: "calm"|"worried"|"angry"|"up"})
//   pose("standing" | "handsOnHips" | "wave" | "point" | "think" | "cheer" | {armL, armR, elbowL, elbowR})
//   update(t): respira, pisca e acena sozinho (tudo função de t)
import * as THREE from "three";
import { brainGeometry, RADII } from "./anatomia.js";
import { material, piece } from "./formas.js";

export const MASCOT_POSES = {
  standing: { armL: 8, armR: 8, elbowL: 0, elbowR: 0 },
  handsOnHips: { armL: 40, armR: 40, elbowL: -108, elbowR: -108 },
  wave: { armL: 8, armR: 150, elbowL: 0, elbowR: 25, wave: 1 },
  point: { armL: 8, armR: 88, elbowL: 0, elbowR: 0 },
  think: { armL: 8, armR: 30, elbowL: 0, elbowR: 135 },
  cheer: { armL: 150, armR: 150, elbowL: 15, elbowR: 15 },
};
const DEFAULTS = { head: "cerebro", headColor: "#8cc0f2", veins: "#d8202e", coat: "#2f7fd8", vest: "#1d2a44", shirt: "#ffffff",
  tie: "#d8202e", pants: "#1d2a44", shoes: "#f2f2f2", skin: "#f0b48a", stethoscope: true, badge: true, faceSize: 128, height: 1.8 };
const INK = "#16182a", HEAD_Y = 1.36, HEAD_SCALE = 0.42;

// ---------- o rosto, pintado num canvas pequeno e ampliado sem suavizar (pixel) ----------
function eye(c, x, y, s, kind) {
  c.lineWidth = s * 0.16;
  c.strokeStyle = INK;
  if (kind === "happy" || kind === "closed") {
    c.beginPath();
    if (kind === "happy") c.arc(x, y + s * 0.35, s * 0.8, 1.15 * Math.PI, 1.85 * Math.PI);
    else { c.moveTo(x - s * 0.8, y); c.lineTo(x + s * 0.8, y); }
    c.stroke();
    return;
  }
  const big = kind === "wide" ? 1.15 : 1;
  c.fillStyle = "#ffffff";
  c.beginPath(); c.ellipse(x, y, s * 0.95 * big, s * 1.1 * big, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  const iris = c.createLinearGradient(0, y - s, 0, y + s);
  iris.addColorStop(0, "#1f4f9a"); iris.addColorStop(1, "#5aa6e8");
  c.fillStyle = iris;
  c.beginPath(); c.arc(x, y + s * 0.12, s * 0.72, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#0b0d1c";
  c.beginPath(); c.arc(x, y + s * 0.15, s * 0.38, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#ffffff";
  c.beginPath(); c.arc(x - s * 0.28, y - s * 0.22, s * 0.24, 0, Math.PI * 2); c.fill();
}

function brow(c, x, y, s, side, kind) {
  const tilt = { calm: 0, worried: -0.35, angry: 0.4, up: 0 }[kind] ?? 0, lift = kind === "up" ? -s * 0.35 : 0;
  c.strokeStyle = "#5a2a1e";
  c.lineWidth = s * 0.32;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(x - s * 0.8, y + lift + side * tilt * s * 0.6);
  c.quadraticCurveTo(x, y + lift - s * 0.25, x + s * 0.8, y + lift - side * tilt * s * 0.6);
  c.stroke();
}

function mouth(c, x, y, s, kind) {
  c.strokeStyle = INK;
  c.lineWidth = s * 0.2;
  c.beginPath();
  if (kind === "open") { c.fillStyle = "#7a1f2a"; c.arc(x, y - s * 0.1, s * 0.55, 0.05 * Math.PI, 0.95 * Math.PI); c.closePath(); c.fill(); c.stroke(); return; }
  if (kind === "o") { c.fillStyle = "#7a1f2a"; c.ellipse(x, y + s * 0.1, s * 0.22, s * 0.28, 0, 0, Math.PI * 2); c.fill(); c.stroke(); return; }
  if (kind === "sad") c.arc(x, y + s * 0.7, s * 0.6, 1.2 * Math.PI, 1.8 * Math.PI);
  else if (kind === "flat") { c.moveTo(x - s * 0.45, y + s * 0.1); c.lineTo(x + s * 0.45, y + s * 0.1); }
  else c.arc(x, y - s * 0.5, s * 0.9, 0.25 * Math.PI, 0.75 * Math.PI);
  c.stroke();
}

function paintFace(canvas, face) {
  const c = canvas.getContext("2d"), n = canvas.width, s = n / 7.2;
  c.clearRect(0, 0, n, n);
  c.fillStyle = "rgba(255,120,130,0.75)";                                     // bochechas
  for (const x of [n * 0.17, n * 0.83]) { c.beginPath(); c.ellipse(x, n * 0.72, s * 0.75, s * 0.5, 0, 0, Math.PI * 2); c.fill(); }
  for (const [x, side] of [[n * 0.3, -1], [n * 0.7, 1]]) {
    brow(c, x, n * 0.27, s, side, face.brows || "calm");
    eye(c, x, n * 0.52, s, face.eyes || "open");
  }
  mouth(c, n * 0.5, n * 0.8, s, face.mouth || "smile");
}

// a "máscara" do rosto: um pedaço da frente de uma esfera, um pouco maior que a cabeça
function faceMask(size, radii) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.SphereGeometry(1, 32, 24, Math.PI / 2 - 0.85, 1.7, Math.PI / 2 - 0.62, 1.24);
  geometry.scale(...radii);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.4, depthWrite: false }));
  mesh.userData.keepGeometry = true;
  mesh.renderOrder = 2;
  return { mesh, canvas, texture };
}

// ---------- a cabeça ----------
// a pele do cérebro numa textura em pixel (cor + vasos com galhos), presa por coordenadas esféricas: os vasos ficam
// nítidos com poucas ou muitas facetas. As dobras escurecem por vértice (cor por vértice multiplica a textura).
function branch(c, x, y, angle, length, width, k, depth) {
  let px = x, py = y;
  for (let step = 0; step < length; step++) {
    angle += (Math.sin(k * 12.9 + step * 1.7) * 0.5);
    const nx = px + Math.cos(angle) * 4, ny = py + Math.sin(angle) * 4;
    c.lineWidth = width;
    c.beginPath(); c.moveTo(px, py); c.lineTo(nx, ny); c.stroke();
    px = nx; py = ny;
    if (depth > 0 && step % 4 === 3) branch(c, px, py, angle + (step % 8 === 3 ? 0.9 : -0.9), length * 0.55, Math.max(1, width - 1), k + step, depth - 1);
  }
}

function skinTexture(o) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const c = canvas.getContext("2d");
  c.fillStyle = o.headColor;
  c.fillRect(0, 0, 256, 128);
  if (o.veins) {
    c.strokeStyle = o.veins;
    c.lineCap = "round";
    for (let k = 0; k < 16; k++) {
      const u = (k / 16) * 256 + 6, v = 8 + ((k * 37) % 30);
      if (u > 96 && u < 160 && v > 40) continue;                                  // o rosto fica limpo
      branch(c, u, v, Math.PI / 2 + Math.sin(k * 3.1) * 0.8, 9 + (k % 4), 3, k, 2);
    }
    c.clearRect(100, 46, 56, 82);
    c.fillStyle = o.headColor;
    c.fillRect(100, 46, 56, 82);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function sphericalUv(geometry) {   // u em volta (a frente no meio), v de baixo para cima
  const positions = geometry.attributes.position, uv = new Float32Array(positions.count * 2), v = new THREE.Vector3();
  for (let i = 0; i < positions.count; i++) {
    v.fromBufferAttribute(positions, i).normalize();
    uv[i * 2] = 0.5 + Math.atan2(v.x, v.z) / (2 * Math.PI);
    uv[i * 2 + 1] = 0.5 + Math.asin(Math.max(-1, Math.min(1, v.y))) / Math.PI;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

function foldShade(geometry) {   // os sulcos um pouco mais escuros
  const positions = geometry.attributes.position, colors = geometry.attributes.color, v = new THREE.Vector3(), radii = new THREE.Vector3(...RADII);
  for (let i = 0; i < positions.count; i++) {
    v.fromBufferAttribute(positions, i).divide(radii);
    const fold = Math.sin(5 * v.x + 2 * Math.sin(4 * v.y)) * Math.sin(4.5 * v.y + 2 * Math.sin(3.5 * v.z));
    const shade = Math.abs(fold) < 0.07 ? 0.8 : 1;
    colors.setXYZ(i, shade, shade, shade);
  }
}

function buildHead(o) {
  const head = new THREE.Group();
  if (o.head === "cerebro") {
    const { geometry } = brainGeometry({ amplitude: 0.035, frequency: 0.55, detail: o.headDetail || 28 });
    sphericalUv(geometry);
    foldShade(geometry);
    const skin = skinTexture(o);
    head.add(piece(geometry, new THREE.MeshStandardMaterial({ map: skin, vertexColors: true, roughness: 0.75, flatShading: material(0).flatShading,
      emissive: 0xffffff, emissiveMap: skin, emissiveIntensity: 0.18 })));              // um pouco de luz própria: o azul não acinzenta
    head.scale.set(HEAD_SCALE, HEAD_SCALE * 1.22, HEAD_SCALE);                         // mais redonda que um cérebro de verdade
  } else {
    head.add(piece(new THREE.IcosahedronGeometry(1, o.headDetail || 3), material(o.headColor, { roughness: 0.7 })));
    head.scale.set(0.5, 0.48, 0.46);
  }
  const radii = o.head === "cerebro" ? RADII.map((r) => r * 1.06) : [1.04, 1.04, 1.04];
  const mask = faceMask(o.faceSize, radii);
  head.add(mask.mesh);
  head.position.y = HEAD_Y;
  return { head, mask };
}

// ---------- o corpo ----------
const block = (w, h, d, hex, at) => piece(new THREE.BoxGeometry(w, h, d), material(hex, { roughness: 0.8 }), at);

function buildTorso(o) {
  const torso = new THREE.Group();
  torso.add(block(0.56, 0.58, 0.34, o.coat, [0, 0.66, 0]));                       // o jaleco
  torso.add(block(0.2, 0.5, 0.02, o.vest, [0, 0.68, 0.172]));                     // o colete aparecendo na frente
  torso.add(block(0.14, 0.1, 0.02, o.shirt, [0, 0.9, 0.176]), block(0.05, 0.28, 0.02, o.tie, [0, 0.77, 0.18]));
  for (const s of [-1, 1]) {
    const lapel = block(0.07, 0.34, 0.03, o.coat, [s * 0.12, 0.8, 0.18]);
    lapel.rotation.z = s * 0.35;
    torso.add(lapel, block(0.13, 0.11, 0.02, new THREE.Color(o.coat).multiplyScalar(0.85).getHex(), [s * 0.17, 0.5, 0.176]));
  }
  for (const s of [-1, 1]) torso.add(block(0.13, 0.33, 0.15, o.pants, [s * 0.1, 0.25, 0]), block(0.16, 0.1, 0.27, o.shoes, [s * 0.1, 0.05, 0.04]));
  if (o.stethoscope) torso.add(stethoscope());
  if (o.badge) torso.add(piece(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 12), material("#ffffff"), [0.16, 0.76, 0.18]).rotateX(Math.PI / 2));
  return torso;
}

function stethoscope() {
  const group = new THREE.Group(), steel = material("#9aa3ad", { metalness: 0.4, roughness: 0.4 });
  const tube = piece(new THREE.TorusGeometry(0.17, 0.016, 6, 24, Math.PI * 1.15), material("#3a3f4a"), [0, 0.86, 0.19]);
  tube.rotation.z = Math.PI * 1.07;
  group.add(tube, piece(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 14), steel, [0.15, 0.68, 0.2]).rotateX(Math.PI / 2));
  return group;
}

function buildArm(o, side) {
  const shoulder = new THREE.Group(), elbow = new THREE.Group();
  shoulder.position.set(side * 0.31, 0.9, 0);
  shoulder.add(block(0.13, 0.3, 0.15, o.coat, [0, -0.14, 0]));
  elbow.position.y = -0.28;
  elbow.add(block(0.12, 0.22, 0.14, o.coat, [0, -0.1, 0]), block(0.125, 0.04, 0.145, "#ffffff", [0, -0.22, 0]), block(0.1, 0.1, 0.09, o.skin, [0, -0.29, 0]));
  shoulder.add(elbow);
  return { shoulder, elbow };
}

export function mascot(options = {}) {
  const o = { ...DEFAULTS, ...options };
  const group = new THREE.Group(), body = new THREE.Group();
  const { head, mask } = buildHead(o);
  const arms = { L: buildArm(o, 1), R: buildArm(o, -1) };
  body.add(buildTorso(o), arms.L.shoulder, arms.R.shoulder, head);
  group.add(body);
  group.scale.setScalar(o.height / 1.8);
  let face = { eyes: "open", mouth: "smile", brows: "calm" }, painted = "", angles = { ...MASCOT_POSES.handsOnHips };
  const repaint = (current) => {
    const key = JSON.stringify(current);
    if (key !== painted) { paintFace(mask.canvas, current); mask.texture.needsUpdate = true; painted = key; }
  };
  const setFace = (next) => { face = { ...face, ...next }; };
  const pose = (value) => { angles = { ...MASCOT_POSES.standing, ...(typeof value === "string" ? MASCOT_POSES[value] : value) }; };
  function update(t) {
    const blink = (t % 3.7) < 0.12 && face.eyes === "open";
    repaint(blink ? { ...face, eyes: "closed" } : face);
    body.scale.y = 1 + 0.012 * Math.sin(t * 2.2);
    head.rotation.z = 0.04 * Math.sin(t * 1.3);
    for (const [key, side] of [["L", 1], ["R", -1]]) {
      const wave = key === "R" && angles.wave ? 22 * Math.sin(t * 9) : 0;
      arms[key].shoulder.rotation.z = THREE.MathUtils.degToRad(side * angles["arm" + key]);
      arms[key].elbow.rotation.z = THREE.MathUtils.degToRad(side * (angles["elbow" + key] + wave));
    }
  }
  repaint(face);
  return { group, parts: { head, body, arms }, setFace, pose, update };
}

// o apresentador do estilo: o mascote com os números do estilo.json ("mascot") e o que a cena pedir por cima
export function presenter(scene, style, options = {}) {
  const host = mascot({ ...(style.mascot || {}), ...options });
  scene.add(host.group);
  return host;
}
