"use client";
import { useState } from "react";
import Link from "next/link";
import { getInicio } from "../../lib/data";
import { useRealtime } from "../../lib/useRealtime";
import { Header, Badge, Spinner } from "../../components/ui";
import FormEntidad from "../../components/FormEntidad";

export default function AreasPage() {
  const { data: areas, loading, reload } = useRealtime(
    getInicio,
    ["areas", "bases", "incidencias", "trabajadores", "vehiculos"],
    []
  );
  const [form, setForm] = useState(null); // null | {modo, registro?}
  const totalPendientes = (areas || []).reduce((s, a) => s + (a.pendientes || 0), 0);

  return (
    <main className="pb-24">
      <Header titulo="Áreas" subtitulo={areas ? `${areas.length} áreas` : ""} back />

      {/* Accesos rápidos */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Link href="/trabajadores" className="tap bg-panel border border-line rounded-2xl p-4 active:scale-[.98] transition-transform">
            <div className="text-2xl mb-1">👤</div>
            <h2 className="font-bold leading-tight">Trabajadores</h2>
            <p className="text-mut text-xs mt-0.5">Ver todos</p>
          </Link>
          <Link href="/vehiculos" className="tap bg-panel border border-line rounded-2xl p-4 active:scale-[.98] transition-transform">
            <div className="text-2xl mb-1">🚑</div>
            <h2 className="font-bold leading-tight">Vehículos</h2>
            <p className="text-mut text-xs mt-0.5">Ver todos</p>
          </Link>
        </div>
        <Link href="/bolsa" className="tap flex items-center justify-between bg-panel border border-line rounded-2xl p-4 active:scale-[.98] transition-transform">
          <div className="flex items-center gap-3">
            <div className="text-2xl">📋</div>
            <div>
              <h2 className="font-bold leading-tight">Bolsa de trabajadores</h2>
              <p className="text-mut text-xs mt-0.5">Despedidos y pendientes de readmisión</p>
            </div>
          </div>
        </Link>
        <Link href="/incidencias" className="tap flex items-center justify-between bg-panel border border-line rounded-2xl p-4 active:scale-[.98] transition-transform">
          <div className="flex items-center gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h2 className="font-bold leading-tight">Incidencias</h2>
              <p className="text-mut text-xs mt-0.5">Ver todas</p>
            </div>
          </div>
          {totalPendientes > 0 && <Badge tone="accent">{totalPendientes} sin resolver</Badge>}
        </Link>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="px-4 mt-4 grid gap-3">
          {(areas || []).map((a) => (
            <div key={a.id} className="relative">
              <Link
                href={`/area/${a.id}`}
                className="tap block bg-panel border border-line rounded-2xl p-4 pr-14 active:scale-[.98] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="title text-2xl font-bold">{a.nombre}</h2>
                    <p className="text-mut text-sm mt-0.5">{a.n_bases} bases</p>
                  </div>
                  {a.pendientes > 0 ? (
                    <Badge tone="accent">{a.pendientes} incidencias</Badge>
                  ) : (
                    <Badge tone="ok">Sin incidencias</Badge>
                  )}
                </div>
              </Link>
              <button
                onClick={() => setForm({ modo: "edit", registro: a })}
                aria-label="Editar área"
                className="tap absolute top-3 right-3 w-9 h-9 rounded-full grid place-items-center bg-panel2 border border-line text-mut active:scale-95"
              >
                ✎
              </button>
            </div>
          ))}
          {!(areas || []).length && (
            <p className="text-mut text-center py-10">No hay áreas. Pulsa + para añadir.</p>
          )}
        </div>
      )}

      {!loading && (
        <button
          onClick={() => setForm({ modo: "add" })}
          className="tap fixed bottom-[calc(env(safe-area-inset-bottom)+18px)] right-5 w-14 h-14 rounded-full bg-accent text-white text-3xl grid place-items-center shadow-lg shadow-accent/30 active:scale-95"
          aria-label="Añadir área"
        >
          +
        </button>
      )}

      {form && (
        <FormEntidad
          tipo="area"
          modo={form.modo}
          registro={form.registro}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); reload(); }}
        />
      )}
    </main>
  );
}
