"use client";

import { useState, useEffect } from "react";
import { Header } from "../../../components/ui";
import {
  getDocumentosCSS,
  crearDocumentoCSS,
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
  
  // Estado para el filtro de incidencias
  const [filtroTipo, setFiltroTipo] = useState("todos"); 

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    fecha: new Date().toISOString().split("T")[0],
    delegado_nombre: "",
    juzgado: "",
    numero_sentencia: "",
    area_id: "",
    base_id: "",
  });
  const [archivo, setArchivo] = useState(null);
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    cargarDatos();
    if (tipo === "revaloracion-riesgos") {
      cargarAreasYBases();
    }
  }, [tipo, filtroTipo]); // Añadido filtroTipo a las dependencias

  async function cargarDatos() {
    setCargando(true);
    try {
      let data = [];
      if (tipo === "revaloracion-riesgos") {
        data = await getRevaloracionRiesgos();
      } else if (tipo === "incidencias") {
        // Pasamos el filtro si no es "todos"
        const filtroParam = filtroTipo === "todos" ? null : filtroTipo;
        const incidencias = await getIncidencias(filtroParam);
        data = incidencias || [];
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
      } else {
        await crearDocumentoCSS(tipo.replace("-", "_"), formData, archivo);
      }
      setMostrarFormulario(false);
      setFormData({
        titulo: "",
        descripcion: "",
        fecha: new Date().toISOString().split("T")[0],
        delegado_nombre: "",
        juzgado: "",
        numero_sentencia: "",
        area_id: "",
        base_id: "",
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

  if (tipo === "revaloracion-riesgos") {
    tituloPagina = "Evaluación de Riesgos";
  }

  return (
    <main className="pb-16">
      <Header titulo={tituloPagina} back />

      <div className="px-4 mt-6">
        
        {/* FILTRO DE INCIDENCIAS */}
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

        {tipo !== "incidencias" && (
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="w-full mb-4 bg-blue-600 text-white py-3 rounded-xl font-bold active:scale-[.98] transition-transform"
          >
            {mostrarFormulario ? "Cancelar" : "+ Nuevo Registro"}
          </button>
        )}

        {mostrarFormulario && (
          <form
            onSubmit={handleSubmit}
            className="bg-panel border border-line rounded-2xl p-4 mb-6 space-y-3"
          >
            <input
              type="text"
              placeholder="Título"
              required
              value={formData.titulo}
              onChange={(e) =>
                setFormData({ ...formData, titulo: e.target.value })
              }
              className="w-full p-3 bg-input border border-line rounded-xl"
            />
            <textarea
              placeholder="Descripción"
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              className="w-full p-3 bg-input border border-line rounded-xl"
            />
            <input
              type="date"
              required
              value={formData.fecha}
              onChange={(e) =>
                setFormData({ ...formData, fecha: e.target.value })
              }
              className="w-full p-3 bg-input border border-line rounded-xl"
            />

            {tipo === "informes-delegados" && (
              <input
                type="text"
                placeholder="Nombre del delegado"
                value={formData.delegado_nombre}
                onChange={(e) =>
                  setFormData({ ...formData, delegado_nombre: e.target.value })
                }
                className="w-full p-3 bg-input border border-line rounded-xl"
              />
            )}

            {tipo === "sentencias" && (
              <>
                <input
                  type="text"
                  placeholder="Juzgado"
                  value={formData.juzgado}
                  onChange={(e) =>
                    setFormData({ ...formData, juzgado: e.target.value })
                  }
                  className="w-full p-3 bg-input border border-line rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Número de sentencia"
                  value={formData.numero_sentencia}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      numero_sentencia: e.target.value,
                    })
                  }
                  className="w-full p-3 bg-input border border-line rounded-xl"
                />
              </>
            )}

            {tipo === "revaloracion-riesgos" && (
              <select
                value={formData.area_id}
                onChange={(e) =>
                  setFormData({ ...formData, area_id: e.target.value })
                }
                className="w-full p-3 bg-input border border-line rounded-xl"
              >
                <option value="">Seleccionar Área</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.nombre}
                  </option>
                ))}
              </select>
            )}

            <input
              type="file"
              onChange={(e) => setArchivo(e.target.files[0])}
              className="w-full p-3 bg-input border border-line rounded-xl"
            />

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold active:scale-[.98] transition-transform"
            >
              Guardar
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
                  <h3 className="font-bold text-lg">
                    {item.titulo || item.descripcion || "Sin título"}
                  </h3>
                  {item.tipo && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {item.tipo}
                    </span>
                  )}
                </div>
                
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