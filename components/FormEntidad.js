"use client";
import { useState } from "react";
import {
  addBase, updateBase, deleteBase,
  addTrabajador, updateTrabajador, deleteTrabajador,
  addVehiculo, updateVehiculo, deleteVehiculo,
  addIncidencia, updateIncidencia, deleteIncidencia,
} from "../lib/data";

// Configuración de campos por tipo de entidad
const CONFIG = {
  base: {
    add: "Nueva base", edit: "Editar base",
    campos: [
      { k: "nombre", label: "Nombre", req: true },
      { k: "tipo", label: "Tipo (CS, Base, P.L.…)" },
    ],
    avisoBorrar: "Se eliminará la base y TODOS sus trabajadores, coches e incidencias.",
  },
  trab: {
    add: "Nuevo trabajador", edit: "Editar trabajador",
    campos: [
      { k: "nombre", label: "Nombre", req: true },
      { k: "titulo", label: "Título (TES, DUE…)" },
      { k: "puesto_trabajo", label: "Puesto de trabajo" },
    ],
    avisoBorrar: "Se eliminará el trabajador y sus incidencias.",
  },
  veh: {
    add: "Nuevo vehículo", edit: "Editar vehículo",
    campos: [
      { k: "matricula", label: "Matrícula", req: true, upper: true },
      { k: "id_personal", label: "ID personal", req: true },
      { k: "modelo", label: "Modelo" },
      { k: "clase", label: "Clase (SVB, SVA…)" },
    ],
    avisoBorrar: "Se eliminará el vehículo y sus incidencias.",
  },
  inc: {
    add: "Nueva incidencia", edit: "Editar incidencia",
    campos: [{ k: "descripcion", label: "Descripción", req: true }],
    avisoBorrar: "Se eliminará esta incidencia.",
  },
};

function traducirError(msg = "") {
  if (/duplicate key|unique/i.test(msg))
    return "Ya existe otro registro con ese valor único (matrícula o ID repetido).";
  return msg;
}

function Campo({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-mut text-sm">{label}</span>
      <input
        {...props}
        className="mt-1 w-full bg-panel2 border border-line rounded-xl px-3 py-3 text-ink outline-none focus:border-accent"
      />
    </label>
  );
}

/**
 * @param tipo    "base" | "trab" | "veh" | "inc"
 * @param modo    "add" | "edit"
 * @param parentId  id del padre (area_id para base; base_id para el resto). Solo en add.
 * @param registro  registro existente. Solo en edit.
 */
export default function FormEntidad({ tipo, modo, parentId, registro, onClose, onSaved }) {
  const cfg = CONFIG[tipo];
  const [v, setV] = useState(() => (modo === "edit" ? { ...registro } : {}));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [confirmar, setConfirmar] = useState(false);
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  async function guardar() {
    // Validación de obligatorios
    for (const c of cfg.campos) {
      if (c.req && !String(v[c.k] || "").trim()) {
        setError("Falta rellenar: " + c.label);
        return;
      }
    }
    // Construir datos limpios
    const payload = {};
    cfg.campos.forEach((c) => {
      let val = v[c.k];
      if (typeof val === "string") { val = val.trim(); if (c.upper) val = val.toUpperCase(); }
      payload[c.k] = val || null;
    });

    setGuardando(true); setError(null);
    let r;
    if (modo === "add") {
      if (tipo === "base") r = await addBase(parentId, payload);
      else if (tipo === "trab") r = await addTrabajador(parentId, payload);
      else if (tipo === "veh") r = await addVehiculo(parentId, payload);
      else r = await addIncidencia(parentId, payload.descripcion);
    } else {
      if (tipo === "base") r = await updateBase(registro.id, payload);
      else if (tipo === "trab") r = await updateTrabajador(registro.id, payload);
      else if (tipo === "veh") r = await updateVehiculo(registro.id, payload);
      else r = await updateIncidencia(registro.id, payload);
    }
    setGuardando(false);
    if (r?.error) { setError(traducirError(r.error.message)); return; }
    onSaved();
  }

  async function eliminar() {
    setGuardando(true); setError(null);
    let r;
    if (tipo === "base") r = await deleteBase(registro.id);
    else if (tipo === "trab") r = await deleteTrabajador(registro.id);
    else if (tipo === "veh") r = await deleteVehiculo(registro.id);
    else r = await deleteIncidencia(registro.id);
    setGuardando(false);
    if (r?.error) { setError(traducirError(r.error.message)); return; }
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
        <h2 className="title text-2xl font-bold mb-4">{cfg[modo]}</h2>

        <div className="space-y-3">
          {cfg.campos.map((c) => (
            <Campo
              key={c.k}
              label={c.req ? c.label + " *" : c.label}
              value={v[c.k] || ""}
              onChange={set(c.k)}
              autoFocus={c === cfg.campos[0]}
            />
          ))}
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

        {/* Zona de borrado, solo al editar */}
        {modo === "edit" && (
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
                <p className="text-mut text-sm mb-3">{cfg.avisoBorrar} ¿Seguro?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmar(false)}
                    className="tap flex-1 py-3 rounded-xl bg-panel2 border border-line font-semibold"
                  >
                    No
                  </button>
                  <button
                    onClick={eliminar}
                    disabled={guardando}
                    className="tap flex-1 py-3 rounded-xl bg-accent text-white font-semibold disabled:opacity-50"
                  >
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