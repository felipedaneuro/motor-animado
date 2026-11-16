// plano.js do exemplo do med3d-decisao: a câmera troca de plano por frase (corte seco, sem transição) e a
// interface clínica conta o caso: achados, decisões com contagem regressiva e o resumo no fim.
import timing from "./tempos.js";
import { clock } from "./motor/nucleo.js";

const { phraseStart, phraseEnd, duration } = clock(timing);
const f = (i) => phraseStart(Math.min(i, timing.phrases.length - 1));

export const T = { first: f(0), last: f(timing.phrases.length - 1), end: duration };

export const ACHADOS = [
  { at: f(0), until: f(1), texto: "HOMEM, 32 ANOS", x: 0.3, y: 0.62 },
  { at: f(1), until: f(2), texto: "PLACAS VERMELHAS", x: 0.45, y: 0.5 },
  { at: f(2), until: f(3), texto: "CHIADO NO PEITO", x: 0.55, y: 0.44 },
];

export const VITAIS = { at: f(1), itens: [
  { rotulo: "PA", valor: "80/50", alvo: "112/70", em: f(4) },
  { rotulo: "SpO₂", valor: "88%", alvo: "97%", em: f(4) },
  { rotulo: "FC", valor: "132", alvo: "98", em: f(4) },
]};

export const DECISOES = [
  { at: f(3), until: f(4), pergunta: "Por qual via?", opcoes: ["No músculo da coxa", "Na veia"], certa: 0,
    contagem: 3, aviso: "Na veia, em bolus: risco de arritmia fatal." },
];

export const RESUMO = { at: f(4), until: duration + 1, titulo: "ANAFILAXIA · as 3 decisões",
  itens: ["Adrenalina primeiro", "No músculo da coxa", "Repetir em 5 a 15 min"],
  pedido: "SALVE PRA REVISAR NO PLANTÃO" };

export const LABELS = [];
export const CARDS = [];
export const HIGHLIGHTS = [timing.phrases[0].words[0].word];

// a cena fica toda perto do chão (a maca tem 1,9 m de painel, com o pé em y = -1,4), então o alvo desce: com o
// alvo em 0,8 sobrava metade do quadro de parede vazia.
const alvo = [0, -0.15, 0];
export const CAMERA = {
  start: { position: [0, 1.1, 7.0], target: alvo },
  moves: [
    { kind: "cut", at: f(1), position: [-1.8, 0.9, 5.2], target: [-0.6, -0.2, 0] },
    { kind: "cut", at: f(2), position: [1.9, 1.0, 5.0], target: [0.4, -0.1, 0] },
    { kind: "cut", at: f(3), position: [0, 1.2, 6.4], target: alvo },
    { kind: "cut", at: f(4), position: [0.9, 1.3, 7.0], target: alvo },
  ],
};
