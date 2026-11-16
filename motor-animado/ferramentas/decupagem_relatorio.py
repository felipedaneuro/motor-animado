"""Escreve o decupagem.md: o resumo legível da decupagem, com número e segundo em tudo, e as partes [OLHAR]
que só o olho resolve (o Claude completa abrindo as folhas e os quadros das tomadas)."""


def section_speech(d):
    s, phrases = d["sound"]["speech"], d["speech"]["phrases"]
    hook = " ".join(w["word"] for p in phrases for w in p["words"] if w["start"] < 3)
    rows = ["## 1. A fala", "",
            f"- **{s.get('words_per_minute', 0)} palavras por minuto**; a primeira palavra em {s.get('first_word_at', '?')} s; "
            f"fala em {round(s.get('speech_share', 0) * 100)}% do vídeo.",
            f"- **{len(phrases)} frases**, de {min((p['end'] - p['start'] for p in phrases), default=0):.1f} a "
            f"{max((p['end'] - p['start'] for p in phrases), default=0):.1f} s.",
            f"- **O gancho (0 a 3 s):** \"{hook}\"",
            f"- **Pausas de 0,35 s ou mais:** {s.get('pause_count', 0)} ({', '.join(str(p['at']) + ' s' for p in s.get('pauses', [])[:10])})", "",
            "| # | Começa | Dura | Frase |", "|---|---|---|---|"]
    rows += [f"| {i + 1} | {p['start']:.2f} s | {p['end'] - p['start']:.1f} s | {p['text']} |" for i, p in enumerate(phrases)]
    rows += ["", "**[OLHAR] A fórmula:** como abre, o que se repete no meio, onde tem a virada, como termina e qual é o pedido final."]
    return rows


def section_camera(d):
    c = d["camera"]
    rows = ["## 2. A câmera", "",
            f"- **{len(c['cuts'])} cortes** ({c['cuts_per_minute']} por minuto): {', '.join(f'{x:.2f} s' for x in c['cuts']) or 'nenhum'}.",
            f"- **{len(c['moves'])} movimentos rápidos** ({c['moves_per_minute']} por minuto), mediana de {c['median_move_frames']} quadros.",
            f"- **Jeito dominante: {c['dominant_profile']}** {c['profiles']}; freada mediana de {c['median_braking_frames']} quadros "
            f"({c['median_braking_frames'] / c['fps']:.2f} s).",
            f"- **Parada {c['share_pct']['still']}%**, lenta {c['share_pct']['slow']}%, rápida {c['share_pct']['fast']}%; "
            f"o maior trecho parado: {c['longest_still_seconds']} s.",
            "- A curva quadro a quadro está em `camera/ref-curva.json` (para a câmera medida do motor).", "",
            "**[OLHAR] Os tipos de plano:** drone por cima, aproximação no rosto, travelling de lado, órbita... e em que segundos."]
    return rows


def section_look(d):
    rows = ["## 3. O visual", "", "**Paleta do vídeo:** " + ", ".join(f"`{p['color']}` {round(p['share'] * 100)}%" for p in d["palette"]), "",
            "| Tomada | De | Até | Brilho | Saturação | Fundo (cima → baixo) | Foco (x, y) | Pessoa (altura) | Rosto |",
            "|---|---|---|---|---|---|---|---|---|"]
    for s in d["shots"]:
        rows.append(f"| {s['index']} | {s['start']:.2f} | {s['end']:.2f} | {s['brightness']:.2f} | {s['saturation']:.2f} | "
                    f"`{s['gradient']['top']}` → `{s['gradient']['bottom']}` | {s['focus_center']} | {s['person_height']} | {'sim' if s['has_faces'] else ''} |")
    rows += ["", "Quadros de cada tomada em `tomadas/`.", "",
             "**[OLHAR] O estilo:** 2D ou 3D, low-poly, realista ou desenho; o personagem (cabeça, olhos, corpo, contorno, sombra); "
             "o cenário; de onde vem a luz (dura ou suave, a cor); motor sugerido (`web` para estilizado, `blender` para realista).",
             "**[OLHAR] Como cada coisa entra:** cresce, voa, aparece de repente; em quantos quadros; na palavra, antes ou depois."]
    return rows


def section_text(d):
    t, c = d["text"], d["text"]["captions"]
    rows = ["## 4. Os textos na tela", ""]
    if c:
        rows += [f"- **Legenda:** {c['words_per_caption']} palavra(s) por vez, topo em {c['top_px']} px de 1920, letra de ~{c['font_px']} px, "
                 f"cor `{c['color']}`, contorno `{c['stroke']}`, destaque `{c['highlight']}`, {'MAIÚSCULAS' if c['uppercase'] else 'minúsculas'}.",
                 f"- **Sincronia:** a legenda troca {c['sync_offset_seconds']} s em relação à palavra falada (negativo = antes).",
                 f"- **Exemplos:** {' / '.join(c['examples'])}",
                 f"- **Funciona sem som:** {'sim' if t['works_without_sound'] else 'não'}."]
    else:
        rows.append("- **Nenhuma legenda** encontrada.")
    rows += ["", "**Outros textos** (etiquetas, cards, títulos):", "", "| De | Até | Texto | Posição (x, y) |", "|---|---|---|---|"]
    rows += [f"| {o['from']:.2f} | {o['to']:.2f} | {o['text']} | {o['box'][0]:.2f}, {o['box'][1]:.2f} |" for o in t["other_texts"]]
    return rows


def section_sound(d):
    s = d["sound"]
    if s.get("silent"):
        return ["## 5. O som", "", "- A referência é muda. **[OLHAR]** A voz, a música e os efeitos vêm do roteiro e da receita do estilo."]
    music, effects = s["music"], s["effects"] or {}
    return ["## 5. O som", "",
            f"- **Volume:** {s['loudness']['lufs']} LUFS, pico {s['loudness']['peak_db']} dB.",
            f"- **Música por baixo:** {'sim' if music['has_music_bed'] else 'não' if music['has_music_bed'] is False else '?'} "
            f"(as pausas ficam {music['gap_vs_speech_db']} dB abaixo da fala).",
            f"- **Efeitos:** {effects.get('effects_detected', 0)} ataques; {effects.get('on_cuts', 0)} em cortes, "
            f"{effects.get('on_camera_moves', 0)} em movimentos; {round(effects.get('share_of_moves_with_effect', 0) * 100)}% dos movimentos têm efeito.",
            f"- Tempos: {', '.join(str(x) for x in effects.get('times', [])[:20])}", "",
            "**[OLHAR] Que efeitos são** (whoosh, pop, impacto, sino) e a música (calma, tensa, batida)."]


def write_markdown(path, d):
    post = d["post"]
    head = [f"# Decupagem: {d['name']}", "",
            f"Fonte: {d['source']} · {d['duration']} s a {d['fps']:.0f} qps · "
            f"{post.get('view_count') or '?'} visualizações, {post.get('like_count') or '?'} curtidas", "",
            "Tudo medido no Mac. As partes **[OLHAR]** são completadas abrindo `folhas/` e `tomadas/`.", ""]
    body = section_speech(d) + [""] + section_camera(d) + [""] + section_look(d) + [""] + section_text(d) + [""] + section_sound(d)
    path.write_text("\n".join(head + body) + "\n", encoding="utf-8")
