// palco.js: o renderizador, a luz, a névoa e a câmera, tudo a partir do estilo.json (seção "stage").
import * as THREE from "three";
import { setFlatShading, setDetailBoost } from "./formas.js";
import { createRetro } from "./retro.js";

const color = (value) => new THREE.Color(value);

function createRenderer(canvas, width, height) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);   // no render 4K o HyperFrames dobra a densidade
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

// o fundo em degradê (cima -> baixo), como os fundos limpos medidos na referência
function gradientTexture(top, bottom) {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const fill = context.createLinearGradient(0, 0, 0, 256);
  fill.addColorStop(0, top);
  fill.addColorStop(1, bottom);
  context.fillStyle = fill;
  context.fillRect(0, 0, 4, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addSun(scene, sunSettings, shadows) {
  const [sunColor, sunStrength] = sunSettings;
  const sun = new THREE.DirectionalLight(color(sunColor), sunStrength);
  sun.castShadow = shadows;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, far: 50 });
  scene.add(sun, sun.target);
  return sun;
}

// stage: {background, fog: [perto, longe] ou null, hemisphere: [céu, chão, força], sun: [cor, força],
//         shadows, flat_shading, fov}
export function createStage(canvas, style) {
  const { width, height } = style.format;
  const stage = style.stage;
  setFlatShading(Boolean(stage.flat_shading));
  setDetailBoost(stage.detail_boost || 0);
  const renderer = createRenderer(canvas, width, height);
  const scene = new THREE.Scene();
  scene.background = stage.background_bottom && stage.background_bottom !== stage.background
    ? gradientTexture(stage.background, stage.background_bottom) : color(stage.background);
  if (stage.fog) scene.fog = new THREE.Fog(color(stage.background), ...stage.fog);
  const [sky, ground, strength] = stage.hemisphere;
  scene.add(new THREE.HemisphereLight(color(sky), color(ground), strength));
  const sun = addSun(scene, stage.sun, stage.shadows !== false);
  const camera = new THREE.PerspectiveCamera(stage.fov || 48, width / height, 0.05, 400);
  // a sombra acompanha o ponto para onde a câmera olha, então só precisa cobrir o que está perto
  const followLight = (focus) => { sun.position.set(focus.x + 4, focus.y + 9, focus.z + 6); sun.target.position.copy(focus); };
  // com "retro" no estilo, a cena passa pelo visual 3D retrô (retro.js); sem, vai direto para a tela
  const draw = style.retro ? createRetro(renderer, scene, camera, style.retro) : () => renderer.render(scene, camera);
  return { renderer, scene, camera, followLight, draw };
}
