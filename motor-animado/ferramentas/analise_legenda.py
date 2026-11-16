"""A legenda e os outros textos na tela, lidos pelo Vision da Apple (usada pelo decupar.py).

Mede: quantas palavras por vez, a altura na tela (em px de um quadro 1080x1920), o tamanho da letra, a cor do texto
e do contorno, a cor de destaque, se é tudo maiúsculo, quanto a legenda adianta ou atrasa em relação à voz,
e os textos que não são legenda (etiquetas, cards, títulos) com o tempo e a posição.
"""
import re
from collections import Counter
from pathlib import Path

import cv2
import numpy as np

from analise_tomadas import hex_color

HEIGHT = 1920
MIN_CONFIDENCE = 0.5


def text_boxes(vision_frames):
    rows = []
    for frame in vision_frames:
        for item in frame.get("texts", []):
            if item["confidence"] >= MIN_CONFIDENCE and re.search(r"\w", item["text"]):
                rows.append({"t": frame["t"], "file": frame["file"], "text": item["text"].strip(), "box": item["box"]})
    return rows


def caption_band(rows):
    """A faixa de altura onde o texto mais muda de um quadro para o outro: é a legenda."""
    if not rows:
        return None
    bins = Counter(round(r["box"][1] + r["box"][3] / 2, 1) for r in rows)
    changes = Counter()
    for band in bins:
        texts = [r["text"] for r in rows if round(r["box"][1] + r["box"][3] / 2, 1) == band]
        changes[band] = len(set(texts))
    band = changes.most_common(1)[0][0]
    return band if changes[band] >= 4 else None


def ink_colors(file, box):
    """As cores dentro da caixa do texto: o contorno é o grupo mais escuro; o preenchimento, o mais claro e saturado."""
    image = cv2.imread(file)
    if image is None:
        return None
    h, w = image.shape[:2]
    x, y, bw, bh = int(box[0] * w), int(box[1] * h), max(2, int(box[2] * w)), max(2, int(box[3] * h))
    pixels = image[y:y + bh, x:x + bw].reshape(-1, 3).astype(np.float32)
    if len(pixels) < 20:
        return None
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 15, 1.0)
    _, _, centers = cv2.kmeans(pixels, 3, None, criteria, 2, cv2.KMEANS_PP_CENTERS)
    luminance = [0.114 * c[0] + 0.587 * c[1] + 0.299 * c[2] for c in centers]
    return {"fill": hex_color(centers[int(np.argmax(luminance))]), "stroke": hex_color(centers[int(np.argmin(luminance))])}


def caption_changes(captions):
    changes, last = [], None
    for row in sorted(captions, key=lambda r: r["t"]):
        if row["text"] != last:
            changes.append(row)
            last = row["text"]
    return changes


def sync_offset(changes, words):
    """Quanto cada troca de legenda acontece antes (negativo) ou depois da palavra mais perto na voz."""
    starts = np.array([w["start"] for w in words]) if words else np.array([])
    if not len(starts):
        return None
    offsets = [float(c["t"] - starts[np.abs(starts - c["t"]).argmin()]) for c in changes]
    return round(float(np.median(offsets)), 2)


def rgb(hex_value):
    return np.array([int(hex_value[i:i + 2], 16) for i in (1, 3, 5)], dtype=float)


def color_groups(fills, same=50):
    """Junta cores de preenchimento parecidas (distância RGB < same) e conta cada grupo."""
    groups = []
    for fill in fills:
        group = next((g for g in groups if np.linalg.norm(rgb(g["color"]) - rgb(fill)) < same), None)
        if group:
            group["count"] += 1
        else:
            groups.append({"color": fill, "count": 1})
    return sorted(groups, key=lambda g: -g["count"])


def measure_captions(captions, words):
    changes = caption_changes(captions)
    word_counts = [len(c["text"].split()) for c in changes]
    heights = [c["box"][3] * HEIGHT for c in changes]
    colors = [ink_colors(c["file"], c["box"]) for c in changes[:60]]
    colors = [c for c in colors if c]
    groups = color_groups([c["fill"] for c in colors])
    main_fill = groups[0]["color"] if groups else None
    highlight = next((g["color"] for g in groups[1:] if np.linalg.norm(rgb(g["color"]) - rgb(main_fill)) > 80), None)
    letters = "".join(c["text"] for c in changes)
    upper = sum(ch.isupper() for ch in letters) / max(1, sum(ch.isalpha() for ch in letters))
    # calibrado no gabarito: a caixa do Vision tem ~0,92 da letra em MAIÚSCULAS e ~1,15 com minúsculas (descendentes)
    box_per_font = 0.92 if upper > 0.8 else 1.15
    return {"words_per_caption": int(np.median(word_counts)) if word_counts else None,
            "top_px": int(np.median([c["box"][1] for c in changes]) * HEIGHT) if changes else None,
            "font_px": int(np.median(heights) / box_per_font) if heights else None,
            "color": main_fill, "stroke": Counter(c["stroke"] for c in colors).most_common(1)[0][0] if colors else None,
            "highlight": highlight, "uppercase": upper > 0.8, "changes": len(changes),
            "sync_offset_seconds": sync_offset(changes, words), "examples": [c["text"] for c in changes[:12]]}


def other_texts(rows, band):
    """Textos fora da faixa da legenda, juntando aparições seguidas do mesmo texto: etiquetas, cards, títulos."""
    found = {}
    for row in sorted((r for r in rows if band is None or abs(r["box"][1] + r["box"][3] / 2 - band) > 0.06), key=lambda r: r["t"]):
        key = row["text"].lower()
        item = found.setdefault(key, {"text": row["text"], "from": row["t"], "to": row["t"], "box": row["box"]})
        item["to"] = row["t"]
    return sorted(found.values(), key=lambda i: i["from"])[:40]


def analyze_text(vision_frames, words):
    rows = text_boxes(vision_frames)
    band = caption_band(rows)
    captions = [r for r in rows if band is not None and abs(r["box"][1] + r["box"][3] / 2 - band) <= 0.06]
    result = {"band_center": band, "captions": measure_captions(captions, words) if captions else None,
              "other_texts": other_texts(rows, band)}
    result["works_without_sound"] = bool(captions) and (result["captions"]["changes"] >= 0.5 * max(1, len(words) / 3))
    return result
