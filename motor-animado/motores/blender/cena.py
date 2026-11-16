"""A cena realista no Blender, toda em código: corpo (MPFB), pele, olhos, sobrancelhas, cabelo ou pelos, luz, câmera
na curva medida (ou num avanço suave) e o render no Cycles na GPU do Mac (Metal).

Não rode direto: use  ferramentas/py blender.py  (ele acha o estilo e chama o Blender com as opções certas).
Dentro do Blender: Blender -b -P cena.py -- --estilo <estilo.json> --pasta <pasta do vídeo> [opções]
  --still 1,60       renderiza só esses quadros, em stills/<saida>-q<n>.png (e diz quanto o vídeo inteiro vai levar)
  --anim             todos os quadros, em renders/quadros/   (--quadros 1-150 para um trecho)
  --samples 40       --escala 75 (% de 1080x1920)   --segundos 10   --curva <json da câmera medida>   --salvar

O assunto do vídeo: um assunto.py na pasta do vídeo com montar(c) roda depois do corpo, da pele e do rosto e antes
dos fios, da luz e da câmera. c traz: corpo, rig, pele, ponto, normal, fora, cima, bvh, quadros, fps, marcas,
filtro_pelos. Arquivos humano.py, pele.py, pelos.py ou rosto.py na pasta do vídeo valem mais que os do motor.
"""
import json
import math
import os
import sys
import time

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 30


def options():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    found = {"estilo": None, "pasta": os.getcwd(), "still": None, "saida": "teste", "anim": False, "quadros": None,
             "samples": 40, "escala": 75, "segundos": 10.0, "curva": None, "salvar": False, "denoise": "1"}
    i = 0
    while i < len(args):
        key = args[i][2:]
        if key in ("anim", "salvar"):
            found[key], i = True, i + 1
            continue
        value = args[i + 1]
        found[key] = ([int(x) for x in value.split(",")] if key == "still" else [int(x) for x in value.split("-")] if key == "quadros"
                      else int(value) if key in ("samples", "escala") else float(value) if key == "segundos" else value)
        i += 2
    return found


def srgb(rgb):
    return [x / 255 if x / 255 <= 0.04045 else ((x / 255 + 0.055) / 1.055) ** 2.4 for x in rgb]


def hex_rgb(value):
    return [int(value[i:i + 2], 16) for i in (1, 3, 5)]


def clear():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj)
    for collection in (bpy.data.meshes, bpy.data.materials, bpy.data.curves, bpy.data.cameras, bpy.data.lights, bpy.data.images,
                       bpy.data.node_groups, bpy.data.hair_curves):
        for item in list(collection):
            collection.remove(item)


def world(cfg):
    """O céu HDR ilumina; a câmera vê só um degradê limpo (as duas cores medidas na referência)."""
    w = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    bpy.context.scene.world = w
    w.use_nodes = True
    tree = w.node_tree
    tree.nodes.clear()
    link = tree.links.new
    out, coords = tree.nodes.new("ShaderNodeOutputWorld"), tree.nodes.new("ShaderNodeTexCoord")
    light = tree.nodes.new("ShaderNodeBackground")
    hdri = os.path.join(HERE, cfg.get("hdri", "assets/studio_small_09_2k.hdr"))
    environment, mapping = tree.nodes.new("ShaderNodeTexEnvironment"), tree.nodes.new("ShaderNodeMapping")
    environment.image = bpy.data.images.load(hdri)
    mapping.inputs["Rotation"].default_value = (0, 0, math.radians(cfg.get("hdri_rotation", 200)))
    link(coords.outputs["Generated"], mapping.inputs["Vector"])
    link(mapping.outputs["Vector"], environment.inputs["Vector"])
    link(environment.outputs["Color"], light.inputs["Color"])
    light.inputs["Strength"].default_value = cfg.get("hdri_strength", 0.6)
    ramp = tree.nodes.new("ShaderNodeValToRGB")
    top, bottom = cfg.get("background", ["#3a4250", "#14171c"])
    ramp.color_ramp.elements[0].color = (*srgb(hex_rgb(bottom)), 1)
    ramp.color_ramp.elements[1].color = (*srgb(hex_rgb(top)), 1)
    separate = tree.nodes.new("ShaderNodeSeparateXYZ")
    link(coords.outputs["Window"], separate.inputs["Vector"])
    link(separate.outputs["Y"], ramp.inputs["Fac"])
    backdrop, path, mix = tree.nodes.new("ShaderNodeBackground"), tree.nodes.new("ShaderNodeLightPath"), tree.nodes.new("ShaderNodeMixShader")
    link(ramp.outputs["Color"], backdrop.inputs["Color"])
    link(path.outputs["Is Camera Ray"], mix.inputs["Fac"])
    link(light.outputs["Background"], mix.inputs[1])
    link(backdrop.outputs["Background"], mix.inputs[2])
    link(mix.outputs["Shader"], out.inputs["Surface"])
    print("PASSO mundo: luz do HDR", os.path.basename(hdri), "| fundo em degradê", top, "->", bottom)


def surface(body):
    """A pele como o Cycles vai ver (subdivisão nível 3), para achar pontos e plantar fios."""
    subdivision = body.modifiers["Subdiv"]
    subdivision.use_adaptive_subdivision = False
    subdivision.levels = 3
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = body.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    mesh.transform(body.matrix_world)
    verts = [v.co.copy() for v in mesh.vertices]
    polys = [p.vertices[:] for p in mesh.polygons]
    evaluated.to_mesh_clear()
    subdivision.levels = 1
    subdivision.use_adaptive_subdivision = True
    print("PASSO superfície:", len(polys), "faces")
    return BVHTree.FromPolygons(verts, polys), verts, polys


def outward(turn_degrees):
    """De onde a câmera olha, girando em volta do corpo: 0 = de frente (o MPFB olha para -Y), 90 = do lado esquerdo dela."""
    g = math.radians(turn_degrees)
    return Vector((math.sin(g), -math.cos(g), 0.0))


def focus_point(cfg, rig, bvh, marks):
    """O ponto onde a câmera chega. Cabeça: entre os olhos. Membro: na pele, no osso e na altura/fração pedidos."""
    focus = cfg["focus"]
    out = outward(focus.get("turn", 0))
    if cfg["framing"] == "head":
        point = (marks["eye_l"] + marks["eye_r"]) / 2 + Vector((0, 0, focus.get("lift", -0.01)))
        return point, out, out, Vector((0, 0, 1))
    bone = rig.pose.bones[focus["bone"]]
    head, tail = rig.matrix_world @ bone.head, rig.matrix_world @ bone.tail
    along = focus["fraction"] if focus.get("fraction") is not None else (head.z - focus["height"]) / (head.z - tail.z)
    axis = head.lerp(tail, along)
    location, normal, _, _ = bvh.ray_cast(axis + out * 0.4, -out, 1.0)
    if location is None:
        raise SystemExit(f"não achei a pele em volta de {focus['bone']}: mude height, fraction ou turn em blender.focus")
    return location, normal, out, (head - tail).normalized()


def add_light(kind, name, energy, color, location=None, target=None, **settings):
    data = bpy.data.lights.new(name, kind)
    data.energy, data.color = energy, srgb(color)
    for key, value in settings.items():
        setattr(data, key, value)
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    if location is not None:
        obj.location = location
        obj.rotation_euler = (target - location).to_track_quat("-Z", "Y").to_euler()
    return obj


def lights(cfg, target, out):
    """Chave quente de cima e de um lado e contorno frio do outro. 'hard': sol quase duro (cada fio faz sombra nítida,
    bom para pele e pelos de perto); 'soft': uma área grande (retrato de rosto)."""
    right = Vector((0, 0, 1)).cross(out).normalized()
    to_light = (out * 0.55 - right * 0.6 + Vector((0, 0, 0.75))).normalized()
    if cfg.get("light", "soft") == "hard":
        sun = add_light("SUN", "Chave", 3.9, (255, 238, 218), angle=math.radians(2.5))
        sun.rotation_euler = (-to_light).to_track_quat("-Z", "Y").to_euler()
    else:
        add_light("AREA", "Chave", 55, (255, 240, 224), target + to_light * 0.9, target, size=cfg.get("key_size", 0.6))
    add_light("AREA", "Contorno", 45, (210, 230, 255), target - out * 0.6 - right * -0.45 + Vector((0, 0, 0.35)), target, size=0.4)
    print("PASSO luz:", cfg.get("light", "soft"), "com contorno frio")


def zoom_curve(path, frames, cfg):
    """A escala da imagem quadro a quadro. Com a curva medida (camera.py / decupar.py), cada quadro cresce o que cresceu
    na referência. Sem ela, um avanço suave: cfg.push_percent por quadro até cfg.push_until segundos, freando."""
    if path:
        data = json.load(open(path))
        scale = data["scale"]
        steps = [(b / a - 1) * 100 if a and abs(b / a - 1) < 0.08 else 0.0 for a, b in zip(scale, scale[1:])]
        print(f"PASSO câmera: curva medida em {os.path.basename(path)}, {len(steps)} quadros")
    else:
        rate, until = cfg.get("push_percent", 0.25), int(cfg.get("push_until", 4.0) * FPS)
        steps = [rate if f < until * 0.75 else max(0.0, rate * (until - f) / (until * 0.25)) for f in range(frames)]
        print(f"PASSO câmera: avanço de {rate}% por quadro, freando até {until / FPS:.1f} s")
    smooth = [sum(steps[max(0, i - 4):i + 5]) / len(steps[max(0, i - 4):i + 5]) for i in range(len(steps))] or [0.0]
    scale, value = [], 1.0
    for f in range(frames + 1):
        scale.append(value)
        value *= 1 + smooth[min(f, len(smooth) - 1)] / 100
    return scale


def camera(cfg, target, out, scale, frames):
    data = bpy.data.cameras.new("Camera")
    data.lens, data.sensor_width = cfg.get("lens", 70), 36
    data.dof.use_dof = True
    obj = bpy.data.objects.new("Camera", data)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.scene.camera = obj
    aim = bpy.data.objects.new("Mira", None)
    bpy.context.scene.collection.objects.link(aim)
    data.dof.focus_object = aim
    track = obj.constraints.new("TRACK_TO")
    track.target, track.track_axis, track.up_axis = aim, "TRACK_NEGATIVE_Z", "UP_Y"
    back = (out.normalized() + Vector((0, 0, cfg.get("camera_height", 0.06)))).normalized()
    distance, (f_far, f_near), closest = cfg.get("distance", 0.98), cfg.get("fstop", [4.0, 6.3]), max(scale)
    for f in range(frames + 1):
        obj.location = target + back * (distance / scale[f])
        obj.keyframe_insert("location", frame=f + 1)
        arrived = min(1.0, (scale[f] - 1) / (closest - 1)) if closest > 1.0001 else 1.0
        aim.location = target + Vector((0, 0, 0.03 * (1 - arrived)))
        aim.keyframe_insert("location", frame=f + 1)
        data.dof.aperture_fstop = f_far + (f_near - f_far) * arrived   # foco mais fundo quando chega perto
        data.dof.keyframe_insert("aperture_fstop", frame=f + 1)
    print(f"PASSO câmera: {data.lens:.0f} mm, de {distance:.2f} m a {distance / scale[-1]:.2f} m (cresce {scale[-1]:.2f}x)")
    return obj


def render_settings(o, cfg, frames):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    preferences = bpy.context.preferences.addons["cycles"].preferences
    preferences.compute_device_type = "METAL"     # a GPU do Mac com chip Apple
    preferences.get_devices()
    for device in preferences.devices:
        device.use = device.type == "METAL"
    scene.cycles.device = "GPU" if any(d.use for d in preferences.devices) else "CPU"
    scene.cycles.samples, scene.cycles.use_denoising = o["samples"], o["denoise"] != "0" and cfg.get("denoise", True)
    scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = 1080, 1920, o["escala"]
    scene.render.fps, scene.frame_start, scene.frame_end = FPS, 1, frames
    scene.render.use_motion_blur, scene.render.motion_blur_shutter = True, 0.5
    try:
        scene.view_settings.view_transform = "Khronos PBR Neutral"
    except TypeError:
        scene.view_settings.view_transform = "AgX"
    scene.cycles.use_adaptive_sampling, scene.cycles.adaptive_threshold = True, 0.02
    # o redutor de ruído apaga fios finos (cabelo, pelos): nos closes com fios, mais amostras e o grão natural
    print("PASSO render: Cycles,", "GPU Metal" if scene.cycles.device == "GPU" else "CPU", "|", o["samples"], "amostras |",
          f"{o['escala']}% de 1080x1920 |", "com" if scene.cycles.use_denoising else "sem", "redutor de ruído")


def grow_hair(cfg, verts, polys, marks, point, out, allowed):
    import pelos
    import rosto
    if cfg["framing"] == "head":
        if cfg.get("hair", "short") != "none":
            layers = pelos.SCALP_MEDIUM if cfg.get("hair") == "medium" else pelos.SCALP_SHORT
            pelos.grow(verts, polys, rosto.scalp(marks), recolor(layers, cfg), comb=rosto.comb_from_crown(marks), allowed=allowed)
        brows = [dict(name=f"Sobrancelha{side.upper()}", density=3600000, length=(0.005, 0.009), incline=(5, 12), swirl=14,
                      radius=(0.00005, 0.000015), points=4, gravity=0.0, melanin=0.88, redness=0.25, roughness=0.35) for side in "lr"]
        for side, layer in zip("lr", brows):
            pelos.grow(verts, polys, rosto.eyebrow(marks, side), [layer], comb=(1.0 if side == "l" else -1.0, 0.0, 0.25))
        return
    if cfg.get("body_hair", True):
        import numpy as np
        center, facing = np.array(point), np.array(out)

        def near(centers, normals):   # a 20 cm do ponto, virado para a câmera (sem nascer pelo no outro membro)
            return (np.linalg.norm(centers - center, axis=1) < 0.2) & (normals @ facing > -0.25)
        pelos.grow(verts, polys, near, pelos.BODY_HAIR, comb=(0.0, 0.0, -1.0), allowed=allowed)


def recolor(layers, cfg):
    tone = cfg.get("hair_melanin")
    return [dict(layer, melanin=tone) for layer in layers] if tone is not None else layers


def build(o, cfg, frames):
    """Monta a cena inteira e devolve a câmera."""
    import humano
    import pele
    import rosto
    body, rig = humano.create(cfg.get("body"), cfg.get("pose", "standing"))
    world(cfg)
    marks = rosto.landmarks(body) if cfg["framing"] == "head" else {}
    bvh, verts, polys = surface(body)
    point, normal, out, up = focus_point(cfg, rig, bvh, marks)
    skin = pele.apply(body, [tuple(c) for c in cfg.get("skin_tone", pele.TONE)])
    if cfg["framing"] == "head":
        rosto.build_eyes(body, marks, cfg.get("iris", "#5a3a22"))
    if cfg.get("clothes", "tshirt") == "tshirt":
        neck = marks["head_base"].z - 0.075 if marks else None
        humano.tshirt(body, cfg.get("shirt_color", "#2f4a6b"), neck_z=neck)
    context = dict(corpo=body, rig=rig, pele=skin, ponto=point, normal=normal, fora=out, cima=up, bvh=bvh, quadros=frames,
                   fps=FPS, marcas=marks, filtro_pelos=None)
    if os.path.exists(os.path.join(o["pasta"], "assunto.py")):
        import assunto
        assunto.montar(context)
        print("PASSO assunto: assunto.py montado")
    grow_hair(cfg, verts, polys, marks, context["ponto"], out, context["filtro_pelos"])
    lights(cfg, context["ponto"], out)
    curve = o["curva"] or (os.path.join(o["pasta"], cfg["curve"]) if cfg.get("curve") else None)
    return camera(cfg, context["ponto"], out, zoom_curve(curve, frames, cfg), frames)


def dice_once(cam, frames):
    """A pele é dividida uma vez, vista da posição mais perto da câmera, e os quadros reaproveitam (dados persistentes)."""
    scene = bpy.context.scene
    scene.frame_set(frames)
    dicing = bpy.data.objects.new("CameraDaDivisao", cam.data.copy())
    scene.collection.objects.link(dicing)
    dicing.matrix_world = cam.matrix_world.copy()
    scene.cycles.dicing_camera = dicing
    scene.render.use_persistent_data = True
    scene.frame_set(1)


def render_stills(o, frames):
    scene = bpy.context.scene
    for frame in o["still"]:
        scene.frame_set(frame)
        scene.render.filepath = os.path.join(o["pasta"], "stills", f"{o['saida']}-q{frame}.png")
        start = time.time()
        bpy.ops.render.render(write_still=True)
        seconds = time.time() - start
        print(f"QUADRO {frame}: {seconds:.1f} s, em {scene.render.filepath}. O vídeo inteiro ({frames} quadros) leva uns "
              f"{seconds * frames / 60:.0f} min nessas configurações")


def main():
    o = options()
    style = json.load(open(o["estilo"]))
    cfg = style["blender"]
    frames = int(round(o["segundos"] * FPS))
    sys.path.insert(0, HERE)
    sys.path.insert(0, o["pasta"])      # a pasta do vídeo vem primeiro: um pele.py ali vale mais que o do motor
    clear()
    cam = build(o, cfg, frames)
    render_settings(o, cfg, frames)
    dice_once(cam, frames)
    if o["salvar"]:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(o["pasta"], "cena.blend"))
        print("SALVO", os.path.join(o["pasta"], "cena.blend"))
    if o["still"]:
        render_stills(o, frames)
    if o["anim"]:
        scene = bpy.context.scene
        if o["quadros"]:
            scene.frame_start, scene.frame_end = o["quadros"]
        scene.render.filepath = os.path.join(o["pasta"], "renders", "quadros", "q")
        scene.render.image_settings.file_format = "PNG"
        bpy.ops.render.render(animation=True)
        print("QUADROS em", os.path.join(o["pasta"], "renders", "quadros"))


main()

