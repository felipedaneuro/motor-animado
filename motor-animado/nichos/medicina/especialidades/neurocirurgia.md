# Neurocirurgia

Guia da especialidade para o roteirista e o diretor de cena. **Itens marcados [CONFERIR] aguardam a revisão do médico
responsável: antes de usar, confira numa fonte e anote em fontes.md.** Vídeo de procedimento segue
`raciocinio-cirurgico.md`; vídeo de quadro clínico segue `raciocinio-clinico.md`.

## O raciocínio próprio: o crânio é uma caixa fechada
**Doutrina de Monro-Kellie**: dentro do crânio rígido o volume é a soma de cérebro, sangue e líquor. Se um deles
cresce (hematoma, tumor, edema, hidrocefalia), os outros cedem espaço até a reserva acabar; daí em diante qualquer
mililitro a mais faz a **pressão intracraniana** subir rápido.
- **Pressão de perfusão cerebral = pressão arterial média − pressão intracraniana.** Pressão intracraniana alta rouba
  sangue do cérebro.
- **Herniações** (o cérebro empurrado para onde há saída):
  - **subfalcina**: o giro do cíngulo passa por baixo da foice do cérebro;
  - **transtentorial (uncal)**: o úncus desce pela incisura da tenda e comprime o **nervo oculomotor** → pupila
    dilatada do mesmo lado;
  - **tonsilar**: as tonsilas do cerebelo descem pelo forame magno e comprimem o bulbo → risco de parada respiratória.
- **Tríade de Cushing** (sinal tardio de hipertensão intracraniana): pressão arterial alta, frequência cardíaca baixa,
  respiração irregular.

## Anatomia que precisa estar exata

### As camadas, de fora para dentro (é a ordem de todo corte e de toda craniotomia)
1. **Couro cabeludo**: pele, tecido conjuntivo denso, gálea aponeurótica, tecido areolar frouxo, pericrânio.
2. **Osso**: tábua externa, díploe, tábua interna.
3. **Dura-máter**: grossa, presa ao osso, **firmemente aderida nas suturas**; forma a **foice do cérebro** (entre os
   hemisférios) e a **tenda do cerebelo** (entre cérebro e cerebelo).
4. **Espaço subdural**: virtual, atravessado pelas **veias-ponte**.
5. **Aracnoide**.
6. **Espaço subaracnóideo**: líquor e as grandes artérias.
7. **Pia-máter**: colada ao córtex, acompanha cada sulco.

### Os três sangramentos que todo vídeo confunde
| | Epidural | Subdural | Subaracnóideo |
|---|---|---|---|
| Onde | entre osso e dura | entre dura e aracnoide | no espaço do líquor |
| Fonte típica | artéria meníngea média (fratura temporal) | veias-ponte | aneurisma roto (ou trauma) |
| Forma na TC | **lente biconvexa**, não cruza sutura | **crescente**, cruza sutura, não cruza a foice | sangue nas cisternas e nos sulcos |
| Ritmo | intervalo lúcido e piora rápida | piora lenta (idoso, anticoagulado) ou aguda no trauma grave | cefaleia súbita e intensa |

### O líquor
Produzido sobretudo pelos **plexos coroides**. Caminho: ventrículos laterais → forames interventriculares (de Monro) →
terceiro ventrículo → aqueduto cerebral (de Sylvius) → quarto ventrículo → aberturas laterais (de Luschka) e mediana
(de Magendie) → espaço subaracnóideo → reabsorção nas **granulações aracnóideas**, para os seios venosos.
Volume total e produção diária: [CONFERIR antes de citar número].
- **Hidrocefalia obstrutiva**: o caminho entope (o aqueduto é o ponto estreito clássico); **comunicante**: a
  reabsorção falha.
- **Derivação ventrículo-peritoneal**: cateter no ventrículo, válvula sob a pele, tubo até o abdome.

### A coluna
- **Disco**: núcleo pulposo no centro, ânulo fibroso em volta. A hérnia mais comum sai **posterolateral**.
- **Lombar**: a hérnia posterolateral comprime a raiz que desce para sair **abaixo**: hérnia L4-L5 → raiz **L5**.
- **Cervical**: a raiz sai **acima** da vértebra de mesmo número: hérnia C5-C6 → raiz **C6**.
- A medula termina por volta de **L1-L2** (cone medular); abaixo está a **cauda equina** (ficha `medula-espinal.md`).

## Tempos cirúrgicos de referência (para público de saúde)
- **Craniotomia**: posição e fixação da cabeça (cabeçote de três pinos) → incisão e retalho de pele → trepanações →
  retalho ósseo → abertura da dura → tempo principal → hemostasia → fechamento da dura → reposição do osso →
  fechamento por planos.
- **Microdiscectomia lombar**: decúbito ventral → incisão mediana → afastamento da musculatura paravertebral →
  abertura do ligamento amarelo (e laminotomia quando preciso) → afastamento cuidadoso da raiz → retirada do
  fragmento → revisão da raiz livre → fechamento.

## Peças prontas do motor
Tomografia, angiotomografia, angiografia e cérebro de perfil já existem em pixel (`exames.js` e `cerebro-perfil.js`,
ver `referencias/cena-web.md`). Use-as em vez de desenhar à mão: o lado, a convenção radiológica e o ponto da
oclusão já estão certos e testados.

## Erros comuns de desenho
- Camadas fora de ordem ou dura-máter solta do osso.
- Hematoma epidural em crescente ou subdural em lente.
- Foice e tenda ausentes num corte em que deveriam aparecer.
- Hérnia de disco comprimindo a raiz errada.
- Sangue realista, campo cirúrgico real, crânio aberto com detalhe gráfico: **nunca**. Corte esquemático sempre.

## Sinais de alerta (para o público leigo)
- Depois de pancada na cabeça: sonolência que aumenta, vômitos repetidos, uma pupila maior que a outra, confusão,
  fraqueza de um lado: emergência, SAMU 192. Atenção ao "melhorou e depois piorou".
- **Dor nas costas com perda de controle da urina ou das fezes, ou dormência na região do assento**: emergência
  (síndrome da cauda equina).
- Quem tem válvula (derivação) e passa a ter dor de cabeça forte, vômitos e sonolência: atendimento imediato.

## Diretrizes e fontes de partida
Sociedade Brasileira de Neurocirurgia (SBN), Brain Trauma Foundation (TCE grave), AANS/CNS (Congress of Neurological
Surgeons), North American Spine Society (NASS), PubMed.

## Temas e o estilo que combina
| Tema | Fórmula | Estilo |
|---|---|---|
| Hematoma epidural × subdural | diferencial | `pixel-duelo-neuro` |
| As camadas da cabeça, da pele ao córtex | anatomia | `pixel-anatomia-camadas`, `atlas-anatomico` |
| Por que a pupila dilata (herniação) | mecanismo | `pixel-anatomia-sonda` |
| Como é feita uma craniotomia | procedimento | `pixel-anatomia-camadas` |
| Hérnia de disco: qual raiz sofre | mecanismo | `atlas-anatomico` |
| Plantão: TCE com intervalo lúcido | caso clínico | `med3d-decisao`, `med3d-primeira-pessoa` |
