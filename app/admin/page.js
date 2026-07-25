"use client";
import { useState, useEffect } from "react";
import {
  getDispositivos,
  addDispositivo,
  updateDispositivo,
  deleteDispositivo,
  getRoles,
  crearRol,
  actualizarRol,
  borrarRol,
} from "../../lib/data";
import { useRealtime } from "../../lib/useRealtime";
import { esDispositivoAdmin } from "../../lib/acceso";
import { Header, Badge, Spinner } from "../../components/ui";

const PERMISOS_DISPONIBLES = [
  { id: "buscador", nombre: "Buscador global" },
  { id: "areas", nombre: "Áreas" },
  { id: "comite_seguridad", nombre: "Comité de Seguridad" },
  { id: "comite_empresa", nombre: "Comité de Empresa" },
  { id: "sugerencias", nombre: "Sugerencias" },
  { id: "admin", nombre: "Gestión de roles y códigos" },
];

export default function AdminPage() {
  const [admin, setAdmin] = useState(null);
  const [roles, setRoles] = useState([]);
  const [vista, setVista] = useState("dispositivos");
  const [form, setForm] = useState(false);
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    setAdmin(esDispositivoAdmin());
    cargarRoles();
  }, []);

  const { data, loading, reload } = useRealtime(
    () => getDispositivos(),
    ["dispositivos"],
    []
  );

  if (admin === null) {
    return (
      <main>
        <Header titulo="Admin" back />
        <Spinner />
      </main>
    );
  }

  if (!admin) {
    return (
      <main>
        <Header titulo="Admin" back />
        <p className="px-4 mt-6 text-mut">Esta sección es solo para administradores.</p>
      </main>
    );
  }

  async function cargarRoles() {
    try {
      const r = await getRoles();
      setRoles(r || []);
    } catch (e) {
      console.error("Error cargando roles:", e);
    }
  }

  async function toggleActivo(d) {
    await updateDispositivo(d.id, { activo: !d.activo });
    reload();
  }

  function abrirNuevoDispositivo() {
    setEditando(null);
    setForm("dispositivo");
  }

  function abrirEditarDispositivo(d) {
    setEditando(d);
    setForm("dispositivo");
  }

  function abrirNuevoRol() {
    setEditando(null);
    setForm("rol");
  }

  function abrirEditarRol(rol) {
    setEditando(rol);
    setForm("rol");
  }

  function rolNombre(rolId) {
    return roles.find((r) => r.id === rolId)?.nombre || null;
  }

  return (
    <main className="pb-24">
      <Header titulo="Admin" back />

      <div className="px-4 mt-4 flex gap-2">
        <button
          onClick={() => setVista("dispositivos")}
          className={`flex-1 py-2 rounded-xl font-bold text-sm transition-colors ${
            vista === "dispositivos"
              ? "bg-accent text-white"
              : "bg-panel2 border border-line text-mut"
          }`}
        >
          Códigos
        </button>
        <button
          onClick={() => setVista("roles")}
          className={`flex-1 py-2 rounded-xl font-bold text-sm transition-colors ${
            vista === "roles"
              ? "bg-accent text-white"
              : "bg-panel2 border border-line text-mut"
          }`}
        >
          Roles
        </button>
      </div>

      {vista === "dispositivos" && (
        <>
          {loading ? (
            <Spinner />
          ) : (
            <div className="px-4 mt-4 grid gap-2">
              {(data || []).map((d) => (
                <div
                  key={d.id}
                  onClick={() => abrirEditarDispositivo(d)}
                  className="bg-panel border border-line rounded-xl p-4 active:scale-[.99] transition-transform cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold title tracking-wide">{d.codigo}</h3>
                        {d.es_admin && <Badge tone="accent">Admin</Badge>}
                        {rolNombre(d.rol_id) && (
                          <Badge tone="secondary">{rolNombre(d.rol_id)}</Badge>
                        )}
                        {!d.activo && <Badge>Desactivado</Badge>}
                      </div>
                      {d.nombre && <p className="text-mut text-sm mt-0.5">{d.nombre}</p>}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleActivo(d);
                      }}
                      className={`tap shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border ${
                        d.activo
                          ? "bg-ok/15 text-ok border-ok/40"
                          : "bg-panel2 text-mut border-line"
                      }`}
                    >
                      {d.activo ? "Activo" : "Inactivo"}
                    </button>
                  </div>
                </div>
              ))}
              {!(data || []).length && (
                <p className="text-mut text-center py-10">No hay códigos todavía.</p>
              )}
            </div>
          )}

          {!loading && (
            <button
              onClick={abrirNuevoDispositivo}
              className="tap fixed bottom-[calc(env(safe-area-inset-bottom)+18px)] right-5 w-14 h-14 rounded-full bg-accent text-white text-3xl grid place-items-center shadow-lg shadow-accent/30 active:scale-95"
              aria-label="Añadir código"
            >
              +
            </button>
          )}
        </>
      )}

      {vista === "roles" && (
        <div className="px-4 mt-4 grid gap-2">
          {roles.map((rol) => (
            <div key={rol.id} className="bg-panel border border-line rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold title tracking-wide">{rol.nombre}</h3>
                    {rol.es_admin && <Badge tone="accent">Admin</Badge>}
                  </div>
                  {rol.descripcion && (
                    <p className="text-mut text-sm mt-1">{rol.descripcion}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(rol.permisos || []).map((p) => {
                      const def = PERMISOS_DISPONIBLES.find((x) => x.id === p);
                      return (
                        <span
                          key={p}
                          className="text-xs bg-panel2 border border-line px-2 py-0.5 rounded-full"
                        >
                          {def?.nombre || p}
                        </span>
                      );
                    })}
                    {!(rol.permisos || []).length && (
                      <span className="text-xs text-mut">Sin permisos</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => abrirEditarRol(rol)}
                    className="tap text-xs font-bold px-3 py-1.5 rounded-full border border-line bg-panel2 text-mut"
                  >
                    Editar
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`¿Borrar el rol "${rol.nombre}"?`)) return;
                      try {
                        await borrarRol(rol.id);
                        cargarRoles();
                      } catch (e) {
                        alert("Error al borrar: " + e.message);
                      }
                    }}
                    className="tap text-xs font-bold px-3 py-1.5 rounded-full border border-accent/40 text-accent"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!roles.length && (
            <p className="text-mut text-center py-10">No hay roles todavía.</p>
          )}

          <button
            onClick={abrirNuevoRol}
            className="tap fixed bottom-[calc(env(safe-area-inset-bottom)+18px)] right-5 w-14 h-14 rounded-full bg-accent text-white text-3xl grid place-items-center shadow-lg shadow-accent/30 active:scale-95"
            aria-label="Añadir rol"
          >
            +
          </button>
        </div>
      )}

      {form === "dispositivo" && (
        <FormDispositivo
          registro={editando}
          roles={roles}
          onClose={() => {
            setForm(false);
            setEditando(null);
          }}
          onSaved={() => {
            setForm(false);
            setEditando(null);
            reload();
          }}
        />
      )}

      {form === "rol" && (
        <FormRol
          rolEditar={editando}
          onClose={() => {
            setForm(false);
            setEditando(null);
          }}
          onSaved={() => {
            setForm(false);
            setEditando(null);
            cargarRoles();
          }}
        />
      )}
    </main>
  );
}

function FormDispositivo({ registro, roles, onClose, onSaved }) {
  const editMode = !!registro;
  const [codigo, setCodigo] = useState(registro?.codigo || "");
  const [nombre, setNombre] = useState(registro?.nombre || "");
  const [esAdmin, setEsAdmin] = useState(registro?.es_admin || false);
  const [rolId, setRolId] = useState(registro?.rol_id || "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [confirmar, setConfirmar] = useState(false);

  useEffect(() => {
    if (!rolId) return;
    const rol = roles.find((r) => r.id === rolId);
    if (rol) setEsAdmin(!!rol.es_admin);
  }, [rolId, roles]);

  function generar() {
    const n = Math.floor(1000 + Math.random() * 9000);
    const base =
      (nombre || "COD").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "COD";
    setCodigo(`${base}-${n}`);
  }

  async function guardar() {
    const cod = codigo.trim().toUpperCase();
    if (!cod) {
      setError("Escribe o genera un código.");
      return;
    }

    setGuardando(true);
    setError(null);
    let r;
    try {
      if (editMode) {
        r = await updateDispositivo(registro.id, {
          codigo: cod,
          nombre: nombre || null,
          es_admin: esAdmin,
          rol_id: rolId || null,
        });
      } else {
        r = await addDispositivo(cod, nombre || null, esAdmin, rolId || null);
      }
      setGuardando(false);
      if (r?.error) {
        setError(
          /duplicate|unique/i.test(r.error.message)
            ? "Ese código ya existe."
            : r.error.message
        );
        return;
      }
      onSaved();
    } catch (e) {
      setGuardando(false);
      setError(e.message || "Error desconocido");
    }
  }

  async function eliminar() {
    setGuardando(true);
    setError(null);
    try {
      const r = await deleteDispositivo(registro.id);
      setGuardando(false);
      if (r?.error) {
        setError(r.error.message);
        return;
      }
      onSaved();
    } catch (e) {
      setGuardando(false);
      setError(e.message || "Error al eliminar");
    }
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
          {editMode ? "Editar código" : "Nuevo código"}
        </h2>

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
              <button
                onClick={generar}
                className="tap px-4 rounded-xl bg-panel2 border border-line text-sm font-semibold"
              >
                Generar
              </button>
            </div>
          </label>

          <label className="block">
            <span className="text-mut text-sm">Rol</span>
            <select
              value={rolId}
              onChange={(e) => setRolId(e.target.value)}
              className="mt-1 w-full bg-panel2 border border-line rounded-xl px-3 py-3 text-ink outline-none focus:border-accent"
            >
              <option value="">— Sin rol —</option>
              {roles.map((rol) => (
                <option key={rol.id} value={rol.id}>
                  {rol.nombre} {rol.es_admin ? "(Admin)" : ""}
                </option>
              ))}
            </select>
            {rolId && (
              <p className="text-mut text-xs mt-1">
                Al cambiar el rol, "¿Es administrador?" se ajusta automáticamente.
              </p>
            )}
          </label>

          <div>
            <span className="text-mut text-sm">¿Es administrador?</span>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setEsAdmin(false)}
                className={`tap flex-1 py-3 rounded-xl border font-semibold ${
                  !esAdmin
                    ? "bg-accent text-white border-accent"
                    : "bg-panel2 text-mut border-line"
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => setEsAdmin(true)}
                className={`tap flex-1 py-3 rounded-xl border font-semibold ${
                  esAdmin
                    ? "bg-accent text-white border-accent"
                    : "bg-panel2 text-mut border-line"
                }`}
              >
                Sí
              </button>
            </div>
          </div>
        </div>

        {error && <p className="text-accent text-sm mt-3">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="tap flex-1 py-3 rounded-xl bg-panel2 border border-line font-semibold"
          >
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

function FormRol({ rolEditar, onClose, onSaved }) {
  const editMode = !!rolEditar;
  const [nombre, setNombre] = useState(rolEditar?.nombre || "");
  const [descripcion, setDescripcion] = useState(rolEditar?.descripcion || "");
  const [esAdmin, setEsAdmin] = useState(rolEditar?.es_admin || false);
  const [permisos, setPermisos] = useState(rolEditar?.permisos || []);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  function togglePermiso(id) {
    setPermisos((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function guardar() {
    if (!nombre.trim()) {
      setError("El nombre del rol es obligatorio.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      if (editMode) {
        await actualizarRol(rolEditar.id, {
          nombre: nombre.trim(),
          descripcion,
          es_admin: esAdmin,
          permisos,
        });
      } else {
        await crearRol({
          nombre: nombre.trim(),
          descripcion,
          es_admin: esAdmin,
          permisos,
        });
      }
      onSaved();
    } catch (e) {
      setGuardando(false);
      setError(
        /duplicate|unique/i.test(e.message)
          ? "Ya existe un rol con ese nombre."
          : e.message || "Error al guardar el rol"
      );
    }
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
          {editMode ? "Editar rol" : "Nuevo rol"}
        </h2>

        <div className="space-y-3">
          <label className="block">
            <span className="text-mut text-sm">Nombre del rol *</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Delegado de Seguridad"
              className="mt-1 w-full bg-panel2 border border-line rounded-xl px-3 py-3 text-ink outline-none focus:border-accent"
            />
          </label>

          <label className="block">
            <span className="text-mut text-sm">Descripción</span>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Personal que gestiona el comité de seguridad"
              className="mt-1 w-full bg-panel2 border border-line rounded-xl px-3 py-3 text-ink outline-none focus:border-accent h-20 resize-none"
            />
          </label>

          <div className="border border-line rounded-xl p-4">
            <span className="text-mut text-sm block mb-2">Permisos</span>
            <div className="grid grid-cols-2 gap-2">
              {PERMISOS_DISPONIBLES.map((p) => {
                const activo = permisos.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => togglePermiso(p.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      activo
                        ? "bg-accent/20 border-accent"
                        : "bg-panel2 border-line hover:bg-panel2/80"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border ${
                          activo ? "bg-accent border-accent" : "border-line"
                        }`}
                      />
                      <span className="text-sm">{p.nombre}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <span className="text-mut text-sm">
              ¿Es administrador? (puede gestionar roles y códigos)
            </span>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setEsAdmin(false)}
                className={`tap flex-1 py-3 rounded-xl border font-semibold ${
                  !esAdmin
                    ? "bg-accent text-white border-accent"
                    : "bg-panel2 text-mut border-line"
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => setEsAdmin(true)}
                className={`tap flex-1 py-3 rounded-xl border font-semibold ${
                  esAdmin
                    ? "bg-accent text-white border-accent"
                    : "bg-panel2 text-mut border-line"
                }`}
              >
                Sí
              </button>
            </div>
          </div>
        </div>

        {error && <p className="text-accent text-sm mt-3">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="tap flex-1 py-3 rounded-xl bg-panel2 border border-line font-semibold"
          >
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
      </div>
    </div>
  );
}