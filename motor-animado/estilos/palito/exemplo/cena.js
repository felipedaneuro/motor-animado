// cena.js do exemplo "Estetoscópio" (estilo palito): a médica plana ao lado de um estetoscópio gigante que se monta
// peça por peça, num mundo ensolarado.
import * as THREE from "three";
import { createStage } from "./motor/palco.js";
import { createDrone } from "./motor/camera.js";
import { createOverlay } from "./motor/textos.js";
import { flatCharacter, FLAT_POSES } from "./motor/personagens.js";
import { material, piece, tube, ball, link } from "./motor/formas.js";
import { sunnyWorld, building, flyIn } from "./estilo/kit.js";
import style from "./estilo.js";
import timing from "./tempos.js";
import { T, PARTS, LABELS, CARDS, HIGHLIGHTS, CAMERA } from "./plano.js";

// metal claro: sem um céu refletido, metalness alto fica preto; 0,35 dá o brilho sem escurecer
const CHROME = { metalness: 0.35, roughness: 0.3 };

function buildStethoscope(scene) {
  const diaphragm = new THREE.Group();
  const disc = tube(0.38, 0.38, 0.14, 0xd6dae0, [0, 0, 0], CHROME, 32);
  disc.rotation.x = Math.PI / 2;
  diaphragm.add(disc, tube(0.3, 0.3, 0.02, 0xeef2f5, [0, 0, 0.075], { roughness: 0.6 }, 32).rotateX(Math.PI / 2));
  diaphragm.position.set(1.25, 0.55, 0);
  const curve = new THREE.CatmullRomCurve3([[1.25, 0.65, 0], [1.75, 1.1, 0.1], [0.95, 1.7, 0], [1.2, 2.3, 0]].map((p) => new THREE.Vector3(...p)));
  const hose = new THREE.Group();
  hose.add(piece(new THREE.TubeGeometry(curve, 48, 0.07, 12), material(0x2f3a4a, { roughness: 0.5 })));
  const earpieces = new THREE.Group();
  for (const side of [-1, 1]) {
    const top = [1.2 + side * 0.45, 3.2, 0];
    earpieces.add(link([1.2, 2.3, 0], top, 0.035, material(0xd6dae0, CHROME)), ball(0.11, 0x15161a, top, { roughness: 0.4 }, 2));
  }
  const parts = { diaphragm, tube: hose, earpieces };
  Object.values(parts).forEach((g) => scene.add(g));
  const home = Object.fromEntries(Object.entries(parts).map(([id, g]) => [id, g.position.clone()]));
  return function update(t) {
    for (const part of PARTS) {
      const group = parts[part.id], flight = flyIn(t, part.word, 0.45, part.from);
      group.visible = flight.visible;
      group.position.set(home[part.id].x + flight.offset[0], home[part.id].y + flight.offset[1], home[part.id].z + flight.offset[2]);
      group.rotation.y = flight.spin * 1.2;
    }
  };
}

function buildDoctor(scene) {
  const doctor = flatCharacter({ shirt: "#f4f6f8", skin: "#c98e66", pants: "#3b6fd8", hair: "#2a1d14", height: 2.0 });
  doctor.group.position.set(-0.6, 0, 0.2);
  scene.add(doctor.group);
  return function update(t, camera) {
    const talkingAboutPart = PARTS.some((p) => t >= p.word && t < p.word + 1.4);
    const pose = t >= T.done ? FLAT_POSES.waving : talkingAboutPart ? FLAT_POSES.pointing : FLAT_POSES.standing;
    doctor.setPose(pose);
    doctor.faceCamera(camera);
  };
}

export function createScene(canvas, root) {
  const stage = createStage(canvas, style);
  sunnyWorld(stage.scene);
  building(stage.scene, { color: 0xd8342b, position: [-6, 0, -12] });
  building(stage.scene, { color: 0x3b6fd8, height: 7, position: [6, 0, -16] });
  const updateStethoscope = buildStethoscope(stage.scene);
  const updateDoctor = buildDoctor(stage.scene);
  const overlay = createOverlay(root, timing, style, { labels: LABELS, cards: CARDS, highlights: HIGHLIGHTS });
  const drone = createDrone(stage.camera, CAMERA, style.camera);
  return function draw(t) {
    const focus = drone.update(t);
    stage.followLight(focus);
    updateStethoscope(t);
    updateDoctor(t, stage.camera);
    overlay(t, stage.camera);
    stage.draw();
  };
}
