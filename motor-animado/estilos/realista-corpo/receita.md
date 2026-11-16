# Receita: realista-corpo

Close realista de uma parte do corpo, feito no Blender em código (motor `blender`): pele com poros e luz que entra, fios de cabelo e pelos um por um, fundo limpo em degradê e uma câmera que chega devagar. Feito para conteúdo de corpo e saúde: o que acontece na pele, no rosto, num braço ou numa perna.

## Enquadramentos (presets)
| Preset | Para quê | Câmera | Luz |
|---|---|---|---|
| `cabeca` | rosto, couro cabeludo, olhos, pele do rosto | 85 mm, 0,85 m, de frente girada 25° | área macia (0,3 m) + contorno frio |
| `braco` | antebraço, picada, curativo, veia | 70 mm, 0,9 m, do lado | sol quase duro (2,5°): cada pelo faz sombra |
| `perna` | canela, joelho, corte, inchaço | 70 mm, 0,98 m | sol quase duro |

Troque com `blender.py --enquadramento braco`. Ajustes só de um vídeo vão em `estilo-ajustes.json` (ex.: `{"blender": {"hair": "medium", "iris": "#3a6a8a"}}`).

## Corpo inteiro: escolha de estilo, não atalho
O MPFB é bom em closes. Quando o vídeo precisar do corpo inteiro, **assuma um visual mais simples como linguagem**: um "manequim anatômico" (pele lisa, sem pelos, luz de estúdio, como um modelo de museu de ciências), com fios e poros desligados (`"hair": "none"`, `"body_hair": false`) e o detalhe concentrado no que o vídeo explica (o órgão, o osso, o caminho). Diga isso no roteiro e no visual: o espectador lê como escolha.

## A fórmula (medida no short de referência de terceiros)
- **Um plano só**, sem corte. A câmera entra ~0,7% por quadro e a imagem dobra em 3 s; freia até parar no segundo 4 e volta a entrar no 9. Com a decupagem de uma referência sua, a câmera segue a curva medida dela (`referencia-curva.json`).
- **A frase fala da coisa no momento em que ela aparece**: o modo é "a imagem manda" (`sync: beats` + `encaixar.py`). Acelerar a voz mais de 12% soa apressado: encurte a frase.

## O que faz parecer filmado (a lista)
1. **Pele fosca** (aspereza 0,5 a 0,66), manchas, poros e linhas em relevo. Brilho liso é plástico. Luz entrando demais (Subsurface Scale > 0,0025) vira cera no rosto.
2. **Fios**: cabelo com redemoinho atrás e frente penteada para trás; sobrancelha em arco; pelos do corpo em duas camadas. É o passo que mais muda a imagem.
3. **Sem redutor de ruído nos closes com fios**: ele apaga cabelo e pelos. Mais amostras (96+) e o grão natural, que combina com o acabamento.
4. **Fundo de verdade**: um detalhe com profundidade é deslocamento, não tinta (`referencias/motor-blender.md`).
5. **Foco**: f/8 a f/11 na cabeça (o cabelo atrás fica nítido); f/4 a f/6,3 nos membros.
6. **Fundo limpo** em degradê, com as duas cores medidas na referência.
7. **Acabamento**: brilho suave, vinheta e grão (`finalizar.py`).
8. **Escala real** de roupas e objetos; uma tesoura fininha parece de brinquedo.

## Os números do teste (Mac com chip M, GPU Metal)
- O primeiro render depois de instalar demora uns 4 min: o Metal compila os programas uma vez só.
- Cabeça, 75% (810x1440), 96 amostras, sem redutor: ~41 s por quadro → 10 s de vídeo ≈ 3 h 30. Rascunho em 25%, 16 amostras: ~4 s.
- Diga sempre o tempo do vídeo inteiro antes do render longo (o `--still` calcula).
