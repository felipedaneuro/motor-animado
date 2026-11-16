// trocar-voz.mjs: um vídeo pronto de outro motor (Anidoodle, Manim, Huashu) com outra voz, sem produzir de novo.
// Cada voz fala num ritmo: o painel corta o vídeo frase por frase pelos tempos da voz antiga e estica ou encolhe cada
// trecho até a duração da frase na voz nova, para a cena continuar batendo com o que está sendo falado.
// A trilha que o motor tinha posto no vídeo sai junto com a voz antiga: o vídeo novo fica só com a narração nova.
import fs from "node:fs";
import path from "node:path";
import { checkVideo, must, recordVoice, run, tool } from "./ferramentas.mjs";
import { log, projectDir } from "./projetos.mjs";

const MIN_PART = 0.04;              // segundos: um trecho menor que isso não dá para esticar
const WARN_FACTOR = [0.6, 1.6];     // fora disso a frase fica visivelmente mais lenta ou mais rápida

const timingsFile = (id, file) => path.join(projectDir(id), "voz", `tempos-${path.basename(file, ".mp4")}.json`);
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

// guarda os tempos da voz com que um vídeo foi feito (a troca de voz precisa deles depois)
export function keepTimings(id, file) {
  const current = path.join(projectDir(id), "voz", "tempos.json");
  if (fs.existsSync(current)) fs.copyFileSync(current, timingsFile(id, file));
}

// os tempos do vídeo: os guardados com ele ou, nos vídeos antigos, os da voz gravada agora (antes de trocar)
function oldTimings(id, file) {
  const kept = timingsFile(id, file), current = path.join(projectDir(id), "voz", "tempos.json");
  if (fs.existsSync(kept)) return readJson(kept);
  if (fs.existsSync(current)) return readJson(current);
  throw new Error("não achei os tempos da voz deste vídeo; produza o vídeo de novo com a voz certa");
}

async function videoDuration(id, file) {
  const probe = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], projectDir(id));
  const seconds = Number(probe.output.trim());
  if (!seconds) throw new Error("não consegui medir a duração do vídeo");
  return seconds;
}

// [{start, end, factor}] por frase; o resto do vídeo depois da última fala (o final) entra na última frase sem mudar
export function retimeParts(old, fresh, total) {
  const tail = Math.max(0, total - old.duration);
  const cuts = (t, end) => [...t.phrases.map((p, k) => (k ? p.start : 0)), end];
  const before = cuts(old, total), after = cuts(fresh, fresh.duration + tail);
  return before.slice(0, -1).map((start, k) => {
    const length = before[k + 1] - start;
    if (length < MIN_PART) throw new Error(`a frase ${k + 1} não cabe no vídeo (ele é mais curto que a voz antiga)`);
    return { start, end: before[k + 1], factor: (after[k + 1] - after[k]) / length };
  });
}

function retimeArgs(input, parts, output) {
  const chains = parts.map((p, k) => `[0:v]trim=start=${p.start.toFixed(3)}:end=${p.end.toFixed(3)},setpts=(PTS-STARTPTS)*${p.factor.toFixed(4)}[v${k}]`);
  const filter = `${chains.join(";")};${parts.map((_, k) => `[v${k}]`).join("")}concat=n=${parts.length}:v=1:a=0,fps=30[out]`;
  return ["-y", "-v", "error", "-i", input, "-filter_complex", filter, "-map", "[out]", "-an",
    "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", output];
}

function nextName(id, file, engine) {
  const base = path.basename(file, ".mp4").replace(/-voz-[a-z0-9-]+(-\d+)?$/, "");
  for (let n = 1; ; n++) {
    const name = `${base}-voz-${engine}${n > 1 ? `-${n}` : ""}.mp4`;
    if (!fs.existsSync(path.join(projectDir(id), name))) return name;
  }
}

function warnSpeed(id, parts) {
  parts.forEach((p, k) => {
    if (p.factor < WARN_FACTOR[0] || p.factor > WARN_FACTOR[1]) log(id, `a frase ${k + 1} ficou ${p.factor > 1 ? "mais lenta" : "mais rápida"} (${Math.round(p.factor * 100)}% do tempo original)`, "erro");
  });
}

// devolve a entrada do vídeo novo: {file, check, final, motor}
export async function swapExternalVoice(id, video, engine) {
  const dir = projectDir(id), old = oldTimings(id, video.file);
  await recordVoice(id, engine);
  const fresh = readJson(path.join(dir, "voz", "tempos.json"));
  if (fresh.phrases.length !== old.phrases.length) throw new Error("o roteiro mudou depois deste vídeo (as frases não batem); produza o vídeo de novo");
  const parts = retimeParts(old, fresh, await videoDuration(id, video.file));
  warnSpeed(id, parts);
  const output = nextName(id, video.file, engine), silent = `.sem-som-${output}`;
  log(id, `ajustando o vídeo ao ritmo da voz nova, frase por frase`, "comando");
  must(await run("ffmpeg", retimeArgs(video.file, parts, silent), dir, () => {}, id), "o ajuste do vídeo à voz nova falhou");
  try {
    must(await tool(id, "mixar", [silent, "voz/voz.wav", "--saida", output]), "a mixagem falhou");
  } finally {
    fs.rmSync(path.join(dir, silent), { force: true });   // o arquivo intermediário que este trabalho criou
  }
  keepTimings(id, output);
  return { file: output, check: await checkVideo(id, output), final: Boolean(video.final), motor: video.motor };
}
