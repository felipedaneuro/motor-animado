# Versão

**Motor Animado · Painel 1.1.0** — 15 de novembro de 2026.

| Parte | Versão |
|---|---|
| painel | 1.1.0 (5 passos, temas, agentes de IA, ElevenLabs, outros motores com aba de estilos) |
| motor-animado (a skill) | ver `motor-animado/VERSAO.md` |

## O que esta versão faz

- Da frase ao vídeo vertical, em cinco passos, numa página local.
- 23 estilos prontos (low-poly, pixel art, duelo de dois painéis, corte anatômico, saga em capítulos, holograma, palito, telejornal, cena 3D clínica, realista no Blender).
- Temas de cor que você cria, importa (de arquivo ou de uma imagem) e exporta.
- Agentes de IA à escolha, por passo: Claude Code, Codex (ChatGPT) e Gemini CLI.
- Vozes: do Mac (teste), Chatterbox (grátis, gerada aqui) e ElevenLabs (paga, com o custo na tela).
- Outros motores de animação, quando instalados: anidoodle, animação em canvas, Manim e Huashu.
- Conferência automática de cada vídeo: cortes, quadros pretos, risco de pisca e volume em −14 LUFS.

## 1.2.0 — Edição Médica (em preparação)

Em desenvolvimento no branch `feature/edicao-medica`, ainda sem merge na `main` (16 de novembro de 2026).

- **Público-alvo obrigatório na tela Ideia**: "Leigo" ou "Estudantes e profissionais de saúde". O público muda a
  linguagem, a profundidade e as regras do roteiro: para leigo, só o mecanismo, sem conduta nem dose, fechando com o
  sinal de alerta e o SAMU 192; para o público de saúde, terminologia técnica, fisiopatologia completa, o raciocínio
  (diferenciais e o exame que separa) e conduta ou dose só como estão na diretriz citada. A regra do público vale sobre
  as regras de cuidado do `perfil.json`. O campo de texto antigo virou "Detalhe do público (opcional)".
- **Especialidade** na tela Ideia: Geral, Neurologia, Neurocirurgia, Neurovascular, Cardiologia e Ortopedia. Cada
  uma tem um guia em `motor-animado/nichos/medicina/especialidades/` (anatomia que precisa estar exata, fisiologia,
  convenção de imagem, erros comuns de desenho, sinais de alerta, diretrizes e o estilo que combina com cada tema).
  Os itens marcados **[CONFERIR]** aguardam a revisão do médico responsável.
- **Raciocínio clínico e cirúrgico**: o roteiro segue as etapas do raciocínio (queixa, síndrome, topografia,
  mecanismo, diferencial, exame, conduta, alerta; ou indicação, anatomia, acesso, tempos, gesto, complicações,
  depois) e cada etapa vira um tipo de cena fixo. O `painel-roteiro.json` ganha o campo `raciocinio`.
- **Frases curtas e gancho**: no máximo 10 palavras por frase para leigo e 12 para o público de saúde, e a primeira
  frase prende a atenção. Depois de cada roteiro, o painel conta as palavras sem IA e põe nos avisos as frases longas.
- **Nenhuma etiqueta de público na tela** ("conteúdo para profissionais", "para leigos", "para estudantes").
- **Peças de exame e cérebro em pixel** no motor: tomografia axial (hematoma epidural e subdural, hemorragia
  intraparenquimatosa, HSA, isquemia por território, ACM hiperdensa), angiotomografia com a oclusão marcada,
  angiografia antes e depois e cérebro de perfil com lobos e territórios, todos na convenção radiológica. Vitrine para
  conferir em `motor-animado/motores/web/vitrine-exames.html`.
- **Fonte pixel nova**: os 10 estilos que usavam a Press Start 2P (que desenhava Í e É do tamanho de minúscula)
  passam a usar a **Jersey 10**, com a **VT323** de reserva, as duas guardadas no pacote.
- **Testes**: `node --test painel/nicho.test.mjs testes/exames.test.mjs testes/fontes.test.mjs` (26 testes).
- Vídeo de teste: trombectomia mecânica no AVC, para profissionais de saúde, no estilo `pixel-arteria-stent`.

## 1.1.0

- **14 estilos novos**, decupados de catorze vídeos de referência (10 s do começo, 10 s do meio, 5 s do fim):
  `pixel-duelo-cardio`, `pixel-duelo-hormonio`, `pixel-duelo-neuro` (dois painéis lado a lado, a fórmula do canal),
  `pixel-anatomia-camadas`, `pixel-anatomia-sonda`, `pixel-arteria-stent`, `pixel-dungeon-fisiologia`,
  `pixel-menu-rpg`, `pixel-kinetic-apresentador`, `kinetic-creme`, `vetor-plano-medico`,
  `med3d-primeira-pessoa`, `med3d-decisao`, `med3d-hud-rpg`.
- **O Huashu Art Motion abre uma aba de estilos**: 36 fichas de desenho prontas (mais 17 em pesquisa), em português,
  com a nota de qualidade que a própria skill publica. O estilo escolhido vai no pedido ao motor.
- **Acervo de anatomia** em `motor-animado/referencias/anatomia/`: fichas de coração, vasos e circulação cerebral com
  medida, posição, cor, o que não pode faltar e os erros comuns de desenho, mais o mapa das fontes. O painel manda o
  agente abrir a ficha antes de desenhar qualquer parte do corpo.
- **Estilo `atlas-anatomico`**, decupado de quatro reels do @kenhub_portugues: ilustração de atlas sobre fundo
  azul-petróleo, com **etiquetas presas por linha de chamada** ao ponto exato da estrutura, que seguem o modelo
  quando ele gira. São 23 estilos no total. A receita dele vem com as partes de olhar já completadas.
- **Ficha de medula espinal** no acervo de anatomia, e três correções que vieram desses reels: artéria e veia se
  definem pela direção do fluxo e não pelo oxigênio; na medula a substância cinzenta fica no centro; a mitral é a
  única valva com duas cúspides.
- **O cenário dos estilos retrô virou pixel art.** Saiu o mundo low-poly (morros de icosaedro, pinheiros de cone):
  o fundo agora é desenhado pixel a pixel em cinco camadas — céu em faixas com pontilhado e sol, serra desbotada com
  neve, linha de mata (ou casario, nos temas de cidade), moitas e pedras dos dois lados da trilha, e o chão de grama
  ladrilhada com a trilha de terra. As nuvens andam e as moitas balançam em dois quadros, como num sprite de jogo. Em
  **Estilo → Personalizar** dá para escolher campo ou cidade; as cores continuam vindo do tema. Quem quiser o mundo
  low-poly antigo tem `lowpolyWorld` no kit.
- **O box de emergência dos estilos `med3d` foi redesenhado**, em dois visuais à escolha: **palito** (traço liso,
  cores saturadas) e **pixel** (pixel art chapada, como o retro-64bits). Vale para a cena inteira — sala, maca,
  paciente, médico, soro e monitor com ECG —, não só para o personagem. Saiu o boneco de blocos. Em
  **Estilo → Personalizar** entra o campo "Visual da cena".
- **Capa para cada um dos 23 estilos** na tela de escolha: um quadro do exemplo do próprio estilo, escolhido
  olhando a folha de contato. Antes só 7 tinham, e as dos retrô ainda mostravam o mundo low-poly que saiu.
- **O apresentador do `greg-news` virou o mesmo busto em pixel dos estilos retrô**, atrás da bancada. Na v1 ele era
  um boneco plano de corpo inteiro que ficava **na frente** da bancada e tapava ela inteira; o enquadramento também
  foi refeito (a legenda caía na testa). Em **Estilo → Personalizar** dá para trocar pele, cabelo, corte e roupa.
- **Objetos em pixel** (`pixelSprite`), com sete desenhos prontos (água, sono, passos, coração, estrela, aviso, gota)
  em grade de 16 por 16, para a cena inteira ficar na mesma linguagem do fundo.
- **O apresentador dos estilos retrô virou um busto em pixel** — o retrato fixo das caixas de diálogo antigas, com
  moldura e halo, que pisca e mexe a boca junto com a fala. Saiu o boneco 3D. Em **Estilo → Personalizar** dá para
  trocar pele, cabelo, corte, roupa e bandana. O mesmo busto entrou no `pixel-kinetic-apresentador`.
- **Os kits dos 15 estilos novos estão escritos**: o texto que se escreve letra a letra (`motor/escrita.js`, usado em
  quatro estilos), a alternância par↔close do duelo, o corte de vaso com placa e rótulo amarelo, a interface clínica
  dos med3d (faixa de estado, sinais vitais, cartão de decisão com contagem), a janela de menu dourada, o fundo creme
  com skyline, a moldura de filme com barra XP e a silhueta vetorial com anéis de dose.
- As receitas dos 15 estilos novos vêm **completas**, escritas olhando as folhas de cada decupagem quadro
  a quadro, e cada uma diz o que ainda falta no `kit.js` daquele estilo.
- Corrigido: criar um estilo a partir de um vídeo sem narração quebrava o `novo_estilo.py`.

## 1.0.1

- Erro de agente em uma frase em português, no lugar do despejo de JSON na tela.
- O Gemini entra com a conta Google por padrão, ignorando a chave de API que outros programas do Google
  deixam no ambiente do Mac (trocável em Ajustes → Os agentes).

## Limites conhecidos

- Só Mac com chip Apple.
- A prévia com ajustes existe nos estilos `lowpoly-drone`, `retro-32bits` e `retro-64bits`.
- O estilo `greg-news` ainda tem partes marcadas como `[OLHAR]` na receita.
- O motor Blender (`realista-corpo`) precisa do Blender instalado e não foi testado de ponta a ponta.
- Edição Médica (1.2.0): os itens [CONFERIR] dos guias de especialidade ainda não foram revisados por um médico, e
  as capas dos 10 estilos que trocaram de fonte ainda mostram a Press Start 2P.
