// temas.js: o editor de temas do painel: criar do zero a partir de um tema existente, importar de um arquivo .json
// (um tema exportado daqui) ou de uma imagem de referência (o painel tira as cores dela), exportar e excluir.
const esc = (text) => String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// os campos de cor do editor: [caminho no tema, rótulo, só na cidade?]
const FIELDS = [
  ["stage.background", "Céu"], ["stage.background_bottom", "Horizonte"], ["world.ground", "Chão"], ["world.path", "Caminho"],
  ["world.hills", "Morros"], ["world.foliage.0", "Folhagem 1"], ["world.foliage.1", "Folhagem 2"], ["world.trunk", "Tronco"],
  ["world.rock", "Pedra"], ["world.cloud", "Nuvem"], ["world.buildings.0", "Prédio 1", true], ["world.buildings.1", "Prédio 2", true],
  ["world.windows", "Janelas", true], ["accents.0", "Destaque 1"], ["accents.1", "Destaque 2"], ["accents.2", "Destaque 3"],
  ["label.background", "Etiqueta: fundo"], ["label.color", "Etiqueta: texto"], ["captions.highlight", "Legenda: destaque"],
];
const CITY_DEFAULTS = { buildings: ["#c9b48a", "#b89f74"], windows: "#fff6d8" };

const read = (theme, pathText) => pathText.split(".").reduce((value, key) => value?.[key], theme);

export function write(theme, pathText, value) {
  const keys = pathText.split(".");
  let target = theme;
  keys.slice(0, -1).forEach((key, k) => { target = target[key] ??= /^\d+$/.test(keys[k + 1]) ? [] : {}; });
  target[keys.at(-1)] = value;
}

// um tema completo para começar a editar, copiado de um que já existe (o "noite" não tem mundo de dia: usa o natural)
export function draftFrom(catalog, baseName, name = "") {
  const pick = catalog.temas.find((t) => t.nome === baseName && t.dados.world?.ground) || catalog.temas.find((t) => t.nome === "natural");
  const tema = structuredClone(pick.dados);
  tema.label ??= { background: "#ffd21f", color: "#111111" };
  tema.captions ??= { highlight: "#ffd21f" };
  tema.world.foliage = [tema.world.foliage[0], tema.world.foliage[1] || tema.world.foliage[0]];
  return { nome: name, original: null, tema };
}

function sceneSketch(t) {   // um desenho pequeno do mundo com as cores do tema, para ver o conjunto enquanto escolhe
  const w = t.world, city = w.scenery === "cidade";
  const back = city ? `<i style="left:8%;bottom:38%;width:22%;height:34%;background:${w.buildings?.[0]}"></i><i style="left:62%;bottom:38%;width:26%;height:44%;background:${w.buildings?.[1] || w.buildings?.[0]}"></i>`
    : `<i style="left:-10%;bottom:36%;width:70%;height:22%;border-radius:50%;background:${w.hills}"></i><i style="left:45%;bottom:36%;width:75%;height:16%;border-radius:50%;background:${w.hills}"></i>`;
  return `<div class="esboco" style="background:linear-gradient(${t.stage.background}, ${t.stage.background_bottom} 62%)">
    <i style="left:14%;top:10%;width:26%;height:9%;border-radius:99px;background:${w.cloud}"></i>${back}
    <i style="left:0;bottom:0;width:100%;height:40%;background:${w.ground}"></i><i style="left:0;bottom:10%;width:100%;height:12%;background:${w.path}"></i>
    <i style="left:74%;bottom:36%;width:4%;height:12%;background:${w.trunk}"></i><i style="left:66%;bottom:46%;width:20%;height:20%;border-radius:50%;background:${w.foliage[0]}"></i>
    <i style="left:16%;bottom:38%;width:14%;height:15%;border-radius:50%;background:${w.foliage[1]}"></i><i style="left:40%;bottom:24%;width:9%;height:6%;border-radius:40%;background:${w.rock}"></i>
    ${t.accents.slice(0, 3).map((c, k) => `<i style="left:${30 + k * 14}%;bottom:5%;width:7%;height:4%;border-radius:50%;background:${c}"></i>`).join("")}
    <b style="background:${t.label.background};color:${t.label.color}">ETIQUETA</b><em>legenda <span style="color:${t.captions.highlight}">destaque</span></em></div>`;
}

export function editorView(editor, catalog) {
  const t = editor.tema, city = t.world.scenery === "cidade";
  const inputs = FIELDS.filter(([, , cityOnly]) => !cityOnly || city).map(([field, label]) =>
    `<div><label>${label}</label><input type="color" data-theme-field="${field}" value="${esc(read(t, field) || "#888888")}"></div>`).join("");
  const personal = catalog.temas.some((x) => x.meu && x.nome === editor.original);
  return `<div class="cartao editor"><h2>${editor.original ? `Editar o tema ${esc(editor.original)}` : "Novo tema"}</h2>
    <div class="duas"><div>
      <div class="campos"><div><label for="t-nome">Nome do tema</label><input id="t-nome" data-theme-meta="nome" value="${esc(editor.nome)}" placeholder="ex.: clinica-azul"></div>
        <div><label for="t-sobre">Para que serve</label><input id="t-sobre" data-theme-field="about" data-text="1" value="${esc(t.about || "")}"></div>
        <div><label for="t-cena">Cenário</label><select id="t-cena" data-theme-field="world.scenery" data-text="1"><option value="campo" ${city ? "" : "selected"}>campo</option><option value="cidade" ${city ? "selected" : ""}>cidade</option></select></div></div>
      <div class="cores">${inputs}</div>
      <div class="linha" style="margin-top:14px"><button class="botao" data-action="tema-salvar">Salvar tema</button>
        <button class="botao fantasma" data-action="tema-exportar">Exportar</button>
        ${personal ? `<button class="botao perigo" data-action="tema-excluir">Excluir</button>` : ""}
        <button class="botao fantasma" data-action="tema-cancelar">Cancelar</button></div>
    </div><div id="esboco">${sceneSketch(t)}</div></div></div>`;
}

export const redrawSketch = (editor) => { const box = document.querySelector("#esboco"); if (box) box.innerHTML = sceneSketch(editor.tema); };

export function setField(editor, field, value) {
  write(editor.tema, field, value);
  if (field === "world.scenery" && value === "cidade") Object.assign(editor.tema.world, { ...CITY_DEFAULTS, ...pickCity(editor.tema.world) });
}
const pickCity = (world) => (world.buildings ? { buildings: world.buildings, windows: world.windows || CITY_DEFAULTS.windows } : {});

// ---------- exportar e importar ----------
export function exportTheme(editor) {
  const blob = new Blob([JSON.stringify({ nome: editor.nome || "meu-tema", tema: editor.tema }, null, 2)], { type: "application/json" });
  const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `tema-${editor.nome || "meu-tema"}.json` });
  link.click();
  URL.revokeObjectURL(link.href);
}

// aceita {nome, tema}, um tema solto ou um arquivo de temas ({nome: tema}); devolve um rascunho para o editor
function fromJson(text, catalog) {
  const data = JSON.parse(text);
  const [name, theme] = data.tema ? [data.nome, data.tema] : data.stage ? ["", data] : Object.entries(data).find(([key, value]) => !key.startsWith("_") && value?.stage) || [];
  if (!theme?.stage || !theme?.world) throw new Error("este arquivo não parece um tema do painel");
  const draft = draftFrom(catalog, "natural", String(name || ""));
  draft.tema = { ...draft.tema, ...theme, world: { ...draft.tema.world, ...theme.world }, label: theme.label || draft.tema.label, captions: theme.captions || draft.tema.captions };
  return draft;
}

const hex = ([r, g, b]) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const light = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
const vivid = ([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b);

// as cores mais presentes da imagem, em grupos (reduz a 64x64 e junta cores parecidas)
function palette(image) {
  const canvas = Object.assign(document.createElement("canvas"), { width: 64, height: 64 });
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, 64, 64);
  const pixels = context.getImageData(0, 0, 64, 64).data, groups = new Map();
  for (let i = 0; i < pixels.length; i += 4) {
    const key = [pixels[i] >> 5, pixels[i + 1] >> 5, pixels[i + 2] >> 5].join(",");
    const group = groups.get(key) || { n: 0, sum: [0, 0, 0] };
    group.n++;
    [0, 1, 2].forEach((c) => { group.sum[c] += pixels[i + c]; });
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => b.n - a.n).slice(0, 12).map((g) => g.sum.map((v) => v / g.n));
}

// da imagem para o tema: as cores mais claras viram céu e caminho, as médias chão e morros, as escuras tronco;
// as mais vivas viram os destaques. É um ponto de partida: a pessoa ajusta no editor.
function fromImage(image, name, catalog) {
  const colors = palette(image), byLight = [...colors].sort((a, b) => light(b) - light(a)), byVivid = [...colors].sort((a, b) => vivid(b) - vivid(a));
  const at = (k) => hex(byLight[Math.min(byLight.length - 1, Math.round(k * (byLight.length - 1)))]);
  const draft = draftFrom(catalog, "natural", name);
  Object.assign(draft.tema.stage, { background: at(0.15), background_bottom: at(0) });
  Object.assign(draft.tema.world, { path: at(0.25), ground: at(0.45), hills: at(0.6), foliage: [at(0.7), at(0.55)], rock: at(0.5), trunk: at(0.9) });
  draft.tema.accents = [0, 1, 2].map((k) => hex(byVivid[Math.min(k, byVivid.length - 1)]));
  draft.tema.about = "tirado de uma imagem de referência";
  return draft;
}

const loadImage = (file) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error("não consegui abrir a imagem"));
  image.src = URL.createObjectURL(file);
});

export async function importFile(file, catalog) {
  const name = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
  if (file.type.startsWith("image/")) return fromImage(await loadImage(file), name, catalog);
  const draft = fromJson(await file.text(), catalog);
  draft.nome ||= name;
  return draft;
}
