// vetor.js: as peças do estilo vetorial chapado. Sem textura, sem sombra, sem pixel: o que separa as formas é só
// a cor, então duas peças vizinhas nunca podem ter tons parecidos.
//
//   dottedBackdrop(cena, style)                  o fundo escuro com a grade de pontinhos
//   headProfile(cena, style, opcoes)             -> {group, brain, points}: a silhueta de perfil com o cérebro
//   doseRings(cena, style, opcoes)               -> update(t, 0..1): os anéis de dose, de azul a vermelho
//   rayBurst(cena, style, opcoes)                -> update(t, 0..1): os raios convergindo no alvo
//   darkTags(root, style, itens)                 -> draw(t, camera): rótulos em caixa escura com linha de chamada
import * as THREE from "three";
import { piece } from "../motor/formas.js";
import { createCallouts } from "./callout.js";

const flat = (hex, opacity = 1) => new THREE.MeshBasicMaterial({ color: hex, transparent: opacity < 1, opacity });
const tone = (style, i, fallback) => (style.palette || [])[i] || fallback;

export function dottedBackdrop(scene, style, { size = 30, step = 0.5 } = {}) {
  const group = new THREE.Group();
  group.add(piece(new THREE.PlaneGeometry(size * 2, size * 2), flat(tone(style, 0, "#0a1526")), [0, 0, -6]));
  const dots = [];
  for (let x = -size / 2; x < size / 2; x += step) for (let y = -size / 2; y < size / 2; y += step) dots.push([x, y]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(dots.flatMap(([x, y]) => [x, y, -5.8]), 3));
  group.add(new THREE.Points(geometry, new THREE.PointsMaterial({ color: tone(style, 4, "#335567"), size: 0.05 })));
  scene.add(group);
  return group;
}

// a silhueta: cabeça de perfil em cor cheia, com o cérebro por dentro. Serve de mapa, não de personagem.
export function headProfile(scene, style, { scale = 1, skin, brainColor } = {}) {
  const group = new THREE.Group();
  const corpo = flat(skin || tone(style, 4, "#335567"));
  // o contorno de um perfil olhando para a direita: nuca, testa, nariz, boca, queixo, pescoço e ombro
  const perfil = new THREE.Shape();
  perfil.moveTo(-1.15, 0.2);
  perfil.bezierCurveTo(-1.25, 1.5, -0.4, 2.1, 0.35, 1.95);
  perfil.bezierCurveTo(0.85, 1.85, 1.0, 1.5, 1.02, 1.15);
  perfil.lineTo(1.3, 0.72);                                  // o nariz
  perfil.lineTo(0.98, 0.6);
  perfil.lineTo(1.02, 0.34);
  perfil.lineTo(0.78, 0.26);                                 // a boca
  perfil.lineTo(0.92, 0.0);
  perfil.bezierCurveTo(0.8, -0.35, 0.4, -0.5, 0.3, -0.62);   // o queixo
  perfil.lineTo(0.34, -1.35);                                // o pescoço
  perfil.lineTo(1.7, -1.8);                                  // o ombro
  perfil.lineTo(1.7, -2.6);
  perfil.lineTo(-1.9, -2.6);
  perfil.lineTo(-1.6, -1.7);
  perfil.bezierCurveTo(-1.2, -1.2, -1.2, -0.6, -1.15, 0.2);
  group.add(new THREE.Mesh(new THREE.ShapeGeometry(perfil), corpo));
  const brain = piece(new THREE.CircleGeometry(0.72, 40), flat(brainColor || tone(style, 6, "#ce7c82")), [-0.12, 1.12, 0.01]);
  brain.scale.set(1.08, 0.9, 1);
  group.add(brain);
  group.add(piece(new THREE.PlaneGeometry(0.3, 1.6), flat(tone(style, 7, "#b94962")), [0.05, -0.1, 0.02]));   // o tronco
  group.scale.setScalar(scale);
  scene.add(group);
  return { group, brain, alvo: new THREE.Vector3(-0.12, 1.12, 0.05).multiplyScalar(scale) };
}

// os anéis de dose: do azul frio na borda ao vermelho no centro, crescendo com `amount`
export function doseRings(scene, style, { at = [0, 0, 0], radius = 1.2, rings = 5 } = {}) {
  const cores = ["#2b4fd6", "#2d9fe0", "#45c37a", "#e8c53c", "#d8402f"];
  const group = new THREE.Group();
  group.position.set(...at);
  const discs = cores.slice(0, rings).map((cor, i) => {
    const disc = piece(new THREE.CircleGeometry(1, 48), flat(cor), [0, 0, 0.02 + i * 0.01]);
    group.add(disc);
    return disc;
  });
  scene.add(group);
  return function update(t, amount = 1) {
    const k = Math.max(0, Math.min(1, amount));
    discs.forEach((disc, i) => {
      const fora = radius * (1 - i / discs.length);
      disc.scale.setScalar(Math.max(0.001, fora * k));
    });
  };
}

// os raios: linhas finas que convergem no alvo, vindas de todos os lados
export function rayBurst(scene, style, { at = [0, 0, 0], count = 26, length = 4, hex = "#f2d04a" } = {}) {
  const group = new THREE.Group();
  group.position.set(...at);
  const rays = [];
  for (let k = 0; k < count; k++) {
    const angle = (k / count) * Math.PI * 2;
    const ray = piece(new THREE.PlaneGeometry(0.04, length), flat(hex, 0.7), [0, length / 2, 0.01]);
    const braco = new THREE.Group();                       // o braço gira; o raio sai do centro para fora
    braco.rotation.z = angle;
    braco.add(ray);
    group.add(braco);
    rays.push(braco);
  }
  scene.add(group);
  return function update(t, amount = 1) {
    group.visible = amount > 0.01;
    group.rotation.z = t * 0.08;
    rays.forEach((braco, i) => { braco.scale.y = Math.max(0.001, amount * (0.85 + 0.15 * Math.sin(t * 3 + i))); });
  };
}

// os rótulos deste estilo são iguais aos do atlas, mas em caixa escura
export function darkTags(root, style, itens = []) {
  root.style.setProperty("--callout-fundo", "#0c1826");
  root.style.setProperty("--callout-cor", "#e7f0fa");
  root.style.setProperty("--callout-linha", "#9fb6c9");
  return createCallouts(root, style, itens);
}
