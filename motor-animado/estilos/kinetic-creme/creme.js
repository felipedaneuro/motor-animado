// creme.js: as peças do único estilo claro da casa. Fundo creme com a cidade em traço, cápsula de etapa, título
// que aparece palavra por palavra, cartão branco com sombra e barra de progresso. Tudo em HTML, função de t.
//
//   cremeBackdrop(root, style)                -> o fundo e o skyline (fica atrás de tudo)
//   stepChip(root, style, etapas)             -> draw(t): a cápsula "SKILL 1 › ROTEIRO"
//   wordTitle(root, style, titulos)           -> draw(t): o título palavra por palavra, chave em laranja
//   whiteCard(root, style)                    -> {draw(t, html), element}: o cartão branco central
//   progressBar(root, style, {nome, total})   -> draw(t, passo)
const CSS = `
.crm { position: absolute; z-index: 6; font-family: Inter, system-ui, sans-serif; opacity: 0; }
.crm.on { opacity: 1; }
.crm-fundo { inset: 0; background: var(--crm-fundo, #e9e1d1); opacity: 1; z-index: 1; }
.crm-cidade { position: absolute; left: 0; right: 0; bottom: 0; height: 320px; opacity: .35; }
.crm-chip { left: 0; right: 0; top: 150px; text-align: center; }
.crm-chip span { background: #fff; border-radius: 999px; padding: 10px 24px; font-size: 26px; font-weight: 700;
  letter-spacing: 2px; color: #7a6a58; box-shadow: 0 4px 12px rgba(80,60,30,.12); }
.crm-titulo { left: 70px; right: 70px; top: 230px; text-align: center; font-size: 76px; font-weight: 800;
  line-height: 1.15; color: #2a2118; }
.crm-titulo b { color: #d2721f; }
.crm-titulo i { font-style: normal; opacity: .001; }
.crm-cartao { left: 90px; right: 90px; top: 520px; background: #fff; border-radius: 22px; padding: 28px;
  min-height: 620px; box-shadow: 0 24px 50px rgba(80,60,30,.22); color: #2a2118; font-size: 30px; line-height: 1.5; }
.crm-barra { left: 90px; right: 90px; bottom: 150px; display: flex; align-items: center; gap: 14px;
  font-size: 24px; color: #7a6a58; font-weight: 700; letter-spacing: 1px; }
.crm-barra u { flex: 1; height: 10px; border-radius: 999px; background: #d8cdb9; text-decoration: none; }
.crm-barra u i { display: block; height: 100%; border-radius: 999px; background: #d2721f; }
`;

function node(root, className) {
  if (!document.getElementById("crm-css")) {
    const tag = document.createElement("style");
    tag.id = "crm-css";
    tag.textContent = CSS;
    document.head.append(tag);
  }
  const div = document.createElement("div");
  div.className = `crm ${className} on`;
  root.append(div);
  return div;
}

export function cremeBackdrop(root, style) {
  const div = node(root, "crm-fundo");
  const p = style.palette || [];
  root.style.setProperty("--crm-fundo", p[0] || "#e9e1d1");
  // a cidade: prédios em traço, desenhados uma vez em SVG (a referência usa contorno fino, sem preenchimento)
  const w = style.format?.width || 1080;
  let d = "";
  for (let x = 0, k = 0; x < w; k++) {
    const largura = 60 + ((k * 37) % 70), altura = 70 + ((k * 53) % 180);
    d += `M${x} 320 V${320 - altura} H${x + largura} V320 `;
    for (let j = 1; j < Math.floor(altura / 38); j++) d += `M${x + 12} ${320 - j * 38} h${largura - 24} `;
    x += largura + 16;
  }
  div.innerHTML = `<svg class="crm-cidade" viewBox="0 0 ${w} 320" preserveAspectRatio="none">
    <path d="${d}" fill="none" stroke="#8a7a66" stroke-width="3"/></svg>`;
  return div;
}

export function stepChip(root, style, etapas = []) {
  const div = node(root, "crm-chip");
  return function draw(t) {
    const agora = etapas.find((e) => t >= e.at && t < e.until);
    div.classList.toggle("on", Boolean(agora));
    if (agora) div.innerHTML = `<span>${agora.texto}</span>`;
  };
}

// o título entra palavra por palavra; as marcadas com * saem em laranja
export function wordTitle(root, style, titulos = [], { porSegundo = 2.6 } = {}) {
  const div = node(root, "crm-titulo");
  return function draw(t) {
    const agora = titulos.find((x) => t >= x.at && t < x.until);
    div.classList.toggle("on", Boolean(agora));
    if (!agora) return;
    const quantas = Math.floor((t - agora.at) * porSegundo) + 1;
    div.innerHTML = agora.palavras.map((p, i) => {
      const texto = p.replace(/^\*/, ""), chave = p.startsWith("*");
      const corpo = chave ? `<b>${texto}</b>` : texto;
      return i < quantas ? corpo : `<i>${corpo}</i>`;
    }).join(" ");
  };
}

export function whiteCard(root, style) {
  const div = node(root, "crm-cartao");
  return { element: div, draw(t, html = "") { div.innerHTML = html; } };
}

export function progressBar(root, style, { nome = "", total = 9 } = {}) {
  const div = node(root, "crm-barra");
  return function draw(t, passo = 1) {
    div.innerHTML = `<span>${nome}</span><u><i style="width:${Math.round((passo / total) * 100)}%"></i></u><span>${passo}/${total}</span>`;
  };
}
