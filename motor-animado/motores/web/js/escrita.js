// escrita.js: o texto que se escreve letra a letra numa caixa, como num terminal ou numa tela de videogame.
// É o efeito que aparece em quatro estilos medidos do canal (duelo, corte anatômico, menu de RPG), sempre com a
// mesma cadência: cerca de 12 caracteres por segundo, e o texto fica parado até a frase seguinte.
//
//   createTyped(root, style, items, opcoes) -> draw(t)
//     items:  [{at, until, text, speed?}]   at e until em segundos; speed em caracteres por segundo
//     opcoes: {top, left, right, width, align, className, cursor, box}
//       top/left/right/width: em pixels da tela do vídeo (1080x1920 por padrão)
//       align:    "left" (padrão) ou "center"
//       box:      true desenha a moldura (padrão); false deixa só o texto
//       cursor:   true mostra um bloquinho piscando no fim enquanto escreve (padrão)
//       className: uma classe a mais, para o kit do estilo pintar a caixa do seu jeito
//
// As cores saem de variáveis CSS que o estilo pode trocar: --escrita-fundo, --escrita-cor, --escrita-borda,
// --escrita-tamanho. Sem elas, a caixa usa as cores da etiqueta do estilo.json.
const CSS = `
.escrita { position: absolute; z-index: 5; opacity: 0; font-family: var(--font);
  font-size: var(--escrita-tamanho, 34px); line-height: 1.25; letter-spacing: 1px;
  color: var(--escrita-cor, #f2f5f9); text-align: left; white-space: pre-wrap; }
.escrita.caixa { background: var(--escrita-fundo, rgba(10, 12, 26, 0.92));
  border: 3px solid var(--escrita-borda, #4f66a6); border-radius: 6px; padding: 14px 18px; }
.escrita.centro { text-align: center; }
.escrita i { font-style: normal; opacity: 0.001; }
.escrita u { text-decoration: none; display: inline-block; width: 0.62em; height: 1em; vertical-align: -0.12em;
  background: var(--escrita-cor, #f2f5f9); }
`;

const esc = (text) => String(text ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

// o texto inteiro ocupa o espaço desde o primeiro quadro (o que ainda não foi escrito fica invisível):
// assim a caixa não muda de tamanho enquanto escreve, que é o que a referência faz
function partial(text, chars, cursor) {
  const n = Math.max(0, Math.min(text.length, Math.floor(chars)));
  const bar = cursor && n < text.length ? "<u></u>" : "";
  return `${esc(text.slice(0, n))}${bar}<i>${esc(text.slice(n))}</i>`;
}

export function createTyped(root, style, items = [], options = {}) {
  if (!document.getElementById("escrita-css")) {
    const tag = document.createElement("style");
    tag.id = "escrita-css";
    tag.textContent = CSS;
    document.head.append(tag);
  }
  const { top = 420, left = 60, right, width, align = "left", className = "", box = true, cursor = true } = options;
  const speed = options.speed || 12;
  const made = items.map((item) => {
    const div = document.createElement("div");
    div.className = `escrita ${box ? "caixa" : ""} ${align === "center" ? "centro" : ""} ${className}`.trim();
    div.style.top = `${item.top ?? top}px`;
    if (right !== undefined) div.style.right = `${right}px`;
    else div.style.left = `${item.left ?? left}px`;
    if (width !== undefined) div.style.width = `${width}px`;
    root.append(div);
    return { item, div, written: -1 };
  });
  return function draw(t) {
    for (const made_ of made) {
      const { item, div } = made_;
      const on = t >= item.at && t < item.until;
      div.style.opacity = on ? 1 : 0;
      if (!on) continue;
      const chars = (t - item.at) * (item.speed || speed);
      const step = Math.floor(chars);
      if (step === made_.written && step >= item.text.length) continue;   // já terminou: não repinta
      made_.written = step;
      div.innerHTML = partial(item.text, chars, cursor);
    }
  };
}

// uma caixa só, para quem quer controlar o texto na mão (um painel que muda de conteúdo, por exemplo)
export function typedBox(root, style, options = {}) {
  const draw = createTyped(root, style, [{ at: 0, until: Infinity, text: "" }], options);
  const holder = root.lastElementChild;
  return {
    element: holder,
    set(text, chars = Infinity) { holder.innerHTML = partial(text, chars, options.cursor !== false); holder.style.opacity = 1; },
    hide() { holder.style.opacity = 0; },
    draw,
  };
}
