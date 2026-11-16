# Créditos

## De onde vieram as ideias e parte do código
A skill junta, reorganiza e amplia três skills de terceiros, que continuam sendo dos seus autores:

| Origem | O que veio dela | Onde está aqui |
|---|---|---|
| **brisa-visual-3d** (canal Brisa Visual 3D) | a receita "se você fosse...", o mundo noturno low-poly, a câmera de drone, os bonecos, a biblioteca de sons sintetizados, o alinhamento roteiro × Whisper, a emenda de frases, a mixagem e o exemplo da cafeína | `estilos/lowpoly-drone/`, `motores/web/js/personagens.js`, `ferramentas/sons.py`, `alinhar.py`, `emendar.py`, `mixar.py` |
| **estilo-palito** (materiais "Animação estilo palito com o Claude") | o estudo quadro a quadro com número, a medida da câmera, as folhas de quadros, o lado a lado e a receita do personagem plano | `estilos/palito/`, `ferramentas/camera.py`, `folhas.py`, `lado_a_lado.py` |
| **shorts-3d-realistas** (materiais "Shorts 3D realistas com o Claude") | a cena realista no Blender em código, a pele e os pelos fio a fio, a câmera na curva medida, o acabamento de filmado e a comparação na mesma régua | `motores/blender/`, `estilos/realista-corpo/`, `ferramentas/finalizar.py`, `comparar.py` |

Essas skills não declaram licença. **Antes de publicar ou distribuir esta skill, peça permissão aos autores** e mantenha este arquivo.
Os personagens dos canais de origem ficaram de fora; o exemplo usa uma personagem neutra (a Bia).

## Ferramentas e materiais abertos
| Item | Licença | Uso |
|---|---|---|
| three.js 0.181.2 (`motores/web/vendor/three/`) | MIT (`vendor/three/LICENSE`) | a cena 3D do motor web |
| GSAP 3.14.2 (`motores/web/vendor/gsap.min.js`) | licença padrão GSAP (uso gratuito) | a linha do tempo exigida pelo HyperFrames |
| Montserrat, Fredoka, Press Start 2P (`motores/web/vendor/fonts/`) | SIL Open Font License 1.1 | legendas, etiquetas e cards |
| HyperFrames (npx, não incluído) | do autor | o render do motor web |
| Blender e MPFB (não incluídos) | GPL | o motor realista |
| Céu HDR "Studio Small 09" (`motores/blender/assets/`) | CC0, Poly Haven | a luz do motor Blender |
| mlx-whisper, OpenCV, NumPy, Pillow, Matplotlib (não incluídos) | MIT / Apache / BSD / HPND / PSF | transcrição, medidas e imagens |
| ffmpeg-full, yt-dlp (não incluídos) | GPL / Unlicense | áudio, vídeo, legenda queimada e download de referências |

Vídeos de referência baixados com o `baixar.py` são só para estudo: nada deles (quadros, áudio, frases) vai para os vídeos produzidos.
