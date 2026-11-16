# O motor Blender (estilos realistas)

## Rodar
Na pasta do vídeo, sempre pelo `ferramentas/py blender.py` (ele acha o estilo, junta os ajustes e chama o Blender sem janela). Cada passo imprime uma linha `PASSO`; cada quadro, uma linha `QUADRO` com o tempo e a estimativa do vídeo inteiro.

1. Um quadro de teste: `--still 1 --samples 16 --escala 25` (segundos). Abra `stills/teste-q1.png`.
2. Quadros espalhados (o mapa antes do render): `--still 1,60,120,180,240,300 --samples 16 --escala 25`, e junte numa folha.
3. Um quadro na qualidade final: `--still 1 --samples 96 --escala 75`. Diga o tempo do vídeo inteiro e espere o ok.
4. O vídeo: `--anim` (ou `--anim --quadros 1-150` e depois `151-300`). Em segundo plano.
5. `ferramentas/py finalizar.py renders/quadros --saida video-v1.mp4 --voz voz/voz.wav --efeitos som/efeitos.wav`.

`--salvar` grava `cena.blend`: abra no Blender para olhar a cena de qualquer ângulo.

## O que o motor monta (motores/blender/)
| Arquivo | O que faz |
|---|---|
| `cena.py` | junta tudo: mundo (HDR + degradê), corpo, pele, rosto, roupa, assunto, fios, luz, câmera e render |
| `humano.py` | o corpo do MPFB, as poses medidas, a subdivisão adaptativa, a geometria-guia e a camiseta cortada do corpo |
| `pele.py` | a pele em código, com os ganchos `DetalheCor` e `DetalheAltura` |
| `rosto.py` | olhos (íris, pupila, brilho), cílios, a região do cabelo, o arco das sobrancelhas e o penteado |
| `pelos.py` | fios: pelos do corpo, cabelo curto e médio; `grow(verts, polys, keep, camadas, comb, allowed)` |

Qualquer um desses copiado para a pasta do vídeo vale mais que o do motor (a pasta do vídeo vem primeiro no caminho).

## O assunto do vídeo: assunto.py
O que acontece no corpo (um corte que fecha, uma picada, uma veia, uma mancha) fica num `assunto.py` na pasta do vídeo. O `cena.py` chama `montar(c)` depois da pele e do rosto e antes dos fios, da luz e da câmera.

```python
# assunto.py, na pasta do vídeo
import bpy
from mathutils import Matrix

def espaco(c):
    """Medidas no ponto: X atravessa, Y vai ao longo do osso, Z sai da pele. Em metros."""
    z = c["normal"].normalized()
    y = (c["cima"] - z * c["cima"].dot(z)).normalized()
    m = Matrix((y.cross(z), y, z)).transposed().to_4x4()
    m.translation = c["ponto"]
    e = bpy.data.objects.new("Espaco", None)
    e.matrix_world = m
    bpy.context.scene.collection.objects.link(e)
    return e

def montar(c):
    e = espaco(c)
    # 1. o desenho do detalhe: uma máscara nas medidas do espaço
    # 2. a cor no gancho DetalheCor e o fundo com deslocamento (abaixo)
    # 3. objetos e o que se mexe, com keyframes (c["quadros"], c["fps"])
    # 4. c["filtro_pelos"] = lambda pontos: ... (onde pode ter fio; nunca dentro do detalhe)
```
`c` traz: `corpo`, `rig`, `pele` (o material), `ponto`, `normal`, `fora` (de onde a câmera olha), `cima`, `bvh`, `quadros`, `fps`, `marcas` (olhos, topo e base da cabeça, no enquadramento de cabeça) e `filtro_pelos`. Trocar `c["ponto"]` muda onde a câmera chega.

## Fundo de verdade: deslocamento
Um corte, um furo, um inchaço: não pinte, afunde. Perto da câmera a pele é dividida até o tamanho de um pixel (subdivisão adaptativa), e o material move a superfície:

```python
nt = c["pele"].node_tree
tc = nt.nodes.new("ShaderNodeTexCoord"); tc.object = e          # tc.outputs["Object"]: metros em volta do ponto
d = nt.nodes.new("ShaderNodeDisplacement")
d.inputs["Midlevel"].default_value = 0.0; d.inputs["Scale"].default_value = 1.0
nt.links.new(altura, d.inputs["Height"])                         # altura em metros: negativa afunda
saida = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
nt.links.new(d.outputs["Displacement"], saida.inputs["Displacement"])
c["pele"].displacement_method = "BOTH"
```
Use **uma fórmula só** para o desenho do detalhe e reaproveite no material, no filtro dos pelos e nos objetos que encostam nele.

## Outras técnicas
- **Uma linha que se desenha** (fio, veia, traço): curva com `bevel_depth`, `bevel_factor_mapping_end = "SPLINE"` e keyframes em `bevel_factor_end` de 0 a 1.
- **Algo que pula entre dois quadros**: desligue o desfoque de movimento só nele (`obj.cycles.use_motion_blur = False`).
- **Antes de girar uma parte do corpo**, meça onde ela está e onde precisa chegar (girar no olho erra a pose).

## Quando o render demora
1. **O primeiro render depois de instalar** leva minutos: o Metal compila uma vez. Os seguintes são rápidos.
2. **Um quadro muito mais lento que os outros** está calculando algo. Não desligue no chute: veja o que é (`sample <pid do Blender> 5`) e renderize o mesmo quadro desligando um material por vez.
3. **Nunca dê subsurface a uma coisa fina enterrada na pele** (fio, linha): a luz fica presa e um quadro de segundos passa de 10 minutos.
4. **Renderize menor e amplie**: `--escala 75` e o `finalizar.py` amplia quase sem perda.
5. **Fios e redutor de ruído não combinam**: nos closes com cabelo ou pelos, o estilo desliga o redutor (`"denoise": false`) e usa mais amostras.
