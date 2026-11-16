// nicho.mjs: a edição médica. Lê motor-animado/nichos/medicina/nicho.json (públicos e especialidades) e monta o trecho
// que os pedidos ao agente ganham: as regras do público escolhido e o que ler da especialidade antes de escrever e desenhar.
import fs from "node:fs";
import path from "node:path";
import { MOTOR } from "./projetos.mjs";

export const NICHE_DIR = path.join(MOTOR, "nichos", "medicina");
const ANATOMY_DIR = path.join(MOTOR, "referencias", "anatomia");

// lido a cada chamada: o arquivo é pequeno e assim uma edição nele vale sem reiniciar o painel
export const niche = () => JSON.parse(fs.readFileSync(path.join(NICHE_DIR, "nicho.json"), "utf8"));

const listOf = (group) => Object.entries(group).map(([id, item]) => ({ id, rotulo: item.rotulo, sobre: item.sobre }));

// o que a página precisa para perguntar o público e a especialidade
export function nicheOptions() {
  const { rotulo, publicos, especialidades } = niche();
  return { rotulo, publicos: listOf(publicos), especialidades: listOf(especialidades) };
}

export const validAudience = (id) => Object.hasOwn(niche().publicos, String(id));
export const validSpecialty = (id) => Object.hasOwn(niche().especialidades, String(id));
export const isMedical = (state) => Boolean(state?.publicoAlvo) && validAudience(state.publicoAlvo);

// o público como o roteirista lê: o rótulo do público-alvo e o detalhe que a pessoa escreveu (projetos antigos: só o texto)
export function audienceLabel(state) {
  const detail = String(state?.publico || "").trim();
  if (!isMedical(state)) return detail || "público geral";
  const label = niche().publicos[state.publicoAlvo].rotulo;
  return detail ? `${label} (${detail})` : label;
}

const bullets = (lines, indent = "  ") => lines.map((line) => `${indent}- ${line}`).join("\n");

// os arquivos que o agente abre antes de escrever ou desenhar: o guia da especialidade, o raciocínio e as fichas
export function specialtyFiles(specialtyId) {
  const specialty = niche().especialidades[specialtyId] || niche().especialidades.geral;
  const guide = specialty.guia ? [path.join(NICHE_DIR, specialty.guia)] : [];
  const reasoning = specialty.raciocinio.map((file) => path.join(NICHE_DIR, file));
  const sheets = specialty.fichas.map((file) => path.join(ANATOMY_DIR, file));
  return { specialty, guide, reasoning, sheets };
}

// o público só muda o texto e a profundidade: o vídeo nunca diz na tela para quem ele é (a pessoa achou feio)
export const NO_AUDIENCE_TAG = "Nenhuma etiqueta de público na tela: nada de \"conteúdo para profissionais\", \"para leigos\" ou \"para estudantes\".";

function audienceBlock(audience) {
  return `Público-alvo: ${audience.rotulo}. Estas regras valem sobre as regras de cuidado do perfil quando as duas divergirem:
- Linguagem: ${audience.linguagem}
- Profundidade: ${audience.profundidade}
- Ritmo: no máximo ${audience.palavras_por_frase} palavras por frase falada (sem contar a emoção entre colchetes). Uma ideia por
  frase: o que não cabe vira duas frases. A profundidade vem da sequência de frases curtas, não de frases longas.
- Gancho: ${audience.gancho}
- Regras:
${bullets(audience.regras)}
- Na tela: ${NO_AUDIENCE_TAG}
- Fechamento: ${audience.fechamento}`;
}

function readingBlock(files) {
  const lines = [...files.guide.map((f) => `${f} (o guia: anatomia e fisiologia exatas, erros comuns, diretrizes)`),
    ...files.reasoning.map((f) => `${f} (o esqueleto do raciocínio e a cena de cada etapa)`),
    ...files.sheets.map((f) => `${f} (ficha de anatomia)`)];
  return bullets(lines);
}

// o trecho do pedido do roteiro: público, especialidade, leitura e o campo "raciocinio" no painel-roteiro.json
export function medicalScriptNotes(state) {
  if (!isMedical(state)) return "";
  const audience = niche().publicos[state.publicoAlvo], files = specialtyFiles(state.especialidade);
  const styles = files.specialty.estilos.length ? `\nEstilos que combinam com a especialidade: ${files.specialty.estilos.join(", ")}.` : "";
  return `
Edição médica. Especialidade: ${files.specialty.rotulo}.
${audienceBlock(audience)}
Leia antes de escrever (o que estiver marcado [CONFERIR] só entra depois de conferido numa fonte):
${readingBlock(files)}
Siga o raciocínio: escolha as etapas que o tema pede, na ordem, e escreva o roteiro como o médico pensa, não como lista de fatos.
No painel-roteiro.json, acrescente o campo "raciocinio" (o formato está no arquivo do raciocínio). Em cada ilustração, o naTela
dá a estrutura pelo nome anatômico, a vista e o lado do paciente.${styles}
`;
}

// as palavras faladas de uma linha do roteiro: sem a emoção entre colchetes
export const spokenWords = (line) => String(line).replace(/\[[^\]]*\]/g, " ").split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word));

// a conferência que não depende da IA: frases acima do limite do público viram um aviso para revisar
export function rhythmWarnings(state, phrases) {
  if (!isMedical(state)) return [];
  const limit = niche().publicos[state.publicoAlvo].palavras_por_frase;
  const long = phrases.map((line, k) => [k + 1, spokenWords(line).length]).filter(([, count]) => count > limit);
  if (!long.length) return [];
  const list = long.map(([phrase, count]) => `${phrase} (${count})`).join(", ");
  return [`Frases longas para o ritmo do vídeo (limite de ${limit} palavras): ${list}. Divida cada uma em duas ou peça um ajuste.`];
}

// o trecho dos pedidos de cena (do painel e dos motores de fora): o que ler e as convenções de desenho
export function medicalSceneNotes(state) {
  if (!isMedical(state)) return "";
  const audience = niche().publicos[state.publicoAlvo], files = specialtyFiles(state.especialidade);
  return `
Edição médica (${files.specialty.rotulo}, público: ${audience.rotulo}). Antes de desenhar, leia:
${readingBlock(files)}
  E siga, sem exceção:
  - a cena de cada etapa do raciocínio (o campo "raciocinio" do ./painel-roteiro.json diz a etapa de cada frase);
  - a estrutura anatômica certa, na vista e no lado pedidos; lesão de um hemisfério mostra o déficit do lado oposto;
  - exames (TC, RM, ECG, raio X) redesenhados no traço do estilo, em convenção radiológica, nunca a imagem de um exame real;
  - nada de sangue realista, campo cirúrgico real ou rosto em célula e órgão;
  - ${NO_AUDIENCE_TAG}
`;
}
