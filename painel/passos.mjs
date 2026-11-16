// passos.mjs: o que acontece em cada botão do painel. Um trabalho por vez em cada projeto; tudo vai para o registro de atividade.
import { agentLabel, askAgent, canTakeOver } from "./agentes.mjs";
import { loadConfig } from "./config.mjs";
import fs from "node:fs";
import path from "node:path";
import { checkVideo, mount, previewFrame, recordVoice, renderVideo, sceneMap, validateScene } from "./ferramentas.mjs";
import { adjustPrompt, blackPrompt, continuePrompt, detailPrompt, externalPrompt, fixPrompt, reviewPrompt, scenePrompt,
  scriptPrompt } from "./instrucoes.mjs";
import { ENGINES, engineSkillPath, linkModules, prepareEngine } from "./motores.mjs";
import { styleFromVideo } from "./estilo-video.mjs";
import { keepTimings, swapExternalVoice } from "./trocar-voz.mjs";
import { advance, loadProject, log, projectDir, readJson, readText, stopChildren, updateProject, writeText } from "./projetos.mjs";
import { phrasesOf } from "./ilustracoes.mjs";
import { rhythmWarnings } from "./nicho.mjs";

const MAX_FIXES = 3, MAX_REVIEWS = 2;
const running = new Set();   // os projetos com um trabalho de verdade rodando neste processo do painel
export const isRunning = (id) => running.has(id);

// roda um trabalho marcando o projeto como ocupado; erro vira linha no registro, nunca derruba o painel.
// A checagem de ocupado é síncrona: quem chama recebe o erro na hora, em vez de uma promessa rejeitada sem dono.
export function job(id, label, work) {
  if (running.has(id) || loadProject(id).ocupado) throw new Error("já existe um trabalho rodando neste projeto");
  running.add(id);
  updateProject(id, { ocupado: label, erro: null, erroAgente: null, trocas: {} });
  log(id, `começou: ${label}`, "passo");
  return runJob(id, label, work);
}

async function runJob(id, label, work) {
  try {
    await work();
    log(id, `terminou: ${label}`, "passo");
  } catch (error) {
    const message = loadProject(id).parado ? "parado por você" : error.message;
    log(id, `${label} parou: ${message}`, "erro");
    // a cota acabou e nenhum agente pôde assumir: a página oferece trocar o agente do passo e continuar
    updateProject(id, { erro: message, erroAgente: error.cota ? { passo: error.passo, agente: error.agente } : null });
  } finally {
    running.delete(id);
    updateProject(id, { ocupado: null, retomar: null, parado: null, trocas: {} });
  }
}

// o botão Parar: encerra os programas do trabalho; sem nenhum rodando, só destrava o projeto (ficou preso)
export function stop(id) {
  if (!loadProject(id).ocupado) return { parados: 0 };
  updateProject(id, { parado: true });
  const count = stopChildren(id);
  if (!count) {
    running.delete(id);
    updateProject(id, { ocupado: null, parado: null, erro: "o trabalho estava travado e foi destravado" });
    log(id, "trabalho destravado", "erro");
  }
  return { parados: count };
}

// ---------- a troca automática de agente quando a cota acaba ----------
const FALLBACK_ORDER = ["claude", "codex", "gemini", "local"];
const LOCAL_STEPS = ["cenas", "ajuste"];   // a IA local só assume rascunho de cena e ajuste, nunca roteiro nem produção

function nextAgent(step, tried) {
  const preference = loadConfig().reserva;
  if (!preference) return null;
  const order = preference === "auto" ? FALLBACK_ORDER : [preference];
  return order.find((name) => !tried.has(name) && canTakeOver(name, step) && (name !== "local" || LOCAL_STEPS.includes(step))) || null;
}

function agentError(answer, step) {
  return Object.assign(new Error(answer.text || "o agente não respondeu"), { cota: Boolean(answer.cota), passo: step, agente: answer.agente });
}

// manda o pedido; se a cota do agente acabar, o próximo assume (e fica com o passo até o fim deste trabalho).
// "continuar": o primeiro pedido do trabalho repetido avisa o agente que a tentativa anterior parou no meio.
export async function ask(id, prompt, options = {}) {
  const state = loadProject(id), step = options.step || "cenas", tried = new Set();
  if (state.retomar) updateProject(id, { retomar: null });
  let text = state.retomar ? continuePrompt(state.retomar) + prompt : prompt, agent = state.trocas?.[step] || null;
  for (;;) {
    const answer = await askAgent(id, text, { ...options, step, agent });
    if (answer.ok) return answer.text;
    tried.add(answer.agente);
    const next = answer.cota && !loadProject(id).parado ? nextAgent(step, tried) : null;
    if (!next) throw agentError(answer, step);
    log(id, `${agentLabel(answer.agente)} chegou ao limite de uso: o trabalho segue com o ${agentLabel(next)}`, "passo");
    updateProject(id, { trocas: { ...(loadProject(id).trocas || {}), [step]: next } });
    agent = next;
    text = continuePrompt(`o ${agentLabel(answer.agente)} chegou ao limite de uso no meio do trabalho; você assume daqui`) + prompt;
  }
}

// o que o agente escreveu vai para o projeto; na edição médica o painel ainda confere o tamanho das frases, sem IA
function absorbScript(id) {
  const data = readJson(id, "painel-roteiro.json", {}), state = loadProject(id);
  const rhythm = rhythmWarnings(state, phrasesOf(readText(id, "roteiro.txt")));
  updateProject(id, { titulo: data.titulo || state.titulo, resumo: data.resumo || "", avisos: [...rhythm, ...(data.avisos || [])],
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

// grava a voz, remonta a cena com os tempos novos e confere se ela ainda desenha
async function recordAndFit(id, engine) {
  await recordVoice(id, engine);
  await mount(id, loadProject(id).estilo);
  if (!(await untilItDraws(id))) throw new Error("a cena não fechou com os tempos da voz nova; peça um ajuste");
  updateProject(id, { vozFinal: engine });
}

// guarda o vídeo na lista do projeto, com os tempos da voz que ele usou (a troca de voz precisa deles)
function listVideo(id, entry) {
  keepTimings(id, entry.file);
  const state = loadProject(id);
  updateProject(id, { videos: [...(state.videos || []), { ...entry, quando: new Date().toISOString(), voz: state.vozFinal || "teste do Mac" }] });
  advance(id, "pronto");
}

export const voice = (id, engine) => job(id, `voz (${engine})`, async () => {
  await recordAndFit(id, engine);
  advance(id, "voz");
});

export const render = (id, final) => job(id, final ? "render final" : "render de rascunho", async () => listVideo(id, await renderVideo(id, final)));

// trocar só a voz de um vídeo pronto. Estilos do painel: grava, remonta e renderiza de novo (a cena acompanha os
// tempos sozinha, sem a IA). Outros motores: estica cada frase do vídeo pronto até a duração dela na voz nova.
// file vazio: gravar a voz escolhida e renderizar (o botão de render quando a voz marcada não é a gravada).
export const revoice = (id, engine, file, final) => job(id, `trocar a voz (${engine})`, async () => {
  const video = file ? (loadProject(id).videos || []).find((v) => v.file === file) : null;
  if (file && !video) throw new Error("vídeo não encontrado neste projeto");
  if (video?.motor) {
    const entry = await swapExternalVoice(id, video, engine);
    updateProject(id, { vozFinal: engine });
    return listVideo(id, entry);
  }
  await recordAndFit(id, engine);
  listVideo(id, await renderVideo(id, video ? Boolean(video.final) : final));
});

export const preview = (id, style, adjustments) => previewFrame(id, style, adjustments);

// um estilo novo a partir de um vídeo de referência (decupagem, novo_estilo.py e a receita completada pelo agente)
export const newStyle = (id, name, source, seconds) => job(id, `estilo novo ${name}`, () => styleFromVideo(id, name, source, seconds, ask));

// reescreve com mais detalhe o que aparece na tela numa frase (ilustração, fundo e objetos)
export const detail = (id, phrase) => job(id, `detalhar a frase ${phrase}`, async () => {
  await ask(id, detailPrompt(id, phrase), { step: "ajuste" });
  absorbScript(id);
});

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
  const answer = await ask(id, externalPrompt(engine, output, skillPath, card, state), { step: "externo", free: true });
  if (!fs.existsSync(path.join(projectDir(id), output))) throw new Error(`o motor não entregou o vídeo: ${answer.trim().split("\n").pop()}`);
  listVideo(id, { file: output, check: await checkVideo(id, output), final: true, motor: engine.rotulo });
});
