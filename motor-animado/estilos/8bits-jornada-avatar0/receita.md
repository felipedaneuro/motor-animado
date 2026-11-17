# Receita: 8bits-jornada-avatar0

## Origem e regra de autoria

Análise visual das folhas de história a 2 qps, de ritmo a 6 qps, dos quatro cortes e três movimentos a 30 qps e das tomadas da decupagem de 38,37 s. A transcrição alinhada está em `fala.json`. Os dados automáticos permanecem em `estilo.json` e `referencia-curva.json`. Este texto distingue observação visual, medida automática e decisão de implementação.

O estilo transfere a fórmula de narrativa e interface. Não distribui capturas, logotipos, sprites, nomes de personagens ou áudio da referência. O kit usa desenhos vetoriais próprios com bordas de pixel; o exemplo é uma ficção sobre Nara e um centro comunitário.

## 1. Fórmula narrativa

A referência tem 13 frases e 157 palavras por minuto. Abre em 0,00–3,17 s com apresentação pessoal dentro de um editor de personagem; o nome vai sendo preenchido. Em 3,30–6,02 s, a fala promete ao público o poder de decidir a jornada enquanto o cenário revela o destino.

O meio alterna três unidades: situação mostrada no mundo, objeto que muda a situação e interface que apresenta a consequência. Entre 6,58–14,26 s, rotina, carta e destino; entre 14,78–23,02 s, viagem, encontro e prédio abandonado; entre 23,26–27,52 s, missão, custo e insuficiência de recursos. Não é uma montagem de um ícone novo a cada palavra.

A virada ocorre em 26,14–27,52 s: o requisito da missão não pode ser cumprido. A janela de escolha surge por volta de 28,00 s e converte o obstáculo em participação. De 28,98–32,56 s, duas ações são apresentadas separadamente. De 32,76–36,38 s, pede-se voto A ou B e promete-se continuidade no próximo capítulo. Não há punchline visual nem vitória automática.

Para outro assunto, trocar profissão, destino, problema e alternativas. Preservar apresentação, deslocamento, obstáculo verificável e decisão com consequência. O exemplo de seis frases é uma versão curta dessa sequência, sem importar a história ou as falas da referência.

## 2. Planos e câmera

Dados do detector: cortes em 9,80, 14,77, 18,37 e 36,77 s; três movimentos rápidos, perfil predominante expo_out e freada estimada de 0,10 s; 90% do tempo parado e maior trecho parado de 7,5 s. Esses números não descrevem sozinhos todas as trocas de interface.

| Intervalo observado | Enquadramento e ação |
|---|---|
| 0,00–3,17 s | Interface frontal e imóvel. Retrato à esquerda e corpo inteiro à direita; campos de edição abaixo. |
| 3,17–6,50 s | Paisagem frontal em camadas, céu acima e construção abaixo. A revelação desce e abre o campo, especialmente 4,20–6,33 s. Não é órbita. |
| 6,58–9,77 s | Interior noturno frontal, personagem atrás da mesa, janela e chuva ao fundo. A troca semântica não entrou na lista de quatro cortes. |
| 9,80–14,73 s | Mesa vista de cima; envelope desce ao centro e vira documento. O enquadramento permanece fixo. |
| 14,77–18,33 s | Estrada em vista frontal, ônibus estacionado à esquerda, personagens no ponto. O sinal de movimento em 14,83 s inclui o clarão da transição; não comprova travelling prolongado. |
| 18,37–23,33 s | Vila em vista elevada de jogo, caminhos e entrada do prédio. Personagens pequenos; diálogo em janela inferior e indicador de missão sobre a porta. |
| 23,33–27,87 s | Janela de missão cobre e escurece a vila. Miniaturas de estado atual e objetivo, requisitos e botão indisponível. |
| 27,87–36,73 s | Janela de escolha cobre a anterior. Alternativas entram em sequência; marcação verde muda entre elas. |
| 36,77–38,37 s | Tela final escura e fixa, duração aproximada de 1,60 s. Usar encerramento próprio, sem a marca da referência. |

A curva medida está preservada como diagnóstico. A câmera do exemplo é frontal e parada; a abertura é uma transformação 2D da paisagem. Não aplicar órbitas automáticas por frase nem tratar mudanças de telas como movimento tridimensional.

## 3. Desenho, personagem e luz

Pixel art 2D de RPG, com silhuetas em degraus, contorno escuro, cores chapadas e dois a quatro tons por material. Não é voxel, low-poly iluminado em tempo real ou personagem 3D macio. O sprite de corpo inteiro é pequeno no mapa; a cabeça representa aproximadamente um terço a metade de sua altura, conforme a pose. O retrato de diálogo é uma representação separada, maior, com ombros visíveis. Olhos e boca são poucos pixels; piscar e falar usam poses discretas.

Na abertura, 0,00–3,17 s, comparar retrato e sprite lado a lado. No interior, 6,67–9,67 s, o busto domina a mesa. Na vila, 18,37–23,33 s, o corpo inteiro permanece proporcional à porta e ao caminho. O kit mantém um avatar original de cabelo escuro, pele castanha e roupa verde-petróleo; pele, cabelo e roupa são parâmetros. Não usar o boneco genérico tridimensional do esqueleto.

A luz já está pintada: dia azul com manchas claras no alto à esquerda, sombras verdes sob árvores e telhados; interior frio com janela escura; mesa em castanho quente. Nenhum material tem brilho especular contínuo. `stage.flat_shading=true`, sombras projetadas desligadas e luz neutra sem sol no palco evitam acabamento 3D incompatível. Os SVGs fornecem a iluminação desenhada.

Paleta medida: `#e1c7a1` pergaminho, `#2b3723` mata escura, `#8bb4d6` céu distante, `#b09972` chão, `#915d2d` madeira, `#335054` sombra fria, `#25539d` e `#4981c5` azuis. Céu em faixas, montanhas recortadas, nuvens em blocos, árvores por planos e grama pontilhada. Cada assunto muda o cenário; a identidade vem do traço e da interface.

## 4. Entradas, duração e sincronia

Os intervalos abaixo são limites visíveis nas folhas. Em folhas de 6 qps, a localização tem resolução de cerca de cinco quadros. Não atribuir precisão de um quadro a esses eventos. Os cortes e movimentos possuem folhas a 30 qps.

| Ação | Medida visual | Relação com a fala alinhada |
|---|---|---|
| Nome digitado | 1,33–2,17 s, cerca de 25 quadros, amostragem de 6 qps | Acompanha a apresentação do nome, 1,62–2,16 s. Letras entram sem escala elástica. |
| Editor para paisagem | 3,17–3,50 s, cerca de 10 quadros | Mudança de promessa em 3,30 s. O destino continua sendo revelado durante a frase. |
| Abertura da paisagem | 4,20–6,33 s, cerca de 64 quadros | Começa durante “decidir”, 3,98–4,42 s; não reduzir toda a ação aos quatro quadros do pico detectado. |
| Interior para mesa | 9,80–9,97 s, cerca de cinco quadros | Durante “até”, 9,72–10,08 s. |
| Envelope desce | Aproximadamente 9,90–10,63 s, 22 quadros | Chega ao centro antes de “carta”, que começa em 10,64 s. Antecipação narrativa, sem pop de escala. |
| Envelope abre | 10,90–11,13 s, aproximadamente sete quadros | Começa no final de “carta”, 10,64–11,02 s. |
| Documento aparece | 11,60–11,87 s, aproximadamente oito quadros | Durante a introdução do destino, “posto” em 11,64 s. Entrada por opacidade. |
| Corte para estrada | 14,77–14,87 s, aproximadamente três quadros | Coincide com início da frase de viagem em 14,78 s. |
| Estrada para vila | 18,37–18,50 s, aproximadamente quatro quadros | Antecede a nova fala em 18,42 s em cerca de 0,05 s. |
| Missão | Visível entre 23,33–23,50 s; limite de cinco quadros na folha de ritmo | Surge na frase que começa em 23,26 s; custo falado depois, em 24,70–26,00 s. |
| Missão para escolha | 27,87–28,00 s, aproximadamente quatro quadros | Durante o pedido de ajuda, 27,52–28,68 s. |
| Alternativa A | 29,17–29,33 s, cerca de cinco quadros; resolução de 6 qps | Perto de “começo”, 29,22 s; antes do objeto da primeira ação, 30,26 s. |
| Alternativa B | 31,17–31,33 s, cerca de cinco quadros; resolução de 6 qps | Durante “atendo”, 31,02–31,40 s. |
| Seleção verde | A visível por volta de 33,33 s; B em 35,17–35,33 s; A em 35,83–36,00 s | Primeira marcação acompanha o voto A, 33,30 s. As seguintes mantêm a decisão aberta. |
| Tela final | Corte em 36,77 s, marca presente no primeiro quadro novo | Depois de “episódio”, que termina em 36,38 s. Manter apenas a função de encerramento. |

Na implementação, `at` é sempre um tempo da cena. Envelope desce em 0,75 s, abre em 0,24 s e revela o documento em 0,27 s. As alternativas usam opacidade em cinco quadros a 30 qps; o intervalo de apresentação vem do roteiro, não de um relógio do navegador. A seleção em ciclo é um convite à votação, nunca um voto já computado.

## 5. Textos e organização

Manter os números medidos de legenda: seis palavras, topo em 1708 px, 35 px, Montserrat, texto `#dff1b8`, contorno `#4b270a` de 8 px e destaque `#d7b382`. O OCR automático mistura botões do editor com legendas: “Sortear” e “Pronto” são controles de 0,00–3,17 s. Portanto, esses exemplos do OCR não provam que todas as legendas da referência ocupam a mesma posição.

A interface usa pergaminho creme com moldura dupla castanha e contorno quase preto. Entre 0,00–3,17 s, retrato e corpo ficam na metade superior, campos e botões abaixo. De 6,67–9,67 s há texto narrativo na região superior do interior. Na vila, 18,37–23,33 s, retrato e diálogo ficam em caixa baixa; seta amarela fica sobre a entrada, sem cobrir personagem. De 23,33–27,87 s, missão ao centro com requisitos em verde ou vermelho e botão dessaturado. De 28,00–36,73 s, duas alternativas verticais, letras grandes e seleção verde. A tela de encerramento é escura.

No kit, reservar y=1400–1650 para diálogo e deixar a região das legendas a partir de y=1708 livre de janelas. Textos de UI usam monospace comum com acentos, tamanho base de 34–42 px em 1080×1920; títulos, de 38 px; letras A e B, de 52 px. Tipografia é uma adaptação legível, não uma identificação da fonte original. Nada de balão gigante branco, etiqueta amarela flutuante ou título duplicado pelo overlay. As listas LABELS e CARDS do exemplo ficam vazias porque o kit já desenha a UI.

## 6. Som

Medição automática preservada: referência em -16,2 LUFS e pico de -1,1 dB; destino do estilo -14 LUFS; música detectada sob a fala, com pausas 13,1 dB abaixo da voz. Foram detectados 35 ataques, dois junto a cortes e três junto a movimentos; 67% dos movimentos têm ataque associado. Não converter isso em 35 sons obrigatórios.

Ataques próximos a mudanças visuais: 10,03 s, chegada do envelope; 11,55 e 11,73 s, passagem para documento; 14,80 s, estrada; 18,50 s, vila; 23,44 s, janela de missão; 27,92 s, escolha. A associação é temporal. Só pelas folhas não se identifica se cada ataque é sino, impacto ou whoosh, nem o caráter musical. Não houve escuta nesta etapa e esses timbres permanecem sem confirmação.

O exemplo declara `snip`, `lock` e `shimmer` como opções autorais discretas. Não são transcrições do áudio original. Manter a trilha e os parâmetros medidos já existentes no JSON; nenhum áudio de origem foi copiado ou gerado.

## 7. Kit, exemplo e limites

API pública de `kit.js`:

| Função | Peça reutilizável |
|---|---|
| `avatarSprite(t, options)` e `portrait(t, options)` | Corpo inteiro e busto originais; cores, posição, escala, fala e caminhada. |
| `building(options)` | Edifício genérico fechado ou reparado, sem marca ou símbolo da referência. |
| `landscapeWorld(t, options)` | Céu em faixas, nuvens, montanhas, árvores e revelação frontal. |
| `villageWorld(t, options)` | Mapa elevado, caminho, grama, banco, prédio, avatar, morador e indicador de missão. |
| `journeyHud(t, options)` | Capítulo, recursos e três ferramentas em blocos, fora da faixa de legenda. |
| `characterSheet(t, options)` | Editor ilustrado com retrato, corpo inteiro e nome digitado. |
| `officeRoom(t, options)` | Interior noturno com mesa, janela e chuva determinística. |
| `travelStop(t, options)` | Estrada e ônibus estacionado, com posição de chegada do avatar. |
| `letterScene(t, options)` | Madeira, envelope descendente, aba e documento. |
| `parchmentPanel(...)` e `dialoguePanel(t, options)` | Molduras e texto digitado com retrato. |
| `questWindow(t, options)` | Comparação atual/objetivo, recursos, progresso e botão condicionado. |
| `choiceWindow(t, options)` | Alternativas A/B, entrada separada e seleção aberta. |
| `endCard(t, options)` | Encerramento original sem logotipo. |
| `createJourney(root, style, defaults)` | Camada SVG no root; devolve `draw(t, state)`, com modo e âncoras temporais. |

O sistema é SVG próprio em `web`, sem texturas externas, fontes baixadas, imagem da referência ou personagens 3D. O exemplo usa `createStage`, câmera frontal e `createOverlay`; o SVG fica atrás das legendas. `plano.js` ancora trocas em `phraseStart` e `phraseEnd` do novo roteiro. Não reutiliza os segundos da referência como se fossem o alinhamento da nova voz.

`state.mode` aceita `character`, `landscape`, `office`, `letter`, `travel`, `village`, `quest`, `choice` e `end`. Os campos `at` e `cutAt` são âncoras absolutas; `reveal` vai de zero a um. Na escolha, `firstAt` e `secondAt` controlam a entrada de cada ação. O exemplo usa `wordStart(4, "preparar")` e `wordStart(4, "conversar")`, ambas presentes na quinta frase. `selected: "cycle"` alterna o convite A/B, sem registrar uma escolha real. O exemplo precisa ter a voz e o alinhamento gerados pelo painel a partir do seu próprio roteiro antes da montagem.

O que ainda falta para uma réplica completa do repertório: sprites próprios de moradores com direções laterais e de costas, editor funcional com todas as combinações de cabelo e roupa, inventário amplo, interiores adicionais e efeitos sonoros confirmados por escuta. O kit fornece a composição recorrente e as peças da demonstração; esses itens são extensões futuras, não dependências ocultas do exemplo.

Revisão reservada ao painel: conferir amostragem de pixels e fonte no tamanho final, margens, legenda livre, avatar com pés no caminho, documento totalmente visível, A/B aparecendo junto à nova fala e audibilidade. Não executar motor, gerar voz, mapa ou render nesta etapa. A avaliação visual do resultado montado ainda não foi realizada.
