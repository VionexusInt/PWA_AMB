"use client";

/**
 * Genera y descarga un PDF de informe (trabajadores/vehículos/incidencias)
 * dibujado por nosotros con pdf-lib. No usa window.print(), así que no
 * lleva cabecera/pie del navegador (sin URL, sin título de la pestaña)
 * y funciona igual en móvil que en PC.
 */
export async function exportarInformePDF({ secciones, alcanceTexto, trabajadores, vehiculos, incidencias, baseMap }) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontB = await pdf.embedFont(StandardFonts.HelveticaBold);

  const A4 = [841.89, 595.28]; // apaisado, más cómodo para tablas
  const margin = 40;
  const tinta = rgb(0.1, 0.12, 0.14);
  const gris = rgb(0.5, 0.53, 0.58);
  const linea = rgb(0.82, 0.84, 0.87);

  let page = pdf.addPage(A4);
  let y = A4[1] - margin;

  function nuevaPagina() {
    page = pdf.addPage(A4);
    y = A4[1] - margin;
  }

  function asegurarEspacio(alto) {
    if (y - alto < margin) nuevaPagina();
  }

  function texto(t, x, size, f = font, color = tinta) {
    page.drawText(String(t ?? ""), { x, y, size, font: f, color });
  }

  // Cabecera de la primera página
  texto(alcanceTexto, margin, 10, font, gris);
  const fecha = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  const anchoFecha = font.widthOfTextAtSize(fecha, 10);
  texto(fecha, A4[0] - margin - anchoFecha, 10, font, gris);
  y -= 24;

  function recortar(s, maxW, size, f) {
    s = String(s ?? "");
    if (f.widthOfTextAtSize(s, size) <= maxW) return s;
    while (s.length > 1 && f.widthOfTextAtSize(s + "…", size) > maxW) s = s.slice(0, -1);
    return s + "…";
  }

  function tabla(titulo, filas, columnas) {
    // columnas: [{ label, width, get(item) }]
    asegurarEspacio(46);
    texto(`${titulo} (${filas.length})`, margin, 14, fontB);
    y -= 20;

    if (!filas.length) {
      texto("Sin registros.", margin, 10, font, gris);
      y -= 22;
      return;
    }

    function cabecera() {
      let x = margin;
      columnas.forEach((c) => {
        texto(c.label.toUpperCase(), x, 9, fontB, gris);
        x += c.width;
      });
      y -= 6;
      page.drawLine({ start: { x: margin, y }, end: { x: A4[0] - margin, y }, thickness: 0.75, color: linea });
      y -= 14;
    }

    cabecera();
    filas.forEach((item) => {
      asegurarEspacio(18);
      if (y === A4[1] - margin - 24 && page !== pdf.getPages()[pdf.getPages().length - 1]) {
        // no-op, seguridad
      }
      let x = margin;
      columnas.forEach((c) => {
        const val = recortar(c.get(item), c.width - 6, 9.5, font);
        texto(val, x, 9.5, font, tinta);
        x += c.width;
      });
      y -= 8;
      page.drawLine({ start: { x: margin, y }, end: { x: A4[0] - margin, y }, thickness: 0.5, color: linea });
      y -= 14;
    });
    y -= 14;
  }

  if (secciones.trab) {
    tabla("Trabajadores", trabajadores, [
      { label: "Nombre", width: 170, get: (t) => t.nombre },
      { label: "ID", width: 70, get: (t) => t.id_personal || "—" },
      { label: "Puesto", width: 200, get: (t) => [t.titulo, t.puesto_trabajo].filter(Boolean).join(" · ") || "—" },
      { label: "Contrato", width: 110, get: (t) => t.tipo_contrato || "—" },
      { label: "Baja", width: 55, get: (t) => (t.de_baja ? "Sí" : "No") },
      { label: "Base", width: 140, get: (t) => t.base?.nombre || baseMap[t.base?.id || t.base_id]?.nombre || "—" },
      { label: "Área", width: 130, get: (t) => baseMap[t.base?.id || t.base_id]?.areaNombre || "—" },
    ]);
  }

  if (secciones.veh) {
    tabla("Vehículos", vehiculos, [
      { label: "Matrícula", width: 150, get: (v) => v.matricula || "—" },
      { label: "ID", width: 90, get: (v) => v.id_personal || "—" },
      { label: "Modelo", width: 180, get: (v) => v.modelo || "—" },
      { label: "Clase", width: 130, get: (v) => v.clase || "—" },
      { label: "Base", width: 160, get: (v) => v.base?.nombre || baseMap[v.base?.id || v.base_id]?.nombre || "—" },
      { label: "Área", width: 130, get: (v) => baseMap[v.base?.id || v.base_id]?.areaNombre || "—" },
    ]);
  }

  if (secciones.inc) {
    function origen(i) {
      if (i.trabajador) return `Trabajador: ${i.trabajador.nombre}`;
      if (i.vehiculo) return `Vehículo: ${i.vehiculo.matricula || "—"}`;
      if (i.base) return `Base: ${i.base.nombre}`;
      return "—";
    }
    tabla("Incidencias", incidencias, [
      { label: "Tipo", width: 100, get: (i) => i.tipo || "—" },
      { label: "Descripción", width: 280, get: (i) => i.descripcion },
      { label: "Origen", width: 190, get: (i) => origen(i) },
      { label: "Fecha", width: 90, get: (i) => new Date(i.fecha).toLocaleDateString("es-ES") },
      { label: "Estado", width: 90, get: (i) => (i.resuelta ? "Resuelta" : "Pendiente") },
    ]);
  }

  const out = await pdf.save();
  const blob = new Blob([out], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `informe_${new Date().toISOString().slice(0, 10)}.pdf`;
  link.click();
  URL.revokeObjectURL(link.href);
}
