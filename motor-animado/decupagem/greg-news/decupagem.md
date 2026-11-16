# Decupagem: greg-news

Fonte: https://www.youtube.com/watch?v=4w6AAfIxfZc · 15.02 s a 24 qps · 903418 visualizações, 70101 curtidas

Tudo medido no Mac. As partes **[OLHAR]** são completadas abrindo `folhas/` e `tomadas/`.

## 1. A fala

- **109 palavras por minuto**; a primeira palavra em 0.0 s; fala em 99% do vídeo.
- **7 frases**, de 0.2 a 3.9 s.
- **O gancho (0 a 3 s):** "."
- **Pausas de 0,35 s ou mais:** 4 (0.24 s, 4.76 s, 6.5 s, 11.9 s)

| # | Começa | Dura | Frase |
|---|---|---|---|
| 1 | 0.00 s | 0.2 s | . |
| 2 | 3.98 s | 0.8 s | Boa noite! |
| 3 | 5.82 s | 0.7 s | Muito bom. |
| 4 | 8.12 s | 0.5 s | Amizade. |
| 5 | 8.76 s | 1.7 s | Hoje a gente vai falar de amizade. |
| 6 | 10.64 s | 3.9 s | Que, pro fundo do quintal, nem mesmo a força do tempo irá destruir. |
| 7 | 14.66 s | 0.3 s | Sim. |

**[OLHAR] A fórmula:** como abre, o que se repete no meio, onde tem a virada, como termina e qual é o pedido final.

## 2. A câmera

- **1 cortes** (4.0 por minuto): 5.30 s.
- **7 movimentos rápidos** (28.0 por minuto), mediana de 12 quadros.
- **Jeito dominante: smooth** {'expo_out': 2, 'smooth': 3, 'linear': 1, 'ease_in': 1}; freada mediana de 4 quadros (0.17 s).
- **Parada 69%**, lenta 14%, rápida 12%; o maior trecho parado: 3.55 s.
- A curva quadro a quadro está em `camera/ref-curva.json` (para a câmera medida do motor).

**[OLHAR] Os tipos de plano:** drone por cima, aproximação no rosto, travelling de lado, órbita... e em que segundos.

## 3. O visual

**Paleta do vídeo:** `#020709` 25%, `#252320` 24%, `#214a73` 17%, `#684924` 15%, `#e1cea0` 8%, `#a28d6f` 5%, `#60401b` 3%, `#966e31` 2%

| Tomada | De | Até | Brilho | Saturação | Fundo (cima → baixo) | Foco (x, y) | Pessoa (altura) | Rosto |
|---|---|---|---|---|---|---|---|---|
| 1 | 0.00 | 5.30 | 0.12 | 0.80 | `#050d10` → `#000306` | [0.56, 0.38] | 0.35 |  |
| 2 | 5.30 | 15.02 | 0.42 | 0.51 | `#1f2e58` → `#62422e` | [0.42, 0.36] | 0.34 | sim |

Quadros de cada tomada em `tomadas/`.

**[OLHAR] O estilo:** 2D ou 3D, low-poly, realista ou desenho; o personagem (cabeça, olhos, corpo, contorno, sombra); o cenário; de onde vem a luz (dura ou suave, a cor); motor sugerido (`web` para estilizado, `blender` para realista).
**[OLHAR] Como cada coisa entra:** cresce, voa, aparece de repente; em quantos quadros; na palavra, antes ou depois.

## 4. Os textos na tela

- **Legenda:** 1 palavra(s) por vez, topo em 730 px de 1920, letra de ~98 px, cor `#fbf3e8`, contorno `#f8790a`, destaque `None`, minúsculas.
- **Sincronia:** a legenda troca 0.27 s em relação à palavra falada (negativo = antes).
- **Exemplos:** COM GREGÓRIO / DUVIVIER / COM GREGÓRIO / ade / mizade / amizade
- **Funciona sem som:** sim.

**Outros textos** (etiquetas, cards, títulos):

| De | Até | Texto | Posição (x, y) |
|---|---|---|---|
| 0.17 | 1.17 | GREG NEWS | 0.36, 0.00 |
| 0.17 | 0.50 | COM GREGÓRIO | 0.35, 0.11 |
| 0.17 | 1.17 | DUVIVIER | 0.35, 0.19 |
| 2.50 | 2.50 | 16 | 0.06, 0.88 |

## 5. O som

- **Volume:** -17.5 LUFS, pico -0.5 dB.
- **Música por baixo:** sim (as pausas ficam 3.0 dB abaixo da fala).
- **Efeitos:** 6 ataques; 0 em cortes, 2 em movimentos; 29% dos movimentos têm efeito.
- Tempos: 0.11, 0.5, 0.77, 1.3, 6.13, 7.82

**[OLHAR] Que efeitos são** (whoosh, pop, impacto, sino) e a música (calma, tensa, batida).
