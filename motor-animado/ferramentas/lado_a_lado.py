"""Os dois vídeos lado a lado, para comparar o seu com a referência, com o tempo escrito embaixo.

Uso: ferramentas/py lado_a_lado.py referencia.mp4 video-v1.mp4 --saida lado-a-lado-v1.mp4 [--som esquerda|direita]

Os dois ficam com a mesma altura; o mais curto segura o último quadro até o outro acabar.
Codifica na placa de vídeo do Mac (VideoToolbox): é só para olhar, então rápido vale mais que pequeno.
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import media_duration, require, run


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("esquerda")
    parser.add_argument("direita")
    parser.add_argument("--saida", default="lado-a-lado.mp4")
    parser.add_argument("--som", default="direita", choices=["esquerda", "direita"])
    parser.add_argument("--altura", type=int, default=1280)
    args = parser.parse_args()
    require("ffmpeg")
    duration = max(media_duration(args.esquerda), media_duration(args.direita))
    h = args.altura
    graph = (f"[0:v]scale=-2:{h},setsar=1,fps=30,tpad=stop_mode=clone:stop_duration={duration:.2f}[l];"
             f"[1:v]scale=-2:{h},setsar=1,fps=30,tpad=stop_mode=clone:stop_duration={duration:.2f}[r];"
             f"[l][r]hstack=inputs=2,trim=0:{duration:.2f},pad=iw:ih+48:0:0,"
             "drawbox=y=ih-48:h=48:w=iw:color=black:t=fill,"
             "drawtext=text='%{pts\\:hms}':x=(w-tw)/2:y=h-38:fontsize=28:fontcolor=yellow"
             ":fontfile=/System/Library/Fonts/Supplemental/Arial Bold.ttf[v]")
    audio = "0:a?" if args.som == "esquerda" else "1:a?"
    run(["ffmpeg", "-v", "error", "-y", "-i", args.esquerda, "-i", args.direita, "-filter_complex", graph, "-map", "[v]", "-map", audio,
         "-c:v", "h264_videotoolbox", "-b:v", "8M", "-pix_fmt", "yuv420p", "-c:a", "aac", "-t", f"{duration:.2f}", args.saida])
    print(f"pronto: {args.saida} ({duration:.1f} s)")


if __name__ == "__main__":
    main()
