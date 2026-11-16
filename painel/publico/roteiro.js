// roteiro.js: a tela do roteiro. As frases numeradas (uma caixa por frase, com a emoção da voz), os avisos para revisar
// com caixa de marcar e o que aparece na tela em cada frase (ilustração, fundo, objetos e imagens de referência).
import { api, app, busy, esc, sendFile } from "/comum.js";

// as marcações que o eleven_v3 entende melhor; uma que não está aqui continua valendo (entra como opção extra)
const EMOTIONS = ["curious", "serious", "calm", "hopeful", "excited", "happy", "surprised", "concerned", "sad", "drama",
  "confident", "whispers", "sarcastic"];
const WORDS_PER_SECOND = 2.4;
const FIELDS = [["naTela", "Ilustração", "O assunto e o que ele faz, enquadramento, cores, o que se mexe e em que palavra"],
  ["fundo", "Fundo e ambiente", "Onde a cena acontece, luz, cor e textura do fundo"],
  ["objetos", "Objetos e personagens", "Cada objeto ou personagem com cor, tamanho e posição; textos de tela"]];

// ---------- o texto ↔ as frases ----------
function parseScript(text) {
  const lines = String(text || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const title = (lines.find((l) => l.startsWith("#")) || "").replace(/^#\s*/, "");
  const rows = lines.filter((l) => !l.startsWith("#")).map((line, k) => {
    const match = /^\[([^\]]+)\]\s*(.*)$/.exec(line);
    return { origem: k + 1, emocao: match ? match[1] : "", texto: match ? match[2] : line };
  });
  return { title, rows, dirty: false, source: text };
}

const phraseLine = (row) => `${row.emocao ? `[${row.emocao}] ` : ""}${row.texto.replace(/\s+/g, " ").trim()}`;

function composeScript(script) {
  const rows = script.rows.filter((r) => r.texto.trim());
  return { texto: [`# ${script.title.trim() || app.project.titulo}`, ...rows.map(phraseLine)].join("\n") + "\n", origens: rows.map((r) => r.origem) };
}

// o rascunho da página acompanha o arquivo enquanto a pessoa não mexeu nele (o agente pode ter reescrito)
export function syncScript() {
  const text = app.project?.roteiro || "";
  if (!app.script || app.script.projectId !== app.project?.id || (!app.script.dirty && app.script.source !== text)) {
    app.script = { ...parseScript(text), projectId: app.project?.id };
  }
}

// ---------- as frases numeradas ----------
function emotionSelect(row, k) {
  const list = row.emocao && !EMOTIONS.includes(row.emocao) ? [row.emocao, ...EMOTIONS] : EMOTIONS;
  const options = [`<option value="">sem marcação</option>`, ...list.map((e) => `<option ${e === row.emocao ? "selected" : ""}>${esc(e)}</option>`)];
  return `<select data-row="${k}" data-part="emocao" aria-label="Emoção da frase ${k + 1}" ${busy() ? "disabled" : ""}>${options.join("")}</select>`;
}

function phraseRow(row, k) {
  return `<div class="frase"><span class="num">${k + 1}</span><div class="frase-corpo">${emotionSelect(row, k)}
    <textarea rows="2" data-row="${k}" data-part="texto" aria-label="Frase ${k + 1}" ${busy() ? "disabled" : ""}>${esc(row.texto)}</textarea></div>
    <div class="frase-botoes"><button class="mini" data-action="frase-mais" data-row="${k}" title="Nova frase abaixo" ${busy() ? "disabled" : ""}>+</button>
      <button class="mini" data-action="frase-menos" data-row="${k}" title="Apagar esta frase" ${busy() || app.script.rows.length < 2 ? "disabled" : ""}>×</button></div></div>`;
}

function scriptStats(rows) {
  const words = rows.reduce((total, r) => total + r.texto.split(/\s+/).filter(Boolean).length, 0);
  return `${rows.length} frases · ${words} palavras · cerca de ${Math.round(words / WORDS_PER_SECOND)} s de fala`;
}

function scriptCard() {
  const s = app.script, lock = busy() ? "disabled" : "";
  return `<div class="cartao"><h2>Roteiro</h2><p class="suave">Uma caixa por frase, já numerada. A emoção vai para a voz e não aparece na legenda.</p>
    <label for="roteiro-titulo">Título (não é falado)</label><input id="roteiro-titulo" data-part="titulo" value="${esc(s.title)}" ${lock}>
    <div class="frases">${s.rows.map(phraseRow).join("")}</div>
    <p class="suave" style="margin-top:8px">${scriptStats(s.rows)}${s.dirty ? " · <b>alterações não salvas</b>" : ""}</p>
    <div class="linha"><button class="botao fantasma" data-action="salvar-roteiro" ${lock}>Salvar o texto</button>
      <button class="botao" data-action="ir" data-step="estilo" ${lock}>Seguir para o estilo</button></div></div>`;
}

// ---------- os avisos para revisar ----------
function warningsCard(p) {
  const list = p.avisos || [];
  if (!list.length) return "";
  const done = new Set(p.avisosRevisados || []);
  const items = list.map((w, k) => `<label class="aviso revisavel ${done.has(w) ? "feito" : ""}">
    <input type="checkbox" data-aviso="${k}" ${done.has(w) ? "checked" : ""}><span>${esc(w)}</span></label>`).join("");
  const count = list.filter((w) => done.has(w)).length;
  return `<div class="cartao"><h2>Para a sua revisão <span class="etiqueta ${count === list.length ? "pronto" : ""}">${count} de ${list.length} revisados</span></h2>${items}</div>`;
}

// ---------- o que aparece na tela ----------
function referenceStrip(p, n) {
  const files = p.referencias?.[n] || [];
  return files.map((f) => `<figure class="ref"><img src="/arquivos/${p.id}/referencias/frase-${n}/${encodeURIComponent(f)}" alt="Referência da frase ${n}" loading="lazy">
    <button class="mini" data-action="ref-remover" data-frase="${n}" data-arquivo="${esc(f)}" title="Tirar esta referência">×</button></figure>`).join("");
}

function sceneCard(p, phrase, n) {
  const item = (p.ilustracoes || []).find((i) => Number(i.frase) === n) || {}, lock = busy() ? "disabled" : "";
  const fields = FIELDS.map(([field, label, hint]) => `<div><label>${label}</label>
    <textarea rows="3" data-ilus="${n}" data-campo="${field}" placeholder="${esc(hint)}" ${lock}>${esc(item[field] || "")}</textarea></div>`).join("");
  return `<div class="cena-cartao"><div class="cena-topo"><span class="num">${n}</span><p>${esc(phrase.texto)}</p></div>
    <div class="campos-tela">${fields}</div>
    <div class="refs">${referenceStrip(p, n)}
      <label class="botao fantasma arquivo ${lock ? "desligado" : ""}">+ Imagem de referência<input type="file" accept="image/png,image/jpeg,image/webp" multiple data-ref-upload="${n}" hidden ${lock}></label>
      <button class="botao fantasma" data-action="detalhar" data-frase="${n}" ${lock}>Detalhar com IA</button>
      <small class="suave" data-salvo="${n}"></small></div></div>`;
}

function screenCard(p) {
  const saved = parseScript(p.roteiro).rows;
  if (!saved.length) return "";
  return `<div class="cartao"><h2>O que aparece na tela</h2>
    <p class="suave">Edite frase por frase: cada caixa é salva quando você sai dela. As imagens de referência mostram à IA a forma certa
      (uma peça anatômica, um objeto, um ambiente) para a cena não sair genérica. "Detalhar com IA" reescreve a frase com mais detalhe.</p>
    ${app.script.dirty ? `<div class="aviso">Salve o texto do roteiro para a lista abaixo acompanhar as frases novas.</div>` : ""}
    ${saved.map((phrase, k) => sceneCard(p, phrase, k + 1)).join("")}</div>`;
}

// o público-alvo e a especialidade do projeto (edição médica); projetos antigos não têm e não mostram nada
function audienceLine(p) {
  if (!p.publicoAlvo || !app.niche) return "";
  const label = (list, id) => list.find((item) => item.id === id)?.rotulo || id;
  const parts = [label(app.niche.publicos, p.publicoAlvo)];
  if (p.especialidade && p.especialidade !== "geral") parts.push(label(app.niche.especialidades, p.especialidade));
  return `<p class="linha">${parts.map((text) => `<span class="etiqueta sugerido">${esc(text)}</span>`).join("")}</p>`;
}

export function viewScript(adjustBox) {
  const p = app.project;
  if (!p.roteiro) return `<h1>${esc(p.titulo)}</h1>${audienceLine(p)}<div class="cartao">${busy() ? "Pesquisando e escrevendo o roteiro. Acompanhe na atividade ao lado." : `O roteiro ainda não foi escrito. <button class="botao" data-action="gerar-roteiro">Gerar roteiro</button>`}</div>`;
  syncScript();
  return `<h1>${esc(p.titulo)}</h1>${audienceLine(p)}<p class="suave">${esc(p.resumo || "")}</p>
  ${scriptCard()}${warningsCard(p)}${screenCard(p)}
  <div class="cartao"><details><summary>Fontes conferidas</summary><pre>${esc(p.fontes || "sem fontes ainda")}</pre></details></div>${adjustBox()}`;
}

// ---------- os botões e campos desta tela ----------
export const SCRIPT_ACTIONS = {
  "frase-mais": (el, draw) => { app.script.rows.splice(Number(el.dataset.row) + 1, 0, { origem: null, emocao: "", texto: "" }); app.script.dirty = true; draw(); },
  "frase-menos": (el, draw) => { app.script.rows.splice(Number(el.dataset.row), 1); app.script.dirty = true; draw(); },
  "salvar-roteiro": async (el, draw, refresh) => {
    await api(`projetos/${app.project.id}/roteiro`, composeScript(app.script));
    app.script = null;
    await refresh(false);
  },
  "ref-remover": async (el, draw, refresh) => {
    await api(`projetos/${app.project.id}/referencia-remover`, { frase: Number(el.dataset.frase), arquivo: el.dataset.arquivo });
    await refresh(false);
  },
  detalhar: (el) => api(`projetos/${app.project.id}/detalhar`, { frase: Number(el.dataset.frase) }),
};

// digitar numa frase só guarda no rascunho (sem redesenhar, para não perder o cursor)
export function onScriptInput(target) {
  const part = target.dataset?.part;
  if (!part || !app.script) return false;
  if (part === "titulo") app.script.title = target.value;
  else app.script.rows[Number(target.dataset.row)][part] = target.value;
  app.script.dirty = true;
  return true;
}

async function saveIllustration(target) {
  const n = Number(target.dataset.ilus), field = target.dataset.campo;
  const { item } = await api(`projetos/${app.project.id}/ilustracao`, { frase: n, campos: { [field]: target.value } });
  const list = app.project.ilustracoes || (app.project.ilustracoes = []);
  const at = list.findIndex((i) => Number(i.frase) === n);
  if (at < 0) list.push(item); else list[at] = item;
  const note = document.querySelector(`[data-salvo="${n}"]`);
  if (note) note.textContent = "salvo";
}

async function uploadReferences(target, refresh) {
  const n = Number(target.dataset.refUpload), files = [...target.files];
  const note = document.querySelector(`[data-salvo="${n}"]`);
  for (const [k, file] of files.entries()) {
    if (note) note.textContent = `enviando ${k + 1} de ${files.length}...`;
    await sendFile({ tipo: "referencia", frase: n, nome: file.name }, file);
  }
  await refresh(false);
}

// as mudanças (sair de uma caixa, marcar um aviso, escolher imagem): devolve true quando o evento era desta tela
export async function onScriptChange(target, draw, refresh) {
  if (target.dataset?.ilus) { await saveIllustration(target); return true; }
  if (target.dataset?.refUpload && target.files.length) { await uploadReferences(target, refresh); return true; }
  if (target.dataset?.aviso !== undefined) {
    const text = app.project.avisos[Number(target.dataset.aviso)];
    await api(`projetos/${app.project.id}/revisar-aviso`, { texto: text, feito: target.checked });
    const done = new Set(app.project.avisosRevisados || []);
    if (target.checked) done.add(text); else done.delete(text);
    app.project.avisosRevisados = [...done];
    draw();
    return true;
  }
  if (target.dataset?.part === "emocao") { onScriptInput(target); draw(); return true; }
  return false;
}
