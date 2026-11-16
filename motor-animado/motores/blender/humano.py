"""O corpo: uma pessoa do MPFB (código aberto, extensão oficial do Blender), com rig, pose e subdivisão adaptativa.

Instale uma vez, de graça e sem conta:  Blender --online-mode -c extension install mpfb --enable
O MPFB cria a pessoa virada para -Y, em metros. Ela vem sem olhos, sobrancelhas e cabelo prontos (são pacotes à parte):
os olhos saem da geometria-guia que o próprio corpo traz (rosto.py), e sobrancelhas e cabelo são fios (pelos.py).
Para mudar o corpo só num vídeo, copie este arquivo para a pasta do vídeo e mude lá: a cópia da pasta vale mais.
"""
import math

import bmesh
import bpy
from mathutils import Vector

try:
    from bl_ext.blender_org.mpfb.services.humanservice import HumanService
except ImportError:
    raise SystemExit("falta o MPFB: rode  /Applications/Blender.app/Contents/MacOS/Blender --online-mode -c extension install mpfb --enable")

# cada valor vai de 0 a 1 (gender: 1 homem, 0 mulher; age 0.5 é um adulto de ~25; 0.75 ~ 50 anos)
DEFAULT_BODY = {"gender": 1.0, "age": 0.45, "muscle": 0.6, "weight": 0.5, "proportions": 0.6, "height": 0.55,
                "cupsize": 0.5, "firmness": 0.5, "race": {"asian": 0.33, "caucasian": 0.34, "african": 0.33}}

# poses medidas: antes de girar outra parte, meça onde ela está e onde precisa chegar (girar no olho erra a pose)
POSES = {
    "standing": {"thigh_l": (3, 0, 5), "thigh_r": (3, 0, -5)},      # pés juntos embaixo do quadril (o MPFB abre 40 cm)
    "step": {"thigh_l": (10, 0, 5), "foot_l": (-6, 0, 0), "thigh_r": (-11, 0, -5), "calf_r": (6, 0, 0), "foot_r": (4, 0, 0)},
    "arms_down": {"thigh_l": (3, 0, 5), "thigh_r": (3, 0, -5), "upperarm_l": (0, 0, -55), "upperarm_r": (0, 0, 55)},
}


def rotate(rig, bone, x=0.0, y=0.0, z=0.0):
    pose_bone = rig.pose.bones[bone]
    pose_bone.rotation_mode = "XYZ"
    pose_bone.rotation_euler = (math.radians(x), math.radians(y), math.radians(z))


def create(body_settings=None, pose="standing"):
    settings = {**DEFAULT_BODY, **(body_settings or {})}
    body = HumanService.create_human(macro_detail_dict=settings, feet_on_ground=True, scale=0.1)
    body.name = "Corpo"
    rig = HumanService.add_builtin_rig(body, "game_engine", import_weights=True)
    rig.name = "Rig"
    bpy.context.view_layer.objects.active = rig
    for bone, angles in POSES[pose].items():
        if bone in rig.pose.bones:
            rotate(rig, bone, *angles)
    subdivision = body.modifiers.new("Subdiv", "SUBSURF")
    subdivision.levels = 1
    subdivision.render_levels = 2
    subdivision.use_adaptive_subdivision = True   # perto da câmera, a pele é dividida até o tamanho de um pixel
    subdivision.adaptive_pixel_size = 1.0
    print(f"PASSO corpo: MPFB com rig game_engine, pose {pose}; subdivisão adaptativa")
    return body, rig


def full_positions(body):
    """As posições de todos os vértices com as formas do corpo aplicadas, incluindo a geometria-guia escondida."""
    mask = body.modifiers.get("Hide helpers")
    others = [m for m in body.modifiers if m != mask]
    states = [(m, m.show_viewport) for m in body.modifiers]
    for modifier in [mask] + others:
        if modifier:
            modifier.show_viewport = False
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = body.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    positions = [body.matrix_world @ v.co for v in mesh.vertices]
    evaluated.to_mesh_clear()
    for modifier, shown in states:
        modifier.show_viewport = shown
    return positions


def group_vertices(body, names):
    wanted = {body.vertex_groups[n].index for n in names if n in body.vertex_groups}
    return {v.index for v in body.data.vertices if any(g.group in wanted and g.weight > 0.5 for g in v.groups)}


def extract_helper(body, groups, name, positions=None):
    """Um objeto novo com só a geometria-guia desses grupos (os olhos, os cílios), nas formas do corpo."""
    positions = positions or full_positions(body)
    keep = group_vertices(body, groups)
    mesh = bpy.data.meshes.new(name)
    work = bmesh.new()
    index = {}
    for i in sorted(keep):
        index[i] = work.verts.new(positions[i])
    for polygon in body.data.polygons:
        if all(v in keep for v in polygon.vertices):
            work.faces.new([index[v] for v in polygon.vertices])
    work.to_mesh(mesh)
    work.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    return obj


def posed_mesh_object(body, name):
    """Uma cópia da pele na pose (com o rig, sem a subdivisão e sem a geometria-guia): a base para roupas."""
    subdivision = body.modifiers.get("Subdiv")
    if subdivision:
        subdivision.show_viewport = False
    depsgraph = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(body.evaluated_get(depsgraph))
    if subdivision:
        subdivision.show_viewport = True
    obj = bpy.data.objects.new(name, mesh)
    obj.matrix_world = body.matrix_world.copy()
    bpy.context.scene.collection.objects.link(obj)
    return obj


def fabric_material(name, hex_color):
    rgb = [int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    tree = material.node_tree
    bsdf = tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*[c ** 2.2 for c in rgb], 1)
    bsdf.inputs["Roughness"].default_value = 0.85
    bsdf.inputs["Sheen Weight"].default_value = 0.4   # o brilho aveludado do algodão na borda
    weave = tree.nodes.new("ShaderNodeTexNoise")
    weave.inputs["Scale"].default_value = 4000.0
    bump = tree.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.15
    tree.links.new(weave.outputs["Fac"], bump.inputs["Height"])
    tree.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return material


def tshirt(body, hex_color="#2f4a6b", neck_z=None, waist_z=0.95, sleeve_x=0.3):
    """Uma camiseta cortada do próprio corpo (serve por construção): do quadril à base do pescoço, mangas curtas."""
    shirt = posed_mesh_object(body, "Camiseta")
    neck_z = neck_z or 1.43
    work = bmesh.new()
    work.from_mesh(shirt.data)
    # cortes retos com um plano (a gola e a barra não ficam serrilhadas pela malha)
    for z, keep_below in ((neck_z, True), (waist_z, False)):
        geometry = work.verts[:] + work.edges[:] + work.faces[:]
        bmesh.ops.bisect_plane(work, geom=geometry, plane_co=(0, 0, z), plane_no=(0, 0, 1), clear_outer=keep_below, clear_inner=not keep_below)
    sleeves = [v for v in work.verts if abs(v.co.x) > sleeve_x]
    bmesh.ops.delete(work, geom=sleeves, context="VERTS")
    work.to_mesh(shirt.data)
    work.free()
    for polygon in shirt.data.polygons:
        polygon.use_smooth = True
    push = shirt.modifiers.new("Folga", "DISPLACE")
    push.strength, push.mid_level = 0.006, 0.0      # 6 mm de folga em volta da pele
    thickness = shirt.modifiers.new("Espessura", "SOLIDIFY")
    thickness.thickness = 0.003
    smooth = shirt.modifiers.new("Suave", "SUBSURF")
    smooth.levels = smooth.render_levels = 2
    shirt.data.materials.clear()   # a cópia vem com o material da pele
    shirt.data.materials.append(fabric_material("Algodao", hex_color))
    print(f"PASSO roupa: camiseta {hex_color} cortada do corpo")
    return shirt


def group_center(body, group, positions=None):
    positions = positions or full_positions(body)
    vertices = group_vertices(body, [group])
    return sum((positions[i] for i in vertices), Vector()) / max(1, len(vertices))
