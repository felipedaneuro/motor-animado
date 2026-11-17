// fontes.test.mjs: a fonte dos estilos pixel. Rodar com: node --test testes/fontes.test.mjs
// A Press Start 2P desenhava as maiúsculas acentuadas (Í, É) do tamanho de minúscula; desde 16/11/2026 os estilos pixel
// usam a Jersey 10, com a VT323 de reserva, as duas guardadas no motor para o render funcionar sem internet.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const MOTOR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "motor-animado");
const FONTS = path.join(MOTOR, "motores", "web", "vendor", "fonts");
const STYLES = path.join(MOTOR, "estilos");
const styleFiles = () => fs.readdirSync(STYLES).filter((name) => fs.existsSync(path.join(STYLES, name, "estilo.json")))
  .map((name) => [name, JSON.parse(fs.readFileSync(path.join(STYLES, name, "estilo.json"), "utf8"))]);

test("Jersey 10 e VT323 estão no motor, com a licença", () => {
  const css = fs.readFileSync(path.join(FONTS, "fonts.css"), "utf8");
  for (const [family, base] of [["Jersey 10", "Jersey10"], ["VT323", "VT323"]]) {
    assert.ok(css.includes(`'${family}'`), family);
    for (const subset of ["latin", "latin-ext"]) assert.ok(fs.statSync(path.join(FONTS, `${base}-400-${subset}.woff2`)).size > 1000);
    assert.match(fs.readFileSync(path.join(FONTS, `OFL-${base}.txt`), "utf8"), /SIL Open Font License/);
  }
});

test("nenhum estilo usa mais a Press Start 2P; os que usavam têm a VT323 de reserva", () => {
  const pixel = [];
  for (const [name, style] of styleFiles()) {
    for (const captions of [style.captions, style.overlay?.captions].filter(Boolean)) {
      assert.notEqual(captions.font, "Press Start 2P", name);
      if (captions.font === "Jersey 10") { assert.equal(captions.font_fallback, "VT323", name); pixel.push(name); }
    }
  }
  assert.equal(new Set(pixel).size, 10);
});
