// menu.js: a interface de menu de videogame antigo. Tudo em HTML por cima da cena, tudo função de t.
//
//   menuWindow(root, style, {titulo, total})  -> {draw(t, {passo, etapa, conteudo}), element}
//   stepTitle(root, style, etapas)            -> draw(t): o título em pixel no alto, com a palavra-chave trocando
//   captionBox(root, style, falas)            -> draw(t): a caixa de legenda embaixo, escrita letra a letra
//
// etapas: [{at, until, antes, chave}] — "antes" fica em branco e "chave" em dourado
import { createTyped } from "../motor/escrita.js";

const CSS = `
.rpg { position: absolute; z-index: 6; font-family: var(--font); opacity: 0; }
.rpg.on { opacity: 1; }
.rpg-titulo { left: 0; right: 0; top: 96px; text-align: center; font-size: 62px; font-weight: 900;
  letter-spacing: 2px; color: #f6f1dd; text-shadow: 0 6px 0 #1a0c24; }
.rpg-titulo b { color: #e9b53c; }
.rpg-janela { left: 70px; right: 70px; top: 430px; background: #221038; border: 6px solid #e9b53c;
  border-radius: 4px; box-shadow: 0 0 0 6px #221038, 0 0 0 10px #7c5420, 0 18px 30px rgba(0,0,0,.6); }
.rpg-barra { display: flex; justify-content: space-between; align-items: center; background: #7c5420;
  color: #f6f1dd; font-size: 26px; font-weight: 700; padding: 8px 14px; letter-spacing: 1px; }
.rpg-corpo { padding: 22px 20px; min-height: 560px; color: #cfc6e6; font-size: 30px; line-height: 1.5; }
.rpg-corpo .item { display: flex; gap: 12px; margin-bottom: 10px; }
.rpg-corpo .item::before { content: "▸"; color: #e9b53c; }
.rpg-progresso { height: 16px; background: #150a24; border-top: 4px solid #7c5420; }
.rpg-progresso i { display: block; height: 100%; background: #e9b53c; }
.rpg-engrenagem { position: absolute; top: -14px; width: 28px; height: 28px; border-radius: 50%;
  background: #e9b53c; box-shadow: 0 0 0 5px #221038; }
`;

function node(root, className) {
  if (!document.getElementById("rpg-css")) {
    const tag = document.createElement("style");
    tag.id = "rpg-css";
    tag.textContent = CSS;
    document.head.append(tag);
  }
  const div = document.createElement("div");
  div.className = `rpg ${className}`;
  root.append(div);
  return div;
}

export function stepTitle(root, style, etapas = []) {
  const div = node(root, "rpg-titulo");
  return function draw(t) {
    const agora = etapas.find((e) => t >= e.at && t < e.until);
    div.classList.toggle("on", Boolean(agora));
    if (agora) div.innerHTML = `${agora.antes ? agora.antes + " " : ""}<b>${agora.chave}</b>`;
  };
}

// a janela: moldura dourada dupla, barra de título com contador e barra de progresso na base
export function menuWindow(root, style, { total = 7 } = {}) {
  const div = node(root, "rpg-janela");
  div.classList.add("on");
  const barra = document.createElement("div"), corpo = document.createElement("div");
  const prog = document.createElement("div"), fill = document.createElement("i");
  barra.className = "rpg-barra";
  corpo.className = "rpg-corpo";
  prog.className = "rpg-progresso";
  prog.append(fill);
  div.append(barra, corpo, prog);
  for (const lado of ["left:14px", "right:14px"]) {
    const g = document.createElement("span");
    g.className = "rpg-engrenagem";
    g.style.cssText = lado;
    div.append(g);
  }
  return {
    element: div,
    draw(t, { passo = 1, etapa = "", itens = [] } = {}) {
      barra.innerHTML = `<span>AUTO</span><span>${passo}/${total}</span><span>${etapa}</span>`;
      corpo.innerHTML = itens.map((i) => `<div class="item">${i}</div>`).join("");
      fill.style.width = `${Math.round((passo / total) * 100)}%`;
    },
  };
}

export function captionBox(root, style, falas = [], options = {}) {
  root.style.setProperty("--escrita-fundo", "#150a24");
  root.style.setProperty("--escrita-borda", "#7c5420");
  root.style.setProperty("--escrita-cor", "#b9b0c9");
  root.style.setProperty("--escrita-tamanho", "34px");
  return createTyped(root, style, falas, { top: 1330, left: 70, width: 940, speed: 16, ...options });
}
