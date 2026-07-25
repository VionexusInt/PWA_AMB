"use client";

import { useState, useEffect } from "react";
import { Header } from "../../../components/ui";
import {
  getDocumentosCSS,
  crearDocumentoCSS,
  actualizarDocumentoCSS,
  borrarDocumentoCSS,
  getRevaloracionRiesgos,
  crearRevaloracionRiesgo,
  getIncidencias,
} from "../../../lib/data";
import { supabase } from "../../../lib/supabase";

export default function ComiteSeguridadTipoPage({ params }) {
  const tipo = params.tipo;
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [editandoId, setEditandoId] = useState(null);

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    fecha: new Date().toISOString().split("T")[0],
    delegado_nombre: "",
    juzgado: "",
    numero_sentencia: "",
    area_id: "",
    base_id: "",
    tipo_incidencia: "",
  });
  const [archivo, setArchivo] = useState(null);
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    cargarDatos();
    if (tipo === "revaloracion-riesgos") {
      cargarAreasYBases();
    }
  }, [tipo, filtroTipo]);

  async function cargarDatos() {
    setCargando(true);
    try {
      let data = [];
      if (tipo === "revaloracion-riesgos") {
        data = await getRevaloracionRiesgos();
      } else if (tipo === "incidencias") {
        if (filtroTipo === "todos") {
          const [seguridadData, cssData] = await Promise.all([
            getIncidencias("Seguridad"),
            getIncidencias("C.S.S."),
          ]);
          data = [...(seguridadData || []), ...(cssData || [])];
          data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        } else {
          const incidencias = await getIncidencias(filtroTipo);
          data = incidencias || [];
        }
      } else {
        data = await getDocumentosCSS(tipo.replace("-", "_"));
      }
      setDatos(data);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setCargando(false);
    }
  }

  async function cargarAreasYBases() {
    const { data: areasData } = await supabase
      .from("areas")
      .select("id, nombre")
      .order("nombre");
    setAreas(areasData || []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (tipo === "revaloracion-riesgos") {
        await crearRevaloracionRiesgo(formData, archivo);
      } else if (tipo === "incidencias") {
        const payload = {
          descripcion: formData.descripcion,
          fecha: formData.fecha,
          tipo: formData.tipo_incidencia,
          resuelta: false,
        };
        const { error } = await supabase.from("incidencias").insert([payload]);
        if (error) throw error;
      } else {
        const tabla = tipo.replace("-", "_");
        if (editandoId) {
          await actualizarDocumentoCSS(tabla, editandoId, formData, archivo);
        } else {
          await crearDocumentoCSS(tabla, formData, archivo);
        }
      }
      setMostrarFormulario(false);
      setEditandoId(null);
      setFormData({
        titulo: "",
        descripcion: "",
        fecha: new Date().toISOString().split("T")[0],
        delegado_nombre: "",
        juzgado: "",
        numero_sentencia: "",
        area_id: "",
        base_id: "",
        tipo_incidencia: "",
      });
      setArchivo(null);
      cargarDatos();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un error al guardar.");
    }
  }

  function handleEditar(item) {
    setEditandoId(item.id);
    setFormData({
      titulo: item.titulo || "",
      descripcion: item.descripcion || "",
      fecha: item.fecha ? item.fecha.split("T")[0] : new Date().toISOString().split("T")[0],
      delegado_nombre: item.delegado_nombre || "",
      juzgado: item.juzgado || "",
      numero_sentencia: item.numero_sentencia || "",
      area_id: item.area_id || "",
      base_id: item.base_id || "",
      tipo_incidencia: item.tipo || "",
    });
    setMostrarFormulario(true);
  }

  async function handleBorrar(item) {
    if (!confirm("¿Estás seguro de que quieres borrar este registro?")) return;
    try {
      if (tipo === "incidencias") {
        const { error } = await supabase.from("incidencias").delete().eq("id", item.id);
        if (error) throw error;
      } else if (tipo === "revaloracion-riesgos") {
        await borrarDocumentoCSS("revaloracion_riesgos", item.id);
      } else {
        await borrarDocumentoCSS(tipo.replace("-", "_"), item.id);
      }
      cargarDatos();
    } catch (error) {
      console.error("Error al borrar:", error);
      alert("Hubo un error al borrar.");
    }
  }

  function resetFormulario() {
    setMostrarFormulario(false);
    setEditandoId(null);
    setFormData({
      titulo: "",
      descripcion: "",
      fecha: new Date().toISOString().split("T")[0],
      delegado_nombre: "",
      juzgado: "",
      numero_sentencia: "",
      area_id: "",
      base_id: "",
      tipo_incidencia: "",
    });
    setArchivo(null);
  }

  let tituloPagina = tipo
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  if (tipo === "revaloracion-riesgos") {
    tituloPagina = "Evaluación de Riesgos";
  }

  return (
    <main className="pb-16">
      <Header titulo={tituloPagina} back />
      <div className="px-4 mt-6">
        {tipo === "incidencias" && (
          <div className="flex gap-2 mb-4">
            {["todos", "Seguridad", "C.S.S."].map((opcion) => (
              <button
                key={opcion}
                onClick={() => setFiltroTipo(opcion)}
                className={`flex-1 py-2 rounded-xl font-bold text-sm transition-colors ${
                  filtroTipo === opcion
                    ? "bg-blue-600 text-white"
                    : "bg-panel border border-line text-mut"
                }`}
              >
                {opcion === "todos" ? "Todas" : opcion}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => {
            if (mostrarFormulario) {
              resetFormulario();
            } else {
              setMostrarFormulario(true);
            }
          }}
          className="w-full mb-4 bg-blue-600 text-white py-3 rounded-xl font-bold active:scale-[.98] transition-transform"
        >
          {mostrarFormulario ? "Cancelar" : "+ Nuevo Registro"}
        </button>

        {mostrarFormulario && (
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-6 space-y-4 shadow-sm"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {editandoId ? "Editar Registro" : "Nuevo Registro"}
            </h3>

            {tipo !== "incidencias" && (
              <input
                type="text"
                placeholder="Título"
                required
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            )}

            {tipo === "incidencias" && (
              <select
                value={formData.tipo_incidencia}
                onChange={(e) => setFormData({ ...formData, tipo_incidencia: e.target.value })}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">Seleccionar Tipo de Incidencia</option>
                <option value="Seguridad">Seguridad</option>
                <option value="C.S.S.">C.S.S.</option>
              </select>
            )}

            <textarea
              placeholder="Descripción"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows="3"
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            />

            {tipo !== "incidencias" && (
              <input
                type="date"
                required
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            )}

            {tipo === "informes-delegados" && (
              <input
                type="text"
                placeholder="Nombre del delegado"
                value={formData.delegado_nombre}
                onChange={(e) => setFormData({ ...formData, delegado_nombre: e.target.value })}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            )}

            {tipo === "sentencias" && (
              <>
                <input
                  type="text"
                  placeholder="Juzgado"
                  value={formData.juzgado}
                  onChange={(e) => setFormData({ ...formData, juzgado: e.target.value })}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <input
                  type="text"
                  placeholder="Número de sentencia"
                  value={formData.numero_sentencia}
                  onChange={(e) => setFormData({ ...formData, numero_sentencia: e.target.value })}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </>
            )}

            {tipo === "revaloracion-riesgos" && (
              <select
                value={formData.area_id}
                onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">Seleccionar Área</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.nombre}
                  </option>
                ))}
              </select>
            )}

            {tipo !== "incidencias" && (
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adjuntar archivo {editandoId ? "(deja en blanco para mantener el actual)" : "(opcional)"}
                </label>
                <input
                  type="file"
                  onChange={(e) => setArchivo(e.target.files[0])}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold active:scale-[.98] transition-all shadow-md mt-2"
            >
              {editandoId ? "Actualizar" : "Guardar"} Registro
            </button>
          </form>
        )}

        {cargando ? (
          <p className="text-center text-mut mt-4">Cargando...</p>
        ) : (
          <div className="space-y-3">
            {datos.map((item) => (
              <div
                key={item.id}
                className="bg-panel border border-line rounded-2xl p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">
                      {item.titulo || item.descripcion || "Sin título"}
                    </h3>
                    {item.descripcion && (
                      <p className="text-mut text-sm mt-1">{item.descripcion}</p>
                    )}
                    {item.fecha && (
                      <p className="text-mut text-xs mt-2">
                        {new Date(item.fecha).toLocaleDateString()}
                      </p>
                    )}
                    {item.tipo && (
                      <span className="inline-block text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full mt-2">
                        {item.tipo}
                      </span>
                    )}
                    {item.archivo_nombre && (
                      <a
                        href={item.archivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm hover:underline inline-block mt-2"
                      >
                        📎 {item.archivo_nombre}
                      </a>
                    )}
                  </div>
                  <div className="flex gap-1 ml-3">
                    <button
                      onClick={() => handleEditar(item)}
                      className="text-yellow-600 hover:text-yellow-700 p-2"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleBorrar(item)}
                      className="text-red-600 hover:text-red-700 p-2"
                      title="Borrar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {datos.length === 0 && (
              <p className="text-center text-mut mt-4">No hay registros aún.</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}