// holo.js do estilo jarvis-hud: o 3D em holograma (borda que brilha, linhas, nuvem de partículas) e o laboratório escuro.
//   holo(cor)                 material de holograma: transparente, brilho na borda (fresnel), soma luz
//   holoify(objeto, cor)      troca os materiais de um objeto pronto (boneco, coração) por holograma, com linhas nas quinas
//   pointCloud(geometria)     a nuvem de partículas sobre a superfície (como a nuvem da referência)
//   holoBrain / holoHeart     o cérebro e o coração do motor (anatomia.js) em holograma
//   labWorld(cena, estações)  chão com grade, pedestais com anel e poeira no ar
import * as THREE from "three";
import { seeded } from "../motor/nucleo.js";
import { brainGeometry, onSurface, arteryCurve, TREE, anatomicalHeart } from "../motor/anatomia.js";

export const BLUE = 0x4aa8ff, CYAN = 0x9fe6ff, LIME = 0xc6ff3d, ALERT = 0xff4a3a;

const VERTEX = `varying vec3 vN; varying vec3 vV;
void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv; }`;
const FRAGMENT = `uniform vec3 tint; uniform float opacity, rim, base;
varying vec3 vN; varying vec3 vV;
void main() { float edge = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), rim);
  gl_FragColor = vec4(tint * (base + edge * 1.6), clamp(base + edge, 0.0, 1.0) * opacity);
  #include <colorspace_fragment>
}`;

export function holo(color, { opacity = 0.9, rim = 2.2, base = 0.1 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { tint: { value: new THREE.Color(color) }, opacity: { value: opacity }, rim: { value: rim }, base: { value: base } },
    vertexShader: VERTEX, fragmentShader: FRAGMENT, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
}

export const glowLine = (color, opacity = 0.55) =>
  new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });

// troca tudo por holograma; malhas com userData.keepMaterial ficam como estão (o coágulo vermelho, por exemplo)
export function holoify(object, color = BLUE, { edges = true, opacity = 0.9 } = {}) {
  const meshes = [];
  object.traverse((child) => { if (child.isMesh && !child.userData.keepMaterial) meshes.push(child); });
  for (const mesh of meshes) {
    if (mesh.material.side === THREE.BackSide) { mesh.visible = false; continue; }   // contornos de pixel art não servem aqui
    mesh.material = holo(color, { opacity });
    mesh.castShadow = mesh.receiveShadow = false;
    if (edges) mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 35), glowLine(color, 0.45)));
  }
  return object;
}

export function pointCloud(geometry, color = CYAN, { step = 1, size = 2.2, opacity = 0.85 } = {}) {
  const source = geometry.attributes.position, points = [], colors = [];
  const tint = new THREE.Color(color);
  for (let i = 0; i < source.count; i += step) {
    points.push(source.getX(i), source.getY(i), source.getZ(i));
    colors.push(tint.r, tint.g, tint.b);
  }
  const cloud = new THREE.BufferGeometry();
  cloud.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  cloud.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return new THREE.Points(cloud, new THREE.PointsMaterial({ size, sizeAttenuation: false, vertexColors: true, transparent: true,
    opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
}

function arteryTube(group, points, radius, color = CYAN) {
  const curve = arteryCurve(points);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, radius, 10, false), holo(color, { opacity: 0.85, rim: 1.6, base: 0.14 }));
  group.add(mesh);
  return { curve, mesh };
}

// o cérebro em holograma: casca com brilho na borda, nuvem de partículas (a área sem sangue fica vermelha) e as artérias
export function holoBrain(scene, position, scale = 1.6) {
  const group = new THREE.Group(), { geometry } = brainGeometry();
  const dots = pointCloud(geometry, CYAN, { step: 2, size: 3.2 });
  group.add(new THREE.Mesh(geometry, holo(BLUE, { opacity: 0.45, rim: 3.0, base: 0.02 })), dots);
  const cerebellum = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 20), holo(BLUE, { opacity: 0.7 }));
  cerebellum.position.set(-0.75, -0.75, 0.05);
  cerebellum.scale.set(1.1, 0.55, 1.2);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.9, 20, 1, true), holo(BLUE, { opacity: 0.7 }));
  stem.position.set(-0.25, -1.2, 0);
  group.add(cerebellum, stem);
  const trunk = arteryTube(group, TREE.trunk, 0.05), blocked = arteryTube(group, TREE.blocked, 0.036);
  TREE.others.forEach((points) => arteryTube(group, points, 0.024));
  group.position.set(...position);
  group.scale.setScalar(scale);
  scene.add(group);
  const territory = onSurface(0.55, 0.45, 0), patch = redGlow(territory);
  group.add(patch);
  const paint = damageOf(dots, territory);
  const setDamage = (amount) => { paint(amount); patch.material.opacity = 0.85 * amount; };
  return { group, trunk, blocked, setDamage, world: (local) => group.localToWorld(local.clone()), stuckLocal: blocked.curve.getPointAt(0.3) };
}

// um brilho vermelho macio sobre a área sem sangue (a nuvem de trás não apaga o alerta)
function redGlow(position) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d"), fill = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  fill.addColorStop(0, "rgba(255,90,70,1)");
  fill.addColorStop(0.55, "rgba(255,60,50,0.45)");
  fill.addColorStop(1, "rgba(255,40,40,0)");
  context.fillStyle = fill;
  context.fillRect(0, 0, 128, 128);
  const patch = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending }));
  patch.position.copy(position).multiplyScalar(1.02);
  patch.scale.setScalar(1.05);
  return patch;
}

// damage de 0 a 1: as partículas atrás do coágulo ficam vermelhas (o tecido sem oxigênio)
function damageOf(dots, territory) {
  const positions = dots.geometry.attributes.position, colors = dots.geometry.attributes.color, v = new THREE.Vector3();
  const healthy = new THREE.Color(CYAN), hurt = new THREE.Color(ALERT), mixed = new THREE.Color();
  return function setDamage(amount) {
    for (let i = 0; i < positions.count; i++) {
      v.fromBufferAttribute(positions, i);
      const near = v.z > 0 ? Math.max(0, Math.min(1, (0.55 - v.distanceTo(territory)) / 0.12)) : 0;
      mixed.copy(healthy).lerp(hurt, near * amount);
      colors.setXYZ(i, mixed.r, mixed.g, mixed.b);
    }
    colors.needsUpdate = true;
  };
}

export function holoHeart(scene, position, scale = 1) {
  const heart = anatomicalHeart(scene, position, scale);
  holoify(heart.body, BLUE);
  return heart;
}

// o laboratório: chão escuro com grade, um pedestal com anel em cada estação e poeira brilhando no ar
export function labWorld(scene, stations) {
  const grid = new THREE.GridHelper(260, 260, 0x1e4a86, 0x12305c);
  grid.position.y = 0.001;
  grid.material.transparent = true;
  grid.material.opacity = 0.55;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 200), new THREE.MeshBasicMaterial({ color: 0x081631 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor, grid);
  const rings = stations.map((x) => pedestal(scene, x));
  const dust = airDust(scene, Math.min(...stations) - 20, Math.max(...stations) + 20);
  return (t) => {
    rings.forEach((ring, k) => { ring.material.opacity = 0.5 + 0.25 * Math.sin(t * 1.6 + k); ring.rotation.z = t * 0.2; });
    dust.rotation.y = 0.02 * Math.sin(t * 0.3);
    dust.position.y = 0.15 * Math.sin(t * 0.4);
  };
}

function pedestal(scene, x) {
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.0, 64), new THREE.MeshBasicMaterial({ color: CYAN, transparent: true,
    opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.01, 0);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.9, 64), new THREE.MeshBasicMaterial({ color: BLUE, transparent: true,
    opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(x, 0.005, 0);
  scene.add(ring, pool);
  return ring;
}

function airDust(scene, x0, x1) {
  const points = [];
  for (let k = 0; k < 2400; k++) points.push(x0 + seeded(k + 3100) * (x1 - x0), seeded(k + 3101) * 7, -14 + seeded(k + 3102) * 18);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  const dust = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0x6fb6ff, size: 1.6, sizeAttenuation: false,
    transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);
  return dust;
}
