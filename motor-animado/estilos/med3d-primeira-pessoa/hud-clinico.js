// hud-clinico.js: a camada de interface que os estilos med3d põem por cima da cena 3D. Tudo em HTML por cima do
// canvas, tudo função de t, com as cores vindo do estilo.json.
//
//   statusBar(root, style, {queixa, decisoes})        -> draw(t, feitas): a faixa do topo com o contador
//   vitals(root, style, {at, itens})                  -> draw(t): PA, SpO2 e FC, vermelhos quando alterados
//   findingTags(root, style, itens)                   -> draw(t): as etiquetas de achado, uma por vez
//   decisionCard(root, style, decisoes)               -> draw(t): pergunta, opções, contagem 3-2-1 e resultado
//   summaryCard(root, style, {at, titulo, itens, pedido})  -> draw(t): o resumo numerado do fim
//
// itens de vitals: [{rotulo, valor, alvo, em}] — `valor` até o segundo `em`, `alvo` depois dele (a conduta fez efeito)
// decisoes: [{at, until, pergunta, opcoes: [texto], certa: 0, contagem: 3, aviso}]
const CSS = `
.hudc { position: absolute; z-index: 7; font-family: Inter, system-ui, sans-serif; opacity: 0; }
.hudc.on { opacity: 1; }
.hudc-topo { left: 0; right: 0; top: 24px; display: flex; justify-content: space-between; align-items: center;
  padding: 0 28px; font-size: 30px; font-weight: 700; color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,.6); }
.hudc-queixa::before { content: "●"; color: #ff4d5e; margin-right: 10px; }
.hudc-passos { display: flex; gap: 10px; align-items: center; font-size: 26px; }
.hudc-passo { width: 34px; height: 34px; border-radius: 50%; border: 3px solid rgba(255,255,255,.55);
  display: grid; place-items: center; font-size: 20px; }
.hudc-passo.ok { background: #2fbf6d; border-color: #2fbf6d; }
.hudc-vitais { left: 24px; right: 24px; top: 86px; display: flex; gap: 12px; }
.hudc-vital { flex: 1; background: rgba(12,16,20,.78); border-radius: 10px; padding: 8px 12px; text-align: center; }
.hudc-vital small { display: block; font-size: 20px; color: #c7cfd6; font-weight: 600; }
.hudc-vital b { font-size: 40px; font-weight: 800; color: #ff5668; }
.hudc-vital.ok b { color: #43d98a; }
.hudc-achado { background: #fff; color: #16222c; font-size: 30px; font-weight: 700; padding: 10px 18px;
  border-radius: 8px; box-shadow: 0 8px 20px rgba(0,0,0,.45); white-space: nowrap; transform: translate(-50%, 0); }
.hudc-cartao { left: 40px; right: 40px; background: #fff; color: #16222c; border-radius: 18px; padding: 22px 26px;
  box-shadow: 0 14px 34px rgba(0,0,0,.5); }
.hudc-cartao h3 { font-size: 36px; margin-bottom: 14px; }
.hudc-op { display: flex; align-items: center; gap: 12px; font-size: 30px; padding: 10px 14px; border-radius: 10px;
  border: 2px solid #dfe5ea; margin-top: 10px; }
.hudc-op i { width: 26px; height: 26px; border-radius: 50%; border: 3px solid #b7c1c9; font-style: normal; }
.hudc-op.certa { background: #2fbf6d; border-color: #2fbf6d; color: #fff; }
.hudc-op.certa i { background: #fff; border-color: #fff; }
.hudc-op.apagada { opacity: .35; }
.hudc-conta { position: absolute; right: 30px; top: -26px; width: 56px; height: 56px; border-radius: 50%;
  background: #fff; color: #16222c; display: grid; place-items: center; font-size: 32px; font-weight: 800;
  box-shadow: 0 6px 16px rgba(0,0,0,.4); }
.hudc-aviso { margin-top: 12px; font-size: 26px; color: #c8102e; font-weight: 700; }
.hudc-lista { counter-reset: passo; }
.hudc-lista div { font-size: 28px; margin-top: 8px; }
.hudc-pedido { margin-top: 16px; background: #1d6ff2; color: #fff; text-align: center; font-size: 28px;
  font-weight: 700; padding: 12px; border-radius: 10px; }
`;

function base(root, className, style = {}) {
  if (!document.getElementById("hudc-css")) {
    const tag = document.createElement("style");
    tag.id = "hudc-css";
    tag.textContent = CSS;
    document.head.append(tag);
  }
  const div = document.createElement("div");
  div.className = `hudc ${className}`;
  Object.assign(div.style, style);
  root.append(div);
  return div;
}

const esc = (t) => String(t ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

// ---------- a faixa do topo ----------
export function statusBar(root, style, { queixa = "", decisoes = 3, at = 0 } = {}) {
  const div = base(root, "hudc-topo");
  return function draw(t, feitas = 0) {
    div.classList.toggle("on", t >= at);
    const passos = Array.from({ length: decisoes }, (_, i) =>
      `<span class="hudc-passo ${i < feitas ? "ok" : ""}">${i < feitas ? "✓" : i + 1}</span>`).join("");
    div.innerHTML = `<span class="hudc-queixa">${esc(queixa)}</span><span class="hudc-passos">DECISÕES ${passos}</span>`;
  };
}

// ---------- os sinais vitais ----------
export function vitals(root, style, { at = 0, itens = [] } = {}) {
  const div = base(root, "hudc-vitais");
  return function draw(t) {
    div.classList.toggle("on", t >= at);
    div.innerHTML = itens.map((v) => {
      const corrigido = v.em !== undefined && t >= v.em;
      return `<span class="hudc-vital ${corrigido ? "ok" : ""}"><small>${esc(v.rotulo)}</small><b>${esc(corrigido ? v.alvo : v.valor)}</b></span>`;
    }).join("");
  };
}

// ---------- as etiquetas de achado ----------
// itens: [{at, until, texto, x, y}] — x e y em fração da tela (0 a 1)
export function findingTags(root, style, itens = []) {
  const { width = 1080, height = 1920 } = style.format || {};
  const made = itens.map((item) => {
    const div = base(root, "hudc-achado", { left: `${item.x * width}px`, top: `${item.y * height}px` });
    div.textContent = item.texto;
    return { item, div };
  });
  return function draw(t) {
    for (const { item, div } of made) div.classList.toggle("on", t >= item.at && t < item.until);
  };
}

// ---------- o cartão de decisão ----------
export function decisionCard(root, style, decisoes = [], { top = 1180 } = {}) {
  const made = decisoes.map((d) => {
    const div = base(root, "hudc-cartao", { top: `${d.top ?? top}px`, position: "absolute" });
    return { d, div };
  });
  return function draw(t) {
    for (const { d, div } of made) {
      const on = t >= d.at && t < d.until;
      div.classList.toggle("on", on);
      if (!on) continue;
      const passou = t - d.at, contagem = Math.ceil(Math.max(0, (d.contagem ?? 3) - passou));
      const resolvido = passou > (d.contagem ?? 3);
      const opcoes = d.opcoes.map((texto, i) => {
        const certa = resolvido && i === d.certa, apagada = resolvido && i !== d.certa;
        return `<div class="hudc-op ${certa ? "certa" : ""} ${apagada ? "apagada" : ""}"><i></i>${esc(texto)}</div>`;
      }).join("");
      const conta = !resolvido && contagem > 0 ? `<div class="hudc-conta">${contagem}</div>` : "";
      const aviso = resolvido && d.aviso ? `<div class="hudc-aviso">${esc(d.aviso)}</div>` : "";
      div.innerHTML = `${conta}<h3>${esc(d.pergunta)}</h3>${opcoes}${aviso}`;
    }
  };
}

// ---------- o resumo do fim ----------
export function summaryCard(root, style, { at = 0, until = Infinity, titulo = "", itens = [], pedido = "", top = 1150 } = {}) {
  const div = base(root, "hudc-cartao", { top: `${top}px`, position: "absolute" });
  div.innerHTML = `<h3>${esc(titulo)}</h3><div class="hudc-lista">${
    itens.map((item, i) => `<div><b>${i + 1}</b> ${esc(item)}</div>`).join("")
  }</div>${pedido ? `<div class="hudc-pedido">${esc(pedido)}</div>` : ""}`;
  return function draw(t) { div.classList.toggle("on", t >= at && t < until); };
}
