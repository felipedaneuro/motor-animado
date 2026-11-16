# A voz

A voz vem antes da cena: o tempo de cada palavra é o relógio do vídeo (a peça entra na palavra que fala dela).

## Três caminhos
| Caminho | Comando | Custo |
|---|---|---|
| Voz de teste do Mac (Luciana, Flo, Eddy...) | `voz.py roteiro.txt --teste` | grátis; só para testar o fluxo |
| ElevenLabs (voz clonada ou pronta) | `voz.py roteiro.txt --custo`, o ok, depois `--elevenlabs` | ~US$ 0,20 por 1.000 caracteres (veja `perfil.json`) |
| A pessoa grava | ela lê o `roteiro.txt` num lugar quieto e manda `voz/voz.wav` | grátis |

Pelo conector da ElevenLabs, quando ele estiver ligado no app: use o texto de `voz/texto-voz.txt` (já com as pronúncias), uma tomada só, baixe para `voz/voz.mp3` e converta com `ffmpeg -i voz/voz.mp3 -ar 48000 voz/voz.wav`.

## ElevenLabs
1. `perfil.json`: `voice.voice_id` (na lista de vozes, "Copy Voice ID") e `voice.model_id` (`eleven_multilingual_v2`).
2. A chave fica no `.env` da pasta: `ELEVENLABS_API_KEY=...`. **Nunca no chat, nunca no código.**
3. **Sempre `--custo` antes e o ok da pessoa.** O mesmo texto com a mesma voz não é gerado duas vezes (cache em `voz/cache/`).

## Depois da voz (sempre)
```
ferramentas/py transcrever.py voz/voz.wav --saida voz --lingua pt
ferramentas/py alinhar.py roteiro.txt voz/voz.json voz/voz.wav voz/tempos.json
```
É normal ficarem sem par números, "pra" e siglas (o tempo é repartido entre as vizinhas). Mais de 15% sem par: ouça a voz, ela pode ter pulado frases.

## Pronúncias
`voz/pronuncias.txt`, uma por linha: `NMDA = ene-eme-dê-á`, `AVC = á-vê-cê`. Valem só para o áudio; a legenda usa a grafia do roteiro.

## Trocar só algumas frases (sem pagar tudo de novo)
1. Guarde `voz/voz.wav` como `voz/voz-original.wav` e `voz/tempos.json` como `voz/tempos-original.json`.
2. `voz.py roteiro.txt --elevenlabs --frases 1,3` (mostre o custo antes): grava `voz/novas/f1.wav`, `f3.wav`.
3. `emendar.py voz/voz-original.wav voz/tempos-original.json voz/novas voz/voz.wav`.
4. Transcrever e alinhar de novo.

## Modo "a imagem manda" (sync: beats)
Para copiar o ritmo exato da referência: `encaixar.py voz/voz.wav voz/tempos.json decupagem/<estilo>/fala.json voz/voz-encaixada.wav`. Cada frase vai para o segundo da frase equivalente da referência, acelerando no máximo 12%. Se avisar "encurte a frase", encurte no roteiro (não acelere mais). Use `voz-encaixada.wav` e `voz-encaixada.json` no `montar.py`.
