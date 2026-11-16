// retro.js: o visual 3D retrô, por cima de qualquer cena, configurado pelo estilo.json (seção "retro").
//   internal: [largura, altura]   a resolução em que a cena é renderizada (depois ampliada para 1080x1920)
//   upscale: "nearest" | "linear" pixel visível (era 32 bits) ou macio (era 64 bits)
//   color_bits: 5                 bits por canal (5 = 15/16 bits de cor, as 32 tonalidades por canal da época)
//   dither: 0 a 1                 o pontilhado ordenado que disfarça as faixas de cor
//   blur: 0 a 1                   o "embaçado" da era 64 bits (filtro de textura e saída de vídeo)
//   vertex_snap: [x, y] | null    os vértices presos numa grade grossa: o "tremido" da era 32 bits
//   smooth_normals: true          sombreado suave entre vértices: as facetas duras do low-poly somem
//   outline: "#16182a" | null     contorno escuro de 1 pixel onde a profundidade salta (a borda dos objetos, como na pixel art)
// Tudo continua função de t: o tremido vem da posição na tela, não de sorteio.
import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

const VERTEX = "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";

const FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D tScene, tDepth;
uniform vec2 internal;
uniform float levels, dither, blur, outline, near, far;
uniform vec3 ink;
float viewDepth(vec2 uv) { float d = texture2D(tDepth, uv).x; return near * far / (far - d * (far - near)); }
// a borda: algum vizinho está bem mais longe que este pixel (este pixel é a beirada de um objeto na frente)
float edge(vec2 uv, vec2 texel) {
  float here = viewDepth(uv), gap = 0.0;
  gap = max(gap, viewDepth(uv + vec2(texel.x, 0.0)) - here);
  gap = max(gap, viewDepth(uv - vec2(texel.x, 0.0)) - here);
  gap = max(gap, viewDepth(uv + vec2(0.0, texel.y)) - here);
  gap = max(gap, viewDepth(uv - vec2(0.0, texel.y)) - here);
  return step(0.06 + here * 0.04, gap);
}
// Khronos PBR Neutral (o mesmo tom do palco normal) e a curva sRGB, feitos aqui porque a cena vai para uma textura
vec3 neutral(vec3 c) {
  float x = min(c.r, min(c.g, c.b));
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  c -= offset;
  float peak = max(c.r, max(c.g, c.b));
  if (peak < 0.76) return c;
  float d = 0.24, newPeak = 1.0 - d * d / (peak + d - 0.76);
  c *= newPeak / peak;
  float g = 1.0 - 1.0 / (0.15 * (peak - newPeak) + 1.0);
  return mix(c, vec3(newPeak), g);
}
vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
float bayer(vec2 p) {
  int x = int(mod(p.x, 4.0)), y = int(mod(p.y, 4.0)), i = x + y * 4;
  int m[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
  return (float(m[i]) + 0.5) / 16.0 - 0.5;
}
void main() {
  vec2 texel = 1.0 / internal;
  vec3 c = texture2D(tScene, vUv).rgb;
  if (blur > 0.0) {
    vec3 around = texture2D(tScene, vUv + texel * vec2(0.75, 0.25)).rgb + texture2D(tScene, vUv + texel * vec2(-0.25, 0.75)).rgb
                + texture2D(tScene, vUv + texel * vec2(-0.75, -0.25)).rgb + texture2D(tScene, vUv + texel * vec2(0.25, -0.75)).rgb;
    c = mix(c, around * 0.25, blur * 0.6);
  }
  c = toSRGB(clamp(neutral(c), 0.0, 1.0));
  if (outline > 0.0) c = mix(c, ink, edge(vUv, texel));
  vec2 pixel = floor(vUv * internal);
  c = floor(c * levels + 0.5 + bayer(pixel) * dither) / levels;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

// os vértices presos numa grade da tela (o tremido da era 32 bits)
function snapVertices(material, grid) {
  if (material.userData.retroSnap) return;
  material.userData.retroSnap = true;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.snapGrid = { value: new THREE.Vector2(...grid) };
    shader.vertexShader = shader.vertexShader
      .replace("void main() {", "uniform vec2 snapGrid;\nvoid main() {")
      .replace("#include <project_vertex>", `#include <project_vertex>
        vec2 snapped = floor(gl_Position.xy / gl_Position.w * snapGrid * 0.5 + 0.5) / (snapGrid * 0.5);
        gl_Position.xy = snapped * gl_Position.w;`);
  };
  material.needsUpdate = true;
}

// junta os vértices repetidos e recalcula as normais: o sombreado passa a ser suave entre as faces
function smoothGeometry(geometry, done) {
  if (done.has(geometry.uuid) || !geometry.attributes.position) return geometry;
  const copy = geometry.clone();
  copy.deleteAttribute("normal");
  if (copy.attributes.uv) copy.deleteAttribute("uv");
  const merged = mergeVertices(copy, 1e-4);
  merged.computeVertexNormals();
  done.set(geometry.uuid, merged);
  return merged;
}

function prepareScene(scene, settings) {
  const smoothed = new Map();
  scene.traverse((object) => {
    if (!object.isMesh) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const textured = materials.some((m) => m.map);
    // userData.keepGeometry: a cena ainda mexe nessa malha (cores por vértice, por exemplo); ela já vem suave
    if (settings.smooth_normals && !textured && !object.userData.keepGeometry && !object.geometry.type.startsWith("Plane")) {
      object.geometry = smoothed.get(object.geometry.uuid) || smoothGeometry(object.geometry, smoothed);
    }
    materials.forEach((m) => {
      if (m.flatShading && settings.smooth_normals) { m.flatShading = false; m.needsUpdate = true; }   // facetado só quando o estilo quer
      if (settings.vertex_snap) snapVertices(m, settings.vertex_snap);
    });
  });
}

export function createRetro(renderer, scene, camera, settings) {
  const [w, h] = settings.internal;
  const filter = settings.upscale === "linear" ? THREE.LinearFilter : THREE.NearestFilter;
  const target = new THREE.WebGLRenderTarget(w, h, { minFilter: filter, magFilter: filter, type: THREE.HalfFloatType, depthBuffer: true });
  target.depthTexture = new THREE.DepthTexture(w, h);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    vertexShader: VERTEX, fragmentShader: FRAGMENT, depthTest: false, depthWrite: false, toneMapped: false,
    uniforms: { tScene: { value: target.texture }, internal: { value: new THREE.Vector2(w, h) },
      levels: { value: Math.pow(2, settings.color_bits ?? 5) - 1 }, dither: { value: settings.dither ?? 1 }, blur: { value: settings.blur ?? 0 },
      tDepth: { value: target.depthTexture }, outline: { value: settings.outline ? 1 : 0 }, ink: { value: new THREE.Color(settings.outline || "#16182a") },
      near: { value: camera.near }, far: { value: camera.far } },
  }));
  const screen = new THREE.Scene();
  screen.add(quad);
  const flat = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  let prepared = false;
  return function draw() {
    if (!prepared) { prepareScene(scene, settings); prepared = true; }   // depois que a cena inteira foi montada
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(screen, flat);
  };
}
