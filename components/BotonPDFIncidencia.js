"use client";
import { useState } from "react";
import { getAdjuntos, getCSSAdjuntosMulti } from "../lib/data";
import { exportarIncidenciaPDF } from "../lib/pdfIncidencia";

export default function BotonPDFIncidencia({ incidencia }) {
  const [gen, setGen] = useState(false);

  async function exportar() {
    setGen(true);
    try {
      let adjuntos = [];
      if (incidencia._origenEmpresa) {
        adjuntos = await getCSSAdjuntosMulti("incidencias_empresa", incidencia.id);
      } else {
        const { data } = await getAdjuntos(incidencia.id);
        adjuntos = data || [];
      }
      await exportarIncidenciaPDF(incidencia, adjuntos);
    } catch (e) {
      alert("No se pudo generar el PDF de la incidencia.");
    }
    setGen(false);
  }

  return (
    <button
      onClick={exportar}
      disabled={gen}
      aria-label="Exportar incidencia a PDF"
      className="tap shrink-0 w-8 h-8 rounded-full grid place-items-center bg-panel2 border border-line text-mut active:scale-95 disabled:opacity-50"
      title="Exportar a PDF"
    >
      {gen ? "…" : "📄"}
    </button>
  );
}
