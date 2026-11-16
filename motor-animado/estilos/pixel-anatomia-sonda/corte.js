// corte.js: as peças da família de corte anatômico em pixel (artéria, camadas de tecido, sonda). Convive com o
// kit.js herdado do pixel-duelo (fundo estrelado, moldura, barra): este arquivo traz o que é próprio daqui.
//
//   vesselCut(cena, style, opcoes)      -> {group, lumen, walls}: vaso em corte vertical, de parede a parede
//   bloodFlow(vaso, opcoes)             -> update(t): as hemácias subindo dentro do lúmen
//   plaque(vaso, {lado, altura, meio})  a placa crescendo por dentro da parede (não boiando no sangue)
//   layeredTissue(cena, style, camadas) -> group: pele e tecidos em faixas horizontais de cor
//   stepLabel(root, style, passos)      -> draw(t): o rótulo amarelo em caixa preta, escrito letra a letra
//
// Tudo é função de t. O corte é vertical porque o vídeo é vertical: o vaso corre de cima a baixo da tela.
import * as THREE from "three";
import { material, piece } from "../motor/formas.js";
import { createTyped } from "../motor/escrita.js";

const tone = (style, i, fallback) => (style.palette || [])[i] || fallback;
const flat = (hex) => new THREE.MeshBasicMaterial({ color: hex });

// ---------- o vaso em corte ----------
// width é a largura do lúmen (o canal); wall é a espessura de cada parede. O corte mostra as duas paredes
// inteiras: deixar o vaso transparente, sem parede, é o erro que a ficha de anatomia manda evitar.
export function vesselCut(scene, style, { width = 1.5, height = 9, wall = 0.55, wallColor, bloodColor } = {}) {
  const group = new THREE.Group();
  const skin = wallColor || tone(style, 0, "#6d1026");
  const blood = bloodColor || tone(style, 4, "#8f304a");
  const lumen = piece(new THREE.PlaneGeometry(width, height), flat(blood), [0, 0, 0.01]);
  group.add(lumen);
  const walls = [];
  for (const side of [-1, 1]) {
    const bar = piece(new THREE.PlaneGeometry(wall, height), flat(skin), [side * (width + wall) / 2, 0, 0.02]);
    const edge = piece(new THREE.PlaneGeometry(wall * 0.18, height), flat("#2a0610"), [side * (width / 2 + wall * 0.09), 0, 0.03]);
    group.add(bar, edge);
    walls.push(bar);
  }
  scene.add(group);
  group.userData = { width, height, wall };
  return { group, lumen, walls };
}

// as hemácias: pontinhos que sobem e voltam ao pé do quadro, todos função de t
export function bloodFlow(vessel, { count = 40, speed = 1.6, hex = "#d8495f", size = 0.11 } = {}) {
  const { width, height } = vessel.group.userData;
  const cells = [];
  for (let k = 0; k < count; k++) {
    const cell = piece(new THREE.PlaneGeometry(size, size), flat(hex), [0, 0, 0.02]);
    vessel.group.add(cell);
    const seed = Math.sin(k * 127.1 + 311.7) * 43758.5453;
    cells.push({ mesh: cell, x: (Math.sin(k * 12.9898) * 0.42) * width, offset: (seed - Math.floor(seed)) * height });
  }
  return function update(t, flow = 1) {
    for (const cell of cells) {
      const y = ((cell.offset + t * speed * flow) % height) - height / 2;
      cell.mesh.position.set(cell.x, y, 0.02);
    }
  };
}

// a placa: cresce de dentro da parede para o lúmen, estreitando o canal
export function plaque(vessel, { side = -1, at = 0, length = 2.2, grow = 0.6, hex = "#e3c35c" } = {}) {
  const { width, wall } = vessel.group.userData;
  const steps = [0.45, 0.8, 1, 0.8, 0.45];                       // mais fina nas pontas: o contorno em degraus do pixel
  const slabs = steps.map((_, i) => {
    const slab = piece(new THREE.PlaneGeometry(1, length / steps.length), flat(hex),
      [0, at + length / 2 - (i + 0.5) * (length / steps.length), 0.025]);
    vessel.group.add(slab);
    return slab;
  });
  return function update(amount = 1) {
    slabs.forEach((slab, i) => {
      const thick = Math.max(0.001, width * grow * amount * steps[i]);
      slab.scale.x = thick;
      slab.position.x = side * (width / 2 - thick / 2 + wall * 0.05);
    });
  };
}

// ---------- tecido em camadas ----------
// camadas: [{nome, cor, altura}] de cima para baixo, como num corte de pele
export function layeredTissue(scene, style, camadas = [], { width = 9, top = 2.5 } = {}) {
  const group = new THREE.Group();
  let y = top;
  for (const camada of camadas) {
    const h = camada.altura ?? 1;
    group.add(piece(new THREE.PlaneGeometry(width, h), flat(camada.cor), [0, y - h / 2, 0]));
    group.add(piece(new THREE.PlaneGeometry(width, h * 0.06), flat("#1b1016"), [0, y - h, 0.01]));
    y -= h;
  }
  scene.add(group);
  return group;
}

// ---------- o rótulo da etapa ----------
// caixa preta com texto amarelo no canto de cima, escrita letra a letra. Vem ANTES do movimento que ela nomeia.
export function stepLabel(root, style, passos = [], options = {}) {
  root.style.setProperty("--escrita-fundo", "#0a0a0f");
  root.style.setProperty("--escrita-borda", "#0a0a0f");
  root.style.setProperty("--escrita-cor", "#f2d04a");
  root.style.setProperty("--escrita-tamanho", "40px");
  return createTyped(root, style, passos, { top: 60, left: 50, align: "left", speed: 14, cursor: false, ...options });
}
