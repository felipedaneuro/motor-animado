// filme.js: as peças do estilo de tipografia sobre fundo de filme. A moldura com perfurações, o título em duas
// linhas com a segunda numa etiqueta amarela, a janela central e a barra de XP do canto.
//
//   filmFrame(root, style)                 a moldura: perfurações nas laterais e marcas + nos cantos
//   twoLineTitle(root, style, titulos)     -> draw(t): [{at, until, linha1, linha2}]
//   stageWindow(root, style)               -> {draw(t, html), element}: a janela central
//   xpBar(root, style, {rotulo})           -> draw(t, 0..1)
const CSS = `
.flm { position: absolute; z-index: 6; font-family: Inter, system-ui, sans-serif; opacity: 0; }
.flm.on { opacity: 1; }
.flm-moldura { inset: 0; opacity: 1; }
.flm-furos { position: absolute; top: 0; bottom: 0; width: 26px;
  background: repeating-linear-gradient(to bottom, #d8c8a4 0 18px, transparent 18px 46px); opacity: .5; }
.flm-marca { position: absolute; color: #d8c8a4; font-size: 34px; opacity: .55; }
.flm-titulo { left: 60px; right: 60px; top: 120px; text-align: center; }
.flm-titulo .l1 { font-size: 64px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; color: #f1e7d2; }
.flm-titulo .l2 { display: inline-block; margin-top: 12px; background: #e1ae52; color: #1a1408; border-radius: 10px;
  padding: 8px 22px; font-size: 56px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; }
.flm-janela { left: 110px; right: 110px; top: 330px; min-height: 520px; background: #16120a;
  border: 3px solid #4a3f2a; border-radius: 12px; padding: 26px; color: #e4d9c0; font-size: 30px; line-height: 1.5; }
.flm-xp { right: 50px; bottom: 150px; display: flex; align-items: center; gap: 10px; font-size: 22px;
  font-weight: 800; letter-spacing: 2px; color: #cdbf9f; }
.flm-xp u { width: 190px; height: 12px; background: #2a2318; border-radius: 999px; text-decoration: none; }
.flm-xp u i { display: block; height: 100%; border-radius: 999px; background: #5aa0f0; }
`;

function node(root, className) {
  if (!document.getElementById("flm-css")) {
    const tag = document.createElement("style");
    tag.id = "flm-css";
    tag.textContent = CSS;
    document.head.append(tag);
  }
  const div = document.createElement("div");
  div.className = `flm ${className} on`;
  root.append(div);
  return div;
}

export function filmFrame(root, style) {
  const div = node(root, "flm-moldura");
  const { width = 1080, height = 1920 } = style.format || {};
  div.innerHTML = `<span class="flm-furos" style="left:8px"></span><span class="flm-furos" style="right:8px"></span>` +
    [[46, 60], [width - 70, 60], [46, height - 120], [width - 70, height - 120]]
      .map(([x, y]) => `<span class="flm-marca" style="left:${x}px;top:${y}px">+</span>`).join("");
  return div;
}

export function twoLineTitle(root, style, titulos = []) {
  const div = node(root, "flm-titulo");
  return function draw(t) {
    const agora = titulos.find((x) => t >= x.at && t < x.until);
    div.classList.toggle("on", Boolean(agora));
    if (agora) div.innerHTML = `<div class="l1">${agora.linha1}</div><div><span class="l2">${agora.linha2}</span></div>`;
  };
}

export function stageWindow(root, style) {
  const div = node(root, "flm-janela");
  return { element: div, draw(t, html = "") { div.innerHTML = html; } };
}

export function xpBar(root, style, { rotulo = "XP" } = {}) {
  const div = node(root, "flm-xp");
  return function draw(t, quanto = 0) {
    div.innerHTML = `<span>${rotulo}</span><u><i style="width:${Math.round(Math.max(0, Math.min(1, quanto)) * 100)}%"></i></u>`;
  };
}
