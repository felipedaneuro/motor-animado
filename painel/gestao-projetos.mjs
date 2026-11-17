// gestao-projetos.mjs: a aba Projetos. O cartão de cada projeto (capa, etapa, vídeos, espaço no disco), duplicar sem
// o que o painel refaz sozinho (vídeos renderizados, saída de render, dependências) e excluir para a lixeira do painel
// (videos/_lixeira), de onde dá para recuperar a pasta inteira. Esvaziar a lixeira é decisão da pessoa, fora do painel.
import fs from "node:fs";
import path from "node:path";
import { VIDEOS, freeId, listProjects, loadProject, log, projectDir, saveProject } from "./projetos.mjs";

export const trashDir = () => path.join(VIDEOS, "_lixeira");

// fica de fora da cópia: o render e as dependências (refazem-se) e o registro de atividade (a cópia começa o dela)
const SKIP_ROOT = new Set(["out", "node_modules", "painel-atividade.jsonl"]);
export function skipOnCopy(relative) {
  if (!relative) return false;
  const parts = relative.split(path.sep);
  if (SKIP_ROOT.has(parts[0]) || parts.includes("node_modules")) return true;
  return parts.length === 1 && (/^video-.*\.(mp4|mov|webm)$/i.test(parts[0]) || /\.film\.json$/i.test(parts[0]));
}

// o espaço que a pasta ocupa, sem seguir atalhos (o node_modules do projeto é um atalho para o do painel)
export function folderBytes(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    total += entry.isDirectory() ? folderBytes(full) : fs.statSync(full).size;
  }
  return total;
}

function cardOf(id) {
  const state = loadProject(id), cover = path.join(projectDir(id), "mapa", "f01.png");
  return { id, titulo: state.titulo, criadoEm: state.criadoEm, estilo: state.estilo, passo: state.passo,
    ocupado: state.ocupado, publicoAlvo: state.publicoAlvo || null, especialidade: state.especialidade || null,
    videos: (state.videos || []).length, ultimoVideo: (state.videos || []).at(-1)?.file || null,
    bytes: folderBytes(projectDir(id)), capa: fs.existsSync(cover) ? `/arquivos/${id}/mapa/f01.png` : null };
}

export const projectCards = () => listProjects().map(({ id }) => cardOf(id));

const mustBeIdle = (state, what) => {
  if (state.ocupado) throw new Error(`o projeto está trabalhando (${state.ocupado}): espere terminar para ${what}`);
};

export function duplicateProject(id) {
  const source = loadProject(id);
  mustBeIdle(source, "duplicar");
  const copy = freeId(`${id}-copia`), from = projectDir(id);
  fs.cpSync(from, projectDir(copy), { recursive: true, verbatimSymlinks: true,
    filter: (file) => !skipOnCopy(path.relative(from, file)) });
  saveProject({ ...source, id: copy, titulo: `${source.titulo} (cópia)`, criadoEm: new Date().toISOString(),
    passo: source.passo === "pronto" ? "voz" : source.passo, videos: [], ocupado: null, erro: null, retomar: null,
    origem: id });
  log(copy, `cópia de "${source.titulo}" (sem os vídeos renderizados)`, "passo");
  return copy;
}

// move a pasta inteira para videos/_lixeira/<id>--<data>; nada é apagado
export function trashProject(id) {
  mustBeIdle(loadProject(id), "excluir");
  fs.mkdirSync(trashDir(), { recursive: true });
  const target = path.join(trashDir(), `${id}--${new Date().toISOString().replace(/[:.]/g, "-")}`);
  fs.renameSync(projectDir(id), target);
  return path.relative(VIDEOS, target);
}

// os campos da ideia, para começar um projeto novo com as mesmas escolhas do original
export function ideaOf(id) {
  const { frase, objetivo, duracao, publico, publicoAlvo, especialidade } = loadProject(id);
  return { frase, objetivo, duracao, publico, publicoAlvo: publicoAlvo || null, especialidade: especialidade || null };
}
