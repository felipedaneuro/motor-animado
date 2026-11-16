// comum.js: o estado da página e os ajudantes que todas as telas usam (app.js, roteiro.js).
export const app = { catalog: null, projects: [], project: null, view: "ideia", draft: null, stream: null, preview: null, cost: "", editor: null,
  settings: null, voices: [], voiceNote: "", script: null };
export const $ = (selector) => document.querySelector(selector);
export const esc = (text) => String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const busy = () => Boolean(app.project?.ocupado);

export async function api(path, body) {
  const options = body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json", "X-Painel": "1" }, body: JSON.stringify(body) };
  const response = await fetch(`/api/${path}`, options), data = await response.json();
  if (!response.ok) throw new Error(data.erro || "o painel não respondeu");
  return data;
}

// um arquivo vai cru no corpo do pedido (imagem de referência ou vídeo de estilo)
export async function sendFile(query, file) {
  const response = await fetch(`/api/projetos/${app.project.id}/enviar?${new URLSearchParams(query)}`,
    { method: "POST", headers: { "X-Painel": "1", "Content-Type": file.type || "application/octet-stream" }, body: file });
  const data = await response.json();
  if (!response.ok) throw new Error(data.erro || "o envio falhou");
  return data.arquivo;
}
