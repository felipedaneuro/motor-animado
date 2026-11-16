// plano.js do exemplo do kinetic-creme: uma etapa por frase. Sem câmera: o estilo é todo a camada de cima.
import timing from "./tempos.js";
import { clock } from "./motor/nucleo.js";

const { duration } = clock(timing);
const fim = (i) => (timing.phrases[i + 1]?.start ?? duration);

const PASSOS = [
  { texto: "PASSO 1 › PAUTA", palavras: ["Ela", "*acha", "o assunto"], cartao: "<b>pauta.txt</b><br><br>o que a pessoa pergunta<br>o que ninguém explicou<br>o número que surpreende" },
  { texto: "PASSO 2 › ROTEIRO", palavras: ["Ela", "*escreve", "o roteiro"], cartao: "<b>roteiro.txt</b><br><br>[curious] Você já reparou…<br>[serious] O que acontece é…<br>[hopeful] E dá para mudar." },
  { texto: "PASSO 3 › VOZ", palavras: ["Ela", "*grava", "a voz"], cartao: "<b>voz.wav</b><br><br>▇▅▇▂▆▇▃▅▇▂▆▇▅▃<br><br>32,9 s · −14 LUFS" },
  { texto: "PASSO 4 › CENA", palavras: ["Ela", "*monta", "a cena"], cartao: "<b>cena/js</b><br><br>plano.js · os tempos<br>cena.js · o que aparece<br>mapa.jpg · a conferência" },
  { texto: "PASSO 5 › EDIÇÃO", palavras: ["Ela", "*edita", "o vídeo"], cartao: "<b>montagem</b><br><br>▬▬▬ voz<br>▬▬ efeitos<br>▬ música" },
  { texto: "PASSO 6 › ENTREGA", palavras: ["E", "*entrega", "pronto"], cartao: "<b>video-v1-final.mp4</b><br><br>1080×1920 · 30 qps<br>−14 LUFS · sem corte seco" },
];

export const ETAPAS = timing.phrases.map((frase, i) => ({ at: frase.start, until: fim(i), ...PASSOS[i % PASSOS.length] }));
export const LABELS = [];
export const CARDS = [];
export const HIGHLIGHTS = [timing.phrases[0].words[0].word];
export const CAMERA = { start: { position: [0, 0, 10], target: [0, 0, 0] }, moves: [] };
