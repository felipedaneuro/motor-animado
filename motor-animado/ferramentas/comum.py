"""Funções que todas as ferramentas dividem: caminhos da skill, palavras, tempos, JSON, perfil e registro.

Os dados de tempo seguem um formato só, em todas as ferramentas e no motor:
  {"duration": s, "phrases": [{"text", "start", "end", "words": [{"word", "start", "end"}]}]}
"""
import datetime
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
from pathlib import Path

# O ffmpeg completo (com libass para legenda queimada e drawtext) fica separado do ffmpeg comum no Homebrew
# (brew install ffmpeg-full). Quando ele existe, vale para todas as ferramentas e para os processos que elas abrem.
FFMPEG_FULL = Path("/opt/homebrew/opt/ffmpeg-full/bin")
if (FFMPEG_FULL / "ffmpeg").exists() and str(FFMPEG_FULL) not in os.environ.get("PATH", ""):
    os.environ["PATH"] = f"{FFMPEG_FULL}:{os.environ.get('PATH', '')}"

SKILL = Path(__file__).resolve().parents[1]
TOOLS = SKILL / "ferramentas"
ENGINES = SKILL / "motores"
STYLES = SKILL / "estilos"
HYPERFRAMES = ["npx", "--yes", "hyperframes@0.8.181"]
TAIL_SECONDS = 0.6          # respiro depois da última palavra, igual em todas as ferramentas
SAMPLE_RATE = 48000
BOLD_FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
# O jeito de "filmado": brilho suave só nas luzes altas (feito em RGB: em YUV a imagem inteira fica rosa),
# vinheta leve e grão. Usado pelo mixar.py (--acabamento filmado) e pelo finalizar.py do motor Blender.
_HIGHLIGHTS = "'if(gt(val,215),val,0)'"
FILMED_FINISH = (f"format=gbrp,split[a][b];[b]lutrgb=r={_HIGHLIGHTS}:g={_HIGHLIGHTS}:b={_HIGHLIGHTS},gblur=sigma=22[g];"
                 "[a][g]blend=all_mode=screen:all_opacity=0.14,format=yuv420p,vignette=angle=0.42,noise=c0s=3:c0f=t,format=yuv420p")


def normalize_word(text):
    """Minúsculas, sem acento, só letras, números e hífen. É a mesma regra do normalizeWord() do motor."""
    decomposed = unicodedata.normalize("NFD", text.lower())
    plain = "".join(c for c in decomposed if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9-]", "", plain)


def media_duration(path):
    result = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                            capture_output=True, text=True, check=True)
    return float(result.stdout.strip())


def has_audio(path):
    """True quando o arquivo tem uma faixa de áudio (muitas prévias de estilo vêm mudas)."""
    result = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", str(path)],
                            capture_output=True, text=True)
    return bool(result.stdout.strip())


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def write_json(path, data, indent=1):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    # números do numpy (bool_, float32...) viram números comuns
    as_plain = lambda value: value.item() if hasattr(value, "item") else str(value)
    Path(path).write_text(json.dumps(data, ensure_ascii=False, indent=indent, default=as_plain), encoding="utf-8")


EMOTION_TAG = re.compile(r"\[[^\]]*\]\s*")


def strip_tags(text):
    """Tira as marcações de emoção da ElevenLabs v3 ([excited], [whispers]...): elas vão para a voz, nunca para a legenda."""
    return EMOTION_TAG.sub("", text).strip()


def script_lines(path, keep_tags=False):
    """Uma frase por linha; linhas vazias e linhas começando com # ficam de fora. Sem as marcações de emoção,
    a não ser com keep_tags (só o voz.py, para mandar à ElevenLabs v3)."""
    lines = Path(path).read_text(encoding="utf-8-sig").splitlines()
    kept = [line.strip() for line in lines if line.strip() and not line.lstrip().startswith("#")]
    return kept if keep_tags else [strip_tags(line) for line in kept]


def log_step(text, folder="."):
    """Uma linha no registro.md da pasta do vídeo, com a hora."""
    stamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    with open(Path(folder) / "registro.md", "a", encoding="utf-8") as handle:
        handle.write(f"- {stamp} · {text}\n")


def load_profile(folder="."):
    """O perfil da pessoa (voz, idioma, CTA, personagens): perfil.json na pasta do vídeo ou na pasta acima."""
    for candidate in (Path(folder) / "perfil.json", Path(folder).resolve().parent / "perfil.json"):
        if candidate.exists():
            return read_json(candidate)
    return read_json(SKILL / "perfil.exemplo.json")


def style_dirs():
    """Onde procurar estilos: a pasta de $MOTOR_ANIMADO_ESTILOS (estilos pessoais, fora da skill), depois a da skill."""
    extra = os.environ.get("MOTOR_ANIMADO_ESTILOS")
    return ([Path(extra)] if extra else []) + [STYLES]


def style_folder(name):
    for folder in style_dirs():
        if (folder / name / "estilo.json").exists():
            return folder / name
    available = sorted({p.name for d in style_dirs() if d.exists() for p in d.iterdir() if (p / "estilo.json").exists()})
    sys.exit(f"o estilo '{name}' não existe. Estilos instalados: {', '.join(available)}")


def deep_merge(base, extra):
    merged = dict(base)
    for key, value in extra.items():
        merged[key] = deep_merge(merged[key], value) if isinstance(value, dict) and isinstance(merged.get(key), dict) else value
    return merged


def style_chain(name, seen=None):
    """As pastas do estilo e dos estilos em que ele se apoia ("extends"), da base até ele."""
    seen = seen or []
    if name in seen:
        sys.exit(f"herança circular de estilos: {' -> '.join(seen + [name])}")
    folder = style_folder(name)
    base = read_json(folder / "estilo.json").get("extends")
    return (style_chain(base, seen + [name]) if base else []) + [folder]


THEMED_SECTIONS = ("stage", "label", "captions", "cards")


def shared_themes():
    """Os temas comuns (estilos/_temas.json) e os pessoais (estilos/_temas-meus.json, criados no painel; valem por cima),
    para os estilos que não trazem os seus em "themes"."""
    themes = {}
    for name in ("_temas.json", "_temas-meus.json"):
        path = STYLES / name
        if path.exists():
            themes.update({k: v for k, v in read_json(path).items() if not k.startswith("_")})
    return themes


def with_theme(style, name=None):
    """Aplica um tema do estilo (themes.<nome>): cores do palco, da etiqueta e da legenda, o mundo e as cores de destaque.
    Sem nome, usa style["theme"]. Um nome que não existe para com a lista dos temas."""
    themes = style.get("themes") or shared_themes()
    name = name or style.get("theme")
    if not name or not themes:
        return style
    if name not in themes:
        sys.exit(f"tema '{name}' não existe; temas: {', '.join(themes)}")
    theme = themes[name]
    themed = deep_merge(style, {key: theme[key] for key in THEMED_SECTIONS if key in theme})
    themed["world"] = deep_merge(style.get("world", {}), theme.get("world", {}))
    themed["accents"] = theme.get("accents", style.get("accents", []))
    themed["theme"] = name
    return themed


def load_style(name, extends=None):
    """O estilo com a base aplicada por baixo: os números do estilo valem mais que os da base.
    extends troca a base só neste vídeo (estilo-ajustes.json: {"extends": "palito"}).
    O tema de cada estilo é aplicado no próprio estilo, antes dos filhos: um filho com stage próprio continua com o dele."""
    own = with_theme(read_json(style_folder(name) / "estilo.json"))
    if extends and own.get("overlay"):   # um estilo próprio posto por cima de outro só leva o tratamento visual ("overlay")
        own = {**own["overlay"], "name": own["name"], "summary": own.get("summary", "")}
    base_name = extends or own.get("extends")
    if not base_name:
        return own
    merged = deep_merge(load_style(base_name), own)
    merged["extends"], merged["name"] = base_name, own["name"]
    return merged


def require(*programs):
    missing = [p for p in programs if not shutil.which(p)]
    if missing:
        sys.exit(f"falta instalar: {', '.join(missing)} (rode ferramentas/diagnostico.py)")


def run(command, **options):
    """Roda um comando; se falhar, mostra o fim do erro e para."""
    result = subprocess.run([str(c) for c in command], capture_output=True, text=True, **options)
    if result.returncode:
        sys.exit(f"falhou: {' '.join(map(str, command[:3]))}...\n{(result.stderr or result.stdout)[-1200:]}")
    return result


def phrases_from_words(words):
    """Separa uma lista de palavras com tempo em frases, pela pontuação final."""
    phrases, current = [], []
    for word in words:
        current.append(word)
        if re.search(r"[.!?…]$", word["word"]):
            phrases.append(current)
            current = []
    if current:
        phrases.append(current)
    return [{"text": " ".join(w["word"] for w in group), "start": group[0]["start"], "end": group[-1]["end"], "words": group}
            for group in phrases]
