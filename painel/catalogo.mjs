// catalogo.mjs: os estilos do motor (lidos de motor-animado/estilos), os temas de cor e os outros motores instalados.
import fs from "node:fs";
import path from "node:path";
import { MOTOR, ROOT } from "./projetos.mjs";
import { engineStatus } from "./motores.mjs";
import { themeList } from "./temas.mjs";

const STYLES = path.join(MOTOR, "estilos");
const PREVIEWS = path.join(ROOT, "painel", "previas");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

function styleEntry(name) {
  const style = readJson(path.join(STYLES, name, "estilo.json"));
  return { nome: name, motor: style.engine, resumo: style.summary, temTema: Boolean(style.theme),
    temMascote: Boolean(style.mascot), temPessoa: Boolean(style.person), temBusto: Boolean(style.bust),
    temCenario: Boolean(style.pixel_world),
    temClinica: Boolean(style.clinic),
    tema: style.theme || null, legenda: style.captions?.font_px || null, base: style.extends || null,
    previa: fs.existsSync(path.join(PREVIEWS, `${name}.jpg`)) ? `/previas/${name}.jpg` : null };
}

export function catalog() {
  const names = fs.readdirSync(STYLES).filter((name) => !name.startsWith("_") && fs.existsSync(path.join(STYLES, name, "estilo.json")));
  return { estilos: names.map(styleEntry), temas: themeList(), outros: engineStatus() };
}

export const styleNames = () => catalog().estilos.map((s) => s.nome);

// a pasta de exemplo de um estilo: a dele ou a do estilo em que ele se apoia
export function exampleDir(name) {
  for (let current = name; current;) {
    const dir = path.join(STYLES, current, "exemplo");
    if (fs.existsSync(dir)) return dir;
    current = readJson(path.join(STYLES, current, "estilo.json")).extends;
  }
  return null;
}
