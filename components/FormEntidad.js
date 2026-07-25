"use client";
import { useState, useEffect } from "react";
import {
  addArea, updateArea, deleteArea,
  addBase, updateBase, deleteBase,
  addTrabajador, updateTrabajador, deleteTrabajador,
  addVehiculo, updateVehiculo, deleteVehiculo,
  addIncidencia, updateIncidencia, deleteIncidencia,
  getAdjuntos, subirAdjunto, borrarAdjunto, urlAdjunto,
  getTiposIncidencia, resolverTipoIncidencia,
} from "../lib/data";

// Tipos fijos de incidencia (siempre disponibles)
const TIPOS_FIJOS = ["Seguridad", "Avería", "Personal", "Vehículo"];

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
      { k: "id_personal", label: "ID personal" },
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
    campos: [
      { k: "tipo", label: "Tipo", tipo: "tipoinc" },
      { k: "descripcion", label: "Descripción", req: true, multi: true },
      { k: "fecha", label: "Fecha del incidente", tipo: "fecha" },
    ],
    avisoBorrar: "Se eliminará esta incidencia.",
  },
};

function traducirError(msg = "") {
  if (/duplicate key|unique/i.test(msg))
    return "Ya existe otro registro con ese valor único (matrícula o ID repetido).";
  return msg;
}

// Campo de texto normal
function Campo({ label, multi, ...props }) {
  return (
    <label className="block">
      <span className="text-mut text-sm">{label}</span>
      {multi ? (
        <textarea
          {...props}
          rows={4}
          className="mt-1 w-full bg-panel2 border border-line rounded-xl px-3 py-3 text-ink outline-none focus:border-accent resize-none"
        />
      ) : (
        <input
          {...props}
          className="mt-1 w-full bg-panel2 border border-line rounded-xl px-3 py-3 text-ink outline-none focus:border-accent"
        />
      )}
    </label>
  );
}

// convierte ISO -> valor para <input type="datetime-local"> en hora local
function aInputFecha(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function CampoFecha({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-mut text-sm">{label}</span>
      <input
        type="datetime-local"
        value={aInputFecha(value)}
        onChange={(e) => onChange(e.target.value)}
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

// Tipo de incidencia: tipos fijos + personalizados + "Otro" (escribir uno nuevo)
function CampoTipoIncidencia({ label, value, onChange, tiposCustom }) {
  const conocidos = [...TIPOS_FIJOS, ...tiposCustom.filter((t) => !TIPOS_FIJOS.includes(t))];
  const [otro, setOtro] = useState(() => !!value && !conocidos.includes(value));

  return (
    <div>
      <span className="text-mut text-sm">{label}</span>
      <div className="mt-1 flex gap-2 flex-wrap">
        {conocidos.map((op) => (
          <button
            key={op}
            type="button"
            onClick={() => { setOtro(false); onChange(value === op ? "" : op); }}
            className={`tap px-4 py-3 rounded-xl border font-semibold ${
              !otro && value === op ? "bg-accent text-white border-accent" : "bg-panel2 text-mut border-line"
            }`}
          >
            {op}
          </button>
        ))}
        <button
          type="button"
          onClick={() => { setOtro(true); if (conocidos.includes(value)) onChange(""); }}
          className={`tap px-4 py-3 rounded-xl border font-semibold ${
            otro ? "bg-accent text-white border-accent" : "bg-panel2 text-mut border-line"
          }`}
        >
          Otro
        </button>
      </div>
      {otro && (
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe el tipo (ej: Robo, Vandalismo…)"
          autoFocus
          className="mt-2 w-full bg-panel2 border border-line rounded-xl px-3 py-3 text-ink outline-none focus:border-accent"
        />
      )}
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
  const [pendientes, setPendientes] = useState([]); // archivos elegidos, sin subir aún
  const [existentes, setExistentes] = useState([]); // adjuntos ya guardados (modo edit)
  const [subiendo, setSubiendo] = useState(false);
  const [tiposCustom, setTiposCustom] = useState([]);

  const esInc = tipo === "inc";

  useEffect(() => {
    if (esInc && modo === "edit" && registro?.id) {
      getAdjuntos(registro.id).then(({ data }) => setExistentes(data || []));
    }
  }, [esInc, modo, registro?.id]);

  useEffect(() => {
    if (esInc) getTiposIncidencia().then(({ data }) => setTiposCustom((data || []).map((t) => t.nombre)));
  }, [esInc]);
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
      if (c.tipo === "fecha") return; // la fecha se maneja aparte
      if (c.tipo === "bool") { payload[c.k] = !!v[c.k]; return; }
      let val = v[c.k];
      if (typeof val === "string") { val = val.trim(); if (c.upper) val = val.toUpperCase(); }
      payload[c.k] = val || null;
    });

    // Fecha del incidente (si el formulario la tiene)
    let fechaISO = null;
    const campoFecha = cfg.campos.find((c) => c.tipo === "fecha");
    if (campoFecha && v[campoFecha.k]) fechaISO = new Date(v[campoFecha.k]).toISOString();

    // Tipo de incidencia: resolver duplicados / crear si es nuevo
    if (esInc && payload.tipo) {
      setGuardando(true);
      const { nombre } = await resolverTipoIncidencia(payload.tipo, TIPOS_FIJOS);
      payload.tipo = nombre;
    }

    setGuardando(true); setError(null);
    let r;
    if (modo === "add") {
      if (tipo === "area") r = await addArea(payload);
      else if (tipo === "base") r = await addBase(parentId, payload);
      else if (tipo === "trab") r = await addTrabajador(parentId, payload);
      else if (tipo === "veh") r = await addVehiculo(parentId, payload);
      else {
        const incPayload = { [incField]: parentId, descripcion: payload.descripcion, tipo: payload.tipo };
        if (fechaISO) incPayload.fecha = fechaISO;
        r = await addIncidencia(incPayload);
      }
    } else {
      if (tipo === "area") r = await updateArea(registro.id, payload);
      else if (tipo === "base") r = await updateBase(registro.id, payload);
      else if (tipo === "trab") r = await updateTrabajador(registro.id, payload);
      else if (tipo === "veh") r = await updateVehiculo(registro.id, payload);
      else {
        const upd = { ...payload };
        if (fechaISO) upd.fecha = fechaISO;
        r = await updateIncidencia(registro.id, upd);
      }
    }
    setGuardando(false);
    if (r?.error) { setError(traducirError(r.error.message)); return; }

    // Subir archivos adjuntos (solo incidencias)
    if (esInc && pendientes.length) {
      const incId = modo === "add" ? r?.data?.id : registro.id;
      if (incId) {
        setSubiendo(true);
        for (const f of pendientes) {
          const up = await subirAdjunto(incId, f);
          if (up?.error) { setSubiendo(false); setError("Archivo no subido: " + (up.error.message || up.error.error || "error desconocido")); return; }
        }
        setSubiendo(false);
      }
    }

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
            if (c.tipo === "tipoinc")
              return (
                <CampoTipoIncidencia
                  key={c.k}
                  label={c.label}
                  value={v[c.k] || ""}
                  onChange={(nv) => setVal(c.k, nv)}
                  tiposCustom={tiposCustom}
                />
              );
            if (c.tipo === "fecha")
              return (
                <CampoFecha key={c.k} label={c.label} value={v[c.k]} onChange={(nv) => setVal(c.k, nv)} />
              );
            return (
              <Campo
                key={c.k}
                label={c.req ? c.label + " *" : c.label}
                multi={c.multi}
                value={v[c.k] || ""}
                onChange={set(c.k)}
                autoFocus={c === cfg.campos[0]}
              />
            );
          })}
        </div>

        {error && <p className="text-accent text-sm mt-3">{error}</p>}

        {/* Adjuntos: imágenes y PDF (solo incidencias) */}
        {esInc && (
          <AdjuntosBloque
            existentes={existentes}
            setExistentes={setExistentes}
            pendientes={pendientes}
            setPendientes={setPendientes}
          />
        )}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="tap flex-1 py-3 rounded-xl bg-panel2 border border-line font-semibold">
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando || subiendo}
            className="tap flex-1 py-3 rounded-xl bg-accent text-white font-semibold disabled:opacity-50"
          >
            {subiendo ? "Subiendo…" : guardando ? "Guardando…" : "Guardar"}
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

/* ---------- Bloque de adjuntos (imágenes y PDF) ---------- */
function esImagen(tipo, nombre = "") {
  return (tipo || "").startsWith("image/") || /\.(png|jpe?g|gif|webp|heic)$/i.test(nombre);
}

function AdjuntosBloque({ existentes, setExistentes, pendientes, setPendientes }) {
  const [borrando, setBorrando] = useState(null);

  function elegir(e) {
    const files = Array.from(e.target.files || []);
    setPendientes((p) => [...p, ...files]);
    e.target.value = ""; // permite volver a elegir el mismo archivo
  }

  function quitarPendiente(idx) {
    setPendientes((p) => p.filter((_, i) => i !== idx));
  }

  async function borrarExistente(a) {
    setBorrando(a.id);
    await borrarAdjunto(a.id, a.ruta);
    setExistentes((list) => list.filter((x) => x.id !== a.id));
    setBorrando(null);
  }

  return (
    <div className="mt-5">
      <span className="text-mut text-sm">Adjuntos (fotos o PDF)</span>

      {/* Ya guardados */}
      {existentes.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {existentes.map((a) => (
            <div key={a.id} className="relative">
              <a href={urlAdjunto(a.ruta)} target="_blank" rel="noreferrer" className="block">
                {esImagen(a.tipo, a.nombre) ? (
                  <img src={urlAdjunto(a.ruta)} alt="" className="w-full h-20 object-cover rounded-lg border border-line" />
                ) : (
                  <div className="w-full h-20 rounded-lg border border-line bg-panel2 grid place-items-center text-mut text-xs">
                    <div className="text-center px-1">
                      <div className="text-xl">📄</div>PDF
                    </div>
                  </div>
                )}
              </a>
              <button
                onClick={() => borrarExistente(a)}
                disabled={borrando === a.id}
                aria-label="Borrar adjunto"
                className="tap absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent text-white text-xs grid place-items-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pendientes de subir */}
      {pendientes.length > 0 && (
        <div className="mt-2 space-y-1">
          {pendientes.map((f, i) => (
            <div key={i} className="flex items-center justify-between bg-panel2 border border-line rounded-lg px-3 py-2">
              <span className="text-sm truncate">{esImagen(f.type, f.name) ? "🖼️" : "📄"} {f.name}</span>
              <button onClick={() => quitarPendiente(i)} className="tap text-mut text-lg" aria-label="Quitar">×</button>
            </div>
          ))}
          <p className="text-mut text-xs">Se subirán al guardar.</p>
        </div>
      )}

      {/* Botón elegir */}
      <label className="tap mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-panel2 border border-line text-sm font-semibold cursor-pointer">
        + Añadir archivo
        <input type="file" accept="image/*,application/pdf" multiple onChange={elegir} className="hidden" />
      </label>
    </div>
  );
}
