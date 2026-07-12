"use client";
import { useState } from "react";
import Link from "next/link";
import { getTrabajador } from "../../../lib/data";
import { useRealtime } from "../../../lib/useRealtime";
import { Header, Badge, Spinner } from "../../../components/ui";
import FormEntidad from "../../../components/FormEntidad";
import Incidencias from "../../../components/Incidencias";

export default function TrabajadorPage({ params }) {
  const { id } = params;
  const { data, loading, reload } = useRealtime(
    () => getTrabajador(id),
    ["trabajadores", "asignaciones", "incidencias", "vehiculos"],
    [id]
  );
  const [editar, setEditar] = useState(false);
  const t = data?.trabajador;

  if (!loading && !t) {
    return (
      <main>
        <Header titulo="Trabajador" back />
        <p className="px-4 mt-6 text-mut">Este trabajador ya no existe.</p>
      </main>
    );
  }

  return (
    <main className="pb-24">
      <Header titulo={t?.nombre || "Trabajador"} subtitulo={t?.base?.nombre} back />
      {loading ? (
        <Spinner />
      ) : (
        <div className="px-4 mt-4">
          {/* Datos */}
          <div className="bg-panel border border-line rounded-2xl p-4">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {t.de_baja && <Badge tone="accent">De baja</Badge>}
              {t.tipo_contrato && <Badge>{t.tipo_contrato}</Badge>}
            </div>
            <p className="text-mut text-sm">
              {[t.titulo, t.puesto_trabajo].filter(Boolean).join(" · ") || "Sin datos adicionales"}
            </p>
            <button
              onClick={() => setEditar(true)}
              className="tap mt-3 text-sm font-semibold px-4 py-2 rounded-xl bg-panel2 border border-line active:scale-95"
            >
              Editar datos
            </button>
          </div>

          {/* Coches asignados */}
          <section className="mt-6">
            <h2 className="title text-xl font-bold mb-3">Coches asignados</h2>
            {!data.asignaciones.length ? (
              <p className="text-mut text-sm">No está asignado a ningún coche.</p>
            ) : (
              <div className="grid gap-2">
                {data.asignaciones.map((a) => (
                  <Link
                    key={a.id}
                    href={`/vehiculo/${a.vehiculo?.id}`}
                    className="tap block bg-panel border border-line rounded-xl p-4 active:scale-[.98] transition-transform"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold title tracking-wide">{a.vehiculo?.matricula || "Sin matrícula"}</h3>
                      {a.rol && <Badge>{a.rol}</Badge>}
                    </div>
                    {a.vehiculo?.id_personal && <p className="text-mut text-xs mt-0.5">ID {a.vehiculo.id_personal}</p>}
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Incidencias del trabajador */}
          <Incidencias items={data.incidencias} incField="trabajador_id" parentId={id} onChange={reload} />
        </div>
      )}

      {editar && t && (
        <FormEntidad
          tipo="trab"
          modo="edit"
          registro={t}
          onClose={() => setEditar(false)}
          onSaved={() => { setEditar(false); reload(); }}
        />
      )}
    </main>
  );
}
