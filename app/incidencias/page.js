"use client";
import { useState } from "react";
import Link from "next/link";
import { getTodasIncidencias, resolverIncidencia } from "../../lib/data";
import { useRealtime } from "../../lib/useRealtime";
import { Header, Badge, Spinner } from "../../components/ui";
import BotonPDFIncidencia from "../../components/BotonPDFIncidencia";

function origen(i) {
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
    ["incidencias", "bases", "trabajadores", "vehiculos"],
    []
  );
  const [filtro, setFiltro] = useState("pendientes");
  const [tipoF, setTipoF] = useState("Todos");

  const TIPOS = ["Todos", "Seguridad", "Avería", "Personal", "Vehículo", "Otro"];
  const todas = data || [];
  let items = filtro === "pendientes" ? todas.filter((i) => !i.resuelta) : todas;
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

  async function toggle(i) {
    await resolverIncidencia(i.id, !i.resuelta);
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
              {/* Cabecera del grupo mes/año */}
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
                      className={`border rounded-2xl overflow-hidden ${i.resuelta ? "bg-panel border-line opacity-70" : "bg-panel border-accent/30"}`}>

                      {/* Fecha grande arriba */}
                      <div className={`px-4 pt-3 pb-2 border-b ${i.resuelta ? "border-line" : "border-accent/20"}`}>
                        <p className="title text-2xl font-extrabold leading-none">
                          {fecha.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }).toUpperCase()}
                        </p>
                        <p className="text-mut text-xs mt-0.5">
                          {fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          {i.adjuntos?.length > 0 && ` · 📎 ${i.adjuntos.length}`}
                        </p>
                      </div>

                      {/* Cuerpo */}
                      <div className="px-4 py-3">
                        {i.tipo && <div className="mb-2"><Badge tone="accent">{i.tipo}</Badge></div>}
                        <p className={`leading-snug ${i.resuelta ? "line-through text-mut" : "text-ink"}`}>
                          {i.descripcion}
                        </p>

                        {o && (
                          <Link href={o.href}
                            className="tap inline-flex items-center gap-1 mt-3 text-xs font-semibold px-3 py-1.5 rounded-full bg-panel2 border border-line text-ink active:scale-95">
                            <span className="text-mut">{o.tipo}:</span> {o.nombre} <span className="text-accent">→</span>
                          </Link>
                        )}

                        {i.resuelta && i.fecha_resolucion && (
                          <p className="text-ok text-xs mt-2">
                            ✓ Resuelta el {new Date(i.fecha_resolucion).toLocaleDateString("es-ES")}
                          </p>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="px-4 pb-3 flex items-center gap-2">
                        <button onClick={() => toggle(i)}
                          className={`tap text-xs font-bold px-3 py-1.5 rounded-full border ${i.resuelta ? "bg-panel2 text-mut border-line" : "bg-ok/15 text-ok border-ok/40"}`}>
                          {i.resuelta ? "Reabrir" : "Resolver"}
                        </button>
                        <BotonPDFIncidencia incidencia={i} />
                      </div>
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
