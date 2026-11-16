// camera.js: a câmera, sempre a partir do plano (plano.js) e do estilo (seção "camera").
//
// plan.camera = { start: {position, target}, moves: [{kind, at, position, target, duration?}] }
//   kind "approach": aproximação curta        kind "fly": viagem longa, com arco para cima
//   kind "cut": troca seca de posição (só quando a referência medida corta nesse segundo)
// O sons.py põe um whoosh em cada approach/fly lendo este mesmo plano.
//
// Modo câmera medida (createMeasuredDolly): repete quadro a quadro a curva de zoom medida na referência
// (curva_camera.json do decupar.py): se a imagem dela cresceu 0,7% num quadro, a nossa câmera chega 0,7% mais perto.
import * as THREE from "three";
import { EASINGS, clamp } from "./nucleo.js";
export { orbit } from "./nucleo.js";

const DEFAULTS = { approach_seconds: 0.9, fly_seconds: 1.8, fly_arc: 1.6, easing: "smooth", idle_sway: 0.06, glide: 0 };

function moveDuration(move, settings) {
  if (move.duration) return move.duration;
  return move.kind === "fly" ? settings.fly_seconds : move.kind === "cut" ? 0 : settings.approach_seconds;
}

export function createDrone(camera, plan, styleSettings = {}) {
  const settings = { ...DEFAULTS, ...styleSettings };
  const ease = EASINGS[settings.easing] || EASINGS.smooth;
  const moves = [...plan.moves].sort((a, b) => a.at - b.at).map((m) => ({ ...m, duration: moveDuration(m, settings) }));
  const position = new THREE.Vector3(), target = new THREE.Vector3(), scratch = new THREE.Vector3(), side = new THREE.Vector3();
  // deslize lento depois de cada movimento (a câmera "nunca para" do estilo palito): settings.glide em unidades por
  // segundo, de lado; some aos poucos quando o próximo movimento começa, sem pulo
  const glideAt = (t) => {
    if (!settings.glide) return 0;
    let amount = 0;
    for (let i = 0; i < moves.length; i++) {
      const end = moves[i].at + moves[i].duration, next = moves[i + 1];
      if (t < end) break;
      const gap = next ? Math.max(0, next.at - end) : Infinity;
      const fade = next && t >= next.at ? 1 - (next.duration ? ease((t - next.at) / next.duration) : 1) : 1;
      amount = settings.glide * Math.min(t - end, gap) * fade * (i % 2 ? -1 : 1);
    }
    return amount;
  };
  function update(t) {
    position.set(...plan.start.position);
    target.set(...plan.start.target);
    let lift = 0;
    for (const move of moves) {
      if (t < move.at) break;
      const u = move.duration ? ease((t - move.at) / move.duration) : 1;
      position.lerp(scratch.set(...move.position), u);
      target.lerp(scratch.set(...move.target), u);
      if (move.kind === "fly") lift += settings.fly_arc * Math.sin(Math.PI * clamp((t - move.at) / move.duration));
    }
    side.subVectors(target, position).cross(camera.up).normalize();
    position.addScaledVector(side, glideAt(t));
    // o drone nunca fica parado: um balanço lento por cima de tudo
    const sway = settings.idle_sway;
    camera.position.set(position.x + sway * Math.sin(t * 0.63), position.y + lift + sway * 0.8 * Math.sin(t * 0.87), position.z + sway * 0.8 * Math.sin(t * 0.51));
    camera.lookAt(target);
    return target;
  }
  return { update, moves };
}

// measured = {curve: [escala por quadro], fps, target, direction, distance}: a câmera olha para target e fica a
// distance / escala[quadro] de distância, na direção direction (de target para a câmera)
export function createMeasuredDolly(camera, measured) {
  const target = new THREE.Vector3(...measured.target);
  const direction = new THREE.Vector3(...measured.direction).normalize();
  const last = measured.curve.length - 1;
  function update(t) {
    const frame = clamp(t * measured.fps, 0, last);
    const low = Math.floor(frame), high = Math.min(last, low + 1);
    const scale = measured.curve[low] + (measured.curve[high] - measured.curve[low]) * (frame - low);
    camera.position.copy(target).addScaledVector(direction, measured.distance / scale);
    camera.lookAt(target);
    return target;
  }
  return { update, moves: [] };
}
