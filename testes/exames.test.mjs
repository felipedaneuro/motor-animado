// exames.test.mjs: as peças de exame e o cérebro de perfil. Rodar com: node --test testes/exames.test.mjs
// O que se trava aqui é o que, se errar, vira erro de informação: o lado, a convenção radiológica e o ponto da oclusão.
import assert from "node:assert/strict";
import { test } from "node:test";
import { COLORS, angiography, axialCT, ctaVessels, pulseAt, screenSign, sliceColor } from "../motor-animado/motores/web/js/exames.js";
import { BRAIN_COLORS, brainProfile, insideBrain, profileColor, territoryOf } from "../motor-animado/motores/web/js/cerebro-perfil.js";
import { raster, stairs } from "../motor-animado/motores/web/js/pixelsvg.js";

const box = { x: 200, y: 600, width: 660, height: 780 };
const rectsOf = (markup, fill) => [...markup.matchAll(/<rect x="(-?\d+)" y="(-?\d+)" width="(\d+)" height="(\d+)" fill="([^"]+)"/g)]
  .filter((match) => match[5] === fill).map((match) => ({ x: +match[1], width: +match[3] }));

test("convenção radiológica: o lado direito do paciente fica à esquerda da tela", () => {
  assert.equal(screenSign("D"), -1);
  assert.equal(screenSign("E"), 1);
  const markup = axialCT({ box });
  const d = markup.indexOf(">D<"), e = markup.indexOf(">E<");
  const xOf = (index) => Number(markup.slice(0, index).match(/x="(-?\d+)"[^>]*$/)[1]);
  assert.ok(xOf(d) < box.x && xOf(e) > box.x + box.width);
});

test("o hematoma epidural e o subdural ficam do lado pedido", () => {
  for (const type of ["epidural", "subdural"]) {
    assert.equal(sliceColor(-0.85, -0.1, { findings: [{ type, side: "D" }] }), COLORS.blood, `${type} D`);
    assert.notEqual(sliceColor(0.85, -0.1, { findings: [{ type, side: "D" }] }), COLORS.blood, `${type} D não vaza para E`);
    assert.equal(sliceColor(0.85, -0.1, { findings: [{ type, side: "E" }] }), COLORS.blood, `${type} E`);
  }
});

test("a lente epidural é mais grossa e mais curta que o crescente subdural", () => {
  const thickness = (type, y) => [0.86, 0.8, 0.74, 0.7].filter((x) => sliceColor(-x, y, { findings: [{ type, side: "D" }] }) === COLORS.blood).length;
  assert.ok(thickness("epidural", -0.1) > thickness("subdural", -0.1));
  assert.equal(sliceColor(-0.4, 0.5, { findings: [{ type: "epidural", side: "D" }] }) === COLORS.blood, false);
});

test("a isquemia da cerebral média esquerda escurece só o hemisfério esquerdo", () => {
  const findings = [{ type: "isquemia", side: "E", territory: "acm" }];
  assert.equal(sliceColor(0.6, 0, { findings }), COLORS.infarct);
  assert.notEqual(sliceColor(-0.6, 0, { findings }), COLORS.infarct);
});

test("a hemorragia subaracnóidea enche as cisternas e deixa os ventrículos escuros", () => {
  const findings = [{ type: "hsa" }];
  assert.equal(sliceColor(0, -0.02, { level: "basal", findings }), COLORS.blood);
  assert.equal(sliceColor(0, 0.3, { level: "basal", findings }), COLORS.csf);
  assert.equal(sliceColor(0.1, -0.2, { findings }), COLORS.csf);
});

test("oclusão da M1 esquerda: coto à direita da tela, sem M2 esquerda, M2 direita intacta", () => {
  const { segments, cutoff } = ctaVessels({ box, occlusion: { artery: "M1", side: "E" } });
  assert.ok(cutoff[0] > box.x + box.width / 2);
  assert.ok(!segments.some((s) => s.side === "E" && s.id.startsWith("M2")));
  assert.ok(segments.some((s) => s.side === "D" && s.id === "M2"));
  const stump = segments.find((s) => s.side === "E" && s.id === "M1");
  assert.deepEqual(stump.points.at(-1), cutoff);
});

test("oclusão da basilar tira as duas cerebrais posteriores; sem oclusão, nada falta", () => {
  const basilar = ctaVessels({ box, occlusion: { artery: "basilar" } });
  assert.ok(!basilar.segments.some((s) => s.id === "P1" || s.id === "P2"));
  assert.equal(ctaVessels({ box }).segments.length, 16);
  assert.equal(ctaVessels({ box }).cutoff, null);
});

test("angiografia: os ramos da cerebral média só aparecem depois da reperfusão", () => {
  const before = angiography({ box, side: "E", reperfused: false }), after = angiography({ box, side: "E", reperfused: true });
  assert.ok((after.match(/<path/g) || []).length > (before.match(/<path/g) || []).length + 2);
});

test("cérebro de perfil esquerdo: frente à esquerda da tela e cerebelo embaixo à direita", () => {
  const markup = brainProfile({ box, side: "E" });
  const cerebellum = rectsOf(markup, BRAIN_COLORS.folia).concat(rectsOf(markup, BRAIN_COLORS.cerebellum));
  const middle = box.x + box.width / 2;
  assert.ok(cerebellum.length > 0 && cerebellum.every((r) => r.x + r.width / 2 > middle));
  const mirrored = brainProfile({ box, side: "D" });
  const flipped = rectsOf(mirrored, BRAIN_COLORS.folia).concat(rectsOf(mirrored, BRAIN_COLORS.cerebellum));
  assert.ok(flipped.every((r) => r.x + r.width / 2 < middle));
});

test("territórios na face lateral: anterior em cima, posterior no polo occipital, média no meio", () => {
  assert.equal(territoryOf(0.4, 0.08), "aca");
  assert.equal(territoryOf(0.92, 0.42), "acp");
  assert.equal(territoryOf(0.42, 0.45), "acm");
  assert.equal(territoryOf(0.76, 0.85), null);   // cerebelo não é território da cerebral
  assert.ok(insideBrain(0.6, 0.9) && !insideBrain(0.02, 0.95));
  assert.equal(profileColor(0.47, 0.4, { infarct: { territory: "acm", core: 1, penumbra: 1 } }), BRAIN_COLORS.core);
});

test("a base em pixel: células iguais viram um retângulo, degraus ficam na grade e o pulso respeita 1 por segundo", () => {
  const markup = raster({ x: 0, y: 0, width: 48, height: 12 }, () => "#fff");
  assert.equal((markup.match(/<rect/g) || []).length, 1);
  assert.ok(stairs([[0, 0], [30, 30]]).split(/[MHV ]/).filter(Boolean).every((n) => Number(n) % 12 === 0));
  assert.equal(pulseAt(5, 6), 1);
  assert.equal(pulseAt(6, 6), 1);
  assert.ok(Math.abs(pulseAt(6.5, 6) - 0.2) < 1e-9);
});
