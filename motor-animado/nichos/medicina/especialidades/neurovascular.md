# Neurovascular

Guia da especialidade para o roteirista e o diretor de cena. **Itens marcados [CONFERIR] aguardam a revisão do médico
responsável: antes de usar, confira numa fonte e anote em fontes.md.** A ficha `circulacao-cerebral.md` é a base de
todo vídeo desta especialidade; `vasos.md` e `coracao.md` entram quando o assunto é placa, trombo ou embolia.

## O raciocínio próprio: território, tempo e tecido
1. **Território**: os sinais dizem qual artéria (a topografia vascular).
2. **Tempo**: quando o paciente foi visto bem pela última vez decide o que ainda dá para fazer.
3. **Tecido**: o que já morreu (núcleo do infarto) e o que ainda dá para salvar (**penumbra**).

**"Tempo é cérebro"**: num AVC isquêmico de grande artéria sem tratamento, estima-se a perda de cerca de **1,9 milhão
de neurônios por minuto** (Saver, *Stroke*, 2006: "Time is brain—quantified"). Confira o número na fonte antes de usar.

## Os territórios e o que cada um tira
| Artéria | O que se vê |
|---|---|
| **Cerebral média** | fraqueza e perda de sensibilidade do lado oposto, **face e braço mais que perna**; afasia (hemisfério dominante) ou negligência (não dominante); olhar desviado **para o lado da lesão** |
| **Cerebral anterior** | fraqueza da **perna** do lado oposto, mudança de comportamento |
| **Cerebral posterior** | perda de metade do campo visual do lado oposto (hemianopsia homônima) |
| **Vértebro-basilar** | tontura, visão dupla, fala arrastada, desequilíbrio, síndromes cruzadas; oclusão da basilar pode rebaixar a consciência |
| **Perfurantes (lacunar)** | infarto pequeno e profundo: fraqueza pura, ou dormência pura, de um lado, sem afasia nem negligência |

## Os mecanismos
- **Isquêmico** (a maioria): classificação TOAST → aterosclerose de grande artéria, **cardioembolia** (a fibrilação
  atrial forma trombo no apêndice atrial esquerdo, ficha `coracao.md`), oclusão de pequena artéria, outra causa
  determinada, causa indeterminada.
- **Hemorragia intraparenquimatosa**: a hipertensão crônica enfraquece arteríolas profundas; lugares típicos: núcleos
  da base, tálamo, ponte, cerebelo.
- **Hemorragia subaracnóidea**: o aneurisma sacular rompe; eles nascem nas **bifurcações** do polígono de Willis.
  O local mais frequente: [CONFERIR antes de citar].
- **AIT**: os sintomas passam, mas o tecido não teve infarto na imagem; é aviso de AVC próximo.
- **Dissecção arterial** (carótida ou vertebral): a parede se rasga por dentro, causa importante em jovens.
- **Trombose venosa cerebral**: o trombo está nos **seios venosos**, não nas artérias.

## O que mostra o exame
- **TC sem contraste primeiro**: separa sangramento (branco) de isquemia (nas primeiras horas, quase normal).
  Achado precoce: a artéria cerebral média **hiperdensa** (o trombo aparece branco dentro dela).
- **Angio-TC**: localiza a artéria ocluída. **Perfusão**: separa núcleo de penumbra.
- **RM em difusão**: a isquemia aguda acende em minutos.
- **Escalas**: NIHSS (gravidade, 0 a 42), ASPECTS (extensão do infarto na TC, 10 pontos), mRS (incapacidade, 0 a 6).
- Convenção radiológica: o lado direito do paciente à esquerda da tela.

## Tratamento (só para público de saúde, só como está na diretriz)
Trombólise intravenosa e trombectomia mecânica têm janelas e critérios definidos nas diretrizes (AHA/ASA, ESO,
Ministério da Saúde). **Cite a diretriz e o ano; não escreva janela, remédio ou dose de memória.** Toda frase de
conduta vai para os avisos, para a revisão do médico responsável.

## O desenho
- **Trombectomia**: o cateter entra pela artéria femoral ou radial, sobe pela aorta, entra na carótida ou na vertebral
  até a artéria ocluída; o stent retriever se abre **dentro** do trombo e é puxado junto com ele, ou o trombo é
  aspirado. Ponta do cateter visível (brilho), artérias translúcidas para o caminho se ler.
- **Núcleo e penumbra**: núcleo escuro no centro, penumbra em volta em tom intermediário, que volta ao normal quando o
  fluxo volta. **O território tem de corresponder à artéria ocluída.**
- Depois do bloqueio, o vaso **não** continua vermelho: o fluxo para.
- Convenção de cor única no vídeo (artéria vermelha, veia azul, se usada).

## Erros comuns de desenho
- Território errado para a artéria (cerebral média tirando a perna).
- Lado do déficit igual ao lado da lesão.
- Polígono de Willis visto de cima (ele só aparece por baixo do cérebro).
- Trombo "flutuando" sem parede de vaso em volta.
- Penumbra do mesmo tamanho do núcleo em todo quadro: ela muda com o tempo e com o tratamento.

## Sinais de alerta (para o público leigo)
- **Rosto torto, braço fraco, fala enrolada, de repente**: SAMU 192, e anote a hora em que começou.
  No Brasil se usa a regra **SAMU** (Sorria, Abrace, Música, Urgente) [CONFERIR a fonte da campanha]; em inglês,
  BE-FAST (equilíbrio, olhos, face, braço, fala, tempo).
- Dor de cabeça súbita e muito forte: emergência.
- Sintomas que passaram sozinhos também são emergência (AIT).

## Diretrizes e fontes de partida
American Heart Association / American Stroke Association (AHA/ASA), European Stroke Organisation (ESO), Ministério da
Saúde (linha de cuidado do AVC), Sociedade Brasileira de Doenças Cerebrovasculares, Rede Brasil AVC, PubMed.

## Temas e o estilo que combina
| Tema | Fórmula | Estilo |
|---|---|---|
| AVC isquêmico × hemorrágico | diferencial | `pixel-duelo-neuro` |
| Como a trombectomia tira o coágulo | procedimento | `pixel-arteria-stent` |
| Da fibrilação atrial ao AVC | mecanismo | `pixel-anatomia-sonda`, `saga-64` |
| Plantão: código AVC | caso clínico | `med3d-decisao` |
| O polígono de Willis | anatomia | `atlas-anatomico` |
