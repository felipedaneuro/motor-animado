// lupa.js: a lupa de ilustração médica: um círculo na tela que mostra, de perto, um ponto da cena (por exemplo o coágulo
// dentro da artéria), ligado por uma linha ao lugar de onde ele vem. É uma segunda câmera desenhada por cima da imagem.
// Uso: const lens = createLens(stage, {center: [800, 640], radius: 230}); depois do stage.draw(): lens(t, {...})
import * as THREE from "three";

function overlayParts(radius, texture) {
  const group = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), new THREE.MeshBasicMaterial({ map: texture, depthTest: false }));
  const ring = new THREE.Mesh(new THREE.RingGeometry(radius, radius + 12, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false }));
  const shadow = new THREE.Mesh(new THREE.RingGeometry(radius + 12, radius + 20, 64), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthTest: false }));
  group.add(shadow, disc, ring);
  return group;
}

export function createLens(stage, { center = [790, 640], radius = 230, fov = 32, width = 1080, height = 1920 } = {}) {
  const { renderer, scene, camera } = stage;
  const target = new THREE.WebGLRenderTarget(512, 512, { samples: 4 });
  const lensCamera = new THREE.PerspectiveCamera(fov, 1, 0.005, 60);
  const overlay = new THREE.Scene(), flat = new THREE.OrthographicCamera(0, width, height, 0, -1, 1);
  const lens = overlayParts(radius, target.texture);
  lens.position.set(center[0], height - center[1], 0);
  const line = new THREE.Mesh(new THREE.PlaneGeometry(1, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false }));
  const dot = new THREE.Mesh(new THREE.CircleGeometry(12, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false }));
  overlay.add(line, dot, lens);
  const projected = new THREE.Vector3();
  // view: {visible 0..1, look: [x,y,z] o que a lupa mostra, from: [x,y,z] de onde ela olha, anchor: [x,y,z] o ponto na cena}
  return function draw(t, view) {
    if (!view || view.visible <= 0) return;
    lensCamera.position.set(...view.from);
    lensCamera.lookAt(...view.look);
    renderer.setRenderTarget(target);
    renderer.render(scene, lensCamera);
    renderer.setRenderTarget(null);
    projected.set(...view.anchor).project(camera);
    const ax = (projected.x * 0.5 + 0.5) * width, ay = (projected.y * 0.5 + 0.5) * height;
    const cx = lens.position.x, cy = lens.position.y, dx = cx - ax, dy = cy - ay, length = Math.hypot(dx, dy);
    lens.scale.setScalar(view.visible);
    dot.position.set(ax, ay, 0);
    dot.scale.setScalar(view.visible);
    line.position.set((ax + cx) / 2, (ay + cy) / 2, 0);
    line.scale.set(Math.max(1, length - radius * view.visible) * view.visible, 1, 1);
    line.rotation.z = Math.atan2(dy, dx);
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.render(overlay, flat);
    renderer.autoClear = autoClear;
  };
}
