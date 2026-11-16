"""Pelos e cabelo como fios de verdade (o Cycles renderiza cada curva como um fio redondo).

Pelos do corpo (BODY_HAIR): duas camadas, como num close de verdade: curtos, escuros e densos (dão textura) e finos,
mais compridos e raros (pegam a luz de contorno na borda). Foi o passo que mais deixou a imagem real.
Cabelo (SCALP_SHORT, SCALP_MEDIUM): fios mais longos e com mais pontos, penteados numa direção e caindo com o peso.
Para mudar só num vídeo, copie para a pasta do vídeo e mude lá.
"""
import bpy
import numpy as np

RNG = np.random.default_rng(7)

# por camada: fios por m² (220.000 = 22 por cm²), comprimento em metros, inclinação na raiz em graus, desvio
# do penteado em graus, raio na raiz e na ponta, pontos por fio, peso (quanto a ponta cai), cor pela melanina
BODY_HAIR = [
    dict(name="PelosCurtos", density=220000, length=(0.0012, 0.0032), incline=(14, 30), swirl=22, radius=(0.00004, 0.000015),
         points=4, gravity=0.0, melanin=0.8, redness=0.35, roughness=0.42),
    dict(name="PelosFinos", density=50000, length=(0.004, 0.009), incline=(10, 24), swirl=28, radius=(0.00003, 0.00001),
         points=4, gravity=0.0, melanin=0.55, redness=0.4, roughness=0.36),
]
SCALP_SHORT = [
    dict(name="CabeloBase", density=2000000, length=(0.012, 0.03), incline=(18, 35), swirl=14, radius=(0.00004, 0.00002),
         points=6, gravity=0.35, melanin=0.92, redness=0.25, roughness=0.3),
    dict(name="CabeloSolto", density=45000, length=(0.02, 0.04), incline=(20, 35), swirl=25, radius=(0.000035, 0.000012),
         points=7, gravity=0.5, melanin=0.85, redness=0.3, roughness=0.28),
]
SCALP_MEDIUM = [
    dict(name="CabeloMedio", density=1100000, length=(0.06, 0.11), incline=(12, 25), swirl=10, radius=(0.00004, 0.000015),
         points=10, gravity=0.8, melanin=0.9, redness=0.3, roughness=0.3),
]


def quad_faces(verts, polys):
    V = np.asarray(verts, dtype=np.float64)
    P = np.asarray([p for p in polys if len(p) == 4], dtype=np.int64)
    a, b, c, d = V[P[:, 0]], V[P[:, 1]], V[P[:, 2]], V[P[:, 3]]
    normal = np.cross(c - a, d - b)
    area = np.linalg.norm(normal, axis=1) / 2
    normal = normal / np.maximum(np.linalg.norm(normal, axis=1, keepdims=True), 1e-12)
    return a, b, c, d, normal, area


def select_faces(faces, keep):
    """keep(centros, normais) -> máscara booleana. Ex.: só o couro cabeludo, só o lado da câmera."""
    a, b, c, d, normal, area = faces
    mask = np.asarray(keep((a + b + c + d) / 4, normal), dtype=bool)
    return a[mask], b[mask], c[mask], d[mask], normal[mask], area[mask]


def scatter(faces, count):
    a, b, c, d, normal, area = faces
    pick = RNG.choice(len(area), size=count, p=area / area.sum())
    u, v = RNG.random(count), RNG.random(count)
    points = (a[pick] * ((1 - u) * (1 - v))[:, None] + b[pick] * (u * (1 - v))[:, None]
              + c[pick] * (u * v)[:, None] + d[pick] * ((1 - u) * v)[:, None])
    return points, normal[pick]


def strands(roots, normals, layer, comb):
    """Cada fio sai da pele inclinado na direção do penteado e vai caindo com o peso até a ponta."""
    count, n = len(roots), layer["points"]
    comb = comb(roots) if callable(comb) else np.broadcast_to(np.asarray(comb, dtype=np.float64), roots.shape)
    tangent = comb - normals * np.sum(comb * normals, axis=1, keepdims=True)
    tangent /= np.maximum(np.linalg.norm(tangent, axis=1, keepdims=True), 1e-9)
    side = np.cross(normals, tangent)
    turn = np.radians(RNG.normal(0, layer["swirl"], count))[:, None]
    tangent = tangent * np.cos(turn) + side * np.sin(turn)
    length = RNG.uniform(*layer["length"], count)[:, None]
    incline = np.radians(RNG.uniform(*layer["incline"], count))[:, None]
    down = np.array([0.0, 0.0, -1.0])
    points = [roots - normals * 0.00008]
    for k in range(1, n):
        u = k / (n - 1)
        direction = tangent * np.cos(incline * (1 - u)) + normals * np.sin(incline * (1 - u)) + down * layer["gravity"] * u
        direction /= np.linalg.norm(direction, axis=1, keepdims=True)
        points.append(points[-1] + direction * length / (n - 1))
    return np.stack(points, axis=1)


def hair_material(name, layer):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    tree = material.node_tree
    for item in list(tree.nodes):
        if item.type != "OUTPUT_MATERIAL":
            tree.nodes.remove(item)
    shader = tree.nodes.new("ShaderNodeBsdfHairPrincipled")
    shader.parametrization = "MELANIN"
    shader.inputs["Melanin"].default_value = layer["melanin"]
    shader.inputs["Melanin Redness"].default_value = layer["redness"]
    shader.inputs["Roughness"].default_value = layer["roughness"]
    shader.inputs["Random Roughness"].default_value = 0.3
    shader.inputs["Random Color"].default_value = 0.25
    out = next(x for x in tree.nodes if x.type == "OUTPUT_MATERIAL")
    tree.links.new(shader.outputs[0], out.inputs["Surface"])
    return material


def curves_object(name, points, radius, material):
    count, n = points.shape[0], points.shape[1]
    curves = bpy.data.hair_curves.new(name)
    curves.add_curves([n] * count)
    curves.position_data.foreach_set("vector", points.reshape(-1).astype(np.float32))
    attribute = curves.attributes.get("radius") or curves.attributes.new("radius", "FLOAT", "POINT")
    attribute.data.foreach_set("value", np.tile(np.linspace(radius[0], radius[1], n), count).astype(np.float32))
    curves.materials.append(material)
    obj = bpy.data.objects.new(name, curves)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def grow(verts, polys, keep, layers, comb=(0.0, 0.0, -1.0), allowed=None, max_strands=2_500_000):
    """keep: escolhe as faces; comb: a direção do penteado (um vetor, ou uma função dos pontos N x 3); allowed: uma função do assunto que recebe os pontos (N x 3) e diz onde pode ter fio
    (é como o pelo fica fora de um corte ou de uma cicatriz). Devolve quantos fios saíram em cada camada."""
    faces = select_faces(quad_faces(verts, polys), keep)
    if not len(faces[5]):
        raise SystemExit("nenhuma face escolhida para os fios: confira a região (keep)")
    total, made = faces[5].sum(), []
    for layer in layers:
        roots, normals = scatter(faces, min(max_strands, int(total * layer["density"])))
        if allowed is not None:
            ok = np.asarray(allowed(roots), dtype=bool)
            roots, normals = roots[ok], normals[ok]
        curves_object(layer["name"], strands(roots, normals, layer, comb), layer["radius"], hair_material(layer["name"] + "Mat", layer))
        made.append(f"{len(roots)} {layer['name']}")
    print(f"PASSO fios: {', '.join(made)} em {total * 1e4:.0f} cm²")
    return made
