"use client";
import { useState } from "react";
import { getAdjuntos, urlAdjunto, getCSSAdjuntosMulti } from "../lib/data";
import VisorArchivo from "./VisorArchivo";

function esImagen(tipo, nombre = "") {
  return (tipo || "").startsWith("image/") || /\.(png|jpe?g|gif|webp|heic)$/i.test(nombre);
}

/**
 * Botón "📎 N" que, al tocarlo, despliega los archivos de una incidencia
 * (sin necesidad de entrar a editar) y permite abrirlos en el visor.
 * origenEmpresa=true para incidencias del Comité de Empresa (otro almacén).
 */
export default function AdjuntosVerIncidencia({ incidenciaId, n, origenEmpresa = false }) {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [items, setItems] = useState(null);
  const [visor, setVisor] = useState(null);

  async function toggle() {
    if (!abierto && items === null) {
      setCargando(true);
      if (origenEmpresa) {
        const data = await getCSSAdjuntosMulti("incidencias_empresa", incidenciaId);
        setItems(data || []);
      } else {
        const { data } = await getAdjuntos(incidenciaId);
        setItems(data || []);
      }
      setCargando(false);
    }
    setAbierto((v) => !v);
  }

  if (!n) return null;

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={toggle}
        className="text-mut text-xs font-semibold underline decoration-dotted active:scale-95"
      >
        📎 {n} {abierto ? "▲" : "▼"}
      </button>
      {abierto && (
        <div className="mt-1.5 flex flex-wrap gap-2">
          {cargando && <span className="text-mut text-xs">Cargando…</span>}
          {items?.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setVisor({ url: a.url || urlAdjunto(a.ruta), nombre: a.nombre, tipo: a.tipo })}
              className="flex items-center gap-1.5 bg-panel2 border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink active:scale-95"
            >
              {esImagen(a.tipo, a.nombre) ? "🖼️" : "📄"}
              <span className="max-w-[120px] truncate">{a.nombre}</span>
            </button>
          ))}
        </div>
      )}
      {visor && (
        <VisorArchivo url={visor.url} nombre={visor.nombre} tipo={visor.tipo} onClose={() => setVisor(null)} />
      )}
    </div>
  );
}
