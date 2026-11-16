# Raciocínio cirúrgico: o esqueleto do vídeo de procedimento

Use quando o tema é um procedimento (cirurgia, intervenção endovascular, punção). O vídeo mostra **por que operar,
por onde entrar, o que preservar e o que pode dar errado**, na ordem em que o cirurgião pensa.

## Antes da etapa 1: o gancho
A primeira frase prende antes de explicar: o momento crítico ("Oclusão em M1. Cada minuto conta."), a pergunta ou o
risco que o procedimento enfrenta. Depois o vídeo segue a ordem abaixo, **uma ideia por frase**, dentro do limite de
palavras do público: um tempo cirúrgico longo vira duas ou três frases curtas.

## As etapas

| # | Etapa | A pergunta | O que entra no roteiro |
|---|---|---|---|
| 1 | **Indicação** | por que operar e por que agora? | o problema e o que acontece sem a cirurgia |
| 2 | **Anatomia que importa** | o que está no caminho e o que não pode ser lesado? | as estruturas em risco, nomeadas antes do gesto |
| 3 | **Posição e acesso** | como o paciente fica e por onde se entra? | a posição (supina, prona, lateral), a incisão ou a via (femoral, radial) |
| 4 | **Tempos cirúrgicos** | qual a sequência? | plano a plano, um tempo por frase |
| 5 | **O gesto principal** | o que resolve o problema? | o momento central, mostrado com calma |
| 6 | **Complicações** | o que pode dar errado e por quê? | as duas ou três típicas, ligadas à anatomia da etapa 2 |
| 7 | **Depois** | como é a recuperação e o que vigiar? | pós-operatório e sinais de alerta |

**Regra de ouro do desenho**: a estrutura em risco aparece **antes** do instrumento chegar perto dela. Quem assiste
precisa entender o cuidado antes de ver o gesto.

## Ficha de procedimento (o que o agente precisa ter claro antes de escrever)
1. **Indicação** e contraindicações principais.
2. **Posição** do paciente e preparo.
3. **Acesso**: incisão ou via, e os **planos atravessados em ordem** (da pele ao alvo).
4. **Estruturas a preservar** em cada plano.
5. **Tempos cirúrgicos**, numerados.
6. **Complicações típicas** e de onde vêm.
7. **Pós-operatório**: o que se vigia.

## Do raciocínio para a cena

| Etapa | Peça visual | Estilos que já têm a base |
|---|---|---|
| Indicação | o órgão doente, antes e depois sem tratar | `pixel-anatomia-sonda`, `atlas-anatomico` |
| Anatomia que importa | corte com as estruturas em risco destacadas e etiquetadas | `atlas-anatomico`, `pixel-anatomia-camadas` |
| Posição e acesso | silhueta do paciente com a incisão ou a via marcada | `vetor-plano-medico`, `med3d-primeira-pessoa` |
| Tempos cirúrgicos | corte em camadas atravessado plano a plano | `pixel-anatomia-camadas`, `pixel-arteria-stent` |
| Gesto principal | o instrumento ou aparelho entrando, câmera parada | `pixel-arteria-stent`, `pixel-anatomia-sonda` |
| Complicações | duelo: o que se queria × o que pode acontecer | `pixel-duelo-*` |
| Depois | cartão de alerta | todos |

## Limites
- **Sem sangue realista, sem campo cirúrgico real, sem foto de paciente.** Tudo esquemático.
- Instrumentos desenhados em forma simples e reconhecível; nome do instrumento só se o público for de saúde.
- Para público leigo: a cirurgia é explicada pelo **objetivo** e pelo **cuidado**, sem detalhe técnico de tempo
  cirúrgico; para público de saúde: tempos, planos e referências anatômicas com o nome certo.

## No painel-roteiro.json
```json
"raciocinio": {"tipo": "cirurgico", "etapas": [{"etapa": "indicacao", "frases": [1, 2]}, {"etapa": "acesso", "frases": [4]}]}
```
Os nomes das etapas: `indicacao`, `anatomia`, `acesso`, `tempos`, `gesto`, `complicacoes`, `depois`.
