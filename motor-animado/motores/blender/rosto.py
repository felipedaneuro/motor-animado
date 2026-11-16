"""O rosto em código: os olhos (da geometria-guia do MPFB, com íris, pupila e brilho molhado), os cílios, e as regiões
onde nascem as sobrancelhas e o cabelo (para o pelos.py). Tudo medido a partir dos pontos do próprio corpo.
O MPFB cria a pessoa virada para -Y: a frente do rosto tem normal com y negativo.
"""
import bpy
import numpy as np
from mathutils import Matrix

import humano
from pele import node, srgb

EYE_RADIUS = 0.012   # o olho de verdade tem ~12 mm de raio; a guia do MPFB é um pouco maior


def landmarks(body):
    positions = humano.full_positions(body)
    left, right = humano.group_center(body, "helper-l-eye", positions), humano.group_center(body, "helper-r-eye", positions)
    top = humano.group_center(body, "joint-head-2", positions)
    base = humano.group_center(body, "joint-head", positions)
    return {"positions": positions, "eye_l": left, "eye_r": right, "eye_z": (left.z + right.z) / 2,
            "head_top": top, "head_base": base, "head_center": (left + right) / 2 * 0.3 + (top + base) / 2 * 0.7}


def eye_material(iris_rgb):
    """Esclera clara, íris com raios, pupila escura e uma camada de verniz (o brilho molhado do olho)."""
    material = bpy.data.materials.new("Olho")
    material.use_nodes = True
    tree = material.node_tree
    tree.nodes.clear()
    link = tree.links.new
    out = node(tree, "ShaderNodeOutputMaterial", (900, 0))
    bsdf = node(tree, "ShaderNodeBsdfPrincipled", (600, 0), Roughness=0.25)
    bsdf.inputs["Coat Weight"].default_value = 1.0
    bsdf.inputs["Coat Roughness"].default_value = 0.02
    link(bsdf.outputs["BSDF"], out.inputs["Surface"])
    coords = node(tree, "ShaderNodeTexCoord", (-900, 0)).outputs["Object"]
    separate = node(tree, "ShaderNodeSeparateXYZ", (-700, 0))
    link(coords, separate.inputs["Vector"])
    radial = node(tree, "ShaderNodeVectorMath", (-500, 100))
    radial.operation = "LENGTH"
    flatten = node(tree, "ShaderNodeCombineXYZ", (-650, 150))
    link(separate.outputs["X"], flatten.inputs["X"])
    link(separate.outputs["Z"], flatten.inputs["Z"])
    link(flatten.outputs["Vector"], radial.inputs[0])
    ramp = node(tree, "ShaderNodeValToRGB", (-250, 100))
    stops = [(0.0, (8, 6, 5)), (0.0021, (8, 6, 5)), (0.0026, iris_rgb), (0.0050, tuple(int(c * 0.6) for c in iris_rgb)),
             (0.0058, (40, 28, 20)), (0.0064, (236, 230, 226)), (0.03, (222, 214, 210))]
    elements = ramp.color_ramp.elements
    while len(elements) < len(stops):
        elements.new(0.5)
    for element, (position, rgb) in zip(elements, stops):
        element.position = position / 0.03
        element.color = (*srgb(rgb), 1)
    scale = node(tree, "ShaderNodeMath", (-400, 100))
    scale.operation = "DIVIDE"
    link(radial.outputs["Value"], scale.inputs[0])
    scale.inputs[1].default_value = 0.03
    link(scale.outputs["Value"], ramp.inputs["Fac"])
    link(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    return material


def build_eyes(body, marks, iris_hex="#5a3a22"):
    iris = tuple(int(iris_hex[i:i + 2], 16) for i in (1, 3, 5))
    material = eye_material(iris)
    eyes = []
    for side, group in (("E", "helper-l-eye"), ("D", "helper-r-eye")):
        eye = humano.extract_helper(body, [group], f"Olho{side}", marks["positions"])
        center = marks["eye_l"] if side == "E" else marks["eye_r"]
        eye.data.transform(Matrix.Translation(-center))
        eye.location = center
        eye.data.materials.append(material)   # as coordenadas do objeto partem do centro do olho: a íris fica em -Y
        eyes.append(eye)
    lashes = humano.extract_helper(body, ["helper-l-eyelashes-2", "helper-r-eyelashes-2"],
                                   "Cilios", marks["positions"])
    lash_material = bpy.data.materials.new("CiliosMat")
    lash_material.use_nodes = True
    lash_material.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*srgb((22, 16, 12)), 1)
    lashes.data.materials.append(lash_material)
    print("PASSO olhos: esclera, íris, pupila e brilho; cílios")
    return eyes, lashes


def scalp(marks):
    """Onde nasce o cabelo: a linha da testa em curva (as entradas sobem nas têmporas), costeletas na frente das
    orelhas, os lados acima das orelhas e a nuca atrás."""
    center, eye_z, base_z = np.array(marks["head_center"]), marks["eye_z"], marks["head_base"].z

    def keep(centers, normals):
        x, y, z = centers[:, 0], centers[:, 1], centers[:, 2]
        near = np.linalg.norm(centers - center, axis=1) < 0.17
        front, back = normals[:, 1] < -0.35, normals[:, 1] > 0.3
        side = ~front & ~back
        hairline = eye_z + 0.062 + 0.02 * np.clip(np.abs(x) / 0.055, 0, 1) ** 2
        sideburn = (np.abs(x) > 0.062) & (y < center[1] - 0.005) & (y > center[1] - 0.04) & (z > eye_z - 0.012)
        above_ear = z > eye_z + 0.03
        return near & ((front & (z > hairline)) | (side & (above_ear | sideburn)) | (back & (z > base_z + 0.03)))
    return keep


def eyebrow(marks, side):
    """O arco acima do olho (side "l" ou "r"): mais alto e mais grosso perto do meio, afinando na ponta de fora.
    Penteie para fora: comb=(±1, 0, 0.25)."""
    eye = np.array(marks["eye_l"] if side == "l" else marks["eye_r"])
    sign = 1.0 if eye[0] > 0 else -1.0

    def keep(centers, normals):
        across = (centers[:, 0] - eye[0]) * sign / 0.026          # -1 perto do nariz, +1 na ponta de fora
        inside = (across > -0.85) & (across < 1.0) & (normals[:, 1] < -0.35)
        middle = eye[2] + 0.0135 + 0.0045 * (1 - (across - 0.1) ** 2)
        half = 0.0034 * (1 - 0.55 * np.clip(across, 0, 1)) + 0.0006
        return inside & (np.abs(centers[:, 2] - middle) < half)
    return keep


def comb_from_crown(marks):
    """O penteado natural: atrás e nos lados os fios saem do redemoinho (atrás e em cima) e caem um pouco; na frente
    eles vão para trás e para cima, sem franja caindo na testa."""
    center = np.array(marks["head_center"])
    crown = center + np.array([0.0, 0.055, 0.085])

    def comb(roots):
        away = roots - crown
        away /= np.maximum(np.linalg.norm(away, axis=1, keepdims=True), 1e-9)
        front = np.clip((center[1] - roots[:, 1] - 0.02) / 0.05, 0, 1)[:, None]
        return (away + np.array([0.0, 0.0, -0.35])) * (1 - front) + np.array([0.0, 0.8, 0.45]) * front
    return comb
