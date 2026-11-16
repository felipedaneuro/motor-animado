// kit.js dos estilos med3d: o box de emergência inteiro vem do motor (`motor/clinica.js`), em dois visuais —
// **palito** (formas simples, cores saturadas, as pessoas desenhadas em 2D) e **pixel** (tudo em pixel art
// chapada, o tratamento do retro-64bits). Quem escolhe é `estilo.json` → `clinic.look`, trocável em
// Estilo → Personalizar. Nada de boneco 3D articulado: o paciente e o médico são desenhos num plano.
//
// A interface clínica (faixa de estado, sinais vitais, etiquetas, cartão de decisão, resumo) é o que este estilo
// entrega de verdade e fica em `hud-clinico.js`, em HTML por cima da cena.
export { clinicRoom, CLINIC_LOOKS } from "../motor/clinica.js";
