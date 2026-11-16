// clinica.js: o box de emergência dos estilos med3d, desenhado inteiro — sala, maca, paciente, monitor e soro —
// em dois visuais. Nenhum boneco 3D articulado: o paciente e o médico são desenhos.
//
//   clinicRoom(cena, style, {look, x0, x1})  -> update(t)
//   CLINIC_LOOKS                             -> os visuais que existem
//
// look "palito"  : formas simples e cores saturadas, com as pessoas desenhadas em 2D num plano virado pra câmera,
//                  do mesmo jeito que o estilo `palito` faz (o traço é o mesmo, o cenário é um quarto).
// look "pixel"   : tudo em pixel art chapada, sem luz e sem névoa, como o cenário do `retro-64bits`.
//
// O quadro é em pé (9:16) e a câmera dos med3d fica a uns 8 m com fov 40: sobra pouco mais de 3 m de largura. Por
// isso tudo o que importa cabe numa faixa estreita no meio, e a parede é larga só o bastante para os cortes de
// lado (±2,8 m) não acharem a beirada.
import * as THREE from "three";
import { box, material } from "./formas.js";
import { pixelTile } from "./cenario.js";

export const CLINIC_LOOKS = ["palito", "pixel"];

const CHAO = -1.4, PAREDE_Z = -2.2;

// as cores de cada visual. O que vier da paleta medida do estilo entra onde faz sentido (parede e chão); o resto é
// escolha do visual, porque uma paleta de foto não tem "azul de jaleco".
function cores(style, look) {
  const p = style.palette || [];
  const clinica = style.clinic || {};
  const base = look === "pixel"
    ? { parede: "#3a4a63", paredeAlta: "#4b5e7a", rodape: "#27334a", chao: "#5a6b7d", chaoRisco: "#4a5a6b",
        maca: "#d8dde4", colchao: "#3f7fa8", lencol: "#eef3f7", metal: "#9aa6b4", monitor: "#141a24",
        tela: "#0d1f1c", traco: "#5ef2a8", soro: "#bfe3f2", pele: "#e3ab7e", cabelo: "#2d2118",
        jaleco: "#f2f5f8", roupa: "#2f7fb0", tinta: "#10131a", branco: "#f6f9fb", alerta: "#e0415a" }
    : { parede: "#dfe9ef", paredeAlta: "#eef4f7", rodape: "#3b6fd8", chao: "#c3d2da", chaoRisco: "#b3c4ce",
        maca: "#f4f7f9", colchao: "#3b6fd8", lencol: "#ffffff", metal: "#aab6bf", monitor: "#16222b",
        tela: "#0f2a26", traco: "#2ee6a8", soro: "#cfe9f6", pele: "#f1c9a5", cabelo: "#3b2b20",
        jaleco: "#ffffff", roupa: "#ff7a1a", tinta: "#16171b", branco: "#ffffff", alerta: "#d8342b" };
  // a parede e o chão aceitam a cor medida do estilo, quando ela existe
  const medido = { parede: p[1], chao: p[5] };
  for (const [chave, valor] of Object.entries(medido)) if (valor) base[chave] = valor;
  // e o painel manda por cima, se a pessoa escolheu
  for (const [chave, valor] of Object.entries(clinica)) if (valor && chave in base) base[chave] = valor;
  return base;
}

// ---------- as pessoas, desenhadas num plano ----------
// um desenho vira plano virado pra câmera: é assim que o palito põe gente num mundo 3D sem boneco articulado
function desenho(scene, { canvas, texture }, { width, height, position, pixel }) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({
    map: texture, transparent: true, alphaTest: 0.5, fog: false, side: THREE.DoubleSide,
  }));
  mesh.position.set(...position);
  scene.add(mesh);
  if (!pixel) texture.magFilter = texture.minFilter = THREE.LinearFilter;
  return mesh;
}

function folha(width, height, pixel) {
  if (pixel) return pixelTile(width, height, 8);
  const canvas = document.createElement("canvas");
  canvas.width = width * 8;
  canvas.height = height * 8;
  const context = canvas.getContext("2d");
  const px = (x, y, w, h, color) => { context.fillStyle = color; context.fillRect(x * 8, y * 8, w * 8, h * 8); };
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { canvas, texture, px, context, width, height };
}

// o pincel de cada visual. É aqui que os dois traços se separam: no **pixel** tudo cai na grade (curva vira
// degrau, que é o jeito da pixel art); no **palito** o mesmo desenho sai em curva lisa de canvas.
function pincel(s, pixel) {
  const E = 8;                                        // quantos pontos de canvas tem cada casa da grade
  const circulo = (cx, cy, r, cor) => {
    if (pixel) {
      for (let y = -r; y <= r; y++) {
        const half = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)));
        s.px(cx - half, cy + y, half * 2, 1, cor);
      }
      return;
    }
    s.context.fillStyle = cor;
    s.context.beginPath();
    s.context.arc((cx + 0.5) * E, (cy + 0.5) * E, r * E, 0, Math.PI * 2);
    s.context.fill();
  };
  // uma cabeça que se lê: o cabelo é uma touca por cima, e o rosto volta por baixo dele — sem isso o cabelo
  // cobre o rosto inteiro e a pessoa vira um borrão escuro
  const cabeca = (cx, cy, r, c) => {
    circulo(cx, cy, r, c.pele);
    circulo(cx, cy - r * 0.42, r * 1.04, c.cabelo);
    circulo(cx, cy + r * 0.24, r * 0.88, c.pele);
  };
  // o monte do corpo sob o lençol: os pontos são [x, topo] na grade
  const monte = (pontos, baixo, cor, borda) => {
    if (pixel) {
      for (let x = pontos[0][0]; x <= pontos[pontos.length - 1][0]; x++) {
        const topo = Math.round(interpola(pontos, x));
        s.px(x, topo, 1, baixo - topo, cor);
        s.px(x, topo, 1, 1, borda);
      }
      return;
    }
    const ctx = s.context;
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.moveTo(pontos[0][0] * E, baixo * E);
    for (const [x, y] of pontos) ctx.lineTo(x * E, y * E);
    ctx.lineTo(pontos[pontos.length - 1][0] * E, baixo * E);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = borda;
    ctx.lineWidth = E * 0.7;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(pontos[0][0] * E, pontos[0][1] * E);
    for (const [x, y] of pontos) ctx.lineTo(x * E, y * E);
    ctx.stroke();
  };
  return { px: s.px, circulo, cabeca, monte };
}

// a altura do lençol numa coluna, entre os pontos do perfil, com uma curva macia
function interpola(pontos, x) {
  for (let k = 0; k < pontos.length - 1; k++) {
    const [x0, y0] = pontos[k], [x1, y1] = pontos[k + 1];
    if (x < x0 || x > x1) continue;
    const u = (x - x0) / (x1 - x0);
    return y0 + (y1 - y0) * (u * u * (3 - 2 * u));
  }
  return pontos[pontos.length - 1][1];
}

// o corpo deitado sob o lençol, na grade da maca: ombro, peito, cintura, joelho dobrado e pé
// o corpo sob o lençol, do peito aos pés: peito, cintura, joelho dobrado e pé. Sem bico: um ponto alto demais
// abre uma cunha escura entre a linha do lençol e o fundo, e a cunha se lê como um corte no corpo.
const PERFIL = [[36, 21], [46, 23], [56, 26], [65, 21], [74, 26], [85, 28]];

// a maca com o paciente, num desenho só: suporte de soro, rodas, estrado, colchão, travesseiro e o corpo deitado
// sob o lençol, de perfil, com a cabeça à esquerda. Grade de 96 por 60.
//
// Maca e paciente vêm juntos de propósito. Numa maca em 3D com o paciente desenhado num plano em pé, os dois
// brigam: o colchão tapa o corpo e sobra só a cabeça boiando. Num desenho só, a cena se lê de primeira.
function pintaMaca(s, c, pixel) {
  const b = pincel(s, pixel);
  b.px(4, 14, 3, 32, c.metal);                       // o suporte de soro
  b.px(1, 4, 10, 11, c.soro);
  b.px(1, 4, 10, 1, c.branco);
  b.px(5, 15, 1, 14, c.soro);                        // o equipo descendo da bolsa
  for (const x of [15, 79]) {                        // as pernas e as rodas
    b.px(x, 44, 4, 12, c.metal);
    b.circulo(x + 2, 57, 3, c.tinta);
  }
  b.px(11, 40, 76, 5, c.metal);                      // o estrado
  // o colchão tem cor própria: com ele quase branco, como era, colchão e lençol viram uma laje só e o corpo
  // deitado desaparece dentro dela
  b.px(11, 33, 76, 8, c.colchao);
  b.px(11, 33, 76, 1, c.maca);
  b.px(13, 26, 22, 9, c.branco);                     // o travesseiro
  b.px(13, 26, 22, 1, c.lencol);
  // o corpo é uma silhueta ligada, desenhada de trás pra frente: cabeça, pescoço, tronco, lençol por cima e o
  // braço apoiado no lençol, saindo do ombro. Cada peça encosta na seguinte de propósito — com folga entre elas
  // o paciente se lê como pedaços soltos, não como uma pessoa deitada.
  //
  // As medidas importam tanto quanto as ligações: a cabeça tem 11 das 60 unidades de altura da grade, para um
  // corpo de 60 de comprimento, e o braço tem 16 — um braço do tamanho do corpo vira um membro solto no lençol.
  b.px(28, 25, 6, 6, c.pele);                        // o pescoço, do queixo ao ombro
  b.cabeca(25, 23, 5.5, c);
  b.px(21, 24, 2, 1, c.tinta);                       // os olhos fechados, dois traços
  b.px(26, 24, 2, 1, c.tinta);
  b.px(23, 27, 3, 1, c.tinta);                       // a boca
  b.px(32, 22, 10, 11, c.roupa);                     // o tronco, no avental, encostando no pescoço
  b.monte(PERFIL, 35, c.lencol, c.branco);           // o lençol, do peito aos pés
  b.px(36, 33, 50, 2, c.maca);                       // a sombra do lençol na borda do colchão
  b.px(36, 25, 16, 4, c.pele);                       // o braço, do ombro até a mão, por cima do lençol
  b.circulo(53, 27, 2.5, c.pele);                    // a mão
  b.px(52, 22, 2, 4, c.metal);                       // o acesso venoso nas costas da mão
}

// o médico de pé, de frente, de corpo inteiro. Numa grade de 24 por 48.
function pintaMedico(s, c, pixel) {
  const b = pincel(s, pixel);
  b.px(11, 12, 3, 3, c.pele);                 // o pescoço, antes da cabeça
  b.cabeca(12, 8, 4.5, c);
  b.px(10, 8, 1, 1, c.tinta);                 // os olhos
  b.px(14, 8, 1, 1, c.tinta);
  b.px(11, 11, 3, 1, c.tinta);                // a boca
  b.px(7, 14, 11, 19, c.jaleco);              // o jaleco, até a coxa
  b.px(7, 14, 11, 1, c.branco);
  b.px(10, 14, 5, 8, c.roupa);                // a gola da roupa por baixo
  b.px(4, 15, 3, 16, c.jaleco);               // os braços
  b.px(18, 15, 3, 16, c.jaleco);
  b.px(4, 31, 3, 3, c.pele);                  // as mãos
  b.px(18, 31, 3, 3, c.pele);
  b.px(10, 15, 5, 1, c.metal);                // o estetoscópio no pescoço
  b.px(9, 16, 1, 6, c.metal);
  b.px(15, 16, 1, 6, c.metal);
  b.px(8, 33, 4, 13, c.roupa);                // as pernas
  b.px(13, 33, 4, 13, c.roupa);
  b.px(8, 45, 4, 2, c.tinta);                 // os sapatos
  b.px(13, 45, 4, 2, c.tinta);
}

// ---------- o monitor: a única coisa que anda sozinha na cena ----------
function monitorScreen(scene, c, { position, width = 1.1, height = 0.78, pixel }) {
  const s = folha(64, 44, pixel);
  const mesh = desenho(scene, s, { width, height, position, pixel });
  let passo = -1;
  // a curva: um pulso que atravessa a tela e volta, como num monitor de verdade
  const pulso = (x) => {
    const d = x % 24;
    if (d < 7) return 0;
    if (d < 9) return -2;
    if (d === 9) return 10;
    if (d === 10) return -5;
    if (d < 14) return 0;
    if (d < 16) return 3;
    return 0;
  };
  return function update(t) {
    const agora = Math.floor(t * 14) % 64;
    if (agora === passo) return;
    passo = agora;
    s.px(0, 0, 64, 44, c.tela);
    s.px(0, 0, 64, 2, c.monitor);
    s.px(2, 3, 10, 3, c.traco);                               // o rótulo "ECG" como um bloco
    for (let x = 0; x < 64; x++) {
      const y = 24 - pulso((x + agora) % 64);
      s.px(x, Math.max(4, Math.min(40, y)), 1, 2, x === agora ? c.branco : c.traco);
    }
    s.px(46, 34, 16, 6, c.alerta);                            // o número grande no canto
    s.texture.needsUpdate = true;
  };
}

// ---------- a sala ----------
// as paredes, o chão, a maca e o soro. Em "palito" são formas 3D simples; em "pixel", painéis chapados.
function sala(scene, c, look) {
  const pixel = look === "pixel";
  if (pixel) {
    const parede = folha(96, 72, true);
    for (let y = 0; y < 72; y++) parede.px(0, y, 96, 1, y < 40 ? c.paredeAlta : c.parede);
    for (let x = 0; x < 96; x += 2) parede.px(x, 39, 1, 1, c.rodape);         // o friso, pontilhado
    parede.px(0, 66, 96, 6, c.rodape);
    // uma janela de cada lado, com caixilho: dá profundidade sem competir com a maca no centro
    for (const x0 of [10, 70]) {
      parede.px(x0, 10, 16, 20, c.monitor);
      parede.px(x0 + 1, 11, 14, 18, c.soro);
      parede.px(x0 + 7, 11, 2, 18, c.monitor);
      parede.px(x0 + 1, 19, 14, 2, c.monitor);
    }
    desenho(scene, parede, { width: 9, height: 6.8, position: [0, 1.0, PAREDE_Z], pixel: true });
    const chao = folha(96, 40, true);
    for (let y = 0; y < 40; y++) for (let x = 0; x < 96; x += 8) chao.px(x, y, 8, 1, (x / 8 + Math.floor(y / 8)) % 2 ? c.chao : c.chaoRisco);
    const piso = desenho(scene, chao, { width: 9, height: 4, position: [0, CHAO, 0.3], pixel: true });
    piso.rotation.x = -Math.PI / 2;
  } else {
    scene.add(box(9, 6.8, 0.2, c.parede, [0, 1.0, PAREDE_Z]));
    scene.add(box(9, 0.5, 0.26, c.rodape, [0, CHAO + 0.25, PAREDE_Z + 0.02]));
    scene.add(box(9, 0.14, 0.26, c.rodape, [0, 1.3, PAREDE_Z + 0.02]));
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(9, 8), material(c.chao, { roughness: 0.95 }));
    piso.rotation.x = -Math.PI / 2;
    piso.position.set(0, CHAO, 0.3);
    piso.receiveShadow = true;
    scene.add(piso);
    for (const x of [-2.6, 2.6]) scene.add(box(0.9, 2.2, 0.08, c.paredeAlta, [x, 1.5, PAREDE_Z + 0.05]));
  }
}

export function clinicRoom(scene, style, { look = "palito" } = {}) {
  const visual = CLINIC_LOOKS.includes(look) ? look : "palito";
  const pixel = visual === "pixel";
  const c = cores(style, visual);
  sala(scene, c, visual);

  // a maca com o paciente: um painel só, com o pé no chão
  const sMaca = folha(96, 60, pixel);
  pintaMaca(sMaca, c, pixel);
  sMaca.texture.needsUpdate = true;
  const ALTURA_MACA = 1.9;
  const maca = desenho(scene, sMaca, { width: 3.04, height: ALTURA_MACA, position: [0, CHAO + ALTURA_MACA / 2, 0], pixel });

  // o médico fica mais perto da câmera e dentro do quadro: a câmera destes estilos enxerga pouco menos de 3 m
  // de largura, então x = 1,3 já corta o ombro dele
  const sMedico = folha(24, 48, pixel);
  pintaMedico(sMedico, c, pixel);
  sMedico.texture.needsUpdate = true;
  const ALTURA_MEDICO = 2.3;
  desenho(scene, sMedico, { width: 1.15, height: ALTURA_MEDICO, position: [0.98, CHAO + ALTURA_MEDICO / 2, 0.85], pixel });

  const tela = monitorScreen(scene, c, { position: [-0.05, 1.5, PAREDE_Z + 0.12], pixel });
  scene.add(box(1.32, 1.0, 0.14, c.monitor, [-0.05, 1.5, PAREDE_Z + 0.04]));

  return function update(t) {
    tela(t);
    maca.position.y = CHAO + ALTURA_MACA / 2 + 0.012 * Math.sin(t * 1.6);   // a respiração
  };
}
