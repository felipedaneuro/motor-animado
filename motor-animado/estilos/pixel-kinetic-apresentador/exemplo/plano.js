// plano.js do exemplo do pixel-kinetic-apresentador: uma ideia por frase. A câmera fica parada, enquadrando o
// apresentador no canto de baixo; o resto é a camada de cima.
import timing from "./tempos.js";
import { clock } from "./motor/nucleo.js";

const { duration } = clock(timing);
const fim = (i) => (timing.phrases[i + 1]?.start ?? duration);

const PONTOS = [
  { linha1: "Antes eu", linha2: "achava...", pose: "think", face: { brows: "worried", mouth: "flat" },
    janela: "☐ aparecer na câmera<br>☐ ter voz bonita<br>☐ saber editar" },
  { linha1: "Hoje eu", linha2: "só peço", pose: "point", face: { eyes: "wide", mouth: "open" },
    janela: "<b>&gt;</b> faz um vídeo sobre o café<br><br><small>enviado</small>" },
  { linha1: "E ele", linha2: "entrega", pose: "standing", face: { eyes: "happy", mouth: "smile" },
    janela: "<b>video-v1-final.mp4</b><br>▬▬▬▬▬▬▬▬ 86%" },
  { linha1: "Vergonha", linha2: "de câmera?", pose: "handsOnHips", face: { brows: "up", mouth: "o" },
    janela: "pra quem tem vergonha de câmera<br><br>·  ·   ·    ·" },
  { linha1: "Isso muda", linha2: "o jogo.", pose: "cheer", face: { eyes: "happy", mouth: "open" },
    janela: "<b>ISSO MUDA<br>O JOGO.</b>" },
  { linha1: "Começa", linha2: "hoje", pose: "wave", face: { eyes: "happy", mouth: "smile" },
    janela: "<b>painel</b> › novo vídeo" },
];

export const IDEIAS = timing.phrases.map((frase, i) => ({ at: frase.start, until: fim(i), ...PONTOS[i % PONTOS.length] }));
export const LABELS = [];
export const CARDS = [];
export const HIGHLIGHTS = [timing.phrases[0].words[0].word];
export const CAMERA = { start: { position: [0, -2.15, 5.0], target: [0, -2.3, 0] }, moves: [] };
