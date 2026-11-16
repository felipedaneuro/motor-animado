// elevenlabs.mjs: a chave e as vozes da ElevenLabs. A chave entra pela página, vai direto para o .env da pasta videos
// (o mesmo que o voz.py lê) e nunca volta: a página só fica sabendo se existe uma chave gravada.
import fs from "node:fs";
import path from "node:path";
import { VIDEOS } from "./projetos.mjs";

const ENV = process.env.PAINEL_ENV || path.join(VIDEOS, ".env");
const NAME = "ELEVENLABS_API_KEY";
const API = "https://api.elevenlabs.io/v1";

const envLines = () => (fs.existsSync(ENV) ? fs.readFileSync(ENV, "utf8").split("\n") : []);

function readKey() {
  const line = envLines().find((text) => text.trim().startsWith(`${NAME}=`));
  return line ? line.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "") : "";
}

export const keyStatus = () => ({ chave: Boolean(readKey()) });

// grava (ou troca) só a linha da chave; o resto do .env fica como está; o arquivo fica legível só pelo dono
export function saveKey(key) {
  const value = String(key || "").trim();
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(value)) throw new Error("isso não parece uma chave da ElevenLabs (letras, números, _ e -, sem espaços)");
  const others = envLines().filter((text) => !text.trim().startsWith(`${NAME}=`) && text.trim() !== "");
  fs.writeFileSync(ENV, [...others, `${NAME}=${value}`].join("\n") + "\n", { mode: 0o600 });
  fs.chmodSync(ENV, 0o600);
}

async function call(route) {
  const key = readKey();
  if (!key) throw new Error("grave a chave da ElevenLabs primeiro");
  const response = await fetch(`${API}${route}`, { headers: { "xi-api-key": key } }).catch(() => null);
  if (!response) throw new Error("não consegui falar com a ElevenLabs (sem internet?)");
  if (response.status === 401) throw new Error("a ElevenLabs recusou a chave: confira se copiou inteira");
  if (!response.ok) throw new Error(`a ElevenLabs respondeu ${response.status}`);
  return response.json();
}

export async function listVoices() {
  const data = await call("/voices");
  return (data.voices || []).map((voice) => ({ id: voice.voice_id, nome: voice.name, tipo: voice.category || "" }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function checkVoice(id) {
  if (!/^[A-Za-z0-9]{10,40}$/.test(String(id))) throw new Error("ID de voz inválido");
  const voice = await call(`/voices/${id}`);
  return { id, nome: voice.name, tipo: voice.category || "" };
}
