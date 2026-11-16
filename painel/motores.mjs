// motores.mjs: os outros motores de vídeo instalados (skills e plugins): o que cada um precisa, se está pronto e como
// preparar. Preparar só instala dentro do projeto (painel/motores ou o .venv), nunca no sistema, e só com o clique da pessoa.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ROOT, log, projectDir } from "./projetos.mjs";
import { run } from "./ferramentas.mjs";
import { ANIDOODLE_GROUPS, anidoodleStyles } from "./estilos-anidoodle.mjs";
import { HUASHU_GROUPS, huashuStyles } from "./estilos-huashu.mjs";

const WORK = path.join(ROOT, "painel", "motores");
const CLAUDE_HOME = path.join(process.env.HOME || "", ".claude");
const VENV = path.join(ROOT, ".venv", "bin");
const hasPlaywright = () => fs.existsSync(path.join(WORK, "node_modules", "playwright-core"));
const hasCommand = (name) => { try { execFileSync("which", [name], { stdio: "ignore" }); return true; } catch { return false; } };
const PLAYWRIGHT = { pronto: hasPlaywright, setup: [{ command: "npm", args: ["install", "--no-fund", "--no-audit", "playwright-core"], cwd: WORK }],
  precisa: "o pacote playwright-core (npm), instalado em painel/motores; o Chrome que você já tem faz o render" };

// a skill de cada motor é instalada por fora (ela é de outra pessoa): aqui o painel só procura onde ela costuma ficar
function findSkill(folder) {
  const roots = [path.join(CLAUDE_HOME, "skills"), path.join(CLAUDE_HOME, "plugins", "cache"), path.join(CLAUDE_HOME, "plugins", "marketplaces")];
  const found = [];
  const look = (dir, depth) => {
    if (depth > 4 || !fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const full = path.join(dir, entry.name);
      if (entry.name === folder && fs.existsSync(path.join(full, "SKILL.md"))) found.push(full);
      else if (entry.name !== "node_modules") look(full, depth + 1);
    }
  };
  roots.forEach((root) => look(root, 0));
  return found[0] || "";
}

// pasta: o nome da pasta da skill; skill: como o agente a chama; instalarSkill: o que a pessoa roda uma vez, fora do painel
export const ENGINES = {
  "javascript-animation": { rotulo: "Animação em canvas", skill: "javascript-animation-skills:javascript-animation", pasta: "javascript-animation",
    instalarSkill: ["/plugin marketplace add iart-ai/javascript-animation-skills", "/plugin install javascript-animation-skills@javascript-animation-skills"],
    ...PLAYWRIGHT, resumo: "Cada quadro desenhado em JavaScript, sem imagens, exportado para MP4, com trilha gerada em código." },
  anidoodle: { rotulo: "Anidoodle", skill: "anidoodle:anidoodle", pasta: "anidoodle",
    instalarSkill: ["/plugin marketplace add https://github.com/alexgreensh/anidoodle.git", "/plugin install anidoodle@alexgreensh-anidoodle"],
    ...PLAYWRIGHT, resumo: "Desenhos feitos em código, timelapse de desenho e explicativos em 32 estilos. Na primeira vez instala as dependências do filme na pasta do vídeo.",
    estilos: anidoodleStyles, grupos: ANIDOODLE_GROUPS, folha: path.join("assets", "styles.jpg"),
    escolhaEstilo: "Este motor desenha cada vídeo num dos 32 estilos dele: escolha um antes de produzir." },
  manim: { rotulo: "Manim (estilo 3Blue1Brown)", skill: "manimce-best-practices", pasta: "manimce-best-practices",
    instalarSkill: ["npx skills add adithya-s-k/manim_skill -g -a claude-code"],
    pronto: () => fs.existsSync(path.join(VENV, "manim")), setup: [{ command: path.join(VENV, "pip"), args: ["install", "manim"], cwd: ROOT }],
    precisa: "o Manim no ambiente Python do projeto (.venv) e as bibliotecas de desenho do sistema: brew install pkg-config cairo pango",
    resumo: "Explicações matemáticas e científicas com gráficos e fórmulas animadas." },
  "huashu-art-motion": { rotulo: "Huashu Art Motion", skill: "huashu-art-motion", pasta: "huashu-art-motion",
    instalarSkill: ["npx skills add alchaincyf/huashu-art-motion -g -a claude-code"],
    pronto: () => hasCommand("uv"), setup: [], precisa: "o programa uv, que o painel não instala (é do sistema): brew install uv",
    estilos: huashuStyles, grupos: HUASHU_GROUPS, temNota: true, escolhaEstilo: "Este motor tem um estilo de desenho por ficha: escolha um antes de produzir.",
    resumo: "Animação artística e vídeo explicativo com 36 estilos e revisão de enquadramento." },
};

export const engineNames = () => Object.keys(ENGINES);
export const engineSkillPath = (name) => findSkill(ENGINES[name].pasta);

// a folha de amostras que vem com a skill do motor (o painel recorta as miniaturas dela na página)
export function engineSheet(name) {
  const engine = ENGINES[name], skill = engine?.folha ? findSkill(engine.pasta) : "";
  const file = skill ? path.join(skill, engine.folha) : "";
  return file && fs.existsSync(file) ? file : "";
}

// pronto = a skill (de outra pessoa, instalada por fora) mais as dependências que o painel sabe instalar
export function engineStatus() {
  return Object.entries(ENGINES).map(([nome, e]) => {
    const caminho = findSkill(e.pasta);
    return { nome, rotulo: e.rotulo, resumo: e.resumo, temSkill: Boolean(caminho), caminho, instalarSkill: e.instalarSkill,
      temDependencias: e.pronto(), pronto: Boolean(caminho) && e.pronto(), precisa: e.precisa,
      estilos: e.estilos ? e.estilos(caminho) : [], escolhaEstilo: e.escolhaEstilo || "", grupos: e.grupos || [],
      temNota: Boolean(e.temNota), folha: e.folha && caminho && fs.existsSync(path.join(caminho, e.folha)) ? `/folhas/${nome}.jpg` : null,
      podePreparar: e.setup.length > 0, comandos: e.setup.map((s) => `${path.basename(s.command)} ${s.args.join(" ")}`) };
  });
}

// instala o que o motor precisa (a lista fixa acima), mostrando cada linha no registro do projeto
export async function prepareEngine(id, name) {
  const engine = ENGINES[name];
  if (!engine) throw new Error("motor desconhecido");
  if (!findSkill(engine.pasta)) throw new Error(`a skill do ${engine.rotulo} não está instalada. Instale uma vez, fora do painel: ${engine.instalarSkill.join(" e depois ")}`);
  if (!engine.setup.length) throw new Error(`o painel não instala isto: ${engine.precisa}`);
  fs.mkdirSync(WORK, { recursive: true });
  const manifest = path.join(WORK, "package.json");
  if (!fs.existsSync(manifest)) fs.writeFileSync(manifest, JSON.stringify({ name: "painel-motores", private: true }, null, 2) + "\n");
  for (const step of engine.setup) {
    log(id, `${path.basename(step.command)} ${step.args.join(" ")}`, "comando");
    const result = await run(step.command, step.args, step.cwd, (line) => log(id, line, "saida"), id);
    if (result.code !== 0) throw new Error(`a instalação falhou: ${result.output.trim().split("\n").slice(-3).join(" | ")}`);
  }
}

// os scripts das skills procuram o playwright-core na pasta em que rodam: a pasta do vídeo ganha um atalho para o do painel
export function linkModules(id) {
  const link = path.join(projectDir(id), "node_modules"), target = path.join(WORK, "node_modules");
  if (fs.existsSync(target) && !fs.existsSync(link)) fs.symlinkSync(target, link, "dir");
}
