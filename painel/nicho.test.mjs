// nicho.test.mjs: a edição médica. Rodar com: node --test painel/nicho.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { MOTOR } from "./projetos.mjs";
import { NO_AUDIENCE_TAG, audienceLabel, isMedical, medicalSceneNotes, medicalScriptNotes, niche, nicheOptions, rhythmWarnings, specialtyFiles,
  spokenWords, validAudience, validSpecialty } from "./nicho.mjs";
import { externalPrompt, scenePrompt, scriptPrompt } from "./instrucoes.mjs";

const REQUESTED = ["neurologia", "neurocirurgia", "neurovascular", "cardiologia", "ortopedia"];
const AUDIENCE_FIELDS = ["rotulo", "sobre", "linguagem", "profundidade", "gancho", "regras", "fechamento"];
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

test("saúde: diretriz citada, nenhuma etiqueta de público e a regra genérica fora do pedido", () => {
  const state = project({ publicoAlvo: "saude", especialidade: "cardiologia", publico: "residentes" });
  const prompt = scriptPrompt(state);
  assert.ok(!prompt.includes("Conteúdo para profissionais de saúde"));
  assert.ok(prompt.includes(NO_AUDIENCE_TAG));
  assert.ok(scenePrompt(state).includes(NO_AUDIENCE_TAG));
  assert.ok(Object.values(niche().publicos).every((audience) => !("etiqueta" in audience)));
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

test("cada público tem limite de palavras e o pedido do roteiro cita o limite e o gancho", () => {
  for (const [id, audience] of Object.entries(niche().publicos)) {
    assert.ok(Number.isInteger(audience.palavras_por_frase) && audience.palavras_por_frase > 0, id);
    const prompt = scriptPrompt(project({ publicoAlvo: id, especialidade: "cardiologia" }));
    assert.ok(prompt.includes(`no máximo ${audience.palavras_por_frase} palavras por frase`), id);
    assert.ok(prompt.includes(audience.gancho), id);
  }
});

test("a emoção entre colchetes não conta como palavra", () => {
  assert.deepEqual(spokenWords("[serious] Oclusão em M1. Cada minuto conta."), ["Oclusão", "em", "M1.", "Cada", "minuto", "conta."]);
  assert.equal(spokenWords("[calm] — ").length, 0);
});

test("frases acima do limite viram um aviso; projeto antigo não recebe aviso", () => {
  const long = "[focused] A tomografia sem contraste pesquisa hemorragia e a angiotomografia localiza a oclusão arterial proximal";
  const phrases = ["[serious] Oclusão em M1. Cada minuto conta.", long];
  const [warning] = rhythmWarnings(project({ publicoAlvo: "saude" }), phrases);
  assert.match(warning, /limite de 12 palavras\): 2 \(14\)/);
  assert.deepEqual(rhythmWarnings(project({ publicoAlvo: "saude" }), [phrases[0]]), []);
  assert.deepEqual(rhythmWarnings(project(), phrases), []);
});
