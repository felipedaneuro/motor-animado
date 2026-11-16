// ilustracoes.mjs: o que aparece na tela em cada frase (painel-roteiro.json → ilustracoes: a ilustração, o fundo e os
// objetos) e as imagens de referência que a pessoa envia por frase (videos/<id>/referencias/frase-N/).
// Nada aqui apaga arquivo: o que sai vai para referencias/_removidas.
import fs from "node:fs";
import path from "node:path";
import { projectDir, readJson, writeText } from "./projetos.mjs";

const SCRIPT_DATA = "painel-roteiro.json";
const REFS = "referencias";
const REMOVED = "_removidas";
const FIELDS = ["naTela", "fundo", "objetos"];
export const IMAGE_TYPES = new Set([".jpg", ".jpeg", ".png", ".webp"]);
export const MAX_IMAGE_BYTES = 15e6;

const refRoot = (id) => path.join(projectDir(id), REFS);
const refDir = (id, phrase) => path.join(refRoot(id), `frase-${phrase}`);
export const validPhrase = (n) => Number.isInteger(n) && n >= 1 && n <= 300;

// as frases do roteiro (sem a linha de comentário do começo)
export const phrasesOf = (text) => String(text || "").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));

const imagesIn = (dir) => fs.existsSync(dir)
  ? fs.readdirSync(dir).filter((f) => IMAGE_TYPES.has(path.extname(f).toLowerCase())).sort() : [];

// {1: ["a.jpg"], 3: ["b.png", "c.png"]}
export function references(id) {
  if (!fs.existsSync(refRoot(id))) return {};
  const found = {};
  for (const folder of fs.readdirSync(refRoot(id))) {
    const match = /^frase-(\d+)$/.exec(folder);
    const files = match ? imagesIn(path.join(refRoot(id), folder)) : [];
    if (files.length) found[match[1]] = files;
  }
  return found;
}

function loadData(id) {
  const data = readJson(id, SCRIPT_DATA, {}) || {};
  return { ...data, ilustracoes: Array.isArray(data.ilustracoes) ? data.ilustracoes : [] };
}

const saveData = (id, data) => writeText(id, SCRIPT_DATA, JSON.stringify(data, null, 2) + "\n");

// changes: {naTela, fundo, objetos}; só esses três campos entram
export function saveIllustration(id, phrase, changes) {
  if (!validPhrase(phrase)) throw new Error("frase inválida");
  const data = loadData(id);
  let item = data.ilustracoes.find((i) => Number(i.frase) === phrase);
  if (!item) data.ilustracoes.push(item = { frase: phrase });
  for (const field of FIELDS) if (field in changes) item[field] = String(changes[field] ?? "").slice(0, 2000);
  data.ilustracoes.sort((a, b) => Number(a.frase) - Number(b.frase));
  saveData(id, data);
  return item;
}

// um nome de arquivo seguro e que ainda não existe na pasta da frase
export function referenceTarget(id, phrase, original) {
  if (!validPhrase(phrase)) throw new Error("frase inválida");
  const ext = path.extname(String(original)).toLowerCase();
  if (!IMAGE_TYPES.has(ext)) throw new Error("envie uma imagem .jpg, .png ou .webp");
  const base = path.basename(String(original), path.extname(String(original))).normalize("NFD").replace(/[^\w-]+/g, "-").slice(0, 40) || "ref";
  fs.mkdirSync(refDir(id, phrase), { recursive: true });
  let name = `${base}${ext}`;
  for (let n = 2; fs.existsSync(path.join(refDir(id, phrase), name)); n++) name = `${base}-${n}${ext}`;
  return path.join(refDir(id, phrase), name);
}

function moveAside(id, from, label) {
  const removed = path.join(refRoot(id), REMOVED);
  fs.mkdirSync(removed, { recursive: true });
  fs.renameSync(from, path.join(removed, `${Date.now()}-${label}`));
}

export function removeReference(id, phrase, file) {
  if (!validPhrase(phrase) || path.basename(String(file)) !== file) throw new Error("referência inválida");
  const full = path.join(refDir(id, phrase), file);
  if (!fs.existsSync(full)) throw new Error("referência não encontrada");
  moveAside(id, full, `frase-${phrase}-${file}`);
}

// a ordem nova das frases: origins[k] = o número antigo da frase que agora é a k+1 (null = frase nova).
// A ilustração e as referências acompanham a frase; as de frases apagadas vão para _removidas.
export function reorderPhrases(id, origins) {
  if (origins.every((old, k) => old === k + 1) && origins.length >= loadData(id).ilustracoes.length) return;
  const data = loadData(id);
  data.ilustracoes = origins.map((old, k) => ({ ...(data.ilustracoes.find((i) => Number(i.frase) === old) || { naTela: "" }), frase: k + 1 }));
  saveData(id, data);
  moveReferenceFolders(id, origins);
}

function moveReferenceFolders(id, origins) {
  if (!fs.existsSync(refRoot(id))) return;
  const staged = path.join(refRoot(id), `_ordem-${Date.now()}`);
  fs.mkdirSync(staged);
  const folders = fs.readdirSync(refRoot(id)).filter((f) => /^frase-\d+$/.test(f));
  folders.forEach((folder) => fs.renameSync(path.join(refRoot(id), folder), path.join(staged, folder)));
  origins.forEach((old, k) => {
    const from = path.join(staged, `frase-${old}`);
    if (old && fs.existsSync(from)) fs.renameSync(from, refDir(id, k + 1));
  });
  fs.readdirSync(staged).forEach((left) => moveAside(id, path.join(staged, left), left));
  fs.rmdirSync(staged);
}
