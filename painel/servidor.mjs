// servidor.mjs: o painel do Motor Animado. Só atende este Mac (127.0.0.1), sem pacotes externos.
//   node painel/servidor.mjs            (porta 4747, ou PORTA=5000 node painel/servidor.mjs)
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { catalog, styleNames } from "./catalogo.mjs";
import { canPreview, voiceCost } from "./ferramentas.mjs";
import { agentNames, agentStatus } from "./agentes.mjs";
import { MODELS, VOICE_MODELS, loadConfig, saveConfig } from "./config.mjs";
import { checkVoice, keyStatus, listVoices, saveKey } from "./elevenlabs.mjs";
import { engineNames, engineStatus } from "./motores.mjs";
import { adjust, buildScenes, prepare, preview, produce, render, voice, writeScript } from "./passos.mjs";
import { deleteTheme, saveTheme } from "./temas.mjs";
import { ROOT, VIDEOS, createProject, listProjects, loadProject, log, readJson, readText, recentActivity, subscribe,
  updateProject, validId, writeText } from "./projetos.mjs";

const PORT = Number(process.env.PORTA || process.env.PORT || 4747);
const PUBLIC = path.join(ROOT, "painel", "publico");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".mp4": "video/mp4", ".wav": "audio/wav", ".svg": "image/svg+xml" };
const VOICES = ["mac", "chatterbox-narrador", "chatterbox-narradora", "elevenlabs"];
const MEDIA = new Set([".jpg", ".png", ".mp4"]);

// outra página aberta no navegador não pode mandar pedidos ao painel: quem muda algo precisa vir da própria página do painel
function trusted(req) {
  if (req.method === "GET") return true;
  const origin = req.headers.origin || "";
  const local = !origin || /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin);
  return local && req.headers["x-painel"] === "1";
}

const json = (res, data, status = 200) => { res.writeHead(status, { "Content-Type": TYPES[".json"] }); res.end(JSON.stringify(data)); };
const fail = (res, message, status = 400) => json(res, { erro: message }, status);

function readBody(req) {
  return new Promise((resolve) => {
    let text = "";
    req.on("data", (chunk) => { text += chunk; if (text.length > 2e6) req.destroy(); });
    req.on("end", () => { try { resolve(text ? JSON.parse(text) : {}); } catch { resolve({}); } });
  });
}

// um arquivo de dentro de base (nunca de fora), com suporte a trechos (o player de vídeo pede por partes)
function sendFile(req, res, base, relative) {
  const full = path.resolve(base, relative);
  if (!full.startsWith(base + path.sep) || !fs.existsSync(full) || !fs.statSync(full).isFile()) return fail(res, "não achei", 404);
  const size = fs.statSync(full).size, type = TYPES[path.extname(full)] || "application/octet-stream";
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || "");
  if (!range) { res.writeHead(200, { "Content-Type": type, "Content-Length": size, "Cache-Control": "no-store" }); return fs.createReadStream(full).pipe(res); }
  const start = Number(range[1] || 0), end = range[2] ? Number(range[2]) : size - 1;
  res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${start}-${end}/${size}`, "Accept-Ranges": "bytes", "Content-Length": end - start + 1 });
  fs.createReadStream(full, { start, end }).pipe(res);
}

function projectView(id) {
  const state = loadProject(id);
  return { ...state, roteiro: readText(id, "roteiro.txt"), fontes: readText(id, "fontes.md"),
    ilustracoes: readJson(id, "painel-roteiro.json", {})?.ilustracoes || [], cenas: readJson(id, "painel-cenas.json", []),
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
  roteiro: (id, body) => { writeText(id, "roteiro.txt", String(body.texto || "")); return { ok: true }; },
  "gerar-roteiro": (id) => { writeScript(id); return { ok: true }; },
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
};

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
const settingsView = () => ({ ...loadConfig(), chave: keyStatus().chave, modelosDisponiveis: MODELS, modelosDeVoz: VOICE_MODELS,
  motores: engineStatus(), agentesDisponiveis: agentStatus() });

async function settings(req, res, parts) {
  if (req.method === "GET") return json(res, settingsView());
  const body = await readBody(req);
  try {
    if (parts[0] === "config") saveConfig(body, agentNames());
    else if (parts[1] === "chave") saveKey(body.chave);
    else if (parts[1] === "vozes") return json(res, { vozes: await listVoices() });
    else if (parts[1] === "conferir") return json(res, await checkVoice(body.voz));
    else return fail(res, "ação desconhecida", 404);
    json(res, settingsView());
  } catch (error) { fail(res, error.message); }
}

async function api(req, res, parts) {
  if (parts[0] === "catalogo") return json(res, catalog());
  if (parts[0] === "temas") return themes(req, res, parts[1]);
  if (parts[0] === "config" || parts[0] === "elevenlabs") return settings(req, res, parts);
  if (parts[0] !== "projetos") return fail(res, "rota desconhecida", 404);
  if (parts.length === 1 && req.method === "GET") return json(res, listProjects());
  if (parts.length === 1 && req.method === "POST") {
    const body = await readBody(req);
    if (!String(body.frase || "").trim()) return fail(res, "escreva a ideia do vídeo");
    const state = createProject({ frase: String(body.frase).trim().slice(0, 300), objetivo: body.objetivo || "curiosidade",
      duracao: Number(body.duracao) || 60, publico: body.publico || "público geral" });
    log(state.id, `projeto criado: ${state.frase}`, "passo");
    writeScript(state.id);
    return json(res, { id: state.id });
  }
  const [, id, action] = parts;
  if (!validId(id)) return fail(res, "projeto não encontrado", 404);
  if (!action) return json(res, projectView(id));
  if (action === "eventos") return events(req, res, id);
  if (!ACTIONS[action] || req.method !== "POST") return fail(res, "ação desconhecida", 404);
  try { json(res, await ACTIONS[action](id, await readBody(req))); } catch (error) { fail(res, error.message); }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost"), parts = decodeURIComponent(url.pathname).split("/").filter(Boolean);
  if (parts[0] === "api") {
    if (!trusted(req)) return fail(res, "pedido recusado", 403);
    return api(req, res, parts.slice(1)).catch((error) => fail(res, error.message, 500));
  }
  if (parts[0] === "arquivos") {   // só mídia de um projeto do painel: nunca o .env, o perfil ou outro arquivo da pasta videos
    if (!validId(parts[1] || "") || !MEDIA.has(path.extname(url.pathname))) return fail(res, "não achei", 404);
    return sendFile(req, res, VIDEOS, parts.slice(1).join("/"));
  }
  if (parts[0] === "previas") return sendFile(req, res, path.join(ROOT, "painel", "previas"), parts.slice(1).join("/"));
  if (parts[0] === "cache") return sendFile(req, res, path.join(ROOT, "painel", ".cache"), parts.slice(1).join("/"));
  return sendFile(req, res, PUBLIC, parts.join("/") || "index.html");
});

// um trabalho que ficou marcado como rodando quando o painel fechou não está mais rodando
for (const project of listProjects()) if (project.ocupado) updateProject(project.id, { ocupado: null, erro: "o painel foi fechado no meio do trabalho" });

server.listen(PORT, "127.0.0.1", () => process.stdout.write(`Painel do Motor Animado em http://127.0.0.1:${PORT}\n`));
