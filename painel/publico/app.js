// app.js: as telas do painel. O servidor guarda tudo; aqui só se desenha o projeto atual e se mandam os pedidos.
import { draftFrom, editorView, exportTheme, importFile, redrawSketch, setField as setThemeField } from "/temas.js";
const STEPS = [["ideia", "Ideia"], ["roteiro", "Roteiro"], ["estilo", "Estilo"], ["cenas", "Cenas"], ["voz", "Voz e render"]];
const ORDER = ["ideia", "roteiro", "estilo", "cenas", "voz", "pronto"];
const VOICES = [["mac", "Voz de teste do Mac", "grátis, robótica: serve para conferir o ritmo"],
  ["chatterbox-narrador", "Chatterbox, narrador", "grátis, gerada no Mac, leva alguns minutos"],
  ["chatterbox-narradora", "Chatterbox, narradora", "grátis, gerada no Mac, leva alguns minutos"],
  ["elevenlabs", "ElevenLabs", "paga: o custo aparece antes de gravar"]];
const app = { catalog: null, projects: [], project: null, view: "ideia", draft: null, stream: null, preview: null, cost: "", editor: null, settings: null, voices: [], voiceNote: "" };
const $ = (selector) => document.querySelector(selector);
const esc = (text) => String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function api(path, body) {
  const options = body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json", "X-Painel": "1" }, body: JSON.stringify(body) };
  const response = await fetch(`/api/${path}`, options), data = await response.json();
  if (!response.ok) throw new Error(data.erro || "o painel não respondeu");
  return data;
}

const reached = (step) => app.project && ORDER.indexOf(app.project.passo) >= ORDER.indexOf(step);
const busy = () => Boolean(app.project?.ocupado);

// ---------- os passos na lateral e a atividade ----------
// cada passo abre quando o anterior terminou: [o passo que precisa estar alcançado para abrir, o passo que o marca como feito]
const GATES = { ideia: [null, "roteiro"], roteiro: ["ideia", "estilo"], estilo: ["roteiro", "cenas"], cenas: ["estilo", "voz"], voz: ["cenas", "pronto"] };

function drawSteps() {
  $("#passos").innerHTML = STEPS.map(([id, label], k) => {
    const [needs, doneAt] = GATES[id];
    const open = id === "ideia" || (app.project && reached(needs));
    const done = reached(doneAt);
    const here = app.view === id || (id === "estilo" && app.view === "motor-estilos");   // a aba de estilos do motor fica dentro do passo Estilo
    return `<button class="passo ${here ? "atual" : ""} ${done ? "feito" : ""}" data-action="ir" data-step="${id}" ${open ? "" : "disabled"}>
      <b>${done ? "✓" : k + 1}</b><span>${label}</span></button>`;
  }).join("");
}

function logLine(entry) {
  const kind = { passo: "passo-linha", claude: "claude", erro: "erro" }[entry.tipo] || "";
  return `<li class="${kind}">${esc(entry.texto)}</li>`;
}

function drawActivity() {
  const box = $("#ocupado");
  box.hidden = !busy();
  box.textContent = busy() ? `Trabalhando: ${app.project.ocupado}` : "";
  $("#registro").innerHTML = (app.project?.atividade || []).slice(-80).map(logLine).join("");
  $("#registro").scrollTop = $("#registro").scrollHeight;
}

// ---------- as telas ----------
const viewIdea = () => `<h1>Qual é a ideia do vídeo?</h1>
  <p class="suave">Escreva uma frase. O painel pesquisa, confere os fatos, escreve o roteiro e sugere o estilo.</p>
  <div class="cartao">
    <label for="frase">A ideia, em uma frase</label>
    <textarea id="frase" placeholder="Ex.: por que quem dorme pouco sente mais fome"></textarea>
    <div class="campos" style="margin-top:12px">
      <div><label for="objetivo">Objetivo</label><select id="objetivo"><option>saúde</option><option>curiosidade</option><option>educação</option><option>produto</option></select></div>
      <div><label for="duracao">Duração</label><select id="duracao"><option value="30">30 s</option><option value="60" selected>60 s</option><option value="90">90 s</option><option value="120">2 min</option></select></div>
      <div><label for="publico">Público</label><input id="publico" value="público geral"></div>
    </div>
    <button class="botao" data-action="criar">Gerar roteiro</button>
  </div>`;

function viewScript() {
  const p = app.project;
  if (!p.roteiro) return `<h1>${esc(p.titulo)}</h1><div class="cartao">${busy() ? "Pesquisando e escrevendo o roteiro. Acompanhe na atividade ao lado." : `O roteiro ainda não foi escrito. <button class="botao" data-action="gerar-roteiro">Gerar roteiro</button>`}</div>`;
  const warnings = (p.avisos || []).map((w) => `<div class="aviso">${esc(w)}</div>`).join("");
  const rows = (p.ilustracoes || []).map((i) => `<tr><td>${esc(i.frase)}</td><td>${esc(i.naTela)}</td></tr>`).join("");
  return `<h1>${esc(p.titulo)}</h1><p class="suave">${esc(p.resumo || "")}</p>
  <div class="cartao"><h2>Roteiro</h2><p class="suave">Uma frase por linha. A marcação entre colchetes é a emoção da voz e não aparece na legenda.</p>
    <textarea id="roteiro" class="roteiro" ${busy() ? "disabled" : ""}>${esc(p.roteiro)}</textarea>
    <div class="linha" style="margin-top:12px"><button class="botao fantasma" data-action="salvar-roteiro" ${busy() ? "disabled" : ""}>Salvar o texto</button>
      <button class="botao" data-action="ir" data-step="estilo" ${busy() ? "disabled" : ""}>Seguir para o estilo</button></div></div>
  ${warnings ? `<div class="cartao"><h2>Para a sua revisão</h2>${warnings}</div>` : ""}
  ${rows ? `<div class="cartao"><h2>O que aparece na tela</h2><table><tr><th>Frase</th><th>Ilustração</th></tr>${rows}</table></div>` : ""}
  <div class="cartao"><details><summary>Fontes conferidas</summary><pre>${esc(p.fontes || "sem fontes ainda")}</pre></details></div>${adjustBox()}`;
}

const adjustBox = () => `<div class="cartao"><h2>Pedir um ajuste</h2>
  <textarea id="ajuste" placeholder="Ex.: encurte o gancho · na frase 4, mostre um relógio · tire a cena do hospital"></textarea>
  <div class="linha" style="margin-top:10px"><button class="botao fantasma" data-action="ajuste" ${busy() ? "disabled" : ""}>Enviar ajuste</button></div></div>`;

function styleCard(style) {
  const suggestion = (app.project.sugestoes || []).find((s) => s.estilo === style.nome);
  const image = style.previa ? `<img src="${style.previa}" alt="">` : `<span class="sem-previa">sem prévia</span>`;
  return `<button class="estilo ${app.draft.estilo === style.nome ? "escolhido" : ""}" data-action="escolher" data-style="${style.nome}">${image}
    <div><h3>${esc(style.nome)}</h3>${suggestion ? `<span class="etiqueta sugerido">sugerido</span>` : ""} <span class="etiqueta">${esc(style.motor)}</span>
    <p>${esc(suggestion ? suggestion.motivo : style.resumo)}</p></div></button>`;
}

// o busto em pixel dos estilos retrô: o retrato fixo de caixa de diálogo
function bustFields(a) {
  const b = a.bust || {};
  const cortes = [["black-power", "volumoso"], ["curto", "curto"], ["franja", "com franja"]].map(([v, label]) =>
    `<option value="${v}" ${(b.hairStyle || "black-power") === v ? "selected" : ""}>${label}</option>`).join("");
  return `<div class="campos" style="margin-top:14px">
    <div><label for="b-pele">Cor da pele</label><input id="b-pele" type="color" data-field="bust.skin" value="${b.skin || "#e0a173"}"></div>
    <div><label for="b-cabelo">Cor do cabelo</label><input id="b-cabelo" type="color" data-field="bust.hair" value="${b.hair || "#2a1d18"}"></div>
    <div><label for="b-corte">Cabelo</label><select id="b-corte" data-field="bust.hairStyle">${cortes}</select></div>
    <div><label for="b-roupa">Cor da roupa</label><input id="b-roupa" type="color" data-field="bust.cloth" value="${b.cloth || "#23202b"}"></div>
    <div><label for="b-faixa">Cor da bandana</label><input id="b-faixa" type="color" data-field="bust.band" value="${b.band || "#f2efe6"}"></div>
    <div><label for="b-tam">Tamanho do retrato (${b.portrait || 360} px)</label><input id="b-tam" type="range" min="200" max="520" step="20" data-field="bust.portrait" data-number="1" value="${b.portrait || 360}"></div></div>`;
}

// o visual do box de emergência dos estilos med3d: o desenho inteiro, não só o boneco
function clinicFields(a) {
  const c = a.clinic || {};
  const visuais = [["palito", "palito (traço liso)"], ["pixel", "pixel (64 bits)"]].map(([v, label]) =>
    `<option value="${v}" ${(c.look || "palito") === v ? "selected" : ""}>${label}</option>`).join("");
  return `<div class="campos" style="margin-top:14px">
    <div><label for="c-look">Visual da cena</label><select id="c-look" data-field="clinic.look">${visuais}</select>
      <small>A sala, a maca, o paciente, o médico e o monitor são desenhados neste traço — não só o personagem.</small></div>
    <div><label for="c-roupa">Cor da roupa</label><input id="c-roupa" type="color" data-field="clinic.roupa" value="${c.roupa || "#ff7a1a"}"></div>
  </div>`;
}

// o cenário em pixel dos estilos retrô: céu, serra, mata, moita e chão desenhados
function sceneryFields(a) {
  const c = a.pixel_world || {};
  const tipos = [["", "do tema"], ["campo", "campo"], ["cidade", "cidade"]].map(([v, label]) =>
    `<option value="${v}" ${(c.scenery || "") === v ? "selected" : ""}>${label}</option>`).join("");
  return `<div class="campos" style="margin-top:14px">
    <div><label for="c-tipo">Cenário em pixel</label><select id="c-tipo" data-field="pixel_world.scenery">${tipos}</select>
      <small>O céu, a serra, a mata e o chão vêm nas cores do tema; aqui você escolhe campo ou cidade.</small></div></div>`;
}

// o apresentador humano de corpo inteiro (ainda disponível para quem quiser)
function personFields(a) {
  const p = a.person || {};
  const hair = [["volumoso", "volumoso"], ["curto", "curto"], ["liso", "liso"]].map(([v, label]) =>
    `<option value="${v}" ${(p.hairStyle || "volumoso") === v ? "selected" : ""}>${label}</option>`).join("");
  return `<div class="campos" style="margin-top:14px">
    <div><label for="p-pele">Cor da pele</label><input id="p-pele" type="color" data-field="person.skin" value="${p.skin || "#e8b48c"}"></div>
    <div><label for="p-cabelo">Cor do cabelo</label><input id="p-cabelo" type="color" data-field="person.hair" value="${p.hair || "#5a3220"}"></div>
    <div><label for="p-corte">Cabelo</label><select id="p-corte" data-field="person.hairStyle">${hair}</select></div>
    <div><label for="p-jaleco">Cor do jaleco</label><input id="p-jaleco" type="color" data-field="person.coat" value="${p.coat || "#f4f6fa"}"></div>
    <div><label for="p-camisa">Cor da camisa</label><input id="p-camisa" type="color" data-field="person.shirt" value="${p.shirt || "#1f7f82"}"></div>
    <div><label for="p-calca">Cor da calça</label><input id="p-calca" type="color" data-field="person.pants" value="${p.pants || "#2d3f62"}"></div></div>`;
}

function customize(style) {
  const a = app.draft.ajustes, m = a.mascot || {};
  const themes = style.temTema ? `<label>Tema de cores</label><div class="temas">${app.catalog.temas.map((t) => `<button class="tema ${(a.theme || style.tema) === t.nome ? "escolhido" : ""}"
    data-action="tema" data-theme="${t.nome}" title="${esc(t.sobre)}">${t.cores.map((c) => `<i style="background:${c}"></i>`).join("")} ${t.nome}${t.meu ? " ★" : ""}</button>`).join("")}</div>
    <div class="linha" style="margin-top:10px"><button class="botao fantasma" data-action="tema-novo">+ Novo tema</button>
      <label class="botao fantasma arquivo">Importar tema<input type="file" id="tema-arquivo" accept=".json,application/json,image/*" hidden></label>
      <button class="botao fantasma" data-action="tema-editar">Editar ou copiar o tema escolhido</button>
      <small>Importe um tema exportado (.json) ou uma imagem de referência: o painel tira as cores dela.</small></div>` : "";
  const mascot = style.temMascote ? `<div class="campos" style="margin-top:14px">
    <div><label for="m-head">Cabeça do apresentador</label><select id="m-head" data-field="mascot.head"><option value="cerebro" ${m.head !== "bola" ? "selected" : ""}>cérebro com vasos</option><option value="bola" ${m.head === "bola" ? "selected" : ""}>bola</option></select></div>
    <div><label for="m-cor">Cor da cabeça</label><input id="m-cor" type="color" data-field="mascot.headColor" value="${m.headColor || "#8cc0f2"}"></div>
    <div><label for="m-jaleco">Cor do jaleco</label><input id="m-jaleco" type="color" data-field="mascot.coat" value="${m.coat || "#2f7fd8"}"></div>
    <div><label for="m-gravata">Cor da gravata</label><input id="m-gravata" type="color" data-field="mascot.tie" value="${m.tie || "#d8202e"}"></div></div>` : "";
  const busto = style.temBusto ? bustFields(a) : "";
  const cenario = style.temCenario ? sceneryFields(a) : "";
  const clinica = style.temClinica ? clinicFields(a) : "";
  const human = style.temPessoa ? personFields(a) : "";
  return `${themes}${busto}${cenario}${clinica}${human}${mascot}<div class="campos" style="margin-top:14px">
    <div><label for="l-tamanho">Tamanho da legenda (${a.captions?.font_px || style.legenda || 96} px)</label><input id="l-tamanho" type="range" min="56" max="120" step="4" data-field="captions.font_px" data-number="1" value="${a.captions?.font_px || style.legenda || 96}"></div>
    <div><label for="l-cor">Cor do destaque da legenda</label><input id="l-cor" type="color" data-field="captions.highlight" value="${a.captions?.highlight || "#ffd21f"}"></div>
    <div><label for="musica">Volume da música (${a.sound?.mix?.music ?? 0.08})</label><input id="musica" type="range" min="0" max="0.2" step="0.02" data-field="sound.mix.music" data-number="1" value="${a.sound?.mix?.music ?? 0.08}"></div></div>`;
}

function viewStyle() {
  const styles = app.catalog.estilos.filter((s) => s.motor === "web"), chosen = styles.find((s) => s.nome === app.draft.estilo);
  const others = app.settings.motores.map(engineCard).join("");
  const side = chosen ? `<div><img class="previa" src="${app.preview || chosen.previa || ""}" alt="Prévia do estilo">
    <button class="botao fantasma" style="margin-top:8px;width:100%" data-action="previa" ${busy() || !["lowpoly-drone", "retro-32bits", "retro-64bits"].includes(chosen.nome) ? "disabled" : ""}>Gerar prévia com os ajustes</button></div>` : "";
  return `<h1>Escolha o estilo</h1><p class="suave">Os três primeiros são a sugestão para este roteiro. Clique num estilo para personalizar.</p>
  <div class="cartao"><div class="grade">${styles.sort((x, y) => rank(x) - rank(y)).map(styleCard).join("")}</div></div>
  ${app.editor ? editorView(app.editor, app.catalog) : ""}
  ${chosen ? `<div class="cartao"><h2>Personalizar: ${esc(chosen.nome)}</h2><div class="duas"><div>${customize(chosen)}
    <div class="linha" style="margin-top:16px"><button class="botao" data-action="gerar-cenas" ${busy() ? "disabled" : ""}>Usar este estilo e gerar as cenas</button></div></div>${side}</div></div>` : ""}
  <div class="cartao"><h2>Outros motores</h2><p class="suave">Fazem o vídeo inteiro com o seu roteiro e a voz do painel, sem o passo das cenas.
    Neles o Claude roda os programas do motor dentro da pasta do vídeo, então gastam mais cota e demoram mais.</p>${others}</div>`;
}

function engineCard(e) {
  const chosen = app.draft.estilo === `externo:${e.nome}`;
  const tag = (ok, yes, no) => `<span class="etiqueta ${ok ? "pronto" : "falta"}">${ok ? yes : no}</span>`;
  // a skill é de outra pessoa e se instala uma vez, fora do painel; as dependências o painel instala com um clique
  const skill = e.temSkill ? "" : `<br><small>Instale a skill uma vez, no Claude Code:<br>${e.instalarSkill.map((c) => `<code>${esc(c)}</code>`).join("<br>")}</small>`;
  const deps = e.temSkill && !e.temDependencias ? `<br><small>Falta: ${esc(e.precisa)}</small>` : "";
  const prepare = e.temSkill && !e.temDependencias && e.podePreparar
    ? `<button class="botao fantasma" data-action="motor-preparar" data-engine="${e.nome}" ${busy() ? "disabled" : ""}>Preparar</button>` : "";
  return `<div class="aviso ${chosen ? "escolhido" : ""}"><b>${esc(e.rotulo)}</b>
    ${tag(e.temSkill, "skill instalada", "falta a skill")} ${tag(e.temDependencias, "pronto para rodar", "falta preparar")}
    <br>${esc(e.resumo)}${skill}${deps}
    <div class="linha" style="margin-top:8px">${prepare}<button class="botao ${chosen ? "" : "fantasma"}" data-action="${e.estilos.length ? "motor-estilos" : "motor-usar"}" data-engine="${e.nome}" ${e.pronto && !busy() ? "" : "disabled"}>${e.estilos.length ? "Escolher um estilo" : "Usar este motor"}</button>
      ${chosen && engineStyleName(e) ? `<small class="suave">estilo escolhido: <b>${esc(engineStyleName(e))}</b></small>` : ""}</div></div>`;
}

// ---------- a aba de estilos de um motor de fora (o Huashu tem 36 fichas de desenho) ----------
const GROUPS = [["material", "Jeito de pintar", "Serve para qualquer assunto: é o tratamento por cima do que você quer mostrar."],
  ["época", "Retrato de um tempo", "Puxa um período ou um artista: bom para linha do tempo, viagem no tempo e homenagem."],
  ["pesquisa", "Em pesquisa", "A própria skill marca estas fichas como ainda não validadas: o resultado varia."]];

function engineStyleCard(engine, style) {
  const chosen = app.draft.estilo === `externo:${engine.nome}:${style.id}`;
  return `<button class="estilo ${chosen ? "escolhido" : ""}" data-action="estilo-motor" data-engine="${engine.nome}" data-style="${style.id}">
    <div><h3>${esc(style.nome)}</h3> <span class="etiqueta">${esc(style.id)}</span>${style.nota ? ` <span class="etiqueta">${style.nota}</span>` : ""}
    <p>${esc(style.sobre)}</p></div></button>`;
}

function viewEngineStyles() {
  const engine = app.settings.motores.find((e) => e.nome === app.engine);
  if (!engine) { app.view = "estilo"; return viewStyle(); }
  const grades = GROUPS.map(([grupo, titulo, sobre]) => {
    const list = engine.estilos.filter((s) => s.grupo === grupo);
    if (!list.length) return "";
    return `<div class="cartao"><h2>${titulo} <span class="etiqueta">${list.length}</span></h2><p class="suave">${sobre}</p>
      <div class="grade">${list.map((s) => engineStyleCard(engine, s)).join("")}</div></div>`;
  }).join("");
  const chosen = engine.estilos.find((s) => app.draft.estilo === `externo:${engine.nome}:${s.id}`);
  return `<h1>Estilos do ${esc(engine.rotulo)}</h1>
  <p class="suave">${esc(engine.escolhaEstilo)} As estrelas são a nota que a própria skill dá ao estilo: ★★★ sai igual à referência, ★ ainda precisa de retoque.</p>
  <div class="linha"><button class="botao fantasma" data-action="ir" data-step="estilo">Voltar aos estilos do painel</button></div>
  ${grades}
  ${chosen ? `<div class="cartao"><h2>Escolhido: ${esc(chosen.nome)}</h2><p class="suave">O painel vai pedir ao motor a ficha <code>${esc(chosen.ficha)}</code> da skill.</p>
    <div class="linha"><button class="botao" data-action="motor-seguir" ${busy() ? "disabled" : ""}>Usar este estilo e seguir para a voz</button></div></div>` : ""}`;
}
const rank = (style) => { const k = (app.project.sugestoes || []).findIndex((s) => s.estilo === style.nome); return k < 0 ? 9 : k; };

function viewScenes() {
  const p = app.project;
  if (externalEngine()) return `<h1>Cenas</h1><div class="cartao">O motor ${esc(externalEngine().rotulo)} faz o vídeo inteiro de uma vez e não usa este passo. Siga para <b>Voz e render</b>.</div>`;
  if (!p.temMapa) return `<h1>Cenas</h1><div class="cartao">${busy() ? "Gravando a voz de teste, montando e desenhando as cenas. Isso leva alguns minutos." : `As cenas ainda não foram geradas. <button class="botao" data-action="gerar-cenas">Gerar as cenas</button>`}</div>`;
  const rows = (p.cenas || []).map((c) => `<tr><td>${esc(c.frase)}</td><td>${esc(c.texto)}</td><td>${esc(c.naTela)}</td></tr>`).join("");
  return `<h1>Cenas</h1><p class="suave">Um quadro do meio de cada frase. Clique no mapa para ampliar.</p>
  <div class="cartao"><div class="rolagem"><img class="mapa" data-action="zoom" src="/arquivos/${p.id}/mapa/mapa.jpg?${Date.now()}" alt="Mapa de cenas"></div>
    <div class="linha" style="margin-top:12px"><button class="botao" data-action="ir" data-step="voz" ${busy() ? "disabled" : ""}>Aprovar e ir para a voz</button></div></div>
  ${rows ? `<div class="cartao"><table><tr><th>Frase</th><th>Fala</th><th>Na tela</th></tr>${rows}</table></div>` : ""}${adjustBox()}`;
}

function videoCard(v, id) {
  return `<div><video controls preload="metadata" src="/arquivos/${id}/${v.file}"></video>
    <p><b>${esc(v.file)}</b><br><small>${v.motor ? esc(v.motor) : v.final ? "render final" : "rascunho"} · voz: ${esc(v.voz)}</small></p><pre>${esc(v.check)}</pre></div>`;
}

function elevenCard() {
  const cfg = app.settings.elevenlabs, list = app.voices.length ? `<div><label for="el-lista">Minhas vozes</label><select id="el-lista"><option value="">escolha uma voz</option>${app.voices.map((v) =>
    `<option value="${v.id}" ${v.id === cfg.voz ? "selected" : ""}>${esc(v.nome)}${v.tipo ? ` (${esc(v.tipo)})` : ""}</option>`).join("")}</select></div>` : "";
  return `<div class="cartao"><h2>ElevenLabs</h2>
    <p class="suave">Chave de API: <b>${app.settings.chave ? "gravada ✓" : "ainda não gravada"}</b>. Ela vai direto para o arquivo .env deste Mac e não aparece mais na tela.</p>
    <div class="campos"><div><label for="el-chave">${app.settings.chave ? "Trocar a chave" : "Colar a chave"}</label><input id="el-chave" type="password" autocomplete="off" placeholder="cole aqui a chave da ElevenLabs"></div>
      <div style="align-self:end"><button class="botao fantasma" data-action="el-chave">Gravar chave</button></div></div>
    <div class="campos"><div><label for="el-voz">ID da voz</label><input id="el-voz" value="${esc(cfg.voz)}" placeholder="vazio usa a voz do perfil.json"></div>${list}
      <div><label for="el-modelo">Modelo da voz</label><select id="el-modelo">${app.settings.modelosDeVoz.map((m) => `<option ${m === cfg.modelo ? "selected" : ""}>${m}</option>`).join("")}</select></div></div>
    <div class="linha"><button class="botao fantasma" data-action="el-salvar">Salvar voz e modelo</button>
      <button class="botao fantasma" data-action="el-vozes" ${app.settings.chave ? "" : "disabled"}>Buscar minhas vozes</button>
      <button class="botao fantasma" data-action="el-conferir" ${app.settings.chave ? "" : "disabled"}>Conferir a voz</button> <small>${esc(app.voiceNote)}</small></div>
    <p class="suave" style="margin-top:10px">O modelo eleven_v3 entende as marcações de emoção do roteiro ([curious], [serious]...). Nos outros modelos elas são retiradas.</p></div>`;
}

// o estilo de um motor de fora é "externo:<motor>" ou "externo:<motor>:<ficha do motor>"
function externalParts(value) {
  const text = value ?? app.project?.estilo ?? "";
  if (!text.startsWith("externo:")) return null;
  const [motor, ...resto] = text.slice(8).split(":");
  return { motor, estilo: resto.join(":") };
}
const externalEngine = () => { const p = externalParts(); return p ? app.settings.motores.find((e) => e.nome === p.motor) : null; };
// o nome em português da ficha escolhida dentro do motor (vazio quando o motor não tem fichas)
function engineStyleName(engine) {
  const p = externalParts(app.draft?.estilo);
  return p && p.motor === engine.nome && p.estilo ? engine.estilos.find((s) => s.id === p.estilo)?.nome || p.estilo : "";
}

function viewVoice() {
  const p = app.project, engine = externalEngine(), options = VOICES.map(([id, name, note]) => `<label class="aviso" style="display:block;cursor:pointer"><input type="radio" name="voz" value="${id}" style="width:auto" ${id === (p.vozFinal || "mac") ? "checked" : ""}> <b>${name}</b> <span class="suave">${note}</span></label>`).join("");
  const videos = (p.videos || []).slice().reverse().map((v) => videoCard(v, p.id)).join("");
  const record = engine ? "" : `<div class="linha" style="margin-top:12px"><button class="botao fantasma" data-action="voz" ${busy() ? "disabled" : ""}>Gravar com a voz escolhida</button></div>`;
  const make = engine ? `<div class="cartao"><h2>Produzir com ${esc(engine.rotulo)}</h2><p class="suave">O painel grava a voz escolhida acima e o motor faz o vídeo inteiro. Pode levar vários minutos.</p>
      <div class="linha"><button class="botao" data-action="produzir" ${busy() || !engine.pronto ? "disabled" : ""}>Produzir o vídeo</button></div></div>`
    : `<div class="cartao"><h2>Render</h2><p class="suave">O painel gera os sons, renderiza, mixa em −14 LUFS e confere cortes, quadros pretos e pisca.</p>
    <div class="linha"><button class="botao" data-action="render" data-final="" ${busy() ? "disabled" : ""}>Renderizar rascunho</button>
      <button class="botao fantasma" data-action="render" data-final="1" ${busy() ? "disabled" : ""}>Render final (mais lento)</button></div></div>`;
  return `<h1>Voz e ${engine ? "produção" : "render"}</h1>
  <div class="cartao"><h2>Voz</h2><p class="suave">Voz atual: <b>${esc(p.vozFinal || "teste do Mac")}</b>. ${esc(app.cost)}</p>${options}${record}</div>
  ${elevenCard()}${make}
  ${videos ? `<div class="cartao"><h2>Vídeos deste projeto</h2><div class="videos">${videos}</div></div>` : ""}${adjustBox()}`;
}

const STEP_LABELS = [["roteiro", "Roteiro e fontes"], ["cenas", "Cenas e revisão do mapa"], ["ajuste", "Ajustes pedidos"], ["externo", "Outros motores"]];
const modelName = (m) => ({ "": "padrão da conta", sonnet: "Sonnet 5.5 (gasta menos cota)", opus: "Opus", haiku: "Haiku (o mais leve)", fable: "Fable" }[m] || m);
const agentOf = (step) => app.settings.agentesDisponiveis.find((a) => a.nome === app.settings.agentes[step]) || app.settings.agentesDisponiveis[0];

// o campo do modelo depende do agente: lista pronta no Claude, nome escrito à mão nos outros
function modelField(step) {
  const agent = agentOf(step), value = app.settings.modelos[step] || "";
  if (!agent.modelos) return `<input id="mod-${step}" data-model="${step}" value="${esc(value)}" placeholder="vazio: modelo padrão do agente">`;
  return `<select id="mod-${step}" data-model="${step}">${agent.modelos.map((m) =>
    `<option value="${m}" ${m === value ? "selected" : ""}>${modelName(m)}</option>`).join("")}</select>`;
}

function stepRow([step, label]) {
  const agent = agentOf(step);
  const options = app.settings.agentesDisponiveis.map((a) => `<option value="${a.nome}" ${a.nome === agent.nome ? "selected" : ""}>${esc(a.rotulo)}${a.instalado ? "" : " (não instalado)"}</option>`).join("");
  return `<tr><td>${label}</td><td><select data-agent="${step}">${options}</select></td><td>${modelField(step)}</td>
    <td class="suave">${agent.instalado ? "" : `falta instalar: <code>${esc(agent.instalar)}</code>`}</td></tr>`;
}

// alguns programas do Mac (o app Gemini, por exemplo) deixam uma chave de API no ambiente do sistema,
// e o CLI a usa antes da conta. Aqui a pessoa escolhe qual das duas vale.
function geminiAccount(a) {
  const conta = app.settings.gemini?.conta || "google";
  const aviso = a.chaveNoAmbiente.length
    ? `Há uma chave no ambiente deste Mac (<code>${a.chaveNoAmbiente.map(esc).join("</code>, <code>")}</code>), posta por outro programa.`
    : "Nenhuma chave de API no ambiente deste Mac.";
  return `<div class="linha" style="margin-top:8px;align-items:center">
    <label for="gemini-conta" style="margin:0">Como entrar</label>
    <select id="gemini-conta" data-action-change="gemini-conta" style="max-width:320px">
      <option value="google" ${conta === "google" ? "selected" : ""}>com a conta Google (ignora a chave do ambiente)</option>
      <option value="chave" ${conta === "chave" ? "selected" : ""}>com a chave de API do ambiente</option>
    </select></div><small class="suave">${aviso}</small>`;
}

function agentNotes() {
  return app.settings.agentesDisponiveis.map((a) => `<div class="aviso"><b>${esc(a.rotulo)}</b>
    <span class="etiqueta ${a.instalado ? "pronto" : "falta"}">${a.instalado ? "instalado" : "não instalado"}</span>
    ${a.retoma ? "" : `<span class="etiqueta">não retoma a conversa</span>`}<br>${esc(a.nota)}
    ${a.contaOuChave ? geminiAccount(a) : ""}
    ${a.instalado ? "" : `<br><small>Para instalar, rode no terminal: <code>${esc(a.instalar)}</code> e entre na sua conta pelo próprio programa.</small>`}</div>`).join("");
}

function viewSettings() {
  const saved = app.saved ? `<div class="aviso">${esc(app.saved)}</div>` : "";
  return `<h1>Ajustes do painel</h1>${saved}
  <div class="cartao"><h2>Quem escreve cada passo</h2><p class="suave">Dá para misturar: o roteiro com um agente e as cenas com outro.
    Cada agente usa a conta dele (o Claude a sua cota do Claude, o Codex a do ChatGPT, e assim por diante).</p>
    <div class="rolagem"><table><tr><th>Passo</th><th>Agente</th><th>Modelo</th><th></th></tr>${STEP_LABELS.map(stepRow).join("")}</table></div>
    <button class="botao" style="margin-top:12px" data-action="salvar-agentes">Salvar</button></div>
  <div class="cartao"><h2>Os agentes</h2>${agentNotes()}</div>${elevenCard()}`;
}

const VIEWS = { ideia: viewIdea, roteiro: viewScript, estilo: viewStyle, "motor-estilos": viewEngineStyles, cenas: viewScenes, voz: viewVoice, ajustes: viewSettings };

function draw() {
  const error = app.project?.erro ? `<div class="aviso erro">${esc(app.project.erro)}</div>` : "";
  const view = app.view === "ajustes" || app.project ? app.view : "ideia";
  $("#conteudo").innerHTML = error + VIEWS[view]();
  $("#projetos").innerHTML = `<option value="">Projetos</option>` + app.projects.map((p) => `<option value="${p.id}" ${p.id === app.project?.id ? "selected" : ""}>${esc(p.titulo)}</option>`).join("");
  drawSteps();
  drawActivity();
}

// ---------- dados ----------
async function refresh(keepFocus = true) {
  if (!app.project) return draw();
  const typing = keepFocus && ["TEXTAREA", "INPUT"].includes(document.activeElement?.tagName);
  app.project = await api(`projetos/${app.project.id}`);
  app.projects = await api("projetos");
  app.settings = await api("config");
  if (typing) { drawSteps(); drawActivity(); } else draw();
}

async function open(id) {
  app.stream?.close();
  app.project = await api(`projetos/${id}`);
  app.draft = { estilo: app.project.estilo || app.project.sugestoes?.[0]?.estilo || null, ajustes: structuredClone(app.project.ajustes || {}) };
  if (!app.project.estilo && app.project.sugestoes?.[0]?.tema) app.draft.ajustes.theme = app.project.sugestoes[0].tema;
  app.preview = null;
  app.view = { ideia: "roteiro", pronto: "voz" }[app.project.passo] || app.project.passo;
  if ((app.project.estilo || "").startsWith("externo:") && app.view === "cenas") app.view = "voz";
  app.stream = new EventSource(`/api/projetos/${id}/eventos`);
  app.stream.onmessage = (message) => {
    const event = JSON.parse(message.data);
    if (event.tipo === "atividade") { app.project.atividade.push(event); drawActivity(); } else refresh();
  };
  draw();
}

function setField(pathText, value) {
  const keys = pathText.split(".");
  let target = app.draft.ajustes;
  keys.slice(0, -1).forEach((key) => { target = target[key] ??= {}; });
  target[keys.at(-1)] = value;
}

const saveStyle = () => api(`projetos/${app.project.id}/estilo`, { estilo: app.draft.estilo, ajustes: app.draft.ajustes });

// ---------- os botões ----------
const ACTIONS = {
  novo: () => { app.stream?.close(); app.project = null; app.view = "ideia"; draw(); },
  ir: (el) => { app.view = el.dataset.step; if (app.view === "voz" && !app.cost) loadCost(); draw(); },
  criar: async () => { const { id } = await api("projetos", { frase: $("#frase").value, objetivo: $("#objetivo").value, duracao: $("#duracao").value, publico: $("#publico").value }); app.projects = await api("projetos"); await open(id); },
  "gerar-roteiro": () => api(`projetos/${app.project.id}/gerar-roteiro`, {}),
  "salvar-roteiro": async () => { await api(`projetos/${app.project.id}/roteiro`, { texto: $("#roteiro").value }); await refresh(false); },
  ajuste: async () => { const texto = $("#ajuste").value.trim(); if (texto) { await api(`projetos/${app.project.id}/ajuste`, { texto }); $("#ajuste").value = ""; } },
  escolher: (el) => { app.draft.estilo = el.dataset.style; app.preview = null; draw(); },
  tema: (el) => { app.draft.ajustes.theme = el.dataset.theme; draw(); },
  previa: async () => { await saveStyle(); const { imagem } = await api(`projetos/${app.project.id}/previa`, { estilo: app.draft.estilo, ajustes: app.draft.ajustes }); app.preview = imagem; draw(); },
  "gerar-cenas": async () => { await saveStyle(); await api(`projetos/${app.project.id}/cenas`, {}); app.view = "cenas"; await refresh(false); },
  zoom: (el) => el.classList.toggle("grande"),
  voz: async () => {
    const motor = document.querySelector('input[name="voz"]:checked').value;
    if (motor === "elevenlabs" && !app.settings.chave) throw new Error("grave a chave da ElevenLabs antes (no cartão ElevenLabs, logo abaixo)");
    const confirmado = motor !== "elevenlabs" || window.confirm(`Gravar na ElevenLabs? ${app.cost || "O custo aparece na atividade."}`);
    if (confirmado) await api(`projetos/${app.project.id}/voz`, { motor, confirmado });
  },
  render: (el) => api(`projetos/${app.project.id}/render`, { final: Boolean(el.dataset.final) }),
  "tema-novo": () => { app.editor = draftFrom(app.catalog, currentTheme()); draw(); },
  "tema-editar": () => {
    const name = currentTheme(), own = app.catalog.temas.find((t) => t.nome === name)?.meu;
    app.editor = { ...draftFrom(app.catalog, name, own ? name : `${name}-meu`), original: own ? name : null };
    draw();
  },
  "tema-salvar": async () => {
    const { nome } = await api("temas", { nome: app.editor.nome, tema: app.editor.tema });
    app.catalog = await api("catalogo");
app.settings = await api("config");
    app.draft.ajustes.theme = nome;
    app.editor = null;
    draw();
  },
  "tema-excluir": async () => {
    if (!window.confirm(`Excluir o tema "${app.editor.original}"? Não dá para desfazer.`)) return;
    await api("temas/excluir", { nome: app.editor.original });
    app.catalog = await api("catalogo");
app.settings = await api("config");
    if (app.draft.ajustes.theme === app.editor.original) app.draft.ajustes.theme = "natural";
    app.editor = null;
    draw();
  },
  "tema-exportar": () => exportTheme(app.editor),
  "tema-cancelar": () => { app.editor = null; draw(); },
  ajustes: () => { app.view = "ajustes"; draw(); },
  "salvar-agentes": async () => {
    const agentes = Object.fromEntries([...document.querySelectorAll("[data-agent]")].map((el) => [el.dataset.agent, el.value]));
    const modelos = Object.fromEntries([...document.querySelectorAll("[data-model]")].map((el) => [el.dataset.model, el.value.trim()]));
    app.settings = await api("config", { agentes, modelos });
    app.saved = "ajustes salvos";
    draw();
  },
  "el-chave": async () => { app.settings = await api("elevenlabs/chave", { chave: $("#el-chave").value }); app.voiceNote = "chave gravada"; draw(); },
  "el-salvar": async () => { app.settings = await api("config", { elevenlabs: { voz: $("#el-voz").value.trim(), modelo: $("#el-modelo").value } }); app.voiceNote = "voz e modelo salvos"; draw(); },
  "el-vozes": async () => { app.voices = (await api("elevenlabs/vozes", {})).vozes; app.voiceNote = `${app.voices.length} vozes na sua conta`; draw(); },
  "el-conferir": async () => {
    const id = $("#el-voz").value.trim();
    if (!id) throw new Error("escreva o ID da voz para conferir");
    const voice = await api("elevenlabs/conferir", { voz: id });
    app.voiceNote = `voz encontrada: ${voice.nome}`;
    draw();
  },
  "motor-preparar": async (el) => {
    const engine = app.settings.motores.find((e) => e.nome === el.dataset.engine);
    if (!engine.temSkill) throw new Error(`instale antes a skill do ${engine.rotulo}, no Claude Code:\n${engine.instalarSkill.join("\n")}`);
    if (!window.confirm(`Preparar ${engine.rotulo}?\n\nVai instalar: ${engine.precisa}\n\nComandos:\n${engine.comandos.join("\n")}`)) return;
    await api(`projetos/${app.project.id}/preparar-motor`, { motor: engine.nome });
  },
  "motor-usar": async (el) => { app.draft.estilo = `externo:${el.dataset.engine}`; await saveStyle(); app.view = "voz"; if (!app.cost) loadCost(); await refresh(false); },
  "motor-estilos": (el) => { app.engine = el.dataset.engine; app.view = "motor-estilos"; draw(); },
  "estilo-motor": (el) => { app.draft.estilo = `externo:${el.dataset.engine}:${el.dataset.style}`; draw(); },
  "motor-seguir": async () => { await saveStyle(); app.view = "voz"; if (!app.cost) loadCost(); await refresh(false); },
  produzir: async () => {
    const voz = document.querySelector('input[name="voz"]:checked').value;
    if (voz === "elevenlabs" && !app.settings.chave) throw new Error("grave a chave da ElevenLabs antes");
    const confirmado = voz !== "elevenlabs" || window.confirm(`Gravar a voz na ElevenLabs? ${app.cost || ""}`);
    if (confirmado) await api(`projetos/${app.project.id}/produzir`, { motor: externalParts().motor, voz, confirmado });
  },
};

const currentTheme = () => app.draft.ajustes.theme || app.catalog.estilos.find((s) => s.nome === app.draft.estilo)?.tema || "natural";

async function loadCost() {
  const { custo } = await api(`projetos/${app.project.id}/custo-voz`, {});
  app.cost = custo;
  draw();
}

document.addEventListener("click", async (event) => {
  const el = event.target.closest("[data-action]");
  if (!el || el.disabled) return;
  try { await ACTIONS[el.dataset.action](el); } catch (error) { window.alert(error.message); }
});
// o editor de tema: a cor muda o desenho na hora (sem redesenhar a tela, para não perder o seletor de cor aberto)
document.addEventListener("input", (event) => {
  const data = event.target.dataset || {};
  if (!app.editor) return;
  if (data.themeMeta) app.editor[data.themeMeta] = event.target.value;
  if (data.themeField && !data.text) { setThemeField(app.editor, data.themeField, event.target.value); redrawSketch(app.editor); }
});
document.addEventListener("change", async (event) => {
  if (event.target.id === "tema-arquivo" && event.target.files[0]) {
    try { app.editor = await importFile(event.target.files[0], app.catalog); draw(); } catch (error) { window.alert(error.message); }
    return;
  }
  if (app.editor && event.target.dataset?.themeField && event.target.dataset.text) { setThemeField(app.editor, event.target.dataset.themeField, event.target.value); draw(); return; }
  const field = event.target.dataset?.field;
  if (field) { setField(field, event.target.dataset.number ? Number(event.target.value) : event.target.value); draw(); }
  if (event.target.id === "projetos" && event.target.value) open(event.target.value);
  if (event.target.id === "el-lista" && event.target.value) $("#el-voz").value = event.target.value;
  if (event.target.dataset?.actionChange === "gemini-conta") {
    try { app.settings = await api("config", { gemini: { conta: event.target.value } }); draw(); }
    catch (error) { window.alert(error.message); }
    return;
  }
  if (event.target.dataset?.agent) {   // trocar o agente troca o campo do modelo (lista ou texto livre)
    app.settings.agentes[event.target.dataset.agent] = event.target.value;
    app.settings.modelos[event.target.dataset.agent] = "";
    draw();
  }
});

app.catalog = await api("catalogo");
app.settings = await api("config");
app.projects = await api("projetos");
draw();
