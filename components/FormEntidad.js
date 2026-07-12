"use client";
import { useState } from "react";
import {
  addArea, updateArea, deleteArea,
  addBase, updateBase, deleteBase,
  addTrabajador, updateTrabajador, deleteTrabajador,
  addVehiculo, updateVehiculo, deleteVehiculo,
  addIncidencia, updateIncidencia, deleteIncidencia,
} from "../lib/data";

// Configuración de campos por tipo de entidad
const CONFIG = {
  area: {
    add: "Nueva área", edit: "Editar área",
    campos: [{ k: "nombre", label: "Nombre", req: true }],
    avisoBorrar: "Se eliminará el área y TODAS sus bases (con trabajadores, coches e incidencias).",
  },
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
      { k: "tipo_contrato", label: "Contrato", tipo: "opciones", opciones: ["Fijo", "Eventual"] },
      { k: "de_baja", label: "¿Está de baja?", tipo: "bool" },
    ],
    avisoBorrar: "Se eliminará el trabajador y sus incidencias.",
  },
  veh: {
    add: "Nuevo vehículo", edit: "Editar vehículo",
    campos: [
      { k: "matricula", label: "Matrícula", upper: true },
      { k: "id_personal", label: "ID personal" },
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

// Campo de texto normal
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

// Campo Sí / No (para la baja)
function CampoBool({ label, value, onChange }) {
  return (
    <div>
      <span className="text-mut text-sm">{label}</span>
      <div className="mt-1 flex gap-2">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`tap flex-1 py-3 rounded-xl border font-semibold ${
            !value ? "bg-accent text-white border-accent" : "bg-panel2 text-mut border-line"
          }`}
        >
          No
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`tap flex-1 py-3 rounded-xl border font-semibold ${
            value ? "bg-accent text-white border-accent" : "bg-panel2 text-mut border-line"
          }`}
        >
          Sí
        </button>
      </div>
    </div>
  );
}

// Campo de opciones (para el contrato). Volver a tocar la opción la deselecciona.
function CampoOpciones({ label, opciones, value, onChange }) {
  return (
    <div>
      <span className="text-mut text-sm">{label}</span>
      <div className="mt-1 flex gap-2 flex-wrap">
        {opciones.map((op) => (
          <button
            key={op}
            type="button"
            onClick={() => onChange(value === op ? "" : op)}
            className={`tap px-4 py-3 rounded-xl border font-semibold ${
              value === op ? "bg-accent text-white border-accent" : "bg-panel2 text-mut border-line"
            }`}
          >
            {op}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * @param tipo    "base" | "trab" | "veh" | "inc"
 * @param modo    "add" | "edit"
 * @param parentId  id del padre (area_id para base; base_id para el resto). Solo en add.
 * @param registro  registro existente. Solo en edit.
 */
export default function FormEntidad({ tipo, modo, parentId, registro, onClose, onSaved, incField = "base_id" }) {
  const cfg = CONFIG[tipo];
  const [v, setV] = useState(() => (modo === "edit" ? { ...registro } : {}));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [confirmar, setConfirmar] = useState(false);
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));
  const setVal = (k, nv) => setV((s) => ({ ...s, [k]: nv }));

  async function guardar() {
    for (const c of cfg.campos) {
      if (c.req && !String(v[c.k] || "").trim()) {
        setError("Falta rellenar: " + c.label);
        return;
      }
    }
    const payload = {};
    cfg.campos.forEach((c) => {
      if (c.tipo === "bool") { payload[c.k] = !!v[c.k]; return; }
      let val = v[c.k];
      if (typeof val === "string") { val = val.trim(); if (c.upper) val = val.toUpperCase(); }
      payload[c.k] = val || null;
    });

    setGuardando(true); setError(null);
    let r;
    if (modo === "add") {
      if (tipo === "area") r = await addArea(payload);
      else if (tipo === "base") r = await addBase(parentId, payload);
      else if (tipo === "trab") r = await addTrabajador(parentId, payload);
      else if (tipo === "veh") r = await addVehiculo(parentId, payload);
      else r = await addIncidencia({ [incField]: parentId, descripcion: payload.descripcion });
    } else {
      if (tipo === "area") r = await updateArea(registro.id, payload);
      else if (tipo === "base") r = await updateBase(registro.id, payload);
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
    if (tipo === "area") r = await deleteArea(registro.id);
    else if (tipo === "base") r = await deleteBase(registro.id);
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
          {cfg.campos.map((c) => {
            if (c.tipo === "bool")
              return (
                <CampoBool key={c.k} label={c.label} value={!!v[c.k]} onChange={(nv) => setVal(c.k, nv)} />
              );
            if (c.tipo === "opciones")
              return (
                <CampoOpciones
                  key={c.k}
                  label={c.label}
                  opciones={c.opciones}
                  value={v[c.k] || ""}
                  onChange={(nv) => setVal(c.k, nv)}
                />
              );
            return (
              <Campo
                key={c.k}
                label={c.req ? c.label + " *" : c.label}
                value={v[c.k] || ""}
                onChange={set(c.k)}
                autoFocus={c === cfg.campos[0]}
              />
            );
          })}
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