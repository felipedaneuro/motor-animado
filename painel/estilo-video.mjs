// estilo-video.mjs: um estilo novo do painel a partir de um vídeo de referência (arquivo enviado ou link).
// O painel roda a decupagem e o novo_estilo.py (lista fixa de ferramentas); o agente só completa a receita e o kit
// numa cópia dentro da pasta do vídeo, e o painel devolve a cópia para motor-animado/estilos/<nome>.
import fs from "node:fs";
import path from "node:path";
import { askAgent } from "./agentes.mjs";
import { styleNames } from "./catalogo.mjs";
import { must, tool } from "./ferramentas.mjs";
import { newStylePrompt } from "./instrucoes.mjs";
import { MOTOR, log, projectDir } from "./projetos.mjs";

export const VIDEO_TYPES = new Set([".mp4", ".mov", ".m4v", ".webm"]);
export const MAX_VIDEO_BYTES = 800e6;
const STYLES = path.join(MOTOR, "estilos");
const workDir = (id, name) => path.join(projectDir(id), `estilo-${name}`);

// o nome vira pasta: só letras minúsculas, números e hífen, e não pode existir ainda (a não ser que seja a retomada
// do mesmo estilo neste projeto, depois de um erro)
export function checkStyleName(id, name) {
  if (!/^[a-z0-9][a-z0-9-]{2,40}$/.test(String(name))) throw new Error("o nome do estilo usa só letras minúsculas, números e hífen (3 a 40)");
  if (fs.existsSync(workDir(id, name))) return;
  if (styleNames().includes(name) || fs.existsSync(path.join(STYLES, name))) throw new Error(`já existe um estilo chamado ${name}`);
}

// onde o vídeo enviado fica guardado (dentro da pasta do vídeo do projeto)
export function uploadTarget(id, original) {
  const ext = path.extname(String(original)).toLowerCase();
  if (!VIDEO_TYPES.has(ext)) throw new Error("envie um vídeo .mp4, .mov, .m4v ou .webm");
  const folder = path.join(projectDir(id), "referencia-estilo");
  fs.mkdirSync(folder, { recursive: true });
  return path.join(folder, `referencia-${Date.now()}${ext}`);
}

// a fonte é um arquivo já enviado (nome dentro de referencia-estilo/) ou um link https
export function resolveSource(id, { arquivo, link }) {
  if (link) {
    if (!/^https:\/\/[^\s"'`]+$/.test(String(link))) throw new Error("o link precisa começar com https://");
    return String(link);
  }
  const file = path.join(projectDir(id), "referencia-estilo", path.basename(String(arquivo || "")));
  if (!arquivo || !fs.existsSync(file)) throw new Error("envie o vídeo de referência ou cole um link");
  return file;
}

// numa retomada, a cópia que o agente já começou a completar fica como está
async function decupe(id, name, source, seconds) {
  const dir = workDir(id, name);
  if (fs.existsSync(path.join(dir, "estilo", "estilo.json"))) return log(id, "a decupagem deste estilo já foi feita: seguindo para a receita", "passo");
  fs.mkdirSync(dir, { recursive: true });
  const limit = seconds > 0 ? ["--ate", String(seconds)] : [];
  must(await tool(id, "decupar", [source, "--nome", name, "--pasta", "decupagem", ...limit], dir), "a decupagem falhou");
  const again = fs.existsSync(path.join(STYLES, name)) ? ["--sobrescrever"] : [];
  must(await tool(id, "novo_estilo", [path.join("decupagem", name), ...again], dir), "a criação do estilo falhou");
  if (!fs.existsSync(path.join(STYLES, name, "estilo.json"))) throw new Error("o novo_estilo.py não escreveu o estilo");
  fs.cpSync(path.join(STYLES, name), path.join(dir, "estilo"), { recursive: true });
}

// devolve a cópia completada pelo agente, se o estilo.json dela ainda for um JSON válido
function publish(id, name) {
  const copy = path.join(workDir(id, name), "estilo");
  JSON.parse(fs.readFileSync(path.join(copy, "estilo.json"), "utf8"));
  fs.cpSync(copy, path.join(STYLES, name), { recursive: true });
  log(id, `estilo ${name} pronto em motor-animado/estilos/${name}`, "passo");
}

// o trabalho inteiro (roda dentro de job(), em passos.mjs)
export async function styleFromVideo(id, name, source, seconds) {
  await decupe(id, name, source, seconds);
  const answer = await askAgent(id, newStylePrompt(name, `estilo-${name}`), { step: "cenas" });
  if (!answer.ok) throw new Error(`o estilo foi criado com os números, mas a receita não foi completada: ${answer.text}`);
  publish(id, name);
}
