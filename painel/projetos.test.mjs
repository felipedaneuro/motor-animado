// projetos.test.mjs: a aba Projetos (duplicar, lixeira, cartões). Rodar com: node --test painel/projetos.test.mjs
// Tudo acontece numa pasta temporária (PAINEL_VIDEOS): os projetos de verdade nunca são tocados.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

const TEMP = fs.mkdtempSync(path.join(os.tmpdir(), "painel-projetos-"));
process.env.PAINEL_VIDEOS = TEMP;
const { createProject, freeId, listProjects, loadProject, projectDir, updateProject } = await import("./projetos.mjs");
const { duplicateProject, ideaOf, projectCards, skipOnCopy, trashDir, trashProject } = await import("./gestao-projetos.mjs");

const write = (id, file, text = "x") => {
  const full = path.join(projectDir(id), file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, text);
};

function sampleProject(frase = "teste de projeto") {
  const state = createProject({ frase, objetivo: "saúde", duracao: 60, publico: "residentes", publicoAlvo: "saude", especialidade: "neurovascular" });
  for (const file of ["roteiro.txt", "fontes.md", "painel-roteiro.json", "cena/js/cena.js", "voz/voz.wav", "mapa/f01.png",
    "video-v1-final.mp4", "video-v1.mp4", "out/quadro.png", "painel-atividade.jsonl", "anidoodle/node_modules/pacote.js"]) write(state.id, file);
  fs.symlinkSync(os.tmpdir(), path.join(projectDir(state.id), "node_modules"), "dir");
  return updateProject(state.id, { passo: "pronto", videos: [{ file: "video-v1-final.mp4" }], titulo: "Teste" });
}

before(() => fs.mkdirSync(TEMP, { recursive: true }));
after(() => fs.rmSync(TEMP, { recursive: true, force: true }));

test("o que fica de fora da cópia: vídeos renderizados, saída de render, dependências e o registro", () => {
  for (const skipped of ["video-v1-final.mp4", "video-anidoodle-v2.mp4.film.json", "out", "node_modules", "painel-atividade.jsonl",
    path.join("anidoodle", "node_modules", "x.js")]) assert.equal(skipOnCopy(skipped), true, skipped);
  for (const kept of ["", "roteiro.txt", path.join("mapa", "f01.png"), path.join("cena", "js", "cena.js"), path.join("voz", "voz.wav"),
    path.join("referencias", "video-de-exemplo.mp4")]) assert.equal(skipOnCopy(kept), false, kept);
});

test("duplicar copia o trabalho, deixa os vídeos de fora e volta o passo para a voz", () => {
  const source = sampleProject("duplicar este");
  const copy = duplicateProject(source.id), state = loadProject(copy), dir = projectDir(copy);
  assert.equal(copy, `${source.id}-copia`);
  for (const file of ["roteiro.txt", "fontes.md", "cena/js/cena.js", "voz/voz.wav", "mapa/f01.png"]) assert.ok(fs.existsSync(path.join(dir, file)), file);
  for (const file of ["video-v1-final.mp4", "video-v1.mp4", "out", "node_modules", "anidoodle/node_modules"]) assert.ok(!fs.existsSync(path.join(dir, file)), file);
  assert.equal(state.titulo, "Teste (cópia)");
  assert.deepEqual(state.videos, []);
  assert.equal(state.passo, "voz");
  assert.equal(state.origem, source.id);
  assert.equal(state.publicoAlvo, "saude");
  assert.ok(fs.existsSync(path.join(projectDir(source.id), "video-v1-final.mp4")), "o original continua inteiro");
  assert.equal(duplicateProject(source.id), `${source.id}-copia-2`);
});

test("excluir move a pasta inteira para a lixeira do painel, sem apagar nada", () => {
  const source = sampleProject("excluir este");
  const where = trashProject(source.id);
  assert.ok(where.startsWith("_lixeira"));
  assert.ok(!fs.existsSync(projectDir(source.id)));
  assert.ok(fs.existsSync(path.join(TEMP, where, "video-v1-final.mp4")));
  assert.ok(!listProjects().some((p) => p.id === source.id));
  assert.ok(fs.existsSync(trashDir()));
});

test("projeto trabalhando não pode ser duplicado nem excluído", () => {
  const busy = updateProject(sampleProject("ocupado agora").id, { ocupado: "render final" });
  assert.throws(() => duplicateProject(busy.id), /trabalhando/);
  assert.throws(() => trashProject(busy.id), /trabalhando/);
  assert.ok(fs.existsSync(projectDir(busy.id)));
});

test("os cartões: tamanho sem seguir atalhos, capa do mapa e nada da lixeira", () => {
  const { id } = sampleProject("cartao");
  const card = projectCards().find((c) => c.id === id);
  assert.ok(card.bytes > 0 && card.bytes < 1e6);
  assert.equal(card.capa, `/arquivos/${card.id}/mapa/f01.png`);
  assert.equal(card.videos, 1);
  assert.equal(card.especialidade, "neurovascular");
  assert.ok(!projectCards().some((c) => c.id.startsWith("_")));
});

test("gerar novamente reaproveita a ideia e as escolhas; nomes de pasta não colidem", () => {
  const source = sampleProject("mesma ideia");
  assert.deepEqual(ideaOf(source.id), { frase: "mesma ideia", objetivo: "saúde", duracao: 60, publico: "residentes",
    publicoAlvo: "saude", especialidade: "neurovascular" });
  assert.equal(createProject(ideaOf(source.id)).id, `${source.id}-2`);
  assert.equal(freeId("x".repeat(80)).length, 54);
});
