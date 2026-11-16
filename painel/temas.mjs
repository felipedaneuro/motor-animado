// temas.mjs: os temas de cor. Os que vêm na skill ficam em estilos/_temas.json (o painel não mexe); os criados ou
// importados aqui ficam em estilos/_temas-meus.json e valem por cima. Tudo que chega da página é conferido antes de gravar.
import fs from "node:fs";
import path from "node:path";
import { MOTOR } from "./projetos.mjs";

const BUILT_IN = path.join(MOTOR, "estilos", "_temas.json");
const PERSONAL = path.join(MOTOR, "estilos", "_temas-meus.json");
const HEX = /^#[0-9a-f]{6}$/i;
const SCENERIES = ["campo", "cidade"];

const readThemes = (file) => {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(file, "utf8"))).filter(([key]) => !key.startsWith("_")));
};

export const builtInThemes = () => readThemes(BUILT_IN);
export const personalThemes = () => readThemes(PERSONAL);

const swatches = (t) => [t.stage.background, t.world.ground || t.stage.background, ...(t.accents || []).slice(0, 3)];

// todos os temas, os pessoais marcados; a página recebe também os dados completos para editar e exportar
export function themeList() {
  const own = personalThemes(), all = { ...builtInThemes(), ...own };
  return Object.entries(all).map(([nome, t]) => ({ nome, sobre: t.about || "", cores: swatches(t), meu: nome in own, dados: t }));
}

// ---------- conferência do que chega da página ----------
const color = (value, what) => { if (!HEX.test(String(value))) throw new Error(`${what}: use uma cor no formato #rrggbb`); return String(value).toLowerCase(); };
const colors = (list, what, min, max) => {
  if (!Array.isArray(list) || list.length < min || list.length > max) throw new Error(`${what}: de ${min} a ${max} cores`);
  return list.map((value) => color(value, what));
};
const number = (value, what, min, max) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw new Error(`${what}: um número entre ${min} e ${max}`);
  return n;
};

function cleanStage(stage = {}) {
  const [near, far] = Array.isArray(stage.fog) ? stage.fog : [35, 120], [sky, ground, strength] = stage.hemisphere || [];
  const [sunColor, sunStrength] = stage.sun || [];
  return { background: color(stage.background, "céu"), background_bottom: color(stage.background_bottom || stage.background, "horizonte"),
    fog: [number(near, "névoa (perto)", 1, 200), number(far, "névoa (longe)", 2, 400)],
    hemisphere: [color(sky || "#ffffff", "luz do céu"), color(ground || "#8a9a70", "luz do chão"), number(strength ?? 1.25, "força da luz", 0.2, 3)],
    sun: [color(sunColor || "#fff2dc", "cor do sol"), number(sunStrength ?? 2.2, "força do sol", 0, 4)] };
}

function cleanWorld(world = {}) {
  if (!SCENERIES.includes(world.scenery)) throw new Error("cenário: campo ou cidade");
  const clean = { scenery: world.scenery, ground: color(world.ground, "chão"), path: color(world.path, "caminho"), hills: color(world.hills, "morros"),
    foliage: colors(world.foliage, "folhagem", 1, 4), trunk: color(world.trunk || "#7a5a3c", "tronco"), rock: color(world.rock || "#a9a49a", "pedra"),
    cloud: color(world.cloud || "#ffffff", "nuvem") };
  if (world.scenery === "cidade") Object.assign(clean, { buildings: colors(world.buildings, "prédios", 1, 4), windows: color(world.windows || "#fff6d8", "janelas") });
  return clean;
}

export function cleanTheme(theme) {
  if (!theme || typeof theme !== "object") throw new Error("o tema veio vazio");
  const clean = { about: String(theme.about || "tema pessoal").slice(0, 200), stage: cleanStage(theme.stage), world: cleanWorld(theme.world),
    accents: colors(theme.accents, "cores de destaque", 3, 6) };
  if (theme.label) clean.label = { background: color(theme.label.background, "fundo da etiqueta"), color: color(theme.label.color, "texto da etiqueta") };
  if (theme.captions?.highlight) clean.captions = { highlight: color(theme.captions.highlight, "destaque da legenda") };
  return clean;
}

export function cleanName(name) {
  const slug = String(name || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
  if (!slug) throw new Error("dê um nome ao tema");
  if (slug in builtInThemes()) throw new Error(`"${slug}" é um tema da skill: escolha outro nome`);
  return slug;
}

function writePersonal(themes) {
  const note = { _sobre: "Temas criados ou importados no painel. O painel cuida deste arquivo; os temas da skill ficam em _temas.json." };
  fs.writeFileSync(PERSONAL, JSON.stringify({ ...note, ...themes }, null, 2) + "\n");
}

export function saveTheme(name, theme) {
  const slug = cleanName(name);
  writePersonal({ ...personalThemes(), [slug]: cleanTheme(theme) });
  return slug;
}

// só temas pessoais podem ser excluídos
export function deleteTheme(name) {
  const themes = personalThemes();
  if (!(name in themes)) throw new Error("só dá para excluir um tema criado por você");
  delete themes[name];
  writePersonal(themes);
}
