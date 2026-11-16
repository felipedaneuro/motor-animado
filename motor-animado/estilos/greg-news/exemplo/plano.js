// plano.js de partida do estilo greg-news: um só plano (a bancada), quase sempre parado mas nunca 100% congelado
// (ver receita.md, seção 2), o card do tema no canto desde o começo do bloco, e risada/aplauso por amostra no
// momento de reação (troque os arquivos de som/imagem pelos seus — ver receita.md e referencias/{cena-web,som}.md).
// Sem ticker: a decupagem real não mostrou nenhum nos 3 trechos (pesquisa.md) — o estilo.json não liga essa seção.
import timing from "./tempos.js";
import { clock, orbit } from "./motor/nucleo.js";

const { wordStart, phraseStart, phraseEnd, duration } = clock(timing);

export const T = {
  intro: phraseStart(0),
  estudo: wordStart(1, "estudo"),
  piada: phraseStart(2),
  reacao: phraseStart(3) + 0.3,
  fecho: phraseStart(4),
  pedido: phraseStart(5),
  end: duration,
};

// o card do tema fica no canto o bloco inteiro (medido: 8,5s+ contínuos, não um pop rápido) — troque "ícone" por
// uma image sua se quiser (um desenho, não um print) dentro de cena/imagens/
export const CARDS = [
  { at: 0.15, until: T.fecho, icon: "🚦", text: "TRÂNSITO", x: 230 },   // canto esquerdo, não centro (medido)
];

// se a pessoa mostrar um print/manchete real (recorte jornalístico com fonte citada), use full:true — não é o card
// de tema (esse fica pequeno, no canto); troque "imagens/estudo-exemplo.png" por um print seu, nunca baixado sem
// checar a licença (fica comentado aqui porque não foi confirmado nos 3 trechos decupados — ver pesquisa.md):
// { at: T.estudo - 0.1, until: T.estudo + 3, image: "imagens/estudo-exemplo.png", full: true, text: "Fonte: ..." }

export const HIGHLIGHTS = ["estudo", "duas"];

// o alvo da câmera: acima da cabeça do busto, não o tampo da bancada. Com o alvo em 1,1 a bancada tomava
// metade do quadro; com ele em 1,95 a legenda passa acima da cabeça e a bancada vira uma faixa na base.
const bancadaPoint = [0, 1.95, 0.6];
export const CAMERA = {
  start: { position: orbit(bancadaPoint, 0, 6, 3.8), target: bancadaPoint },
  moves: [
    { kind: "approach", at: T.intro, position: orbit(bancadaPoint, 0, 7, 3.34), target: bancadaPoint },
    // a câmera quase não se move no rant (parada), mas acompanha mais perto a reação (fim, medido: 36% parada)
    { kind: "approach", at: T.reacao, position: orbit(bancadaPoint, 4, 7, 3.0), target: bancadaPoint },
    { kind: "approach", at: T.fecho, position: orbit(bancadaPoint, 0, 6, 3.34), target: bancadaPoint },
  ],
};

// risada e aplauso são amostras (arquivo .wav seu), nunca sintetizados — ver referencias/som.md.
// os arquivos abaixo são placeholders: grave ou baixe com licença e ponha em som/amostras/ antes de rodar o sons.py
export const SOUNDS = [
  { sound: "amostra", arquivo: "som/amostras/risada-exemplo.wav", at: T.piada + 0.4, volume: 0.6 },
  { sound: "amostra", arquivo: "som/amostras/aplausos-exemplo.wav", at: T.reacao, volume: 0.5 },
];
export { wordStart };
