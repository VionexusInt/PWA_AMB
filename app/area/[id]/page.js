"use client";
import { useState } from "react";
import Link from "next/link";
import { getArea } from "../../../lib/data";
import { useRealtime } from "../../../lib/useRealtime";
import { Header, Badge, Spinner } from "../../../components/ui";
import FormEntidad from "../../../components/Formentidad";

export default function AreaPage({ params }) {
  const { id } = params;
  const { data, loading, reload } = useRealtime(
    () => getArea(id),
    ["bases", "trabajadores", "vehiculos", "incidencias"],
    [id]
  );
  const [form, setForm] = useState(null); // null | {modo, registro?}

  return (
    <main className="pb-24">
      <Header titulo={data?.area?.nombre || "Área"} subtitulo={data ? `${data.bases.length} bases` : ""} back />

      {loading ? (
        <Spinner />
      ) : (
        <div className="px-4 mt-4 grid gap-3">
          {data.bases.map((b) => (
            <div key={b.id} className="relative">
              <Link
                href={`/base/${b.id}`}
                className="tap block bg-panel border border-line rounded-2xl p-4 pr-14 active:scale-[.98] transition-transform"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold truncate">{b.nombre}</h2>
                    <p className="text-mut text-sm">{b.tipo}</p>
                  </div>
                  {b.pendientes > 0 && <Badge tone="accent">{b.pendientes}</Badge>}
                </div>
                <div className="flex gap-2 mt-3">
                  <Badge>👤 {b.n_trab}</Badge>
                  <Badge>🚑 {b.n_veh}</Badge>
                </div>
              </Link>
              <button
                onClick={() => setForm({ modo: "edit", registro: b })}
                aria-label="Editar base"
                className="tap absolute top-3 right-3 w-9 h-9 rounded-full grid place-items-center bg-panel2 border border-line text-mut active:scale-95"
              >
                ✎
              </button>
            </div>
          ))}
          {!data.bases.length && <p className="text-mut text-center py-10">Esta área no tiene bases. Pulsa + para añadir.</p>}
        </div>
      )}

      {/* Botón flotante: añadir base */}
      {!loading && (
        <button
          onClick={() => setForm({ modo: "add" })}
          className="tap fixed bottom-[calc(env(safe-area-inset-bottom)+18px)] right-5 w-14 h-14 rounded-full bg-accent text-white text-3xl grid place-items-center shadow-lg shadow-accent/30 active:scale-95"
          aria-label="Añadir base"
        >
          +
        </button>
      )}

      {form && (
        <FormEntidad
          tipo="base"
          modo={form.modo}
          parentId={id}
          registro={form.registro}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); reload(); }}
        />
      )}
    </main>
  );
}