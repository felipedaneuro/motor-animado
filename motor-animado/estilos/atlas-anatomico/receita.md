# Receita: atlas-anatomico

Ilustração anatômica de atlas sobre fundo azul-petróleo: a estrutura no centro, girando devagar, com etiquetas claras
presas por linha de chamada ao ponto exato dela. É o estilo para explicar **o que é cada parte** e **onde ela fica** —
quando o assunto é a própria anatomia, não um mecanismo que acontece no tempo.

> Antes de desenhar qualquer estrutura neste estilo, abra a ficha dela em `referencias/anatomia/`. Este estilo mostra
> a anatomia de perto e sem distração: um erro de forma aqui fica evidente.

Decupada de modelos/recortes/atlas-medula.mp4 (25.03 s a 30 qps) pelo `decupar.py`. Os números vieram da medida, e as partes de olhar já estão completadas (conferidas também nas decupagens `atlas-vasos`, `atlas-willis` e `atlas-valvas`, que têm a mesma fórmula). Da referência vem a fórmula; frases, personagens e assunto são sempre da pessoa.

## 1. A fórmula do roteiro
- **6 frases**, **193 palavras por minuto**.
- **Como abre:** uma frase que vira a ideia do avesso, dita já no primeiro segundo, sem vinheta e sem apresentação ("A medula espinal é o cérebro virado do avesso", "Artérias e veias são muito diferentes. E a diferença não está no oxigênio"). A estrutura já está na tela quando a primeira palavra sai.
- **O que se repete:** nomeia → aponta → contrasta. Cada frase apresenta uma estrutura, a etiqueta a marca no modelo, e a frase seguinte a compara com a vizinha ("a cinzenta fica no centro… na medula é o contrário"). De 4 a 6 frases em 25 s, a 193-196 palavras por minuto: é fala rápida, sem pausa de efeito.
- **A virada:** no meio, quando o contraste fecha ("na medula é o contrário", "mitral vem de mitra"). É o único momento em que a câmera se mexe de verdade.
- **Como termina:** um cartão escuro por cima do modelo com "salve esse vídeo para seus estudos" e o @ do canal. O pedido é salvar, não comentar.
- A tabela frase a frase com os tempos está em `decupagem/atlas-anatomico/decupagem.md`.

## 2. A câmera
- **Cortes:** 20.00 s, 21.00 s.
- **2 movimentos rápidos**, jeito dominante **expo_out**, freada de ~0.2 s.
- **Parada 95%** do tempo; o maior trecho parado tem 10.63 s.
- A curva quadro a quadro está em `referencia-curva.json` (câmera medida: `createMeasuredDolly`).
- **Os planos:** um só, de frente, com a estrutura inteira no quadro e giro lento sobre o próprio eixo. A câmera fica parada 95% do tempo; os dois movimentos rápidos medidos (20 s e 21 s) são a emenda do recorte e a entrada do cartão final, não cortes da referência: por isso o estilo nasce com `cuts: "none"`.

## 3. O visual
- **Paleta medida:** `#1c2831`, `#31414f`, `#090d10`, `#eccabf`, `#d8ae6a`, `#3c3634`, `#a090d3`, `#312a1f`.
- **O estilo:** ilustração anatômica 3D de atlas, lisa e sem textura de pele, como uma prancha do Netter em volume. Luz suave e ampla, levemente fria, vindo de cima e da frente; nada de sombra dura nem de brilho especular forte. Fundo em degradê azul-petróleo (`#1c2831` → `#0b1218`), sem chão e sem horizonte.
- **O personagem:** não existe. O protagonista é o órgão. Nunca entra gente, mascote nem mão em cena.
- **O cenário:** um só, o fundo de estúdio, do começo ao fim. O que muda é a estrutura no meio dele e o ângulo em que ela está.

## 4. Como cada coisa entra
- **Como entra:** a etiqueta aparece por opacidade em cerca de 8 quadros (0,25 s), já na posição final: não desliza nem cresce. A estrutura nunca entra voando; ela já está lá, e o que muda é qual parte está destacada.
- **Quando entra:** junto com a palavra, com atraso medido de 0,03 a 0,08 s depois dela. A etiqueta fica até a frase seguinte terminar, não some junto com a palavra.

## 5. Os textos na tela
- **Legenda:** 3 palavra(s) por vez, topo em 303 px, letra ~35 px, `#92eafa` com contorno `#171f29`, destaque `#f2f5f9`.
- **As etiquetas:** a marca do estilo. Retângulo claro (`#f4f8fb`) com texto escuro de 34 px, cantos arredondados e sombra, preso por uma **linha fina até o ponto exato** da estrutura, com um anel pequeno na ponta. Ficam a um quarto ou a três quartos da largura, nunca por cima do que explicam. De duas a três por vídeo ao mesmo tempo, no máximo. A legenda é outra coisa: 2 ou 3 palavras em minúsculas a 303 px do topo, azul-claro `#92eafa`, com a palavra-chave em branco.

## 6. O som
- **Volume da referência:** -14.0 LUFS (o nosso vai a -14). **Música por baixo:** sim.
- **O som:** só a voz, a −13,7 LUFS, sem efeito nos movimentos e sem música por baixo que dê para notar. Os ataques medidos são da própria fala.

## 7. Como montar no motor
- **O kit tem:** `studioBackdrop` (o fundo em degradê), `createCallouts` (as etiquetas com linha de chamada, que seguem o modelo quando ele gira: passe `dentro: <o grupo>`), `turntable` (o giro lento) e `shadowDisc` (a sombra sob a peça). O órgão vem de `motor/anatomia.js` ou é desenhado em `pecas.js`.
- **Conferir:** a etiqueta não pode cair em cima da estrutura que nomeia nem sair pela borda; a linha não pode cruzar outra etiqueta; o ponto tem que ficar **dentro** do órgão depois do giro (por isso `dentro:`); e a anatomia tem que bater com a ficha de `referencias/anatomia/` antes do render.
