"use client";
import { useState, useEffect } from "react";
import { getCSSAdjuntosMulti, subirCSSAdjuntoMulti, borrarCSSAdjuntoMulti } from "../lib/data";

function esImagen(tipo, nombre = "") {
  return (tipo || "").startsWith("image/") || /\.(png|jpe?g|gif|webp|heic)$/i.test(nombre);
}

/**
 * Muestra los adjuntos de una entrada directamente en el listado,
 * con botón para añadir más y botón para borrar. Sin necesidad de editar.
 */
export default function AdjuntosInline({ tabla, registroId, legado, onAbrirVisor, onLegadoBorrado }) {
  const [adjuntos, setAdjuntos] = useState([]);
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    if (registroId) {
      getCSSAdjuntosMulti(tabla, registroId).then(setAdjuntos).catch(() => {});
    }
  }, [tabla, registroId]);

  async function elegir(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setSubiendo(true);
    for (const f of files) {
      await subirCSSAdjuntoMulti(tabla, registroId, f);
    }
    const fresh = await getCSSAdjuntosMulti(tabla, registroId);
    setAdjuntos(fresh);
    setSubiendo(false);
  }

  async function borrar(a) {
    await borrarCSSAdjuntoMulti(a.id, a.ruta);
    setAdjuntos((l) => l.filter((x) => x.id !== a.id));
  }

  const todos = [
    ...(legado?.nombre ? [{ id: "__legado__", url: legado.url, nombre: legado.nombre, tipo: "" }] : []),
    ...adjuntos,
  ];

  return (
    <div className="mt-3">
      {todos.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {todos.map((a) => (
            <div key={a.id} className="relative">
              <button
                type="button"
                onClick={() => onAbrirVisor({ url: a.url, nombre: a.nombre, tipo: a.tipo })}
                className="flex items-center gap-1.5 bg-panel2 border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink active:scale-95"
              >
                {esImagen(a.tipo, a.nombre) ? "🖼️" : "📄"}
                <span className="max-w-[120px] truncate">{a.nombre}</span>
              </button>
              {a.id !== "__legado__" && (
                <button
                  onClick={() => borrar(a)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-accent text-white text-[10px] grid place-items-center leading-none"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-mut cursor-pointer active:scale-95">
        {subiendo ? "Subiendo…" : "+ Añadir archivo"}
        {!subiendo && (
          <input type="file" multiple onChange={elegir} className="hidden" />
        )}
      </label>
    </div>
  );
}
