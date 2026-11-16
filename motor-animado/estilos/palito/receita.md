# Receita: palito

Personagem plano desenhado em 2D num mundo 3D, câmera sempre andando. Medido quadro a quadro num short de 15 s (skill estilo-palito, de terceiros). É uma régua: a sua referência pode ser diferente, e é ela que manda (decupe com `decupar.py`).

## A fórmula do roteiro
- **Começa na primeira frase**, sem apresentação: "X parece simples, mas tem N partes."
- **Uma parte por frase**, sempre com a mesma estrutura: "Primeiro, o ___, que ___." / "Depois, o ___..." / "E por fim, ___."
- **O nome de cada peça numa frase curta e só dele**: é nela que a etiqueta aparece e a legenda fica amarela.
- **Fecha** com "Pronto: agora você sabe..." e o pedido final.

## A câmera (medida)
- 450 quadros em 15 s, 30 qps (não existia versão em 60).
- **Cortes fortes** em 2,4, 3,6, 9,9, 10,5 e 14,2 s (`reference.cuts`). Entre eles a imagem nunca fica parada.
- **Nunca para:** cada movimento sai rápido e freia aos poucos em ~14 quadros (0,47 s: `easing: expoOut`), e emenda num deslize lento até o próximo (`glide`). Nunca parada mais que meio segundo.
- Aparecem voos de drone sobre o cenário, aproximações no rosto e travellings de lado.
- Os cortes medidos só batem com o seu vídeo no modo "a imagem manda" (`sync: beats` + `encaixar.py`); no modo "a voz manda", corte na troca de assunto.

## O visual
- **Personagem plano** (`flatCharacter`): cabeça redonda grande, olhos e boca simples, corpo e membros de palito, roupa de cor forte, contorno escuro grosso, sem sombra no desenho. Sempre virado para a câmera (`faceCamera`). Troque a pose por `FLAT_POSES` ou por um objeto de ângulos.
- **Mundo 3D** (`sunnyWorld`, `building`, `rails`): formas simples, cores saturadas, sol forte de um lado, névoa leve no fundo.

## Como cada coisa entra
- Cada peça **voa até o lugar** (`flyIn`, 0,45 s com arco) na palavra que fala dela.
- A **etiqueta presa à peça** (só texto, amarela com contorno marrom) aparece em ~3 quadros no começo da frase que dá o nome a ela.

## Os textos na tela
- Legenda de **uma palavra por vez**, branca com contorno escuro, no meio da tela; amarela nas frases de nome.

## O som
- Whoosh em cada aproximação rápida, pop quando uma peça ou etiqueta aparece, batida grave em impactos, música calma bem baixa.

## O que conferir no seu
- Nada tampando o que importa (uma parede na frente do cenário, o personagem na frente do objeto).
- Os personagens que a referência mostra numa cena também estão na sua.
- O ritmo dos cortes bate com a régua, segundo a segundo (`conferir.py --cortes-esperados` e `comparar.py`).
