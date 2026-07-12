"use client";
import { useState } from "react";
import { resolverIncidencia } from "../lib/data";
import { Badge } from "./ui";
import FormEntidad from "./FormEntidad";

/**
 * Sección de incidencias reutilizable.
 * @param items     lista de incidencias
 * @param incField  "base_id" | "trabajador_id" | "vehiculo_id"
 * @param parentId  id del padre al que se cuelgan las nuevas
 * @param onChange  se llama tras cualquier cambio para recargar
 */
export default function Incidencias({ items, incField, parentId, onChange }) {
  const [form, setForm] = useState(null); // null | {modo, registro?}

  async function toggle(i) {
    await resolverIncidencia(i.id, !i.resuelta);
    onChange?.();
  }

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="title text-xl font-bold">Incidencias</h2>
        <button
          onClick={() => setForm({ modo: "add" })}
          className="tap text-sm font-semibold px-3 py-1.5 rounded-full bg-accent text-white active:scale-95"
        >
          + Añadir
        </button>
      </div>

      {!items.length ? (
        <p className="text-mut text-sm py-2">Sin incidencias.</p>
      ) : (
        <div className="grid gap-2">
          {items.map((i) => (
            <div
              key={i.id}
              className={`border rounded-xl p-4 ${
                i.resuelta ? "bg-panel border-line opacity-70" : "bg-panel border-accent/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className={i.resuelta ? "line-through text-mut" : "text-ink"}>{i.descripcion}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggle(i)}
                    className={`tap text-xs font-bold px-3 py-1.5 rounded-full border ${
                      i.resuelta ? "bg-panel2 text-mut border-line" : "bg-ok/15 text-ok border-ok/40"
                    }`}
                  >
                    {i.resuelta ? "Reabrir" : "Resolver"}
                  </button>
                  <button
                    onClick={() => setForm({ modo: "edit", registro: i })}
                    aria-label="Editar"
                    className="tap w-8 h-8 rounded-full grid place-items-center bg-panel2 border border-line text-mut active:scale-95"
                  >
                    ✎
                  </button>
                </div>
              </div>
              <p className="text-mut text-xs mt-2">
                {new Date(i.fecha).toLocaleString("es-ES")}
                {i.resuelta && i.fecha_resolucion &&
                  ` · resuelta ${new Date(i.fecha_resolucion).toLocaleDateString("es-ES")}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {form && (
        <FormEntidad
          tipo="inc"
          modo={form.modo}
          parentId={parentId}
          incField={incField}
          registro={form.registro}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); onChange?.(); }}
        />
      )}
    </section>
  );
}
