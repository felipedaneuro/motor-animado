// saga.js do estilo saga-64: o mundo de jogo (plataformas de fase, montanhas, estrelas, trilha com moedas).
// O cérebro e o coração vêm do motor (anatomia.js) e seguem exportados daqui para os vídeos já escritos.
import * as THREE from "three";
import { seeded } from "../motor/nucleo.js";
import { material, piece } from "../motor/formas.js";
export { detailedBrain, anatomicalHeart, onSurface } from "../motor/anatomia.js";

// ---------- o mundo de jogo ----------
function addPlatform(scene, x, color) {
  const plate = piece(new THREE.CylinderGeometry(3.2, 3.4, 0.3, 6), material(color, { roughness: 0.8 }), [x, -0.15, -0.4]);
  const edge = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.05, 6, 6), new THREE.MeshBasicMaterial({ color: 0x7dff8a, transparent: true, opacity: 0.7 }));
  edge.rotation.x = Math.PI / 2;
  edge.position.set(x, 0.02, -0.4);
  scene.add(plate, edge);
  return edge;
}

export function gameWorld(scene, stations, { x0 = -40, x1 = 80 } = {}) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 + 120, 160), material(0x1a1438, { roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set((x0 + x1) / 2, -0.3, 0);
  floor.receiveShadow = true;
  scene.add(floor);
  const colors = [0x2a6a8a, 0x5a3a8a, 0x2a7a6a, 0x8a5a2a, 0x3a4a9a, 0x7a2a5a, 0x2a8a4a, 0x6a6a2a];
  const edges = stations.map((x, k) => addPlatform(scene, x, colors[k % colors.length]));
  for (let k = 0; k < 30; k++) {                                                   // montanhas ao longe
    const h = 6 + seeded(k + 900) * 12;
    scene.add(piece(new THREE.ConeGeometry(4 + seeded(k + 901) * 5, h, 5), material(0x1c1640, { roughness: 1 }), [x0 + seeded(k + 902) * (x1 - x0), h / 2 - 0.3, -30 - seeded(k + 903) * 20]));
  }
  const points = [];
  for (let k = 0; k < 600; k++) points.push(x0 + seeded(k + 950) * (x1 - x0 + 60) - 30, 8 + seeded(k + 951) * 40, -60 - seeded(k + 952) * 40);
  const stars = new THREE.BufferGeometry();
  stars.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  scene.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, fog: false })));
  const trail = gameTrail(scene, stations);
  return (t) => {
    edges.forEach((edge, k) => (edge.material.opacity = 0.45 + 0.35 * Math.sin(t * 2 + k)));
    trail(t);
  };
}

// a trilha do mapa de jogo ligando as fases: ladrilhos que acendem em onda e moedas girando (a câmera nunca voa sobre o vazio)
function gameTrail(scene, stations) {
  const from = Math.min(...stations) - 3, to = Math.max(...stations) + 3, tiles = [], coins = [];
  const tile = new THREE.CylinderGeometry(0.34, 0.34, 0.05, 6), coin = new THREE.OctahedronGeometry(0.22, 0);
  for (let x = from; x <= to; x += 0.9) {
    if (stations.some((s) => Math.abs(x - s) < 3.5)) continue;
    const mesh = new THREE.Mesh(tile, new THREE.MeshBasicMaterial({ color: 0x7dff8a, transparent: true, opacity: 0.5 }));
    mesh.position.set(x, -0.26, 1.0 + 0.5 * Math.sin(x * 0.45));
    scene.add(mesh);
    tiles.push(mesh);
    if (tiles.length % 2 === 0) {                                   // moedas na altura da câmera
      const gem = piece(coin, material(0xffd21f, { emissive: 0x806000, emissiveIntensity: 0.6, roughness: 0.3 }), [x, 1.6, mesh.position.z]);
      scene.add(gem);
      coins.push(gem);
    }
  }
  return (t) => {
    tiles.forEach((mesh) => (mesh.material.opacity = 0.3 + 0.45 * Math.max(0, Math.sin(t * 3 - mesh.position.x * 0.7))));
    coins.forEach((gem, k) => { gem.rotation.y = t * 2 + k; gem.position.y = 1.6 + 0.12 * Math.sin(t * 2.5 + k); });
  };
}
