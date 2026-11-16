# Painel do Motor Animado

Da frase ao vídeo, numa página que abre no navegador. Roda só neste Mac (127.0.0.1) e não instala nenhum pacote.

## Abrir

```bash
node painel/servidor.mjs
```

Depois abra http://127.0.0.1:4747. Outra porta: `PORTA=5000 node painel/servidor.mjs`.

## Os cinco passos

1. **Ideia**: uma frase, o objetivo, a duração e o público.
2. **Roteiro**: o Claude pesquisa, confere os fatos, escreve `roteiro.txt` e `fontes.md` e sugere três estilos. O texto é editável.
3. **Estilo**: cartões com os estilos do motor; tema de cores, apresentador, legenda e música; prévia com os ajustes
   (nos estilos `lowpoly-drone`, `retro-32bits` e `retro-64bits`).
   **Temas**: "+ Novo tema" abre um editor de cores com um desenho do mundo que muda na hora; "Importar tema" aceita um
   tema exportado (`.json`) ou uma imagem de referência (o painel tira as cores dela); "Editar ou copiar" parte do tema
   escolhido. Os seus temas ficam em `motor-animado/estilos/_temas-meus.json` (marcados com ★) e valem em qualquer vídeo,
   também fora do painel (`{"theme": "<nome>"}`). Os temas da skill não podem ser alterados nem excluídos.
4. **Cenas**: o painel grava uma voz de teste, monta a cena, o Claude escreve o `plano.js` e o `cena.js`, o painel gera
   o mapa de cenas e o Claude revisa. Ajustes por texto ("na frase 4, mostre um relógio").
5. **Voz e render**: voz do Mac, Chatterbox (grátis) ou ElevenLabs (paga, com o custo e a sua confirmação); rascunho ou
   render final; conferência automática; o vídeo toca na página.

Cada projeto fica em `videos/<nome>/`, com o estado em `painel.json` e o registro em `painel-atividade.jsonl`.

## Os agentes de IA

Quem escreve o roteiro e a cena é um agente de linha de comando, escolhido em **Ajustes** passo a passo (dá para misturar:
o roteiro com um e as cenas com outro). Cada agente usa a conta dele.

| Agente | Instalar | Como o painel o usa |
|---|---|---|
| **Claude Code** (padrão) | `npm install -g @anthropic-ai/claude-code` | modo restrito (`--restricted`): lê e escreve arquivos na pasta do vídeo, lê a skill sem poder alterá-la e pesquisa na internet; sem terminal |
| **Codex (ChatGPT)** | `npm install -g @openai/codex` | `codex exec --json` com sandbox `workspace-write`: escreve e roda comandos dentro da pasta do vídeo, e nada fora dela |
| **Gemini CLI** | `npm install -g @google/gemini-cli` | `gemini -p --output-format stream-json`, aprovação `auto_edit`; não retoma a conversa entre os passos |

Depois de instalar, entre na sua conta pelo próprio programa (`codex`, `gemini`); o painel não guarda nenhuma senha desses agentes.
Para acrescentar outro agente, copie um bloco em `painel/agentes.mjs`: o comando, como instalar, os argumentos e como ler a saída.

## Quem faz o quê (e os limites)

- **O agente** escreve o roteiro, as fontes e os arquivos da cena; não roda as ferramentas do motor.
- **O painel** roda as ferramentas do motor numa lista fixa (voz, transcrever, alinhar, montar, mapa, sons, render,
  mixar, conferir).
- O painel só serve imagens e vídeos dos projetos: o `.env` e o `perfil.json` nunca saem pela página.
- Pedidos que mudam algo só valem se vierem da própria página do painel.
- **Usa a cota da conta do agente escolhido.** Se o limite acabar no meio, o painel mostra o aviso e guarda o que já foi escrito.
- Os outros motores (anidoodle, animação em canvas, Manim, huashu) são skills de terceiros instaladas por fora. O painel
  encontra a skill sozinho (`~/.claude/skills` e `~/.claude/plugins`), mostra o que falta, instala as dependências dentro
  desta pasta com o botão Preparar, e manda o agente produzir o vídeo com o roteiro e a voz já prontos.

## Configuração

`painel/config.json` guarda o agente e o modelo de cada passo e a voz da ElevenLabs (a chave não: ela fica só no `.env`).
Tudo isso se mexe pela tela de **Ajustes**.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `servidor.mjs` | as rotas, os arquivos e os eventos ao vivo |
| `projetos.mjs` | os projetos e o registro de atividade |
| `catalogo.mjs` | os estilos e os outros motores |
| `temas.mjs` | os temas: listar, conferir, salvar e excluir os pessoais |
| `agentes.mjs` | os agentes de IA (Claude, Codex, Gemini): como chamar e como ler a saída |
| `instrucoes.mjs` | os pedidos de cada passo |
| `ferramentas.mjs` | as ferramentas do motor e a prévia |
| `passos.mjs` | o que cada botão faz |
| `publico/` | a página (HTML, CSS e JavaScript, sem bibliotecas); `temas.js` é o editor de temas |
