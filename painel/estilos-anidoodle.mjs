// estilos-anidoodle.mjs: os 32 estilos do motor Anidoodle, em português, para a aba de escolha.
// A skill é de outra pessoa: aqui ficam só o rótulo, uma frase de apoio e onde cada estilo está na folha de amostras
// que vem com ela (assets/styles.jpg, 8 colunas por 4 linhas). A miniatura é recortada dessa folha na hora de mostrar,
// então nenhuma imagem do autor entra no pacote do painel. A lista é filtrada pelo engine/styles.gen.json da skill
// instalada: um estilo que ela tirar some da aba, e um que ela acrescentar aparece em "outros" até ganhar tradução.
import fs from "node:fs";
import path from "node:path";

export const ANIDOODLE_GROUPS = [
  ["desenho", "Desenho", "Lápis, carvão, caneta, giz e gravura: o traço aparece e a cena se desenha diante de quem assiste."],
  ["pintura", "Pintura", "Aquarela, guache, óleo e nanquim de pincel: cor que se espalha e textura de papel ou tela."],
  ["papel", "Papel, tecido e impressão", "Colagem, bordado, retícula, risografia e xilogravura: o material aparece na tela."],
  ["digital", "Digital e animação", "Vetor, pixel, low-poly, isométrico, quadrinho e desenho animado antigo."],
  ["outros", "Outros", "Estilos novos da skill que o painel ainda não traduziu."],
];

// id: [nome, sobre, grupo, linha e coluna na folha de amostras]
const CATALOG = {
  ranunculus: ["Lápis e aquarela", "Grafite e aquarela de pastilha: a cor não enche todo o contorno e o lápis fica por cima.", "pintura", 0, 0],
  colouredPencil: ["Lápis de cor", "Hachura na diagonal em papel creme, cores em camadas e escuros cruzados.", "desenho", 0, 1],
  koi: ["Quadrinho a marcador", "Cor de marcador com sombra dura e um contorno pesado que engrossa longe da luz.", "digital", 0, 2],
  scrapbook: ["Álbum de arquivo", "Página amarelada com cartões rasgados, fita, gravura colorida à mão, carimbo e máquina de escrever.", "papel", 0, 3],
  pixelArt: ["Pixel art", "Grade de 120 por 120 com 16 cores, um pixel de cada vez, ampliado sem suavizar.", "digital", 0, 4],
  sumiE: ["Sumi-e (nanquim japonês)", "Um pincel de nanquim em cinco diluições sobre papel de arroz, com o selo vermelho.", "pintura", 0, 5],
  woodcut: ["Xilogravura ukiyo-e", "Gravura japonesa em blocos de madeira: traço preto, cor chapada e degradê limpo.", "papel", 0, 6],
  toyBrick: ["Bloquinhos de montar", "Peças de plástico de encaixar vistas de frente, com pinos e sombra suave no chão.", "digital", 0, 7],
  pocketWatch: ["Caneta esferográfica", "Uma caneta azul em papel creme; o tom vem só de onde fica a hachura.", "desenho", 1, 0],
  brokenColour: ["Cor partida", "Toques de óleo lado a lado, sem misturar, que o olho junta como nos impressionistas.", "pintura", 1, 1],
  scratchboard: ["Raspagem", "Tinta preta raspada com estilete, revelando o branco por baixo.", "desenho", 1, 2],
  isometric: ["Isométrico em corte", "Um ambiente aberto em corte numa grade isométrica, três tons por material e bordas limpas.", "digital", 1, 3],
  balloon: ["Giz de cera", "Giz de cera em papel com textura: preenchimento em vai e vem e contorno grosso passado duas vezes.", "desenho", 1, 4],
  paintedOil: ["Óleo sobre tela", "Tinta a óleo opaca com pincel de cerda em tela, do esboço ralo ao empasto.", "pintura", 1, 5],
  embroidery: ["Bordado à mão", "Linha de algodão bordada em linho cru, dentro do bastidor.", "papel", 1, 6],
  halftone: ["Retícula de jornal", "Impressão de jornal em pontos pretos com uma cor laranja, tinta que espalha no papel.", "papel", 1, 7],
  wren: ["Nanquim e aguada", "Aguadas que vazam da linha e assentam na borda, depois a pena que engrossa e afina.", "pintura", 2, 0],
  midCentury: ["Guache anos 50", "Guache fosco de ilustração dos anos 50, pincel seco e traço de nanquim fora do registro.", "pintura", 2, 1],
  stipple: ["Pontilhado a nanquim", "Só pontos de caneta técnica: o tom vem da quantidade de pontos.", "desenho", 2, 2],
  lowPoly: ["Low-poly", "Malha de triângulos com cada face num tom chapado, sob um sol baixo.", "digital", 2, 3],
  moonPhases: ["Quadro de giz", "Giz na lousa, traço quebrado pela textura e restos de aulas antigas apagadas.", "desenho", 2, 4],
  charcoalErasure: ["Carvão apagado e redesenhado", "Carvão esfumado, apagado com borracha e redesenhado por cima dos rastros.", "desenho", 2, 5],
  rubberHose: ["Desenho animado anos 30", "Nanquim de traço igual, braços de mangueira e cinza chapado, filmado em preto e branco.", "digital", 2, 6],
  flatVector: ["Vetor chapado", "Formas de vetor com cor chapada, sombra longa e granulado leve nos lados escuros.", "digital", 2, 7],
  fox: ["Colagem de papel recortado", "Nenhuma linha desenhada: papel rasgado de borda branca e recortes com sombra suave.", "papel", 3, 0],
  paperCraft: ["Teatrinho de papel", "Teatro de papelão com papéis recortados, bordas de cartão e camadas afastadas.", "papel", 3, 1],
  lighthouse: ["Risografia", "Camadas de tinta de risógrafo com desalinho, cores sobrepostas e retícula.", "papel", 3, 2],
  blueprint: ["Planta técnica (cianotipia)", "Linha branca de régua e compasso sobre papel azul, como desenho de engenharia.", "desenho", 3, 3],
  mellan: ["Gravura de linha única", "A imagem inteira é uma só linha gravada, que engrossa e afina conforme o tom.", "desenho", 3, 4],
  storybook: ["Livro infantil a lápis e aquarela", "Grafite e aquarela suave, feito para um personagem que volta em toda cena.", "pintura", 3, 5],
  folkTale: ["Livro de conto popular", "Guache e aquarela sobre lápis: forte na frente, aguado ao fundo e só lápis no horizonte.", "pintura", 3, 6],
  dreamGlaze: ["Óleo surreal", "Óleo liso, sem pincelada aparente, luz baixa de fim de tarde e bordas duras.", "pintura", 3, 7],
};

// a ficha do estilo dentro da skill: references/styles/<id>.md ou a do filme de desenho; sem ficha, o índice
function cardFile(skillPath, style) {
  for (const name of [style.id, style.drawFilm].filter(Boolean)) {
    const relative = path.join("references", "styles", `${name}.md`);
    if (fs.existsSync(path.join(skillPath, relative))) return relative;
  }
  return path.join("references", "styles", "INDEX.md");
}

export function anidoodleStyles(skillPath) {
  if (!skillPath) return [];
  let installed;
  try { installed = JSON.parse(fs.readFileSync(path.join(skillPath, "engine", "styles.gen.json"), "utf8")); } catch { return []; }
  return installed.map((style) => {
    const [nome, sobre, grupo, linha, coluna] = CATALOG[style.id] || [style.name, style.medium, "outros", null, null];
    return { id: style.id, nome, sobre: `${sobre} (${style.name})`, grupo, ficha: cardFile(skillPath, style),
      folha: linha === null ? null : { linha, coluna } };
  });
}
