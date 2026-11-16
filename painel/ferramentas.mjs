// ferramentas.mjs: as ferramentas do motor que o painel roda (lista fixa), sempre de dentro da pasta do vídeo.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.mjs";
import { MOTOR, ROOT, log, projectDir } from "./projetos.mjs";

const PY = path.join(MOTOR, "ferramentas", "py");
const ALLOWED = new Set(["voz", "transcrever", "alinhar", "montar", "mapa", "sons", "render", "mixar", "conferir"]);
const CHATTERBOX_SAMPLES = { narrador: "painel/vozes/narrador.wav", narradora: "painel/vozes/narradora.wav" };

export function run(command, args, cwd, onLine = () => {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    const take = (chunk) => {
      output += chunk;
      String(chunk).split(/[\r\n]+/).map((line) => line.trim()).filter(Boolean).forEach(onLine);
    };
    child.stdout.on("data", take);
    child.stderr.on("data", take);
    child.on("error", (error) => resolve({ code: 1, output: error.message }));
    child.on("close", (code) => resolve({ code, output }));
  });
}

// uma ferramenta do motor: tool("mapa", ["cena", "voz/tempos.json", "mapa"])
export async function tool(id, name, args, cwd = projectDir(id)) {
  if (!ALLOWED.has(name)) throw new Error(`ferramenta fora da lista: ${name}`);
  log(id, `${name} ${args.join(" ")}`, "comando");
  const noisy = /Fetching|it\/s\]|^\s*$|\[\d+m/;
  const result = await run(PY, [`${name}.py`, ...args], cwd, (line) => { if (!noisy.test(line)) log(id, line, "saida"); });
  if (result.code !== 0) log(id, `${name} falhou (código ${result.code})`, "erro");
  return result;
}

const must = (result, what) => { if (result.code !== 0) throw new Error(`${what}: ${result.output.trim().split("\n").slice(-3).join(" | ")}`); };

// voz + transcrição + alinhamento; engine: "mac" | "chatterbox-narrador" | "chatterbox-narradora" | "elevenlabs"
export async function recordVoice(id, engine) {
  const sample = CHATTERBOX_SAMPLES[engine.replace("chatterbox-", "")];
  const eleven = loadConfig().elevenlabs;   // a voz e o modelo escolhidos no painel; sem ID de voz, vale o do perfil.json
  const flags = engine === "elevenlabs" ? ["--elevenlabs", "--modelo", eleven.modelo, ...(eleven.voz ? ["--voz", eleven.voz] : [])]
    : sample ? ["--chatterbox", "--amostra", path.join(ROOT, sample)] : ["--teste"];
  must(await tool(id, "voz", ["roteiro.txt", ...flags]), "a voz falhou");
  must(await tool(id, "transcrever", ["voz/voz.wav", "--saida", "voz", "--lingua", "pt"]), "a transcrição falhou");
  must(await tool(id, "alinhar", ["roteiro.txt", "voz/voz.json", "voz/voz.wav", "voz/tempos.json"]), "o alinhamento falhou");
}

export async function voiceCost(id) {
  const result = await run(PY, ["voz.py", "roteiro.txt", "--custo"], projectDir(id));
  return (result.output.trim().split("\n").pop() || "").replace(/, grátis.*$/, "");
}

export async function mount(id, style) {
  const first = !fs.existsSync(path.join(projectDir(id), "cena", ".estilo"));
  must(await tool(id, "montar", ["voz/tempos.json", "voz/voz.wav", "cena", ...(first ? ["--estilo", style] : [])]), "a montagem falhou");
}

// confere o plano.js (o sons.py carrega o plano pelo Node) e a sintaxe do cena.js; devolve o erro em texto ou ""
export async function validateScene(id) {
  const dir = projectDir(id);
  const sounds = await tool(id, "sons", ["cena"]);
  if (sounds.code !== 0) return sounds.output.trim().split("\n").slice(-12).join("\n");
  for (const file of ["cena.js", "plano.js", "pecas.js"]) {
    const full = path.join(dir, "cena", "js", file);
    if (!fs.existsSync(full)) continue;
    const check = await run("node", ["--check", full], dir);
    if (check.code !== 0) return `${file}: ${check.output.trim().split("\n").slice(0, 8).join("\n")}`;
  }
  return "";
}

async function brightness(file) {
  const probe = await run("ffprobe", ["-v", "error", "-f", "lavfi", "-i", `movie='${file}',signalstats`, "-show_entries",
    "frame_tags=lavfi.signalstats.YAVG", "-of", "csv=p=0"], path.dirname(file));
  return Number(probe.output.trim().split("\n")[0]) || 0;
}

// o mapa de cenas; devolve {ok, black}: black = quadros quase pretos (sinal de erro de JavaScript na cena)
export async function sceneMap(id) {
  const dir = projectDir(id);
  const result = await tool(id, "mapa", ["cena", "voz/tempos.json", "mapa"]);
  if (result.code !== 0) return { ok: false, black: false, error: result.output.trim().split("\n").slice(-6).join("\n") };
  const frames = fs.readdirSync(path.join(dir, "mapa")).filter((f) => /^f\d+\.png$/.test(f)).slice(0, 4);
  const levels = await Promise.all(frames.map((f) => brightness(path.join(dir, "mapa", f))));
  return { ok: true, black: levels.length > 0 && levels.every((y) => y < 6) };
}

function nextVersion(dir) {
  for (let n = 1; ; n++) if (!fs.existsSync(path.join(dir, `video-v${n}.mp4`))) return n;
}

// sons, render, mixagem e conferência; devolve {file, check}
export async function renderVideo(id, final) {
  const dir = projectDir(id), n = nextVersion(dir), raw = `video-v${n}.mp4`, mixed = `video-v${n}-final.mp4`;
  must(await tool(id, "sons", ["cena"]), "os sons falharam");
  must(await tool(id, "render", ["cena", raw, ...(final ? [] : ["--rascunho"])]), "o render falhou");
  must(await tool(id, "mixar", [raw, "voz/voz.wav", "--efeitos", "som/efeitos.wav", "--musica", "som/musica.wav", "--saida", mixed]), "a mixagem falhou");
  const check = await tool(id, "conferir", [mixed, "--sem-cortes"]);
  return { file: mixed, check: check.output.trim().split("\n").slice(-8).join("\n"), final };
}

// a conferência de um vídeo pronto (os motores de fora podem ter cortes: sem a régua de "sem cortes")
export async function checkVideo(id, file) {
  const check = await tool(id, "conferir", [file]);
  return check.output.trim().split("\n").slice(-8).join("\n");
}

// ---------- prévia de um estilo com os ajustes (tema, mascote, legenda), numa cena de exemplo guardada ----------
const PREVIEW_SOURCES = {
  "lowpoly-drone": { voice: "testes/cafeina-bia/voz", at: "3.0" },
  "retro-32bits": { voice: "testes/retro-mascote/voz", at: "4.5" },
  "retro-64bits": { voice: "testes/retro-mascote/voz", at: "4.5" },
};
export const canPreview = (style) => Boolean(PREVIEW_SOURCES[style]);

// a prévia é um quadro parado: o som não entra nela. Quando a voz de exemplo não veio no pacote (ela pesa),
// um silêncio da mesma duração serve de régua de tempo para montar a cena.
async function previewAudio(source, folder) {
  const target = path.join(folder, "voz.wav");
  if (fs.existsSync(source)) return fs.copyFileSync(source, target);
  if (fs.existsSync(target)) return;
  const { duration } = JSON.parse(fs.readFileSync(path.join(folder, "tempos.json"), "utf8"));
  const made = await run("ffmpeg", ["-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", String(duration || 10), target], folder);
  if (made.code !== 0) throw new Error("a prévia não conseguiu preparar o áudio de exemplo (o ffmpeg falhou)");
}

export async function previewFrame(id, style, adjustments) {
  const source = PREVIEW_SOURCES[style];
  if (!source) return null;
  const dir = path.join(ROOT, "painel", ".cache", "previa", style);
  fs.mkdirSync(path.join(dir, "voz"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, source.voice, "tempos.json"), path.join(dir, "voz", "tempos.json"));
  await previewAudio(path.join(ROOT, source.voice, "voz.wav"), path.join(dir, "voz"));
  fs.writeFileSync(path.join(dir, "estilo-ajustes.json"), JSON.stringify(adjustments));
  const first = !fs.existsSync(path.join(dir, "cena", ".estilo"));
  must(await tool(id, "montar", ["voz/tempos.json", "voz/voz.wav", "cena", ...(first ? ["--estilo", style] : [])], dir), "a prévia falhou ao montar");
  must(await tool(id, "mapa", ["cena", "voz/tempos.json", "mapa", "--instantes", source.at], dir), "a prévia falhou ao desenhar");
  const stamp = Date.now(), target = path.join(ROOT, "painel", ".cache", "previa", `${style}-${stamp}.png`);
  fs.copyFileSync(path.join(dir, "mapa", "f01.png"), target);
  return `/cache/previa/${style}-${stamp}.png`;
}
