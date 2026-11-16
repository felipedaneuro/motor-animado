"""Mede a câmera de um vídeo em todos os quadros: cortes, zoom, deslize, quanto tempo ela fica parada e o jeito de
cada movimento (sai rápido e freia aos poucos? acelera e freia igual? anda reto?).

Uso: ferramentas/py camera.py <video> --saida camera [--faixa-legenda 0.64,0.74]

Grava em camera/:
  <nome>.json         um registro por quadro (zoom, dx, dy, tipo) e o resumo
  <nome>.md           o resumo legível: cortes, movimentos, % parada/lenta/rápida, o perfil de freada
  <nome>-curva.json   a curva da câmera, pronta para a câmera medida do motor: a escala acumulada em cada quadro
                      (recomeça em 1 depois de cada corte) e o deslize lateral
Como mede: pontos que se repetem de um quadro para o outro dizem quanto a imagem cresceu ou andou.
A faixa da legenda fica de fora (texto pulando não é câmera). Uns 30 s por minuto de vídeo.
"""
import argparse
import math
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import write_json

WIDTH = 360
FAST = 0.006      # mais de 0,6% da imagem por quadro = movimento rápido
SLOW = 0.0012


def frame_motion(previous, keypoints, descriptors, matcher, height):
    if previous is None or descriptors is None or previous[1] is None or len(descriptors) <= 8 or len(previous[1]) <= 8:
        return {}
    pairs = matcher.match(previous[1], descriptors)
    if len(pairs) < 12:
        return {}
    p0 = np.float32([previous[0][m.queryIdx].pt for m in pairs])
    p1 = np.float32([keypoints[m.trainIdx].pt for m in pairs])
    matrix, inliers = cv2.estimateAffinePartial2D(p0, p1, method=cv2.RANSAC, ransacReprojThreshold=2.0)
    if matrix is None or inliers is None or inliers.sum() < 12:
        return {}
    return {"zoom": round(math.hypot(matrix[0, 0], matrix[1, 0]), 5), "dx": round(matrix[0, 2] / WIDTH, 5), "dy": round(matrix[1, 2] / height, 5)}


def read_frames(video, caption_band):
    capture = cv2.VideoCapture(video)
    fps = capture.get(cv2.CAP_PROP_FPS) or 30
    orb, matcher = cv2.ORB_create(nfeatures=1200), cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    frames, previous, previous_small, tiny = [], None, None, []
    while True:
        ok, frame = capture.read()
        if not ok:
            break
        height = int(frame.shape[0] * WIDTH / frame.shape[1])
        gray = cv2.cvtColor(cv2.resize(frame, (WIDTH, height)), cv2.COLOR_BGR2GRAY)
        mask = np.full(gray.shape, 255, np.uint8)
        mask[int(height * caption_band[0]):int(height * caption_band[1]), :] = 0
        keypoints, descriptors = orb.detectAndCompute(gray, mask)
        small = cv2.resize(gray, (90, 160)).astype(np.float32)
        record = {"frame": len(frames), "t": round(len(frames) / fps, 3),
                  "diff": round(float(np.abs(small - previous_small).mean()), 2) if previous_small is not None else 0.0}
        record.update(frame_motion(previous, keypoints, descriptors, matcher, height))
        frames.append(record)
        tiny.append(cv2.resize(gray, (18, 32)).astype(np.int16))
        previous, previous_small = (keypoints, descriptors), small
    return frames, tiny, fps


def classify(frames, tiny):
    """Corte = salto grande e isolado que não volta meio segundo depois (um flash volta; um corte não)."""
    n, diff = len(frames), [f["diff"] for f in frames]
    for i, f in enumerate(frames):
        neighbor = max(diff[i - 1] if i else 0, diff[i + 1] if i + 1 < n else 0)
        comes_back = np.abs(tiny[i - 1] - tiny[min(n - 1, i + 15)]).mean() if i else 99
        if f["diff"] > 22 and f["diff"] > 2.5 * neighbor and comes_back > 30:
            f["kind"] = "cut"
        elif "zoom" not in f:
            f["kind"] = "unknown"
        else:
            z, m = abs(f["zoom"] - 1), math.hypot(f["dx"], f["dy"])
            f["kind"] = "fast" if (z > FAST or m > FAST) else "slow" if (z > SLOW or m > SLOW) else "still"


def easing_profile(magnitudes):
    """O jeito do movimento pela posição do pico de velocidade: no começo = sai rápido e freia (expo_out);
    no meio = acelera e freia igual (smooth); espalhado = anda reto (linear)."""
    values = np.asarray(magnitudes)
    if len(values) < 4 or values.max() <= 0:
        return "linear", 0
    peak = int(values.argmax()) / (len(values) - 1)
    braking = int(len(values) - 1 - values.argmax())
    if values.min() > 0.6 * values.max():
        return "linear", braking
    return ("expo_out" if peak < 0.3 else "smooth" if peak < 0.7 else "ease_in"), braking


def find_moves(frames, fps):
    moves, i, n = [], 0, len(frames)
    while i < n:
        if frames[i]["kind"] != "fast":
            i += 1
            continue
        j, zoom, magnitudes = i, 1.0, []
        while j < n and frames[j]["kind"] in ("fast", "slow") and frames[j]["kind"] != "cut":
            zoom *= frames[j].get("zoom", 1)
            magnitudes.append(abs(frames[j].get("zoom", 1) - 1) + math.hypot(frames[j].get("dx", 0), frames[j].get("dy", 0)))
            j += 1
        if j - i >= 3:
            profile, braking = easing_profile(magnitudes)
            direction = "in" if zoom > 1.03 else "out" if zoom < 0.97 else "side"
            moves.append({"t": round(i / fps, 2), "frames": j - i, "zoom": round(zoom, 3), "direction": direction,
                          "profile": profile, "braking_frames": braking})
        i = max(j, i + 1)
    return moves


def camera_curve(frames):
    scale, side, s, x = [], [], 1.0, 0.0
    for f in frames:
        if f["kind"] == "cut":
            s, x = 1.0, 0.0
        elif "zoom" in f and abs(f["zoom"] - 1) < 0.08:
            s *= f["zoom"]
            x += f["dx"]
        scale.append(round(s, 5))
        side.append(round(x, 5))
    return scale, side


def summarize(frames, moves, fps):
    n = len(frames)
    cuts = [f["t"] for f in frames if f["kind"] == "cut"]
    share = {k: round(sum(1 for f in frames if f["kind"] == k) / n * 100) for k in ("still", "slow", "fast")}
    durations = sorted(m["frames"] for m in moves)
    profiles = {p: sum(1 for m in moves if m["profile"] == p) for p in ("expo_out", "smooth", "linear", "ease_in")}
    longest_still, run = 0, 0
    for f in frames:
        run = run + 1 if f["kind"] == "still" else 0
        longest_still = max(longest_still, run)
    return {"frames": n, "fps": fps, "duration": round(n / fps, 2), "cuts": cuts, "cuts_per_minute": round(len(cuts) / (n / fps) * 60, 1),
            "moves": moves, "moves_per_minute": round(len(moves) / (n / fps) * 60, 1), "share_pct": share,
            "median_move_frames": durations[len(durations) // 2] if durations else 0, "profiles": profiles,
            "dominant_profile": max(profiles, key=profiles.get) if moves else None,
            "median_braking_frames": sorted(m["braking_frames"] for m in moves)[len(moves) // 2] if moves else 0,
            "longest_still_seconds": round(longest_still / fps, 2)}


def write_report(path, name, s):
    rows = [f"# A câmera de {name}", "",
            f"- **{s['frames']} quadros** ({s['duration']} s a {s['fps']:.0f} qps), todos medidos.",
            f"- **{len(s['cuts'])} cortes** ({s['cuts_per_minute']} por minuto).",
            f"- **{len(s['moves'])} movimentos rápidos** ({s['moves_per_minute']} por minuto); duração mediana {s['median_move_frames']} quadros "
            f"({s['median_move_frames'] / s['fps']:.2f} s).",
            f"- **Jeito dominante: {s['dominant_profile']}** {s['profiles']}; freada mediana de {s['median_braking_frames']} quadros.",
            f"- **Parada {s['share_pct']['still']}%** do tempo, lenta {s['share_pct']['slow']}%, rápida {s['share_pct']['fast']}%; "
            f"o maior trecho parado tem {s['longest_still_seconds']} s.",
            "", "## Cortes", "", ", ".join(f"{c:.2f} s" for c in s["cuts"]) or "nenhum", "",
            "## Movimentos rápidos", "", "| Começa | Quadros | Zoom | Direção | Jeito | Freada (quadros) |", "|---|---|---|---|---|---|"]
    rows += [f"| {m['t']:.2f} s | {m['frames']} | {m['zoom']:.2f}x | {m['direction']} | {m['profile']} | {m['braking_frames']} |" for m in s["moves"]]
    rows += ["", "Confira os momentos que importam nas folhas de quadros: tela dividida ou texto tremendo às vezes contam como movimento."]
    path.write_text("\n".join(rows) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("video")
    parser.add_argument("--saida", default="camera")
    parser.add_argument("--faixa-legenda", default="0.64,0.74", help="faixa da altura ignorada (a legenda), de 0 a 1")
    args = parser.parse_args()
    cv2.setNumThreads(4)
    band = [float(x) for x in args.faixa_legenda.split(",")]
    frames, tiny, fps = read_frames(args.video, band)
    if not frames:
        sys.exit("não consegui ler o vídeo")
    classify(frames, tiny)
    summary = summarize(frames, find_moves(frames, fps), fps)
    out, name = Path(args.saida), Path(args.video).stem
    scale, side = camera_curve(frames)
    write_json(out / f"{name}.json", {"summary": summary, "frames": frames}, indent=None)
    write_json(out / f"{name}-curva.json", {"fps": fps, "scale": scale, "side": side, "cuts": summary["cuts"]}, indent=None)
    write_report(out / f"{name}.md", name, summary)
    print(f"{summary['frames']} quadros: {len(summary['cuts'])} cortes, {len(summary['moves'])} movimentos, jeito {summary['dominant_profile']}, "
          f"parada {summary['share_pct']['still']}%; resumo em {out}/{name}.md")


if __name__ == "__main__":
    main()
