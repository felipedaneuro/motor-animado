// passos.mjs: o que acontece em cada botão do painel. Um trabalho por vez em cada projeto; tudo vai para o registro de atividade.
import { askAgent } from "./agentes.mjs";
import fs from "node:fs";
import path from "node:path";
import { checkVideo, mount, previewFrame, recordVoice, renderVideo, sceneMap, validateScene } from "./ferramentas.mjs";
import { adjustPrompt, blackPrompt, externalPrompt, fixPrompt, reviewPrompt, scenePrompt, scriptPrompt } from "./instrucoes.mjs";
import { ENGINES, engineSkillPath, linkModules, prepareEngine } from "./motores.mjs";
import { advance, loadProject, log, projectDir, readJson, updateProject, writeText } from "./projetos.mjs";

const MAX_FIXES = 3, MAX_REVIEWS = 2;

// roda um trabalho marcando o projeto como ocupado; erro vira linha no registro, nunca derruba o painel
export async function job(id, label, work) {
  if (loadProject(id).ocupado) throw new Error("já existe um trabalho rodando neste projeto");
  updateProject(id, { ocupado: label, erro: null });
  log(id, `começou: ${label}`, "passo");
  try {
    await work();
    log(id, `terminou: ${label}`, "passo");
  } catch (error) {
    log(id, `${label} parou: ${error.message}`, "erro");
    updateProject(id, { erro: error.message });
  } finally {
    updateProject(id, { ocupado: null });
  }
}

async function ask(id, prompt, options = {}) {
  const answer = await askAgent(id, prompt, options);
  if (!answer.ok) throw new Error(answer.text || "o agente não respondeu");
  return answer.text;
}

function absorbScript(id) {
  const data = readJson(id, "painel-roteiro.json", {});
  updateProject(id, { titulo: data.titulo || loadProject(id).titulo, resumo: data.resumo || "", avisos: data.avisos || [],
    sugestoes: data.sugestoes || [] });
}

export const writeScript = (id) => job(id, "roteiro e fontes", async () => {
  try {
    await ask(id, scriptPrompt(loadProject(id)), { step: "roteiro" });
  } finally {
    absorbScript(id);   // o que já foi escrito vale, mesmo se a última resposta falhou (limite de uso, queda de rede)
  }
  advance(id, "roteiro");
});

// corrige até a cena carregar e o mapa sair com imagem; devolve false se desistiu
async function untilItDraws(id) {
  for (let attempt = 0; attempt <= MAX_FIXES; attempt++) {
    const problem = await validateScene(id);
    if (problem) { await ask(id, fixPrompt(problem)); continue; }
    const map = await sceneMap(id);
    if (map.ok && !map.black) return true;
    await ask(id, map.ok ? blackPrompt() : fixPrompt(map.error));
  }
  return false;
}

async function drawAndReview(id) {
  if (!(await untilItDraws(id))) throw new Error("a cena não carregou depois de 3 correções; peça um ajuste descrevendo o que quer");
  for (let round = 0; round < MAX_REVIEWS; round++) {
    const verdict = await ask(id, reviewPrompt());
    if (!/CORRIGIDO/.test(verdict)) return;
    if (!(await untilItDraws(id))) throw new Error("a correção do mapa quebrou a cena; peça um ajuste");
  }
}

export const buildScenes = (id) => job(id, "cenas e mapa", async () => {
  const state = loadProject(id);
  writeText(id, "estilo-ajustes.json", JSON.stringify(state.ajustes || {}, null, 2));
  await recordVoice(id, "mac");
  await mount(id, state.estilo);
  await ask(id, scenePrompt(state));
  await drawAndReview(id);
  advance(id, "cenas");
});

export const adjust = (id, request) => job(id, "ajuste pedido", async () => {
  const state = loadProject(id);
  const answer = await ask(id, adjustPrompt(state, request), { step: "ajuste" });
  if (/^ROTEIRO/m.test(answer)) {
    absorbScript(id);
    if (state.estilo && ["cenas", "voz", "pronto"].includes(state.passo)) {
      await recordVoice(id, "mac");
      await mount(id, state.estilo);
      await drawAndReview(id);
      updateProject(id, { vozFinal: null });
    }
  } else if (/^CENA/m.test(answer)) {
    await drawAndReview(id);
  }
});

export const voice = (id, engine) => job(id, `voz (${engine})`, async () => {
  const state = loadProject(id);
  await recordVoice(id, engine);
  await mount(id, state.estilo);
  if (!(await untilItDraws(id))) throw new Error("a cena não fechou com os tempos da voz nova; peça um ajuste");
  updateProject(id, { vozFinal: engine });
  advance(id, "voz");
});

export const render = (id, final) => job(id, final ? "render final" : "render de rascunho", async () => {
  const result = await renderVideo(id, final);
  const state = loadProject(id);
  updateProject(id, { videos: [...(state.videos || []), { ...result, quando: new Date().toISOString(), voz: state.vozFinal || "teste do Mac" }] });
  advance(id, "pronto");
});

export const preview = (id, style, adjustments) => previewFrame(id, style, adjustments);

// ---------- os outros motores ----------
export const prepare = (id, name) => job(id, `preparar o motor ${name}`, () => prepareEngine(id, name));

function nextOutput(id, name) {
  for (let n = 1; ; n++) {
    const file = `video-${name}-v${n}.mp4`;
    if (!fs.existsSync(path.join(projectDir(id), file))) return file;
  }
}

// o vídeo inteiro por um motor de fora: a voz já gravada (ou a de teste), a skill do motor em modo livre e a conferência
export const produce = (id, name, voiceEngine) => job(id, `vídeo pelo motor ${name}`, async () => {
  const engine = ENGINES[name], skillPath = engineSkillPath(name);
  if (!skillPath) throw new Error(`a skill do ${engine.rotulo} não está instalada. Instale uma vez, fora do painel: ${engine.instalarSkill.join(" e depois ")}`);
  if (!engine.pronto()) throw new Error(`o motor ainda não está pronto: falta ${engine.precisa}`);
  const state = loadProject(id);
  if (!fs.existsSync(path.join(projectDir(id), "voz", "tempos.json")) || (voiceEngine && voiceEngine !== state.vozFinal)) {
    await recordVoice(id, voiceEngine || "mac");
    updateProject(id, { vozFinal: voiceEngine && voiceEngine !== "mac" ? voiceEngine : null });
  }
  linkModules(id);
  const output = nextOutput(id, name);
  // quando o motor tem fichas de estilo, o painel manda a ficha escolhida junto (estilo = "externo:<motor>:<ficha>")
  const chosen = String(state.estilo || "").split(":")[2] || "";
  const card = chosen && engine.estilos ? engine.estilos(skillPath).find((s) => s.id === chosen) : null;
  const answer = await ask(id, externalPrompt(engine, output, skillPath, card), { step: "externo", free: true });
  if (!fs.existsSync(path.join(projectDir(id), output))) throw new Error(`o motor não entregou o vídeo: ${answer.trim().split("\n").pop()}`);
  const check = await checkVideo(id, output);
  const now = loadProject(id);
  updateProject(id, { videos: [...(now.videos || []), { file: output, check, final: true, motor: engine.rotulo, quando: new Date().toISOString(), voz: now.vozFinal || "teste do Mac" }] });
  advance(id, "pronto");
});
