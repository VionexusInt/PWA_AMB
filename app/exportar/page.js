"use client";
import { useState, useEffect } from "react";
import { getDatosInforme } from "../../lib/data";
import { useRealtime } from "../../lib/useRealtime";
import { esDispositivoAdmin } from "../../lib/acceso";
import { Header, Spinner } from "../../components/ui";

export default function ExportarPage() {
  const [admin, setAdmin] = useState(null);
  useEffect(() => setAdmin(esDispositivoAdmin()), []);

  const { data, loading } = useRealtime(
    () => getDatosInforme(),
    ["areas", "bases", "trabajadores", "vehiculos", "incidencias"],
    []
  );

  const [secc, setSecc] = useState({ trab: true, veh: true, inc: true });
  const [alcance, setAlcance] = useState("general"); // general | area | base
  const [areaId, setAreaId] = useState("");
  const [baseId, setBaseId] = useState("");

  if (admin === null) {
    return (<main><Header titulo="Informes" back /><Spinner /></main>);
  }
  if (!admin) {
    return (
      <main>
        <Header titulo="Informes" back />
        <p className="px-4 mt-6 text-mut">Esta sección es solo para administradores.</p>
      </main>
    );
  }

  // Mapa base -> {nombre, areaId, areaNombre}
  const baseMap = {};
  (data?.areas || []).forEach((a) =>
    (a.bases || []).forEach((b) => (baseMap[b.id] = { nombre: b.nombre, areaId: a.id, areaNombre: a.nombre }))
  );

  const areas = data?.areas || [];
  const basesAlcance = alcance === "area" && areaId
    ? (areas.find((a) => a.id === areaId)?.bases || [])
    : [];

  // Filtro por alcance
  function enAlcance(bId) {
    if (!bId) return alcance === "general";
    if (alcance === "general") return true;
    if (alcance === "area") return baseMap[bId]?.areaId === areaId;
    if (alcance === "base") return bId === baseId;
    return true;
  }

  const trabajadores = (data?.trabajadores || []).filter((t) => enAlcance(t.base?.id || t.base_id));
  const vehiculos = (data?.vehiculos || []).filter((v) => enAlcance(v.base?.id || v.base_id));
  const incidencias = (data?.incidencias || []).filter((i) => {
    const b = i.base?.id || i.trabajador?.base_id || i.vehiculo?.base_id;
    return enAlcance(b);
  });

  const alcanceTexto =
    alcance === "general" ? "General (todas las áreas)"
    : alcance === "area" ? `Área: ${areas.find((a) => a.id === areaId)?.nombre || "—"}`
    : `Base: ${baseMap[baseId]?.nombre || "—"}`;

  const fecha = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

  const listo = alcance === "general" || (alcance === "area" && areaId) || (alcance === "base" && baseId);

  return (
    <main className="pb-16">
      <Header titulo="Informes" subtitulo="Exportar a PDF" back />

      {/* Controles (no salen en el PDF) */}
      <div className="no-print px-4 mt-4 space-y-4">
        <div>
          <span className="text-mut text-sm">¿Qué incluir?</span>
          <div className="mt-1 flex gap-2 flex-wrap">
            {[
              { k: "trab", label: "Trabajadores" },
              { k: "veh", label: "Vehículos" },
              { k: "inc", label: "Incidencias" },
            ].map((s) => (
              <button
                key={s.k}
                onClick={() => setSecc((v) => ({ ...v, [s.k]: !v[s.k] }))}
                className={`tap px-4 py-2 rounded-xl border font-semibold text-sm ${
                  secc[s.k] ? "bg-accent text-white border-accent" : "bg-panel2 text-mut border-line"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-mut text-sm">Alcance</span>
          <div className="mt-1 flex gap-2 flex-wrap">
            {[
              { k: "general", label: "General" },
              { k: "area", label: "Por área" },
              { k: "base", label: "Por base" },
            ].map((a) => (
              <button
                key={a.k}
                onClick={() => { setAlcance(a.k); setAreaId(""); setBaseId(""); }}
                className={`tap px-4 py-2 rounded-xl border font-semibold text-sm ${
                  alcance === a.k ? "bg-ink text-base border-ink" : "bg-panel2 text-mut border-line"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {alcance === "area" && (
          <select
            value={areaId}
            onChange={(e) => setAreaId(e.target.value)}
            className="w-full bg-panel2 border border-line rounded-xl px-3 py-3 text-ink outline-none focus:border-accent"
          >
            <option value="">— Elige área —</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        )}

        {alcance === "base" && (
          <select
            value={baseId}
            onChange={(e) => setBaseId(e.target.value)}
            className="w-full bg-panel2 border border-line rounded-xl px-3 py-3 text-ink outline-none focus:border-accent"
          >
            <option value="">— Elige base —</option>
            {areas.map((a) => (
              <optgroup key={a.id} label={a.nombre}>
                {(a.bases || []).map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </optgroup>
            ))}
          </select>
        )}

        <button
          onClick={() => window.print()}
          disabled={!listo}
          className="tap w-full py-3 rounded-xl bg-accent text-white font-semibold disabled:opacity-50"
        >
          Imprimir o guardar PDF
        </button>
        <p className="text-mut text-xs -mt-1">
          Se abrirá la ventana de impresión. Elige “Guardar como PDF” como destino.
        </p>
      </div>

      {/* Hoja del informe (esto es lo que se imprime) */}
      {loading ? (
        <Spinner />
      ) : (
        <div className="px-4 mt-5">
          <div className="informe-hoja bg-white text-neutral-900 rounded-xl border border-neutral-300 p-6 mx-auto" style={{ maxWidth: 800 }}>
            <div className="flex items-baseline justify-between border-b border-neutral-300 pb-3">
              <span className="text-xs text-neutral-500">{alcanceTexto}</span>
              <span className="text-xs text-neutral-500">{fecha}</span>
            </div>

            {secc.trab && (
              <TablaTrab items={trabajadores} baseMap={baseMap} mostrarArea={alcance !== "base"} />
            )}
            {secc.veh && (
              <TablaVeh items={vehiculos} baseMap={baseMap} mostrarArea={alcance !== "base"} />
            )}
            {secc.inc && (
              <TablaInc items={incidencias} baseMap={baseMap} />
            )}

            {!secc.trab && !secc.veh && !secc.inc && (
              <p className="text-sm text-neutral-500 mt-6">Selecciona al menos una sección.</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

/* ---------- Tablas del informe ---------- */
function Seccion({ titulo, n, children }) {
  return (
    <section className="mt-6">
      <h2 className="text-base font-bold mb-2">{titulo} <span className="font-normal text-neutral-400">({n})</span></h2>
      {n === 0 ? <p className="text-sm text-neutral-400">Sin registros.</p> : children}
    </section>
  );
}

const th = "text-left text-[11px] uppercase tracking-wide text-neutral-500 font-semibold border-b border-neutral-300 py-1.5 pr-3";
const td = "text-sm py-1.5 pr-3 border-b border-neutral-200 align-top";

function TablaTrab({ items, baseMap, mostrarArea }) {
  return (
    <Seccion titulo="Trabajadores" n={items.length}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={th}>Nombre</th>
            <th className={th}>ID</th>
            <th className={th}>Puesto</th>
            <th className={th}>Contrato</th>
            <th className={th}>Baja</th>
            <th className={th}>Base</th>
            {mostrarArea && <th className={th}>Área</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((t) => {
            const info = baseMap[t.base?.id || t.base_id] || {};
            return (
              <tr key={t.id}>
                <td className={td}>{t.nombre}</td>
                <td className={td}>{t.id_personal || "—"}</td>
                <td className={td}>{[t.titulo, t.puesto_trabajo].filter(Boolean).join(" · ") || "—"}</td>
                <td className={td}>{t.tipo_contrato || "—"}</td>
                <td className={td}>{t.de_baja ? "Sí" : "No"}</td>
                <td className={td}>{t.base?.nombre || info.nombre || "—"}</td>
                {mostrarArea && <td className={td}>{info.areaNombre || "—"}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </Seccion>
  );
}

function TablaVeh({ items, baseMap, mostrarArea }) {
  return (
    <Seccion titulo="Vehículos" n={items.length}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={th}>Matrícula</th>
            <th className={th}>ID</th>
            <th className={th}>Modelo</th>
            <th className={th}>Clase</th>
            <th className={th}>Base</th>
            {mostrarArea && <th className={th}>Área</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((v) => {
            const info = baseMap[v.base?.id || v.base_id] || {};
            return (
              <tr key={v.id}>
                <td className={td}>{v.matricula || "—"}</td>
                <td className={td}>{v.id_personal || "—"}</td>
                <td className={td}>{v.modelo || "—"}</td>
                <td className={td}>{v.clase || "—"}</td>
                <td className={td}>{v.base?.nombre || info.nombre || "—"}</td>
                {mostrarArea && <td className={td}>{info.areaNombre || "—"}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </Seccion>
  );
}

function TablaInc({ items, baseMap }) {
  function origen(i) {
    if (i.trabajador) return `Trabajador: ${i.trabajador.nombre}`;
    if (i.vehiculo) return `Vehículo: ${i.vehiculo.matricula || "—"}`;
    if (i.base) return `Base: ${i.base.nombre}`;
    return "—";
  }
  return (
    <Seccion titulo="Incidencias" n={items.length}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={th}>Tipo</th>
            <th className={th}>Descripción</th>
            <th className={th}>Origen</th>
            <th className={th}>Fecha</th>
            <th className={th}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td className={td}>{i.tipo || "—"}</td>
              <td className={td} style={{ maxWidth: 260 }}>{i.descripcion}</td>
              <td className={td}>{origen(i)}</td>
              <td className={td}>{new Date(i.fecha).toLocaleDateString("es-ES")}</td>
              <td className={td}>{i.resuelta ? "Resuelta" : "Pendiente"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Seccion>
  );
}
