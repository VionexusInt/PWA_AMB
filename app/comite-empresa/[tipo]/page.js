"use client";

import { useState, useEffect } from "react";
import { Header } from "../../../components/ui";
import VisorArchivo from "../../../components/VisorArchivo";
import AdjuntosCSS from "../../../components/AdjuntosCSS";
import BotonTraspaso from "../../../components/BotonTraspaso";
import {
  getDocumentosEmpresa,
  crearDocumentoEmpresa,
  actualizarDocumentoEmpresa,
  borrarDocumentoEmpresa,
  subirCSSAdjuntoMulti,
  getProtocolos,
  crearProtocolo,
  actualizarProtocolo,
  borrarProtocolo,
  getPropuestas,
  crearPropuesta,
  actualizarPropuesta,
  marcarPropuestaRealizada,
  borrarPropuesta,
} from "../../../lib/data";

export default function ComiteEmpresaTipoPage({ params }) {
  const tipo = params.tipo;
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [visor, setVisor] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    fecha: new Date().toISOString().split("T")[0],
    delegado_nombre: "",
    juzgado: "",
    numero_sentencia: "",
  });

  const [legadoActual, setLegadoActual] = useState(null); // { url, nombre }
  const [pendientes, setPendientes] = useState([]); // File[]

  const tablaActual = tipo === "protocolos" ? "protocolos_empresa" : tipo === "propuestas" ? "propuestas_empresa" : tipo === "convenio" ? "convenio_empresa" : tipo.replace("-", "_") + "_empresa";

  useEffect(() => {
    cargarDatos();
  }, [tipo]);

  async function cargarDatos() {
    setCargando(true);
    try {
      const data = await getDocumentosEmpresa(tablaActual);
      setDatos(data);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setCargando(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      let idRegistro = editandoId;

      if (tipo === "protocolos") {
        const campos = { titulo: formData.titulo, descripcion: formData.descripcion, fecha: formData.fecha || null };
        if (editandoId) {
          await actualizarProtocolo("protocolos_empresa", editandoId, campos);
        } else {
          const { data: c } = await crearProtocolo("protocolos_empresa", campos);
          idRegistro = c?.id;
        }
      } else if (tipo === "propuestas") {
        const campos = { titulo: formData.titulo, descripcion: formData.descripcion, fecha: formData.fecha || null };
        if (editandoId) {
          await actualizarPropuesta("propuestas_empresa", editandoId, campos);
        } else {
          const { data: c } = await crearPropuesta("propuestas_empresa", campos);
          idRegistro = c?.id;
        }
      } else if (editandoId) {
        await actualizarDocumentoEmpresa(tablaActual, editandoId, formData, null);
      } else {
        const creado = await crearDocumentoEmpresa(tablaActual, formData, null);
        idRegistro = creado?.[0]?.id;
      }

      if (idRegistro && pendientes.length) {
        for (const f of pendientes) {
          await subirCSSAdjuntoMulti(tablaActual, idRegistro, f);
        }
      }

      resetFormulario();
      cargarDatos();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un error al guardar.");
    } finally {
      setGuardando(false);
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
    });
    setLegadoActual(item.archivo_nombre ? { url: item.archivo_url, nombre: item.archivo_nombre } : null);
    setPendientes([]);
    setMostrarFormulario(true);
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
    });
    setLegadoActual(null);
    setPendientes([]);
  }

  async function handleBorrar(id) {
    if (!confirm("¿Estás seguro de que quieres borrar este registro?")) return;
    try {
      if (tipo === "protocolos") {
        await borrarProtocolo("protocolos_empresa", id);
      } else if (tipo === "propuestas") {
        await borrarPropuesta("propuestas_empresa", id);
      } else {
        await borrarDocumentoEmpresa(tablaActual, id);
      }
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

            <input
              type="text"
              placeholder="Título"
              required
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />

            <textarea
              placeholder="Descripción"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows="3"
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            />

            <input
              type="date"
              required
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />

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

            <AdjuntosCSS
              tabla={tablaActual}
              registroId={editandoId}
              legado={legadoActual}
              pendientes={pendientes}
              setPendientes={setPendientes}
              onLegadoBorrado={() => { setLegadoActual(null); cargarDatos(); }}
              onAbrir={setVisor}
            />

            <button
              type="submit"
              disabled={guardando}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold active:scale-[.98] transition-all shadow-md mt-2 disabled:opacity-50"
            >
              {guardando ? "Guardando..." : (editandoId ? "Actualizar" : "Guardar") + " Registro"}
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
                    {item.archivo_nombre && (
                      <button
                        type="button"
                        onClick={() => setVisor({ url: item.archivo_url, nombre: item.archivo_nombre })}
                        className="text-blue-600 text-sm hover:underline inline-block mt-2"
                      >
                        📎 {item.archivo_nombre}
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 ml-3 flex-col items-end">
                    {tipo === "propuestas" && (
                      <button
                        onClick={async () => { await marcarPropuestaRealizada("propuestas_empresa", item.id, !item.realizada); cargarDatos(); }}
                        className={`text-xs font-bold px-2 py-1 rounded-full border ${item.realizada ? "bg-panel2 text-mut border-line" : "bg-green-50 text-green-700 border-green-300"}`}
                      >
                        {item.realizada ? "↩ Pendiente" : "✓ Realizada"}
                      </button>
                    )}
                    <div className="flex gap-1">
                      <BotonTraspaso tabla={tablaActual} registroId={item.id} onTraspasado={cargarDatos} />
                      <button onClick={() => handleEditar(item)} className="text-yellow-600 hover:text-yellow-700 p-2" title="Editar">✏️</button>
                      <button onClick={() => handleBorrar(item.id)} className="text-red-600 hover:text-red-700 p-2" title="Borrar">🗑️</button>
                    </div>
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
      {visor && (
        <VisorArchivo url={visor.url} nombre={visor.nombre} tipo={visor.tipo} onClose={() => setVisor(null)} />
      )}
    </main>
  );
}
