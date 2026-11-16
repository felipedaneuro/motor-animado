// plano.js do exemplo "Cafeína": QUANDO cada coisa acontece e ONDE a câmera vai. Sem three.js, de propósito:
// o sons.py lê este arquivo pelo Node e põe whoosh em cada movimento, pop em cada etiqueta e card, e os SOUNDS.
// As frases contam do 0 (wordStart(0, ...) é a primeira). Os tempos vêm de tempos.js, escrito pelo montar.py.
import timing from "./tempos.js";
import { clock } from "./motor/nucleo.js";

const { wordStart, phraseStart, phraseEnd, duration } = clock(timing);

// ---------- os tempos-chave ----------
export const T = {
  molecule: wordStart(0, "molecula"),
  person: wordStart(0, "bia"),
  seven: wordStart(0, "sete"),
  sip: wordStart(1, "gole"),
  down: wordStart(1, "desce"),
  blood: wordStart(1, "sangue"),
  twenty: wordStart(2, "vinte"),
  brain: wordStart(2, "cerebro"),
  fits: wordStart(2, "encaixa"),
  receptor: wordStart(2, "receptor"),
  block: wordStart(3, "bloqueio"),
  tired: wordStart(3, "cansaco"),
  sit: wordStart(3, "sentar"),
  overdid: wordStart(4, "exagerou"),
  heart: wordStart(4, "coracao"),
  hand: wordStart(4, "mao"),
  night: wordStart(4, "noite"),
  congrats: wordStart(5, "parabens"),
  dismantled: wordStart(5, "desmontou"),
  comment: wordStart(5, "comente"),
  end: duration,
};

// as estações ao longo do chão (eixo x): A café, B estômago e sangue, C cérebro, D receptor, E exagero, F final
export const STATION = { A: 0, B: 12, C: 24, D: 36, E: 48, F: 60 };
const { A, B, C, D, E, F } = STATION;

// etiqueta: quando o nome técnico é falado
export const LABELS = [
  { at: T.block, until: phraseEnd(3) + 0.3, title: "BLOQUEIO", subtitle: "DA ADENOSINA" },
  { at: T.dismantled, until: phraseEnd(5) + 0.3, title: "DESMONTADA!" },
];
// cards no terço de cima (y padrão do estilo); o do CTA embaixo da legenda
export const CARDS = [
  { at: T.seven, until: phraseStart(1) - 0.1, icon: "☕", text: "7H DA MANHÃ" },
  { at: T.twenty, until: T.brain + 0.2, icon: "⏱️", text: "20 MIN" },
  { at: T.night, until: phraseStart(5) - 0.1, icon: "🌙", text: "SEM DORMIR" },
  { at: T.comment, until: duration + 1, icon: "💬", text: "COMENTE CAFÉ", y: 1530 },
];
export const HIGHLIGHTS = ["cafeína", "adenosina", "bloqueio", "coração"];

// ---------- a câmera: approach = aproximação, fly = viagem entre estações ----------
export const CAMERA = {
  start: { position: [A + 0.2, 1.7, 4.4], target: [A, 1.0, 0] },
  moves: [
    { kind: "approach", at: T.molecule - 0.2, position: [A + 0.5, 1.4, 1.7], target: [A + 0.3, 1.1, 0.2] },
    { kind: "approach", at: T.person - 0.3, position: [A + 0.1, 1.6, 3.2], target: [A - 0.1, 1.2, 0] },
    { kind: "approach", at: T.sip - 0.3, position: [A - 0.1, 1.75, 2.1], target: [A - 0.3, 1.5, 0] },
    { kind: "fly", at: T.down, position: [B + 0.5, 1.8, 4.4], target: [B + 0.6, 1.3, -0.5] },
    { kind: "approach", at: T.blood - 0.2, position: [B + 3, 1.45, 2.4], target: [B + 3.2, 1.2, 0] },
    { kind: "fly", at: T.twenty, position: [C - 1, 1.9, 4.2], target: [C - 0.6, 1.8, -0.5], duration: 1.4 },
    { kind: "approach", at: T.brain - 0.2, position: [C + 0.2, 2.3, 4.2], target: [C, 2.1, -0.8] },
    { kind: "fly", at: T.fits - 0.1, position: [D + 0.3, 1.5, 3.0], target: [D, 0.95, 0], duration: 1.3 },
    { kind: "approach", at: T.block - 0.3, position: [D + 0.2, 1.3, 2.0], target: [D, 1.0, 0] },
    { kind: "approach", at: T.tired - 0.2, position: [D + 1.0, 1.45, 3.3], target: [D + 0.7, 0.95, 0] },
    { kind: "fly", at: T.overdid, position: [E + 0.3, 1.6, 3.9], target: [E + 0.3, 1.45, 0] },
    { kind: "approach", at: T.heart - 0.2, position: [E + 0.35, 1.75, 3.0], target: [E + 0.35, 1.6, 0] },
    { kind: "approach", at: T.night - 0.2, position: [E - 0.1, 1.9, 4.3], target: [E - 0.4, 2.2, -1] },
    { kind: "fly", at: T.congrats - 0.3, position: [F + 0.1, 1.55, 4.4], target: [F + 0.1, 1.35, 0] },
  ],
};

// ---------- os sons da história (os whooshes e pops saem sozinhos da câmera, das etiquetas e dos cards) ----------
// sound: um nome da biblioteca do sons.py; options: os parâmetros dele
export const SOUNDS = [
  { sound: "sparkle", at: T.molecule, volume: 0.4 },
  { sound: "glub", at: T.sip, volume: 0.45, options: { duration: 0.25 } },
  { sound: "rise", at: T.down, volume: 0.3, options: { duration: 1.2, start_hz: 700, end_hz: 200 } },
  ...[0, 1, 2, 3, 4].map((k) => ({ sound: "glub", at: T.blood + k * 0.2, volume: 0.3, options: { duration: 0.12 } })),
  { sound: "rise", at: T.brain, volume: 0.3, options: { duration: 0.8, start_hz: 300, end_hz: 1100 } },
  { sound: "lock", at: T.receptor + 0.3, volume: 0.6 },
  { sound: "thump", at: T.block, volume: 0.5, options: { duration: 0.4 } },
  { sound: "rise", at: T.sit, volume: 0.25, options: { duration: 0.6, start_hz: 900, end_hz: 400 } },
  { sound: "heartbeat", at: T.heart, volume: 0.7, options: { beats: 6, interval: 0.3 } },
  { sound: "drone", at: T.night - 0.2, volume: 0.4, options: { duration: 2.5, pitch: 55 } },
  { sound: "party", at: T.congrats, volume: 0.4 },
  { sound: "shimmer", at: T.dismantled, volume: 0.35, options: { duration: 2.0 } },
];
