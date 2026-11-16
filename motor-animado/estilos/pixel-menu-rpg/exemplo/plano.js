// plano.js do exemplo do pixel-menu-rpg: uma etapa por frase. A câmera fica parada; o que muda é a janela.
import timing from "./tempos.js";
import { clock } from "./motor/nucleo.js";

const { phraseStart, duration } = clock(timing);
const fim = (i) => (timing.phrases[i + 1]?.start ?? duration);

const PASSOS = [
  { chave: "PAUTA", antes: "A", itens: ["Procurar o assunto", "Conferir os números", "Escolher o gancho"] },
  { chave: "ROTEIRO", antes: "O", itens: ["roteiro.txt", "Cena 1 · gancho", "Cena 2 · virada"] },
  { chave: "NARRAÇÃO", antes: "A", itens: ["Gravar a voz", "Alinhar as palavras", "● REC"] },
  { chave: "CENAS", antes: "AS", itens: ["Montar o mundo", "Pôr as peças", "Conferir o mapa"] },
  { chave: "MONTAGEM", antes: "A", itens: ["Juntar os planos", "Pôr os sons", "Mixar"] },
  { chave: "VERTICAIS", antes: "OS CORTES", itens: ["Cortar em 9:16", "Legendar", "Publicar"] },
];

export const ETAPAS = timing.phrases.map((frase, i) => ({
  at: frase.start, until: fim(i), ...PASSOS[i % PASSOS.length],
}));

export const FALAS = timing.phrases.map((frase, i) => ({
  at: frase.start, until: fim(i) - 0.05,
  text: frase.words.map((w) => w.word).join(" ").toUpperCase(),
}));

export const LABELS = [];
export const CARDS = [];
export const HIGHLIGHTS = [timing.phrases[0].words[0].word];
export const CAMERA = { start: { position: [0, 0, 11], target: [0, 0, 0] }, moves: [] };
