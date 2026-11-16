"""Junta a imagem do render com a voz, os efeitos e a música e acerta o volume em -14 LUFS (duas passadas e limitador).

Uso:
  ferramentas/py mixar.py video-v1.mp4 voz/voz.wav --efeitos som/efeitos.wav --musica som/musica.wav --saida video-v1-final.mp4
  ... --acabamento filmado        brilho suave nas luzes altas, vinheta e grão (para estilos realistas)
  ... --efeitos-vol 0.35 --musica-vol 0.07      os volumes (padrão: os do estilo lowpoly-drone)

Efeitos e música são opcionais. O vídeo é copiado sem recodificar, a não ser com --acabamento filmado.
"""
import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import FILMED_FINISH, SAMPLE_RATE, log_step, require, run

TARGET = "I=-14:TP=-1.5:LRA=11"


def audio_graph(args):
    """Monta o filtro: a voz na frente; efeitos e música, se houver, embaixo."""
    inputs, chains, labels = [args.voz], [f"[1:a]aresample={SAMPLE_RATE},pan=mono|c0=c0[v]"], ["[v]"]
    for path, volume, label in ((args.efeitos, args.efeitos_vol, "e"), (args.musica, args.musica_vol, "m")):
        if path:
            inputs.append(path)
            chains.append(f"[{len(inputs)}:a]aresample={SAMPLE_RATE},volume={volume}[{label}]")
            labels.append(f"[{label}]")
    mix = ";".join(chains) + f";{''.join(labels)}amix=inputs={len(labels)}:duration=first:normalize=0"
    return inputs, mix


def measure(video, inputs, mix):
    sources = ["-i", video] + [x for path in inputs for x in ("-i", path)]
    stderr = run(["ffmpeg", "-hide_banner", *sources, "-filter_complex", f"{mix},loudnorm={TARGET}:print_format=json",
                  "-f", "null", "-"]).stderr
    data = json.loads(stderr[stderr.rindex("{"):stderr.rindex("}") + 1])
    return (f"loudnorm={TARGET}:measured_I={data['input_i']}:measured_TP={data['input_tp']}:measured_LRA={data['input_lra']}:"
            f"measured_thresh={data['input_thresh']}:offset={data['target_offset']}:linear=false")


def integrated_lufs(path):
    report = run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", report)[-1]), float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", report)[-1])


def fine_tune(path):
    """O loudnorm dinâmico às vezes para longe do alvo (um pico alto, como uma sirene, segura o ganho): mede o arquivo
    pronto, ajusta o volume e passa um limitador, para chegar a -14 LUFS sem o pico passar de -1 dB (o limitador fica em -2,5 dB porque o AAC sobe um pouco o pico)."""
    for _ in range(2):
        lufs, peak = integrated_lufs(path)
        if abs(-14 - lufs) <= 0.5 and peak <= -1.0:
            return
        temporary = Path(path).with_suffix(".ajuste.mp4")
        run(["ffmpeg", "-v", "error", "-y", "-i", path, "-map", "0", "-c:v", "copy",
             "-af", f"volume={-14 - lufs:.2f}dB,alimiter=limit=0.75:level=false:attack=2:release=60", "-ar", SAMPLE_RATE,
             "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", temporary])
        temporary.replace(path)
        print(f"ajuste fino: {lufs:.1f} LUFS, pico {peak:.1f} dB -> {-14 - lufs:+.1f} dB com limitador")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("video")
    parser.add_argument("voz")
    parser.add_argument("--efeitos")
    parser.add_argument("--musica")
    parser.add_argument("--saida", required=True)
    parser.add_argument("--efeitos-vol", type=float, default=0.35)
    parser.add_argument("--musica-vol", type=float, default=0.07)
    parser.add_argument("--ganho", type=float, default=0.0, help="dB depois do loudnorm (o limitador segura os picos)")
    parser.add_argument("--acabamento", choices=["limpo", "filmado"], default="limpo")
    args = parser.parse_args()
    require("ffmpeg")
    if Path(args.saida).exists():
        sys.exit(f"{args.saida} já existe: use um nome novo")
    inputs, mix = audio_graph(args)
    normalize = measure(args.video, inputs, mix)
    sources = ["-i", args.video] + [x for path in inputs for x in ("-i", path)]
    audio = f"{mix},{normalize},volume={args.ganho}dB,alimiter=limit=0.75:level=false,aresample={SAMPLE_RATE}[a]"
    if args.acabamento == "filmado":
        graph, video_out = f"[0:v]{FILMED_FINISH}[vf];{audio}", ["-map", "[vf]", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p"]
    else:
        graph, video_out = audio, ["-map", "0:v", "-c:v", "copy"]
    run(["ffmpeg", "-v", "error", "-y", *sources, "-filter_complex", graph, *video_out, "-map", "[a]",
         "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", args.saida])
    fine_tune(args.saida)
    log_step(f"mixagem: {args.saida} (efeitos x{args.efeitos_vol if args.efeitos else 0}, música x{args.musica_vol if args.musica else 0}, {args.acabamento})")
    print(f"{args.saida}: pronto, -14 LUFS (confira com conferir.py)")


if __name__ == "__main__":
    main()
