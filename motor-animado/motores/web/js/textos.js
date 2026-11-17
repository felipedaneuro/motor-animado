// textos.js: o que aparece por cima da cena, todo recalculado a partir de t a cada quadro.
//  - a legenda: N palavras por vez (estilo.json, "captions"), as palavras de destaque com outra cor
//  - as etiquetas (o nome técnico): no topo da tela ou presas a um ponto 3D que a câmera segue
//  - os cards: um balão com ícone e texto curto ("⏱️ 20 MIN") num ponto da tela; com `image` vira um
//    recorte jornalístico real (print, meme, infográfico) no balão (`media`) ou em tela cheia (`full`)
//  - o ticker: a chamada fixa embaixo (chyron), com uma tarja e o texto correndo
import * as THREE from "three";
import { normalizeWord, pop, clamp } from "./nucleo.js";

// a fonte do estilo e, se o estilo.json pedir (captions.font_fallback), a reserva para quando a primeira faltar
export const fontStack = (c) => [c.font, c.font_fallback].filter(Boolean).map((name) => `"${name}"`).concat('"Arial Black"', "sans-serif").join(", ");

function applyStyleVariables(root, style) {
  const c = style.captions, l = style.label, k = style.cards, tk = style.ticker;
  const vars = {
    "--caption-top": `${c.top_px}px`, "--caption-size": `${c.font_px}px`, "--caption-color": c.color,
    "--caption-stroke": c.stroke, "--caption-stroke-width": `${c.stroke_px}px`, "--caption-highlight": c.highlight,
    "--caption-transform": c.uppercase ? "uppercase" : "none", "--font": fontStack(c),
    "--label-top": `${l.top_px}px`, "--label-background": l.background, "--label-color": l.color, "--label-size": `${l.font_px}px`,
    "--label-stroke": l.stroke || "#111111",
    "--card-background": k.background, "--card-color": k.color, "--card-size": `${k.font_px}px`,
  };
  if (tk) {
    Object.assign(vars, {
      "--ticker-background": tk.background, "--ticker-color": tk.color, "--ticker-size": `${tk.font_px}px`,
      "--ticker-tag-background": tk.tag_background, "--ticker-tag-color": tk.tag_color,
      "--ticker-bottom": `${tk.bottom_px}px`, "--ticker-height": `${tk.height_px}px`,
    });
  }
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);
}

// as palavras em blocos de N, sem atravessar frases
function captionChunks(timing, perCaption) {
  const chunks = [];
  for (const phrase of timing.phrases) {
    for (let i = 0; i < phrase.words.length; i += perCaption) {
      const words = phrase.words.slice(i, i + perCaption);
      chunks.push({ words, start: words[0].start, end: words[words.length - 1].end, closesPhrase: i + perCaption >= phrase.words.length });
    }
  }
  return chunks.map((chunk, i) => ({ ...chunk, until: chunk.closesPhrase || !chunks[i + 1] ? chunk.end + 0.35 : chunks[i + 1].start }));
}

function element(root, className, html = "") {
  const div = document.createElement("div");
  div.className = className;
  div.innerHTML = html;
  root.appendChild(div);
  return div;
}

function captionHtml(chunk, highlights) {
  return chunk.words.map((w) => {
    const text = w.word.replace(/[.,!?;:…"]+$/g, "");
    return highlights.has(normalizeWord(w.word)) ? `<em>${text}</em>` : text;
  }).join(" ");
}

export function createOverlay(root, timing, style, { labels = [], cards = [], highlights = [], tickers = [] } = {}) {
  applyStyleVariables(root, style);
  const { width, height } = style.format;
  const marked = new Set(highlights.map(normalizeWord));
  const chunks = captionChunks(timing, style.captions.words_per_caption || 1);
  const caption = element(root, "caption");
  const labelClass = style.label.variant === "text" ? "label text-only" : "label";
  const labelEls = labels.map((l) => ({ ...l, el: element(root, labelClass,`<b>${l.title}</b>${l.subtitle ? `<i>${l.subtitle}</i>` : ""}`) }));
  const cardEls = cards.map((c) => {
    const full = !!c.full;
    let className = "card", html;
    if (c.image) {
      className += full ? " full" : " media";
      html = `<img src="${c.image}" alt="">${c.text ? `<div class="legenda">${c.text}</div>` : ""}`;
    } else {
      html = `${c.icon ? `<span>${c.icon}</span>` : ""}${c.text}`;
    }
    const el = element(root, className, html);
    if (!full) Object.assign(el.style, { left: `${c.x ?? width / 2}px`, top: `${c.y ?? style.cards.top_px}px` });
    return { ...c, el, full };
  });
  // sem a seção "ticker" no estilo.json, nenhum ticker aparece (mesmo que o plano.js traga TICKER)
  const tickerEls = style.ticker ? tickers.map((tk) => ({
    ...tk, el: element(root, "ticker", `${tk.tag ? `<span class="tag">${tk.tag}</span>` : ""}<div class="texto"><span>${tk.text}</span></div>`),
  })) : [];
  const projected = new THREE.Vector3();
  let shown = null;

  function updateCaption(t) {
    const chunk = chunks.findLast((c) => c.start <= t);
    if (!chunk || t >= chunk.until) { caption.style.opacity = 0; return; }
    if (shown !== chunk) { caption.innerHTML = captionHtml(chunk, marked); shown = chunk; }
    const u = clamp((t - chunk.start) / 0.12);
    caption.style.transform = `scale(${0.82 + 0.18 * u + 0.06 * Math.sin(Math.PI * u)})`;
    caption.style.opacity = 1;
  }

  function placeLabel(label, t, camera) {
    const scale = pop(t, label.at, label.until, 0.25);
    label.el.style.opacity = scale > 0 ? 1 : 0;
    if (!label.point || !camera) {
      label.el.style.transform = `translateX(-50%) scale(${scale}) rotate(${-2 + 2 * Math.sin(t * 2)}deg)`;
      return;
    }
    projected.set(...label.point).project(camera);
    const x = (projected.x * 0.5 + 0.5) * width, y = (0.5 - projected.y * 0.5) * height;
    label.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale}) rotate(-4deg)`;
    label.el.classList.add("anchored");
  }

  return function update(t, camera) {
    updateCaption(t);
    for (const label of labelEls) placeLabel(label, t, camera);
    for (const card of cardEls) {
      const scale = pop(t, card.at, card.until);
      card.el.style.opacity = scale > 0 ? 1 : 0;
      card.el.style.transform = card.full
        ? `scale(${scale})`
        : `translateX(-50%) scale(${scale}) translateY(${4 * Math.sin(t * 3 + card.at)}px)`;
    }
    for (const tk of tickerEls) {
      const visible = t >= tk.at && t < tk.until;
      tk.el.style.opacity = visible ? 1 : 0;
      if (!visible) continue;
      const span = tk.el.querySelector(".texto span"), box = tk.el.querySelector(".texto");
      const overflow = span.scrollWidth - box.clientWidth;
      if (overflow > 0) {
        const speed = 110, loop = overflow + box.clientWidth * 0.5;
        span.style.transform = `translateX(${-((t - tk.at) * speed) % loop}px)`;
      }
    }
  };
}
