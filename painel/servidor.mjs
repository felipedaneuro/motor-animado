// servidor.mjs: o painel do Motor Animado. Só atende este Mac (127.0.0.1), sem pacotes externos.
//   node painel/servidor.mjs            (porta 4747, ou PORTA=5000 node painel/servidor.mjs)
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { catalog, styleNames } from "./catalogo.mjs";
import { canPreview, voiceCost } from "./ferramentas.mjs";
import { AGENTS, STEPS_NEEDING_WEB, agentNames, agentStatus, canTakeOver, modelChoices } from "./agentes.mjs";
import { VOICE_MODELS, loadConfig, saveConfig } from "./config.mjs";
import { checkVoice, keyStatus, listVoices, saveKey } from "./elevenlabs.mjs";
import { MAX_VIDEO_BYTES, checkStyleName, resolveSource, uploadTarget } from "./estilo-video.mjs";
import { MAX_IMAGE_BYTES, phrasesOf, referenceTarget, references, removeReference, reorderPhrases, saveIllustration,
  validPhrase } from "./ilustracoes.mjs";
import { engineNames, engineSheet, engineStatus } from "./motores.mjs";
import { nicheOptions, validAudience, validSpecialty } from "./nicho.mjs";
import { duplicateProject, ideaOf, projectCards, trashProject } from "./gestao-projetos.mjs";
import { adjust, buildScenes, detail, isRunning, newStyle, prepare, preview, produce, render, revoice, stop, voice,
  writeScript } from "./passos.mjs";
import { deleteTheme, saveTheme } from "./temas.mjs";
import { ROOT, VIDEOS, createProject, listProjects, loadProject, log, readJson, readText, recentActivity, subscribe,
  updateProject, validId, writeText } from "./projetos.mjs";

const PORT = Number(process.env.PORTA || process.env.PORT || 4747);
const PUBLIC = path.join(ROOT, "painel", "publico");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".mp4": "video/mp4", ".wav": "audio/wav", ".svg": "image/svg+xml" };
const VOICES = ["mac", "chatterbox-narrador", "chatterbox-narradora", "elevenlabs"];
const MEDIA = new Set([".jpg", ".jpeg", ".png", ".webp", ".mp4"]);

// outra página aberta no navegador não pode mandar pedidos ao painel: quem muda algo precisa vir da própria página do painel
function trusted(req) {
  if (req.method === "GET") return true;
  const origin = req.headers.origin || "";
  const local = !origin || /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin);
  return local && req.headers["x-painel"] === "1";
}

const json = (res, data, status = 200) => { res.writeHead(status, { "Content-Type": TYPES[".json"] }); res.end(JSON.stringify(data)); };
const fail = (res, message, status = 400) => json(res, { erro: message }, status);

// cria o projeto e já começa o roteiro (o último trabalho fica guardado para "Tentar de novo")
function startProject(fields, note = "") {
  const state = createProject(fields);
  log(state.id, note || `projeto criado: ${state.frase}`, "passo");
  writeScript(state.id);
  updateProject(state.id, { ultimoTrabalho: { acao: "gerar-roteiro", corpo: {} } });
  return state.id;
}

// o que falta no pedido de projeto novo: a ideia e o público-alvo são obrigatórios; a especialidade, se vier, precisa existir
function projectProblem(body) {
  if (!String(body.frase || "").trim()) return "escreva a ideia do vídeo";
  if (!validAudience(body.publicoAlvo)) return "escolha o público-alvo: leigo ou estudantes e profissionais de saúde";
  if (body.especialidade && !validSpecialty(body.especialidade)) return "especialidade desconhecida";
  return "";
}

function readBody(req) {
  return new Promise((resolve) => {
    let text = "";
    req.on("data", (chunk) => { text += chunk; if (text.length > 2e6) req.destroy(); });
    req.on("end", () => { try { resolve(text ? JSON.parse(text) : {}); } catch { resolve({}); } });
  });
}

// um arquivo de dentro de base (nunca de fora), com suporte a trechos (o player de vídeo pede por partes)
// download: o nome com que o navegador salva o arquivo (o botão "Salvar o vídeo"); vazio, o navegador só mostra
function sendFile(req, res, base, relative, download = "") {
  const full = path.resolve(base, relative);
  if (!full.startsWith(base + path.sep) || !fs.existsSync(full) || !fs.statSync(full).isFile()) return fail(res, "não achei", 404);
  const size = fs.statSync(full).size, type = TYPES[path.extname(full)] || "application/octet-stream";
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || "");
  const saveAs = download ? { "Content-Disposition": `attachment; filename="${download.replace(/[^\w.-]+/g, "-")}"` } : {};
  if (!range) { res.writeHead(200, { "Content-Type": type, "Content-Length": size, "Cache-Control": "no-store", ...saveAs }); return fs.createReadStream(full).pipe(res); }
  const start = Number(range[1] || 0), end = range[2] ? Number(range[2]) : size - 1;
  res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${start}-${end}/${size}`, "Accept-Ranges": "bytes", "Content-Length": end - start + 1 });
  fs.createReadStream(full, { start, end }).pipe(res);
}

function projectView(id) {
  const state = loadProject(id);
  return { ...state, roteiro: readText(id, "roteiro.txt"), fontes: readText(id, "fontes.md"),
    ilustracoes: readJson(id, "painel-roteiro.json", {})?.ilustracoes || [], cenas: readJson(id, "painel-cenas.json", []),
    referencias: references(id), rodando: isRunning(id),
    temMapa: fs.existsSync(path.join(VIDEOS, id, "mapa", "mapa.jpg")), podePrevia: canPreview(state.estilo), atividade: recentActivity(id) };
}

function events(req, res, id) {
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive" });
  const stop = subscribe(id, (event) => res.write(`data: ${JSON.stringify(event)}\n\n`));
  const beat = setInterval(() => res.write(": ok\n\n"), 20000);
  req.on("close", () => { stop(); clearInterval(beat); });
}

// os botões de um projeto: cada um começa um trabalho e responde na hora (o andamento vem pelos eventos)
const ACTIONS = {
  roteiro: (id, body) => {
    const text = String(body.texto || "");
    writeText(id, "roteiro.txt", text);
    // as frases mudaram de lugar: a ilustração e as referências de cada uma vão junto
    const origins = Array.isArray(body.origens) ? body.origens.map((n) => (validPhrase(n) ? n : null)) : null;
    if (origins && origins.length === phrasesOf(text).length) reorderPhrases(id, origins);
    return { ok: true };
  },
  "revisar-aviso": (id, body) => {
    const done = new Set(loadProject(id).avisosRevisados || []), text = String(body.texto || "");
    if (body.feito) done.add(text); else done.delete(text);
    updateProject(id, { avisosRevisados: [...done] });
    return { ok: true };
  },
  ilustracao: (id, body) => ({ item: saveIllustration(id, Number(body.frase), body.campos || {}) }),
  "referencia-remover": (id, body) => { removeReference(id, Number(body.frase), String(body.arquivo || "")); return { ok: true }; },
  detalhar: (id, body) => {
    if (!validPhrase(Number(body.frase))) throw new Error("frase inválida");
    detail(id, Number(body.frase));
    return { ok: true };
  },
  "estilo-video": (id, body) => {
    const name = String(body.nome || "").trim();
    checkStyleName(id, name);
    newStyle(id, name, resolveSource(id, body), Math.max(0, Math.min(180, Number(body.ate) || 0)));
    return { ok: true };
  },
  parar: (id) => stop(id),
  "limpar-erro": (id) => { updateProject(id, { erro: null }); return { ok: true }; },
  retomar: (id, body) => resume(id, body),
  "gerar-roteiro": (id) => { writeScript(id); return { ok: true }; },
  // a aba Projetos: um projeto novo com a mesma ideia e as mesmas escolhas (o original fica intacto), uma cópia sem os
  // vídeos renderizados, e a lixeira do painel (só com a confirmação da pessoa)
  "gerar-de-novo": (id) => ({ id: startProject(ideaOf(id), `projeto criado de novo, com a mesma ideia de "${loadProject(id).titulo}"`) }),
  duplicar: (id) => ({ id: duplicateProject(id) }),
  excluir: (id, body) => {
    if (body.confirmado !== true) throw new Error("excluir precisa da sua confirmação");
    return { lixeira: trashProject(id) };
  },
  estilo: (id, body) => {
    // "externo:<motor>" ou "externo:<motor>:<ficha do motor>" (o Huashu tem uma ficha por estilo de desenho)
    const external = String(body.estilo || "").startsWith("externo:") && engineNames().includes(body.estilo.slice(8).split(":")[0]);
    if (!external && !styleNames().includes(body.estilo)) throw new Error("estilo desconhecido");
    updateProject(id, { estilo: body.estilo, ajustes: body.ajustes || {} });
    // um motor de fora não passa pelo passo das cenas: vai direto para a voz e a produção
    const reached = loadProject(id).passo;
    if (reached === "roteiro" || (external && reached === "estilo")) updateProject(id, { passo: external ? "cenas" : "estilo" });
    return { ok: true };
  },
  "preparar-motor": (id, body) => {
    if (!engineNames().includes(body.motor)) throw new Error("motor desconhecido");
    prepare(id, body.motor);
    return { ok: true };
  },
  produzir: (id, body) => {
    if (!engineNames().includes(body.motor)) throw new Error("motor desconhecido");
    if (body.voz && !VOICES.includes(body.voz)) throw new Error("voz desconhecida");
    if (body.voz === "elevenlabs" && !body.confirmado) throw new Error("a voz paga precisa da sua confirmação");
    produce(id, body.motor, body.voz || null);
    return { ok: true };
  },
  previa: async (id, body) => ({ imagem: await preview(id, body.estilo, body.ajustes || {}) }),
  cenas: (id) => { buildScenes(id); return { ok: true }; },
  ajuste: (id, body) => { adjust(id, String(body.texto || "").slice(0, 2000)); return { ok: true }; },
  "custo-voz": async (id) => ({ custo: await voiceCost(id) }),
  voz: (id, body) => {
    if (!VOICES.includes(body.motor)) throw new Error("voz desconhecida");
    if (body.motor === "elevenlabs" && !body.confirmado) throw new Error("a voz paga precisa da sua confirmação");
    voice(id, body.motor);
    return { ok: true };
  },
  render: (id, body) => { render(id, Boolean(body.final)); return { ok: true }; },
  "trocar-voz": (id, body) => {
    if (!VOICES.includes(body.motor)) throw new Error("voz desconhecida");
    if (body.motor === "elevenlabs" && !body.confirmado) throw new Error("a voz paga precisa da sua confirmação");
    revoice(id, body.motor, String(body.arquivo || ""), Boolean(body.final));
    return { ok: true };
  },
  // a cota acabou e nenhum agente assumiu sozinho: a pessoa escolhe quem fica com o passo e o trabalho continua
  "trocar-agente": (id, body) => {
    const { erroAgente } = loadProject(id), step = erroAgente?.passo;
    if (!step) throw new Error("não há passo esperando outro agente");
    if (!canTakeOver(body.agente, step)) throw new Error("esse agente não está instalado ou não pode fazer este passo");
    saveConfig({ agentes: { [step]: body.agente }, modelos: { [step]: "" } }, configRules());
    log(id, `o passo ${step} agora é do ${AGENTS[body.agente].rotulo}`, "passo");
    return resume(id, { modo: "continuar", confirmado: body.confirmado });
  },
};

// os botões que começam um trabalho: o último fica guardado para "Continuar" e "Tentar de novo" depois de um erro
const JOBS = new Set(["gerar-roteiro", "cenas", "ajuste", "voz", "render", "produzir", "preparar-motor", "detalhar", "estilo-video",
  "trocar-voz"]);

async function runAction(id, action, body) {
  const result = await ACTIONS[action](id, body);
  if (JOBS.has(action)) {
    const { confirmado, ...corpo } = body;
    updateProject(id, { ultimoTrabalho: { acao: action, corpo } });
  }
  return result;
}

// modo "continuar": o agente retoma a conversa e é avisado de que parou no meio; "refazer": conversa nova, do zero.
// A voz paga pede a confirmação de novo (ela vem do botão, nunca do pedido guardado).
function resume(id, body) {
  const state = loadProject(id), last = state.ultimoTrabalho;
  if (!last || !JOBS.has(last.acao)) throw new Error("não há trabalho para repetir");
  if (body.modo === "refazer") updateProject(id, { sessoes: {}, sessao: null, sessaoLivre: null });
  else updateProject(id, { retomar: state.erro || "o trabalho foi interrompido" });
  try {
    return ACTIONS[last.acao](id, { ...last.corpo, confirmado: Boolean(body.confirmado) });
  } catch (error) {
    updateProject(id, { retomar: null });
    throw error;
  }
}

// um arquivo enviado pela página vem cru no corpo do pedido, até o limite de tamanho
function receiveFile(req, target, limit) {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(target);
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size <= limit) return;
      req.unpipe(out); req.destroy(); out.destroy();
      fs.rmSync(target, { force: true });   // o pedaço que chegou do envio recusado
      reject(new Error(`arquivo grande demais (máximo de ${Math.round(limit / 1e6)} MB)`));
    });
    out.on("finish", resolve);
    out.on("error", reject);
    req.pipe(out);
  });
}

// POST /api/projetos/<id>/enviar?tipo=referencia&frase=3&nome=foto.jpg  ou  ?tipo=video&nome=ref.mp4
async function upload(req, res, id, query) {
  const kind = query.get("tipo"), name = query.get("nome") || "";
  const target = kind === "referencia" ? referenceTarget(id, Number(query.get("frase")), name)
    : kind === "video" ? uploadTarget(id, name) : null;
  if (!target) return fail(res, "tipo de envio desconhecido");
  await receiveFile(req, target, kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES);
  log(id, `arquivo recebido: ${path.basename(target)}`, "info");
  json(res, { arquivo: path.basename(target) });
}

// os temas pessoais: POST /api/temas {nome, tema} cria ou atualiza; POST /api/temas/excluir {nome} apaga
async function themes(req, res, action) {
  if (req.method !== "POST") return fail(res, "ação desconhecida", 404);
  const body = await readBody(req);
  try {
    if (action === "excluir") {
      const name = String(body.nome || "");
      deleteTheme(name);
      // um projeto que usava o tema excluído volta para o natural (um tema que não existe faria a montagem parar)
      for (const { id } of listProjects()) {
        const state = loadProject(id);
        if (state.ajustes?.theme === name) updateProject(id, { ajustes: { ...state.ajustes, theme: "natural" } });
      }
      return json(res, { ok: true });
    }
    json(res, { nome: saveTheme(body.nome, body.tema) });
  } catch (error) { fail(res, error.message); }
}

// os ajustes do painel. A chave da ElevenLabs só entra (POST elevenlabs/chave); a página nunca a recebe de volta.
const settingsView = () => ({ ...loadConfig(), chave: keyStatus().chave, modelosDeVoz: VOICE_MODELS, passosComInternet: STEPS_NEEDING_WEB,
  motores: engineStatus(), agentesDisponiveis: agentStatus() });

const configRules = () => ({ names: agentNames(), choices: modelChoices, needsWeb: STEPS_NEEDING_WEB,
  offline: agentNames().filter((name) => AGENTS[name].semRoteiro) });

async function settings(req, res, parts) {
  if (req.method === "GET") return json(res, settingsView());
  const body = await readBody(req);
  try {
    if (parts[0] === "config") saveConfig(body, configRules());
    else if (parts[1] === "chave") saveKey(body.chave);
    else if (parts[1] === "vozes") return json(res, { vozes: await listVoices() });
    else if (parts[1] === "conferir") return json(res, await checkVoice(body.voz));
    else return fail(res, "ação desconhecida", 404);
    json(res, settingsView());
  } catch (error) { fail(res, error.message); }
}

async function api(req, res, parts, query) {
  if (parts[0] === "catalogo") return json(res, catalog());
  if (parts[0] === "nicho") return json(res, nicheOptions());
  if (parts[0] === "temas") return themes(req, res, parts[1]);
  if (parts[0] === "config" || parts[0] === "elevenlabs") return settings(req, res, parts);
  if (parts[0] === "acervo") return json(res, projectCards());
  if (parts[0] !== "projetos") return fail(res, "rota desconhecida", 404);
  if (parts.length === 1 && req.method === "GET") return json(res, listProjects());
  if (parts.length === 1 && req.method === "POST") {
    const body = await readBody(req);
    const problem = projectProblem(body);
    if (problem) return fail(res, problem);
    const id = startProject({ frase: String(body.frase).trim().slice(0, 300), objetivo: body.objetivo || "curiosidade",
      duracao: Number(body.duracao) || 60, publico: String(body.publico || "").trim().slice(0, 200),
      publicoAlvo: body.publicoAlvo, especialidade: body.especialidade || "geral" });
    return json(res, { id });
  }
  const [, id, action] = parts;
  if (!validId(id)) return fail(res, "projeto não encontrado", 404);
  if (!action) return json(res, projectView(id));
  if (action === "eventos") return events(req, res, id);
  if (action === "enviar" && req.method === "POST") return upload(req, res, id, query).catch((error) => fail(res, error.message));
  if (!ACTIONS[action] || req.method !== "POST") return fail(res, "ação desconhecida", 404);
  try { json(res, await runAction(id, action, await readBody(req))); } catch (error) { fail(res, error.message); }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost"), parts = decodeURIComponent(url.pathname).split("/").filter(Boolean);
  if (parts[0] === "api") {
    if (!trusted(req)) return fail(res, "pedido recusado", 403);
    return api(req, res, parts.slice(1), url.searchParams).catch((error) => fail(res, error.message, 500));
  }
  if (parts[0] === "arquivos") {   // só mídia de um projeto do painel: nunca o .env, o perfil ou outro arquivo da pasta videos
    if (!validId(parts[1] || "") || !MEDIA.has(path.extname(url.pathname))) return fail(res, "não achei", 404);
    const download = url.searchParams.has("baixar") ? `${parts[1]}-${path.basename(url.pathname)}` : "";
    return sendFile(req, res, VIDEOS, parts.slice(1).join("/"), download);
  }
  if (parts[0] === "folhas") {   // a folha de amostras de estilos que vem com a skill de um motor (Anidoodle)
    const file = engineSheet(path.basename(parts[1] || "", ".jpg"));
    return file ? sendFile(req, res, path.dirname(file), path.basename(file)) : fail(res, "não achei", 404);
  }
  if (parts[0] === "previas") return sendFile(req, res, path.join(ROOT, "painel", "previas"), parts.slice(1).join("/"));
  if (parts[0] === "cache") return sendFile(req, res, path.join(ROOT, "painel", ".cache"), parts.slice(1).join("/"));
  return sendFile(req, res, PUBLIC, parts.join("/") || "index.html");
});

// um trabalho que ficou marcado como rodando quando o painel fechou não está mais rodando
for (const project of listProjects()) if (project.ocupado) updateProject(project.id, { ocupado: null, erro: "o painel foi fechado no meio do trabalho" });

server.listen(PORT, "127.0.0.1", () => process.stdout.write(`Painel do Motor Animado em http://127.0.0.1:${PORT}\n`));
