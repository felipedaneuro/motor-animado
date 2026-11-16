# Receita: jarvis-hud

Exame holográfico visto por um visor de câmera. Veio da referência "Jarvis" (6 s, muda; `decupagem/jarvis-hud`).

## O que a referência mostra (medido)
- Fundo azul-marinho `#071023` → `#0b1a36` (89% da tela); hologramas azuis de partículas e linhas; chão com horizonte.
- Câmera parada 97% do tempo: aproximação lenta e um clarão curto quando muda de assunto. Nada de corte seco.
- HUD fixo: cantos de visor, `● REC 00:03:13` à esquerda, `02 · UPLOAD` à direita, barra de progresso no topo,
  medidor vertical à direita ("CARGA %"), linhas de terminal no canto de baixo (`> destino: rack_07`).
- Título no topo em duas linhas (branca + azul brilhante), que se escreve palavra por palavra (~0,09 s por palavra).
- Etiquetas presas ao objeto: ponto pulsando, linha com cotovelo e uma pílula; a principal em verde-limão
  ("SUA FOTO TÁ AQUI"); as outras em azul ("DESTINO: ???", "RACK 07").
- Legenda de 2 palavras, branca, com a palavra-chave em azul brilhante, no terço de baixo.

## A fórmula do roteiro
- Abre com uma pergunta de jornada ("Pra onde vai sua foto?" → "Pra onde vai esse coágulo?").
- Cada trecho é uma **seção** do HUD (`01 · ORIGEM`, `02 · BLOQUEIO`...): o título muda, o terminal escreve um dado.
- Sem falas de "capítulo": a seção aparece no HUD, a voz segue direto (o vídeo corta os silêncios).

## Como montar (plano.js)
- `VISOR`: sections, headlines (uma por ideia, 2 a 4 palavras por linha), gauge (o número que a história mexe),
  terminal (1 linha por fato, na palavra), ecg (opcional, para coração).
- `CALLOUTS`: 1 ou 2 por cena, presos a um ponto 3D (`anchor: () => vetor`); `tone: "lime"` só na peça principal,
  `"alert"` para perigo. O lado (`side`) aponta para onde há espaço vazio.
- Personagens e órgãos viram holograma com `holoify` / `holoBrain` / `holoHeart`; o que precisa chamar atenção
  (coágulo, sangue) fica fora do holograma (`userData.keepMaterial = true`) em vermelho brilhante.

## Cuidados
- Clarão de seção: 0,3 s, no máximo 1 por seção (fotossensibilidade).
- Títulos com no máximo ~14 letras por linha em 84 px; etiquetas com no máximo ~18 letras.
- Deixe o miolo da tela (y 500 a 1250) para o holograma: título em cima, legenda e terminal embaixo.
