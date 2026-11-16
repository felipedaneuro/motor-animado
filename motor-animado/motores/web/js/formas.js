// formas.js: materiais e peças prontas. O palco liga ou desliga o sombreado facetado (low-poly) pelo estilo.
import * as THREE from "three";

let flatShading = false;
let detailBoost = 0;   // mais divisões nas bolas e tubos: formas mais redondas (estilo retro-64bits)
export const setFlatShading = (value) => { flatShading = value; };
export const setDetailBoost = (value) => { detailBoost = value; };

export const material = (hex, extra = {}) => new THREE.MeshStandardMaterial({ color: hex, flatShading, roughness: 0.65, ...extra });
// brilho que soma luz (néon, vapor, aura)
export const glow = (hex, opacity = 0.6) =>
  new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });

export function piece(geometry, mat, position = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(...position);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
export const box = (w, h, d, hex, position, extra) => piece(new THREE.BoxGeometry(w, h, d), material(hex, extra), position);
export const ball = (radius, hex, position, extra, detail = 1) => piece(new THREE.IcosahedronGeometry(radius, detail + detailBoost), material(hex, extra), position);
export const tube = (r0, r1, h, hex, position, extra, sides = 14) => piece(new THREE.CylinderGeometry(r0, r1, h, sides * (1 + detailBoost)), material(hex, extra), position);
export const rainbow = (hue, saturation = 0.85, lightness = 0.58) => new THREE.Color().setHSL(((hue % 1) + 1) % 1, saturation, lightness);

// liga/desliga o brilho de tudo dentro de obj (um destaque piscando, uma peça que "acende")
export function lightUp(obj, hex, strength) {
  obj.traverse((child) => {
    if (!child.isMesh || !child.material.emissive) return;
    child.material.emissive.setHex(strength > 0 ? hex : 0);
    child.material.emissiveIntensity = strength;
  });
}

// um cilindro entre dois pontos (ligações, varetas, fios grossos)
export function link(from, to, radius, mat) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const mesh = piece(new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 8), mat);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return mesh;
}
