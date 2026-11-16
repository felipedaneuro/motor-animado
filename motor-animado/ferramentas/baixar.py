"""Baixa vídeos de referência (Instagram, TikTok, YouTube...) com o yt-dlp, só para estudo, e anota os números.

Uso:
  ferramentas/py baixar.py <link> [<link> ...] --pasta referencia
  ferramentas/py baixar.py <link do perfil> --pasta referencia --perfil 6     (os 6 vídeos mais recentes)
  ... --cookies chrome                                                        (se o site pedir login)

Grava <id>.mp4, <id>.info.json e numeros.md (duração, fps real, visualizações, curtidas, comentários).
O fps real vem do arquivo baixado e da lista de formatos: se o site tem só 30, estudar em 60 só repete quadros.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import require, run

FORMAT = "bv*[height<=1920][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b"


def number(n):
    return "" if n is None else f"{n:,}".replace(",", ".")


def real_fps(path):
    rate = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate",
                "-of", "csv=p=0", path]).stdout.strip()
    num, den = (int(x) for x in rate.split("/"))
    return round(num / den, 2)


def download(link, folder, cookies, profile_count):
    command = ["yt-dlp", "-q", "--no-warnings", "--no-simulate", "-j", "-f", FORMAT, "--merge-output-format", "mp4",
               "--write-info-json", "-o", str(folder / "%(id)s.%(ext)s")]
    if cookies:
        command += ["--cookies-from-browser", cookies]
    if profile_count:
        command += ["--playlist-end", str(profile_count)]
    result = subprocess.run(command + [link], capture_output=True, text=True)
    if result.returncode:
        print(f"não consegui baixar {link}: {result.stderr.strip()[:300]}\n  dica: tente com --cookies chrome")
        return []
    return [json.loads(line) for line in result.stdout.strip().splitlines() if line.startswith("{")]


def describe(info, folder):
    video = folder / f"{info['id']}.mp4"
    info["fps_real"] = real_fps(video) if video.exists() else None
    fps_offered = sorted({f.get("fps") for f in info.get("formats") or [] if f.get("fps")})
    info["fps_offered"] = fps_offered
    if not info.get("duration") and video.exists():
        info["duration"] = float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                                      video]).stdout.strip() or 0)
    return info


def write_table(items, folder):
    rows = ["# Os números de cada vídeo", "", "Alguns sites escondem visualizações sem login: aí a coluna fica vazia.", "",
            "| Vídeo | Duração | fps real | fps oferecidos | Visualizações | Curtidas | Comentários | Título |",
            "|---|---|---|---|---|---|---|---|"]
    for i in sorted(items, key=lambda x: -(x.get("view_count") or x.get("like_count") or 0)):
        title = (i.get("description") or i.get("title") or "").split("\n")[0][:70].replace("|", "/")
        rows.append(f"| {i['id']} | {i.get('duration') or 0:.0f} s | {i.get('fps_real')} | {i['fps_offered']} | "
                    f"{number(i.get('view_count'))} | {number(i.get('like_count'))} | {number(i.get('comment_count'))} | {title} |")
    (folder / "numeros.md").write_text("\n".join(rows) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("links", nargs="+")
    parser.add_argument("--pasta", default="referencia")
    parser.add_argument("--cookies", default="", help="chrome, safari ou firefox")
    parser.add_argument("--perfil", type=int, default=0, help="o link é de um perfil: baixa os N mais recentes")
    args = parser.parse_args()
    require("yt-dlp", "ffprobe")
    folder = Path(args.pasta)
    folder.mkdir(parents=True, exist_ok=True)
    items = [describe(i, folder) for link in args.links for i in download(link, folder, args.cookies, args.perfil)]
    if not items:
        sys.exit("nenhum vídeo baixado")
    write_table(items, folder)
    for i in items:
        print(f"baixado: {folder}/{i['id']}.mp4 ({i.get('duration') or 0:.0f} s, {i['fps_real']} fps)")
    print(f"números em {folder}/numeros.md")


if __name__ == "__main__":
    main()
