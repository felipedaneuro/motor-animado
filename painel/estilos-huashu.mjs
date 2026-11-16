// estilos-huashu.mjs: os estilos do motor Huashu Art Motion, em português, para a aba de escolha.
// A skill é de outra pessoa e está em chinês: aqui ficam só o rótulo, a frase de apoio e a nota de qualidade que
// a própria skill publica no INDEX das fichas. A lista é filtrada pelo que existe na skill instalada, então um
// estilo que ela tirar some da aba sozinho, e um que ela acrescentar aparece pelo id até ganhar tradução aqui.
import fs from "node:fs";
import path from "node:path";

export const HUASHU_GROUPS = [
  ["material", "Jeito de pintar", "Serve para qualquer assunto: é o tratamento por cima do que você quer mostrar."],
  ["época", "Retrato de um tempo", "Puxa um período ou um artista: bom para linha do tempo, viagem no tempo e homenagem."],
  ["pesquisa", "Em pesquisa", "A própria skill marca estas fichas como ainda não validadas: o resultado varia."]];

const CARDS = path.join("references", "风格配方");

// grupo: "material" cobre qualquer assunto; "época" é retrato de um tempo (bom para linha do tempo e homenagem);
// "pesquisa" são as fichas que a própria skill marca como não validadas. nota: as estrelas do INDEX da skill.
const CATALOG = [
  // ---------- material: o jeito de pintar, por cima de qualquer assunto ----------
  ["09_postimp", "Van Gogh", "Pinceladas em redemoinho, cores fortes e contorno: o quadro inteiro se mexe.", "material", 3],
  ["13_pop", "Pop art de Lichtenstein", "Pontinhos de impressão, contorno preto grosso e balões de quadrinho.", "material", 3],
  ["14_8bit", "Pixel art 8 bits", "Tela de 240 por 135, paleta de 14 cores e contorno de 1 pixel em cada peça.", "material", 3],
  ["26_vaporwave", "Vaporwave e néon", "Brilho de néon em duas cores, grade em perspectiva e ruído de fita VHS.", "material", 3],
  ["30_matisse", "Recortes de Matisse", "Papel recortado de tesoura, cor chapada e sombra de papel pregado.", "material", 3],
  ["16_2026", "Ilustração chapada de hoje", "Blocos de cor sem contorno, granulado fino e personagens que atuam.", "material", 3],
  ["22_constructivism", "Construtivismo russo", "Foto em retícula, cunha vermelha, círculo preto e letra de cartaz.", "material", 3],
  ["12_bauhaus", "Bauhaus", "Só círculo, triângulo e quadrado, em vermelho, amarelo e azul.", "material", 3],
  ["04_roman", "Mosaico de Pompeia", "A imagem montada em pedrinhas, com argamassa entre elas.", "material", 3],
  ["08_impressionism", "Impressionismo", "Pincelada curta e cor de pastel; a luz pisca e as coisas balançam.", "material", 2],
  ["29_seurat", "Pontilhismo de Seurat", "Tudo em pontos iguais de cor pura, que se misturam no olho.", "material", 2],
  ["25_ghibli", "Aquarela do Ghibli", "Fundo em aquarela com marca d'água e sombra de desenho animado.", "material", 2],
  ["17_ink", "Nanquim chinês", "Pincel seco, mancha de tinta que se espalha, muito espaço em branco.", "material", 2],
  ["35_shinkai", "Luz de Makoto Shinkai", "Nuvem alta, raio de sol entre elas e sombra dura de celuloide.", "material", 2],
  ["11_cubism", "Cubismo analítico", "A mesma coisa vista de vários lados ao mesmo tempo, em facetas.", "material", 2],
  ["15_raytrace", "CGI dos anos 90", "Plástico brilhante, chão xadrez com reflexo e esfera cromada.", "material", 2],
  ["32_rembrandt", "Claro-escuro de Rembrandt", "Quase tudo escuro, uma luz só de janela e de vela.", "material", 1],
  // ---------- época: o retrato de um tempo ou de um artista ----------
  ["01_cave", "Pintura rupestre", "Parede de pedra, carvão e ocre; o bicho corre trocando de pose.", "época", 3],
  ["02_egypt", "Tumba egípcia", "Rosto de perfil com olho de frente, cor chapada e hieróglifo escrito à mão.", "época", 3],
  ["03_greek", "Cerâmica grega", "Silhueta preta sobre barro, linha riscada e faixa de grego correndo.", "época", 3],
  ["05_gothic", "Manuscrito gótico", "Folha de ouro com brilho que passa, trepadeira e bichinho na margem.", "época", 3],
  ["10_nouveau", "Art nouveau de Mucha", "Linha que engrossa e afina, moldura dourada que cresce, cabelo em S.", "época", 3],
  ["18_klimt", "Klimt dourado", "Rosto realista dentro de um manto plano de ouro cheio de padrão.", "época", 3],
  ["21_kusama", "Bolinhas de Kusama", "Bolinhas desenhadas à mão que crescem e encolhem, abóbora, sala de espelhos.", "época", 3],
  ["24_hopper", "Hopper", "Mancha de sol de borda dura que atravessa a parede devagar.", "época", 3],
  ["31_haring", "Keith Haring", "Boneco de traço grosso igual, linha de movimento e tudo no ritmo.", "época", 3],
  ["33_rubberhose", "Desenho animado de 1930", "Braço de mangueira, luva branca, 12 quadros por segundo e risco de filme.", "época", 3],
  ["34_shadowpuppet", "Teatro de sombras chinês", "Couro vazado contra a luz, junta de rebite e lamparina atrás do pano.", "época", 3],
  ["06_renaissance", "Renascimento", "Contorno esfumaçado, verniz amarelado e craquelê de quadro antigo.", "época", 2],
  ["19_munch", "Munch", "Linha longa e torta; o quadro inteiro se contorce e o céu fica vermelho.", "época", 2],
  ["20_dunhuang", "Mural de Dunhuang", "Fundo vermelho-terra, cor de mineral descascando, fita de apsara voando.", "época", 2],
  ["23_dali", "Dalí", "Relógio derretendo, sombra comprida, formiga, elefante de perna fina.", "época", 2],
  ["27_kirby", "Quadrinho Marvel de Kirby", "Quatro cores em retícula fora de registro e pontinhos de energia.", "época", 2],
  ["28_monet", "Monet, ninfeias", "Reflexo na água em pincelada curta, com a luz tremendo.", "época", 2],
  ["36_picasso_blue", "Picasso, fase azul", "Tudo em tons de azul, pincel largo e corpos alongados.", "época", 2],
  ["37_rick_morty", "Cartum chapado", "Desenho em SVG, contorno cinza fino, cor chapada e fundo manchado.", "época", 2],
];

// as fichas que a própria skill marca como ainda não validadas (ela chama de "receita de pesquisa")
const RESEARCH = [
  ["38_giotto", "Giotto", "Volume e narrativa do começo da pintura ocidental."],
  ["39_piero", "Piero della Francesca", "Ordem geométrica e volume claro."],
  ["40_raphael", "Rafael", "Grupos em harmonia e gesto natural."],
  ["41_michelangelo", "Michelangelo", "Corpo de escultura e tensão de pose."],
  ["42_guardi", "Guardi", "Ar, luz quebrada e borda solta."],
  ["43_lorenzetti", "Lorenzetti", "Cidade e vida social legíveis de uma vez."],
  ["44_cortona", "Pietro da Cortona", "Volume barroco e multidão em movimento."],
  ["45_renoir", "Renoir", "Quente e frio trançados, gente com calor."],
  ["46_pissarro", "Pissarro", "Rua que flui, gente dentro do ambiente."],
  ["47_sisley", "Sisley", "Ar, tempo e paisagem que se sustenta."],
  ["48_gauguin", "Gauguin", "Plano, contorno marcado e cor simbólica."],
  ["49_chagall", "Chagall", "Espaço de memória e cor de emoção."],
  ["50_ma_yuan", "Ma Yuan", "Peso de um lado só, vazio e traço econômico."],
  ["51_persian_miniature", "Miniatura persa", "Camadas de espaço e narrativa minuciosa."],
  ["52_south_park", "South Park", "Recorte de papel digital e atuação limitada."],
  ["53_pixar", "Pixar", "Forma, material e atuação de animação 3D."],
  ["55_dunhuang", "Dunhuang do período do Norte", "Cor de mineral sobre barro seco e linha voando."],
];

const stars = (n) => "★".repeat(n) + "☆".repeat(3 - n);

// os estilos que existem na skill instalada; sem a skill, a lista vem vazia e a aba nem aparece
export function huashuStyles(skillPath) {
  if (!skillPath) return [];
  const dir = path.join(skillPath, CARDS);
  if (!fs.existsSync(dir)) return [];
  const present = new Set(fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3)));
  const feito = CATALOG.filter(([id]) => present.has(id))
    .map(([id, nome, sobre, grupo, nota]) => ({ id, nome, sobre, grupo, nota: stars(nota), ficha: `${CARDS}/${id}.md` }));
  const pesquisa = RESEARCH.filter(([id]) => present.has(id))
    .map(([id, nome, sobre]) => ({ id, nome, sobre, grupo: "pesquisa", nota: "", ficha: `${CARDS}/${id}.md` }));
  const conhecidos = new Set([...CATALOG, ...RESEARCH].map(([id]) => id));
  const novos = [...present].filter((id) => !conhecidos.has(id) && /^\d/.test(id)).sort()
    .map((id) => ({ id, nome: id, sobre: "ficha nova da skill, ainda sem tradução no painel.", grupo: "pesquisa", nota: "", ficha: `${CARDS}/${id}.md` }));
  return [...feito, ...pesquisa, ...novos];
}

export const huashuStyle = (skillPath, id) => huashuStyles(skillPath).find((s) => s.id === id) || null;
