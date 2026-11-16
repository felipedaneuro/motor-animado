# Receita: {{NOME}}

Decupada de {{FONTE}} ({{DURACAO}} s a {{FPS}} qps) pelo `decupar.py`. Os números vieram da medida; as partes **[OLHAR]** o Claude completa abrindo `decupagem/{{NOME}}/folhas/` e `tomadas/`, e apaga a marca quando terminar. Da referência vem a fórmula; frases, personagens e assunto são sempre da pessoa.

## 1. A fórmula do roteiro
- **{{FRASES}} frases**, **{{PPM}} palavras por minuto**.
- [OLHAR] Como abre (os primeiros 3 s: pergunta, problema, promessa, "se você fosse...").
- [OLHAR] O que se repete no meio (a mesma estrutura de frase volta? quantas vezes?).
- [OLHAR] Onde tem a virada ou a piada.
- [OLHAR] Como termina e qual é o pedido final.
- A tabela frase a frase com os tempos está em `decupagem/{{NOME}}/decupagem.md`.

## 2. A câmera
- **Cortes:** {{CORTES}}.
- **{{MOVIMENTOS}} movimentos rápidos**, jeito dominante **{{JEITO}}**, freada de ~{{FREADA}} s.
- **Parada {{PARADA}}%** do tempo; o maior trecho parado tem {{MAIOR_PARADA}} s.
- A curva quadro a quadro está em `referencia-curva.json` (câmera medida: `createMeasuredDolly`).
- [OLHAR] Os tipos de plano (drone por cima, aproximação no rosto, travelling, órbita) e em que segundos.

## 3. O visual
- **Paleta medida:** {{PALETA}}.
- [OLHAR] O estilo (2D, 3D, low-poly, realista, desenho), a luz (de onde vem, dura ou suave, a cor).
- [OLHAR] O personagem: como é desenhado (cabeça, olhos, corpo, contorno, sombra) e quando aparece. Plano (`flatCharacter`) ou boneco 3D (`puppet`)?
- [OLHAR] O cenário: um só ou um por assunto? O que tem no fundo?

## 4. Como cada coisa entra
- [OLHAR] Cresce, voa, aparece de repente? Em quantos quadros (veja as folhas de cada corte e movimento, a 30 por segundo)?
- [OLHAR] Na palavra que fala dela, antes ou depois?

## 5. Os textos na tela
- **Legenda:** {{LEGENDA}}.
- [OLHAR] Etiquetas, setas, números, avisos: posição, cor, quando aparecem e quanto tempo ficam.

## 6. O som
- **Volume da referência:** {{LUFS}} LUFS (o nosso vai a -14). **Música por baixo:** {{MUSICA}}.
- [OLHAR] Que efeitos são e em quais ações.

## 7. Como montar no motor
- [OLHAR] As peças que o `kit.js` precisa ter (o mundo, o personagem, os objetos que se repetem).
- [OLHAR] O que conferir no nosso: nada tampando o que importa, os personagens da referência na cena equivalente, o ritmo dos cortes segundo a segundo.
