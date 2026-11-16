// instrucoes.mjs: os pedidos que o painel faz ao Claude em cada passo. Sempre: só arquivos, sem perguntas, sem terminal.
import fs from "node:fs";
import path from "node:path";
import { MOTOR, VIDEOS, loadProject } from "./projetos.mjs";
import { catalog, exampleDir } from "./catalogo.mjs";
import { references } from "./ilustracoes.mjs";
import { audienceLabel, isMedical, medicalSceneNotes, medicalScriptNotes } from "./nicho.mjs";

const RULES = `Regras desta conversa:
- Você só escreve e lê arquivos e pesquisa na internet. Não rode as ferramentas do motor (voz, montar, mapa, sons, render, mixar,
  conferir) nem tente renderizar: quem roda tudo isso é o painel, assim que você terminar.
- A pessoa já aprovou este passo no painel. Não faça perguntas nem peça confirmação: decida, faça e relate em poucas linhas.
- Escreva só dentro da pasta atual (a pasta do vídeo). A skill em ${MOTOR} é só para leitura: nunca altere nada lá.
- Português do Brasil. Sem travessão no meio das frases. Nomes de variáveis em inglês no código.`;

// o que o roteirista precisa do perfil (regras de cuidado, pedido final, canal e personagens); o resto do perfil não sai daqui
function profileNotes() {
  const file = path.join(VIDEOS, "perfil.json");
  if (!fs.existsSync(file)) return "(sem perfil.json: use regras gerais de cuidado e um pedido final simples)";
  const { care_rules, cta, channel, characters, language } = JSON.parse(fs.readFileSync(file, "utf8"));
  return JSON.stringify({ care_rules, cta, channel, characters, language }, null, 1);
}

const styleList = () => catalog().estilos.filter((s) => s.motor === "web").map((s) => `- ${s.nome}: ${s.resumo}`).join("\n");
const themeList = () => catalog().temas.map((t) => `- ${t.nome}: ${t.sobre}`).join("\n");

// o que cada ilustração precisa dizer para a cena não sair genérica
const ILLUSTRATION_GUIDE = `Cada ilustração é uma direção de arte, não um tema solto:
   - naTela: 2 a 4 frases. O assunto principal e o que ele faz, o enquadramento (perto ou longe, de frente, de lado, de cima),
     onde está na tela, as cores principais e o que se mexe e em que palavra. Nada de "ilustração sobre X".
   - fundo: o ambiente e a luz (onde a cena acontece, hora do dia, cor e textura do fundo), ou "fundo liso <cor>".
   - objetos: os objetos, personagens e textos de tela, cada um com cor, tamanho e posição; o que não pode faltar.`;

// a regra de saúde do passo de pesquisa: na edição médica quem manda é o público-alvo escolhido
const healthRule = (state) => (isMedical(state)
  ? "Em saúde: siga as regras do público-alvo acima (elas valem sobre as regras de cuidado do perfil)."
  : "Em saúde: explique o mecanismo,\n   não faça diagnóstico nem indique tratamento ou dose, e diga quando procurar ajuda.");

export function scriptPrompt(state) {
  const phrases = Math.round((state.duracao * 2.4) / 14);
  return `${RULES}

Você é o roteirista do painel Motor Animado.
Tema: "${state.frase}". Objetivo: ${state.objetivo}. Duração alvo: ${state.duracao} s (cerca de ${phrases} frases). Público: ${audienceLabel(state)}.
${medicalScriptNotes(state)}
1. Leia ${MOTOR}/referencias/roteiro.md e ${MOTOR}/SKILL.md (as regras). O perfil do canal (regras de cuidado e pedido final) é este:
${profileNotes()}
2. Confira os fatos na internet: cada número em duas fontes sérias; o que não se confirmar não entra. ${healthRule(state)}
   Se o assunto é corpo humano, comece pelo acervo
   do motor: ${MOTOR}/referencias/anatomia/README.md (fichas prontas e o mapa das fontes).
3. Escreva ./fontes.md: uma linha por afirmação, com a fonte e o link; marque o que ficou com uma fonte só.
4. Escreva ./roteiro.txt: a primeira linha é um comentário que começa com "#"; depois uma frase por linha, cada uma com algo que dê
   para mostrar na tela, começando com a emoção entre colchetes em inglês (ex.: [curious], [serious], [hopeful]).
5. Escreva ./painel-roteiro.json, um JSON válido neste formato:
   {"titulo": "título curto", "resumo": "uma frase",
    "avisos": ["o que precisa de revisão humana ou ficou com uma fonte só"],
    "sugestoes": [{"estilo": "<nome>", "tema": "<tema>", "motivo": "por que combina"}, 3 itens, o melhor primeiro],
    "ilustracoes": [{"frase": 1, "naTela": "...", "fundo": "...", "objetos": "..."}, um item por frase]}
   ${ILLUSTRATION_GUIDE}

Estilos que o painel monta sozinho:
${styleList()}
Temas de cor (para os estilos de mundo de dia):
${themeList()}

Termine respondendo com a palavra PRONTO numa linha.`;
}

export function scenePrompt(state) {
  const example = exampleDir(state.estilo);
  return `${RULES}

Você é o diretor de cena. Estilo: ${state.estilo}. Os ajustes de estilo estão em ./estilo-ajustes.json.
O painel já gravou uma voz de teste, alinhou as palavras e montou a cena: o motor está em ./cena/js/motor, o kit do estilo em
./cena/js/estilo, o estilo em ./cena/js/estilo.js e os tempos em ./cena/js/tempos.js.

Leia antes de escrever:
- ${MOTOR}/referencias/cena-web.md (como se escreve plano.js e cena.js)
- ${MOTOR}/referencias/anatomia/README.md, se o vídeo mostra alguma parte do corpo: abra a ficha do órgão antes de
  desenhá-lo (medida, posição, cor, o que não pode faltar, erros comuns). Sem ficha, escreva uma pela fonte do mapa.
- ${MOTOR}/estilos/${state.estilo}/receita.md
- o exemplo do estilo: ${example}/plano.js e ${example}/cena.js
- ./roteiro.txt, ./painel-roteiro.json (as ilustrações pedidas: naTela, fundo e objetos de cada frase; a pessoa pode ter
  editado à mão, então siga o que está escrito) e ./voz/tempos.json (as palavras de cada frase)${referenceNotes(state.id)}
- os arquivos de ./cena/js/estilo e, se precisar de uma peça, ./cena/js/motor (formas.js, mundo.js, mascote.js, anatomia.js)
${medicalSceneNotes(state)}
Escreva para ESTE roteiro:
- ./cena/js/plano.js: os tempos (T), a câmera (CAMERA), etiquetas (LABELS), cards (CARDS), destaques (HIGHLIGHTS) e sons (SOUNDS).
  wordStart(i, "palavra") só com palavra que existe na frase i do tempos.json, sem acento e em minúsculas; na dúvida, phraseStart(i).
  As frases contam do 0.
- ./cena/js/cena.js: o que aparece em cada frase. Uma ideia visual por frase; nada cortado pela borda; nada tampando a legenda.
- ./cena/js/pecas.js só se precisar de peças novas.
- Funções com no máximo 40 linhas, sem console.log, tudo função de t (nada de relógio nem sorteio).
- ./painel-cenas.json: [{"frase": 1, "texto": "a frase", "naTela": "o que aparece", "fundo": "...", "objetos": "..."}] (uma por frase).

Termine respondendo com a palavra PRONTO numa linha.`;
}

export const fixPrompt = (problem) => `${RULES}

O painel rodou as checagens da cena e encontrou este problema:

${problem}

Corrija os arquivos de ./cena/js (plano.js, cena.js, pecas.js). Termine com a palavra PRONTO numa linha.`;

export const blackPrompt = () => fixPrompt(`Os quadros do mapa de cenas saíram pretos. Isso quase sempre é erro de JavaScript ao carregar a cena:
um import de algo que o arquivo não exporta, um nome que não existe, ou wordStart com uma palavra que não está na frase.
Confira cada import contra os arquivos de ./cena/js/motor e ./cena/js/estilo e cada wordStart contra ./voz/tempos.json.`);

export const reviewPrompt = () => `${RULES}

O painel gerou o mapa de cenas: ./mapa/mapa.jpg (a grade) e ./mapa/f01.png, f02.png... (um quadro por frase, em tamanho real).
Abra o mapa.jpg e os quadros que parecerem ter problema. Procure: personagem ou peça cortado pela borda, câmera perto ou longe demais,
texto tampando o assunto, cena vazia, peça afundada no chão, a frase sem nada do que ela fala na tela.
Se houver defeito, corrija ./cena/js/plano.js e ./cena/js/cena.js e responda com a palavra CORRIGIDO numa linha, dizendo o que mudou.
Se estiver bom, responda com a palavra APROVADO numa linha.`;

export const adjustPrompt = (state, request) => `${RULES}

A pessoa pediu este ajuste pelo painel (passo atual: ${state.passo}):

"${request}"

Faça o ajuste nos arquivos certos: ./roteiro.txt e ./fontes.md se for sobre o texto (confira qualquer fato novo e atualize
./painel-roteiro.json, incluindo naTela, fundo e objetos de cada frase); ./cena/js/plano.js, cena.js e pecas.js se for sobre a
imagem (atualize ./painel-cenas.json). Se ./cena/js ainda não existe, o ajuste de imagem vai só para ./painel-roteiro.json.${referenceNotes(state.id)}
${medicalScriptNotes(state)}
Termine com uma linha começando com ROTEIRO (se mudou o texto falado), CENA (se mudou só a imagem) ou NADA, e diga o que mudou.`;

// o pedido para um motor de fora (modo livre): a skill do motor faz o vídeo com o roteiro e a voz que o painel já gravou
export const externalPrompt = (engine, output, skillPath, card = null, state = null) => `A pessoa pediu pelo painel Motor Animado um vídeo feito com o motor "${engine.rotulo}".
Já está aprovado: não faça perguntas nem peça confirmação. Decida, faça e relate em poucas linhas.

Use a skill ${engine.skill} e siga o fluxo dela, incluindo as conferências que ela pede. Se o seu agente tiver a ferramenta Skill,
chame por ela; se não tiver, leia o SKILL.md e as referências desta pasta e siga os passos à mão:
${skillPath}
${card ? `
Estilo escolhido pela pessoa no painel: **${card.nome}** (ficha ${card.id}). Leia ${skillPath}/${card.ficha} antes de desenhar
e use essa ficha no vídeo inteiro, do primeiro ao último quadro: um estilo só, uma paleta só. ${card.sobre}
Da ficha vem o jeito de desenhar, não o conteúdo: a composição e os objetos são deste roteiro, não os do exemplo dela.
` : ""}${medicalSceneNotes(state)}

Entradas, nesta pasta (a pasta do vídeo):
- ./roteiro.txt: uma frase por linha; as marcações entre colchetes são emoção da voz e não entram em texto de tela
- ./fontes.md: os fatos já conferidos (não invente outros)
- ./voz/voz.wav: a narração já gravada; ./voz/tempos.json: o começo e o fim de cada frase e de cada palavra

Entrega: ./${output}, vertical 1080x1920, 30 quadros por segundo, com a narração de ./voz/voz.wav mixada. O vídeo dura o que a voz
dura e cada cena acompanha a frase falada (use os tempos do tempos.json). Legenda sincronizada se a skill oferecer.

Limites:
- Trabalhe só dentro desta pasta. Não leia nem altere ../.env nem ../perfil.json.
- Dependências: só o que a skill pedir, instalado nesta pasta (npm install local; pip só no ../../.venv). Nunca -g, brew ou sudo.
- ./node_modules já tem o playwright-core. Para renderizar, use o Chrome instalado (channel "chrome", ou
  /Applications/Google Chrome.app/Contents/MacOS/Google Chrome) em vez de baixar o Chromium.
- Não baixe pacotes grandes de som ou de modelos: recuse pela ferramenta da própria skill e siga sem eles.
- Nada de deploy, git push ou envio de dados para fora.

Termine com uma linha: PRONTO ${output}  ou  FALHOU <motivo em uma frase>.`;

// as imagens que a pessoa mandou para cada frase: o agente abre e desenha a partir delas
function referenceNotes(id) {
  const found = Object.entries(references(id));
  if (!found.length) return "";
  const lines = found.map(([phrase, files]) => `  frase ${phrase}: ${files.map((f) => `./referencias/frase-${phrase}/${f}`).join(", ")}`);
  return `
- As imagens de referência que a pessoa enviou. Abra cada uma antes de desenhar a frase dela e siga a forma, a proporção, a
  posição das partes e as cores; traduza para o traço do estilo, sem copiar marca d'água, logotipo ou texto da imagem:
${lines.join("\n")}`;
}

// quando a pessoa clica em Continuar depois de um erro: o agente confere o que já fez antes de seguir
export const continuePrompt = (reason) => `Atenção: a tentativa anterior deste mesmo pedido parou no meio (${String(reason).slice(0, 300)}).
Antes de qualquer coisa, confira o que já está escrito nos arquivos da pasta e continue de onde parou. Não refaça o que já está
pronto e certo; termine o que faltou.

`;

export const detailPrompt = (id, phrase) => `${RULES}

A pessoa pediu pelo painel mais detalhe no que aparece na tela da frase ${phrase}.
Leia ./roteiro.txt (as frases contam do 1, sem a linha de comentário), ./fontes.md e ./painel-roteiro.json.
Reescreva só o item da frase ${phrase} em ./painel-roteiro.json → ilustracoes, mantendo o JSON válido e os outros itens iguais.
${ILLUSTRATION_GUIDE}
Se a pessoa já escreveu alguma coisa nesses campos, mantenha a ideia dela e acrescente o detalhe que falta.${referenceNotes(id)}
${medicalSceneNotes(loadProject(id))}

Termine com a palavra PRONTO numa linha.`;

// o estilo novo a partir de um vídeo: o painel já decupou e já criou o estilo com os números; o agente olha e completa
export const newStylePrompt = (name, folder) => `${RULES}

O painel decupou um vídeo de referência e criou o estilo novo "${name}" com os números medidos. Falta o que só o olho vê.
Trabalhe só dentro de ./${folder} (a cópia do estilo está em ./${folder}/estilo; o painel a publica quando você terminar).

Leia antes:
- ${MOTOR}/referencias/estilo-novo.md (o passo a passo; aqui você faz as partes 2 e 3, sem rodar ferramenta nenhuma)
- ${MOTOR}/referencias/cena-web.md e um estilo pronto parecido em ${MOTOR}/estilos/ (receita.md e kit.js) como modelo de capricho
- ./${folder}/decupagem/${name}/decupagem.md e as folhas: folhas/historia, folhas/ritmo, folhas/corte-* e folhas/movimento-*, e tomadas/

Faça:
1. Complete cada [OLHAR] da ./${folder}/estilo/receita.md olhando as folhas, com o segundo de cada coisa e a medida
   ("a peça entra crescendo em 6 quadros, na palavra"), e apague as marcas [OLHAR]. Diga também o que falta no kit.
2. Escreva em ./${folder}/estilo/kit.js as peças que se repetem em todo vídeo do estilo (o mundo, o personagem, os objetos
   típicos), com funções de no máximo 40 linhas, sem console.log, tudo função de t.
3. Ajuste em ./${folder}/estilo/estilo.json só o que o olho mede (luz, sombreamento chapado, modo da etiqueta), sem quebrar o JSON.
4. Deixe o exemplo (./${folder}/estilo/exemplo) coerente com o kit.
Da referência vem a fórmula (ritmo, câmera, textos, som, jeito de desenhar); nada de quadro, logotipo ou áudio dela no estilo.

Termine com a palavra PRONTO numa linha.`;
