// anatomia.js: órgãos prontos para vídeos de corpo e saúde, usados por vários estilos (saga-64, jarvis-hud).
//   detailedBrain: cérebro com giros, sulcos, cerebelo, tronco, árvore de artérias e uma região que escurece sem sangue
//   anatomicalHeart: coração com ventrículos, átrios, aorta, pulmonar, veia cava, coronárias e contorno escuro
//   brainGeometry, onSurface, TREE, RADII: as peças, para quem quer desenhar o cérebro de outro jeito (holograma)
import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { material, piece, tube } from "./formas.js";

const smoothstep = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

// ---------- o cérebro detalhado ----------
export const RADII = [1.25, 0.95, 0.95];
// cores em sRGB (setStyle converte para o espaço linear do three.js): rosa do córtex e o roxo escuro do tecido sem sangue
const PINK = new THREE.Color("#e8968f"), DAMAGE = new THREE.Color("#3a0c46");   // o roxo da área de infarto

function foldHeight(v, f = 1) {   // giros e sulcos: cristas onde o padrão passa por zero (f < 1: lobos maiores)
  v = v.clone().multiplyScalar(f);
  const g = Math.sin(9 * v.x + 3 * Math.sin(7 * v.y)) * Math.sin(8 * v.y + 3 * Math.sin(6 * v.z)) * Math.sin(7 * v.z + 3 * Math.sin(8 * v.x));
  return Math.pow(1 - Math.abs(g), 3);
}

// amplitude: altura das dobras; frequency: < 1 deixa os lobos maiores (mascote); detail: divisões por aresta
// (48: ~23 mil vértices, giros visíveis; 20 a 24: poucas facetas grandes, bom para low-poly)
export function brainGeometry({ amplitude = 0.07, frequency = 1, detail = 48 } = {}) {
  const raw = new THREE.IcosahedronGeometry(1, detail);
  raw.deleteAttribute("normal");
  raw.deleteAttribute("uv");
  const geometry = mergeVertices(raw, 1e-5);                                        // vértices únicos: sombreado suave nas dobras
  const positions = geometry.attributes.position, v = new THREE.Vector3();
  const base = new Float32Array(positions.count * 3), ridge = new Float32Array(positions.count);
  for (let i = 0; i < positions.count; i++) {
    v.fromBufferAttribute(positions, i).normalize();
    const fold = foldHeight(v, frequency), fissure = v.y > 0.1 ? Math.max(0, 1 - Math.abs(v.z) / 0.08) * 0.12 : 0;
    v.multiplyScalar(1 + amplitude * fold - fissure);
    positions.setXYZ(i, v.x * RADII[0], v.y * RADII[1], v.z * RADII[2]);
    ridge[i] = fold;
  }
  geometry.computeVertexNormals();
  const colors = new Float32Array(positions.count * 3);
  for (let i = 0; i < positions.count; i++) {
    const shade = 0.68 + 0.32 * ridge[i];                                            // os sulcos mais escuros
    base.set([PINK.r * shade, PINK.g * shade, PINK.b * shade], i * 3);
  }
  colors.set(base);
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return { geometry, base };
}

// um ponto na superfície do lado de fora (z > 0), em coordenadas do cérebro
export const onSurface = (x, y, lift = 0.085) => {
  const inside = Math.max(0.02, 1 - (x / RADII[0]) ** 2 - (y / RADII[1]) ** 2);
  return new THREE.Vector3(x, y, RADII[2] * Math.sqrt(inside) + lift);
};

// as artérias são translúcidas (visão de raio X do jogo): o sangue, o coágulo e o cateter aparecem por dentro
export const arteryCurve = (points) => new THREE.CatmullRomCurve3(points.map(([x, y]) => onSurface(x, y)));

function vesselOnSurface(group, points, radius) {
  const curve = arteryCurve(points);
  const mesh = piece(new THREE.TubeGeometry(curve, 40, radius, 10, false), material(0xd01822, { emissive: 0x500008, emissiveIntensity: 0.35, roughness: 0.25, transparent: true, opacity: 0.5, depthWrite: false }));
  group.add(mesh);
  return { curve, mesh };
}

export const TREE = {
  trunk: [[0.05, -0.85], [0.12, -0.5], [0.2, -0.2], [0.28, 0.0]],
  blocked: [[0.28, 0.0], [0.42, 0.22], [0.55, 0.45], [0.62, 0.7]],
  others: [
    [[0.28, 0.0], [0.6, 0.05], [0.95, 0.25]], [[0.28, 0.0], [0.1, 0.3], [-0.2, 0.6]], [[0.28, 0.0], [-0.2, 0.1], [-0.7, 0.25]],
    [[0.2, -0.2], [0.6, -0.35], [0.95, -0.25]], [[0.42, 0.22], [0.75, 0.4], [0.95, 0.55]], [[0.1, 0.3], [0.25, 0.65]],
    [[-0.2, 0.1], [-0.5, -0.2], [-0.9, -0.15]], [[0.6, 0.05], [0.8, -0.1]],
  ],
};

export function detailedBrain(scene, position, scale = 1.6) {
  const group = new THREE.Group();
  const { geometry, base } = brainGeometry();
  const cortex = piece(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0 }));
  cortex.userData.keepGeometry = true;   // as cores por vértice mudam a cada quadro (setDamage)
  const cerebellum = piece(new THREE.SphereGeometry(0.5, 24, 16), material(0xb07a6a, { roughness: 0.7 }), [-0.75, -0.75, 0.05]);
  cerebellum.scale.set(1.1, 0.55, 1.2);
  group.add(cortex, cerebellum, tube(0.17, 0.13, 0.9, 0xd8b090, [-0.25, -1.2, 0], {}, 16));
  const trunk = vesselOnSurface(group, TREE.trunk, 0.055), blocked = vesselOnSurface(group, TREE.blocked, 0.04);
  TREE.others.forEach((points) => vesselOnSurface(group, points, 0.028));
  group.position.set(...position);
  group.scale.setScalar(scale);
  scene.add(group);
  const colors = geometry.attributes.color, positions = geometry.attributes.position, v = new THREE.Vector3();
  const territory = onSurface(0.55, 0.45, 0);
  const world = (local) => group.localToWorld(local.clone());
  // damage de 0 a 1: só a região atrás do coágulo escurece (miolo cheio e borda curta) (o tecido sem oxigênio), como na ilustração de referência
  function setDamage(amount) {
    for (let i = 0; i < positions.count; i++) {
      v.fromBufferAttribute(positions, i);
      const edge = 0.04 * Math.sin(11 * v.x + 7 * v.y) * Math.sin(9 * v.z + 5 * v.x);         // borda irregular, não um círculo
      const near = (1 - smoothstep(0.4, 0.5, v.distanceTo(territory) + edge)) * (v.z > 0 ? 0.95 : 0) * amount;
      colors.setXYZ(i, base[i * 3] + (DAMAGE.r - base[i * 3]) * near, base[i * 3 + 1] + (DAMAGE.g - base[i * 3 + 1]) * near, base[i * 3 + 2] + (DAMAGE.b - base[i * 3 + 2]) * near);
    }
    colors.needsUpdate = true;
  }
  return { group, cortex, trunk, blocked, world, setDamage, stuckLocal: blocked.curve.getPointAt(0.3) };
}

// ---------- o coração anatômico (ventrículos com a ponta para a esquerda do corpo, átrios, aorta, pulmonar, veia cava,
// coronárias por cima e um contorno escuro de pixel art) ----------
const HEART = { body: "#b8323a", atrium: "#a02a36", aorta: "#e0484a", pulmonary: "#c8607a", cava: "#6a4a8a", coronary: "#f07a72", vein: "#8a4a9a", outline: "#3a0a14" };
const VENTRICLE = [0.71, 0.86, 0.6];

function ventricleGeometry() {
  const geometry = new THREE.SphereGeometry(1, 36, 24), positions = geometry.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < positions.count; i++) {
    v.fromBufferAttribute(positions, i);
    const taper = v.y < 0 ? 1 + 0.55 * v.y : 1;                                       // a ponta (ápice) afinando
    positions.setXYZ(i, v.x * VENTRICLE[0] * taper, v.y * VENTRICLE[1], v.z * VENTRICLE[2] * taper);
  }
  geometry.computeVertexNormals();
  return geometry;
}

// um ponto na frente dos ventrículos, com u e v de -1 a 1
function ventricleFront(u, v, lift = 0.012) {
  const taper = v < 0 ? 1 + 0.55 * v : 1, w = Math.sqrt(Math.max(0.02, 1 - u * u - v * v));
  return new THREE.Vector3(u * VENTRICLE[0] * taper, v * VENTRICLE[1], w * VENTRICLE[2] * taper + lift);
}

function outlined(group, geometry, color, position, scale = 1.05) {
  const mesh = piece(geometry, material(color, { roughness: 0.5, emissive: 0x300008, emissiveIntensity: 0.25 }), position);
  const rim = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: HEART.outline, side: THREE.BackSide }));
  rim.position.copy(mesh.position);
  rim.scale.setScalar(scale);
  group.add(mesh, rim);
  return mesh;
}

function heartVessel(group, points, radius, color, outline = true) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => (p.isVector3 ? p : new THREE.Vector3(...p))));
  const geometry = new THREE.TubeGeometry(curve, 32, radius, 10, false);
  group.add(piece(geometry, material(color, { roughness: 0.4, emissive: 0x300008, emissiveIntensity: 0.2 })));
  if (outline) group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 32, radius * 1.3, 10, false), new THREE.MeshBasicMaterial({ color: HEART.outline, side: THREE.BackSide })));
  return curve;
}

export function anatomicalHeart(scene, position, scale = 1) {
  const group = new THREE.Group(), body = new THREE.Group();
  outlined(body, ventricleGeometry(), HEART.body, [0, 0, 0], 1.04);
  outlined(body, new THREE.SphereGeometry(0.36, 24, 16), HEART.atrium, [-0.5, 0.62, 0.05]);           // átrio direito
  const leftAtrium = outlined(body, new THREE.SphereGeometry(0.32, 24, 16), HEART.atrium, [0.5, 0.66, 0.12]);   // átrio esquerdo
  heartVessel(body, [[-0.42, 0.75, -0.05], [-0.44, 1.15, -0.05], [-0.44, 1.45, -0.05]], 0.11, HEART.cava);   // veia cava
  heartVessel(body, [[0.02, 0.62, 0.05], [0.0, 1.1, 0.05], [0.25, 1.42, -0.05], [0.58, 1.28, -0.15], [0.7, 0.95, -0.25]], 0.14, HEART.aorta);
  for (const [x, h] of [[0.08, 0.32], [0.26, 0.36], [0.44, 0.3]]) heartVessel(body, [[x, 1.3, -0.04], [x + 0.02, 1.3 + h, -0.04]], 0.045, HEART.aorta);
  heartVessel(body, [[0.22, 0.55, 0.35], [0.3, 0.92, 0.32], [0.05, 1.12, 0.3], [-0.2, 1.08, 0.28]], 0.1, HEART.pulmonary);
  heartVessel(body, [[0.3, 0.92, 0.32], [0.62, 1.05, 0.25]], 0.075, HEART.pulmonary);
  heartVessel(body, [ventricleFront(0.05, 0.75), ventricleFront(0.18, 0.2), ventricleFront(0.3, -0.4), ventricleFront(0.3, -0.85)], 0.026, HEART.coronary, false);
  heartVessel(body, [ventricleFront(-0.5, 0.65), ventricleFront(-0.7, 0.1), ventricleFront(-0.62, -0.45)], 0.024, HEART.coronary, false);
  heartVessel(body, [ventricleFront(0.18, 0.2), ventricleFront(-0.15, -0.1), ventricleFront(-0.25, -0.5)], 0.018, HEART.coronary, false);
  heartVessel(body, [ventricleFront(0.5, -0.1), ventricleFront(0.6, -0.35), ventricleFront(0.48, -0.6)], 0.02, HEART.vein, false);
  body.rotation.z = 0.3;                                                                   // a ponta vai para a esquerda do corpo
  group.add(body);
  group.position.set(...position);
  group.scale.setScalar(scale);
  scene.add(group);
  return { group, body, leftAtrium: () => leftAtrium.getWorldPosition(new THREE.Vector3()) };
}
