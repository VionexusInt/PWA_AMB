"use client";
import { useState, useEffect, useRef } from "react";
import { getCSSAdjuntosMulti, borrarCSSAdjuntoMulti, borrarArchivoLegadoCSS } from "../lib/data";

function esImagen(tipo, nombre = "") {
  return (tipo || "").startsWith("image/") || /\.(png|jpe?g|gif|webp|heic)$/i.test(nombre);
}

/**
 * Gestor de adjuntos para una entrada del CSS (seguridad o empresa).
 * - tabla: nombre de la tabla a la que pertenece la entrada (reglamentos, actas_empresa, revaloracion_riesgos...)
 * - registroId: id de la entrada (null si se está creando todavía)
 * - legado: { url, nombre } del archivo antiguo de una sola pieza (o null)
 * - pendientes / setPendientes: archivos elegidos que se subirán al guardar
 * - onLegadoBorrado: aviso al padre para refrescar la lista tras borrar el archivo antiguo
 * - onAbrir: función para abrir la vista previa
 */
export default function AdjuntosCSS({ tabla, registroId, legado, pendientes, setPendientes, onLegadoBorrado, onAbrir }) {
  const [existentes, setExistentes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (registroId) {
      setCargando(true);
      getCSSAdjuntosMulti(tabla, registroId)
        .then((d) => setExistentes(d))
        .finally(() => setCargando(false));
    } else {
      setExistentes([]);
    }
  }, [tabla, registroId]);

  function elegir(e) {
    const files = Array.from(e.target.files || []);
    setPendientes((p) => [...p, ...files]);
    e.target.value = "";
  }

  async function borrarExistente(a) {
    await borrarCSSAdjuntoMulti(a.id, a.ruta);
    setExistentes((l) => l.filter((x) => x.id !== a.id));
  }

  async function borrarLegado() {
    if (!confirm("¿Borrar este archivo?")) return;
    await borrarArchivoLegadoCSS(tabla, registroId);
    onLegadoBorrado?.();
  }

  return (
    <div className="pt-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Archivos adjuntos {pendientes.length + existentes.length + (legado?.nombre ? 1 : 0) === 0 && "(opcional)"}
      </label>

      {legado?.nombre && (
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 mb-2">
          <button
            type="button"
            onClick={() => onAbrir({ url: legado.url, nombre: legado.nombre })}
            className="text-blue-600 text-sm hover:underline truncate text-left"
          >
            📎 {legado.nombre}
          </button>
          <button type="button" onClick={borrarLegado} className="text-red-600 text-lg leading-none ml-2 px-1">×</button>
        </div>
      )}

      {existentes.map((a) => (
        <div key={a.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 mb-2">
          <button
            type="button"
            onClick={() => onAbrir({ url: a.url, nombre: a.nombre, tipo: a.tipo })}
            className="text-blue-600 text-sm hover:underline truncate text-left"
          >
            {esImagen(a.tipo, a.nombre) ? "🖼️" : "📄"} {a.nombre}
          </button>
          <button type="button" onClick={() => borrarExistente(a)} className="text-red-600 text-lg leading-none ml-2 px-1">×</button>
        </div>
      ))}

      {pendientes.map((f, i) => (
        <div key={i} className="flex items-center justify-between bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2 mb-2">
          <span className="text-sm truncate">{esImagen(f.type, f.name) ? "🖼️" : "📄"} {f.name}</span>
          <button type="button" onClick={() => setPendientes((p) => p.filter((_, j) => j !== i))} className="text-red-600 text-lg leading-none ml-2 px-1">×</button>
        </div>
      ))}
      {pendientes.length > 0 && <p className="text-xs text-mut mb-2">Se subirán al guardar.</p>}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-sm font-semibold active:scale-95"
      >
        + Añadir archivo
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={elegir}
        style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", border: 0 }}
      />
    </div>
  );
}