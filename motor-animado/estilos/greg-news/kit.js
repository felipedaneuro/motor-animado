// kit.js do estilo greg-news: o estúdio fixo de telejornal-paródia — a parede de arcos dourados, a bancada de
// madeira e o apresentador em busto de pixel, de blazer ciano. Cores medidas por pixel na decupagem real
// (3 trechos de 15 s, ver pesquisa.md); um só cenário (uma "estação"): o que muda de vídeo pra vídeo são os CARDS, não o mundo.
import * as THREE from "three";
import { seeded } from "../motor/nucleo.js";
import { box, ball } from "../motor/formas.js";
import { bustPlane } from "../motor/busto.js";

// a parede ao fundo: colinas/arcos dourados ondulados sobre o azul-marinho bem escuro (estilo.json "stage"),
// aproximação em formas simples (meias-esferas) do desenho gráfico medido — ver tomadas/tomada02-meio.jpg pro
// desenho real (não replicado traço a traço: é o [OLHAR] da receita.md, seção 3)
export function arcoDourado(scene, { count = 7, color = 0xd1a13a, spacing = 1.9, z = -10 } = {}) {
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const radius = 1.1 + seeded(i + 1) * 1.0, x = (i - count / 2) * spacing, y = 0.4 + seeded(i + 2) * 0.6;
    group.add(ball(radius, color, [x, y, z + seeded(i + 3) * 1.5], { roughness: 0.4, metalness: 0.15 }, 1));
  }
  scene.add(group);
  return group;
}

// a bancada do apresentador: madeira (cor medida), tarja frontal discreta (onde pode entrar o nome do tema do dia)
export function bancada(scene, { width = 2.6, height = 1.1, color = 0x654530, tarja = 0x3a271a, position = [0, 0, 0.6] } = {}) {
  const group = new THREE.Group();
  group.add(box(width, height, 0.7, color, [0, height / 2, 0]));
  group.add(box(width - 0.15, 0.2, 0.03, tarja, [0, height * 0.42, 0.37]));
  group.position.set(...position);
  scene.add(group);
  return group;
}

// o apresentador: o **busto em pixel** do motor (`motor/busto.js`), o mesmo retrato de caixa de diálogo dos estilos
// retrô — não mais o boneco plano da v1. Entra como um plano na cena, atrás da bancada; a câmera deste estilo é
// frontal e quase parada, então o retrato não precisa girar. As cores saem do `estilo.json` → `bust` (o blazer
// ciano medido por pixel na decupagem), e a pessoa troca pele, cabelo, corte e roupa em Estilo → Personalizar.
// Devolve o mesmo que `bustPlane` mais `setPose` e `faceCamera`, para uma cena escrita na v1 não quebrar.
// altura 1,0 e y 1,6: o retrato fica com a cabeça e os ombros de blazer acima do tampo da bancada (y = 1,1),
// que entra como uma faixa escura na base do quadro. Medido no mapa, não no olho.
export function ancora(scene, style, { altura = 1.0, y = 1.6, z = 0 } = {}) {
  const busto = bustPlane(scene, style, { height: altura, y });
  busto.group.position.x = 0;
  busto.group.position.z = z;
  return { ...busto, setPose: (pose) => busto.pose(pose), faceCamera() {} };
}

export { bustPlane, bustCorner, dialogPortrait, bustTexture } from "../motor/busto.js";
