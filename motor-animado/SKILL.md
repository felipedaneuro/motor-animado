---
name: motor-animado
description: >
  Faz shorts verticais animados (Reels, TikTok, Shorts) em código, no Mac com chip Apple, com estilos plugáveis:
  decupa um vídeo de referência só com número (câmera, cortes, legenda, cores, som), cria um estilo novo a partir dele,
  escreve o roteiro na mesma fórmula com o assunto da pessoa, gera a voz, monta a cena em three.js (HyperFrames) ou
  realista no Blender (pele, cabelo e pelos fio a fio), sincroniza tudo com cada palavra, mixa em -14 LUFS e compara
  com a referência na mesma régua. Use sempre que pedirem um vídeo curto animado ou explicativo, "faz igual a esse
  short", "desmonta esse vídeo", "cria um estilo a partir desse link", um vídeo de saúde ou corpo humano em 3D, o
  próximo vídeo de uma série, trocar frase, voz, câmera ou personagem de um vídeo feito com esta skill, mesmo que a
  pessoa não diga "skill" nem "motor-animado".
---

# Motor animado

Um motor que faz o vídeo e estilos que dizem como ele fica. `$SK` é a pasta desta skill; as ferramentas rodam com
`$SK/ferramentas/py <ferramenta>.py` (o Python do ambiente da skill), sempre de dentro da pasta do vídeo.

| Estilo | Motor | O que é |
|---|---|---|
| `lowpoly-drone` | web | o "você" viaja por estações num mundo low-poly de dia com a paleta do tema (`{"theme": "saude"}`); câmera de drone suave, sem corte |
| `palito` | web | personagem plano em 2D num mundo 3D ensolarado; câmera que sai rápido, freia e desliza |
| `retro-32bits` | web | estilo próprio em pixel art: apresentador de cabeça grande no traço de mascote, contorno de 1 pixel, cor de 15 bits; também vai por cima de outro estilo |
| `retro-64bits` | web | estilo próprio em low-poly facetado: o mesmo mascote com detalhes pintados em pixel, luz suave; também vai por cima de outro estilo |
| `realista-corpo` | blender | close realista de cabeça, braço ou perna: pele, cabelo e pelos fio a fio, fundo limpo |
| `greg-news` | web | paródia de telejornal: apresentador de blazer numa bancada fixa, card do tema do dia no canto, cards de recorte jornalístico (print, infográfico) em tela cheia quando a fala cita fonte, risada/aplauso de platéia por amostra. Decupado de 3 trechos reais (início/meio/fim) — veja `estilos/greg-news/pesquisa.md` antes de usar, ainda tem partes [OLHAR] |
| (novos) | web ou blender | criados com `decupar.py` + `novo_estilo.py` a partir de uma referência |

Cada estilo tem `estilo.json` (os números), `receita.md` (a fórmula: **leia antes do roteiro**), `kit.js` e um exemplo.
Um estilo pode se apoiar em outro (`"extends"` no `estilo.json`): os retrô usam o `lowpoly-drone` por padrão, e um vídeo
troca a base com `{"extends": "palito"}` no `estilo-ajustes.json`.

## As regras (e por quê)
1. **Número, nunca "ficou bonito".** Toda observação tem o segundo ou o quadro: "corte em 2,4 s" a pessoa confere e você repete.
2. **Custo antes de gastar, e espere o ok.** A voz da ElevenLabs é a única etapa paga: `voz.py --custo` e o valor em US$. A chave fica no `.env`, nunca no chat.
3. **Roteiro aprovado antes da voz.** Mudar uma frase depois de gravar custa uma regravação.
4. **Fatos conferidos**, com duas fontes sérias em `fontes.md`, e as regras de cuidado do `perfil.json`. Em saúde: explica o mecanismo; não faz diagnóstico nem indica tratamento ou dose; diz quando procurar ajuda.
5. **Da referência vem a fórmula, não o conteúdo.** Nada de quadros, áudio ou frases da referência no vídeo da pessoa.
6. **Abra as imagens você mesmo** (mapa, folhas, quadros, gráficos). Quase todo defeito é de enquadramento e só aparece olhando.
7. **Começar pequeno**: 15 s de referência, um teste de 6 frases com a voz do Mac em rascunho antes do vídeo inteiro.
8. **Uma mudança por vez e cada versão com número novo** (`v1`, `v2`...). As ferramentas recusam escrever por cima.
9. **`registro.md` na pasta do vídeo**: uma linha por passo, com tempo, custo, o que deu errado e o que resolveu (as ferramentas já anotam o que fazem).
10. **Diga o que não foi verificado**: você vê quadros e números, mas não ouve o vídeo. A pessoa assiste com som antes de postar.

## Começar
Numa mensagem só, pergunte o que faltar:
1. O assunto e o estilo (um dos instalados, ou o link de uma referência para um estilo novo, e quantos segundos estudar).
2. O personagem (do `perfil.json` ou um novo) e a palavra do pedido final.
3. A voz: a da ElevenLabs do perfil, a da pessoa gravada, ou só a de teste do Mac por enquanto.

Na primeira vez: `bash $SK/instalar.sh` (com `--blender` para o motor Blender): confere o Homebrew (ffmpeg-full, yt-dlp, node), cria o
ambiente Python da skill e roda o diagnóstico. Copie `$SK/perfil.exemplo.json` para `perfil.json` na pasta dos vídeos, com os dados da pessoa.

## Um vídeo novo num estilo instalado (motor web)
Uma pasta por vídeo. Na ordem:
1. **Fontes** → `fontes.md`. **Roteiro** → `roteiro.txt` seguindo `referencias/roteiro.md` e a receita do estilo. Mostre a tabela, o custo da voz e **espere o "aprovado"**.
2. **Voz** (`referencias/voz.md`): `voz.py roteiro.txt --teste` ou `--custo` → ok → `--elevenlabs`. Depois `transcrever.py voz/voz.wav --saida voz --lingua pt` e `alinhar.py roteiro.txt voz/voz.json voz/voz.wav voz/tempos.json`.
3. **Montar**: `montar.py voz/tempos.json voz/voz.wav cena --estilo <estilo>`. Na primeira vez vem o exemplo do estilo.
4. **Escrever a cena** (`referencias/cena-web.md`): `cena/js/plano.js` (quando: tempos, etiquetas, cards, câmera, sons) e `cena/js/cena.js` (o quê: as estações). Peça variedade: cada vídeo ganha metáforas e estações novas.
5. **Mapa de cenas**: `mapa.py cena voz/tempos.json mapa`. Abra `mapa/mapa.jpg`; corrija o que estiver cortado, tampado, fora do quadro ou perto demais; repita até ficar limpo.
6. **Som**: `sons.py cena` (`referencias/som.md`).
7. **Render**: `render.py cena video-v1.mp4 --rascunho` para conferir; o final sem `--rascunho`, em segundo plano.
8. **Mixar**: `mixar.py video-v1.mp4 voz/voz.wav --efeitos som/efeitos.wav --musica som/musica.wav --saida video-v1-final.mp4`.
9. **Conferir**: `conferir.py video-v1-final.mp4` (com `--sem-cortes` nos estilos sem corte, ou `--cortes-esperados` com os da referência) e `folhas.py video-v1-final.mp4 --por-segundo 2 --saida folhas/v1`. Abra as folhas.
10. **Thumb e legenda**: `referencias/thumb-e-legenda.md`.
11. **Entregar**: diga onde está o vídeo, o que foi verificado, o que não foi, e o custo e o tempo do `registro.md`.

## Um vídeo no motor Blender (estilo realista)
Roteiro e voz iguais (passos 1 e 2; em geral `sync: beats` com `encaixar.py`). Depois, na pasta do vídeo (`referencias/motor-blender.md`):
1. `blender.py --estilo realista-corpo --enquadramento cabeca|braco|perna --still 1 --samples 16 --escala 25` e abra `stills/teste-q1.png`. O primeiro render depois de instalar leva minutos (o Metal compila uma vez). Para ver o movimento rápido: `blender.py --anim --rascunho --segundos <duração da voz>`.
2. O assunto (o que acontece no corpo) num `assunto.py` na pasta do vídeo, um passo por vez, com `--still` a cada passo.
3. Uns 12 quadros espalhados (`--still 1,30,60,...`) numa folha só, para a pessoa ver antes do render longo.
4. Um quadro na qualidade final (`--samples 96 --escala 75`): diga o tempo do vídeo inteiro e espere o ok. Depois `--anim` em segundo plano.
5. Som: os eventos numa lista `som/plano-sons.json` (`{"sounds": [{"sound", "at", "volume"}], "labels": [...]}`) e `sons.py --plano som/plano-sons.json`.
6. `finalizar.py renders/quadros --saida video-v1.mp4 --voz voz/voz.wav --efeitos som/efeitos.wav --legenda voz/tempos.json --destaques "palavra,outra"`
   (a legenda é queimada no estilo do `estilo.json` pelo `legendar.py`), e conferir (passo 9 acima).
Corpo inteiro: o MPFB é bom em closes; para corpo inteiro, use o visual de "manequim anatômico" como escolha de estilo (`estilos/realista-corpo/receita.md`).

## Um estilo novo a partir de uma referência
Siga `referencias/estilo-novo.md`: `decupar.py <link> --nome <estilo> --ate 15` → abrir as folhas e completar as partes [OLHAR] → `novo_estilo.py decupagem/<estilo> --motor web|blender` → escrever o `kit.js` → testar o exemplo → `comparar.py decupagem/<estilo> video-v1-final.mp4` até bater.

## Ajustes depois de pronto
- **Trocar frases sem pagar tudo**: `voz.py --frases` + `emendar.py` (`referencias/voz.md`), depois do passo 2 em diante.
- **Câmera rápida, objeto sumindo, personagem trocado**: edite `plano.js`/`cena.js` e refaça do mapa em diante.
- **Mudar algo do estilo só neste vídeo**: `estilo-ajustes.json` (números) ou um arquivo do kit copiado para `kit/` na pasta do vídeo.
- **Pedido vago da pessoa** ("tá faltando algo na hora do drone"): volte à referência nesse segundo, liste o que tem lá e refaça só isso.
