// pixelsvg.js: desenho em pixel numa camada SVG por cima da cena (a tela do vídeo, 1080x1920). Base das peças de exame
// (exames.js) e do cérebro de perfil (cerebro-perfil.js), e de qualquer kit que precise de traço em degraus.
//
//   createSvgLayer(root, {label, z}) -> draw(markup)   a camada; draw troca o desenho inteiro a cada quadro
//   raster(box, colorAt)          pinta uma área célula a célula: colorAt(u, v) devolve a cor ou null; u e v vão de 0 a 1
//   rect, line, arrow, blob, ring, label, group      as peças de desenho; todas devolvem texto SVG
//   progress(t, start, end)       0 a 1 entre dois instantes, para entrar e crescer em função de t
//
// Tudo é função dos números que entram (nada de sorteio nem relógio): o mesmo t dá sempre o mesmo quadro.

export const GRID = 12;   // o tamanho do "pixel" das peças, em pixels da tela
export const clamp01 = (value) => Math.max(0, Math.min(1, value));
export const progress = (t, start, end) => clamp01((t - start) / Math.max(0.05, end - start));
export const snap = (value, step = 4) => Math.round(value / step) * step;
const toGrid = (value) => Math.round(value / GRID) * GRID;

export const escapeXml = (text) => String(text ?? "").replace(/[&<>"']/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function createSvgLayer(root, { label = "", z = 3 } = {}) {
  const surface = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  surface.setAttribute("viewBox", "0 0 1080 1920");
  surface.setAttribute("shape-rendering", "crispEdges");
  if (label) surface.setAttribute("aria-label", label);
  Object.assign(surface.style, { position: "absolute", inset: "0", width: "1080px", height: "1920px",
    pointerEvents: "none", zIndex: String(z) });
  root.appendChild(surface);
  return (markup) => { surface.innerHTML = markup; };
}

export function rect(x, y, width, height, fill, extra = "") {
  return `<rect x="${snap(x)}" y="${snap(y)}" width="${Math.max(0, snap(width))}" height="${Math.max(0, snap(height))}" fill="${fill}" ${extra}/>`;
}

// uma área pintada célula a célula; células vizinhas da mesma cor viram um retângulo só (o SVG fica leve)
export function raster({ x, y, width, height, cell = GRID }, colorAt) {
  const columns = Math.round(width / cell), rows = Math.round(height / cell);
  let markup = "";
  for (let row = 0; row < rows; row++) {
    const v = (row + 0.5) / rows;
    let runColor = null, runStart = 0;
    for (let column = 0; column <= columns; column++) {
      const color = column < columns ? colorAt((column + 0.5) / columns, v) : null;
      if (color === runColor) continue;
      if (runColor) markup += rect(x + runStart * cell, y + row * cell, (column - runStart) * cell, cell, runColor);
      runColor = color;
      runStart = column;
    }
  }
  return markup;
}

// um traço em degraus entre pontos [[x, y], ...]: cada segmento vira escada de passos do tamanho da grade
export function stairs(points) {
  let path = "", previous = null;
  for (const [px, py] of points) {
    const target = [toGrid(px), toGrid(py)];
    if (!previous) { path = `M${target[0]} ${target[1]}`; previous = target; continue; }
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(target[0] - previous[0]), Math.abs(target[1] - previous[1])) / GRID));
    for (let step = 1; step <= steps; step++) {
      const x = toGrid(previous[0] + ((target[0] - previous[0]) * step) / steps);
      const y = toGrid(previous[1] + ((target[1] - previous[1]) * step) / steps);
      path += ` H${x} V${y}`;
    }
    previous = target;
  }
  return path;
}

export function line(points, color, width = 8, extra = "") {
  return `<path d="${stairs(points)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="square" stroke-linejoin="miter" ${extra}/>`;
}

// seta de from até to: haste em degraus e ponta triangular alongada, com a ponta exatamente em "to"
export function arrow(from, to, { color = "#ffd267", width = 14, head = 56 } = {}) {
  const dx = to[0] - from[0], dy = to[1] - from[1], length = Math.hypot(dx, dy) || 1;
  const ux = dx / length, uy = dy / length, base = [to[0] - ux * head, to[1] - uy * head];
  const half = head * 0.42, left = [base[0] - uy * half, base[1] + ux * half], right = [base[0] + uy * half, base[1] - ux * half];
  const tip = `<path d="M${to[0]} ${to[1]} L${left[0].toFixed(0)} ${left[1].toFixed(0)} L${right[0].toFixed(0)} ${right[1].toFixed(0)} Z" fill="${color}"/>`;
  return line([from, base], color, width) + tip;
}

// mancha em pixel (cruz de dois retângulos), como um borrão de sangue ou de contraste
export function blob(x, y, radius, color) {
  return rect(x - radius, y - radius / 2, radius * 2, radius, color) + rect(x - radius / 2, y - radius, radius, radius * 2, color);
}

// quadrado vazado em volta de um ponto, para apontar o achado; dash: true deixa tracejado
export function ring(x, y, size, color = "#ffd267", { width = 8, dash = false, opacity = 1 } = {}) {
  const pattern = dash ? ' stroke-dasharray="16 10"' : "";
  return `<rect x="${snap(x - size / 2)}" y="${snap(y - size / 2)}" width="${snap(size)}" height="${snap(size)}" fill="none" stroke="${color}" stroke-width="${width}" opacity="${opacity}"${pattern}/>`;
}

export function label(value, x, y, { size = 38, color = "#edf2ff", anchor = "middle", font = "Arial, sans-serif", weight = "bold" } = {}) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-size="${Math.max(30, size)}" font-family="${font}" font-weight="${weight}">${escapeXml(value)}</text>`;
}

export function group(content, { opacity = 1, transform = "" } = {}) {
  const move = transform ? ` transform="${transform}"` : "";
  return `<g opacity="${clamp01(opacity).toFixed(3)}"${move}>${content}</g>`;
}
