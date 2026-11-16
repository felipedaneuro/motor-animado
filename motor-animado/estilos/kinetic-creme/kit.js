// kit.js de um estilo novo: as peças próprias do estilo. Começa com o básico (o chão nas cores medidas);
// acrescente aqui o que a referência mostra em todo vídeo (o mundo, objetos que se repetem, efeitos de luz).
import * as THREE from "three";
import { material } from "../motor/formas.js";

// o chão, na cor mais escura da paleta medida (ou na cor passada)
export function ground(scene, style, { size = 200, hex } = {}) {
  const palette = style.palette || [];
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material(hex ?? (palette[0] || "#555555"), { roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  return floor;
}
