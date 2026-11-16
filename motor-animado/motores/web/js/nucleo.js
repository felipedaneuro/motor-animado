// nucleo.js: números, curvas e o relógio das palavras. Não importa three.js, então o Node também lê este arquivo
// (o sons.py usa isso para achar o tempo de cada evento sem adivinhar nada).
// Regra de ouro: tudo é função do tempo t. Nada de Math.random, relógio ou estado guardado entre quadros:
// o HyperFrames pede qualquer quadro, em qualquer ordem, em vários processos ao mesmo tempo.

export const clamp = (x, low = 0, high = 1) => Math.min(high, Math.max(low, x));
export const lerp = (a, b, u) => a + (b - a) * u;
export const radians = (degrees) => (degrees * Math.PI) / 180;

// curvas de 0 a 1
export const smooth = (u) => { u = clamp(u); return u * u * (3 - 2 * u); };
export const easeOut = (u) => 1 - Math.pow(1 - clamp(u), 3);
// sai rápido e freia devagar: a câmera "drone que chega" do estilo palito
export const expoOut = (u) => { u = clamp(u); return u >= 1 ? 1 : 1 - Math.pow(2, -10 * u); };
export const easeInOut = (u) => { u = clamp(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
export const EASINGS = { smooth, easeOut, expoOut, easeInOut };

// 0 antes de start, 1 depois de start + duration
export const between = (t, start, duration = 0.5, ease = smooth) => ease((t - start) / duration);

// entra em t0 com um pulinho (passa de 1 e volta) e sai em t1, se houver. Nada some de uma vez: sumir de repente
// vira corte seco no conferir.py.
export function pop(t, t0, t1 = Infinity, duration = 0.35) {
  if (t < t0 || t > t1 + duration) return 0;
  const u = clamp((t - t0) / duration);
  const entering = u < 1 ? 1 + 0.25 * Math.sin(Math.PI * u) - (1 - u) * (1 - u) * 1.25 : 1;
  return t > t1 ? Math.max(0, 1 - (t - t1) / duration) * entering : Math.max(0, entering);
}

// um número "aleatório" fixo para cada i: o mesmo em todo quadro e em todo processo
export const seeded = (i) => { const x = Math.sin(i * 91.17 + 47.3) * 24634.6345; return x - Math.floor(x); };
// pisca-pisca de destaque. O ritmo padrão (0,35 s por fase, menos de 1,5 piscada por segundo) fica bem abaixo
// do limite de 3 piscadas por segundo para quem tem fotossensibilidade; o conferir.py verifica isso.
export const blink = (t, t0, duration = 1.4, rhythm = 0.35) => t >= t0 && t < t0 + duration && Math.floor((t - t0) / rhythm) % 2 === 0;

// o caminho de qualquer coisa: começa em `initial`; cada [t0, target, duration] leva até target. Serve para posição,
// escala ou cor. path([0, 1, 0], [[2, [5, 1, 0], 1.2]])(t) -> [x, y, z]
export function path(initial, moves, ease = smooth) {
  const ordered = [...moves].sort((a, b) => a[0] - b[0]);
  return (t) => {
    const value = [...initial];
    for (const [t0, target, duration = 0.8] of ordered) {
      if (t < t0) break;
      const u = ease((t - t0) / duration);
      for (let k = 0; k < value.length; k++) value[k] = lerp(value[k], target[k], u);
    }
    return value;
  };
}

// órbita em volta de um alvo: giro e inclinação em graus, distância. Para câmeras do tipo "K(t, alvo, giro, incl, dist)"
export function orbit(target, azimuthDeg, elevationDeg, distance) {
  const a = (azimuthDeg * Math.PI) / 180, e = (elevationDeg * Math.PI) / 180;
  return [target[0] + distance * Math.cos(e) * Math.sin(a), target[1] + distance * Math.sin(e), target[2] + distance * Math.cos(e) * Math.cos(a)];
}

// ---------- o relógio das palavras ----------
export const normalizeWord = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9-]/g, "");

// timing: o tempos.js gerado pelo montar.py ({duration, phrases: [{text, start, end, words: [{word, start, end}]}]})
export function clock(timing) {
  const phrases = timing.phrases;
  // quando começa a n-ésima palavra que começa com `word` na frase i (a 1ª frase é a 0)
  const wordStart = (i, word, n = 0) => {
    const phrase = phrases[i];
    if (!phrase) throw new Error(`não existe a frase ${i} (o roteiro tem ${phrases.length})`);
    const found = phrase.words.filter((w) => normalizeWord(w.word).startsWith(normalizeWord(word)));
    if (!found[n]) throw new Error(`"${word}" não está na frase ${i}: ${phrase.text}`);
    return found[n].start;
  };
  const phraseStart = (i) => (i < phrases.length ? phrases[i].start : timing.duration);
  const phraseEnd = (i) => phrases[Math.min(i, phrases.length - 1)].end;
  return { wordStart, phraseStart, phraseEnd, duration: timing.duration };
}
