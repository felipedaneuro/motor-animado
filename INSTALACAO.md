# Instalação, passo a passo

Para Mac com chip Apple (M1 ou mais novo). Leva de 10 a 20 minutos na primeira vez, quase tudo esperando download.

## Passo 1 · Abrir o Terminal na pasta

Abra o Terminal (Aplicativos → Utilitários → Terminal), escreva `cd ` (com o espaço), arraste a pasta
`motor-animado-painel` para a janela e aperte Enter.

## Passo 2 · Homebrew

O Homebrew instala os programas que o motor usa. Confira se já tem:

```bash
brew --version
```

Se der erro, instale pelo site oficial: https://brew.sh

## Passo 3 · Rodar o instalador

```bash
bash instalar.sh
```

Ele confere o que falta e **não instala nada sozinho sem avisar**: quando faltar algo, ele mostra o comando exato para
você copiar. O que ele faz por conta própria, dentro desta pasta:

- cria o ambiente Python em `.venv` e instala as bibliotecas do `motor-animado/requirements.txt`;
- liga a skill a esse ambiente;
- compila o leitor de imagens do macOS (usado para estudar vídeos de referência);
- cria `videos/perfil.json` a partir do exemplo, se ainda não existir;
- roda um diagnóstico e mostra o que está pronto.

Se ele pedir `brew install ...`, rode o comando, depois rode `bash instalar.sh` de novo.

### Os programas e para que servem

| Programa | Para quê |
|---|---|
| **Node 18+** | desenha os quadros do vídeo e roda o painel |
| **Python 3.11+** | voz, transcrição, som, mixagem e conferência |
| **ffmpeg-full** | junta imagem e som, e queima a legenda (a versão `-full` tem o suporte a legenda que o motor usa) |
| **yt-dlp** | baixa um vídeo de referência quando você quiser criar um estilo novo a partir dele |
| **Xcode Command Line Tools** | compila o leitor de imagens (`xcode-select --install`) |

No fim, ele pergunta se você quer baixar o **material de estudo** das referências (os vídeos originais, cerca de
380 MB). É opcional e dá para fazer depois:

```bash
bash baixar-extras.sh --listar   # o que existe e o que falta
bash baixar-extras.sh            # baixa e refaz o estudo neste computador
```

## Passo 4 · Um agente de IA

O painel não pensa sozinho: ele conversa com um agente de IA que você já tenha. Escolha pelo menos um, instale e
entre na sua conta pelo próprio programa.

| Agente | Instalar | Entrar na conta |
|---|---|---|
| **Claude Code** | `npm install -g @anthropic-ai/claude-code` | rode `claude` e siga as instruções |
| **Codex (ChatGPT)** | `npm install -g @openai/codex` | rode `codex` e entre com a conta ChatGPT |
| **Gemini CLI** | `npm install -g @google/gemini-cli` | rode `gemini` e entre com a conta Google |

Depois, no painel, vá em **Ajustes** e escolha qual agente escreve cada passo. Dá para misturar.

> **Gemini:** outros programas do Google instalados no Mac (o app Gemini, o Antigravity) deixam uma chave de API no
> ambiente do sistema, e o `gemini` a usa antes da sua conta — se ela não servir para a API pública, todo pedido falha
> com "API key not valid". Por isso o painel, por padrão, **ignora essa chave** e usa a conta com que você entrou no
> `gemini`. Em **Ajustes → Os agentes** dá para trocar para "com a chave de API do ambiente", se a sua chave for válida.

## Passo 4b (opcional) · Outros motores de animação

Além dos 9 estilos que já vêm no pacote, o painel sabe usar motores de animação feitos por outras pessoas. Eles **não
vêm na caixa**: cada um é uma skill de terceiros, com a licença do autor, e você instala a que quiser.

Instale no Claude Code (digite o comando dentro do `claude`) ou no terminal:

| Motor | Instalar |
|---|---|
| **Anidoodle** — desenho em código, timelapse e explicativos em 32 estilos | `/plugin marketplace add https://github.com/alexgreensh/anidoodle.git` e `/plugin install anidoodle@alexgreensh-anidoodle` |
| **Animação em canvas** — cada quadro desenhado em JavaScript, sem imagens | `/plugin marketplace add iart-ai/javascript-animation-skills` e `/plugin install javascript-animation-skills@javascript-animation-skills` |
| **Manim** — gráficos e fórmulas no estilo 3Blue1Brown | `npx skills add adithya-s-k/manim_skill -g -a claude-code` e, antes do botão Preparar, `brew install pkg-config cairo pango` |
| **Huashu Art Motion** — animação artística, 36 estilos | `npx skills add alchaincyf/huashu-art-motion -g -a claude-code` |

Complemento (não é motor, é um guia de princípios de animação que o agente consulta):
`npx skills add LottieFiles/motion-design-skill -g -a claude-code`

Depois de instalar, o painel acha a skill sozinho e mostra o estado dela no passo **Estilo**, no fim da página. Cada
motor ainda precisa de uma dependência (o `playwright-core`, ou o Manim, ou o programa `uv`): o botão **Preparar**
instala o que dá, dentro desta pasta, e o que for do sistema aparece com o comando para você rodar.

## Passo 5 · Abrir o painel

```bash
node painel/servidor.mjs
```

Abra **http://127.0.0.1:4747**. Para fechar, volte ao Terminal e aperte Control+C.

No Finder, `abrir-painel.command` faz isso com dois cliques. Na primeira vez o macOS pode recusar: clique com o botão
direito no arquivo, escolha **Abrir** e confirme.

## Passo 6 (opcional) · Voz da ElevenLabs

As vozes grátis (voz do Mac e Chatterbox) já funcionam sem configurar nada. Para a voz profissional:

1. Crie a chave em https://elevenlabs.io (Perfil → API Keys).
2. No painel, vá em **Ajustes → ElevenLabs**, cole a chave e clique em **Gravar chave**.
3. Clique em **Buscar minhas vozes**, escolha a voz e salve.

A chave vai direto para o arquivo `videos/.env` deste computador, com permissão de leitura só para você, e nunca mais
aparece na tela.

## Levar para outro computador

Copie a pasta inteira **sem** `.venv`, `videos/.env` e os seus projetos, se não quiser levá-los:

```bash
rsync -a --exclude .venv --exclude videos/.env --exclude "videos/*/" motor-animado-painel/ /Volumes/Pendrive/motor-animado-painel/
```

No computador novo, repita do Passo 1. O `.gitignore` já deixa de fora o que não deve ser compartilhado, caso você
prefira versionar com git.

## Conferir se está tudo certo

```bash
motor-animado/ferramentas/py diagnostico.py
```

Ele lista o que está pronto e o que falta, com o comando de cada correção.
