"""Cria um estilo novo em estilos/<nome>/ a partir da decupagem (decupar.py), já com os números medidos.

Uso: ferramentas/py novo_estilo.py decupagem/<nome> [--motor web|blender] [--sobrescrever]

Escreve, a partir de estilos/_modelo/:
  estilo.json   câmera (jeito, duração, cortes), legenda (palavras por vez, posição, tamanho, cores), fundo, paleta,
                som (música, whooshes) e a régua da referência (frases, cortes, movimentos) para o encaixar.py e o comparar.py
  receita.md    a receita com os números e as partes [OLHAR] que o Claude completa olhando as folhas
  kit.js        as peças próprias do estilo (começa com o básico; o Claude acrescenta o que a referência mostra)
  exemplo/      roteiro de 6 frases, plano.js e cena.js de partida
Depois: completar a receita, escrever o kit, testar com a voz do Mac e comparar com a referência (comparar.py).
"""
import argparse
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import STYLES, read_json, style_dirs, write_json

EASING = {"expo_out": "expoOut", "smooth": "smooth", "linear": "smooth", "ease_in": "easeInOut", None: "smooth"}


def camera_settings(cam):
    fps = cam["fps"] or 30
    approach = round(max(0.3, cam["median_move_frames"] / fps), 2)
    return {"approach_seconds": approach, "fly_seconds": round(approach * 2, 2), "fly_arc": 0.8,
            "easing": EASING[cam["dominant_profile"]], "idle_sway": 0.02 if cam["share_pct"]["still"] > 40 else 0.06,
            "cuts": "measured" if cam["cuts"] else "none", "braking_seconds": round(cam["median_braking_frames"] / fps, 2),
            "longest_still_seconds": cam["longest_still_seconds"], "measured_curve": "referencia-curva.json"}


def caption_settings(text):
    measured = text["captions"] or {}
    defaults = {"words_per_caption": 1, "top_px": 1270, "font_px": 96, "font": "Montserrat", "color": "#ffffff",
                "stroke": "#000000", "stroke_px": 14, "highlight": "#ffd21f", "uppercase": True}
    found = {k: measured.get(k) for k in ("words_per_caption", "top_px", "font_px", "color", "stroke", "highlight", "uppercase")}
    merged = {**defaults, **{k: v for k, v in found.items() if v is not None}}
    merged["stroke_px"] = max(8, round(merged["font_px"] * 0.14))
    return merged


def label_top(text):
    tops = [o["box"][1] for o in text["other_texts"] if o["box"][1] < 0.3]
    return int(sorted(tops)[len(tops) // 2] * 1920) if tops else 210


def build_style(d, engine):
    first = d["shots"][0] if d["shots"] else {"gradient": {"top": "#202020", "bottom": "#202020"}}
    # sem fala no vídeo, a medida de música vem vazia: o estilo nasce sem trilha e o Claude decide depois
    music, effects = d["sound"]["music"] or {}, d["sound"]["effects"] or {}
    whoosh = 0.22 if effects.get("share_of_moves_with_effect", 0) >= 0.4 else 0.0
    return {
        "name": d["name"], "engine": engine, "summary": "[OLHAR] uma frase sobre o estilo", "sync": "voice",
        "format": {"width": 1080, "height": 1920, "fps_final": round(d["fps"]), "resolution_final": "portrait"},
        "stage": {"background": first["gradient"]["top"], "background_bottom": first["gradient"]["bottom"], "fog": None,
                  "hemisphere": ["#ffffff", "#8a8070", 1.2], "sun": ["#fff0dc", 2.2], "shadows": True, "flat_shading": False, "fov": 40},
        "camera": camera_settings(d["camera"]),
        "captions": caption_settings(d["text"]),
        "label": {"mode": "top", "top_px": label_top(d["text"]), "font_px": 72, "background": "#ffd21f", "color": "#111111"},
        "cards": {"top_px": 470, "font_px": 52, "background": "#ffffff", "color": "#111111"},
        "sound": {"whoosh": {"approach": whoosh, "fly": whoosh}, "pop": {"label": 0.5, "card": 0.35},
                  "music": {"chords": [[146.8, 174.6, 220.0], [116.5, 146.8, 174.6], [174.6, 220.0, 261.6], [130.8, 164.8, 196.0]],
                            "block_seconds": 2.8} if music.get("has_music_bed") else None,
                  "mix": {"effects": 0.35, "music": 0.07}, "lufs": -14},
        "finish": "filmed" if engine == "blender" else "clean",
        "palette": [p["color"] for p in d["palette"]],
        "reference": {"source": d["source"], "duration": d["duration"], "cuts": d["camera"]["cuts"],
                      "moves": [{"t": m["t"], "profile": m["profile"], "direction": m["direction"]} for m in d["camera"]["moves"]],
                      "phrases": [{"start": p["start"], "end": p["end"], "words": len(p["words"])} for p in d["speech"]["phrases"]],
                      "words_per_minute": d["sound"]["speech"].get("words_per_minute")},
    }


def fill_recipe(template, d, style):
    c, cap = d["camera"], style["captions"]
    values = {
        "NOME": d["name"], "FONTE": d["source"], "DURACAO": f"{d['duration']}", "FPS": f"{d['fps']:.0f}",
        "PPM": f"{d['sound']['speech'].get('words_per_minute')}", "FRASES": f"{len(d['speech']['phrases'])}",
        "CORTES": ", ".join(f"{x:.2f} s" for x in c["cuts"]) or "nenhum", "MOVIMENTOS": f"{len(c['moves'])}",
        "JEITO": f"{c['dominant_profile']}", "FREADA": f"{style['camera']['braking_seconds']}", "PARADA": f"{c['share_pct']['still']}",
        "MAIOR_PARADA": f"{c['longest_still_seconds']}", "LEGENDA": f"{cap['words_per_caption']} palavra(s) por vez, topo em {cap['top_px']} px, "
        f"letra ~{cap['font_px']} px, `{cap['color']}` com contorno `{cap['stroke']}`, destaque `{cap['highlight']}`",
        "PALETA": ", ".join(f"`{p}`" for p in style["palette"]), "MUSICA": "sim" if style["sound"]["music"] else "não",
        "LUFS": f"{d['sound']['loudness']['lufs']}",
    }
    for key, value in values.items():
        template = template.replace("{{" + key + "}}", value)
    return template


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("decupagem", help="a pasta decupagem/<nome>")
    parser.add_argument("--motor", choices=["web", "blender"], default="web")
    parser.add_argument("--sobrescrever", action="store_true")
    args = parser.parse_args()
    source = Path(args.decupagem)
    d = read_json(source / "decupagem.json")
    target = style_dirs()[0] / d["name"]
    if target.exists() and not args.sobrescrever:
        sys.exit(f"o estilo {d['name']} já existe em {target}: use --sobrescrever ou outro --nome na decupagem")
    shutil.copytree(STYLES / "_modelo" / args.motor, target, dirs_exist_ok=True)
    style = build_style(d, args.motor)
    if args.motor == "blender":   # parte do realista-corpo, com o fundo medido na referência
        base = read_json(STYLES / "realista-corpo" / "estilo.json")["blender"]
        first = d["shots"][0]["gradient"] if d["shots"] else {"top": "#3a4250", "bottom": "#14171c"}
        style["blender"] = {**base, "background": [first["top"], first["bottom"]]}
    write_json(target / "estilo.json", style)
    recipe = target / "receita.md"
    recipe.write_text(fill_recipe(recipe.read_text(encoding="utf-8"), d, style), encoding="utf-8")
    curve = source / "camera" / "ref-curva.json"
    if curve.exists():
        shutil.copy(curve, target / "referencia-curva.json")
    print(f"estilo criado em {target}: estilo.json com os números, receita.md com {recipe.read_text().count('[OLHAR]')} partes [OLHAR] para completar")


if __name__ == "__main__":
    main()
