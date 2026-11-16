// kit.js da família pixel-duelo: a fórmula de dois painéis lado a lado, cada um com a sua moldura de néon, a sua
// barra de estado embaixo e o título A × B no alto, sobre um fundo escuro com estrelas. A câmera fica parada de
// frente (a referência mede 98% de tempo sem movimento): quem se mexe é o conteúdo dentro de cada painel.
//
//   starfield(cena, style)                       o fundo de estrelas
//   duelStage(cena, style)                       -> {left, right, panels, focus(lado, quanto)}
//   stateBar(painel, style, {label, color})      -> {group, set(valor 0..1)}: a barra embaixo do painel
//   divider(cena, style)                         o × entre os dois painéis
//   duelText(root, style, falas)                 -> draw(t): a caixa de texto que se escreve, abaixo do título
//
// A fórmula tem dois planos, e só dois: o **par** (os dois painéis) e o **close** (um lado ocupando a tela).
// `focus("left" | "right" | null, 0..1)` faz a passagem de um para o outro sem mexer na câmera, que fica parada.
// As cores saem da paleta medida (style.palette); dá para passar outra por opção.
import * as THREE from "three";
import { material, piece } from "../motor/formas.js";
import { createTyped } from "../motor/escrita.js";

export const PANEL = { width: 2.5, height: 5.0, gap: 0.35, z: 0, cameraZ: 15 };   // com a câmera parada em [0, 0, cameraZ]

const tone = (style, index, fallback) => (style.palette || [])[index] || fallback;

// o chão, na cor mais escura da paleta medida: a fórmula do duelo não usa, mas os estilos que se apoiam neste sim
export function ground(scene, style, { size = 200, hex } = {}) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material(hex ?? tone(style, 0, "#555555"), { roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  return floor;
}

// ---------- o fundo ----------
export function starfield(scene, style, { count = 90, spread = 9, hex } = {}) {
  const group = new THREE.Group(), color = hex || "#dfe4ff";
  const back = piece(new THREE.PlaneGeometry(spread * 2, spread * 2), material(tone(style, 0, "#090c1f"), { roughness: 1 }), [0, 0, -3]);
  group.add(back);
  for (let k = 0; k < count; k++) {
    const x = Math.sin(k * 12.9898) * spread, y = Math.sin(k * 78.233) * spread * 0.8;
    const size = 0.05 + 0.04 * Math.abs(Math.sin(k * 3.1));
    group.add(piece(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ color }), [x, y, -2.8]));
  }
  scene.add(group);
  return group;
}

// ---------- a moldura de um painel ----------
function frame(style, hex) {
  const group = new THREE.Group(), thickness = 0.1, { width, height } = PANEL;
  const mat = new THREE.MeshBasicMaterial({ color: hex });
  const bar = (w, h, x, y) => group.add(new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat).translateX(x).translateY(y));
  bar(width, thickness, 0, height / 2);
  bar(width, thickness, 0, -height / 2);
  bar(thickness, height, -width / 2, 0);
  bar(thickness, height, width / 2, 0);
  group.add(piece(new THREE.PlaneGeometry(width, height), material(tone(style, 1, "#161033"), { roughness: 1 }), [0, 0, -0.05]));
  return group;
}

// ---------- os dois painéis ----------
export function duelStage(scene, style, { leftColor, rightColor } = {}) {
  const left = new THREE.Group(), right = new THREE.Group(), panels = new THREE.Group();
  const step = PANEL.width / 2 + PANEL.gap / 2;
  const colors = [leftColor || tone(style, 3, "#ff4d6d"), rightColor || tone(style, 2, "#4f66a6")];
  const home = [-step, step];
  [left, right].forEach((side, k) => {
    side.position.set(home[k], 0.4, PANEL.z);
    side.add(frame(style, colors[k]));
    panels.add(side);
  });
  scene.add(panels);
  // o close: o painel escolhido vai para o meio e cresca até quase a largura da tela; o outro sai pelo lado.
  // quanto = 0 é o par; quanto = 1 é o close. Nada disso mexe na câmera.
  const CLOSE_SCALE = 1.7;
  function focus(which, amount = 1) {
    const k = Math.max(0, Math.min(1, amount));
    [left, right].forEach((side, i) => {
      const chosen = which === (i === 0 ? "left" : "right");
      const away = (home[i] < 0 ? -1 : 1) * (PANEL.width * CLOSE_SCALE);
      side.position.x = which ? home[i] + (chosen ? -home[i] : away - home[i]) * k : home[i];
      side.scale.setScalar(which && chosen ? 1 + (CLOSE_SCALE - 1) * k : 1);
      side.visible = !(which && !chosen && k > 0.98);
    });
  }
  focus(null, 0);
  return { left, right, panels, colors, focus, size: { width: PANEL.width, height: PANEL.height } };
}

// a caixa de texto do estilo: logo abaixo do título, com a frase se escrevendo letra a letra
export function duelText(root, style, falas = [], options = {}) {
  root.style.setProperty("--escrita-fundo", "rgba(8, 10, 24, 0.9)");
  root.style.setProperty("--escrita-borda", tone(style, 2, "#4f66a6"));
  root.style.setProperty("--escrita-cor", "#e8ecff");
  root.style.setProperty("--escrita-tamanho", "38px");
  return createTyped(root, style, falas, { top: 340, left: 70, width: 940, align: "center", speed: 12, ...options });
}

// ---------- a barra de estado embaixo de cada painel ----------
export function stateBar(panel, style, { color = "#ffd21f", width = PANEL.width * 0.72, height = 0.26 } = {}) {
  const group = new THREE.Group();
  group.position.set(0, -PANEL.height / 2 + 0.4, 0.05);
  group.add(piece(new THREE.PlaneGeometry(width, height), material(tone(style, 1, "#1a1436"), { roughness: 1 })));
  const fill = new THREE.Mesh(new THREE.PlaneGeometry(width, height * 0.72), new THREE.MeshBasicMaterial({ color }));
  fill.position.z = 0.02;
  group.add(fill);
  panel.add(group);
  const set = (value) => {
    const amount = Math.max(0, Math.min(1, value));
    fill.scale.x = amount || 0.001;
    fill.position.x = -width / 2 + (width * amount) / 2;
  };
  set(1);
  return { group, set };
}

// ---------- o × entre os dois ----------
export function divider(scene, style, { hex, size = 0.5, y = 3.9 } = {}) {
  const group = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: hex || tone(style, 4, "#e96dc6") });
  for (const angle of [Math.PI / 4, -Math.PI / 4]) {
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(size, size * 0.2), mat);
    bar.rotation.z = angle;
    group.add(bar);
  }
  group.position.set(0, y, 0.1);
  scene.add(group);
  return group;
}
