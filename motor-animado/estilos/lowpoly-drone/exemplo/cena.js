// cena.js do exemplo "Cafeína": O QUE aparece em cada estação. O QUANDO e a câmera estão no plano.js.
// Cada estação é montada uma vez por uma função build...() que devolve update(t); o desenho chama todas.
import * as THREE from "three";
import { between, pop, clamp, seeded, blink, path } from "./motor/nucleo.js";
import { createStage } from "./motor/palco.js";
import { createDrone } from "./motor/camera.js";
import { createOverlay } from "./motor/textos.js";
import { puppet, blendPose } from "./motor/personagens.js";
import { box, ball, tube, piece, material, glow, lightUp } from "./motor/formas.js";
import { themedWorld, molecule, confetti } from "./estilo/kit.js";
import style from "./estilo.js";
import timing from "./tempos.js";
import { T, STATION, LABELS, CARDS, HIGHLIGHTS, CAMERA } from "./plano.js";

const { A, B, C, D, E, F } = STATION;
const YELLOW = 0xffd21f;

// a Bia: coque e camiseta verde-água (personagem de exemplo; os seus vêm do perfil.json)
function buildBia(scene) {
  const bia = puppet({ shirt: 0x2ec4b6, skin: 0xc98e66, pants: 0x2b3a55 });
  bia.parts.head.add(ball(0.2, 0x2a1d14, [-0.02, 0.24, 0], {}, 1), ball(0.1, 0x2a1d14, [-0.16, 0.34, 0], {}, 1));   // cabelo e coque
  scene.add(bia.outer);
  return function update(t) {
    const where = t < T.overdid ? [A - 0.35, 0, -0.2] : t < T.congrats - 0.3 ? [E, 0, 0] : [F - 0.7, 0, 0];
    bia.outer.position.set(...where);
    if (t < T.overdid) bia.pose(blendPose("standing", "drinking", between(t, T.sip - 0.5, 0.4) - between(t, T.down + 0.3, 0.4)));
    else if (t < T.congrats - 0.3) {
      const shaky = blendPose("standing", "lookingAtHand", between(t, T.hand - 0.2, 0.3));
      shaky.elbowR += between(t, T.hand, 0.2) * 7 * Math.sin(t * 45);   // a mão tremendo
      shaky.head += 3 * Math.sin(t * 30) * between(t, T.heart, 0.3);
      bia.pose(shaky);
    } else bia.pose(blendPose("standing", "celebrating", between(t, T.congrats, 0.4)));
    bia.outer.position.y = t >= T.congrats ? Math.abs(Math.sin((t - T.congrats) * 5)) * 0.12 : 0;
    return bia;
  };
}

// estação A: a mesa, a xícara que vai até a mão e o vapor
function buildCafe(scene, updatePerson) {
  scene.add(box(1.5, 0.08, 0.8, 0x6b4426, [A, 0.75, 0.3]));
  for (const [dx, dz] of [[-0.65, 0], [0.65, 0], [-0.65, 0.6], [0.65, 0.6]]) scene.add(tube(0.035, 0.035, 0.74, 0x4a2e19, [A + dx, 0.37, dz], {}, 6));
  const cup = new THREE.Group();
  cup.add(tube(0.075, 0.065, 0.15, 0xffffff, [0, 0.075, 0], {}, 16), tube(0.068, 0.068, 0.01, 0x3b1f0e, [0, 0.145, 0], {}, 16));
  cup.add(piece(new THREE.TorusGeometry(0.04, 0.012, 6, 12), material(0xffffff), [0.085, 0.08, 0]));
  scene.add(cup);
  const steam = [0, 1, 2].map(() => { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.04, 1), glow(0xffffff, 0.35)); scene.add(s); return s; });
  const onTable = new THREE.Vector3(A + 0.3, 0.79, 0.35), hand = new THREE.Vector3();
  return function update(t) {
    const bia = updatePerson(t);
    bia.outer.updateMatrixWorld(true);
    bia.parts.handR.getWorldPosition(hand);
    const inHand = clamp(between(t, T.sip - 0.5, 0.4) - between(t, T.down + 0.3, 0.4));
    cup.position.lerpVectors(onTable, hand.add(new THREE.Vector3(0, -0.06, 0.05)), inHand);
    cup.visible = t < T.overdid;
    steam.forEach((s, k) => {
      const u = (t * 0.45 + k / 3) % 1;
      s.position.set(cup.position.x + 0.03 * Math.sin(t * 2 + k), cup.position.y + 0.18 + u * 0.45, cup.position.z);
      s.material.opacity = 0.35 * (1 - u) * (1 - inHand) * (cup.visible ? 1 : 0);
      s.scale.setScalar(1 + u * 1.5);
    });
  };
}

// "você": a molécula de cafeína (dois anéis, nitrogênios azuis, oxigênios vermelhos)
function buildYou(scene) {
  const atoms = [[0, 0.4, "N"], [-0.346, 0.2, "C"], [-0.346, -0.2, "N"], [0, -0.4, "C"], [0.346, -0.2, "C"], [0.346, 0.2, "C"],
    [0.72, 0.33, "N"], [0.93, 0, "C"], [0.72, -0.33, "N"], [-0.72, 0.42, "O"], [0, -0.8, "O"], [0, 0.82, "H"], [-0.72, -0.42, "H"], [0.86, 0.72, "H"]]
    .map(([x, y, e]) => [x - 0.2, y, e]);
  const bonds = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [5, 6], [6, 7], [7, 8], [8, 4], [1, 9], [3, 10], [0, 11], [2, 12], [6, 13]];
  const you = molecule(atoms, bonds, { glowHex: 0x8a4a10, eyes: [-0.2, 0] });
  scene.add(you.group);
  const route = path([A + 0.3, 1.25, 0.35], [
    [T.sip - 0.3, [A - 0.25, 1.75, 0.15], 0.5], [T.down, [B, 1.6, 0.2], 1.6], [T.blood - 0.1, [B + 1.4, 1.2, 0], 0.4],
    [T.blood + 0.3, [C - 2.2, 1.2, 0], T.twenty + 0.4 - T.blood], [T.brain - 0.2, [C, 2.2, 0.6], 0.6],
    [T.fits - 0.1, [D - 0.6, 1.5, 0.3], 0.9], [T.receptor, [D, 1.08, 0.08], 0.5],
    [T.overdid + 0.2, [E + 0.75, 2.45, 0.5], 1.4], [T.congrats - 0.3, [F + 0.55, 1.45, 0.3], 1.2],
  ]);
  const size = path([0.32], [[T.blood - 0.1, [0.24], 0.4], [T.brain - 0.2, [0.36], 0.5], [T.receptor, [0.42], 0.5], [T.overdid + 0.2, [0.22], 1.2], [T.congrats - 0.3, [0.62], 1.2]]);
  return function update(t) {
    you.group.position.set(...route(t));
    you.group.scale.setScalar(size(t)[0] * pop(t, T.molecule));
    you.body.rotation.z = 0.15 * Math.sin(t * 1.3);
    you.group.rotation.y = 0.25 * Math.sin(t * 0.8);
    lightUp(you.body, YELLOW, blink(t, T.block) ? 0.7 : 0);
  };
}

// estação B: o estômago (laranja, para não confundir com o cérebro rosa) e o vaso com as hemácias
function buildStomachAndBlood(scene) {
  const stomach = ball(1, 0xffa25a, [B, 1.4, -1.6], { emissive: 0x803010, emissiveIntensity: 0.25 }, 1);
  scene.add(stomach);
  const vessel = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, C - 2 - (B + 1), 20, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xff3048, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }));
  vessel.rotation.z = Math.PI / 2;
  vessel.position.set((B + 1 + C - 2) / 2, 1.2, 0);
  scene.add(vessel);
  const cells = [...Array(26)].map((_, k) => {
    const cell = piece(new THREE.TorusGeometry(0.1, 0.05, 6, 12), material(0xd01830, { emissive: 0x500010, emissiveIntensity: 0.4 }));
    cell.userData = { phase: seeded(k + 60), y: (seeded(k + 61) - 0.5) * 0.5, z: (seeded(k + 62) - 0.5) * 0.5 };
    scene.add(cell);
    return cell;
  });
  return function update(t) {
    stomach.scale.set(1.2 + 0.04 * Math.sin(t * 2), 0.9, 0.8);
    cells.forEach((cell) => {
      const u = (cell.userData.phase + t * 0.12) % 1;
      cell.position.set(B + 1.3 + u * (C - 3.5 - B), 1.2 + cell.userData.y, cell.userData.z);
      cell.rotation.set(t * 2 + cell.userData.phase * 6, Math.PI / 2, 0);
    });
  };
}

// estação C: o cérebro (malha amassada que pulsa)
function buildBrain(scene) {
  const geometry = new THREE.IcosahedronGeometry(1, 2), positions = geometry.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < positions.count; i++) {
    v.fromBufferAttribute(positions, i);
    v.multiplyScalar(1 + 0.09 * Math.sin(v.x * 7) * Math.sin(v.y * 6) * Math.sin(v.z * 5));
    positions.setXYZ(i, v.x * 1.25, v.y * 0.9, v.z);
  }
  geometry.computeVertexNormals();
  const brain = piece(geometry, material(0xff9ec4, { emissive: 0xff4a9a, emissiveIntensity: 0.15 }), [C, 2.2, -1]);
  scene.add(brain);
  return (t) => brain.scale.setScalar(1 + 0.03 * Math.sin(t * 3) + 0.08 * pop(t, T.brain, T.brain + 0.4));
}

// estação D: a membrana, o receptor (uma cadeira) e as adenosinas que chegam e não têm onde sentar
function buildReceptor(scene) {
  scene.add(box(6, 0.4, 3, 0xd86aa8, [D, 0.2, -0.3], { emissive: 0x501030, emissiveIntensity: 0.3 }));
  const chair = new THREE.Group();
  chair.add(box(0.55, 0.07, 0.5, 0x2ad4c4, [0, 0.45, 0]), box(0.55, 0.55, 0.07, 0x2ad4c4, [0, 0.75, -0.22]));
  for (const [dx, dz] of [[-0.23, -0.2], [0.23, -0.2], [-0.23, 0.2], [0.23, 0.2]]) chair.add(tube(0.025, 0.025, 0.42, 0x1a8a80, [dx, 0.21, dz], {}, 6));
  chair.position.set(D, 0.4, 0);
  scene.add(chair);
  const adenosines = [0, 1, 2].map((k) => {
    const m = molecule([[0, 0.3, "N"], [0.28, 0.1, "C"], [0.18, -0.25, "C"], [-0.18, -0.25, "N"], [-0.28, 0.1, "C"], [0, 0.65, "O"]],
      [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 5]], { glowHex: 0x10a0b0 });
    m.route = path([D + 2.6 + k * 0.7, 1.2 + k * 0.15, 0.6 - k * 0.5], [
      [T.tired - 0.3, [D + 0.75 + k * 0.32, 1.12 + k * 0.1, 0.35 - k * 0.3], 0.7], [T.sit, [D + 2.0 + k * 0.6, 1.5 + k * 0.1, 0.6 - k * 0.5], 0.8]]);
    scene.add(m.group);
    return m;
  });
  return function update(t) {
    adenosines.forEach((m, k) => {
      m.group.position.set(...m.route(t));
      m.group.scale.setScalar(0.3 * pop(t, T.tired - 0.5 + k * 0.1));
      m.group.rotation.z = t > T.sit - 0.2 ? 0.25 * Math.sin((t - T.sit) * 14) * Math.max(0, 1 - (t - T.sit) / 1.2) : 0;
      m.gaze.rotation.y = t > T.sit ? 0.4 * Math.sin(t * 9) : 0;   // "cadê meu lugar?"
    });
    lightUp(chair, YELLOW, blink(t, T.block) ? 0.6 : 0);
  };
}

// estação E: o coração acelerado e a lua da noite sem dormir; estação F: o confete
function buildExcessAndEnd(scene) {
  const heart = new THREE.Group(), red = { emissive: 0xa00010, emissiveIntensity: 0.5 };
  heart.add(ball(0.17, 0xff2840, [-0.12, 0.08, 0], red, 1), ball(0.17, 0xff2840, [0.12, 0.08, 0], red, 1));
  const tip = piece(new THREE.ConeGeometry(0.29, 0.38, 8), material(0xff2840, red), [0, -0.16, 0]);
  tip.rotation.x = Math.PI;
  heart.add(tip);
  heart.position.set(E + 0.7, 1.95, 0.2);
  const moon = ball(0.6, 0xfff2a8, [E - 0.9, 3.3, -2.6], { emissive: 0xfff2a8, emissiveIntensity: 0.8 }, 2);
  scene.add(heart, moon);
  const party = confetti(scene, [F, 0, 0.4]);
  return function update(t) {
    const beat = t >= T.heart ? Math.abs(Math.sin(t * 9)) : Math.abs(Math.sin(t * 3)) * 0.3;
    heart.scale.setScalar((0.9 + 0.22 * beat) * pop(t, T.overdid + 0.6));
    moon.scale.setScalar(pop(t, T.night));
    party(t, T.congrats);
  };
}

export function createScene(canvas, root) {
  const stage = createStage(canvas, style);
  const world = themedWorld(stage.scene, style, { x0: -15, x1: 75 });
  const overlay = createOverlay(root, timing, style, { labels: LABELS, cards: CARDS, highlights: HIGHLIGHTS });
  const drone = createDrone(stage.camera, CAMERA, style.camera);
  const updatePerson = buildBia(stage.scene);
  const stations = [buildCafe(stage.scene, updatePerson), buildYou(stage.scene), buildStomachAndBlood(stage.scene),
    buildBrain(stage.scene), buildReceptor(stage.scene), buildExcessAndEnd(stage.scene)];
  return function draw(t) {
    const focus = drone.update(t);
    stage.followLight(focus);
    world(t, focus);
    stations.forEach((update) => update(t));
    overlay(t, stage.camera);
    stage.draw();
  };
}
