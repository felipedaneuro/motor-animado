# Cardiologia

Guia da especialidade para o roteirista e o diretor de cena. **Itens marcados [CONFERIR] aguardam a revisão do médico
responsável: antes de usar, confira numa fonte e anote em fontes.md.** As fichas `coracao.md` e `vasos.md` são a base
do desenho.

## O raciocínio próprio: bomba, cano e eletricidade
Quase todo problema do coração cabe numa destas três perguntas, e o vídeo fica claro quando diz qual delas é:
1. **A bomba** (o músculo): contrai e relaxa direito? (insuficiência cardíaca, miocardiopatia)
2. **Os canos e as portas** (coronárias, aorta, valvas): o sangue passa por onde deve? (infarto, estenose, insuficiência valvar)
3. **A eletricidade** (o sistema de condução): o ritmo nasce e se espalha certo? (fibrilação atrial, bloqueios, fibrilação ventricular)

## Anatomia que precisa estar exata
- **Posição**: no mediastino médio, com o **ápice para baixo, para a esquerda e para a frente**. A face anterior é
  formada sobretudo pelo **ventrículo direito**; o **ventrículo esquerdo** forma o ápice e a margem esquerda; o **átrio
  esquerdo** é a câmara mais posterior (junto ao esôfago).
- **Paredes**: a do ventrículo esquerdo é bem mais grossa que a do direito (trabalha contra a pressão da aorta).
- **Valvas**: tricúspide (3 cúspides) e mitral (**2**) entre átrios e ventrículos; pulmonar e aórtica (3 semilunares
  cada) na saída. As atrioventriculares têm cordas tendíneas e músculos papilares; as semilunares não.
- **Coronárias**: correm na **superfície** (epicárdicas), nascem logo acima da valva aórtica.
  - Tronco da coronária esquerda → **descendente anterior** (parede anterior, septo anterior, ápice) e **circunflexa**
    (parede lateral).
  - **Coronária direita** → ventrículo direito, parede inferior; na maioria das pessoas dá a descendente posterior
    (dominância direita) e irriga os nós sinusal e atrioventricular [CONFERIR as proporções antes de citar número].
  - As coronárias do ventrículo esquerdo se enchem sobretudo na **diástole**.
- **Condução**: nó sinoatrial (no átrio direito, junto à desembocadura da veia cava superior) → átrios → **nó
  atrioventricular** (o atraso que deixa o ventrículo encher) → feixe de His → ramos direito e esquerdo → fibras de
  Purkinje.

## Fisiologia que sustenta os vídeos
- **Ciclo cardíaco**: sístole = contração isovolumétrica (todas as valvas fechadas) → ejeção (semilunares abertas);
  diástole = relaxamento isovolumétrico → enchimento rápido → contração atrial.
- **Bulhas**: B1 = fechamento de mitral e tricúspide (começo da sístole); B2 = fechamento de aórtica e pulmonar
  (começo da diástole).
- **ECG**: onda P = despolarização dos átrios; intervalo PR = o atraso no nó AV; QRS = despolarização dos ventrículos;
  onda T = repolarização dos ventrículos (a dos átrios fica escondida no QRS). **A contração vem logo depois da
  despolarização**: no desenho, o QRS antecede o aperto do ventrículo.
- **Derivações e paredes**: D2, D3 e aVF = parede inferior (em geral coronária direita); V1 a V4 = anterior e septal
  (descendente anterior); D1, aVL, V5 e V6 = lateral (circunflexa).
- **Débito cardíaco = frequência × volume sistólico.** Lei de Frank-Starling: dentro de um limite, quanto mais o
  ventrículo enche, mais forte ele contrai.
- **Pressões de referência** (mmHg, aproximadas): ventrículo esquerdo ~120 na sístole; aorta ~120/80; ventrículo
  direito ~25 na sístole; artéria pulmonar ~25/10 [CONFERIR antes de mostrar na tela].

## Fisiopatologia dos temas mais pedidos
- **Infarto**: a placa instável se rompe → plaquetas e trombo → a coronária fecha → a necrose avança do
  **subendocárdio para o epicárdio** com o tempo ("tempo é músculo"). O músculo fora do território segue contraindo.
- **Parada cardíaca** (fibrilação ventricular): os ventrículos tremem sem contrair, a valva aórtica não abre, não há
  pulso. Infarto e parada são coisas diferentes, embora um possa levar à outra.
- **Fibrilação atrial**: os átrios tremem, a contração atrial some, o sangue para no **apêndice atrial esquerdo** e
  pode formar trombo → embolia (ponte com o guia neurovascular).
- **Insuficiência cardíaca**: com fração de ejeção reduzida (a bomba não esvazia) ou preservada (o ventrículo rígido
  não enche).
- **Estenose aórtica**: a valva calcificada abre pouco; o ventrículo esquerdo engrossa para vencer a resistência.

## Erros comuns de desenho
- Coração em forma de "♥" ou com o ápice para a direita.
- Aorta saindo do ventrículo direito; pulmonar saindo do esquerdo.
- Coronárias desenhadas por dentro da cavidade (são da superfície).
- Valva abrindo contra o fluxo, ou sangue voltando por valva fechada.
- Sangue pobre em oxigênio no lado esquerdo (fora a convenção de cor escolhida, que vale para o vídeo inteiro).
- Traçado de ECG sem linha de base, ou fora de sincronia com a contração.
- Território do infarto que não corresponde à coronária ocluída.

## Sinais de alerta (para o público leigo)
- Dor ou aperto no peito que dura mais de alguns minutos, que pode ir para o braço, o pescoço ou as costas, com suor
  frio, falta de ar ou enjoo: SAMU 192.
- Pessoa que cai e não responde, sem respirar normalmente: SAMU 192, compressões no centro do peito e o desfibrilador
  (DEA) assim que chegar.
- Desmaio ao fazer esforço, falta de ar que piora deitado, inchaço que aumenta nas pernas: procurar atendimento.

## Diretrizes e fontes de partida
Sociedade Brasileira de Cardiologia (SBC), American Heart Association / American College of Cardiology (AHA/ACC),
European Society of Cardiology (ESC), ILCOR e AHA para reanimação, PubMed.

## Temas e o estilo que combina
| Tema | Fórmula | Estilo |
|---|---|---|
| Infarto × parada cardíaca | diferencial | `pixel-duelo-cardio` |
| Como o stent abre a coronária | procedimento | `pixel-arteria-stent` |
| O caminho do impulso e as ondas do ECG | mecanismo | `pixel-anatomia-sonda`, `atlas-anatomico` |
| Plantão: dor torácica | caso clínico | `med3d-decisao` |
| As quatro valvas e as bulhas | anatomia | `atlas-anatomico` |
