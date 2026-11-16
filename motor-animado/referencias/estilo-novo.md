# Um estilo novo a partir de uma referência

Da referência vem a **fórmula** (ritmo, câmera, textos, som, jeito de desenhar). Frases, personagens, assunto e arquivos são sempre da pessoa: nada de quadro ou áudio da referência no vídeo dela.

## 1. Decupar (só número)
`ferramentas/py decupar.py <link> --nome <estilo> --ate 15` (com `--cookies chrome` se o site pedir login). Diga o fps real (está em `referencia/numeros.md`). Saem `decupagem/<estilo>/decupagem.md` e as folhas.

Para ver o padrão do perfil, baixe também 4 a 7 vídeos do mesmo perfil (`baixar.py <links> --pasta decupagem/<estilo>/perfil`) e compare os números: o que se repete em todos é a receita; o que aparece em um só é escolha daquele vídeo.

## 2. Olhar (as partes [OLHAR])
Abra você mesmo, nesta ordem:
1. `folhas/historia/` (2 por segundo): a história inteira, os tipos de plano, o personagem, o cenário.
2. `folhas/ritmo/` (6 por segundo): como cada peça entra e em quantos quadros.
3. `folhas/corte-*` e `folhas/movimento-*` (todos os quadros): o jeito de cada corte e de cada movimento.
4. `tomadas/`: luz, cor e desenho de cada tomada.
Complete cada **[OLHAR]** do `decupagem.md` com o segundo de cada coisa. "Ficou bonito" não serve; "a peça entra crescendo em 6 quadros, na palavra" serve.

## 3. Criar o estilo
`ferramentas/py novo_estilo.py decupagem/<estilo> [--motor web|blender]`
- **web**: estilizado (2D, low-poly, desenho, brinquedo). **blender**: realista (pele, cabelo, corpo).
- Escreve `estilos/<estilo>/` com o `estilo.json` medido, a `receita.md` com os números e as partes [OLHAR], o `kit.js` de partida e um exemplo de 6 frases.
- Estilos pessoais podem ficar fora da skill: `export MOTOR_ANIMADO_ESTILOS=<pasta>`.

Depois:
1. Passe as partes [OLHAR] da decupagem para a receita e apague as marcas.
2. Escreva no `kit.js` as peças que se repetem em todo vídeo do estilo (o mundo, o personagem, os objetos típicos). O personagem: `flatCharacter` (plano, desenhado) ou `puppet` (boneco 3D articulado), no motor.
3. Ajuste o `estilo.json` com o que só o olho mede: `stage.flat_shading`, a luz, a névoa, o modo da etiqueta (`top` ou `anchored`, `box` ou `text`).

## 4. Testar e comparar
1. O exemplo com a voz do Mac, em rascunho (o caminho do SKILL.md, passos 3 a 7).
2. `comparar.py decupagem/<estilo> video-v1-final.mp4`: a tabela medida a medida e o gráfico das câmeras. A diferença é a lista da próxima versão.
3. `lado_a_lado.py referencia.mp4 video-v1-final.mp4` e as folhas dos dois nos mesmos segundos.
4. Uma mudança por vez, cada versão com número novo, até a pessoa aprovar. Anote no `registro.md` o que mudou e por quê.
