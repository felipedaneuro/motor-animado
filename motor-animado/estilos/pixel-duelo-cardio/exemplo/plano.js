// plano.js de partida de um estilo novo: uma aproximação por frase em volta do personagem, no jeito de câmera medido
// (estilo.json, "camera"). Com "sync": "beats" e cortes medidos, a câmera também corta nos segundos da referência.
// Troque pelos tempos-chave e pela câmera do vídeo de verdade (veja referencias/cena-web.md).
import timing from "./tempos.js";
import style from "./estilo.js";
import { PANEL } from "./estilo/kit.js";
import { clock } from "./motor/nucleo.js";

const { wordStart, phraseStart, phraseEnd, duration } = clock(timing);

export const T = {
  first: phraseStart(0),
  prop: phraseStart(1),
  last: phraseStart(timing.phrases.length - 1),
  end: duration,
};
export const STATION = { A: 0 };

// a caixa de texto que se escreve, uma frase por vez, logo abaixo do título
export const FALAS = timing.phrases.map((frase, i) => ({
  at: frase.start, until: (timing.phrases[i + 1]?.start ?? duration) - 0.05,
  text: frase.words.map((w) => w.word).join(" ").toUpperCase(),
}));

// o close: em que trechos um lado toma a tela (a fórmula alterna par e close de 4 a 5 vezes)
export const FOCOS = [
  { at: phraseStart(1), until: phraseEnd(1), lado: "left" },
  { at: phraseStart(3), until: phraseEnd(3), lado: "right" },
];

export const LABELS = [{ at: phraseStart(0), until: duration, title: "INFARTO × PARADA", subtitle: "um bate, o outro não bombeia" }];
export const CARDS = [{ at: T.last, until: duration + 1, icon: "💬", text: "EM QUAL O SANGUE AINDA SAI?", y: 1530 }];
export const HIGHLIGHTS = [timing.phrases[0].words[0].word];

// a câmera fica parada de frente: a referência mede 98% do tempo sem movimento, e quem se mexe é o conteúdo
export const CAMERA = {
  start: { position: [0, 0, PANEL.cameraZ], target: [0, 0, 0] },
  moves: [],
};
