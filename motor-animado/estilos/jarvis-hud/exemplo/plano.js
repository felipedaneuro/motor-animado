// plano.js de "AVC: exame holográfico" (estilo jarvis-hud). QUANDO cada coisa acontece, ONDE a câmera vai e o visor.
// Estações no eixo x: A almoço (0), B coração (12), C pescoço (24), D cérebro (36), G o que fazer (-12), H hospital (-24), I final (60).
import timing from "./tempos.js";
import { clock } from "./motor/nucleo.js";

const { wordStart, phraseStart, phraseEnd, duration } = clock(timing);

export const T = {
  start: phraseStart(0), clot: wordStart(0, "coagulo"), antonio: wordStart(0, "antonio"),
  heart: wordStart(1, "coracao"), rhythm: wordStart(1, "ritmo"), piece: wordStart(2, "pedacinho"), loose: wordStart(2, "soltou"),
  rise: wordStart(3, "sobe"), neck: wordStart(3, "pescoco"), toBrain: wordStart(3, "cerebro"),
  thin: wordStart(4, "finas"), stuck: wordStart(5, "entala"), cork: wordStart(5, "rolha"),
  noBlood: wordStart(6, "sangue"), noOxygen: wordStart(6, "oxigenio"), stroke: wordStart(7, "avc"),
  minute: wordStart(8, "minuto"), millions: wordStart(8, "milhoes"), timeBrain: wordStart(9, "tempo"),
  bia: wordStart(10, "bia"), strange: wordStart(10, "estranho"), samu: wordStart(11, "samu"),
  smile: wordStart(12, "sorriso"), droop: wordStart(12, "caido"), hug: wordStart(13, "abraco"), armFalls: wordStart(13, "cai"),
  music: wordStart(14, "musica"), slurred: wordStart(14, "enrolada"), urgent: wordStart(15, "urgencia"), call: wordStart(15, "192"),
  help: phraseStart(17), hour: wordStart(17, "horario"), lying: wordStart(19, "deitado"),
  nothing: wordStart(20, "nada"), pill: wordStart(20, "remedio"), water: wordStart(20, "agua"), food: wordStart(20, "comida"),
  hospital: wordStart(21, "hospital"), dissolve: wordStart(22, "dissolve"), hours: wordStart(22, "quatro"),
  catheter: wordStart(23, "cateter"), pull: wordStart(23, "puxa"), flows: wordStart(24, "volta"), breathes: wordStart(24, "respira"),
  remember: wordStart(25, "lembre"), mission: phraseStart(25), congrats: wordStart(26, "parabens"),
  dismantled: wordStart(27, "desmontou"), comment: wordStart(28, "comente"), end: duration,
};

export const STATION = { A: 0, B: 12, C: 24, D: 36, G: -12, H: -24, I: 60 };
const { A, B, C, D, G, H, I } = STATION;

export const LABELS = [];
export const CARDS = [
  { at: T.call, until: phraseEnd(16), icon: "📞", text: "LIGUE 192" },
  { at: T.comment, until: duration + 1, icon: "💬", text: "COMENTE AVC" },
];
export const HIGHLIGHTS = ["coágulo", "coração", "cérebro", "isquêmico", "SAMU", "sorriso", "abraço", "música", "urgência", "192",
  "horário", "nada", "hospital", "cateter", "AVC"];

// ---------- o visor (HUD) ----------
const headline = (index, lines, untilIndex = index) => ({ at: phraseStart(index) - 0.1, until: phraseEnd(untilIndex) + 0.25, lines });
export const VISOR = {
  sections: [
    { at: 0, code: "01", title: "ORIGEM" }, { at: phraseStart(4) - 0.3, code: "02", title: "BLOQUEIO" },
    { at: phraseStart(10) - 0.3, code: "03", title: "TESTE SAMU" }, { at: phraseStart(17) - 0.3, code: "04", title: "SOCORRO" },
    { at: phraseStart(21) - 0.3, code: "05", title: "HOSPITAL" }, { at: phraseStart(25) - 0.3, code: "06", title: "RESUMO" },
  ],
  headlines: [
    headline(0, ["PRA ONDE VAI", "ESSE COÁGULO?"]), headline(1, ["NASCEU NO", "CORAÇÃO"], 2), headline(3, ["RUMO AO", "CÉREBRO"]),
    headline(4, ["AS ARTÉRIAS", "AFINAM"], 5), headline(6, ["AVC", "ISQUÊMICO"], 7), headline(8, ["TEMPO É", "CÉREBRO"], 9),
    headline(10, ["TESTE", "SAMU"], 11), headline(12, ["S DE", "SORRISO"]), headline(13, ["A DE", "ABRAÇO"]),
    headline(14, ["M DE", "MÚSICA"]), headline(15, ["U DE", "URGÊNCIA"], 16), headline(17, ["ANOTE O", "HORÁRIO"], 18),
    headline(19, ["DEITADO E", "SEGURO"]), headline(20, ["NADA PELA", "BOCA"]), headline(21, ["CONTRA O", "RELÓGIO"]),
    headline(22, ["REMÉDIO", "ATÉ 4H30"]), headline(23, ["CATETER", "PUXA O COÁGULO"]), headline(24, ["O SANGUE", "VOLTOU"]),
    headline(25, ["LEMBRE DO", "SAMU"], 26), headline(27, ["AVC", "DESMONTADO"]), headline(28, ["COMENTE", "AVC"]),
  ],
  gauge: { label: "OXIGÊNIO", keyframes: [[T.stuck, 100], [T.timeBrain, 42], [T.call, 34], [T.flows, 28], [T.flows + 2.2, 97], [T.mission, 100]] },
  terminal: [
    { at: T.antonio, text: "paciente: antonio, 72" }, { at: T.rhythm, text: "ritmo: irregular" }, { at: T.loose, text: "coágulo: solto" },
    { at: T.toBrain, text: "destino: cérebro" }, { at: T.stuck, text: "artéria: bloqueada" }, { at: T.noOxygen, text: "oxigênio: caindo" },
    { at: T.millions, text: "neurônios: -1,9 mi/min" }, { at: T.droop, text: "sorriso: assimétrico" }, { at: T.armFalls, text: "braço: caiu" },
    { at: T.slurred, text: "fala: enrolada" }, { at: T.call, text: "ligar: 192 agora" }, { at: T.hour, text: "início: 12:40" },
    { at: T.lying, text: "posição: de lado" }, { at: T.nothing, text: "boca: nada" }, { at: T.hours, text: "remédio: até 4h30" },
    { at: T.pull, text: "cateter: coágulo fora" }, { at: T.flows, text: "fluxo: 100%" }, { at: T.dismantled, text: "avc: desmontado" },
  ],
  ecg: { from: T.heart - 0.3, until: T.rise, label: "RITMO: IRREGULAR", irregularFrom: T.rhythm },
  flashes: [phraseStart(10) - 0.3, phraseStart(22), T.mission - 0.3],
};

// ---------- a câmera ----------
// punch-in: corte seco (escondido pelo clarão do visor) para um ponto mais aberto e aproximação curta até o enquadramento
const punchIn = (at, shot, back, duration = 1.2) => [
  { kind: "cut", at, position: shot.position.map((v, k) => v + back[k]), target: shot.target },
  { kind: "approach", at: at + 0.04, ...shot, duration },
];
const brainWide = { position: [D + 0.2, 2.6, 11.0], target: [D + 0.2, 2.3, -0.6] };
const brainClose = { position: [D + 1.1, 3.0, 5.6], target: [D + 0.8, 2.8, 0.4] };
export const CAMERA = {
  start: { position: [A + 0.4, 2.2, 6.6], target: [A, 1.2, 0] },
  moves: [
    { kind: "approach", at: T.antonio - 0.2, position: [A - 0.2, 1.7, 3.6], target: [A - 0.4, 1.3, 0] },
    { kind: "fly", at: T.heart - 0.4, position: [B + 0.2, 2.4, 6.6], target: [B, 2.2, 0] },
    { kind: "approach", at: T.piece - 0.2, position: [B + 0.9, 2.5, 4.8], target: [B + 0.5, 2.2, 0.1] },
    { kind: "fly", at: T.loose - 0.2, position: [C + 1.6, 1.6, 5.0], target: [C, 1.8, 0], duration: 1.3 },
    { kind: "approach", at: T.neck, position: [C + 1.2, 3.0, 4.2], target: [C, 2.9, 0] },
    { kind: "fly", at: phraseStart(4) - 0.3, ...brainWide, duration: 1.6 },
    { kind: "approach", at: T.stuck - 0.4, ...brainClose },
    { kind: "approach", at: T.noOxygen - 0.3, ...brainWide },
    ...punchIn(phraseStart(10) - 0.3, { position: [A + 0.6, 1.9, 4.8], target: [A, 1.3, 0] }, [0.4, 0.4, 1.8]),
    { kind: "approach", at: T.smile - 0.2, position: [A - 0.25, 1.75, 1.8], target: [A - 0.45, 1.65, 0] },
    { kind: "approach", at: T.hug - 0.2, position: [A - 0.2, 1.95, 3.6], target: [A - 0.45, 1.75, 0] },
    { kind: "approach", at: T.music - 0.2, position: [A - 0.3, 1.8, 2.2], target: [A - 0.45, 1.75, 0] },
    { kind: "fly", at: T.urgent - 0.3, position: [G + 0.3, 1.9, 4.8], target: [G, 1.2, 0] },
    { kind: "approach", at: T.hour - 0.2, position: [G + 1.4, 1.6, 2.8], target: [G + 1.3, 1.1, 0] },
    { kind: "approach", at: T.lying - 0.3, position: [G - 0.95, 2.6, 4.9], target: [G - 0.95, 0.45, -0.2] },
    { kind: "approach", at: T.nothing - 0.2, position: [G + 0.2, 1.7, 3.9], target: [G + 0.2, 1.1, 0.3] },
    { kind: "fly", at: phraseStart(21) - 0.4, position: [H + 0.3, 2.6, 7.4], target: [H, 1.6, 0] },
    ...punchIn(phraseStart(22), brainClose, [-0.9, -0.2, 5.4], 1.8),
    { kind: "approach", at: T.flows - 0.2, ...brainWide },
    ...punchIn(T.mission - 0.3, { position: [I + 0.1, 1.9, 5.2], target: [I, 1.4, 0] }, [0, 0.3, 1.8]),
  ],
};

export const SOUNDS = [
  ...[4, 10, 17, 21, 25].map((index) => ({ sound: "portal", at: phraseStart(index) - 0.3, volume: 0.25, options: { duration: 0.8, pitch: 220 } })),
  { sound: "glub", at: T.clot, volume: 0.3, options: { duration: 0.25 } },
  { sound: "heartbeat", at: T.heart, volume: 0.55, options: { beats: 5, interval: 0.55 } },
  { sound: "snip", at: T.loose, volume: 0.3 },
  { sound: "rise", at: T.rise, volume: 0.25, options: { duration: 1.5, start_hz: 250, end_hz: 700 } },
  { sound: "lock", at: T.stuck + 0.2, volume: 0.55 },
  { sound: "drone", at: T.noOxygen, volume: 0.3, options: { duration: 3.0, pitch: 50 } },
  ...[T.droop, T.armFalls, T.slurred, T.call].map((at) => ({ sound: "pop", at, volume: 0.35, options: { start_hz: 900, end_hz: 1400 } })),
  { sound: "siren", at: T.call, volume: 0.3, options: { duration: 1.8 } },
  ...[T.pill, T.water, T.food].map((at) => ({ sound: "snip", at: at + 0.25, volume: 0.25 })),
  { sound: "siren", at: T.hospital, volume: 0.22, options: { duration: 1.4 } },
  { sound: "shimmer", at: T.dissolve, volume: 0.3, options: { duration: 2.5 } },
  { sound: "thump", at: T.pull, volume: 0.5, options: { duration: 0.5 } },
  { sound: "portal", at: T.flows, volume: 0.3, options: { duration: 2.5, pitch: 130 } },
  { sound: "victory", at: T.mission, volume: 0.4 },
  { sound: "party", at: T.congrats, volume: 0.35 },
];
