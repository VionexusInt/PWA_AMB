"use client";
import { urlAdjunto } from "./data";

async function bytesDeUrl(url) {
  const res = await fetch(url);
  return new Uint8Array(await res.arrayBuffer());
}

// Decodifica cualquier imagen que el navegador entienda y la devuelve como PNG
async function imagenAPng(url) {
  const blob = await (await fetch(url)).blob();
  const bmp = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  canvas.getContext("2d").drawImage(bmp, 0, 0);
  const dataUrl = canvas.toDataURL("image/png");
  const bin = atob(dataUrl.split(",")[1]);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

/**
 * Genera y descarga un PDF con los datos de UNA incidencia y sus adjuntos.
 * NO incluye ningún dato de origen (base, trabajador o vehículo).
 */
export async function exportarIncidenciaPDF(inc, adjuntos = []) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontB = await pdf.embedFont(StandardFonts.HelveticaBold);

  const A4 = [595.28, 841.89];
  const margin = 50;
  const tinta = rgb(0.1, 0.12, 0.14);
  const gris = rgb(0.45, 0.5, 0.55);

  let page = pdf.addPage(A4);
  let y = A4[1] - margin;

  const linea = (text, size, f, color = tinta, gap = 8) => {
    page.drawText(text || "", { x: margin, y, size, font: f, color });
    y -= size + gap;
  };

  linea("INFORME DE INCIDENCIA", 20, fontB);
  linea(new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }), 10, font, gris, 16);

  if (inc.tipo) linea(`Tipo: ${inc.tipo}`, 12, font);
  linea(`Fecha del incidente: ${new Date(inc.fecha).toLocaleString("es-ES")}`, 12, font);
  linea(`Estado: ${inc.resuelta ? "Resuelta" : "Pendiente"}`, 12, font);
  if (inc.resuelta && inc.fecha_resolucion)
    linea(`Resuelta el: ${new Date(inc.fecha_resolucion).toLocaleString("es-ES")}`, 12, font);

  y -= 10;
  linea("Descripción", 12, fontB, tinta, 6);

  // Descripción con salto de línea
  const maxW = A4[0] - margin * 2;
  (inc.descripcion || "").split("\n").forEach((parrafo) => {
    let line = "";
    parrafo.split(/\s+/).forEach((w) => {
      const test = line ? line + " " + w : w;
      if (font.widthOfTextAtSize(test, 12) > maxW) { linea(line, 12, font); line = w; }
      else line = test;
    });
    linea(line, 12, font);
  });

  // Adjuntos
  for (const a of adjuntos) {
    const url = urlAdjunto(a.ruta);
    const esPdf = (a.tipo || "").includes("pdf") || /\.pdf$/i.test(a.nombre || "");
    try {
      if (esPdf) {
        const src = await PDFDocument.load(await bytesDeUrl(url));
        const paginas = await pdf.copyPages(src, src.getPageIndices());
        paginas.forEach((p) => pdf.addPage(p));
      } else {
        const img = await pdf.embedPng(await imagenAPng(url));
        const p = pdf.addPage(A4);
        const escala = Math.min((A4[0] - margin * 2) / img.width, (A4[1] - margin * 2) / img.height, 1);
        const w = img.width * escala;
        const h = img.height * escala;
        p.drawImage(img, { x: (A4[0] - w) / 2, y: (A4[1] - h) / 2, width: w, height: h });
      }
    } catch (e) {
      // adjunto ilegible: se omite sin romper el informe
    }
  }

  const out = await pdf.save();
  const blob = new Blob([out], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  const fechaCorta = new Date(inc.fecha).toISOString().slice(0, 10);
  link.download = `incidencia_${(inc.tipo || "informe").toLowerCase().replace(/\s+/g, "-")}_${fechaCorta}.pdf`;
  link.click();
  URL.revokeObjectURL(link.href);
}
