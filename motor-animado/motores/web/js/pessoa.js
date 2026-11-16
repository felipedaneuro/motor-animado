// pessoa.js: o apresentador humano em pixel, de proporção normal (a cabeça é um sétimo da altura, não a cabeça grande
// do mascote). Cabelo com volume em blocos, jaleco aberto por cima da camisa, calça e tênis; o rosto é pintado num
// canvas e ampliado sem suavizar, então o pixel aparece sem ninguém virar um boneco de 8 bits.
//   person({skin, hair, hairStyle, coat, shirt, pants, shoes, height, faceSize}) -> {group, parts, setFace, pose, update}
//   setFace({eyes: "open"|"happy"|"closed"|"wide", mouth: "smile"|"open"|"o"|"sad"|"flat", brows: "calm"|"worried"|"angry"|"up"})
//   pose("standing" | "handsOnHips" | "wave" | "point" | "think" | "cheer" | {armL, armR, elbowL, elbowR})
//   update(t): respira, pisca e acena sozinho (tudo função de t)
import * as THREE from "three";
import { material, piece } from "./formas.js";

export const PERSON_POSES = {
  standing: { armL: 6, armR: 6, elbowL: 8, elbowR: 8 },
  handsOnHips: { armL: 34, armR: 34, elbowL: -95, elbowR: -95 },
  wave: { armL: 6, armR: 142, elbowL: 8, elbowR: 30, wave: 1 },
  point: { armL: 6, armR: 80, elbowL: 8, elbowR: 0 },
  think: { armL: 6, armR: 26, elbowL: 8, elbowR: 128 },
  cheer: { armL: 148, armR: 148, elbowL: 16, elbowR: 16 },
};

const DEFAULTS = { skin: "#e8b48c", hair: "#5a3220", hairStyle: "volumoso", coat: "#f4f6fa", shirt: "#1f7f82",
  pants: "#2d3f62", shoes: "#2a2f3c", badge: "#ffd21f", stethoscope: true, faceSize: 128, height: 1.8 };
const INK = "#16182a";
// as alturas de um corpo de 1,8 m, medidas do chão: o resto do arquivo se apoia nelas
const HIP = 0.92, CHEST = 1.46, NECK = 1.52, HEAD_Y = 1.655, HEAD_R = 0.128, SHOULDER = 1.39;

// ---------- o rosto, pintado pequeno e ampliado sem suavizar ----------
function eye(c, x, y, s, kind) {
  c.lineWidth = s * 0.14;
  c.strokeStyle = INK;
  if (kind === "happy" || kind === "closed") {
    c.beginPath();
    if (kind === "happy") c.arc(x, y + s * 0.3, s * 0.62, 1.15 * Math.PI, 1.85 * Math.PI);
    else { c.moveTo(x - s * 0.62, y); c.lineTo(x + s * 0.62, y); }
    c.stroke();
    return;
  }
  const big = kind === "wide" ? 1.12 : 1;
  c.fillStyle = "#ffffff";
  c.beginPath(); c.ellipse(x, y, s * 0.66 * big, s * 0.74 * big, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = "#3c2a20";
  c.beginPath(); c.arc(x, y + s * 0.06, s * 0.42, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#ffffff";
  c.beginPath(); c.arc(x - s * 0.16, y - s * 0.18, s * 0.14, 0, Math.PI * 2); c.fill();
}

function brow(c, x, y, s, side, kind) {
  const tilt = { calm: 0, worried: -0.3, angry: 0.35, up: 0 }[kind] ?? 0, lift = kind === "up" ? -s * 0.3 : 0;
  c.strokeStyle = "#3a2216";
  c.lineWidth = s * 0.2;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(x - s * 0.6, y + lift + side * tilt * s * 0.5);
  c.quadraticCurveTo(x, y + lift - s * 0.18, x + s * 0.6, y + lift - side * tilt * s * 0.5);
  c.stroke();
}

function mouth(c, x, y, s, kind) {
  c.strokeStyle = INK;
  c.lineWidth = s * 0.22;
  c.lineCap = "round";
  c.beginPath();
  if (kind === "open") { c.fillStyle = "#7a1f2a"; c.ellipse(x, y, s * 0.34, s * 0.26, 0, 0, Math.PI * 2); c.fill(); c.stroke(); return; }
  if (kind === "o") { c.fillStyle = "#7a1f2a"; c.ellipse(x, y, s * 0.16, s * 0.22, 0, 0, Math.PI * 2); c.fill(); c.stroke(); return; }
  if (kind === "sad") c.arc(x, y + s * 0.55, s * 0.5, 1.2 * Math.PI, 1.8 * Math.PI);
  else if (kind === "flat") { c.moveTo(x - s * 0.34, y); c.lineTo(x + s * 0.34, y); }
  else c.arc(x, y - s * 0.38, s * 0.68, 0.3 * Math.PI, 0.7 * Math.PI);
  c.stroke();
}

// o rosto de gente ocupa menos da cabeça que o do mascote: olhos no meio, boca no terço de baixo
function paintFace(canvas, face) {
  const c = canvas.getContext("2d"), n = canvas.width, s = n / 9;
  c.clearRect(0, 0, n, n);
  c.fillStyle = "rgba(216,122,110,0.3)";                                            // bochechas
  for (const x of [n * 0.24, n * 0.76]) { c.beginPath(); c.ellipse(x, n * 0.66, s * 0.72, s * 0.46, 0, 0, Math.PI * 2); c.fill(); }
  for (const [x, side] of [[n * 0.33, -1], [n * 0.67, 1]]) {
    brow(c, x, n * 0.33, s, side, face.brows || "calm");
    eye(c, x, n * 0.5, s, face.eyes || "open");
  }
  c.strokeStyle = "rgba(150,90,70,0.8)";                                            // o nariz, dois pixels de sombra
  c.lineWidth = s * 0.12;
  c.beginPath(); c.moveTo(n * 0.5, n * 0.58); c.lineTo(n * 0.5, n * 0.66); c.stroke();
  mouth(c, n * 0.5, n * 0.76, s, face.mouth || "smile");
}

function faceMask(size) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.SphereGeometry(HEAD_R * 1.04, 24, 20, Math.PI / 2 - 0.8, 1.6, Math.PI / 2 - 0.66, 1.32);
  geometry.scale(1, 1.18, 1);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.4, depthWrite: false }));
  mesh.userData.keepGeometry = true;
  mesh.renderOrder = 2;
  return { mesh, canvas, texture };
}

// ---------- cabeça, cabelo e pescoço ----------
// o cabelo é uma calota por cima do crânio mais tufos em volta: com poucos tufos fica liso, com muitos fica volumoso
// o cabelo é uma calota no alto do crânio mais tufos atrás e dos lados: a frente fica livre para o rosto
function buildHair(o) {
  const group = new THREE.Group(), mat = material(o.hair, { roughness: 0.85 });
  const tufts = { liso: 0, curto: 6, volumoso: 11 }[o.hairStyle] ?? 11;
  const cap = piece(new THREE.SphereGeometry(HEAD_R * 1.06, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.44), mat, [0, HEAD_R * 0.1, -HEAD_R * 0.05]);
  cap.scale.set(1.02, 1.5, 1.06);
  group.add(cap);
  for (let k = 0; k < tufts; k++) {
    const k01 = k / Math.max(1, tufts - 1), angle = Math.PI * (0.53 + 0.94 * k01);   // de 95° a 265°: a nuca e as laterais
    const fade = 0.55 + 0.45 * Math.sin(k01 * Math.PI);                              // as pontas, perto do rosto, são menores
    const radius = HEAD_R * (0.82 + 0.1 * Math.sin(k * 2.3));
    group.add(piece(new THREE.IcosahedronGeometry(HEAD_R * fade * (0.34 + 0.08 * Math.sin(k * 1.7)), 1), mat,
      [Math.sin(angle) * radius, HEAD_R * (0.74 + 0.34 * Math.sin(k * 0.9)), Math.cos(angle) * radius - HEAD_R * 0.22]));
  }
  const bangs = piece(new THREE.BoxGeometry(HEAD_R * 1.5, HEAD_R * 0.26, HEAD_R * 0.26), mat, [0, HEAD_R * 1.02, HEAD_R * 0.7]);
  bangs.rotation.x = -0.3;
  group.add(bangs);
  return group;
}

function buildHead(o) {
  const head = new THREE.Group();
  const skull = piece(new THREE.IcosahedronGeometry(HEAD_R, o.headDetail || 3), material(o.skin, { roughness: 0.72 }));
  skull.scale.set(0.94, 1.2, 0.96);
  head.add(skull);
  for (const s of [-1, 1]) head.add(piece(new THREE.IcosahedronGeometry(HEAD_R * 0.2, 1), material(o.skin, { roughness: 0.72 }), [s * HEAD_R * 0.9, -HEAD_R * 0.05, 0]));
  head.add(buildHair(o));
  const mask = faceMask(o.faceSize);
  head.add(mask.mesh);
  head.position.y = HEAD_Y;
  return { head, mask };
}

// ---------- o corpo ----------
const block = (w, h, d, hex, at) => piece(new THREE.BoxGeometry(w, h, d), material(hex, { roughness: 0.8 }), at);

function buildTorso(o) {
  const torso = new THREE.Group(), chest = (CHEST - HIP) / 2 + HIP;
  torso.add(block(0.2, NECK - CHEST + 0.06, 0.18, o.skin, [0, CHEST + 0.01, 0]));                 // o pescoço
  torso.add(block(0.4, CHEST - HIP, 0.23, o.shirt, [0, chest, 0]));                               // a camisa
  for (const s of [-1, 1]) {                                                                      // as duas bandas do jaleco, abertas
    torso.add(block(0.17, CHEST - HIP + 0.1, 0.25, o.coat, [s * 0.15, chest - 0.03, 0.004]));
    const lapel = block(0.06, 0.2, 0.26, o.coat, [s * 0.09, CHEST - 0.12, 0.004]);
    lapel.rotation.z = s * 0.3;
    torso.add(lapel);
  }
  torso.add(block(0.42, 0.1, 0.24, o.pants, [0, HIP - 0.02, 0]));                                 // o cós
  for (const s of [-1, 1]) {
    torso.add(block(0.17, HIP - 0.1, 0.19, o.pants, [s * 0.11, (HIP - 0.07) / 2 + 0.03, 0]));     // as pernas
    torso.add(block(0.19, 0.08, 0.3, o.shoes, [s * 0.11, 0.04, 0.05]));                           // os tênis
  }
  if (o.badge) torso.add(block(0.07, 0.05, 0.02, o.badge, [0.19, CHEST - 0.22, 0.13]));
  if (o.stethoscope) torso.add(stethoscope(o));
  return torso;
}

function stethoscope(o) {
  const group = new THREE.Group(), tube = piece(new THREE.TorusGeometry(0.13, 0.013, 6, 22, Math.PI * 1.2), material("#2f3540"), [0, CHEST - 0.07, 0.1]);
  tube.rotation.z = Math.PI * 1.05;
  group.add(tube, piece(new THREE.CylinderGeometry(0.035, 0.035, 0.022, 12), material("#9aa3ad", { metalness: 0.4, roughness: 0.4 }),
    [0.1, CHEST - 0.3, 0.12]).rotateX(Math.PI / 2));
  if (o.coat) group.add(piece(new THREE.BoxGeometry(0.001, 0.001, 0.001), material(o.coat)));      // mantém o grupo com a cor do jaleco em cena
  return group;
}

function buildArm(o, side) {
  const shoulder = new THREE.Group(), elbow = new THREE.Group();
  shoulder.position.set(side * 0.24, SHOULDER, 0);
  shoulder.add(block(0.11, 0.3, 0.13, o.coat, [0, -0.15, 0]));                                     // o braço, com manga do jaleco
  elbow.position.y = -0.3;
  elbow.add(block(0.1, 0.26, 0.12, o.coat, [0, -0.13, 0]), block(0.095, 0.1, 0.1, o.skin, [0, -0.3, 0]));
  shoulder.add(elbow);
  return { shoulder, elbow };
}

export function person(options = {}) {
  const o = { ...DEFAULTS, ...options };
  const group = new THREE.Group(), body = new THREE.Group();
  const { head, mask } = buildHead(o);
  const arms = { L: buildArm(o, 1), R: buildArm(o, -1) };
  body.add(buildTorso(o), arms.L.shoulder, arms.R.shoulder, head);
  group.add(body);
  group.scale.setScalar(o.height / 1.8);
  let face = { eyes: "open", mouth: "smile", brows: "calm" }, painted = "", angles = { ...PERSON_POSES.standing };
  const repaint = (current) => {
    const key = JSON.stringify(current);
    if (key !== painted) { paintFace(mask.canvas, current); mask.texture.needsUpdate = true; painted = key; }
  };
  const setFace = (next) => { face = { ...face, ...next }; };
  const pose = (value) => { angles = { ...PERSON_POSES.standing, ...(typeof value === "string" ? PERSON_POSES[value] : value) }; };
  function update(t) {
    const blink = (t % 4.1) < 0.11 && face.eyes === "open";
    repaint(blink ? { ...face, eyes: "closed" } : face);
    body.scale.y = 1 + 0.008 * Math.sin(t * 2.1);
    head.rotation.z = 0.025 * Math.sin(t * 1.2);
    head.rotation.y = 0.05 * Math.sin(t * 0.7);
    for (const [key, side] of [["L", 1], ["R", -1]]) {
      const wave = key === "R" && angles.wave ? 20 * Math.sin(t * 9) : 0;
      arms[key].shoulder.rotation.z = THREE.MathUtils.degToRad(side * angles["arm" + key]);
      arms[key].elbow.rotation.z = THREE.MathUtils.degToRad(side * (angles["elbow" + key] + wave));
    }
  }
  repaint(face);
  return { group, parts: { head, body, arms }, setFace, pose, update };
}

// o apresentador do estilo: a pessoa com os números do estilo.json ("person") e o que a cena pedir por cima
export function presenter(scene, style, options = {}) {
  const host = person({ ...(style.person || {}), ...options });
  scene.add(host.group);
  return host;
}
