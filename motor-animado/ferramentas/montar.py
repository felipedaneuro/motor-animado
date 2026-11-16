"""Monta (ou atualiza) a pasta cena/ de um vídeo do motor web: o motor, o kit do estilo, os tempos e a voz.

Uso:
  ferramentas/py montar.py voz/tempos.json voz/voz.wav cena --estilo lowpoly-drone
  ferramentas/py montar.py voz/tempos.json voz/voz.wav cena          (de novo: lembra o estilo da primeira vez)

O que ele faz, sempre na mesma ordem:
  1. copia o motor (motores/web) para cena/js/motor/ e o kit do estilo para cena/js/estilo/;
  2. arquivos na pasta kit/ do vídeo valem mais: um kit/kit.js ou kit/personagens.js substitui o do estilo ou do motor;
  3. escreve cena/js/estilo.js (o estilo.json, mais os ajustes de estilo-ajustes.json da pasta do vídeo, se houver);
  4. escreve cena/js/tempos.js, copia a voz e acerta a duração no index.html;
  5. na primeira vez, copia o exemplo do estilo (plano.js e cena.js), que o Claude troca pelo vídeo novo.
Nunca escreve por cima de cena/js/plano.js nem de cena/js/cena.js.
"""
import argparse
import json
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import ENGINES, TAIL_SECONDS, deep_merge, load_style, read_json, style_chain, style_folder, with_theme

AUDIO_TAG = '<audio id="narracao" src="assets/voz.wav" data-start="0" data-duration="{d}" data-track-index="1" data-volume="1"></audio>'


def remembered_style(scene, requested, extends=None):
    marker = scene / ".estilo"
    name = requested or (marker.read_text().strip() if marker.exists() else None)
    if not name:
        sys.exit("faltou --estilo na primeira vez (ex.: --estilo lowpoly-drone)")
    style = load_style(name, extends)
    if style["engine"] != "web":
        sys.exit(f"o estilo {name} usa o motor {style['engine']}: veja referencias/motor-blender.md")
    scene.mkdir(parents=True, exist_ok=True)
    marker.write_text(name)
    return name, style


def copy_code(scene, chain, video_folder):
    motor, kit = scene / "js" / "motor", scene / "js" / "estilo"
    for target in (motor, kit):
        shutil.rmtree(target, ignore_errors=True)
        target.mkdir(parents=True)
    for source in (ENGINES / "web" / "js").iterdir():
        shutil.copy(source, motor / source.name)
    for folder in chain:
        for source in folder.glob("*.js"):
            shutil.copy(source, kit / source.name)
    curve = chain[-1] / "referencia-curva.json"
    if curve.exists():   # a câmera medida da referência, para createMeasuredDolly: import curve from "./estilo/curva.js"
        (kit / "curva.js").write_text("export default " + curve.read_text(encoding="utf-8").strip() + ";\n", encoding="utf-8")
    overrides = sorted((video_folder / "kit").glob("*")) if (video_folder / "kit").exists() else []
    for source in overrides:
        destination = motor / source.name if (motor / source.name).exists() else kit / source.name
        shutil.copy(source, destination)
        print(f"kit/{source.name} vale mais: substitui {destination.relative_to(scene)}")


def copy_example_once(scene, chain):
    example = next((f / "exemplo" for f in reversed(chain) if (f / "exemplo").exists()), chain[-1] / "exemplo")
    for file in ("plano.js", "cena.js"):
        target = scene / "js" / file
        if not target.exists() and (example / file).exists():
            shutil.copy(example / file, target)
            print(f"{target} veio do exemplo do estilo: troque pelo vídeo novo")


def font_link(family, query):
    """Fontes guardadas em vendor/fonts não precisam de internet; outra fonte vem do Google Fonts na hora do render."""
    local = (ENGINES / "web" / "vendor" / "fonts" / "fonts.css").read_text(encoding="utf-8")
    if f"'{family}'" in local:
        return ""
    return f'<link href="https://fonts.googleapis.com/css2?family={query.replace(" ", "+")}&display=block" rel="stylesheet" />'


def write_page(scene, duration, family, query):
    html = (ENGINES / "web" / "index.html").read_text(encoding="utf-8")
    html = html.replace("{{DURATION}}", str(duration)).replace("{{AUDIO}}", AUDIO_TAG.format(d=duration))
    html = html.replace("{{FONT_LINK}}", font_link(family, query))
    (scene / "index.html").write_text(html, encoding="utf-8")
    shutil.rmtree(scene / "vendor", ignore_errors=True)
    shutil.copytree(ENGINES / "web" / "vendor", scene / "vendor")
    (scene / "hyperframes.json").write_text(json.dumps({"$schema": "https://hyperframes.heygen.com/schema/hyperframes.json",
                                                         "paths": {"assets": "assets"}}, indent=1))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("tempos")
    parser.add_argument("voz")
    parser.add_argument("cena")
    parser.add_argument("--estilo")
    args = parser.parse_args()
    scene = Path(args.cena)
    video_folder = scene.resolve().parent
    adjustments = read_json(video_folder / "estilo-ajustes.json") if (video_folder / "estilo-ajustes.json").exists() else {}
    name, style = remembered_style(scene, args.estilo, adjustments.get("extends"))
    if adjustments.get("theme"):   # estilo-ajustes.json: {"theme": "saude"} troca o tema; os outros ajustes valem por cima
        style = with_theme(style, adjustments["theme"])
    style = deep_merge(style, adjustments)
    chain = (style_chain(style["extends"]) if style.get("extends") else []) + [style_folder(name)]
    copy_code(scene, chain, video_folder)
    timing = read_json(args.tempos)
    duration = round(timing["duration"] + TAIL_SECONDS, 2)
    js = scene / "js"
    (js / "estilo.js").write_text("// escrito pelo montar.py a partir do estilo.json: não edite aqui\nexport default "
                                  + json.dumps(style, ensure_ascii=False) + ";\n", encoding="utf-8")
    (js / "tempos.js").write_text("// escrito pelo montar.py a partir de voz/tempos.json: não edite aqui\nexport default "
                                  + json.dumps(timing, ensure_ascii=False) + ";\n", encoding="utf-8")
    (scene / "assets").mkdir(exist_ok=True)
    shutil.copy(args.voz, scene / "assets" / "voz.wav")
    captions = style["captions"]
    write_page(scene, duration, captions["font"], captions.get("font_query") or f"{captions['font']}:wght@800;900")
    copy_example_once(scene, chain)
    print(f"{scene}: estilo {name}, {len(timing['phrases'])} frases, {duration:.2f} s")


if __name__ == "__main__":
    main()
