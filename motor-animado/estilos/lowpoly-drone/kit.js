// kit.js do estilo lowpoly-drone: o mundo do tema (themedWorld: campo ou cidade de dia; "noite" é o visual antigo),
// a molécula "você" com olhinhos e o confete do final.
import * as THREE from "three";
import { seeded } from "../motor/nucleo.js";
import { material, piece, ball, tube, rainbow, link } from "../motor/formas.js";
import { dayWorld, accent } from "../motor/mundo.js";

// ---------- o tema "noite" (o visual antigo): chão, malha neon que ondula, estrelas, bolhas, mandala e enfeites ----------
function addFloorAndGrid(scene, center, width) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, 120), material(0x170d32, { roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.x = center;
  floor.receiveShadow = true;
  scene.add(floor);
  const geometry = new THREE.PlaneGeometry(width, 50, Math.round(width / 2), 25);
  geometry.rotateX(-Math.PI / 2);
  const grid = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xa96bff, wireframe: true, transparent: true, opacity: 0.45 }));
  grid.position.set(center, 0.02, -9);
  scene.add(grid);
  return { grid, rest: Float32Array.from(geometry.attributes.position.array) };
}

function addStars(scene, center) {
  const points = [];
  for (let k = 0; k < 800; k++) {
    const a = seeded(k + 1) * Math.PI * 2, e = 0.06 + seeded(k + 2) * 1.25, radius = 180;
    points.push(center + radius * Math.cos(e) * Math.sin(a), radius * Math.sin(e), radius * Math.cos(e) * Math.cos(a));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, fog: false })));
}

function addBubbles(scene, x0, x1) {
  return [...Array(26)].map((_, k) => {
    const bubble = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 + seeded(k + 30) * 2.6, 2),
      new THREE.MeshBasicMaterial({ color: rainbow(seeded(k + 31)), transparent: true, opacity: 0.3, fog: false }));
    bubble.userData = { x: x0 + seeded(k + 32) * (x1 - x0), y: 10 + seeded(k + 33) * 20, z: -38 - seeded(k + 34) * 28 };
    scene.add(bubble);
    return bubble;
  });
}

function addMandala(scene) {
  const mandala = new THREE.Group(), petals = [];
  for (let ring = 0; ring < 4; ring++) {
    const group = new THREE.Group(), count = 9 + ring * 5, radius = 3.8 + ring * 3;
    for (let q = 0; q < count; q++) {
      const a = (q / count) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.CircleGeometry(0.8 + ring * 0.3, 3),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.45, fog: false, side: THREE.DoubleSide }));
      petal.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0);
      petal.rotation.z = a;
      petal.userData.hue = q / count + ring * 0.25;
      group.add(petal);
      petals.push(petal);
    }
    mandala.add(group);
  }
  scene.add(mandala);
  return { mandala, petals };
}

function addOrnaments(scene, x0, x1) {   // cogumelos e cristais no fundo
  for (let k = 0; k < 40; k++) {
    const x = x0 + seeded(k + 300) * (x1 - x0), z = -4 - seeded(k + 301) * 7, h = 0.5 + seeded(k + 302) * 1.3;
    const hex = rainbow(seeded(k + 303)).getHex();
    if (k % 2) {
      scene.add(tube(0.08 * h, 0.12 * h, h, 0xf2eee4, [x, h / 2, z], {}, 8));
      scene.add(piece(new THREE.SphereGeometry(0.34 * h, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), material(hex, { emissive: hex, emissiveIntensity: 0.35 }), [x, h, z]));
    } else {
      const crystal = piece(new THREE.OctahedronGeometry(0.3 * h, 0), material(hex, { emissive: hex, emissiveIntensity: 0.5 }), [x, 0.5 * h, z]);
      crystal.scale.y = 1.8;
      scene.add(crystal);
    }
  }
}

export function nightWorld(scene, { x0 = -20, x1 = 100 } = {}) {
  const center = (x0 + x1) / 2, width = x1 - x0 + 80;
  const { grid, rest } = addFloorAndGrid(scene, center, width);
  addStars(scene, center);
  const bubbles = addBubbles(scene, x0, x1);
  const { mandala, petals } = addMandala(scene);
  addOrnaments(scene, x0, x1);
  const positions = grid.geometry.attributes.position;
  return function update(t, focus) {
    for (let i = 0; i < positions.count; i++) {
      positions.array[i * 3 + 1] = 0.25 * Math.sin(rest[i * 3] * 0.3 + t * 1.4) * Math.cos(rest[i * 3 + 2] * 0.35 + t);
    }
    positions.needsUpdate = true;
    grid.material.color.copy(rainbow(0.75 + 0.08 * Math.sin(t * 0.4), 0.8, 0.62));
    bubbles.forEach((b, k) => b.position.set(b.userData.x + Math.sin(t * 0.2 + k) * 2, b.userData.y + Math.sin(t * 0.5 + k * 1.7) * 1.2, b.userData.z));
    mandala.position.set(focus.x, 24, -60);
    mandala.children.forEach((g, k) => (g.rotation.z = t * (k % 2 ? -0.12 : 0.09)));
    petals.forEach((p) => p.material.color.copy(rainbow(p.userData.hue + t * 0.05)));
  };
}

// ---------- o mundo do tema: de dia vem do motor (mundo.js); "noite" é o visual antigo, daqui ----------
export function themedWorld(scene, style, range = {}) {
  const scenery = (style.world || {}).scenery;
  return !scenery || scenery === "noite" ? nightWorld(scene, range) : dayWorld(scene, style, range);
}
export { accent };

// ---------- a molécula "você": átomos, ligações e dois olhinhos ----------
// atoms: [[x, y, "C" | "N" | "O" | "H" | "Cl"]], bonds: [[i, j]]
const ATOMS = { C: [0x8f8aa8, 0.11], N: [0x3a7bd5, 0.11], O: [0xe8262b, 0.1], H: [0xf2eee4, 0.07], Cl: [0x5aff6a, 0.12] };
export function molecule(atoms, bonds, { glowHex = 0x6a30c0, eyes = [0, 0] } = {}) {
  const group = new THREE.Group(), body = new THREE.Group(), gaze = new THREE.Group();
  group.add(body, gaze);
  const bondMaterial = material(0xd8cfff, { emissive: glowHex, emissiveIntensity: 0.6 });
  for (const [i, k] of bonds) body.add(link([atoms[i][0], atoms[i][1], 0], [atoms[k][0], atoms[k][1], 0], 0.035, bondMaterial));
  for (const [x, y, element] of atoms) {
    const [hex, radius] = ATOMS[element];
    body.add(ball(radius, hex, [x, y, 0], { emissive: hex, emissiveIntensity: 0.25, roughness: 0.35 }, 1));
  }
  for (const s of [-1, 1]) {
    gaze.add(ball(0.075, 0xffffff, [eyes[0] + s * 0.1, eyes[1], 0.1], { roughness: 0.3 }, 2),
      ball(0.038, 0x15161a, [eyes[0] + s * 0.1, eyes[1], 0.165], { roughness: 0.2 }, 2));
  }
  return { group, body, gaze };
}

// ---------- confete que cai a partir de t0 (posições fixas por sorteio) ----------
export function confetti(scene, center, count = 90) {
  const group = new THREE.Group();
  const pieces = [...Array(count)].map((_, k) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.14), new THREE.MeshBasicMaterial({ color: rainbow(seeded(k + 500)), side: THREE.DoubleSide }));
    p.userData = { x: (seeded(k + 501) - 0.5) * 4, z: (seeded(k + 502) - 0.5) * 2, speed: 0.6 + seeded(k + 503) * 0.8, phase: seeded(k + 504) * 6 };
    group.add(p);
    return p;
  });
  group.position.set(...center);
  scene.add(group);
  return (t, t0) => {
    group.visible = t >= t0;
    pieces.forEach((p) => {
      const d = t - t0, u = p.userData;
      p.position.set(u.x + 0.2 * Math.sin(d * 2 + u.phase), 3.2 - ((d * u.speed) % 3.6), u.z);
      p.rotation.set(d * 3 + u.phase, d * 2, 0);
    });
  };
}
