// visao.swift: lê imagens com o Vision da Apple, no próprio Mac (nada sai do computador).
// Para cada imagem: os textos na tela (com a caixa e a confiança), a região que chama a atenção (saliência),
// as pessoas e os rostos. O decupar.py compila uma vez (swiftc) e chama com a lista de quadros.
//
// Uso: visao <imagem> [<imagem> ...]      -> uma linha JSON por imagem, na saída padrão
// Caixas em frações da imagem, com a origem no canto de cima à esquerda: [x, y, largura, altura].
import Foundation
import Vision
import AppKit

struct Found: Encodable {
    let file: String
    let texts: [TextBox]
    let attention: [[Double]]
    let humans: [[Double]]
    let faces: [[Double]]
}

struct TextBox: Encodable {
    let text: String
    let confidence: Double
    let box: [Double]
}

func topLeft(_ rect: CGRect) -> [Double] {
    let r = { (v: CGFloat) in (Double(v) * 1000).rounded() / 1000 }
    return [r(rect.origin.x), r(1 - rect.origin.y - rect.height), r(rect.width), r(rect.height)]
}

func textRequest() -> VNRecognizeTextRequest {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.recognitionLanguages = ["pt-BR", "en-US", "es-ES"]
    request.usesLanguageCorrection = false
    return request
}

func analyze(_ path: String) -> Found? {
    guard let image = NSImage(contentsOfFile: path),
          let cg = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else { return nil }
    let text = textRequest()
    let attention = VNGenerateAttentionBasedSaliencyImageRequest()
    let humans = VNDetectHumanRectanglesRequest()
    let faces = VNDetectFaceRectanglesRequest()
    let handler = VNImageRequestHandler(cgImage: cg, options: [:])
    do { try handler.perform([text, attention, humans, faces]) } catch { return nil }
    let texts = (text.results ?? []).compactMap { obs -> TextBox? in
        guard let best = obs.topCandidates(1).first else { return nil }
        return TextBox(text: best.string, confidence: Double(best.confidence), box: topLeft(obs.boundingBox))
    }
    let salient = (attention.results?.first?.salientObjects ?? []).map { topLeft($0.boundingBox) }
    return Found(file: path, texts: texts, attention: salient,
                 humans: (humans.results ?? []).map { topLeft($0.boundingBox) },
                 faces: (faces.results ?? []).map { topLeft($0.boundingBox) })
}

let encoder = JSONEncoder()
for path in CommandLine.arguments.dropFirst() {
    autoreleasepool {
        if let found = analyze(path), let data = try? encoder.encode(found), let line = String(data: data, encoding: .utf8) {
            print(line)
        } else {
            print("{\"file\": \"\(path)\", \"error\": \"não consegui ler\"}")
        }
    }
}
