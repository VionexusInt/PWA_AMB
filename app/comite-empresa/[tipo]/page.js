"use client";

import { useState, useEffect } from "react";
import { Header } from "../../../components/ui";
import {
  getDocumentosEmpresa,
  crearDocumentoEmpresa,
  actualizarDocumentoEmpresa,
  borrarDocumentoEmpresa,
  crearIncidenciaEmpresa,
  getIncidenciasEmpresa,
} from "../../../lib/data";

export default function ComiteEmpresaTipoPage({ params }) {
  const tipo = params.tipo;
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    fecha: new Date().toISOString().split("T")[0],
    delegado_nombre: "",
    juzgado: "",
    numero_sentencia: "",
    tipo_incidencia: "",
  });
  const [archivo, setArchivo] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [tipo]);

  async function cargarDatos() {
    setCargando(true);
    try {
      let data = [];
      if (tipo === "incidencias") {
        data = await getIncidenciasEmpresa();
      } else {
        const tabla = tipo === "convenio" ? "convenio_empresa" : tipo.replace("-", "_") + "_empresa";
        data = await getDocumentosEmpresa(tabla);
      }
      setDatos(data);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setCargando(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const tabla = tipo === "convenio" ? "convenio_empresa" : tipo.replace("-", "_") + "_empresa";
      
      if (tipo === "incidencias") {
        if (editandoId) {
          // Actualizar incidencia
          const payload = {
            descripcion: formData.descripcion,
            tipo: formData.tipo_incidencia,
          };
          const { error } = await supabase.from("incidencias_empresa").update(payload).eq("id", editandoId);
          if (error) throw error;
        } else {
          await crearIncidenciaEmpresa(formData);
        }
      } else if (editandoId) {
        await actualizarDocumentoEmpresa(tabla, editandoId, formData, archivo);
      } else {
        await crearDocumentoEmpresa(tabla, formData, archivo);
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
      tipo_incidencia: item.tipo || "",
    });
    setMostrarFormulario(true);
  }

  async function handleBorrar(id) {
    if (!confirm("¿Estás seguro de que quieres borrar este registro?")) return;
    try {
      const tabla = tipo === "convenio" ? "convenio_empresa" : tipo === "incidencias" ? "incidencias_empresa" : tipo.replace("-", "_") + "_empresa";
      await borrarDocumentoEmpresa(tabla, id);
      cargarDatos();
    } catch (error) {
      console.error("Error al borrar:", error);
      alert("Hubo un error al borrar.");
    }
  }

  let tituloPagina = tipo
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  if (tipo === "informes-delegados") {
    tituloPagina = "Informes Delegados";
  }

  return (
    <main className="pb-16">
      <Header titulo={tituloPagina} back />
      <div className="px-4 mt-6">
        <button
          onClick={() => {
            setMostrarFormulario(!mostrarFormulario);
            if (mostrarFormulario) {
              setEditandoId(null);
              setFormData({
                titulo: "",
                descripcion: "",
                fecha: new Date().toISOString().split("T")[0],
                delegado_nombre: "",
                juzgado: "",
                numero_sentencia: "",
                tipo_incidencia: "",
              });
              setArchivo(null);
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
                <option value="">Seleccionar Tipo</option>
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
            
            {tipo !== "incidencias" && (
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adjuntar archivo (opcional)
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
                  <div className="flex gap-2 ml-3">
                    <button
                      onClick={() => handleEditar(item)}
                      className="text-yellow-600 hover:text-yellow-700 p-2"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleBorrar(item.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                      title="Borrar"
                    >
                      ️
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