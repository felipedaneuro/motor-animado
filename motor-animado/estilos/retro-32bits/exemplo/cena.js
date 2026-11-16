// cena.js do exemplo: o cenário em pixel art atrás (céu, serra, mata, moita e chão em camadas), o busto em pixel no
// canto (o retrato de caixa de diálogo) e os três hábitos, cada um um desenho em pixel que aparece ao lado dele.
import { pop } from "./motor/nucleo.js";
import { createStage } from "./motor/palco.js";
import { createDrone } from "./motor/camera.js";
import { createOverlay } from "./motor/textos.js";
import { pixelWorld, pixelSprite, presenter } from "./estilo/kit.js";
import style from "./estilo.js";
import timing from "./tempos.js";
import { T, ACTING, LABELS, CARDS, HIGHLIGHTS, CAMERA } from "./plano.js";

const acting = (t) => ACTING.filter((a) => t >= a.at).pop() || ACTING[0];

// os três hábitos, em pixel: copo d'água, lua e tênis. Planos virados pra câmera — nada de girar, senão viram risco.
function buildHabits(scene) {
  const habits = [["agua", [-1.3, 0.36, 0.4], T.water], ["sono", [1.3, 0.42, 0.4], T.sleep], ["passos", [0, 0.78, 0.6], T.move]]
    .map(([kind, position, at]) => ({ at, sprite: pixelSprite(scene, style, { kind, position, size: 0.58 }), y: position[1] }));
  return (t) => habits.forEach((habit, k) => {
    habit.sprite.group.scale.setScalar(pop(t, habit.at));
    habit.sprite.group.position.y = habit.y + 0.07 * Math.abs(Math.sin(t * 2 + k));
  });
}

export function createScene(canvas, root) {
  const stage = createStage(canvas, style);
  const world = pixelWorld(stage.scene, style, { x0: -20, x1: 20 });
  const overlay = createOverlay(root, timing, style, { labels: LABELS, cards: CARDS, highlights: HIGHLIGHTS });
  const drone = createDrone(stage.camera, CAMERA, style.camera);
  const host = presenter(root, style);   // o busto fica preso à tela, não ao mundo
  const habits = buildHabits(stage.scene);
  return function draw(t) {
    const focus = drone.update(t);
    stage.followLight(focus);
    world(t, focus);
    const now = acting(t);
    host.pose(now.pose);
    host.setFace(now.face);
    host.update(t, now.falando !== false);
    habits(t);
    overlay(t, stage.camera);
    stage.draw();
  };
}
