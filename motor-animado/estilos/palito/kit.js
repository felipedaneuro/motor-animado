// kit.js do estilo palito: o mundo ensolarado de formas simples e cores saturadas e as peças que voam para o lugar.
// O personagem plano vem do motor (flatCharacter, FLAT_POSES).
import * as THREE from "three";
import { clamp, easeOut, seeded } from "../motor/nucleo.js";
import { material, piece, box, tube, ball } from "../motor/formas.js";

// o chão claro, um caminho e árvores de enfeite, tudo em formas simples
export function sunnyWorld(scene, { size = 120, ground = 0xcfe3b0, pathColor = 0xe9d9b4, trees = 24 } = {}) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material(ground, { roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(3, size), material(pathColor, { roughness: 1 }));
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.01;
  road.receiveShadow = true;
  scene.add(road);
  for (let k = 0; k < trees; k++) {
    const x = (seeded(k + 1) > 0.5 ? 1 : -1) * (4 + seeded(k + 2) * 14), z = -10 - seeded(k + 3) * 40, h = 1 + seeded(k + 4) * 1.5;
    scene.add(tube(0.1, 0.14, h, 0x7a4a2a, [x, h / 2, z], {}, 8), ball(0.7 + seeded(k + 5) * 0.5, 0x4caf50, [x, h + 0.4, z], {}, 1));
  }
  return floor;
}

// um prédio simples de cor forte, com janelas
export function building(scene, { width = 3, height = 5, depth = 3, color = 0x3b6fd8, position = [0, 0, -6] } = {}) {
  const group = new THREE.Group();
  group.add(box(width, height, depth, color, [0, height / 2, 0]));
  for (let row = 0; row < Math.floor(height / 1.2); row++) {
    for (const x of [-width / 4, width / 4]) group.add(box(0.5, 0.6, 0.05, 0xfff4c2, [x, 1 + row * 1.2, depth / 2 + 0.02]));
  }
  group.position.set(...position);
  scene.add(group);
  return group;
}

// trilhos com dormentes ao longo de z
export function rails(scene, { length = 40, position = [0, 0, 0] } = {}) {
  const group = new THREE.Group();
  for (const x of [-0.5, 0.5]) group.add(box(0.08, 0.1, length, 0x8e949c, [x, 0.1, 0], { metalness: 0.6, roughness: 0.3 }));
  for (let k = 0; k < length / 0.8; k++) group.add(box(1.5, 0.08, 0.25, 0x6b4426, [0, 0.04, -length / 2 + k * 0.8]));
  group.position.set(...position);
  scene.add(group);
  return group;
}

// uma peça que voa até o lugar: sai de longe (from, relativo), faz um arco e assenta em `duration` segundos
export function flyIn(t, t0, duration = 0.45, from = [3, 2, 0]) {
  const u = clamp((t - t0) / duration);
  if (u <= 0) return { visible: false, offset: from, spin: 1 };
  const k = easeOut(u), arc = Math.sin(Math.PI * k) * 0.6;
  return { visible: true, offset: [from[0] * (1 - k), from[1] * (1 - k) + arc, from[2] * (1 - k)], spin: 1 - k };
}

export { piece };
