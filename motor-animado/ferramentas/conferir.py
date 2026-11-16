"""Confere o vídeo pronto antes de postar: formato 9:16, fps, duração, áudio, quadro preto, quadro piscando sozinho,
imagem travada, cortes secos e volume (-14 LUFS, pico abaixo de -1 dB). Sai com código 1 se algo estiver fora.

Uso: ferramentas/py conferir.py video.mp4 [--sem-cortes] [--cortes-esperados 2.4,3.6]
  --sem-cortes          avisa de qualquer corte seco (estilos de câmera contínua: um corte seco costuma ser
                        um objeto sumindo de uma vez)
  --cortes-esperados    os cortes medidos na referência: avisa dos que faltam e dos que sobram (tolerância 0,1 s)

O que só o olho pega (algo tampando a câmera, uma peça estranha) precisa das folhas: folhas.py a 6 por segundo.
"""
import argparse
import json
import re
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import run


def ffmpeg_report(video, video_filter=None, audio_filter=None):
    command = ["ffmpeg", "-hide_banner", "-nostats", "-i", video]
    command += ["-vf", video_filter] if video_filter else ["-vn"]
    command += ["-af", audio_filter] if audio_filter else ["-an"]
    return run(command + ["-f", "null", "-"]).stderr


def frame_differences(video):
    capture = cv2.VideoCapture(video)
    fps = capture.get(cv2.CAP_PROP_FPS) or 30
    gray = []
    while True:
        ok, frame = capture.read()
        if not ok:
            break
        gray.append(cv2.cvtColor(cv2.resize(frame, (90, 160)), cv2.COLOR_BGR2GRAY).astype(np.float32))
    diff = [0.0] + [float(np.abs(gray[i] - gray[i - 1]).mean()) for i in range(1, len(gray))]
    return gray, diff, fps


def same_structure(a, b):
    """Correlação entre as bordas de dois quadros (de -1 a 1): alta quando o desenho é o mesmo, mesmo que a luz mude."""
    edges = [np.hypot(cv2.Sobel(x, cv2.CV_32F, 1, 0), cv2.Sobel(x, cv2.CV_32F, 0, 1)) for x in (a, b)]
    ea, eb = (e - e.mean() for e in edges)
    return float((ea * eb).sum() / (np.linalg.norm(ea) * np.linalg.norm(eb) + 1e-9))


def flickers_and_cuts(video):
    """Quadro piscando sozinho, cortes e clarões. Um salto que volta ao normal em até 1 segundo é um clarão
    (uma luz piscando, um flash), não um corte."""
    gray, diff, fps = frame_differences(video)
    n, second = len(gray), int(fps)
    flicker = [round(i / fps, 2) for i in range(1, n - 1)
               if diff[i] > 18 and diff[i + 1] > 18 and float(np.abs(gray[i + 1] - gray[i - 1]).mean()) < 0.35 * min(diff[i], diff[i + 1])]
    jumps = [i for i in range(1, n) if diff[i] > 22 and diff[i] > 2.5 * max(diff[i - 1], diff[i + 1] if i + 1 < n else 0)]
    # "parecido" é proporcional ao salto: o pontilhado e o embaçado dos estilos retrô somam um pouco de diferença
    similar = lambda a, b, jump: float(np.abs(gray[max(0, a)] - gray[min(n - 1, b)]).mean()) < max(12, 0.45 * jump)
    # volta ao que era antes (o clarão acaba) ou vai para o que já tinha sido (o clarão que acabou agora)
    comes_back = lambda i: any(similar(i - 1, i + k, diff[i]) or similar(i, i - 1 - k, diff[i]) for k in range(2, second + 1))
    # um pisca muda a cor e mantém o desenho; um corte troca o desenho (medido: pisca 0,85, corte 0,25, normal 0,91)
    light_change = lambda i: same_structure(gray[i - 1], gray[i]) > 0.6
    cuts = [round(i / fps, 2) for i in jumps if not (comes_back(i) or light_change(i))]
    flashes = [round(i / fps, 2) for i in jumps if comes_back(i) or light_change(i)]
    return flicker, cuts, flashes, photosensitive_windows(gray, fps)


def photosensitive_windows(gray, fps):
    """Trechos com mais de 3 piscadas por segundo: cada piscada são duas viradas opostas de brilho de mais de 10%
    num quarto da tela ou mais (o limite usado para proteger quem tem epilepsia fotossensível)."""
    quarters = np.array([[q.mean() for q in (g[:80, :45], g[:80, 45:], g[80:, :45], g[80:, 45:])] for g in gray])
    change = np.diff(quarters, axis=0)
    turns = np.zeros(len(change), dtype=bool)
    for k in range(4):
        big = np.where(np.abs(change[:, k]) > 25.5)[0]
        for a, b in zip(big, big[1:]):
            if b - a <= fps and np.sign(change[a, k]) != np.sign(change[b, k]):
                turns[b] = True
    window, found = int(fps), []
    for start in range(0, max(0, len(turns) - window)):
        if turns[start:start + window].sum() > 6 and (not found or start / fps - found[-1] > 1):
            found.append(round(start / fps, 2))
    return found


def check_format(info, problems):
    stream = next(s for s in info["streams"] if s["codec_type"] == "video")
    has_audio = any(s["codec_type"] == "audio" for s in info["streams"])
    num, den = map(int, stream["r_frame_rate"].split("/"))
    print(f"{stream['width']}x{stream['height']}, {num / den:.0f} qps, {float(info['format']['duration']):.1f} s, áudio: {'sim' if has_audio else 'NÃO'}")
    if stream["width"] * 16 != stream["height"] * 9:
        problems.append("não é 9:16")
    if not has_audio:
        problems.append("sem áudio")
    return has_audio


def check_loudness(video, problems):
    report = ffmpeg_report(video, audio_filter="ebur128=peak=true")
    lufs = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", report)[-1])
    peak = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", report)[-1])
    print(f"volume: {lufs:.1f} LUFS, pico {peak:.1f} dB")
    if abs(lufs + 14) > 1:
        problems.append(f"volume {lufs:.1f} LUFS (o alvo é -14)")
    if peak > -1:
        problems.append(f"pico {peak:.1f} dB (máximo -1)")


def check_cuts(cuts, args, problems):
    print(f"cortes secos: {len(cuts)} {' '.join(f'{c:.2f}s' for c in cuts)}")
    if args.sem_cortes and cuts:
        problems.append(f"{len(cuts)} corte(s) seco(s) num estilo sem corte: veja os tempos acima")
    if args.cortes_esperados:
        expected = [float(x) for x in args.cortes_esperados.split(",")]
        missing = [e for e in expected if not any(abs(e - c) <= 0.1 for c in cuts)]
        extra = [c for c in cuts if not any(abs(e - c) <= 0.1 for e in expected)]
        if missing or extra:
            problems.append(f"cortes diferentes da referência: faltam {missing}, sobram {extra}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("video")
    parser.add_argument("--sem-cortes", action="store_true")
    parser.add_argument("--cortes-esperados")
    args = parser.parse_args()
    info = json.loads(run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", args.video]).stdout)
    problems = []
    has_audio = check_format(info, problems)
    black = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", ffmpeg_report(args.video, "scale=270:-2,blackdetect=d=0.1:pix_th=0.06"))
    frozen = re.findall(r"freeze_start: ([\d.]+)[\s\S]*?freeze_duration: ([\d.]+)", ffmpeg_report(args.video, "scale=270:-2,freezedetect=n=0.001:d=1.5"))
    problems += [f"quadro preto de {float(s):.2f} a {float(e):.2f} s" for s, e in black]
    problems += [f"imagem parada por {float(d):.1f} s a partir de {float(s):.2f} s" for s, d in frozen]
    flicker, cuts, flashes, photosensitive = flickers_and_cuts(args.video)
    problems += [f"quadro piscando sozinho em {t:.2f} s" for t in flicker[:10]]
    problems += [f"mais de 3 piscadas por segundo a partir de {t:.2f} s (risco para fotossensíveis: deixe o pisca mais lento)" for t in photosensitive]
    print(f"clarões e mudanças de luz (não são corte): {len(flashes)} {' '.join(f'{c:.2f}s' for c in flashes[:12])}")
    check_cuts(cuts, args, problems)
    if has_audio:
        check_loudness(args.video, problems)
    print("OK" if not problems else "PROBLEMAS:\n- " + "\n- ".join(problems))
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
