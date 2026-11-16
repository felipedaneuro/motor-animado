// kit.js do estilo atlas-anatomico: a fórmula do atlas de anatomia. O que o define é a **etiqueta com linha de
// chamada**: um retângulo claro com o nome da estrutura, preso por uma linha fina ao ponto exato dela no modelo 3D.
// O resto é fundo em degradê azul-petróleo, luz suave de estúdio e uma câmera que quase não sai do lugar.
//
//   studioBackdrop(cena, style)                     o fundo em degradê, sem chão nem horizonte
//   createCallouts(root, style, items)              -> draw(t, camera): as etiquetas com linha de chamada
//   turntable(objeto, {speed, from, to})            -> update(t): o giro lento do modelo em cima do próprio eixo
//
// items: [{at, until, text, point, side, dentro}]
//   point:  [x, y, z], ou uma função (t) => [x, y, z] quando a peça se mexe
//   dentro: o objeto 3D em que esse ponto está marcado. Com ele, o ponto é lido nas coordenadas do objeto e segue
//           o modelo quando ele gira; sem ele, o ponto é lido no mundo e fica onde está.
//   side:   "left" ou "right" (de que lado da tela a etiqueta fica; a linha cruza até o ponto)
import * as THREE from "three";
import { material, piece } from "../motor/formas.js";

const CSS = `
.atlas-callout { position: absolute; z-index: 6; pointer-events: none; }
.atlas-callout .caixa { position: absolute; transform: translate(-50%, -50%); background: var(--callout-fundo, #f4f8fb); color: var(--callout-cor, #16222c);
  font-family: Inter, Montserrat, system-ui, sans-serif; font-weight: 600; font-size: 34px; line-height: 1.15;
  padding: 10px 16px; border-radius: 8px; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45); white-space: nowrap; }
.atlas-callout .linha { position: absolute; height: 3px; transform-origin: 0 50%; background: var(--callout-linha, #f4f8fb);
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.5); }
.atlas-callout .ponto { position: absolute; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%;
  border: 3px solid var(--callout-linha, #f4f8fb); background: rgba(244, 248, 251, 0.2); }
`;

// ---------- o fundo ----------
export function studioBackdrop(scene, style, { size = 60 } = {}) {
  const top = (style.palette || [])[0] || "#1c2831", bottom = style.stage?.background_bottom || "#0b1218";
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 256;
  const c = canvas.getContext("2d"), gradient = c.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  c.fillStyle = gradient;
  c.fillRect(0, 0, 4, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(size, size * 1.8),
    new THREE.MeshBasicMaterial({ map: texture, depthWrite: false }));
  wall.position.z = -size / 2;
  wall.renderOrder = -1;
  scene.add(wall);
  return wall;
}

// ---------- as etiquetas com linha de chamada ----------
const at = (point, t) => (typeof point === "function" ? point(t) : point);

function makeCallout(layer, item) {
  const box = document.createElement("div"), line = document.createElement("div"), dot = document.createElement("div");
  box.className = "caixa";
  line.className = "linha";
  dot.className = "ponto";
  box.textContent = item.text;
  layer.append(line, dot, box);
  return { box, line, dot };
}

export function createCallouts(root, style, items = []) {
  if (!document.getElementById("atlas-callout-css")) {
    const tag = document.createElement("style");
    tag.id = "atlas-callout-css";
    tag.textContent = CSS;
    document.head.append(tag);
  }
  const layer = document.createElement("div");
  layer.className = "atlas-callout";
  layer.style.inset = "0";
  root.append(layer);
  const width = style.format?.width || 1080, height = style.format?.height || 1920;
  const made = items.map((item) => ({ item, ...makeCallout(layer, item) }));
  const vector = new THREE.Vector3();
  return function draw(t, camera) {
    for (const { item, box, line, dot } of made) {
      const on = t >= item.at && t < item.until;
      const fade = on ? Math.min(1, (t - item.at) / 0.25) : 0;
      [box, line, dot].forEach((el) => { el.style.opacity = fade; });
      if (!on) continue;
      vector.set(...at(item.point, t));
      if (item.dentro) item.dentro.localToWorld(vector);           // o ponto gira junto com o modelo
      vector.project(camera);
      const px = (vector.x * 0.5 + 0.5) * width, py = (-vector.y * 0.5 + 0.5) * height;
      const bx = item.side === "right" ? width * 0.74 : width * 0.26;
      const by = Math.max(height * 0.22, Math.min(height * 0.82, py - height * 0.1));   // nunca sai pela borda
      box.style.left = `${bx}px`;
      box.style.top = `${by}px`;
      dot.style.left = `${px}px`;
      dot.style.top = `${py}px`;
      const dx = px - bx, dy = py - by;
      line.style.left = `${bx}px`;
      line.style.top = `${by}px`;
      line.style.width = `${Math.hypot(dx, dy)}px`;
      line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    }
  };
}

// ---------- o giro lento do modelo ----------
export function turntable(object, { speed = 0.18, from = 0, to = Infinity } = {}) {
  return (t) => {
    const time = Math.max(0, Math.min(t, to) - from);
    object.rotation.y = time * speed;
  };
}

// uma base discreta sob a peça, para ela não flutuar no vazio (o atlas usa sombra, não chão)
export function shadowDisc(scene, style, { radius = 2.2, y = -1.6, hex } = {}) {
  const disc = piece(new THREE.CircleGeometry(radius, 48), material(hex || "#070c11", { roughness: 1 }), [0, y, 0]);
  disc.rotation.x = -Math.PI / 2;
  disc.material.transparent = true;
  disc.material.opacity = 0.55;
  scene.add(disc);
  return disc;
}
