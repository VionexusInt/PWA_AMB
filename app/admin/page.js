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
  borrarRol
} from "../../lib/data";
import { useRealtime } from "../../lib/useRealtime";
import { esDispositivoAdmin } from "../../lib/acceso";
import { Header, Badge, Spinner } from "../../components/ui";

export default function AdminPage() {
  const [admin, setAdmin] = useState(null);
  const [roles, setRoles] = useState([]);
  const [cargandoRoles, setCargandoRoles] = useState(true);
  
  useEffect(() => {
    setAdmin(esDispositivoAdmin());
    cargarRoles();
  }, []);

  const { data, loading, reload } = useRealtime(() => getDispositivos(), ["dispositivos"], []);

  const [form, setForm] = useState(false);
  const [formTipo, setFormTipo] = useState("dispositivo"); // 'dispositivo' o 'rol'

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
      const rolesData = await getRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error("Error cargando roles:", error);
    } finally {
      setCargandoRoles(false);
    }
  }

  async function toggleActivo(d) {
    await updateDispositivo(d.id, { activo: !d.activo });
    reload();
  }

  return (
    <main className="pb-24">
      <Header titulo="Admin" subtitulo={data ? `${data.length} códigos` : ""} back />
      
      {/* Botones de navegación */}
      <div className="px-4 mt-4 flex gap-2">
        <button
          onClick={() => {
            setFormTipo("dispositivo");
            setForm(true);
          }}
          className="flex-1 py-3 bg-accent text-white rounded-xl font-bold active:scale-[.98]"
        >
          + Nuevo Código
        </button>
        <button
          onClick={() => {
            setFormTipo("rol");
            setForm(true);
          }}
          className="flex-1 py-3 bg-panel2 border border-line rounded-xl font-bold active:scale-[.98]"
        >
          Gestionar Roles
        </button>
      </div>

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
                    {d.rol_id && roles.find(r => r.id === d.rol_id)?.nombre && (
                      <Badge tone="secondary">{roles.find(r => r.id === d.rol_id)?.nombre}</Badge>
                    )}
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

      {/* Botón de añadir código (nuevo) */}
      {!loading && (
        <button
          onClick={() => {
            setFormTipo("dispositivo");
            setForm(true);
          }}
          className="tap fixed bottom-[calc(env(safe-area-inset-bottom)+18px)] right-5 w-14 h-14 rounded-full bg-accent text-white text-3xl grid place-items-center shadow-lg shadow-accent/30 active:scale-95"
          aria-label="Añadir código"
        >
          +
        </button>
      )}

      {form && (
        <FormAdmin 
          tipo={formTipo}
          onClose={() => setForm(false)} 
          onSaved={() => { 
            setForm(false); 
            if (formTipo === 'dispositivo') reload();
            else cargarRoles();
          }} 
          roles={roles}
        />
      )}
    </main>
  );
}

/* ---------- Formulario de ADMIN (códigos + roles) ---------- */
function FormAdmin({ tipo, onClose, onSaved, roles }) {
  if (tipo === "dispositivo") {
    return <FormDispositivo onClose={onClose} onSaved={onSaved} roles={roles} />;
  }
  return <FormRol onClose={onClose} onSaved={onSaved} roles={roles} />;
}

/* ---------- Formulario de DISPOSITIVO (código) ---------- */
function FormDispositivo({ onClose, onSaved, roles }) {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [esAdmin, setEsAdmin] = useState(false);
  const [rolId, setRolId] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [confirmar, setConfirmar] = useState(false);

  useEffect(() => {
    // Sincronizar esAdmin con el rol seleccionado
    const rol = roles.find(r => r.id === rolId);
    setEsAdmin(rol?.es_admin || false);
  }, [rolId, roles]);

  function generar() {
    const n = Math.floor(1000 + Math.random() * 9000);
    const base = (nombre || "COD").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "COD";
    setCodigo(`${base}-${n}`);
  }

  async function guardar() {
    const cod = codigo.trim().toUpperCase();
    if (!cod) { setError("Escribe o genera un código."); return; }
    
    setGuardando(true); 
    setError(null);
    
    try {
      await addDispositivo(cod, nombre || null, esAdmin, rolId);
      onSaved();
    } catch (error) {
      setError(/duplicate|unique/i.test(error.message) ? "Ese código ya existe." : error.message);
    } finally {
      setGuardando(false);
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
        <h2 className="title text-2xl font-bold mb-4">Nuevo código</h2>
        
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
          
          <label className="block">
            <span className="text-mut text-sm">Rol *</span>
            <select
              value={rolId}
              onChange={(e) => setRolId(e.target.value)}
              className="mt-1 w-full bg-panel2 border border-line rounded-xl px-3 py-3 text-ink outline-none focus:border-accent"
            >
              <option value="">Seleccionar rol</option>
              {roles.map(rol => (
                <option key={rol.id} value={rol.id}>
                  {rol.nombre} {rol.es_admin && "(Admin)"}
                </option>
              ))}
            </select>
          </label>
          
          <div>
            <span className="text-mut text-sm">¿Es administrador? (sincronizado con el rol)</span>
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
      </div>
    </div>
  );
}

/* ---------- Formulario de ROL ---------- */
function FormRol({ onClose, onSaved, roles }) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [esAdmin, setEsAdmin] = useState(false);
  const [permisos, setPermisos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [confirmar, setConfirmar] = useState(false);

  const permisosDisponibles = [
    { id: "areas", nombre: "Áreas" },
    { id: "comite_seguridad", nombre: "Comité de Seguridad" },
    { id: "comite_empresa", nombre: "Comité de Empresa" },
    { id: "sugerencias", nombre: "Sugerencias" },
    { id: "admin", nombre: "Gestión de roles y códigos" }
  ];

  function togglePermiso(permisoId) {
    setPermisos(prev => 
      prev.includes(permisoId) 
        ? prev.filter(p => p !== permisoId) 
        : [...prev, permisoId]
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
      await crearRol({
        nombre: nombre.trim(),
        descripcion,
        es_admin: esAdmin,
        permisos
      });
      onSaved();
    } catch (error) {
      setError(error.message);
    } finally {
      setGuardando(false);
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
        <h2 className="title text-2xl font-bold mb-4">Nuevo rol</h2>
        
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
              {permisosDisponibles.map(permiso => (
                <div 
                  key={permiso.id}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    permisos.includes(permiso.id)
                      ? "bg-accent/20 border border-accent"
                      : "bg-panel2 border border-line hover:bg-panel2/80"
                  }`}
                  onClick={() => togglePermiso(permiso.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border ${
                      permisos.includes(permiso.id) ? "bg-accent border-accent" : "border-line"
                    }`} />
                    <span>{permiso.nombre}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <span className="text-mut text-sm">¿Es administrador? (puede gestionar roles y códigos)</span>
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
      </div>
    </div>
  );
}