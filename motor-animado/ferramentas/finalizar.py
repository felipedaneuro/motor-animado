"""Os quadros do Blender viram o short: amplia para 1080x1920 (lanczos), dá o jeito de filmado (brilho suave nas
luzes altas, vinheta e grão) e, se houver voz, chama o mixar.py para o som em -14 LUFS.

Uso:
  ferramentas/py finalizar.py renders/quadros --saida video-v1.mp4
  ferramentas/py finalizar.py renders/quadros --saida video-v1.mp4 --voz voz/voz.wav --efeitos som/efeitos.wav --musica som/musica.wav
  ... --acabamento limpo      sem brilho, vinheta e grão

Renderizar em 75% e ampliar aqui sai bem mais rápido que renderizar em 100%, quase sem perda.
Avisa se faltar algum quadro na sequência (um render que caiu no meio).
"""
import argparse
import re
import shutil
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import FILMED_FINISH, TOOLS, log_step, require, run


def frame_sequence(folder):
    files = sorted(Path(folder).glob("*.png"))
    if not files:
        sys.exit(f"nenhum quadro .png em {folder}")
    prefix, digits = re.fullmatch(r"(.*?)(\d+)\.png", files[0].name).groups()
    numbers = sorted(int(m.group(1)) for p in files if (m := re.fullmatch(re.escape(prefix) + r"(\d+)\.png", p.name)))
    missing = numbers[-1] - numbers[0] + 1 - len(numbers)
    if missing:
        print(f"atenção: faltam {missing} quadros entre {numbers[0]} e {numbers[-1]} (renderize o trecho que caiu)")
    return Path(folder) / f"{prefix}%0{len(digits)}d.png", numbers[0], len(numbers)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("quadros")
    parser.add_argument("--saida", required=True)
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--voz")
    parser.add_argument("--efeitos")
    parser.add_argument("--musica")
    parser.add_argument("--acabamento", choices=["filmado", "limpo"], default="filmado")
    parser.add_argument("--legenda", help="voz/tempos.json: queima a legenda no estilo de --estilo (precisa do ffmpeg-full)")
    parser.add_argument("--estilo", help="o estilo da legenda (padrão: o do .estilo da pasta)")
    parser.add_argument("--destaques", default="")
    args = parser.parse_args()
    require("ffmpeg")
    if Path(args.saida).exists():
        sys.exit(f"{args.saida} já existe: use um nome novo")
    pattern, first, count = frame_sequence(args.quadros)
    finish = "scale=1080:1920:flags=lanczos" + (f",{FILMED_FINISH}" if args.acabamento == "filmado" else ",format=yuv420p")
    with tempfile.TemporaryDirectory() as tmp:
        image, mixed = Path(tmp) / "imagem.mp4", Path(tmp) / "com-som.mp4"
        run(["ffmpeg", "-v", "error", "-y", "-framerate", args.fps, "-start_number", first, "-i", pattern, "-vf", finish,
             "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-r", args.fps, "-movflags", "+faststart", image])
        if args.voz:
            extra = [x for flag, path in (("--efeitos", args.efeitos), ("--musica", args.musica)) if path for x in (flag, path)]
            run([sys.executable, TOOLS / "mixar.py", image, args.voz, *extra, "--saida", mixed])
        current = mixed if args.voz else image
        if args.legenda:
            style = args.estilo or Path(".estilo").read_text().strip()
            run([sys.executable, TOOLS / "legendar.py", current, args.legenda, "--estilo", style, "--destaques", args.destaques, "--saida", args.saida])
        else:
            shutil.copy(current, args.saida)
    log_step(f"finalizar: {count} quadros -> {args.saida} ({args.acabamento})")
    print(f"pronto: {args.saida}, {count / args.fps:.1f} s, 1080x1920, acabamento {args.acabamento}" + (", com som" if args.voz else ", sem som"))


if __name__ == "__main__":
    main()
