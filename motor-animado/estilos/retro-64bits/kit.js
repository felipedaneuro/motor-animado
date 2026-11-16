// kit.js: o cenário deste estilo é **desenhado em pixel**, não modelado em low-poly: `pixelWorld` pinta o céu, a
// serra, a mata, a moita e o chão em camadas de pixel art (motor/cenario.js), e `pixelSprite` faz os objetos da
// cena na mesma grade. O apresentador é o **busto em pixel** — o retrato fixo de caixa de diálogo dos jogos
// antigos (`bustCorner(root, style)`).
//
// `dayWorld` aponta para o mundo em pixel de propósito, para uma cena antiga continuar certa neste estilo. O mundo
// low-poly original ficou como `lowpolyWorld`, para quem quiser o contraste; a pessoa (`person`) e o mascote de
// cabeça grande (`mascot`) continuam aqui para quem precisar de um corpo inteiro.
export { pixelWorld, pixelSprite, pixelTile, ICONS } from "../motor/cenario.js";
export { pixelWorld as dayWorld } from "../motor/cenario.js";
export { dayWorld as lowpolyWorld, studio, accent } from "../motor/mundo.js";
export { bustCorner, bustPlane, dialogPortrait, bustTexture } from "../motor/busto.js";
export { bustCorner as presenter } from "../motor/busto.js";
export { person, PERSON_POSES } from "../motor/pessoa.js";
export { mascot, MASCOT_POSES } from "../motor/mascote.js";
