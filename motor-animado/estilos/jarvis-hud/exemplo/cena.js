// cena.js de "AVC: exame holográfico" (estilo jarvis-hud): O QUE aparece em cada estação. O QUANDO, a câmera e o visor estão no plano.js.
import * as THREE from "three";
import { between, pop, seeded, path } from "./motor/nucleo.js";
import { createStage } from "./motor/palco.js";
import { createDrone } from "./motor/camera.js";
import { createOverlay } from "./motor/textos.js";
import { puppet, blendPose } from "./motor/personagens.js";
import { box, ball, tube, piece, material } from "./motor/formas.js";
import { confetti } from "./estilo/kit.js";
import { labWorld, holoify, holoBrain, holoHeart, holo, glowLine, BLUE, CYAN, ALERT } from "./estilo/holo.js";
import { createVisor, createCallouts } from "./estilo/visor.js";
import { onSurface } from "./motor/anatomia.js";
import style from "./estilo.js";
import timing from "./tempos.js";
import { T, STATION, LABELS, CARDS, HIGHLIGHTS, CAMERA, VISOR } from "./plano.js";

const { A, B, C, D, G, H, I } = STATION;
const TEAL = 0x5ff0c8, RED = 0xff3a3a, DARK_RED = 0xb01020;
const phraseEndOf = (i) => timing.phrases[i].end;
const glowing = (hex, intensity = 0.9) => material(hex, { emissive: hex, emissiveIntensity: intensity, roughness: 0.4 });
// fica fora do holograma: o que precisa chamar atenção (coágulo, sangue, alertas)
const keep = (object) => { object.traverse((child) => { child.userData.keepMaterial = true; }); return object; };
const worldOf = (object) => () => object.getWorldPosition(new THREE.Vector3());

// ---------- seu Antônio e a Bia (hologramas) ----------
function buildAntonio(scene) {
  const antonio = puppet({ shirt: 0x8a5a3c, skin: 0xd9a27a, pants: 0x3a3f4b });
  const head = antonio.parts.head;
  head.add(ball(0.2, 0xd8d8d8, [-0.03, 0.24, 0], {}, 1));
  const mouth = keep(piece(new THREE.BoxGeometry(0.02, 0.016, 0.11), glowing(0xe8f6ff, 1.2), [0.19, 0.11, 0]));
  for (const s of [-1, 1]) head.add(keep(piece(new THREE.SphereGeometry(0.025, 10, 8), glowing(0xe8f6ff, 1.2), [0.19, 0.2, s * 0.07])));
  head.add(mouth);
  holoify(antonio.outer, BLUE);
  const notes = [0, 1, 2].map(() => { const n = keep(ball(0.05, CYAN, [0, 0, 0], { emissive: CYAN, emissiveIntensity: 1 })); scene.add(n); return n; });
  scene.add(antonio.outer);
  return { antonio, mouth, notes };
}

function antonioPlace(t) {
  if (t >= T.mission - 0.3) return { where: [I - 0.5, 0, 0], pose: "final" };
  if (t >= T.urgent - 0.3) return { where: t >= T.lying - 0.3 ? [G - 0.05, 0.38, 0] : [G - 0.6, 0, -0.2], pose: t >= T.lying - 0.3 ? "lying" : "limp" };
  return { where: [A - 0.45, 0, -0.15], pose: "table" };
}

function antonioPose(t) {
  if (t >= T.mission - 0.3) return blendPose("standing", "celebrating", between(t, T.mission, 0.4));
  if (t >= T.lying - 0.3) return blendPose("limp", "sideLying", between(t, T.lying - 0.3, 0.8));
  if (t >= T.urgent - 0.3) return blendPose("standing", "limp", 0.7);
  if (t >= T.hug - 0.1 && t < T.music) {
    const up = blendPose("standing", "armsUp", between(t, T.hug + 0.6, 0.5));
    up.shoulderL *= 1 - between(t, T.armFalls - 0.1, 0.7);
    return up;
  }
  return blendPose("standing", "limp", between(t, T.strange - 0.3, 0.6) * 0.35);
}

function updateAntonio(family, t) {
  const { antonio, mouth, notes } = family;
  const place = antonioPlace(t);
  antonio.outer.position.set(...place.where);
  antonio.outer.rotation.z = place.pose === "lying" ? between(t, T.lying - 0.3, 0.8) * Math.PI / 2 : 0;
  antonio.pose(antonioPose(t));
  antonio.outer.position.y += place.pose === "final" ? Math.abs(Math.sin((t - T.mission) * 5)) * 0.1 * between(t, T.mission, 0.3) : 0;
  mouth.rotation.x = (t >= T.droop - 0.2 && t < T.mission ? 0.45 : 0) * between(t, T.droop - 0.2, 0.4);
  notes.forEach((n, k) => {
    const u = ((t - T.music) * 0.6 + k / 3) % 1, wobble = t >= T.slurred ? 0.12 * Math.sin(t * 9 + k) : 0;
    n.position.set(A - 0.2 + u * 0.5, 1.95 + u * 0.5 + wobble, 0.25 + 0.1 * k);
    n.scale.setScalar(pop(t, T.music + k * 0.2, phraseEndOf(14)) * (1 - u * 0.4));
  });
}

function biaPlace(t) {
  const atG = t >= T.urgent - 0.3 && t < T.mission - 0.3, atI = t >= T.mission - 0.3;
  const caring = atG && t >= T.lying && t < T.nothing - 0.3, stop = atG && t >= T.nothing - 0.3;
  const where = atI ? [I + 0.5, 0, 0] : caring ? [G - 1.3, -0.45, -0.6] : atG ? [G + 0.6, 0, 0.1] : [A + 0.55, 0, -0.1];
  return { atG, atI, caring, stop, where };
}

function buildBia(scene) {
  const bia = puppet({ shirt: 0x2ec4b6, skin: 0xc98e66, pants: 0x2b3a55 });
  bia.parts.head.add(ball(0.2, 0x2a1d14, [-0.02, 0.24, 0], {}, 1), ball(0.1, 0x2a1d14, [-0.16, 0.34, 0], {}, 1));
  const phone = keep(box(0.05, 0.1, 0.02, 0x15161a, [0, -0.3, 0.05], { emissive: 0x2ad46a, emissiveIntensity: 1 }));
  bia.parts.handR.add(phone);
  holoify(bia.outer, TEAL);
  scene.add(bia.outer);
  return function update(t) {
    const { atG, atI, caring, stop, where } = biaPlace(t);
    bia.outer.position.set(...where);
    bia.outer.rotation.y = stop ? -Math.PI / 4 : 0;
    phone.visible = atG && t < T.lying;
    if (atI) bia.pose(blendPose("standing", "celebrating", between(t, T.mission, 0.4)));
    else if (stop) bia.pose(blendPose("standing", "pointing", between(t, T.nothing - 0.3, 0.4)));
    else if (caring) bia.pose(blendPose("standing", "helping", between(t, T.lying, 0.5) * 0.75));
    else if (atG) bia.pose("holding");
    else bia.pose(t >= T.smile - 0.3 ? "pointing" : blendPose("standing", "lookingAtHand", between(t, T.strange, 0.4) * 0.5));
    if (!caring) bia.outer.position.y = atI ? Math.abs(Math.sin((t - T.mission) * 5 + 1)) * 0.1 * between(t, T.mission, 0.3) : 0;
  };
}

// ---------- estação A: o almoço ----------
function buildTable(scene) {
  const table = new THREE.Group();
  table.add(box(1.6, 0.08, 0.9, 0x6b4426, [A, 0.75, 0.35]));
  for (const [dx, dz] of [[-0.7, 0], [0.7, 0], [-0.7, 0.7], [0.7, 0.7]]) table.add(tube(0.035, 0.035, 0.74, 0x4a2e19, [A + dx, 0.37, dz], {}, 6));
  for (const dx of [-0.4, 0.45]) table.add(tube(0.17, 0.15, 0.03, 0xf4f1ea, [A + dx, 0.8, 0.4], {}, 18));
  scene.add(holoify(table, CYAN, { opacity: 0.7 }));
}

// ---------- o coágulo (vermelho, fora do holograma) ----------
function buildClot(scene) {
  const group = new THREE.Group(), body = new THREE.Group(), gaze = new THREE.Group();
  for (let k = 0; k < 7; k++) {
    const a = seeded(k + 70) * Math.PI * 2, r = 0.12 + seeded(k + 71) * 0.08;
    body.add(ball(0.13 + seeded(k + 72) * 0.05, k % 2 ? DARK_RED : RED, [Math.cos(a) * r, Math.sin(a) * r * 0.8, (seeded(k + 73) - 0.5) * 0.1], { emissive: 0xa00010, emissiveIntensity: 0.8 }, 1));
  }
  for (const s of [-1, 1]) gaze.add(ball(0.06, 0xffffff, [s * 0.08, 0.06, 0.2], { roughness: 0.3, emissive: 0x808080, emissiveIntensity: 0.6 }, 2), ball(0.03, 0x15161a, [s * 0.08, 0.06, 0.25], { roughness: 0.2 }, 2));
  for (const s of [-1, 1]) { const brow = box(0.08, 0.018, 0.02, 0x15161a, [s * 0.08, 0.13, 0.25]); brow.rotation.z = s * -0.4; gaze.add(brow); }
  group.add(body, gaze);
  scene.add(keep(group));
  return { group, body, gaze };
}

function clotRoute(brain) {
  const at = (curve, u) => brain.world(curve.getPointAt(u)).toArray();
  const stuck = brain.world(brain.stuckLocal).toArray();
  const route = path([A - 0.4, 1.35, 0.35], [
    [T.heart - 0.3, [B + 0.45, 2.2, 0.15], 1.6], [T.loose, [B + 0.9, 1.5, 0.6], 0.6],
    [T.rise - 0.1, [C, 0.8, 0.25], 1.0], [T.neck, [C, 3.0, 0.25], 1.8],
    [T.toBrain, at(brain.trunk.curve, 0), 1.6], [T.thin - 0.2, at(brain.trunk.curve, 0.85), 2.2], [T.stuck - 0.1, stuck, 0.7],
    [T.pull, at(brain.trunk.curve, 0.2), 1.4],
  ]);
  const size = path([0.6], [[T.heart - 0.3, [0.9], 1.0], [T.rise - 0.1, [0.55], 0.8], [T.thin - 0.2, [0.32], 1.5], [T.dissolve, [0.26], 3.0]]);
  return { route, size };
}

function updateClot(clot, plan, t) {
  clot.group.position.set(...plan.route(t));
  clot.group.scale.setScalar(plan.size(t)[0] * pop(t, T.clot) * (1 - between(t, T.pull + 1.0, 0.5)));
  clot.body.rotation.z = 0.2 * Math.sin(t * 1.4) + (t >= T.dissolve && t < T.pull ? 0.15 * Math.sin(t * 25) : 0);
  clot.gaze.rotation.y = t >= T.stuck && t < T.dissolve ? 0.35 * Math.sin(t * 6) : 0;
}

// ---------- estação B: o coração; C: o pescoço ----------
function buildHeart(scene) {
  const heart = holoHeart(scene, [B, 1.7, -0.7], 1.05);
  const update = (t) => {
    const irregular = Math.abs(Math.sin(t * 5.5 + 2 * Math.sin(t * 1.7)));
    heart.body.scale.setScalar(1 + 0.06 * irregular * (t >= T.rhythm ? 1.6 : 1));
    heart.group.rotation.y = 0.25 * Math.sin(t * 0.4);                                  // o holograma gira devagar
  };
  return { heart, update };
}

function buildNeck(scene) {
  const curve = new THREE.CatmullRomCurve3([[C, 0.6, 0.25], [C + 0.15, 1.6, 0.25], [C - 0.1, 2.6, 0.25], [C, 3.4, 0.25]].map((p) => new THREE.Vector3(...p)));
  const vessel = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.28, 18, false), holo(BLUE, { opacity: 0.8, rim: 1.8 }));
  vessel.add(new THREE.LineSegments(new THREE.EdgesGeometry(vessel.geometry, 1), glowLine(BLUE, 0.12)));
  scene.add(vessel);
  const cells = [...Array(14)].map((_, k) => { const c = piece(new THREE.TorusGeometry(0.06, 0.03, 6, 12), glowing(RED, 0.7)); c.userData.phase = seeded(k + 200); scene.add(c); return c; });
  return (t) => cells.forEach((cell) => { cell.position.copy(curve.getPointAt((cell.userData.phase + t * 0.18) % 1)); cell.rotation.set(t * 2, Math.PI / 2, 0); });
}

// ---------- estação D: o cérebro, a área sem sangue, o remédio e o cateter ----------
function buildBrainPhase(scene) {
  const brain = holoBrain(scene, [D, 2.4, -0.6], 1.6);
  const flow = [...Array(22)].map((_, k) => { const c = piece(new THREE.SphereGeometry(0.03, 8, 6), glowing(RED, 0.9)); c.userData.phase = seeded(k + 700); scene.add(c); return c; });
  const sparks = [...Array(14)].map((_, k) => { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.03, 0), new THREE.MeshBasicMaterial({ color: 0xc6ff3d })); s.userData.k = k; scene.add(s); return s; });
  const route = new THREE.CatmullRomCurve3([...brain.trunk.curve.points, brain.blocked.curve.getPointAt(0.15), brain.stuckLocal.clone()]);
  const catheter = new THREE.Mesh(new THREE.TubeGeometry(route, 60, 0.014, 8, false), glowing(0xffffff, 0.8));
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 8), new THREE.MeshBasicMaterial({ color: 0xc6ff3d }));
  brain.group.add(catheter, tip);
  const total = catheter.geometry.index.count, stuck = brain.world(brain.stuckLocal);
  const update = (t) => {
    brain.setDamage(between(t, T.noBlood, 1.4) * (1 - between(t, T.flows, 2.0)));
    const blocked = t >= T.stuck && t < T.flows;
    flow.forEach((cell) => {
      const u = (cell.userData.phase + t * 0.25) % 1, onBlocked = cell.userData.phase > 0.5;
      cell.visible = !(blocked && onBlocked && u > 0.3);
      cell.position.copy(brain.world((onBlocked ? brain.blocked.curve : brain.trunk.curve).getPointAt(u)));
    });
    sparks.forEach((s) => {
      const k = s.userData.k, a = k / 14 * Math.PI * 2 + t * 2, r = 0.18 + 0.05 * Math.sin(t * 3 + k);
      s.position.set(stuck.x + Math.cos(a) * r, stuck.y + Math.sin(a) * r, stuck.z + 0.05);
      s.scale.setScalar(pop(t, T.dissolve + k * 0.05, T.catheter));
    });
    const reach = between(t, T.catheter, 1.4) * (1 - between(t, T.pull + 0.2, 1.4));
    catheter.geometry.setDrawRange(0, Math.floor(total * reach / 6) * 6);
    tip.visible = reach > 0.01;
    tip.position.copy(route.getPointAt(Math.min(1, reach)));
  };
  return { brain, stuck, tip, update, territory: brain.world(onSurface(0.55, 0.45, 0.05)) };
}

// ---------- estação G: o que fazer; H: o hospital ----------
function crossOut(scene, position) {
  const x = new THREE.Group();
  for (const s of [-1, 1]) { const bar = box(0.5, 0.06, 0.04, ALERT, [0, 0, 0], { emissive: ALERT, emissiveIntensity: 1 }); bar.rotation.z = s * Math.PI / 4; x.add(bar); }
  x.position.set(...position);
  scene.add(keep(x));
  return x;
}

function buildActions(scene) {
  const place = new THREE.Group();
  place.add(box(2.1, 0.2, 0.8, 0x3a4a8a, [G - 0.95, 0.1, 0]), box(0.4, 0.1, 0.5, 0xf2f2f2, [G - 1.72, 0.25, 0]), box(0.6, 0.85, 0.5, 0x6b4426, [G + 1.3, 0.42, 0.1]));
  scene.add(holoify(place, CYAN, { opacity: 0.6 }));
  const notebook = holoify(box(0.3, 0.02, 0.22, 0xf4f1ea, [G + 1.3, 0.9, 0.2]), 0xffffff);
  const watch = holoify(tube(0.12, 0.12, 0.03, 0xffd21f, [G + 1.45, 0.92, 0.1], {}, 20), 0xc6ff3d);
  scene.add(notebook, watch);
  const items = [
    { at: T.pill, mesh: piece(new THREE.CapsuleGeometry(0.055, 0.12, 6, 12), material(0xffffff), [G - 0.2, 1.1, 0.4]) },
    { at: T.water, mesh: tube(0.07, 0.06, 0.2, 0x9ad8ff, [G + 0.2, 1.1, 0.4], {}, 14) },
    { at: T.food, mesh: tube(0.12, 0.1, 0.04, 0xf4f1ea, [G + 0.6, 1.1, 0.4], {}, 16) },
  ];
  items.forEach((item) => { scene.add(holoify(item.mesh, CYAN)); item.x = crossOut(scene, [item.mesh.position.x, 1.1, 0.5]); });
  const update = (t) => {
    notebook.scale.setScalar(pop(t, T.hour - 0.2));
    watch.rotation.y = t * 1.5;
    items.forEach((item) => { item.mesh.scale.setScalar(pop(t, item.at - 0.3, phraseEndOf(20) + 0.5)); item.x.scale.setScalar(pop(t, item.at + 0.25, phraseEndOf(20) + 0.5)); });
  };
  return { notebook, update };
}

function buildHospital(scene) {
  const building = new THREE.Group();
  building.add(box(3.0, 2.6, 1.6, 0xf2f4f8, [H, 1.3, -1.2]));
  for (let k = 0; k < 4; k++) building.add(box(0.4, 0.4, 0.05, 0x9ad8ff, [H - 1.05 + k * 0.7, 1.0, -0.38]));
  scene.add(holoify(building, BLUE, { opacity: 0.8 }));
  for (const [w, h] of [[0.7, 0.2], [0.2, 0.7]]) scene.add(keep(box(w, h, 0.05, ALERT, [H, 2.1, -0.36], { emissive: ALERT, emissiveIntensity: 1 })));
  const ambulance = new THREE.Group(), light = keep(ball(0.08, 0x2a6aff, [0, 0.8, 0], { emissive: 0x2a6aff, emissiveIntensity: 1.5 }));
  ambulance.add(box(1.2, 0.6, 0.6, 0xffffff, [0, 0.45, 0]));
  for (const [dx, dz] of [[-0.4, 0.3], [0.4, 0.3], [-0.4, -0.3], [0.4, -0.3]]) ambulance.add(tube(0.12, 0.12, 0.08, 0x15161a, [dx, 0.12, dz], {}, 12).rotateX(Math.PI / 2));
  holoify(ambulance, CYAN);
  ambulance.add(light);
  scene.add(ambulance);
  return (t) => {
    ambulance.position.set(H + 4 - 3.2 * between(t, T.hospital - 0.6, 1.6), 0, 0.6);
    light.material.emissive.setHex(t % 1.2 < 0.6 ? 0x2a6aff : 0xff2030);   // 1,7 troca por segundo: abaixo do limite
  };
}

// ---------- as etiquetas presas aos objetos ----------
function callouts(family, clot, heartParts, brainPhase, actions) {
  const head = worldOf(family.antonio.parts.head), mouth = worldOf(family.mouth), hand = worldOf(family.antonio.parts.handL);
  const clotAt = worldOf(clot.group), stuck = () => brainPhase.stuck, territory = () => brainPhase.territory;
  const end = phraseEndOf;
  return [
    { at: T.antonio, until: end(0), anchor: head, text: "PACIENTE: ANTÔNIO", side: "right", dy: -170 },
    { at: T.clot + 0.3, until: T.heart - 0.5, anchor: clotAt, text: "O COÁGULO TÁ AQUI", tone: "lime", side: "right", dx: 180, dy: 170 },
    { at: T.heart + 0.3, until: end(2), anchor: heartParts.heart.leftAtrium, text: "ÁTRIO ESQUERDO", side: "right", dy: -190 },
    { at: T.neck, until: end(3), anchor: () => new THREE.Vector3(C + 0.1, 2.0, 0.5), text: "ARTÉRIA CARÓTIDA", side: "left", dy: -120 },
    { at: T.stuck + 0.1, until: end(5), anchor: stuck, text: "ENTALOU AQUI", tone: "lime", side: "left", dy: 170 },
    { at: T.noOxygen, until: end(7), anchor: territory, text: "SEM OXIGÊNIO", tone: "alert", side: "left", dx: 300, dy: -230 },
    { at: T.droop, until: end(12), anchor: mouth, text: "BOCA CAÍDA", tone: "alert", side: "right", dx: 200, dy: 160 },
    { at: T.armFalls, until: end(13), anchor: hand, text: "BRAÇO CAIU", tone: "alert", side: "left", dy: -120 },
    { at: T.slurred, until: end(14), anchor: mouth, text: "FALA ENROLADA", tone: "alert", side: "right", dx: 200, dy: 160 },
    { at: T.hour + 0.2, until: end(18), anchor: worldOf(actions.notebook), text: "INÍCIO: 12:40", tone: "lime", side: "left", dy: -170 },
    { at: T.lying + 0.6, until: end(19), anchor: head, text: "CABEÇA APOIADA", side: "right", dx: 160, dy: -260 },
    { at: T.dissolve, until: T.catheter, anchor: stuck, text: "DISSOLVENDO...", side: "left", dy: 170 },
    { at: T.catheter + 0.7, until: T.pull + 0.8, anchor: worldOf(brainPhase.tip), text: "CATETER", tone: "lime", side: "right", dy: 170 },
    { at: T.flows + 0.3, until: end(24), anchor: territory, text: "FLUXO: 100%", tone: "lime", side: "left", dx: 300, dy: -230 },
  ];
}

export function createScene(canvas, root) {
  const stage = createStage(canvas, style);
  const world = labWorld(stage.scene, Object.values(STATION));
  const overlay = createOverlay(root, timing, style, { labels: LABELS, cards: CARDS, highlights: HIGHLIGHTS });
  const drone = createDrone(stage.camera, CAMERA, style.camera);
  buildTable(stage.scene);
  const family = buildAntonio(stage.scene), clot = buildClot(stage.scene), heartParts = buildHeart(stage.scene);
  const brainPhase = buildBrainPhase(stage.scene), actions = buildActions(stage.scene);
  const plan = clotRoute(brainPhase.brain);
  const stations = [buildBia(stage.scene), heartParts.update, buildNeck(stage.scene), actions.update, buildHospital(stage.scene), brainPhase.update];
  const party = confetti(stage.scene, [I, 0, 0.4]);
  const visor = createVisor(root, VISOR, T.end, style.hud);
  const tags = createCallouts(root, stage.camera, callouts(family, clot, heartParts, brainPhase, actions), style.hud);
  return function draw(t) {
    const focus = drone.update(t);
    stage.followLight(focus);
    world(t);
    updateAntonio(family, t);
    updateClot(clot, plan, t);
    stations.forEach((update) => update(t));
    party(t, T.congrats);
    stage.draw();
    stage.camera.updateMatrixWorld();
    overlay(t, stage.camera);
    visor(t);
    tags(t);
  };
}
