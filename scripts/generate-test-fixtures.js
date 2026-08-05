// Genera fixtures locales para las pruebas end-to-end de Playwright:
// un CV en PDF válido y simple, y un archivo de texto plano inválido
// (para probar el flujo de rechazo de tipos de archivo no soportados).
const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "..", "e2e", "fixtures");
fs.mkdirSync(outDir, { recursive: true });

const cvLines = [
  "Ana Garcia Lopez",
  "Ingeniera de Software",
  "Email: ana.garcia@example.com | Telefono: +52 55 1234 5678",
  "Ubicacion: Ciudad de Mexico, Mexico",
  "",
  "Resumen",
  "Ingeniera de software con 6 anios de experiencia en desarrollo web",
  "full-stack, especializada en aplicaciones React y Node.js.",
  "",
  "Experiencia laboral",
  "Ingeniera de Software Senior - Acme Corp",
  "Enero 2021 - Presente",
  "Lidere el desarrollo de una plataforma de analisis de datos usando",
  "React, TypeScript y Node.js, mejorando el rendimiento en un 40%.",
  "",
  "Desarrolladora de Software - Beta Soluciones",
  "Marzo 2018 - Diciembre 2020",
  "Desarrolle APIs REST y interfaces de usuario para clientes",
  "empresariales usando JavaScript y PostgreSQL.",
  "",
  "Educacion",
  "Licenciatura en Ciencias de la Computacion",
  "Universidad Nacional Autonoma de Mexico, 2013 - 2017",
  "",
  "Habilidades",
  "JavaScript, TypeScript, React, Node.js, PostgreSQL, Docker, AWS",
];

function escapePdfText(text) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

const fontSize = 11;
const leading = 16;
const startY = 760;
const startX = 50;

let contentOps = `BT\n/F1 ${fontSize} Tf\n${startX} ${startY} Td\n${leading} TL\n`;
cvLines.forEach((line, index) => {
  if (index > 0) contentOps += "T*\n";
  contentOps += `(${escapePdfText(line)}) Tj\n`;
});
contentOps += "ET";

const contentBytes = Buffer.from(contentOps, "latin1");

const objects = [];
objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
objects[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
objects[3] =
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>";
objects[4] = null; // se maneja aparte por ser stream binario
objects[5] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

const header = Buffer.from("%PDF-1.4\n", "latin1");

const parts = [header];
const offsets = [0]; // offsets[0] no se usa (objeto 0 libre)
let currentOffset = header.length;

function pushObj(num, buf) {
  offsets[num] = currentOffset;
  parts.push(buf);
  currentOffset += buf.length;
}

pushObj(1, Buffer.from(`1 0 obj\n${objects[1]}\nendobj\n`, "latin1"));
pushObj(2, Buffer.from(`2 0 obj\n${objects[2]}\nendobj\n`, "latin1"));
pushObj(3, Buffer.from(`3 0 obj\n${objects[3]}\nendobj\n`, "latin1"));

const streamObjHeader = Buffer.from(
  `4 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`,
  "latin1"
);
const streamObjFooter = Buffer.from("\nendstream\nendobj\n", "latin1");
offsets[4] = currentOffset;
parts.push(streamObjHeader, contentBytes, streamObjFooter);
currentOffset += streamObjHeader.length + contentBytes.length + streamObjFooter.length;

pushObj(5, Buffer.from(`5 0 obj\n${objects[5]}\nendobj\n`, "latin1"));

const xrefOffset = currentOffset;
const numObjects = 6;
let xref = `xref\n0 ${numObjects}\n0000000000 65535 f \n`;
for (let i = 1; i < numObjects; i++) {
  xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
}
const trailer = `trailer\n<< /Size ${numObjects} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

parts.push(Buffer.from(xref + trailer, "latin1"));

const pdfBuffer = Buffer.concat(parts);
const pdfPath = path.join(outDir, "valid_cv.pdf");
fs.writeFileSync(pdfPath, pdfBuffer);
console.log(`PDF generado: ${pdfPath} (${pdfBuffer.length} bytes)`);

const invalidPath = path.join(outDir, "invalid_file.txt");
fs.writeFileSync(
  invalidPath,
  "Este es un archivo de texto plano, no un PDF ni un DOCX. Se usa para probar el rechazo de tipos de archivo no soportados.\n",
  "utf-8"
);
console.log(`Archivo invalido generado: ${invalidPath}`);
