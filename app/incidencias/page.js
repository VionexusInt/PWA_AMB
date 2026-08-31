"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { getTodasIncidencias, resolverIncidenciaConNota } from "../../lib/data";
import { useRealtime } from "../../lib/useRealtime";
import { Header, Badge, Spinner } from "../../components/ui";
import BotonPDFIncidencia from "../../components/BotonPDFIncidencia";
import AdjuntosVerIncidencia from "../../components/AdjuntosVerIncidencia";

function origen(i) {
  if (i._origenEmpresa) return { tipo: "Comité de Empresa", nombre: null, href: null };
  if (i.trabajador) return { tipo: "Trabajador", nombre: i.trabajador.nombre, href: `/trabajador/${i.trabajador.id}` };
  if (i.vehiculo) return { tipo: "Vehículo", nombre: i.vehiculo.matricula || "Sin matrícula", href: `/vehiculo/${i.vehiculo.id}` };
  if (i.base) return { tipo: "Base", nombre: i.base.nombre, href: `/base/${i.base.id}` };
  return null;
}

function etiquetaMes(fecha) {
  const d = new Date(fecha);
  return d.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase());
}

function claveGrupo(fecha) {
  const d = new Date(fecha);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function IncidenciasPage() {
  const { data, loading, reload } = useRealtime(
    () => getTodasIncidencias(),
    ["incidencias", "incidencias_empresa", "bases", "trabajadores", "vehiculos", "css_adjuntos"],
    []
  );
  const [filtro, setFiltro] = useState("pendientes");
  const [tipoF, setTipoF] = useState("Todos");
  const [resolviendo, setResolviendo] = useState(null); // id de la incidencia con el formulario abierto
  // ids resueltas en esta sesión: las mantenemos visibles aunque el filtro sea "pendientes"
  const [sessionResueltas, setSessionResueltas] = useState(new Set());

  const TIPOS = ["Todos", "Seguridad", "Avería", "Personal", "Vehículo", "Otro"];
  const todas = data || [];
  let items = filtro === "pendientes" ? todas.filter((i) => !i.resuelta || sessionResueltas.has(i.id)) : todas;
  if (tipoF !== "Todos") items = items.filter((i) => i.tipo === tipoF);
  const nPend = todas.filter((i) => !i.resuelta).length;

  // Agrupar por mes/año
  const grupos = [];
  const visto = {};
  items.forEach((i) => {
    const k = claveGrupo(i.fecha);
    if (!visto[k]) { visto[k] = true; grupos.push({ clave: k, label: etiquetaMes(i.fecha), items: [] }); }
    grupos[grupos.length - 1].items.push(i);
  });

  async function reabrir(i) {
    await resolverIncidenciaConNota(i._origenEmpresa, i.id, { resuelta: false });
    reload();
  }

  return (
    <main className="pb-10">
      <Header titulo="Incidencias" subtitulo={`${nPend} sin resolver`} back />

      <div className="px-4 mt-4 flex gap-2">
        {[{ k: "pendientes", label: "Pendientes" }, { k: "todas", label: "Todas" }].map((f) => (
          <button key={f.k} onClick={() => setFiltro(f.k)}
            className={`tap px-4 py-2 rounded-full text-sm font-semibold border ${filtro === f.k ? "bg-accent text-white border-accent" : "bg-panel text-mut border-line"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-4 mt-2 flex gap-2 overflow-x-auto noscroll">
        {TIPOS.map((t) => (
          <button key={t} onClick={() => setTipoF(t)}
            className={`tap px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border ${tipoF === t ? "bg-ink text-base border-ink" : "bg-panel text-mut border-line"}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="px-4 mt-4">
          {grupos.length === 0 && (
            <p className="text-mut text-center py-10">
              {filtro === "pendientes" ? "No hay incidencias sin resolver." : "No hay incidencias."}
            </p>
          )}
          {grupos.map((g) => (
            <div key={g.clave} className="mb-6">
              <h2 className="title text-base font-bold text-mut uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="flex-1 border-t border-line" />
                {g.label}
                <span className="flex-1 border-t border-line" />
              </h2>

              <div className="grid gap-3">
                {g.items.map((i) => {
                  const o = origen(i);
                  const fecha = new Date(i.fecha);
                  return (
                    <div key={i.id}
                      className={`border rounded-2xl overflow-hidden ${i.resuelta ? "bg-panel border-ok/30" : "bg-panel border-accent/30"}`}>

                      <div className={`px-4 pt-3 pb-2 border-b ${i.resuelta ? "border-ok/20" : "border-accent/20"}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="title text-2xl font-extrabold leading-none">
                              {fecha.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }).toUpperCase()}
                            </p>
                            <p className="text-mut text-xs mt-0.5">
                              {fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          {i.resuelta && <Badge tone="ok">✓ Resuelta</Badge>}
                        </div>
                        <AdjuntosVerIncidencia incidenciaId={i.id} n={i.adjuntos?.length || 0} origenEmpresa={i._origenEmpresa} />
                      </div>

                      <div className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {i.tipo && <Badge tone="accent">{i.tipo}</Badge>}
                          {o?.tipo === "Comité de Empresa" && <Badge>Comité de Empresa</Badge>}
                        </div>
                        <p className="text-ink leading-snug">{i.descripcion}</p>

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

                      <div className="px-4 pb-3 flex items-center gap-2">
                        {i.resuelta ? (
                          <button onClick={() => reabrir(i)}
                            className="tap text-xs font-bold px-3 py-1.5 rounded-full border bg-panel2 text-mut border-line">
                            Reabrir
                          </button>
                        ) : (
                          <button onClick={() => setResolviendo(resolviendo === i.id ? null : i.id)}
                            className="tap text-xs font-bold px-3 py-1.5 rounded-full border bg-ok/15 text-ok border-ok/40">
                            Resolver
                          </button>
                        )}
                        <BotonPDFIncidencia incidencia={i} />
                      </div>

                      {resolviendo === i.id && !i.resuelta && (
                        <FormResolver
                          incidencia={i}
                          onCancelar={() => setResolviendo(null)}
                          onResuelta={() => {
                            setSessionResueltas((s) => new Set([...s, i.id]));
                            setResolviendo(null);
                            reload();
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

/* ---------- Formulario para resolver: nota + fecha + archivo ---------- */
function FormResolver({ incidencia, onCancelar, onResuelta }) {
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

      <BotonArchivo onElegir={elegir} />

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

function BotonArchivo({ onElegir }) {
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
