"use client";
import { useState } from "react";
import Link from "next/link";
import { getVehiculo, addAsignacion, updateAsignacion, deleteAsignacion, moverAsignacion } from "../../../lib/data";
import { useRealtime } from "../../../lib/useRealtime";
import { Header, Badge, Spinner } from "../../../components/ui";
import FormEntidad from "../../../components/FormEntidad";
import Incidencias from "../../../components/Incidencias";

const ROLES = ["Conductor", "Camillero", "Enfermero", "Médico", "Prácticas"];

export default function VehiculoPage({ params }) {
  const { id } = params;
  const { data, loading, reload } = useRealtime(
    () => getVehiculo(id),
    ["vehiculos", "asignaciones", "incidencias", "trabajadores"],
    [id]
  );
  const [editar, setEditar] = useState(false);
  const [asignar, setAsignar] = useState(null); // null | {registro?}

  const v = data?.vehiculo;

  if (!loading && !v) {
    return (
      <main>
        <Header titulo="Vehículo" back />
        <p className="px-4 mt-6 text-mut">Este vehículo ya no existe.</p>
      </main>
    );
  }

  const yaAsignados = (data?.asignaciones || []).map((a) => a.trabajador?.id).filter(Boolean);

  return (
    <main className="pb-24">
      <Header titulo={v?.matricula || "Sin matrícula"} subtitulo={v?.base?.nombre} back />
      {loading ? (
        <Spinner />
      ) : (
        <div className="px-4 mt-4">
          {/* Datos */}
          <div className="bg-panel border border-line rounded-2xl p-4">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {v.id_personal && <Badge>ID {v.id_personal}</Badge>}
              {v.clase && <Badge>{v.clase}</Badge>}
            </div>
            <p className="text-mut text-sm">{v.modelo || "Sin modelo"}</p>
            <button
              onClick={() => setEditar(true)}
              className="tap mt-3 text-sm font-semibold px-4 py-2 rounded-xl bg-panel2 border border-line active:scale-95"
            >
              Editar datos
            </button>
          </div>

          {/* Personal asignado */}
          <section className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="title text-xl font-bold">Personal asignado</h2>
              <button
                onClick={() => setAsignar({})}
                className="tap text-sm font-semibold px-3 py-1.5 rounded-full bg-accent text-white active:scale-95"
              >
                + Asignar
              </button>
            </div>
            {!data.asignaciones.length ? (
              <p className="text-mut text-sm">Nadie asignado todavía.</p>
            ) : (
              <div className="grid gap-2">
                {data.asignaciones.map((a) => (
                  <div key={a.id} className="bg-panel border border-line rounded-xl p-4 flex items-center justify-between gap-3">
                    <Link href={`/trabajador/${a.trabajador?.id}`} className="min-w-0 tap">
                      <h3 className="font-bold truncate">{a.trabajador?.nombre || "—"}</h3>
                      {a.trabajador?.puesto_trabajo && (
                        <p className="text-mut text-xs mt-0.5">{a.trabajador.puesto_trabajo}</p>
                      )}
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.rol && <Badge tone="accent">{a.rol}</Badge>}
                      <button
                        onClick={() => setAsignar({ registro: a })}
                        aria-label="Cambiar rol"
                        className="tap w-8 h-8 rounded-full grid place-items-center bg-panel2 border border-line text-mut active:scale-95"
                      >
                        ✎
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Incidencias del vehículo */}
          <Incidencias items={data.incidencias} incField="vehiculo_id" parentId={id} onChange={reload} />
        </div>
      )}

      {editar && v && (
        <FormEntidad
          tipo="veh"
          modo="edit"
          registro={v}
          onClose={() => setEditar(false)}
          onSaved={() => { setEditar(false); reload(); }}
        />
      )}

      {asignar && (
        <SheetAsignar
          vehiculoId={id}
          plantilla={data.plantillaBase}
          vehiculosBase={data.vehiculosBase}
          yaAsignados={yaAsignados}
          registro={asignar.registro}
          onClose={() => setAsignar(null)}
          onSaved={() => { setAsignar(null); reload(); }}
        />
      )}
    </main>
  );
}

/* ---------- Hoja para asignar / cambiar rol / quitar ---------- */
function SheetAsignar({ vehiculoId, plantilla, vehiculosBase = [], yaAsignados, registro, onClose, onSaved }) {
  const editMode = !!registro;
  const [trabajadorId, setTrabajadorId] = useState(registro?.trabajador?.id || "");
  const [rol, setRol] = useState(registro?.rol || "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [confirmar, setConfirmar] = useState(false);
  const [destino, setDestino] = useState("");

  async function transferir() {
    if (!destino) { setError("Elige el coche de destino."); return; }
    setGuardando(true); setError(null);
    const r = await moverAsignacion(registro.id, destino);
    setGuardando(false);
    if (r?.error) {
      setError(/duplicate|unique/i.test(r.error.message) ? "Esa persona ya está en ese coche." : r.error.message);
      return;
    }
    onSaved();
  }

  const disponibles = plantilla.filter((p) => !yaAsignados.includes(p.id));

  async function guardar() {
    if (!editMode && !trabajadorId) { setError("Elige una persona."); return; }
    setGuardando(true); setError(null);
    let r;
    if (editMode) r = await updateAsignacion(registro.id, rol || null);
    else r = await addAsignacion(vehiculoId, trabajadorId, rol || null);
    setGuardando(false);
    if (r?.error) {
      setError(/duplicate|unique/i.test(r.error.message) ? "Esa persona ya está asignada." : r.error.message);
      return;
    }
    onSaved();
  }

  async function quitar() {
    setGuardando(true); setError(null);
    const r = await deleteAsignacion(registro.id);
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
        <h2 className="title text-2xl font-bold mb-4">
          {editMode ? `Rol de ${registro.trabajador?.nombre || ""}` : "Asignar persona"}
        </h2>

        {/* Selector de persona (solo al asignar) */}
        {!editMode && (
          <label className="block mb-4">
            <span className="text-mut text-sm">Persona</span>
            {disponibles.length ? (
              <select
                value={trabajadorId}
                onChange={(e) => setTrabajadorId(e.target.value)}
                className="mt-1 w-full bg-panel2 border border-line rounded-xl px-3 py-3 text-ink outline-none focus:border-accent"
              >
                <option value="">— Elige —</option>
                {disponibles.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            ) : (
              <p className="text-mut text-sm mt-1">
                No quedan trabajadores libres en esta base (todos están ya asignados a este coche).
              </p>
            )}
          </label>
        )}

        {/* Rol */}
        <span className="text-mut text-sm">Rol</span>
        <div className="mt-1 flex gap-2 flex-wrap">
          {ROLES.map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setRol(rol === op ? "" : op)}
              className={`tap px-4 py-3 rounded-xl border font-semibold ${
                rol === op ? "bg-accent text-white border-accent" : "bg-panel2 text-mut border-line"
              }`}
            >
              {op}
            </button>
          ))}
        </div>

        {error && <p className="text-accent text-sm mt-3">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="tap flex-1 py-3 rounded-xl bg-panel2 border border-line font-semibold">
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando || (!editMode && !disponibles.length)}
            className="tap flex-1 py-3 rounded-xl bg-accent text-white font-semibold disabled:opacity-50"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>

        {/* Transferir a otro coche (solo al editar) */}
        {editMode && (
          <div className="mt-6 pt-5 border-t border-line">
            <span className="text-mut text-sm">Transferir a otro coche</span>
            {vehiculosBase.length ? (
              <div className="mt-1 flex gap-2">
                <select
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  className="flex-1 bg-panel2 border border-line rounded-xl px-3 py-3 text-ink outline-none focus:border-accent"
                >
                  <option value="">— Elige coche —</option>
                  {vehiculosBase.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.matricula || "Sin matrícula"}{v.id_personal ? ` (ID ${v.id_personal})` : ""}
                    </option>
                  ))}
                </select>
                <button
                  onClick={transferir}
                  disabled={guardando || !destino}
                  className="tap px-4 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-50"
                >
                  Mover
                </button>
              </div>
            ) : (
              <p className="text-mut text-sm mt-1">No hay otros coches en esta base.</p>
            )}
          </div>
        )}

        {/* Quitar asignación (solo al editar) */}
        {editMode && (
          <div className="mt-6 pt-5 border-t border-line">
            {!confirmar ? (
              <button
                onClick={() => setConfirmar(true)}
                className="tap w-full py-3 rounded-xl border border-accent/40 text-accent font-semibold"
              >
                Quitar del coche
              </button>
            ) : (
              <div>
                <p className="text-mut text-sm mb-3">Se quitará esta persona del coche. ¿Seguro?</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmar(false)} className="tap flex-1 py-3 rounded-xl bg-panel2 border border-line font-semibold">
                    No
                  </button>
                  <button onClick={quitar} disabled={guardando} className="tap flex-1 py-3 rounded-xl bg-accent text-white font-semibold disabled:opacity-50">
                    {guardando ? "Quitando…" : "Sí, quitar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
