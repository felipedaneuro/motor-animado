# Raciocínio clínico: o esqueleto do roteiro

Um vídeo de saúde bom não lista fatos: ele **pensa como médico em voz alta**. O roteiro segue as etapas abaixo
(não todas em todo vídeo: escolha as que o tema pede, na ordem) e cada etapa vira um tipo de cena fixo.

## As etapas

| # | Etapa | A pergunta | O que entra no roteiro |
|---|---|---|---|
| 1 | **Queixa** | o que a pessoa sente ou mostra? | a cena de abertura: o sintoma concreto, em quem, há quanto tempo |
| 2 | **Dados que importam** | o que na história e no exame muda tudo? | os achados que separam, não a lista completa |
| 3 | **Síndrome** | que conjunto é esse? | o nome do quadro (ex.: síndrome piramidal, síndrome coronariana aguda) |
| 4 | **Topografia** | onde está a lesão? | a estrutura anatômica exata e por que os sinais apontam para ela |
| 5 | **Mecanismo** | por que acontece? | a fisiopatologia em cadeia, causa → consequência |
| 6 | **Diferencial** | o que mais pode ser? o que não pode passar? | dois ou três diagnósticos e o achado que separa cada um |
| 7 | **Exame que separa** | qual exame decide e o que ele mostra? | o achado de imagem, ECG ou laboratório, desenhado |
| 8 | **Conduta** | o que se faz? | **só público de saúde**, só como está na diretriz, com a diretriz citada |
| 9 | **Alerta** | quando procurar ajuda? | o sinal de alerta e onde (SAMU 192) |

**O perfil temporal sugere a causa** (vale para quase toda especialidade): instalação **súbita**, em segundos a minutos,
sugere causa vascular, elétrica ou mecânica; em **horas a dias**, inflamatória, infecciosa ou metabólica; em **semanas a
meses**, tumoral ou degenerativa. Um roteiro que diz "começou de repente" já está raciocinando.

**Probabilidade antes do exame**: quem é o paciente (idade, fatores de risco) muda o quanto cada diagnóstico é provável
antes de qualquer exame. Use isso como virada narrativa ("dor no peito aos 20 anos e aos 65 não são a mesma pergunta").

## Roteiro de doença (o que o agente precisa ter claro antes de escrever)
1. **Quem adoece**: fatores predisponentes.
2. **Mecanismo**: a fisiopatologia.
3. **Como aparece**: a apresentação clínica típica e o tempo de instalação.
4. **O que confunde**: os diferenciais principais.
5. **O que confirma**: o exame-chave e o achado.
6. **Bandeiras vermelhas**: o que exige atendimento imediato.

## Do raciocínio para a cena

| Etapa | Peça visual | Estilos que já têm a base |
|---|---|---|
| Queixa | personagem ou cartão de paciente; sinais vitais | `med3d-decisao`, `med3d-hud-rpg`, `pixel-menu-rpg` |
| Dados / síndrome | caixas que se escrevem letra a letra (`escrita.js`) | `pixel-menu-rpg`, `med3d-hud-rpg` |
| Topografia | lupa (`lupa.js`) ou corte com etiqueta presa à estrutura | `atlas-anatomico`, `pixel-anatomia-sonda` |
| Mecanismo | fluxo animado dentro do órgão, uma seta por passo | `pixel-anatomia-sonda`, `vetor-plano-medico`, `pixel-dungeon-fisiologia` |
| Diferencial | dois painéis lado a lado, o achado que separa destacado | `pixel-duelo-*` |
| Exame | o exame redesenhado (TC, RM, ECG, raio X) com o achado marcado | qualquer estilo; siga a convenção de imagem do guia |
| Conduta | cartão de decisão ou fluxograma que se monta | `med3d-decisao` |
| Alerta | cartão de alerta com o que fazer e o número | todos |

## No painel-roteiro.json
Acrescente o campo `raciocinio`, que diz qual etapa cada frase cumpre:

```json
"raciocinio": {"tipo": "clinico", "etapas": [{"etapa": "queixa", "frases": [1]}, {"etapa": "topografia", "frases": [3, 4]}]}
```

Os nomes das etapas: `queixa`, `dados`, `sindrome`, `topografia`, `mecanismo`, `diferencial`, `exame`, `conduta`, `alerta`.
Em cada ilustração, o `naTela` dá a estrutura pelo nome anatômico, a vista (anterior, lateral, axial, sagital) e o
lado do paciente.
