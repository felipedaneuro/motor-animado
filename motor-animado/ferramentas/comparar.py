"""Compara o nosso vídeo com a referência na mesma régua: a diferença é a lista da próxima versão.

Uso: ferramentas/py comparar.py decupagem/<estilo> video-v1-final.mp4 [--saida comparacao-v1]

Decupa o nosso vídeo com o mesmo decupar.py (câmera, legenda, som) e escreve em <saida>/:
  comparacao.md    uma tabela medida a medida (referência, nosso, diferença, o que fazer)
  camera.png       as duas câmeras no mesmo gráfico: zoom por quadro, quanto a imagem já cresceu e o deslize de lado,
                   mais o tranco (quanto a aceleração muda de um quadro para o outro: menor é mais suave)
"""
import argparse
import subprocess
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import TOOLS, read_json, run, write_json


def curve_arrays(frames):
    zoom = np.array([0.0 if f.get("kind") == "cut" else ((f.get("zoom") or 1.0) - 1) * 100 for f in frames[1:]])
    side = np.array([0.0 if f.get("kind") == "cut" else np.hypot(f.get("dx") or 0.0, f.get("dy") or 0.0) * 100 for f in frames[1:]])
    return zoom, side


def smooth(values, k=5):
    return np.convolve(values, np.ones(k) / k, mode="same")


def jerk(zoom):
    return float(np.abs(np.diff(zoom, 2)).mean()) if len(zoom) > 3 else 0.0


def camera_chart(ref_frames, our_frames, fps, out):
    zr, sr = curve_arrays(ref_frames)
    zo, so = curve_arrays(our_frames)
    n = min(len(zr), len(zo))
    t = np.arange(n) / fps
    background, ink = "#16181d", "#e6e9ef"
    figure, axes = plt.subplots(3, 1, figsize=(10, 9), facecolor=background)
    series = [(smooth(zr[:n]), smooth(zo[:n]), "zoom, % por quadro"),
              (np.cumprod(1 + zr[:n] / 100), np.cumprod(1 + zo[:n] / 100), "quanto a imagem já cresceu (recomeça nos cortes)"),
              (smooth(sr[:n]), smooth(so[:n]), "deslize de lado, % da tela por quadro")]
    for axis, (ref, ours, title) in zip(axes, series):
        axis.set_facecolor(background)
        axis.tick_params(colors="#9aa3b2")
        axis.plot(t, ref, color="#58a6ff", lw=2, label="referência")
        axis.plot(t, ours, color="#ff9f43", lw=2, label="nosso")
        axis.set_title(title, color=ink, loc="left")
    axes[0].legend(facecolor=background, labelcolor=ink)
    axes[2].set_xlabel("segundos", color="#9aa3b2")
    figure.tight_layout()
    figure.savefig(out, dpi=110, facecolor=background)
    return jerk(zr[:n]), jerk(zo[:n])


def row(name, ref, ours, advice=""):
    def show(v):
        if isinstance(v, bool):
            return "sim" if v else "não"
        return "?" if v is None else f"{v:.2f}" if isinstance(v, float) else str(v)
    delta = f"{ours - ref:+.2f}" if isinstance(ref, (int, float)) and isinstance(ours, (int, float)) and not isinstance(ref, bool) else ""
    return f"| {name} | {show(ref)} | {show(ours)} | {delta} | {advice} |"


def rows_for(r, o, jerks):
    rc, oc = r["camera"], o["camera"]
    rcap, ocap = r["text"]["captions"] or {}, o["text"]["captions"] or {}
    rs, os_ = r["sound"], o["sound"]
    return [
        row("cortes por minuto", rc["cuts_per_minute"], oc["cuts_per_minute"], "corte nos segundos medidos" if rc["cuts"] else "sem corte seco"),
        row("movimentos rápidos por minuto", rc["moves_per_minute"], oc["moves_per_minute"], "mais/menos approach no plano.js"),
        row("jeito dominante", rc["dominant_profile"], oc["dominant_profile"], "camera.easing no estilo.json"),
        row("freada (quadros)", rc["median_braking_frames"], oc["median_braking_frames"], "approach_seconds no estilo.json"),
        row("% parada", rc["share_pct"]["still"], oc["share_pct"]["still"], "idle_sway e intervalo entre movimentos"),
        row("maior trecho parado (s)", rc["longest_still_seconds"], oc["longest_still_seconds"]),
        row("tranco da câmera", round(jerks[0], 3), round(jerks[1], 3), "menor é mais suave"),
        row("palavras por legenda", rcap.get("words_per_caption"), ocap.get("words_per_caption")),
        row("legenda: topo (px)", rcap.get("top_px"), ocap.get("top_px")),
        row("legenda: letra (px)", rcap.get("font_px"), ocap.get("font_px")),
        row("legenda: cor / destaque", f"{rcap.get('color')} / {rcap.get('highlight')}", f"{ocap.get('color')} / {ocap.get('highlight')}"),
        row("legenda x voz (s)", rcap.get("sync_offset_seconds"), ocap.get("sync_offset_seconds")),
        row("palavras por minuto", rs["speech"].get("words_per_minute"), os_["speech"].get("words_per_minute"), "frases mais curtas ou voz mais rápida"),
        row("música por baixo", rs["music"]["has_music_bed"], os_["music"]["has_music_bed"]),
        row("% dos movimentos com efeito", rs["effects"]["share_of_moves_with_effect"] if rs["effects"] else None,
            os_["effects"]["share_of_moves_with_effect"] if os_["effects"] else None, "whoosh no estilo.json"),
        row("volume (LUFS)", rs["loudness"]["lufs"], os_["loudness"]["lufs"], "o nosso vai a -14"),
    ]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("referencia", help="a pasta decupagem/<estilo> da referência")
    parser.add_argument("video")
    parser.add_argument("--saida")
    args = parser.parse_args()
    ref_folder = Path(args.referencia)
    out = Path(args.saida or f"comparacao-{Path(args.video).stem}")
    ours_folder = out / "decupagem"
    if not (ours_folder / "nosso" / "decupagem.json").exists():
        run([sys.executable, TOOLS / "decupar.py", args.video, "--nome", "nosso", "--pasta", ours_folder])
    r, o = read_json(ref_folder / "decupagem.json"), read_json(ours_folder / "nosso" / "decupagem.json")
    ref_frames = read_json(ref_folder / "camera" / "ref.json")["frames"]
    our_frames = read_json(ours_folder / "nosso" / "camera" / "ref.json")["frames"]
    jerks = camera_chart(ref_frames, our_frames, r["fps"], out / "camera.png")
    table = ["# Comparação na mesma régua", "", f"Referência: {r['source']} · nosso: {args.video}", "",
             "| Medida | Referência | Nosso | Diferença | O que mexer |", "|---|---|---|---|---|"] + rows_for(r, o, jerks)
    table += ["", "Gráfico das câmeras: `camera.png`. Lado a lado: `lado_a_lado.py`. Folhas do nosso: `decupagem/nosso/folhas/`."]
    (out / "comparacao.md").write_text("\n".join(table) + "\n", encoding="utf-8")
    print(f"{out}/comparacao.md e {out}/camera.png")


if __name__ == "__main__":
    main()
