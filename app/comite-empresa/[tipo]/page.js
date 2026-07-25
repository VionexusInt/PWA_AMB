"use client";
import { useState, useEffect } from "react";
import { Header } from "../../../components/ui";
import {
  getDocumentosEmpresa,
  crearDocumentoEmpresa,
} from "../../../lib/data";
import { supabase } from "../../../lib/supabase";

export default function ComiteEmpresaTipoPage({ params }) {
  const tipo = params.tipo;
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    fecha: new Date().toISOString().split("T")[0],
    delegado_nombre: "",
  });
  const [archivo, setArchivo] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [tipo]);

  async function cargarDatos() {
    setCargando(true);
    try {
      const data = await getDocumentosEmpresa(tipo.replace("-", "_") + "_empresa");
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
      await crearDocumentoEmpresa(tipo.replace("-", "_") + "_empresa", formData, archivo);
      setMostrarFormulario(false);
      setFormData({
        titulo: "",
        descripcion: "",
        fecha: new Date().toISOString().split("T")[0],
        delegado_nombre: "",
      });
      setArchivo(null);
      cargarDatos();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un error al guardar.");
    }
  }

  let tituloPagina = tipo
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <main className="pb-16">
      <Header titulo={tituloPagina} back />
      <div className="px-4 mt-6">
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
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
              Nuevo Registro
            </h3>
            <input
              type="text"
              placeholder="Título"
              required
              value={formData.titulo}
              onChange={(e) =>
                setFormData({ ...formData, titulo: e.target.value })
              }
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <textarea
              placeholder="Descripción"
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              rows="3"
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            />
            <input
              type="date"
              required
              value={formData.fecha}
              onChange={(e) =>
                setFormData({ ...formData, fecha: e.target.value })
              }
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {tipo === "informes-delegados" && (
              <input
                type="text"
                placeholder="Nombre del delegado"
                value={formData.delegado_nombre}
                onChange={(e) =>
                  setFormData({ ...formData, delegado_nombre: e.target.value })
                }
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            )}
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
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold active:scale-[.98] transition-all shadow-md mt-2"
            >
              Guardar Registro
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
                <h3 className="font-bold text-lg">
                  {item.titulo || item.descripcion || "Sin título"}
                </h3>
                {item.descripcion && (
                  <p className="text-mut text-sm mt-1">{item.descripcion}</p>
                )}
                <p className="text-mut text-xs mt-2">
                  {new Date(item.fecha).toLocaleDateString()}
                </p>
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