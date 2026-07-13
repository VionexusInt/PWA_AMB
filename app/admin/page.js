"use client";
import { useState, useEffect } from "react";
import {
  getDispositivos, addDispositivo, updateDispositivo, deleteDispositivo,
} from "../../lib/data";
import { useRealtime } from "../../lib/useRealtime";
import { esDispositivoAdmin } from "../../lib/acceso";
import { Header, Badge, Spinner } from "../../components/ui";

export default function AdminPage() {
  const [admin, setAdmin] = useState(null); // null = comprobando
  useEffect(() => setAdmin(esDispositivoAdmin()), []);

  const { data, loading, reload } = useRealtime(() => getDispositivos(), ["dispositivos"], []);
  const [form, setForm] = useState(false);

  if (admin === null) {
    return (
      <main>
        <Header titulo="Dispositivos" back />
        <Spinner />
      </main>
    );
  }

  if (!admin) {
    return (
      <main>
        <Header titulo="Dispositivos" back />
        <p className="px-4 mt-6 text-mut">Esta sección es solo para administradores.</p>
      </main>
    );
  }

  async function toggleActivo(d) {
    await updateDispositivo(d.id, { activo: !d.activo });
    reload();
  }

  return (
    <main className="pb-24">
      <Header titulo="Dispositivos" subtitulo={data ? `${data.length} códigos` : ""} back />

      {loading ? (
        <Spinner />
      ) : (
        <div className="px-4 mt-4 grid gap-2">
          {(data || []).map((d) => (
            <div key={d.id} className="bg-panel border border-line rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold title tracking-wide">{d.codigo}</h3>
                    {d.es_admin && <Badge tone="accent">Admin</Badge>}
                    {!d.activo && <Badge>Desactivado</Badge>}
                  </div>
                  {d.nombre && <p className="text-mut text-sm mt-0.5">{d.nombre}</p>}
                </div>
                <button
                  onClick={() => toggleActivo(d)}
                  className={`tap shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border ${
                    d.activo ? "bg-ok/15 text-ok border-ok/40" : "bg-panel2 text-mut border-line"
                  }`}
                >
                  {d.activo ? "Activo" : "Inactivo"}
                </button>
              </div>
            </div>
          ))}
          {!(data || []).length && <p className="text-mut text-center py-10">No hay códigos todavía.</p>}
        </div>
      )}

      {!loading && (
        <button
          onClick={() => setForm(true)}
          className="tap fixed bottom-[calc(env(safe-area-inset-bottom)+18px)] right-5 w-14 h-14 rounded-full bg-accent text-white text-3xl grid place-items-center shadow-lg shadow-accent/30 active:scale-95"
          aria-label="Añadir código"
        >
          +
        </button>
      )}

      {form && <FormDispositivo onClose={() => setForm(false)} onSaved={() => { setForm(false); reload(); }} />}
    </main>
  );
}

/* ---------- Alta / edición de un código ---------- */
function FormDispositivo({ registro, onClose, onSaved }) {
  const editMode = !!registro;
  const [codigo, setCodigo] = useState(registro?.codigo || "");
  const [nombre, setNombre] = useState(registro?.nombre || "");
  const [esAdmin, setEsAdmin] = useState(registro?.es_admin || false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [confirmar, setConfirmar] = useState(false);

  function generar() {
    const n = Math.floor(1000 + Math.random() * 9000);
    const base = (nombre || "COD").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "COD";
    setCodigo(`${base}-${n}`);
  }

  async function guardar() {
    const cod = codigo.trim().toUpperCase();
    if (!cod) { setError("Escribe o genera un código."); return; }
    setGuardando(true); setError(null);
    let r;
    if (editMode) r = await updateDispositivo(registro.id, { codigo: cod, nombre: nombre || null, es_admin: esAdmin });
    else r = await addDispositivo(cod, nombre || null, esAdmin);
    setGuardando(false);
    if (r?.error) {
      setError(/duplicate|unique/i.test(r.error.message) ? "Ese código ya existe." : r.error.message);
      return;
    }
    onSaved();
  }

  async function eliminar() {
    setGuardando(true); setError(null);
    const r = await deleteDispositivo(registro.id);
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
        <h2 className="title text-2xl font-bold mb-4">{editMode ? "Editar código" : "Nuevo código"}</h2>

        <div className="space-y-3">
          <label className="block">
            <span className="text-mut text-sm">Nombre (para ti, ej: Móvil de papá)</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 w-full bg-panel2 border border-line rounded-xl px-3 py-3 text-ink outline-none focus:border-accent"
            />
          </label>

          <label className="block">
            <span className="text-mut text-sm">Código *</span>
            <div className="mt-1 flex gap-2">
              <input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej: PAPA-4823"
                className="flex-1 bg-panel2 border border-line rounded-xl px-3 py-3 text-ink outline-none focus:border-accent"
              />
              <button onClick={generar} className="tap px-4 rounded-xl bg-panel2 border border-line text-sm font-semibold">
                Generar
              </button>
            </div>
          </label>

          <div>
            <span className="text-mut text-sm">¿Es administrador?</span>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setEsAdmin(false)}
                className={`tap flex-1 py-3 rounded-xl border font-semibold ${
                  !esAdmin ? "bg-accent text-white border-accent" : "bg-panel2 text-mut border-line"
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => setEsAdmin(true)}
                className={`tap flex-1 py-3 rounded-xl border font-semibold ${
                  esAdmin ? "bg-accent text-white border-accent" : "bg-panel2 text-mut border-line"
                }`}
              >
                Sí
              </button>
            </div>
          </div>
        </div>

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
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>

        {editMode && (
          <div className="mt-6 pt-5 border-t border-line">
            {!confirmar ? (
              <button
                onClick={() => setConfirmar(true)}
                className="tap w-full py-3 rounded-xl border border-accent/40 text-accent font-semibold"
              >
                Eliminar
              </button>
            ) : (
              <div>
                <p className="text-mut text-sm mb-3">Se eliminará este código. ¿Seguro?</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmar(false)} className="tap flex-1 py-3 rounded-xl bg-panel2 border border-line font-semibold">
                    No
                  </button>
                  <button onClick={eliminar} disabled={guardando} className="tap flex-1 py-3 rounded-xl bg-accent text-white font-semibold disabled:opacity-50">
                    {guardando ? "Eliminando…" : "Sí, eliminar"}
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
