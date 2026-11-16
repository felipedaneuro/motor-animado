// config.mjs: os ajustes do painel (painel/config.json): o modelo do Claude em cada passo e a voz da ElevenLabs.
// A chave da ElevenLabs NÃO fica aqui: fica só no .env (ver elevenlabs.mjs).
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./projetos.mjs";

const FILE = path.join(ROOT, "painel", "config.json");
// o modelo é do agente escolhido: lista pronta no Claude (sonnet = Sonnet 5.5 hoje), texto livre nos outros
export const MODELS = ["", "sonnet", "opus", "haiku", "fable"];
export const VOICE_MODELS = ["eleven_v3", "eleven_multilingual_v2", "eleven_turbo_v2_5", "eleven_flash_v2_5"];
const STEPS = ["roteiro", "cenas", "ajuste", "externo"];
const DEFAULTS = { agentes: { roteiro: "claude", cenas: "claude", ajuste: "claude", externo: "claude" },
  modelos: { roteiro: "sonnet", cenas: "", ajuste: "", externo: "" }, elevenlabs: { voz: "", modelo: "eleven_v3" },
  // "google": entra com a conta e ignora a GEMINI_API_KEY do sistema (apps como o Gemini.app põem a sua lá);
  // "chave": usa a chave que estiver no ambiente
  gemini: { conta: "google" } };
export const GEMINI_ACCOUNTS = ["google", "chave"];

export function loadConfig() {
  const saved = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : {};
  return { agentes: { ...DEFAULTS.agentes, ...(saved.agentes || {}) }, modelos: { ...DEFAULTS.modelos, ...(saved.modelos || {}) },
    elevenlabs: { ...DEFAULTS.elevenlabs, ...(saved.elevenlabs || {}) }, gemini: { ...DEFAULTS.gemini, ...(saved.gemini || {}) } };
}

function cleanAgents(agents = {}, names) {
  const clean = {};
  for (const step of STEPS) {
    if (!(step in agents)) continue;
    if (!names.includes(agents[step])) throw new Error(`agente desconhecido para ${step}`);
    clean[step] = agents[step];
  }
  return clean;
}

// o Claude tem lista fechada de apelidos; nos outros agentes o modelo é o nome que a pessoa escrever
function cleanModels(models = {}, agents) {
  const clean = {};
  for (const step of STEPS) {
    if (!(step in models)) continue;
    const value = String(models[step] || "").trim();
    if (agents[step] === "claude" && !MODELS.includes(value)) throw new Error(`modelo desconhecido para ${step}`);
    if (!/^[A-Za-z0-9.:_-]{0,60}$/.test(value)) throw new Error(`nome de modelo inválido para ${step}`);
    clean[step] = value;
  }
  return clean;
}

function cleanVoice(voice = {}) {
  const clean = {};
  if ("voz" in voice) {
    const id = String(voice.voz).trim();
    if (id && !/^[A-Za-z0-9]{10,40}$/.test(id)) throw new Error("o ID da voz tem só letras e números (copie do site da ElevenLabs)");
    clean.voz = id;
  }
  if ("modelo" in voice) {
    if (!VOICE_MODELS.includes(voice.modelo)) throw new Error("modelo de voz desconhecido");
    clean.modelo = voice.modelo;
  }
  return clean;
}

export function saveConfig(changes, agentNames = ["claude"]) {
  const current = loadConfig();
  const agentes = { ...current.agentes, ...cleanAgents(changes.agentes, agentNames) };
  const conta = changes.gemini?.conta;
  if (conta && !GEMINI_ACCOUNTS.includes(conta)) throw new Error("modo de conta do Gemini desconhecido");
  const next = { agentes, modelos: { ...current.modelos, ...cleanModels(changes.modelos, agentes) },
    elevenlabs: { ...current.elevenlabs, ...cleanVoice(changes.elevenlabs) },
    gemini: { ...current.gemini, ...(conta ? { conta } : {}) } };
  fs.writeFileSync(FILE, JSON.stringify(next, null, 2) + "\n");
  return next;
}
