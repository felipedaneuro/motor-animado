// personagens.js: o boneco 3D articulado (low-poly, com poses).
// O boneco fica de frente para +z (a câmera). Os ângulos das poses estão em graus.
// Para enfeitar (boné, jaleco, óculos), adicione peças em parts.head e parts.torso.
import * as THREE from "three";
import { lerp, radians } from "./nucleo.js";
import { material, piece } from "./formas.js";

export const POSES = {
  standing: {},
  holding: { shoulderR: 65, elbowR: 45 },
  offering: { shoulderR: 80, elbowR: 20 },
  drinking: { shoulderR: 45, elbowR: 135, spreadR: 12 },
  lookingAtHand: { shoulderR: 95, elbowR: 75, spreadR: 10, head: -12 },
  armsUp: { shoulderL: 150, shoulderR: 150, spreadL: 20, spreadR: 20 },
  celebrating: { shoulderL: 165, shoulderR: 165, spreadL: 10, spreadR: 10, head: -8 },
  limp: { torso: 8, shoulderL: 10, shoulderR: 10, spreadL: 25, spreadR: 25, head: 22 },
  helping: { torso: 35, shoulderL: 80, shoulderR: 80, elbowL: 30, elbowR: 30, head: 12 },
  pointing: { shoulderR: 90, elbowR: 5, head: -5 },
  handOnHead: { shoulderR: 150, elbowR: 120, spreadR: 15, head: 10 },
  sideLying: { shoulderL: 25, elbowL: 90 },   // deitado de lado (com o boneco girado 90°)
};
const JOINTS = ["torso", "head", "shoulderL", "elbowL", "spreadL", "shoulderR", "elbowR", "spreadR", "hipL", "kneeL", "hipR", "kneeR"];

export function angles(name) {
  const pose = POSES[name], out = {};
  for (const joint of JOINTS) out[joint] = pose[joint] ?? 0;
  return out;
}
// mistura duas poses: blendPose("standing", "drinking", u)
export function blendPose(a, b, u) {
  const A = angles(a), B = angles(b), out = {};
  for (const joint of JOINTS) out[joint] = lerp(A[joint], B[joint], u);
  return out;
}

function buildArm(parts, torso, side, sign, colors) {
  const shoulder = new THREE.Group();
  shoulder.position.set(0, 0.48, sign * 0.24);
  torso.add(shoulder);
  const elbow = new THREE.Group();
  elbow.position.y = -0.28;
  const hand = piece(new THREE.IcosahedronGeometry(0.06, 0), material(colors.skin), [0, -0.27, 0]);
  elbow.add(piece(new THREE.BoxGeometry(0.09, 0.25, 0.09), material(colors.skin), [0, -0.125, 0]), hand);
  shoulder.add(piece(new THREE.BoxGeometry(0.11, 0.28, 0.11), material(colors.sleeve), [0, -0.14, 0]), elbow);
  Object.assign(parts, { ["shoulder" + side]: shoulder, ["elbow" + side]: elbow, ["hand" + side]: hand });
}

function buildLeg(parts, root, side, sign, colors) {
  const hip = new THREE.Group();
  hip.position.set(0, 0, sign * 0.1);
  root.add(hip);
  const knee = new THREE.Group();
  knee.position.y = -0.42;
  knee.add(piece(new THREE.BoxGeometry(0.12, 0.42, 0.12), material(colors.pants), [0, -0.21, 0]),
    piece(new THREE.BoxGeometry(0.22, 0.07, 0.13), material(colors.shoes), [0.05, -0.44, 0]));
  hip.add(piece(new THREE.BoxGeometry(0.14, 0.42, 0.14), material(colors.pants), [0, -0.21, 0]), knee);
  Object.assign(parts, { ["hip" + side]: hip, ["knee" + side]: knee });
}

function buildHead(parts, torso, colors) {
  parts.head = new THREE.Group();
  parts.head.position.y = 0.56;
  torso.add(parts.head);
  parts.head.add(piece(new THREE.IcosahedronGeometry(0.19, 1), material(colors.skin), [0, 0.19, 0]));
  parts.eyes = [-1, 1].map((s) => {
    const eye = piece(new THREE.SphereGeometry(0.028, 8, 6), material(0x15161a), [0.17, 0.2, s * 0.07]);
    parts.head.add(eye);
    return eye;
  });
}

export function puppet({ shirt, skin, pants = 0x2d3436, sleeve = shirt, shoes = 0x22252b }) {
  const colors = { shirt, skin, pants, sleeve, shoes };
  const outer = new THREE.Group(), root = new THREE.Group(), parts = {};
  root.position.y = 0.9;   // os pés no chão quando outer.y = 0
  outer.add(root);
  parts.torso = new THREE.Group();
  root.add(parts.torso);
  parts.torso.add(piece(new THREE.BoxGeometry(0.28, 0.52, 0.38), material(shirt), [0, 0.28, 0]));
  buildHead(parts, parts.torso, colors);
  buildArm(parts, parts.torso, "L", -1, colors);
  buildArm(parts, parts.torso, "R", 1, colors);
  buildLeg(parts, root, "L", -1, colors);
  buildLeg(parts, root, "R", 1, colors);
  root.rotation.y = radians(-90);
  const pose = (value) => applyPose(parts, typeof value === "string" ? angles(value) : value);
  pose("standing");
  return { outer, root, parts, pose };
}

// ---------- o personagem plano (estilo palito): desenhado em 2D num canvas, num mundo 3D ----------
// Cabeça redonda grande, olhos e boca simples, corpo e membros de palito, roupa de cor forte, contorno escuro grosso.
// É um plano que sempre olha para a câmera. A pose é redesenhada a partir de t (o mesmo t, o mesmo desenho).
// pose: {armL, armR, legL, legR (graus a partir de "para baixo"; positivo = para fora do corpo), lean (graus), mouth: "smile"|"open"|"o"|"flat", eyes: "open"|"closed"|"wide"}
export const FLAT_POSES = {
  standing: { armL: 16, armR: 16, legL: 7, legR: 7 },
  waving: { armL: 16, armR: 150, legL: 7, legR: 7, mouth: "open" },
  pointing: { armL: 16, armR: 95, legL: 7, legR: 7 },
  surprised: { armL: 140, armR: 140, legL: 12, legR: 12, mouth: "o", eyes: "wide" },
  walkingA: { armL: -20, armR: 30, legL: 22, legR: -14 },
  walkingB: { armL: 30, armR: -20, legL: -14, legR: 22 },
  tired: { armL: 6, armR: 6, legL: 5, legR: 5, lean: 10, mouth: "flat", eyes: "closed" },
};
const CANVAS_W = 512, CANVAS_H = 1024, INK = "#16171b";

function limb(context, x, y, length, degrees, width) {
  const a = radians(degrees);
  const endX = x + Math.sin(a) * length, endY = y + Math.cos(a) * length;
  context.lineCap = "round";
  for (const [color, w] of [[INK, width + 14], [null, width]]) {
    context.strokeStyle = color || context.fillStyle;
    context.lineWidth = w;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(endX, endY);
    context.stroke();
  }
}

function drawFace(context, look, pose) {
  const cx = 256, cy = 230, r = 150;
  context.fillStyle = look.skin;
  context.lineWidth = 14;
  context.strokeStyle = INK;
  context.beginPath(); context.arc(cx, cy, r, 0, Math.PI * 2); context.fill(); context.stroke();
  if (look.hair) { context.fillStyle = look.hair; context.beginPath(); context.arc(cx, cy - 20, r, Math.PI * 1.05, Math.PI * 1.95); context.fill(); context.stroke(); }
  context.fillStyle = INK;
  const eye = pose.eyes === "wide" ? 22 : 16;
  for (const side of [-1, 1]) {
    context.beginPath();
    if (pose.eyes === "closed") { context.lineWidth = 10; context.moveTo(cx + side * 55 - 18, cy - 5); context.lineTo(cx + side * 55 + 18, cy - 5); context.stroke(); }
    else { context.arc(cx + side * 55, cy - 10, eye, 0, Math.PI * 2); context.fill(); }
  }
  context.lineWidth = 12;
  context.beginPath();
  if (pose.mouth === "o") context.arc(cx, cy + 65, 24, 0, Math.PI * 2);
  else if (pose.mouth === "open") { context.arc(cx, cy + 50, 45, 0.1 * Math.PI, 0.9 * Math.PI); context.closePath(); context.fill(); }
  else if (pose.mouth === "flat") { context.moveTo(cx - 40, cy + 65); context.lineTo(cx + 40, cy + 65); }
  else context.arc(cx, cy + 35, 55, 0.2 * Math.PI, 0.8 * Math.PI);
  context.stroke();
}

function drawBody(context, look, pose) {
  const shoulderY = 400, hipY = 680;
  context.fillStyle = look.pants;
  limb(context, 228, hipY, 300, -(pose.legL ?? 7), 26);
  limb(context, 284, hipY, 300, pose.legR ?? 7, 26);
  context.fillStyle = look.shirt;
  context.strokeStyle = INK;
  context.lineWidth = 14;
  context.beginPath();
  context.moveTo(196, shoulderY); context.lineTo(316, shoulderY); context.lineTo(330, hipY); context.lineTo(182, hipY);
  context.closePath(); context.fill(); context.stroke();
  context.fillStyle = look.skin;   // os braços por cima da roupa, saindo dos ombros
  limb(context, 200, shoulderY + 18, 290, -(pose.armL ?? 16), 22);
  limb(context, 312, shoulderY + 18, 290, pose.armR ?? 16, 22);
}

export function flatCharacter({ skin = "#f1c9a5", shirt = "#ff7a1a", pants = "#2b3a55", hair = null, height = 1.8 } = {}) {
  const look = { skin, shirt, pants, hair };
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(height * 0.5, height),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
  mesh.geometry.translate(0, height / 2, 0);   // os pés no chão em y = 0
  const group = new THREE.Group();
  group.add(mesh);
  let drawn = "";
  function setPose(pose) {
    const key = JSON.stringify(pose);
    if (key === drawn) return;
    context.clearRect(0, 0, CANVAS_W, CANVAS_H);
    context.save();
    context.translate(256, 1000); context.rotate(radians(pose.lean || 0)); context.translate(-256, -1000);
    drawBody(context, look, pose);
    drawFace(context, look, pose);
    context.restore();
    texture.needsUpdate = true;
    drawn = key;
  }
  // gira só em volta do eixo vertical, para continuar em pé olhando a câmera
  const faceCamera = (camera) => { group.rotation.y = Math.atan2(camera.position.x - group.position.x, camera.position.z - group.position.z); };
  setPose(FLAT_POSES.standing);
  return { group, setPose, faceCamera };
}

function applyPose(parts, a) {
  parts.torso.rotation.z = radians(a.torso);
  parts.head.rotation.z = radians(a.head);
  for (const [side, sign] of [["L", -1], ["R", 1]]) {
    parts["shoulder" + side].rotation.set(radians(-sign * a["spread" + side]), 0, radians(a["shoulder" + side]));
    parts["elbow" + side].rotation.z = radians(a["elbow" + side]);
    parts["hip" + side].rotation.z = radians(a["hip" + side]);
    parts["knee" + side].rotation.z = radians(a["knee" + side]);
  }
}
