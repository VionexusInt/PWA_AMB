"use client";
import { useState } from "react";
import Link from "next/link";
import { getBase, resolverIncidencia } from "../../../lib/data";
import { useRealtime } from "../../../lib/useRealtime";
import { Header, Badge, Spinner } from "../../../components/ui";
import FormEntidad from "../../../components/FormEntidad";

const TABS = [
  { key: "trab", label: "Trabajadores" },
  { key: "veh", label: "Coches" },
  { key: "inc", label: "Incidencias" },
];

export default function BasePage({ params }) {
  const { id } = params;
  const { data, loading, reload } = useRealtime(
    () => getBase(id),
    ["trabajadores", "vehiculos", "incidencias"],
    [id]
  );
  const [tab, setTab] = useState("trab");
  const [form, setForm] = useState(null); // null | {modo, tipo, registro?}

  const pendientes = (data?.incidencias || []).filter((i) => !i.resuelta).length;
  const abrirAdd = () => setForm({ modo: "add", tipo: tab });
  const abrirEdit = (tipo, registro) => setForm({ modo: "edit", tipo, registro });

  return (
    <main className="pb-24">
      <Header titulo={data?.base?.nombre || "Base"} subtitulo={data?.base?.tipo} back />

      {/* Pestañas */}
      <div className="sticky top-[64px] z-10 bg-base/95 backdrop-blur border-b border-line">
        <div className="flex gap-1 px-3 py-2 overflow-x-auto noscroll">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`tap px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border ${
                tab === t.key ? "bg-accent text-white border-accent" : "bg-panel text-mut border-line"
              }`}
            >
              {t.label}
              {t.key === "inc" && pendientes > 0 && <span className="ml-1 text-xs">({pendientes})</span>}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="px-4 mt-4">
          {tab === "trab" && <ListaTrabajadores items={data.trabajadores} onEdit={(r) => abrirEdit("trab", r)} />}
          {tab === "veh" && <ListaVehiculos items={data.vehiculos} onEdit={(r) => abrirEdit("veh", r)} />}
          {tab === "inc" && (
            <ListaIncidencias items={data.incidencias} onEdit={(r) => abrirEdit("inc", r)} onToggle={reload} />
          )}
        </div>
      )}

      {/* Botón flotante Añadir */}
      {!loading && (
        <button
          onClick={abrirAdd}
          className="tap fixed bottom-[calc(env(safe-area-inset-bottom)+18px)] right-5 w-14 h-14 rounded-full bg-accent text-white text-3xl grid place-items-center shadow-lg shadow-accent/30 active:scale-95"
          aria-label="Añadir"
        >
          +
        </button>
      )}

      {form && (
        <FormEntidad
          tipo={form.tipo}
          modo={form.modo}
          parentId={id}
          registro={form.registro}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); reload(); }}
        />
      )}
    </main>
  );
}

/* ---------- Listas ---------- */

function Vacio({ children }) {
  return <p className="text-mut text-center py-14">{children}</p>;
}

// Botón lápiz (para editar rápido sin entrar en la ficha)
function BotonEditar({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Editar"
      className="tap shrink-0 w-9 h-9 rounded-full grid place-items-center bg-panel2 border border-line text-mut active:scale-95"
    >
      ✎
    </button>
  );
}

function ListaTrabajadores({ items, onEdit }) {
  if (!items.length) return <Vacio>No hay trabajadores. Pulsa + para añadir.</Vacio>;
  return (
    <div className="grid gap-2">
      {items.map((t) => (
        <div key={t.id} className="relative">
          <Link
            href={`/trabajador/${t.id}`}
            className="tap block bg-panel border border-line rounded-xl p-4 pr-14 active:scale-[.98] transition-transform"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold">{t.nombre}</h3>
              {t.id_personal && <Badge>ID {t.id_personal}</Badge>}
              {t.de_baja && <Badge tone="accent">De baja</Badge>}
              {t.tipo_contrato && <Badge>{t.tipo_contrato}</Badge>}
            </div>
            <p className="text-mut text-sm mt-0.5">
              {[t.titulo, t.puesto_trabajo].filter(Boolean).join(" · ") || "Sin datos"}
            </p>
          </Link>
          <div className="absolute top-1/2 -translate-y-1/2 right-3">
            <BotonEditar onClick={() => onEdit(t)} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ListaVehiculos({ items, onEdit }) {
  if (!items.length) return <Vacio>No hay vehículos. Pulsa + para añadir.</Vacio>;
  return (
    <div className="grid gap-2">
      {items.map((v) => (
        <div key={v.id} className="relative">
          <Link
            href={`/vehiculo/${v.id}`}
            className="tap block bg-panel border border-line rounded-xl p-4 pr-14 active:scale-[.98] transition-transform"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold title text-lg tracking-wide">{v.matricula || "Sin matrícula"}</h3>
              {v.id_personal && <Badge>ID {v.id_personal}</Badge>}
              {v.clase && <Badge>{v.clase}</Badge>}
            </div>
            <p className="text-mut text-sm mt-0.5">{v.modelo || "Sin modelo"}</p>
          </Link>
          <div className="absolute top-1/2 -translate-y-1/2 right-3">
            <BotonEditar onClick={() => onEdit(v)} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ListaIncidencias({ items, onEdit, onToggle }) {
  if (!items.length) return <Vacio>Sin incidencias registradas.</Vacio>;
  async function toggle(i) {
    await resolverIncidencia(i.id, !i.resuelta);
    onToggle?.();
  }
  return (
    <div className="grid gap-2">
      {items.map((i) => (
        <div
          key={i.id}
          className={`border rounded-xl p-4 ${
            i.resuelta ? "bg-panel border-line opacity-70" : "bg-panel border-accent/40"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className={i.resuelta ? "line-through text-mut" : "text-ink"}>{i.descripcion}</p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggle(i)}
                className={`tap text-xs font-bold px-3 py-1.5 rounded-full border ${
                  i.resuelta ? "bg-panel2 text-mut border-line" : "bg-ok/15 text-ok border-ok/40"
                }`}
              >
                {i.resuelta ? "Reabrir" : "Resolver"}
              </button>
              <BotonEditar onClick={() => onEdit(i)} />
            </div>
          </div>
          <p className="text-mut text-xs mt-2">
            {new Date(i.fecha).toLocaleString("es-ES")}
            {i.resuelta && i.fecha_resolucion &&
              ` · resuelta ${new Date(i.fecha_resolucion).toLocaleDateString("es-ES")}`}
          </p>
        </div>
      ))}
    </div>
  );
}
