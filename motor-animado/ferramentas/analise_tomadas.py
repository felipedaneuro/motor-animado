"""Tomadas, paleta e enquadramento: a parte visual da decupagem que dá para medir (usada pelo decupar.py).

- tomadas: o vídeo dividido nos cortes; de cada tomada, os quadros de início, meio e fim
- paleta: as 5 cores que mais aparecem em cada tomada (k-means) e no vídeo todo, com brilho e saturação
- fundo: as cores de cima e de baixo do quadro (o degradê dos estilos de fundo limpo)
- enquadramento: onde fica o que chama a atenção, o tamanho das pessoas e dos rostos (do Vision da Apple)
"""
import subprocess
from pathlib import Path

import cv2
import numpy as np


def hex_color(bgr):
    b, g, r = (int(round(x)) for x in bgr)
    return f"#{r:02x}{g:02x}{b:02x}"


def shots_from_cuts(cuts, duration):
    edges = [0.0] + [c for c in cuts if 0 < c < duration] + [duration]
    return [{"index": i + 1, "start": round(a, 2), "end": round(b, 2)} for i, (a, b) in enumerate(zip(edges, edges[1:])) if b - a > 0.05]


def grab_frame(video, seconds, target):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{seconds:.3f}", "-i", str(video), "-frames:v", "1",
                    "-vf", "scale=540:-2", str(target)], check=True)
    return cv2.imread(str(target))


def palette(image, count=5):
    pixels = cv2.resize(image, (90, 160), interpolation=cv2.INTER_AREA).reshape(-1, 3).astype(np.float32)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, labels, centers = cv2.kmeans(pixels, count, None, criteria, 3, cv2.KMEANS_PP_CENTERS)
    shares = np.bincount(labels.ravel(), minlength=count) / len(labels)
    order = np.argsort(-shares)
    return [{"color": hex_color(centers[i]), "share": round(float(shares[i]), 3)} for i in order]


def light_and_color(image):
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    return {"brightness": round(float(hsv[..., 2].mean()) / 255, 3), "saturation": round(float(hsv[..., 1].mean()) / 255, 3)}


def background_gradient(image):
    """A cor mediana da faixa de cima (10%) e da de baixo (10%) do quadro."""
    h = image.shape[0]
    top = np.median(image[: h // 10].reshape(-1, 3), axis=0)
    bottom = np.median(image[-h // 10:].reshape(-1, 3), axis=0)
    return {"top": hex_color(top), "bottom": hex_color(bottom)}


def describe_shots(video, cuts, duration, folder):
    """Para cada tomada: três quadros salvos em folder, a paleta e a luz do quadro do meio."""
    folder = Path(folder)
    folder.mkdir(parents=True, exist_ok=True)
    shots = shots_from_cuts(cuts, duration)
    for shot in shots:
        span = shot["end"] - shot["start"]
        moments = {"inicio": shot["start"] + min(0.1, span / 4), "meio": shot["start"] + span / 2, "fim": shot["end"] - min(0.1, span / 4)}
        images = {name: grab_frame(video, t, folder / f"tomada{shot['index']:02d}-{name}.jpg") for name, t in moments.items()}
        middle = images["meio"]
        shot.update(palette=palette(middle), gradient=background_gradient(middle), **light_and_color(middle),
                    frames=[f"tomada{shot['index']:02d}-{name}.jpg" for name in moments])
    return shots


def overall_palette(shots):
    """As cores do vídeo todo, pesadas pela duração de cada tomada (cores parecidas se juntam)."""
    weights = {}
    for shot in shots:
        span = shot["end"] - shot["start"]
        for entry in shot["palette"]:
            key = entry["color"][:2] + entry["color"][3] + entry["color"][5]   # agrupa por tom aproximado
            current = weights.setdefault(key, {"color": entry["color"], "weight": 0.0})
            current["weight"] += entry["share"] * span
    total = sum(w["weight"] for w in weights.values()) or 1
    ranked = sorted(weights.values(), key=lambda w: -w["weight"])[:8]
    return [{"color": w["color"], "share": round(w["weight"] / total, 3)} for w in ranked]


def framing(vision_frames, shots):
    """Por tomada: o centro mediano do que chama a atenção, a altura mediana das pessoas e se há rostos."""
    for shot in shots:
        inside = [f for f in vision_frames if shot["start"] <= f["t"] < shot["end"]]
        centers = [(b[0] + b[2] / 2, b[1] + b[3] / 2) for f in inside for b in f.get("attention", [])[:1]]
        heights = [b[3] for f in inside for b in f.get("humans", [])]
        shot["focus_center"] = [round(float(np.median([c[0] for c in centers])), 2), round(float(np.median([c[1] for c in centers])), 2)] if centers else None
        shot["person_height"] = round(float(np.median(heights)), 2) if heights else None
        shot["has_faces"] = any(f.get("faces") for f in inside)
    return shots
