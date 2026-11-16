// mundo.js: os mundos de dia que qualquer estilo pode usar, com as cores do tema (style.world e style.accents,
// vindos de estilos/_temas.json pelo "theme" do estilo ou do vídeo).
//   dayWorld(cena, style, {x0, x1})  campo (morros, árvores, pedras, flores, nuvens) ou cidade (prédios baixos)
//   studio(cena, style, {x, ...})    um fundo liso com piso, para um apresentador (mascote) falar com a câmera
//   accent(style, k)                 a cor de destaque k do tema
import * as THREE from "three";
import { seeded } from "./nucleo.js";
import { material, piece, tube } from "./formas.js";

const DEFAULT_WORLD = { scenery: "campo", ground: "#a3c486", path: "#e6d6b2", hills: "#86a97a", foliage: ["#5e9a5a", "#78ad62"],
  trunk: "#7a5a3c", rock: "#a9a49a", cloud: "#ffffff", buildings: ["#c9b48a", "#b89f74"], windows: "#fff6d8" };

const pick = (list, k) => list[Math.floor(seeded(k) * list.length) % list.length];

function groundAndPath(scene, world, center, width) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, 160), material(world.ground, { roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.x = center;
  floor.receiveShadow = true;
  const path = new THREE.Mesh(new THREE.PlaneGeometry(width, 3.2), material(world.path, { roughness: 1 }));
  path.rotation.x = -Math.PI / 2;
  path.position.set(center, 0.015, 0.2);
  path.receiveShadow = true;
  scene.add(floor, path);
}

function hills(scene, world, x0, x1) {
  for (let k = 0; k < 26; k++) {
    const hill = piece(new THREE.IcosahedronGeometry(6 + seeded(k + 600) * 9, 1), material(world.hills, { roughness: 1 }),
      [x0 - 20 + seeded(k + 601) * (x1 - x0 + 40), -2, -48 - seeded(k + 602) * 26]);
    hill.scale.y = 0.35 + seeded(k + 603) * 0.3;
    scene.add(hill);
  }
}

function tree(world, k, position) {
  const group = new THREE.Group(), h = 1.1 + seeded(k + 710) * 1.4;
  group.add(tube(0.09 * h, 0.13 * h, h, world.trunk, [0, h / 2, 0], {}, 6));
  const crown = piece(new THREE.ConeGeometry(0.75 * h, 1.6 * h, 7), material(pick(world.foliage, k + 711), { roughness: 0.9 }), [0, h * 1.45, 0]);
  if (k % 3 === 0) crown.geometry = new THREE.IcosahedronGeometry(0.75 * h, 0);   // umas copas redondas no meio dos pinheiros
  group.add(crown);
  group.position.set(...position);
  return group;
}

function scatter(scene, world, x0, x1, count, near = -5) {
  for (let k = 0; k < count; k++) {
    const x = x0 + seeded(k + 720) * (x1 - x0), z = near - seeded(k + 721) * 26;
    if (k % 4 === 3) { scene.add(piece(new THREE.DodecahedronGeometry(0.25 + seeded(k + 722) * 0.4, 0), material(world.rock, { roughness: 1 }), [x, 0.15, z])); continue; }
    scene.add(tree(world, k, [x, 0, z]));
  }
}

function clouds(scene, world, x0, x1) {
  return [...Array(14)].map((_, k) => {
    const cloud = new THREE.Group();
    for (let q = 0; q < 4; q++) cloud.add(piece(new THREE.IcosahedronGeometry(1.2 + seeded(k * 7 + q) * 1.2, 0), material(world.cloud, { roughness: 1 }), [q * 1.5 - 2.2, seeded(k * 7 + q + 3) * 0.8, 0]));
    cloud.userData = { x: x0 + seeded(k + 800) * (x1 - x0), y: 14 + seeded(k + 801) * 10, z: -45 - seeded(k + 802) * 20 };
    scene.add(cloud);
    return cloud;
  });
}

function flowers(scene, accents, x0, x1) {
  for (let k = 0; k < 70; k++) {
    const side = seeded(k + 900) > 0.5 ? 1 : -1, x = x0 + seeded(k + 901) * (x1 - x0), z = 0.2 + side * (2.0 + seeded(k + 902) * 2.5);
    scene.add(piece(new THREE.TetrahedronGeometry(0.07, 0), material(pick(accents, k + 903)), [x, 0.08, z]));
  }
}

function blocks(scene, world, x0, x1) {   // a cidade: prédios baixos com janelas, de cores neutras
  for (let k = 0; k < 34; k++) {
    const w = 2 + seeded(k + 950) * 3, h = 2.5 + seeded(k + 951) * 9, x = x0 + (k / 34) * (x1 - x0) + seeded(k + 952) * 2, z = -9 - seeded(k + 953) * 22;
    const block = new THREE.Group();
    block.add(piece(new THREE.BoxGeometry(w, h, w), material(pick(world.buildings, k + 954), { roughness: 0.9 }), [0, h / 2, 0]));
    for (let row = 1; row < h - 0.6; row += 1.3) block.add(piece(new THREE.BoxGeometry(w * 0.7, 0.45, 0.04), material(world.windows, { emissive: world.windows, emissiveIntensity: 0.15 }), [0, row, w / 2 + 0.02]));
    block.position.set(x, 0, z);
    scene.add(block);
  }
}

// o mundo do tema: "campo" (morros, árvores, pedras, flores e nuvens) ou "cidade" (prédios, árvores na calçada e nuvens)
export function dayWorld(scene, style, { x0 = -20, x1 = 100 } = {}) {
  const world = { ...DEFAULT_WORLD, ...(style.world || {}) };
  const center = (x0 + x1) / 2, width = x1 - x0 + 80;
  groundAndPath(scene, world, center, width);
  hills(scene, world, x0, x1);
  if (world.scenery === "cidade") { blocks(scene, world, x0 - 10, x1 + 10); scatter(scene, world, x0, x1, 16, -4); }
  else { scatter(scene, world, x0 - 10, x1 + 10, 60); flowers(scene, style.accents || [], x0, x1); }
  const sky = clouds(scene, world, x0 - 20, x1 + 20);
  return function update(t) {
    sky.forEach((cloud, k) => cloud.position.set(cloud.userData.x + t * 0.25 + Math.sin(k) * 0.5, cloud.userData.y, cloud.userData.z));
  };
}

// a cor de destaque número k do tema (para estações, peças e personagens combinarem com o assunto)
export const accent = (style, k) => new THREE.Color((style.accents || ["#ffd21f"])[k % (style.accents || ["#ffd21f"]).length]);


// o estúdio: parede lisa e piso cinza, com a cor do tema (style.world.studio_wall / studio_floor) ou neutros
export function studio(scene, style, { x = 0, width = 8, depth = 5 } = {}) {
  const world = style.world || {};
  const wall = piece(new THREE.BoxGeometry(width * 3, 12, 0.2), material(world.studio_wall || "#ddd8cc", { roughness: 1 }), [x, 6, -depth / 2]);
  const floor = piece(new THREE.BoxGeometry(width, 0.3, depth), material(world.studio_floor || "#9a9894", { roughness: 1 }), [x, -0.15, 0]);
  wall.castShadow = false;
  scene.add(wall, floor);
  return { wall, floor };
}
