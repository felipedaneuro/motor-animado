"""A pele, toda em código (o MPFB não traz foto de pele): luz que entra na pele (subsurface random walk), manchas de
vermelhidão, mosqueado fino, pontinhos dos folículos, poros e linhas finas em relevo. Medidas por metro, nas
coordenadas do corpo. Para mudar só num vídeo, copie para a pasta do vídeo e mude lá: a cópia da pasta vale mais.

Dois ganchos ficam prontos para o assunto do vídeo mexer na pele sem refazer o material:
  "DetalheCor"     (Mix de cor): A é a cor da pele; ligue uma máscara em Factor e a cor do detalhe em B.
  "DetalheAltura"  (Math, soma): some a altura do detalhe, em metros, na entrada 1. Vira relevo.
Para fundo de verdade (um corte, um furo), use deslocamento: referencias/motor-blender.md.
"""
import bpy

TONE = ((200, 142, 102), (184, 116, 84))   # a base e as manchas, em RGB 0-255; meça num close da referência


def srgb(rgb):
    return [x / 255 if x / 255 <= 0.04045 else ((x / 255 + 0.055) / 1.055) ** 2.4 for x in rgb]


def node(tree, kind, location, **inputs):
    created = tree.nodes.new(kind)
    created.location = location
    for key, value in inputs.items():
        created.inputs[key].default_value = value
    return created


def mix_color(tree, location, blend="MIX"):
    created = node(tree, "ShaderNodeMix", location)
    created.data_type = "RGBA"
    created.blend_type = blend
    return created


def base_shader(tree):
    out = node(tree, "ShaderNodeOutputMaterial", (1400, 0))
    bsdf = node(tree, "ShaderNodeBsdfPrincipled", (1100, 0))
    bsdf.subsurface_method = "RANDOM_WALK_SKIN"
    bsdf.inputs["Subsurface Weight"].default_value = 1.0
    bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.35, 0.18)
    bsdf.inputs["Subsurface Scale"].default_value = 0.0022   # mais que isso, o rosto vira cera
    bsdf.inputs["Specular IOR Level"].default_value = 0.45
    bsdf.inputs["Coat Weight"].default_value = 0.0
    tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return bsdf


def color_layers(tree, coords, tone):
    """A base com manchas de vermelhidão, um mosqueado fino e os pontinhos dos folículos."""
    link = tree.links.new
    blotch = node(tree, "ShaderNodeTexNoise", (-900, 300), Scale=9.0, Detail=4.0, Roughness=0.55)
    link(coords, blotch.inputs["Vector"])
    blotch_range = node(tree, "ShaderNodeMapRange", (-700, 300), **{"From Min": 0.42, "From Max": 0.68})
    link(blotch.outputs["Fac"], blotch_range.inputs["Value"])
    base = mix_color(tree, (-450, 300))
    base.inputs["A"].default_value = (*srgb(tone[0]), 1)
    base.inputs["B"].default_value = (*srgb(tone[1]), 1)
    link(blotch_range.outputs["Result"], base.inputs["Factor"])
    mottle = node(tree, "ShaderNodeTexNoise", (-900, 50), Scale=90.0, Detail=6.0, Roughness=0.6)
    link(coords, mottle.inputs["Vector"])
    mottle_range = node(tree, "ShaderNodeMapRange", (-700, 50), **{"From Min": 0.35, "From Max": 0.65, "To Min": 0.0, "To Max": 0.3})
    link(mottle.outputs["Fac"], mottle_range.inputs["Value"])
    mottled = mix_color(tree, (-250, 200), "MULTIPLY")
    mottled.inputs["B"].default_value = (*srgb((214, 170, 150)), 1)
    link(mottle_range.outputs["Result"], mottled.inputs["Factor"])
    link(base.outputs["Result"], mottled.inputs["A"])
    follicles = node(tree, "ShaderNodeTexVoronoi", (-900, -200), Scale=900.0, Randomness=1.0)
    link(coords, follicles.inputs["Vector"])
    follicle_range = node(tree, "ShaderNodeMapRange", (-700, -200), **{"From Min": 0.0, "From Max": 0.07, "To Min": 0.55, "To Max": 0.0})
    link(follicles.outputs["Distance"], follicle_range.inputs["Value"])
    dotted = mix_color(tree, (-50, 200))
    dotted.inputs["B"].default_value = (*srgb((120, 72, 52)), 1)
    link(follicle_range.outputs["Result"], dotted.inputs["Factor"])
    link(mottled.outputs["Result"], dotted.inputs["A"])
    return dotted, blotch


def relief(tree, coords):
    """Poros (Voronoi), linhas finas (ruído esticado) e irregularidade, somados numa altura."""
    link = tree.links.new
    pores = node(tree, "ShaderNodeTexVoronoi", (-900, -700), Scale=2600.0)
    pores.feature = "F1"
    link(coords, pores.inputs["Vector"])
    stretch = node(tree, "ShaderNodeMapping", (-1050, -950))
    stretch.inputs["Scale"].default_value = (1.0, 1.0, 0.25)
    link(coords, stretch.inputs["Vector"])
    lines = node(tree, "ShaderNodeTexNoise", (-900, -950), Scale=520.0, Detail=5.0, Roughness=0.62)
    link(stretch.outputs["Vector"], lines.inputs["Vector"])
    height = node(tree, "ShaderNodeMath", (-650, -800))
    height.operation = "MULTIPLY_ADD"
    link(pores.outputs["Distance"], height.inputs[0])
    height.inputs[1].default_value = 0.6
    link(lines.outputs["Fac"], height.inputs[2])
    return height


def apply(body, tone=TONE, name="Pele"):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    tree = material.node_tree
    tree.nodes.clear()
    link = tree.links.new
    bsdf = base_shader(tree)
    coords = node(tree, "ShaderNodeTexCoord", (-1200, 0)).outputs["Object"]
    colored, blotch = color_layers(tree, coords, tone)
    roughness = node(tree, "ShaderNodeMapRange", (-450, -450), **{"To Min": 0.5, "To Max": 0.66})   # fosca, nunca plástico
    link(blotch.outputs["Fac"], roughness.inputs["Value"])
    link(roughness.outputs["Result"], bsdf.inputs["Roughness"])
    bump = node(tree, "ShaderNodeBump", (800, -500), Strength=0.65, Distance=0.0003)
    link(bump.outputs["Normal"], bsdf.inputs["Normal"])
    detail_color = mix_color(tree, (850, 200))
    detail_color.name = "DetalheCor"
    detail_color.inputs["Factor"].default_value = 0.0
    link(colored.outputs["Result"], detail_color.inputs["A"])
    link(detail_color.outputs["Result"], bsdf.inputs["Base Color"])
    detail_height = node(tree, "ShaderNodeMath", (600, -700))
    detail_height.name = "DetalheAltura"
    detail_height.operation = "ADD"
    detail_height.inputs[1].default_value = 0.0
    link(relief(tree, coords).outputs["Value"], detail_height.inputs[0])
    link(detail_height.outputs["Value"], bump.inputs["Height"])
    body.data.materials.clear()
    body.data.materials.append(material)
    print("PASSO pele: em código, subsurface random walk, poros e linhas em relevo")
    return material
