"""O som da referência (usado pelo decupar.py): volume, ritmo da fala, pausas, se tem música por baixo e onde caem
os efeitos, cruzados com os cortes e os movimentos de câmera."""
import re
import subprocess

import numpy as np

RATE = 16000


def loudness(video):
    report = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(video), "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"],
                            capture_output=True, text=True).stderr
    lufs = re.findall(r"I:\s+(-?[\d.]+) LUFS", report)
    peak = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", report)
    return {"lufs": float(lufs[-1]) if lufs else None, "peak_db": float(peak[-1]) if peak else None}


def read_mono(video):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(video), "-vn", "-ac", "1", "-ar", str(RATE), "-f", "s16le", "-"],
                         capture_output=True).stdout
    return np.frombuffer(raw, "<i2").astype(np.float32) / 32768


def speech_rhythm(words, duration):
    if not words:
        return {"words_per_minute": 0, "pauses": []}
    pauses = [{"at": round(a["end"], 2), "seconds": round(b["start"] - a["end"], 2)}
              for a, b in zip(words, words[1:]) if b["start"] - a["end"] >= 0.35]
    spoken = words[-1]["end"] - words[0]["start"]
    return {"words_per_minute": round(len(words) / max(0.1, spoken) * 60), "first_word_at": round(words[0]["start"], 2),
            "pauses": pauses[:30], "pause_count": len(pauses), "speech_share": round(spoken / max(0.1, duration), 2)}


def rms_db(segment):
    return 20 * np.log10(max(1e-6, float(np.sqrt(np.mean(segment ** 2))))) if len(segment) else -120.0


def music_under_voice(audio, words):
    """Compara o som nas pausas da fala com o som durante a fala: perto de -40 dB ou menos é silêncio; acima,
    tem música ou ambiente por baixo."""
    talking = np.concatenate([audio[int(w["start"] * RATE):int(w["end"] * RATE)] for w in words]) if words else audio
    gaps = [audio[int(a["end"] * RATE) + 800:int(b["start"] * RATE) - 800] for a, b in zip(words, words[1:]) if b["start"] - a["end"] > 0.3]
    gaps = [g for g in gaps if len(g)]
    if not gaps:
        return {"gap_vs_speech_db": None, "has_music_bed": None}
    relative = round(rms_db(np.concatenate(gaps)) - rms_db(talking), 1)
    return {"gap_vs_speech_db": relative, "has_music_bed": relative > -32}


def onsets(audio, threshold=3.0):
    """Ataques fortes no som (estalos, whooshes, impactos): picos do fluxo espectral, em segundos."""
    hop, size = 256, 1024
    frames = np.lib.stride_tricks.sliding_window_view(audio, size)[::hop] * np.hanning(size)
    spectrum = np.abs(np.fft.rfft(frames, axis=1))
    flux = np.maximum(0, np.diff(spectrum, axis=0)).sum(axis=1)
    flux = (flux - np.median(flux)) / (np.std(flux) + 1e-9)
    peaks = [i for i in range(1, len(flux) - 1) if flux[i] > threshold and flux[i] >= flux[i - 1] and flux[i] >= flux[i + 1]]
    times, last = [], -1.0
    for i in peaks:
        t = (i + 1) * hop / RATE
        if t - last > 0.12:
            times.append(round(t, 2))
            last = t
    return times


def effects_against_events(effect_times, cuts, moves):
    near = lambda t, events: any(abs(t - e) <= 0.2 for e in events)
    move_starts = [m["t"] for m in moves]
    return {"effects_detected": len(effect_times), "on_cuts": sum(near(t, cuts) for t in effect_times),
            "on_camera_moves": sum(near(t, move_starts) for t in effect_times),
            "share_of_moves_with_effect": round(sum(near(m, effect_times) for m in move_starts) / max(1, len(move_starts)), 2),
            "times": effect_times[:40]}


def analyze_sound(video, words, duration, cuts, moves):
    audio = read_mono(video)
    result = {"loudness": loudness(video), "speech": speech_rhythm(words, duration), "music": music_under_voice(audio, words)}
    result["effects"] = effects_against_events(onsets(audio), cuts, moves) if len(audio) > RATE else None
    return result
