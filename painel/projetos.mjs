// projetos.mjs: onde ficam os projetos do painel (videos/<id>/painel.json), o registro de atividade e quem está ouvindo.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const VIDEOS = path.join(ROOT, "videos");
export const MOTOR = path.join(ROOT, "motor-animado");

const listeners = new Map();   // id -> Set de funções que recebem cada evento
const children = new Map();    // id -> Set dos processos que um trabalho do projeto abriu (para o botão Parar)
const STEPS = ["ideia", "roteiro", "estilo", "cenas", "voz", "pronto"];

export const projectDir = (id) => path.join(VIDEOS, id);
const stateFile = (id) => path.join(projectDir(id), "painel.json");
const logFile = (id) => path.join(projectDir(id), "painel-atividade.jsonl");

export const slugify = (text) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

// só nomes de pasta simples: nada de "..", barras ou caminhos
export const validId = (id) => /^[a-z0-9][a-z0-9-]{0,60}$/.test(id) && fs.existsSync(stateFile(id));

export function createProject({ frase, objetivo, duracao, publico, publicoAlvo = null, especialidade = null }) {
  const base = slugify(frase) || "video";
  let id = base;
  for (let n = 2; fs.existsSync(projectDir(id)); n++) id = `${base}-${n}`;
  fs.mkdirSync(projectDir(id), { recursive: true });
  const state = { id, frase, objetivo, duracao, publico, publicoAlvo, especialidade, criadoEm: new Date().toISOString(), passo: "ideia", ocupado: null,
    estilo: null, ajustes: {}, sugestoes: [], avisos: [], titulo: frase, videos: [] };
  saveProject(state);
  return state;
}

export const loadProject = (id) => JSON.parse(fs.readFileSync(stateFile(id), "utf8"));

export function saveProject(state) {
  fs.writeFileSync(stateFile(state.id), JSON.stringify(state, null, 2));
  emit(state.id, { tipo: "estado" });
}

export function updateProject(id, changes) {
  const state = { ...loadProject(id), ...changes };
  saveProject(state);
  return state;
}

// o passo só anda para a frente (refazer um passo anterior não apaga o que já foi feito depois)
export function advance(id, step) {
  const state = loadProject(id);
  return STEPS.indexOf(step) > STEPS.indexOf(state.passo) ? updateProject(id, { passo: step }) : state;
}

export function listProjects() {
  if (!fs.existsSync(VIDEOS)) return [];
  return fs.readdirSync(VIDEOS).filter((id) => fs.existsSync(stateFile(id))).map(loadProject)
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    .map(({ id, titulo, passo, criadoEm, estilo, ocupado }) => ({ id, titulo, passo, criadoEm, estilo, ocupado }));
}

export const readText = (id, file) => {
  const full = path.join(projectDir(id), file);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
};
export const readJson = (id, file, fallback = null) => {
  try { return JSON.parse(readText(id, file)); } catch { return fallback; }
};
export const writeText = (id, file, text) => fs.writeFileSync(path.join(projectDir(id), file), text);

// ---------- processos de um trabalho: o botão Parar encerra todos ----------
export function trackChild(id, child) {
  if (!id) return;
  if (!children.has(id)) children.set(id, new Set());
  children.get(id).add(child);
  child.on("close", () => children.get(id)?.delete(child));
}

export function stopChildren(id) {
  const running = [...(children.get(id) || [])];
  running.forEach((child) => child.kill("SIGTERM"));
  return running.length;
}

// ---------- atividade ----------
function emit(id, event) {
  for (const listener of listeners.get(id) || []) listener(event);
}

export function log(id, texto, tipo = "info") {
  const entry = { quando: new Date().toISOString(), tipo, texto: String(texto).slice(0, 600) };
  fs.appendFileSync(logFile(id), JSON.stringify(entry) + "\n");
  emit(id, { tipo: "atividade", ...entry });
}

export function recentActivity(id, count = 120) {
  const text = fs.existsSync(logFile(id)) ? fs.readFileSync(logFile(id), "utf8") : "";
  return text.trim().split("\n").filter(Boolean).slice(-count).map((line) => JSON.parse(line));
}

export function subscribe(id, listener) {
  if (!listeners.has(id)) listeners.set(id, new Set());
  listeners.get(id).add(listener);
  return () => listeners.get(id).delete(listener);
}
