"""Folhas de quadros: os quadros de um vídeo em grade, cada um com o tempo escrito, para ler o vídeo de uma vez.

Uso:
  ferramentas/py folhas.py <video> --por-segundo 2 --saida folhas/historia          a história inteira
  ferramentas/py folhas.py <video> --por-segundo 6 --saida folhas/ritmo             o ritmo
  ferramentas/py folhas.py <video> --por-segundo 30 --de 4.5 --ate 5.5 --saida folhas/corte    todos os quadros de um trecho
  ferramentas/py folhas.py <video> --tempos 1.2,3.4,9.9 --saida folhas/pontos       só esses instantes

Grava folha_001.jpg, folha_002.jpg... (padrão: 10 x 5 quadros por folha). Abra e olhe: é para ler, não só gerar.
"""
import argparse
import sys
from pathlib import Path

import cv2
import numpy as np


def grab(capture, seconds, width):
    capture.set(cv2.CAP_PROP_POS_MSEC, seconds * 1000)
    ok, frame = capture.read()
    if not ok:
        return None
    height = int(frame.shape[0] * width / frame.shape[1])
    frame = cv2.resize(frame, (width, height), interpolation=cv2.INTER_AREA)
    label = f"{seconds:.2f}"
    cv2.rectangle(frame, (0, 0), (len(label) * 11 + 6, 20), (0, 0, 0), -1)
    cv2.putText(frame, label, (3, 15), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1, cv2.LINE_AA)
    return frame


def instants(args, duration):
    if args.tempos:
        return [float(x) for x in args.tempos.split(",")]
    end = min(args.ate or duration, duration)
    count = int((end - args.de) * args.por_segundo + 1e-6)
    return [args.de + k / args.por_segundo for k in range(count)]


def save_sheets(tiles, folder, columns, rows):
    per_sheet = columns * rows
    for start in range(0, len(tiles), per_sheet):
        group = tiles[start:start + per_sheet]
        group += [np.zeros_like(tiles[0])] * (per_sheet - len(group))
        sheet = np.vstack([np.hstack(group[r * columns:(r + 1) * columns]) for r in range(rows)])
        cv2.imwrite(str(folder / f"folha_{start // per_sheet + 1:03d}.jpg"), sheet, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return (len(tiles) + per_sheet - 1) // per_sheet


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("video")
    parser.add_argument("--por-segundo", type=float, default=1)
    parser.add_argument("--de", type=float, default=0)
    parser.add_argument("--ate", type=float)
    parser.add_argument("--tempos", help="lista de segundos, separados por vírgula")
    parser.add_argument("--colunas", type=int, default=10)
    parser.add_argument("--linhas", type=int, default=5)
    parser.add_argument("--largura", type=int, default=144)
    parser.add_argument("--saida", default="folhas")
    args = parser.parse_args()
    capture = cv2.VideoCapture(args.video)
    duration = capture.get(cv2.CAP_PROP_FRAME_COUNT) / (capture.get(cv2.CAP_PROP_FPS) or 30)
    tiles = [t for t in (grab(capture, s, args.largura) for s in instants(args, duration)) if t is not None]
    if not tiles:
        sys.exit("nenhum quadro lido: confira o vídeo e os tempos")
    folder = Path(args.saida)
    folder.mkdir(parents=True, exist_ok=True)
    sheets = save_sheets(tiles, folder, args.colunas, args.linhas)
    print(f"{len(tiles)} quadros em {sheets} folhas, em {folder}/")


if __name__ == "__main__":
    main()
