"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Header, Badge } from "../../../components/ui";
import VisorArchivo from "../../../components/VisorArchivo";
import AdjuntosCSS from "../../../components/AdjuntosCSS";
import AdjuntosInline from "../../../components/AdjuntosInline";
import AdjuntosVerIncidencia from "../../../components/AdjuntosVerIncidencia";
import BotonPDFIncidencia from "../../../components/BotonPDFIncidencia";
import BotonTraspaso from "../../../components/BotonTraspaso";
import { useRealtime } from "../../../lib/useRealtime";
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
  getTodasIncidencias,
  resolverIncidenciaConNota,
  crearIncidenciaEmpresa,
} from "../../../lib/data";

const TIPOS_INC = ["Todos", "Seguridad", "Avería", "Personal", "Vehículo", "Otro"];

function origenInc(i) {
  if (i._origenEmpresa) return { tipo: "Comité de Empresa", nombre: null, href: null };
  if (i.trabajador) return { tipo: "Trabajador", nombre: i.trabajador.nombre, href: `/trabajador/${i.trabajador.id}` };
  if (i.vehiculo) return { tipo: "Vehículo", nombre: i.vehiculo.matricula || "Sin matrícula", href: `/vehiculo/${i.vehiculo.id}` };
  if (i.base) return { tipo: "Base", nombre: i.base.nombre, href: `/base/${i.base.id}` };
  return null;
}

export default function ComiteEmpresaTipoPage({ params }) {
  const tipo = params.tipo;
  const esIncidencias = tipo === "incidencias";
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

  // Filtros/estado propios de la vista "Incidencias" (muestra TODAS las de la app)
  const [filtroInc, setFiltroInc] = useState("pendientes"); // pendientes | todas
  const [tipoIncF, setTipoIncF] = useState("Todos");
  const [resolviendoInc, setResolviendoInc] = useState(null);
  const [sessionResueltas, setSessionResueltas] = useState(new Set());

  const tablaActual = tipo === "protocolos" ? "protocolos_empresa" : tipo === "propuestas" ? "propuestas_empresa" : tipo === "calendarios" ? "calendarios_laborales" : tipo === "licitacion" ? "licitacion_empresa" : tipo === "convenio" ? "convenio_empresa" : tipo.replace("-", "_") + "_empresa";

  async function cargarDatos() {
    try {
      let data;
      if (tipo === "protocolos") {
        const { data: d, error } = await getProtocolos("protocolos_empresa");
        if (error) throw error;
        data = d || [];
      } else if (tipo === "propuestas") {
        const { data: d, error } = await getPropuestas("propuestas_empresa");
        if (error) throw error;
        data = d || [];
      } else if (esIncidencias) {
        const { data: d, error } = await getTodasIncidencias();
        if (error) throw error;
        data = d || [];
      } else if (tipo === "calendarios") {
        const { data: d, error } = await getProtocolos("calendarios_laborales");
        if (error) throw error;
        data = d || [];
      } else if (tipo === "licitacion") {
        const { data: d, error } = await getProtocolos("licitacion_empresa");
        if (error) throw error;
        data = d || [];
      } else {
        data = await getDocumentosEmpresa(tablaActual);
      }
      return { data, error: null };
    } catch (error) {
      console.error("Error cargando datos:", error);
      return { data: null, error };
    }
  }

  const tablasRT = esIncidencias
    ? ["incidencias", "incidencias_empresa", "bases", "trabajadores", "vehiculos", "css_adjuntos"]
    : [tablaActual, "css_adjuntos"];

  const { data: datosRT, loading: cargando, reload: recargar } = useRealtime(
    cargarDatos,
    tablasRT,
    [tipo]
  );
  const datosCrudo = datosRT || [];

  let datos = datosCrudo;
  if (esIncidencias) {
    datos = filtroInc === "pendientes" ? datosCrudo.filter((i) => !i.resuelta || sessionResueltas.has(i.id)) : datosCrudo;
    if (tipoIncF !== "Todos") datos = datos.filter((i) => i.tipo === tipoIncF);
  }
  const nPendInc = datosCrudo.filter((i) => !i.resuelta).length;

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
      } else if (esIncidencias) {
        const creado = await crearIncidenciaEmpresa(formData);
        idRegistro = creado?.[0]?.id;
      } else if (tipo === "calendarios") {
        const campos = { titulo: formData.titulo, descripcion: formData.descripcion, fecha: formData.fecha || null };
        if (editandoId) {
          await actualizarProtocolo("calendarios_laborales", editandoId, campos);
        } else {
          const { data: c } = await crearProtocolo("calendarios_laborales", campos);
          idRegistro = c?.id;
        }
      } else if (tipo === "licitacion") {
        const campos = { titulo: formData.titulo, descripcion: formData.descripcion, fecha: formData.fecha || null };
        if (editandoId) {
          await actualizarProtocolo("licitacion_empresa", editandoId, campos);
        } else {
          const { data: c } = await crearProtocolo("licitacion_empresa", campos);
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
      recargar();
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
      } else if (tipo === "calendarios") {
        await borrarProtocolo("calendarios_laborales", id);
      } else if (tipo === "licitacion") {
        await borrarProtocolo("licitacion_empresa", id);
      } else {
        await borrarDocumentoEmpresa(tablaActual, id);
      }
      recargar();
    } catch (error) {
      console.error("Error al borrar:", error);
      alert("Hubo un error al borrar.");
    }
  }

  async function reabrirInc(i) {
    await resolverIncidenciaConNota(i._origenEmpresa, i.id, { resuelta: false });
    recargar();
  }

  let tituloPagina = tipo
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  if (tipo === "informes-delegados") {
    tituloPagina = "Informes Delegados";
  }
  if (tipo === "calendarios") {
    tituloPagina = "Calendarios Laborales";
  }
  if (tipo === "licitacion") {
    tituloPagina = "Licitación";
  }

  return (
    <main className="pb-16">
      <Header titulo={tituloPagina} subtitulo={esIncidencias ? `${nPendInc} sin resolver` : undefined} back />
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
            className="bg-panel border border-line rounded-2xl p-5 mb-6 space-y-4"
          >
            <h3 className="title text-xl font-bold mb-2">
              {editandoId ? "Editar Registro" : "Nuevo Registro"}
            </h3>

            <input
              type="text"
              placeholder="Título"
              required
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full p-3 bg-panel2 border border-line rounded-xl text-ink placeholder:text-mut outline-none focus:border-accent transition-colors"
            />

            <textarea
              placeholder="Descripción"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows="3"
              className="w-full p-3 bg-panel2 border border-line rounded-xl text-ink placeholder:text-mut outline-none focus:border-accent transition-colors resize-none"
            />

            <input
              type="date"
              required
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              className="w-full p-3 bg-panel2 border border-line rounded-xl text-ink outline-none focus:border-accent transition-colors"
              style={{ colorScheme: "light" }}
            />

            {tipo === "informes-delegados" && (
              <input
                type="text"
                placeholder="Nombre del delegado"
                value={formData.delegado_nombre}
                onChange={(e) => setFormData({ ...formData, delegado_nombre: e.target.value })}
                className="w-full p-3 bg-panel2 border border-line rounded-xl text-ink placeholder:text-mut outline-none focus:border-accent transition-colors"
              />
            )}

            {tipo === "sentencias" && (
              <>
                <input
                  type="text"
                  placeholder="Juzgado"
                  value={formData.juzgado}
                  onChange={(e) => setFormData({ ...formData, juzgado: e.target.value })}
                  className="w-full p-3 bg-panel2 border border-line rounded-xl text-ink placeholder:text-mut outline-none focus:border-accent transition-colors"
                />
                <input
                  type="text"
                  placeholder="Número de sentencia"
                  value={formData.numero_sentencia}
                  onChange={(e) => setFormData({ ...formData, numero_sentencia: e.target.value })}
                  className="w-full p-3 bg-panel2 border border-line rounded-xl text-ink placeholder:text-mut outline-none focus:border-accent transition-colors"
                />
              </>
            )}

            <AdjuntosCSS
              tabla={tablaActual}
              registroId={editandoId}
              legado={legadoActual}
              pendientes={pendientes}
              setPendientes={setPendientes}
              onLegadoBorrado={() => { setLegadoActual(null); recargar(); }}
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

        {esIncidencias && (
          <div className="mb-4 space-y-2">
            <div className="flex gap-2">
              {[{ k: "pendientes", label: "Pendientes" }, { k: "todas", label: "Todas" }].map((f) => (
                <button key={f.k} onClick={() => setFiltroInc(f.k)}
                  className={`tap px-4 py-2 rounded-full text-sm font-semibold border ${filtroInc === f.k ? "bg-accent text-white border-accent" : "bg-panel text-mut border-line"}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto noscroll">
              {TIPOS_INC.map((t) => (
                <button key={t} onClick={() => setTipoIncF(t)}
                  className={`tap px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border ${tipoIncF === t ? "bg-ink text-base border-ink" : "bg-panel text-mut border-line"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {cargando ? (
          <p className="text-center text-mut mt-4">Cargando...</p>
        ) : (
          <div className="space-y-3">
            {esIncidencias
              ? datos.map((i) => {
                  const o = origenInc(i);
                  return (
                    <div key={i.id}
                      className={`border rounded-2xl overflow-hidden ${i.resuelta ? "bg-panel border-ok/30" : "bg-panel border-accent/30"}`}>
                      <div className="px-4 pt-4 pb-3">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {i.tipo && <Badge tone="accent">{i.tipo}</Badge>}
                          {o?.tipo && <Badge>{o.tipo}</Badge>}
                          {i.resuelta && <Badge tone="ok">✓ Resuelta</Badge>}
                        </div>
                        <p className="text-ink">{i.descripcion}</p>
                        <p className="text-mut text-xs mt-2">{new Date(i.fecha).toLocaleString("es-ES")}</p>
                        <AdjuntosVerIncidencia incidenciaId={i.id} n={i.adjuntos?.length || 0} origenEmpresa={i._origenEmpresa} />

                        {o?.href && (
                          <Link href={o.href}
                            className="tap inline-flex items-center gap-1 mt-3 text-xs font-semibold px-3 py-1.5 rounded-full bg-panel2 border border-line text-ink active:scale-95">
                            <span className="text-mut">{o.tipo}:</span> {o.nombre} <span className="text-accent">→</span>
                          </Link>
                        )}

                        {i.resuelta && (
                          <div className="mt-3 p-3 bg-ok/10 border border-ok/25 rounded-xl">
                            <p className="text-ok text-xs font-semibold">
                              Resuelta el {i.fecha_resolucion ? new Date(i.fecha_resolucion).toLocaleDateString("es-ES") : "—"}
                            </p>
                            {i.resolucion_texto && (
                              <p className="text-ink text-sm mt-1 whitespace-pre-line">{i.resolucion_texto}</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="px-4 pb-4 flex items-center gap-2">
                        {i.resuelta ? (
                          <button onClick={() => reabrirInc(i)}
                            className="tap text-xs font-bold px-3 py-1.5 rounded-full border bg-panel2 text-mut border-line">
                            Reabrir
                          </button>
                        ) : (
                          <button onClick={() => setResolviendoInc(resolviendoInc === i.id ? null : i.id)}
                            className="tap text-xs font-bold px-3 py-1.5 rounded-full border bg-ok/15 text-ok border-ok/40">
                            Resolver
                          </button>
                        )}
                        <BotonPDFIncidencia incidencia={i} />
                      </div>

                      {resolviendoInc === i.id && !i.resuelta && (
                        <FormResolverInc
                          incidencia={i}
                          onCancelar={() => setResolviendoInc(null)}
                          onResuelta={() => {
                            setSessionResueltas((s) => new Set([...s, i.id]));
                            setResolviendoInc(null);
                            recargar();
                          }}
                        />
                      )}
                    </div>
                  );
                })
              : datos.map((item) => (
                  <div
                    key={item.id}
                    className="bg-panel border border-line rounded-2xl p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">
                          {item.titulo || "Sin título"}
                        </h3>
                        {item.descripcion && (
                          <p className="text-mut text-sm mt-1">{item.descripcion}</p>
                        )}
                        {item.fecha && (
                          <p className="text-mut text-xs mt-2">
                            {new Date(item.fecha).toLocaleDateString()}
                          </p>
                        )}
                        <AdjuntosInline
                          tabla={tablaActual}
                          registroId={item.id}
                          legado={item.archivo_nombre ? { url: item.archivo_url, nombre: item.archivo_nombre } : null}
                          onAbrirVisor={setVisor}
                          onLegadoBorrado={recargar}
                        />
                      </div>
                      <div className="flex gap-2 ml-3 flex-col items-end">
                        {tipo === "propuestas" && (
                          <button
                            onClick={async () => { await marcarPropuestaRealizada("propuestas_empresa", item.id, !item.realizada); recargar(); }}
                            className={`text-xs font-bold px-2 py-1 rounded-full border ${item.realizada ? "bg-panel2 text-mut border-line" : "bg-green-50 text-green-700 border-green-300"}`}
                          >
                            {item.realizada ? "↩ Pendiente" : "✓ Realizada"}
                          </button>
                        )}
                        <div className="flex gap-1">
                          <BotonTraspaso tabla={tablaActual} registroId={item.id} onTraspasado={recargar} />
                          <button onClick={() => handleEditar(item)} className="text-yellow-600 hover:text-yellow-700 p-2" title="Editar">✏️</button>
                          <button onClick={() => handleBorrar(item.id)} className="text-red-600 hover:text-red-700 p-2" title="Borrar">🗑️</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            {datos.length === 0 && (
              <p className="text-center text-mut mt-4">
                {esIncidencias && filtroInc === "pendientes" ? "No hay incidencias sin resolver." : "No hay registros aún."}
              </p>
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

/* ---------- Formulario para resolver una incidencia (nota + fecha + archivo) ---------- */
function FormResolverInc({ incidencia, onCancelar, onResuelta }) {
  const [texto, setTexto] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [archivos, setArchivos] = useState([]);
  const [guardando, setGuardando] = useState(false);

  function elegir(e) {
    setArchivos((a) => [...a, ...Array.from(e.target.files || [])]);
    e.target.value = "";
  }

  async function confirmar() {
    setGuardando(true);
    try {
      await resolverIncidenciaConNota(incidencia._origenEmpresa, incidencia.id, {
        resuelta: true, texto: texto.trim(), fecha, archivos,
      });
      onResuelta();
    } catch (e) {
      alert("No se pudo marcar como resuelta.");
    }
    setGuardando(false);
  }

  return (
    <div className="px-4 pb-4 pt-1 border-t border-line bg-panel2/40">
      <p className="text-sm font-semibold mt-3 mb-2">Marcar como resuelta</p>

      <label className="block mb-2">
        <span className="text-mut text-xs">Fecha de resolución</span>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
          className="mt-1 w-full bg-panel2 border border-line rounded-xl px-3 py-2.5 text-ink outline-none focus:border-accent" />
      </label>

      <label className="block mb-2">
        <span className="text-mut text-xs">Notas (qué se hizo, opcional)</span>
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3}
          className="mt-1 w-full bg-panel2 border border-line rounded-xl px-3 py-2.5 text-ink outline-none focus:border-accent resize-none" />
      </label>

      {archivos.length > 0 && (
        <div className="space-y-1 mb-2">
          {archivos.map((f, i) => (
            <div key={i} className="flex items-center justify-between bg-panel border border-line rounded-lg px-3 py-1.5">
              <span className="text-xs truncate">📎 {f.name}</span>
              <button onClick={() => setArchivos((a) => a.filter((_, j) => j !== i))} className="text-mut text-base px-1">×</button>
            </div>
          ))}
        </div>
      )}

      <BotonArchivoInc onElegir={elegir} />

      <div className="flex gap-2 mt-3">
        <button onClick={onCancelar} className="tap flex-1 py-2.5 rounded-xl bg-panel2 border border-line text-sm font-semibold">
          Cancelar
        </button>
        <button onClick={confirmar} disabled={guardando}
          className="tap flex-1 py-2.5 rounded-xl bg-ok text-white text-sm font-semibold disabled:opacity-50">
          {guardando ? "Guardando…" : "Confirmar resolución"}
        </button>
      </div>
    </div>
  );
}

function BotonArchivoInc({ onElegir }) {
  const ref = useRef(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.click()}
        className="text-xs font-semibold text-mut active:scale-95">
        + Adjuntar archivo de la resolución
      </button>
      <input ref={ref} type="file" multiple onChange={onElegir}
        style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", border: 0 }} />
    </>
  );
}
