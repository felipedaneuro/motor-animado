// agentes.mjs: os agentes de IA que escrevem o roteiro e a cena. O painel fala com todos do mesmo jeito: manda um
// pedido em texto e recebe {ok, text}, enquanto mostra no registro o que o agente foi lendo, escrevendo e rodando.
//   claude  Claude Code        restrito (sem terminal) nos passos normais; terminal liberado só nos outros motores
//   codex   Codex, do ChatGPT  sandbox workspace-write: escreve e roda comandos dentro da pasta do vídeo
//   gemini  Gemini CLI         auto_edit nos passos normais, yolo nos outros motores; não retoma a conversa
//   local   IA local (Ollama)  o próprio Codex com --oss: o modelo roda neste Mac, sem cota e sem busca na internet
// Para acrescentar outro agente, copie um bloco abaixo: comando, como instalar, os argumentos e como ler a saída.
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.mjs";
import { MOTOR, VIDEOS, loadProject, log, projectDir, trackChild, updateProject } from "./projetos.mjs";

const installed = (command) => { try { execFileSync("which", [command], { stdio: "ignore" }); return true; } catch { return false; } };

// ruído que os agentes escrevem no stderr e não ajuda ninguém (avisos de terminal, rastros de pilha, relatórios)
const NOISE = /^\s*at |256-color|Ripgrep is not available|Full report available at|^\[Routing\]|DeprecationWarning|ExperimentalWarning|^[{}\]]|^"|^\s*$|ERROR rmcp|rmcp::transport|Reading additional input from stdin|^\d{4}-\d\d-\d\dT[\d:.]+Z\s+(ERROR|WARN)/;

// a cota da conta acabou (limite da sessão, do dia ou de créditos): o painel pode seguir com outro agente
const QUOTA = /usage limit|hit your limit|limit reached|quota|rate.?limit|\b429\b|insufficient.?credit|out of credits|limite de uso/i;

// erros comuns traduzidos para uma linha que diz o que fazer
const KNOWN = [
  [/API.?KEY.?INVALID|API key not valid/i, (a) => `${a.rotulo}: a chave de API não é válida. Rode "${a.comando}" no terminal e entre na sua conta, ou corrija a chave no ambiente.`],
  [/Please set an Auth method|no auth method|select an auth/i, (a) => `${a.rotulo}: falta escolher como entrar. Rode "${a.comando}" no terminal e faça o login uma vez.`],
  [/not logged in|unauthorized|401|please sign in|login required/i, (a) => `${a.rotulo}: a conta não está conectada. Rode "${a.comando}" no terminal e entre na sua conta.`],
  [QUOTA, (a) => `${a.rotulo}: o limite de uso da conta acabou. Espere a cota voltar ou siga com outro agente.`],
];
const translate = (text, agent) => (KNOWN.find(([pattern]) => pattern.test(text)) || [])[1]?.(agent) || "";
const short = (file) => (file ? path.basename(String(file)) : "");
const clip = (text, size = 160) => String(text ?? "").replace(/\s+/g, " ").trim().slice(0, size);

// ---------- Claude Code ----------
const TOOLS = "Read,Write,Edit,Glob,Grep,WebSearch,WebFetch";
const PREAPPROVED = ["Read", "Glob", "Grep", "WebSearch", "WebFetch"];
const PROTECTED = [`Edit(/${MOTOR}/**)`, `Write(/${MOTOR}/**)`];
const FREE_TOOLS = ["Bash", "Read", "Write", "Edit", "Glob", "Grep", "Skill", "WebSearch", "WebFetch"];
const FORBIDDEN = ["Bash(sudo *)", "Bash(brew *)", "Bash(npm install -g *)", "Bash(npm i -g *)", "Bash(git push *)", "Bash(vercel *)",
  "Bash(railway *)", `Read(/${VIDEOS}/.env)`, `Edit(/${VIDEOS}/.env)`, `Write(/${VIDEOS}/.env)`, ...PROTECTED];

function claudeArgs({ prompt, session, model, free }) {
  const mode = free ? ["--strict-mcp-config", "--allowedTools", ...FREE_TOOLS, "--disallowedTools", ...FORBIDDEN]
    : ["--restricted", "--strict-mcp-config", "--tools", TOOLS, "--allowedTools", ...PREAPPROVED, "--disallowedTools", ...PROTECTED, "--add-dir", MOTOR];
  return ["-p", prompt, "--output-format", "stream-json", "--verbose", ...mode, "--permission-mode", "acceptEdits",
    ...(session ? ["--resume", session] : []), ...(model ? ["--model", model] : [])];
}

function claudeLine(event, emit, result) {
  if (event.session_id) result.session = event.session_id;
  for (const block of event.type === "assistant" ? event.message.content || [] : []) {
    if (block.type === "text" && block.text.trim()) emit(block.text.trim(), "claude");
    if (block.type !== "tool_use") continue;
    const input = block.input || {};
    emit(`${block.name}: ${clip(input.query || input.url || short(input.file_path) || input.pattern || input.command || input.skill)}`, "ferramenta");
  }
  if (event.type === "result") Object.assign(result, { ok: !event.is_error, text: event.result || "", final: true });
}

// ---------- Codex (ChatGPT) ----------
// o sandbox workspace-write deixa o Codex escrever e rodar comandos na pasta do vídeo, e nada fora dela;
// a rede fica ligada porque o roteiro precisa conferir os fatos.
const CODEX_RULES = ["-c", 'approval_policy="never"', "-c", "sandbox_workspace_write.network_access=true",
  "-c", "mcp_servers={}"];   // sem os servidores MCP da conta: eles não servem aqui e enchem o registro de erro

function codexArgs({ prompt, session, model, free }) {
  const where = session ? ["exec", "resume", "--skip-git-repo-check", "-c", 'sandbox_mode="workspace-write"', ...CODEX_RULES, session, "--json"]
    : ["exec", "--skip-git-repo-check", "--sandbox", "workspace-write", ...CODEX_RULES, "--json"];
  return [...where, ...(model ? ["-m", model] : []), prompt];
}

// a IA local é o mesmo Codex apontado para o Ollama: o modelo roda neste Mac. Sem retomar a conversa (cada pedido
// já diz quais arquivos ler), porque o modo --oss não garante a retomada.
const localArgs = ({ prompt, model }) => ["exec", "--oss", "--local-provider", "ollama", "--skip-git-repo-check",
  "--sandbox", "workspace-write", ...CODEX_RULES, "--json", ...(model ? ["-m", model] : []), prompt];

// ---------- as listas de modelos ----------
const CLAUDE_MODELS = [["", "padrão da conta"], ["sonnet", "Sonnet 5.5 (gasta menos cota)"], ["opus", "Opus"],
  ["haiku", "Haiku (o mais leve)"], ["fable", "Fable"]];
const CODEX_CACHE = path.join(process.env.HOME || "", ".codex", "models_cache.json");

// os modelos que o próprio Codex mostra na lista dele (o arquivo que ele guarda ao entrar na conta)
function codexModels() {
  try {
    const data = JSON.parse(fs.readFileSync(CODEX_CACHE, "utf8"));
    const list = (Array.isArray(data) ? data : data.models || []).filter((m) => (m.visibility || "list") === "list");
    return [["", "padrão da conta"], ...list.map((m) => [m.slug || m.id, m.display_name || m.slug || m.id])];
  } catch { return null; }
}

// os modelos já baixados no Ollama (ollama list); vazio quando o Ollama ainda não está instalado
function ollamaModels() {
  try {
    const lines = execFileSync("ollama", ["list"], { encoding: "utf8", timeout: 4000 }).trim().split("\n").slice(1);
    const names = lines.map((line) => line.split(/\s+/)[0]).filter(Boolean);
    return names.length ? names.map((name) => [name, name]) : null;
  } catch { return null; }
}

function codexItem(item, emit, result) {
  const kind = item.type || "";
  if (kind === "agent_message" || kind === "assistant_message") {
    const text = item.text || item.message || "";
    if (text.trim()) { emit(text.trim(), "claude"); result.text = text; }
  } else if (kind === "command_execution") emit(`comando: ${clip(item.command)}`, "ferramenta");
  else if (kind === "file_change" || kind === "patch_apply") emit(`arquivo: ${clip((item.changes || []).map((c) => short(c.path)).join(", ") || item.path)}`, "ferramenta");
  else if (kind === "web_search") emit(`busca: ${clip(item.query)}`, "ferramenta");
  else if (kind === "error") Object.assign(result, { ok: false, text: clip(item.message, 400), final: true });
}

function codexLine(event, emit, result) {
  if (event.thread_id) result.session = event.thread_id;
  // o Codex avisa duas vezes sobre o mesmo item (started e completed): o painel registra só o fim
  if (event.item && event.type !== "item.started") codexItem(event.item, emit, result);
  if (event.type === "turn.completed") Object.assign(result, { ok: true, final: true });
  if (event.type === "turn.failed" || event.type === "error") {
    Object.assign(result, { ok: false, final: true, text: clip(event.error?.message || event.message || "o Codex parou", 400) });
  }
}

// ---------- Gemini CLI ----------
function geminiArgs({ prompt, model, free }) {
  // --skip-trust: a pasta do vídeo não está na lista de pastas confiáveis do Gemini, e sem isso ele se recusa a rodar
  return ["-p", prompt, "--output-format", "stream-json", "--approval-mode", free ? "yolo" : "auto_edit", "--skip-trust",
    ...(model ? ["-m", model] : [])];
}

function geminiLine(event, emit, result) {
  const type = event.type || "";
  if (type === "message" && event.role !== "user" && event.content) emit(clip(event.content, 400), "claude");
  if (type === "tool_use") emit(`${event.name || "ferramenta"}: ${clip(JSON.stringify(event.args || {}))}`, "ferramenta");
  if (type === "error") emit(clip(event.message || event.error, 300), "erro");
  if (type === "result") Object.assign(result, { ok: !event.error && event.status !== "error",
    text: event.response || event.result || event.error?.message || "", final: true });
}

export const AGENTS = {
  claude: { rotulo: "Claude Code", comando: "claude", instalar: "npm install -g @anthropic-ai/claude-code", retoma: true,
    modelos: () => CLAUDE_MODELS, args: claudeArgs, linha: claudeLine,
    nota: "Nos passos normais roda sem terminal: só lê e escreve arquivos na pasta do vídeo e pesquisa na internet." },
  codex: { rotulo: "Codex (ChatGPT)", comando: "codex", instalar: "npm install -g @openai/codex", retoma: true, args: codexArgs, linha: codexLine,
    modelos: codexModels,
    nota: "Trabalha com a pasta do vídeo liberada para escrita e comandos (sandbox workspace-write), e nada fora dela. A lista de modelos vem da sua conta do ChatGPT." },
  gemini: { rotulo: "Gemini CLI", comando: "gemini", instalar: "npm install -g @google/gemini-cli", retoma: false, args: geminiArgs, linha: geminiLine,
    limpaEnv: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
    nota: "Não retoma a conversa entre os passos (cada pedido já diz quais arquivos ler). Modelo: vazio ou o nome, ex.: gemini-2.5-pro. Entrando com a conta Google, o painel ignora a GEMINI_API_KEY que outros aplicativos deixam no sistema." },
  local: { rotulo: "IA local (Ollama)", comando: "codex", precisa: ["ollama"], retoma: false, args: localArgs, linha: codexLine,
    instalar: "brew install ollama  e depois  ollama pull qwen3:14b", modelos: ollamaModels, semRoteiro: true,
    nota: "Roda no seu Mac, sem gastar cota e sem internet, pelo Codex ligado ao Ollama. Não pesquisa na web, então não escreve o roteiro. Use para rascunhos de cena e correções de ajuste; para a versão final, prefira o Claude ou o GPT. Num Mac de 16 GB, use modelos de até uns 14 bilhões de parâmetros (ex.: qwen3:14b)." },
};
// os passos em que um agente sem busca na internet não entra (o roteiro confere as fontes na web)
export const STEPS_NEEDING_WEB = ["roteiro"];


export const agentNames = () => Object.keys(AGENTS);
// o agente do passo; um agente sem busca na internet nunca fica com o roteiro, mesmo num config.json antigo
export function agentFor(step) {
  const name = loadConfig().agentes[step];
  if (!AGENTS[name] || (AGENTS[name].semRoteiro && STEPS_NEEDING_WEB.includes(step))) return "claude";
  return name;
}
const ready = (agent) => installed(agent.comando) && (agent.precisa || []).every(installed);
// os ids de modelo que o agente aceita, ou null quando o nome é livre (a lista não está disponível)
export const modelChoices = (name) => AGENTS[name]?.modelos?.()?.map(([id]) => id) || null;
// um agente que pode assumir o passo: instalado e, no roteiro, com busca na internet
export const canTakeOver = (name, step) => Boolean(AGENTS[name]) && ready(AGENTS[name]) && !(AGENTS[name].semRoteiro && STEPS_NEEDING_WEB.includes(step));
export const agentLabel = (name) => AGENTS[name]?.rotulo || name;
export const agentStatus = () => Object.entries(AGENTS).map(([nome, a]) => ({ nome, rotulo: a.rotulo, instalado: ready(a),
  instalar: a.instalar, modelos: a.modelos?.() || null, retoma: a.retoma, nota: a.nota, semRoteiro: Boolean(a.semRoteiro),
  // o agente aceita entrar com a conta em vez da chave de API que esteja no ambiente
  contaOuChave: Boolean(a.limpaEnv), chaveNoAmbiente: (a.limpaEnv || []).filter((name) => process.env[name]) }));

// as conversas guardadas do projeto, uma por agente e modo (os projetos antigos guardavam só as do Claude)
const sessionsOf = (state) => state.sessoes || { "claude:restrito": state.sessao, "claude:livre": state.sessaoLivre };

// manda um pedido ao agente do passo e devolve {ok, text}. free: o modo com terminal, usado só pelos outros motores.
// agent: um agente no lugar do configurado para o passo (a troca automática quando a cota acaba)
export function askAgent(id, prompt, { step = "cenas", free = false, agent: chosen = null } = {}) {
  const config = loadConfig(), name = AGENTS[chosen] ? chosen : agentFor(step), agent = AGENTS[name];
  const model = name === agentFor(step) ? config.modelos[step] || "" : "";
  if (!ready(agent)) return Promise.resolve({ ok: false, text: `${agent.rotulo} não está instalado neste Mac. Instale com: ${agent.instalar}` });
  const state = loadProject(id), key = `${name}:${free ? "livre" : "restrito"}`;
  const session = agent.retoma ? sessionsOf(state)[key] || null : null;
  const result = { ok: false, text: "", session, agente: name };
  const emit = (text, kind) => log(id, text, kind);
  log(id, `${agent.rotulo}${model ? ` (${model})` : ""} trabalhando...`, "passo");
  return runAgent({ id, agent, args: agent.args({ prompt, session, model, free }), emit, result, key,
    env: agentEnv(agent, config) });
}

// com a conta Google, as chaves de API que outros aplicativos deixam no sistema saem do ambiente deste processo
function agentEnv(agent, config) {
  if (!agent.limpaEnv || config.gemini.conta === "chave") return process.env;
  const env = { ...process.env };
  agent.limpaEnv.forEach((name) => delete env[name]);
  return env;
}

function runAgent({ id, agent, args, emit, result, key, env }) {
  return new Promise((resolve) => {
    const child = spawn(agent.comando, args, { cwd: projectDir(id), stdio: ["ignore", "pipe", "pipe"], env });
    trackChild(id, child);
    const take = (line) => {
      if (!line.startsWith("{")) return;
      try { agent.linha(JSON.parse(line), emit, result); } catch { /* linha pela metade ou aviso: não é evento */ }
    };
    let buffer = "";
    child.stdout.on("data", (chunk) => {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop();
      lines.forEach((line) => take(line.trim()));
    });
    let aviso = "";
    child.stderr.on("data", (chunk) => {
      for (const line of String(chunk).split("\n")) {
        const text = line.trim();
        if (!text || NOISE.test(text) || text.startsWith("[claude-code:")) continue;
        const known = translate(text, agent);
        if (!known) { emit(clip(text, 240), "erro"); continue; }
        if (known !== aviso) { emit(known, "erro"); aviso = known; }
      }
    });
    child.on("error", (error) => resolve({ ok: false, text: `não consegui chamar o ${agent.rotulo}: ${error.message}` }));
    child.on("close", (code) => {
      take(buffer.trim());
      if (result.session) updateProject(id, { sessoes: { ...sessionsOf(loadProject(id)), [key]: result.session } });
      // sem evento final (formato de saída mudou?): vale a saída limpa com alguma resposta
      if (!result.final) Object.assign(result, { ok: code === 0 && Boolean(result.text.trim()), text: result.text || `o ${agent.rotulo} saiu com erro (código ${code})` });
      if (!result.ok) result.cota = QUOTA.test(`${result.text} ${aviso}`);
      if (!result.ok) result.text = translate(result.text, agent) || aviso || clip(result.text, 300);
      resolve(result);
    });
  });
}
