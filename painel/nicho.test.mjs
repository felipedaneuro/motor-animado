// nicho.test.mjs: a edição médica. Rodar com: node --test painel/nicho.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { MOTOR } from "./projetos.mjs";
import { audienceLabel, isMedical, medicalSceneNotes, medicalScriptNotes, niche, nicheOptions, specialtyFiles, validAudience,
  validSpecialty } from "./nicho.mjs";
import { externalPrompt, scenePrompt, scriptPrompt } from "./instrucoes.mjs";

const REQUESTED = ["neurologia", "neurocirurgia", "neurovascular", "cardiologia", "ortopedia"];
const AUDIENCE_FIELDS = ["rotulo", "sobre", "linguagem", "profundidade", "regras", "fechamento"];
const project = (changes = {}) => ({ id: "teste", frase: "o que acontece no AVC", objetivo: "saúde", duracao: 60, publico: "",
  estilo: "atlas-anatomico", ...changes });
const GENERIC_HEALTH_RULE = "não faça diagnóstico nem indique tratamento ou dose";

test("os dois públicos existem e têm todos os campos", () => {
  const { publicos } = niche();
  assert.deepEqual(Object.keys(publicos).sort(), ["leigo", "saude"]);
  for (const audience of Object.values(publicos)) {
    for (const field of AUDIENCE_FIELDS) assert.ok(audience[field]?.length, `falta ${field} em ${audience.rotulo}`);
  }
});

test("as cinco especialidades pedidas existem, com guia", () => {
  for (const id of REQUESTED) {
    assert.ok(validSpecialty(id), id);
    assert.ok(niche().especialidades[id].guia, `${id} sem guia`);
  }
});

test("todo arquivo citado pelas especialidades existe", () => {
  for (const id of Object.keys(niche().especialidades)) {
    const { guide, reasoning, sheets } = specialtyFiles(id);
    for (const file of [...guide, ...reasoning, ...sheets]) assert.ok(fs.existsSync(file), `${id}: ${file}`);
  }
});

test("todo estilo sugerido pelas especialidades existe no motor", () => {
  for (const [id, specialty] of Object.entries(niche().especialidades)) {
    for (const style of specialty.estilos) {
      assert.ok(fs.existsSync(path.join(MOTOR, "estilos", style, "estilo.json")), `${id}: estilo ${style}`);
    }
  }
});

test("a página recebe só rótulo e descrição", () => {
  const options = nicheOptions();
  assert.equal(options.publicos.length, 2);
  assert.ok(options.especialidades.every((s) => Object.keys(s).join() === "id,rotulo,sobre"));
});

test("valores desconhecidos não passam", () => {
  assert.equal(validAudience("medico"), false);
  assert.equal(validAudience(undefined), false);
  assert.equal(validSpecialty("pediatria"), false);
  assert.equal(validAudience("__proto__"), false);
});

test("projeto antigo, sem público-alvo, segue como antes", () => {
  const old = project({ publico: "público geral" });
  assert.equal(isMedical(old), false);
  assert.equal(medicalScriptNotes(old), "");
  assert.equal(medicalSceneNotes(old), "");
  assert.equal(audienceLabel(old), "público geral");
  assert.ok(scriptPrompt(old).includes(GENERIC_HEALTH_RULE));
});

test("leigo: sem conduta nem dose, e o guia da especialidade no pedido", () => {
  const state = project({ publicoAlvo: "leigo", especialidade: "neurovascular" });
  const prompt = scriptPrompt(state);
  assert.ok(prompt.includes("não indica tratamento, remédio nem dose"));
  assert.ok(prompt.includes(path.join("especialidades", "neurovascular.md")));
  assert.ok(prompt.includes("circulacao-cerebral.md"));
  assert.equal(audienceLabel(state), "Leigo");
});

test("saúde: diretriz citada, etiqueta na tela e a regra genérica fora do pedido", () => {
  const state = project({ publicoAlvo: "saude", especialidade: "cardiologia", publico: "residentes" });
  const prompt = scriptPrompt(state);
  assert.ok(prompt.includes("Conteúdo para profissionais de saúde"));
  assert.ok(prompt.includes("diretriz vigente"));
  assert.ok(prompt.includes("raciocinio-cirurgico.md"));
  assert.ok(!prompt.includes(GENERIC_HEALTH_RULE));
  assert.equal(audienceLabel(state), "Estudantes e profissionais de saúde (residentes)");
});

test("a cena e o motor de fora também recebem o guia", () => {
  const state = project({ publicoAlvo: "saude", especialidade: "ortopedia" });
  const guide = path.join("especialidades", "ortopedia.md");
  assert.ok(scenePrompt(state).includes(guide));
  const engine = { rotulo: "Anidoodle", skill: "anidoodle:anidoodle" };
  assert.ok(externalPrompt(engine, "video.mp4", "/skill", null, state).includes(guide));
  assert.ok(!externalPrompt(engine, "video.mp4", "/skill").includes(guide));
});
