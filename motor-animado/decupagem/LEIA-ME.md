# Decupagem: o estudo das referências

Aqui mora a **análise escrita** de cada vídeo de referência que deu origem a um estilo: `<nome>/decupagem.md`
(a leitura completa, com os segundos de cada coisa) e os `.json` com os números medidos (fala, câmera, tomadas).

O material **pesado** (o vídeo de referência, os quadros e as folhas de contato) não vem no pacote, para ele não
pesar centenas de megabytes. Para baixar e refazer tudo neste computador, quando quiser:

```bash
bash baixar-extras.sh --listar   # o que existe e o que falta
bash baixar-extras.sh            # baixa e estuda
```

Nada disso é necessário para usar o painel: os estilos já vêm prontos. A decupagem serve para estudar a fórmula de
um vídeo que deu certo, ou para criar um estilo novo a partir de outra referência:

```bash
motor-animado/ferramentas/py decupar.py "<link do vídeo>" --nome meu-estilo --ate 15
```
