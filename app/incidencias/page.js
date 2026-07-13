"use client";
import { useState } from "react";
import Link from "next/link";
import { getTodasIncidencias, resolverIncidencia } from "../../lib/data";
import { useRealtime } from "../../lib/useRealtime";
import { Header, Badge, Spinner } from "../../components/ui";

// Devuelve el origen de una incidencia: tipo, nombre y enlace de acceso rápido
function origen(i) {
  if (i.trabajador) return { tipo: "Trabajador", nombre: i.trabajador.nombre, href: `/trabajador/${i.trabajador.id}` };
  if (i.vehiculo) return { tipo: "Vehículo", nombre: i.vehiculo.matricula || "Sin matrícula", href: `/vehiculo/${i.vehiculo.id}` };
  if (i.base) return { tipo: "Base", nombre: i.base.nombre, href: `/base/${i.base.id}` };
  return null;
}

export default function IncidenciasPage() {
  const { data, loading, reload } = useRealtime(
    () => getTodasIncidencias(),
    ["incidencias", "bases", "trabajadores", "vehiculos"],
    []
  );
  const [filtro, setFiltro] = useState("pendientes"); // "pendientes" | "todas"

  const todas = data || [];
  const items = filtro === "pendientes" ? todas.filter((i) => !i.resuelta) : todas;
  const nPend = todas.filter((i) => !i.resuelta).length;

  async function toggle(i) {
    await resolverIncidencia(i.id, !i.resuelta);
    reload();
  }

  return (
    <main className="pb-10">
      <Header titulo="Incidencias" subtitulo={`${nPend} sin resolver`} back />

      {/* Filtro */}
      <div className="px-4 mt-4 flex gap-2">
        {[
          { k: "pendientes", label: "Pendientes" },
          { k: "todas", label: "Todas" },
        ].map((f) => (
          <button
            key={f.k}
            onClick={() => setFiltro(f.k)}
            className={`tap px-4 py-2 rounded-full text-sm font-semibold border ${
              filtro === f.k ? "bg-accent text-white border-accent" : "bg-panel text-mut border-line"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="px-4 mt-4 grid gap-2">
          {items.map((i) => {
            const o = origen(i);
            return (
              <div
                key={i.id}
                className={`border rounded-xl p-4 ${
                  i.resuelta ? "bg-panel border-line opacity-70" : "bg-panel border-accent/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className={i.resuelta ? "line-through text-mut" : "text-ink"}>{i.descripcion}</p>
                  <button
                    onClick={() => toggle(i)}
                    className={`tap shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border ${
                      i.resuelta ? "bg-panel2 text-mut border-line" : "bg-ok/15 text-ok border-ok/40"
                    }`}
                  >
                    {i.resuelta ? "Reabrir" : "Resolver"}
                  </button>
                </div>

                {/* Origen + acceso rápido */}
                {o && (
                  <Link
                    href={o.href}
                    className="tap inline-flex items-center gap-1 mt-3 text-xs font-semibold px-3 py-1.5 rounded-full bg-panel2 border border-line text-ink active:scale-95"
                  >
                    <span className="text-mut">{o.tipo}:</span> {o.nombre} <span className="text-accent">→</span>
                  </Link>
                )}

                <p className="text-mut text-xs mt-2">
                  {new Date(i.fecha).toLocaleString("es-ES")}
                  {i.resuelta && i.fecha_resolucion &&
                    ` · resuelta ${new Date(i.fecha_resolucion).toLocaleDateString("es-ES")}`}
                </p>
              </div>
            );
          })}
          {!items.length && (
            <p className="text-mut text-center py-10">
              {filtro === "pendientes" ? "No hay incidencias sin resolver." : "No hay incidencias."}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
