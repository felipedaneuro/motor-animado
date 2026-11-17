// acervo.js: a aba Projetos. Um cartão por projeto já feito, com Abrir, Gerar novamente, Duplicar e Excluir.
//   Gerar novamente: um projeto NOVO com a mesma ideia e as mesmas escolhas; o original fica como está.
//   Duplicar: copia o trabalho (roteiro, fontes, cenas, voz) sem os vídeos renderizados.
//   Excluir: manda a pasta para a lixeira do painel (videos/_lixeira), sempre com confirmação.
import { api, app, esc } from "/comum.js";

const STEP_NAMES = { ideia: "Ideia", roteiro: "Roteiro", estilo: "Estilo", cenas: "Cenas", voz: "Voz e render", pronto: "Pronto" };
export const sizeText = (bytes) => (bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1).replace(".", ",")} GB` : `${Math.max(1, Math.round(bytes / 1e6))} MB`);
const dateText = (iso) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const labelOf = (list, id) => (list || []).find((item) => item.id === id)?.rotulo || "";

function tags(card) {
  const list = [STEP_NAMES[card.passo] || card.passo];
  if (card.publicoAlvo) list.push(labelOf(app.niche?.publicos, card.publicoAlvo));
  if (card.especialidade && card.especialidade !== "geral") list.push(labelOf(app.niche?.especialidades, card.especialidade));
  return list.filter(Boolean).map((text) => `<span class="etiqueta">${esc(text)}</span>`).join("");
}

function cardMarkup(card) {
  const lock = card.ocupado ? "disabled" : "";
  const cover = card.capa ? `<img src="${card.capa}" alt="" loading="lazy">` : `<div class="sem-previa">sem cenas ainda</div>`;
  const videos = card.videos ? `${card.videos} vídeo${card.videos > 1 ? "s" : ""}` : "sem vídeo";
  return `<article class="projeto-cartao">${cover}<div class="projeto-corpo">
    <h2>${esc(card.titulo)}</h2>
    <p class="suave">${dateText(card.criadoEm)} · ${esc(card.estilo || "sem estilo")} · ${videos} · ${sizeText(card.bytes)}</p>
    <p class="linha">${tags(card)}</p>
    ${card.ocupado ? `<p class="suave">Trabalhando: ${esc(card.ocupado)}</p>` : ""}
    <div class="linha">
      <button class="botao pequeno" data-action="abrir-projeto" data-id="${card.id}">Abrir</button>
      <button class="botao fantasma pequeno" data-action="gerar-de-novo" data-id="${card.id}" ${lock}>Gerar novamente</button>
      <button class="botao fantasma pequeno" data-action="duplicar" data-id="${card.id}" ${lock}>Duplicar</button>
      <button class="botao fantasma pequeno perigo" data-action="excluir" data-id="${card.id}" ${lock}>Excluir</button>
    </div></div></article>`;
}

export function viewProjects() {
  const intro = `<h1>Projetos</h1><p class="suave">Todos os vídeos feitos neste painel, do mais novo para o mais antigo.
    Gerar novamente cria um projeto novo com a mesma ideia e as mesmas escolhas, e o original fica como está.
    Duplicar copia o trabalho sem os vídeos renderizados. Excluir manda a pasta para a lixeira do painel (videos/_lixeira).</p>`;
  if (!app.cards) return `${intro}<div class="cartao">Carregando os projetos...</div>`;
  if (!app.cards.length) return `${intro}<div class="cartao">Nenhum projeto ainda. Comece em <b>+ Novo vídeo</b>.</div>`;
  return `${intro}<div class="projetos-grade">${app.cards.map(cardMarkup).join("")}</div>`;
}

export const loadCards = async () => { app.cards = await api("acervo"); };

// os botões da aba; open e draw vêm de app.js (abrir um projeto e redesenhar a tela)
export function projectActions(open, draw) {
  const reload = async () => { app.projects = await api("projetos"); await loadCards(); draw(); };
  const cardOf = (el) => app.cards.find((card) => card.id === el.dataset.id);
  return {
    projetos: async () => { app.view = "acervo"; app.cards = null; draw(); await loadCards(); draw(); },
    "abrir-projeto": (el) => open(el.dataset.id),
    "gerar-de-novo": async (el) => {
      const card = cardOf(el);
      if (!window.confirm(`Começar um projeto novo com a mesma ideia de "${card.titulo}"? A IA vai pesquisar e escrever um roteiro novo; o original fica como está.`)) return;
      const { id } = await api(`projetos/${card.id}/gerar-de-novo`, {});
      app.projects = await api("projetos");
      await open(id);
    },
    duplicar: async (el) => { await api(`projetos/${el.dataset.id}/duplicar`, {}); await reload(); },
    excluir: async (el) => {
      const card = cardOf(el);
      if (!window.confirm(`Excluir "${card.titulo}" (${sizeText(card.bytes)})? A pasta vai para a lixeira do painel (videos/_lixeira), de onde dá para recuperar.`)) return;
      await api(`projetos/${card.id}/excluir`, { confirmado: true });
      if (app.project?.id === card.id) { app.stream?.close(); app.project = null; }
      await reload();
    },
  };
}
