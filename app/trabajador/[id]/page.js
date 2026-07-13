"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getTrabajador, getAreasConBases, transferirTrabajador } from "../../../lib/data";
import { useRealtime } from "../../../lib/useRealtime";
import { Header, Badge, Spinner } from "../../../components/ui";
import FormEntidad from "../../../components/FormEntidad";
import Incidencias from "../../../components/Incidencias";

export default function TrabajadorPage({ params }) {
  const { id } = params;
  const { data, loading, reload } = useRealtime(
    () => getTrabajador(id),
    ["trabajadores", "asignaciones", "incidencias", "vehiculos", "bases"],
    [id]
  );
  const [editar, setEditar] = useState(false);
  const [transferir, setTransferir] = useState(false);
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
              {t.id_personal && <Badge>ID {t.id_personal}</Badge>}
              {t.de_baja && <Badge tone="accent">De baja</Badge>}
              {t.tipo_contrato && <Badge>{t.tipo_contrato}</Badge>}
            </div>
            <p className="text-mut text-sm">
              {[t.titulo, t.puesto_trabajo].filter(Boolean).join(" · ") || "Sin datos adicionales"}
            </p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <button
                onClick={() => setEditar(true)}
                className="tap text-sm font-semibold px-4 py-2 rounded-xl bg-panel2 border border-line active:scale-95"
              >
                Editar datos
              </button>
              <button
                onClick={() => setTransferir(true)}
                className="tap text-sm font-semibold px-4 py-2 rounded-xl bg-panel2 border border-line active:scale-95"
              >
                Transferir
              </button>
            </div>
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

      {transferir && t && (
        <SheetTransferir
          trabajadorId={id}
          baseActualId={t.base?.id}
          onClose={() => setTransferir(false)}
          onSaved={() => { setTransferir(false); reload(); }}
        />
      )}
    </main>
  );
}

/* ---------- Hoja para transferir a otra base ---------- */
function SheetTransferir({ trabajadorId, baseActualId, onClose, onSaved }) {
  const [areas, setAreas] = useState(null);
  const [areaId, setAreaId] = useState("");
  const [baseId, setBaseId] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAreasConBases().then(({ data }) => setAreas(data || []));
  }, []);

  const bases = areas?.find((a) => a.id === areaId)?.bases || [];

  async function guardar() {
    if (!baseId) { setError("Elige la base de destino."); return; }
    if (baseId === baseActualId) { setError("El trabajador ya está en esa base."); return; }
    setGuardando(true); setError(null);
    const r = await transferirTrabajador(trabajadorId, baseId);
    setGuardando(false);
    if (r?.error) { setError(r.error.message); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full bg-panel border-t border-line rounded-t-3xl p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-line rounded-full mx-auto mb-4" />
        <h2 className="title text-2xl font-bold mb-1">Transferir trabajador</h2>
        <p className="text-mut text-sm mb-4">Elige el área y la base de destino.</p>

        {!areas ? (
          <p className="text-mut text-sm py-4">Cargando…</p>
        ) : (
          <>
            <label className="block mb-3">
              <span className="text-mut text-sm">Área de destino</span>
              <select
                value={areaId}
                onChange={(e) => { setAreaId(e.target.value); setBaseId(""); }}
                className="mt-1 w-full bg-panel2 border border-line rounded-xl px-3 py-3 text-ink outline-none focus:border-accent"
              >
                <option value="">— Elige área —</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-mut text-sm">Base de destino</span>
              <select
                value={baseId}
                onChange={(e) => setBaseId(e.target.value)}
                disabled={!areaId}
                className="mt-1 w-full bg-panel2 border border-line rounded-xl px-3 py-3 text-ink outline-none focus:border-accent disabled:opacity-50"
              >
                <option value="">{areaId ? "— Elige base —" : "Primero elige un área"}</option>
                {bases.map((b) => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </select>
            </label>
          </>
        )}

        {error && <p className="text-accent text-sm mt-3">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="tap flex-1 py-3 rounded-xl bg-panel2 border border-line font-semibold">
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            className="tap flex-1 py-3 rounded-xl bg-accent text-white font-semibold disabled:opacity-50"
          >
            {guardando ? "Transfiriendo…" : "Transferir"}
          </button>
        </div>
      </div>
    </div>
  );
}
