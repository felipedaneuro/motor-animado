# Anatomia de verdade, para desenhar

Este é o acervo de referência do motor para vídeos de corpo humano. Ele existe por um motivo só: **órgão desenhado
de memória sai errado**, e num vídeo de saúde o erro de desenho vira erro de informação. Antes de desenhar um órgão,
abra a ficha dele aqui. Se não houver ficha, escreva uma (o modelo está no fim deste arquivo) e só então desenhe.

## O que cada ficha traz
1. **Medida de verdade** (centímetros, gramas, quantos ramos) — é o que resolve "está grande demais?".
2. **Onde fica e para onde aponta** — posição no corpo, inclinação, o que está em volta.
3. **Cor de verdade e cor de convenção** — o fígado é marrom-avermelhado; o azul da veia é convenção de desenho,
   não a cor do sangue venoso (que é vermelho-escuro). Diga qual das duas você está usando.
4. **O que não pode faltar** — as peças sem as quais a pessoa que entende olha e vê que está errado.
5. **Erros comuns de desenho** — a lista do que costuma sair torto em pixel e em low-poly.
6. **O que o motor já tem pronto** — a peça de `motores/web/js/anatomia.js`, quando existe.
7. **Fonte** — o link, com a frase que sustenta cada número.

## Fichas
| Ficha | Serve para | Estado |
|---|---|---|
| [coracao.md](coracao.md) | infarto, parada, valvas, ciclo cardíaco, insuficiência | pronta |
| [vasos.md](vasos.md) | artéria, veia, capilar, placa, trombo, stent, aneurisma | pronta |
| [circulacao-cerebral.md](circulacao-cerebral.md) | AVC, aneurisma cerebral, hematoma, polígono de Willis | pronta |
| [medula-espinal.md](medula-espinal.md) | medula, raízes, cornos, cauda equina, peridural | pronta |
| [mapa-do-site.md](mapa-do-site.md) | achar a página certa do Aula de Anatomia para um sistema ainda sem ficha | pronta |
| [publicados.md](publicados.md) | o que o canal já explicou, com o link e o jeito que explicou | pronta |

**Ainda sem ficha** (escreva uma antes de desenhar): pulmão e vias aéreas, rim e bexiga, estômago e intestino,
fígado e pâncreas, pele em camadas, osso e músculo, neurônio e sinapse, olho, ouvido, tireoide e suprarrenal, útero
e ovário, placenta. Para cada um, a página de partida está em [mapa-do-site.md](mapa-do-site.md).

**Três armadilhas que aparecem em quase todo vídeo de corpo**, cada uma explicada na sua ficha:
1. Artéria e veia **não** se definem pelo oxigênio, e sim pela direção do fluxo ([vasos.md](vasos.md)).
2. Na medula a substância cinzenta fica **no centro**; no cérebro, na superfície ([medula-espinal.md](medula-espinal.md)).
3. A mitral é a única valva com **duas** cúspides ([coracao.md](coracao.md)).

## Regras de desenho (valem para todos os estilos)
- **Uma convenção por vídeo.** Se o sangue oxigenado é vermelho e o pobre em oxigênio é azul, é assim do primeiro ao
  último quadro, inclusive nos ícones.
- **Escala relativa certa, mesmo quando o tamanho absoluto é livre.** O coração cabe num punho; a aorta tem a grossura
  de um polegar; uma coronária tem a grossura de um espaguete. Se o vídeo mostra os três juntos, a proporção entre
  eles precisa estar certa, mesmo que tudo esteja ampliado.
- **Corte, não raio X.** Para mostrar o que acontece dentro de um vaso ou de um órgão, desenhe um corte com a parede
  visível (as camadas) em vez de deixar o órgão transparente: o corte se lê, a transparência vira borrão.
- **Nada de rosto em célula, em órgão ou em molécula.** Uma hemácia com olhos é desenho infantil, não explicação.
- **O que o corpo não faz, o desenho não mostra.** Sangue não anda para trás numa valva que fecha; uma artéria entupida
  não fica vermelha depois do bloqueio.
- **Saúde:** explique o mecanismo. Não dê diagnóstico, não indique tratamento nem dose, e diga quando procurar ajuda.
  No Brasil: SAMU 192.

## Modelo de ficha nova
```markdown
# <Órgão>
## Medida de verdade
## Onde fica e para onde aponta
## Cor
## O que não pode faltar
## Erros comuns de desenho
## O que o motor já tem
## Fonte
```
