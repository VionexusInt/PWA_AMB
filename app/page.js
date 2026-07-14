"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getInicio } from "../lib/data";
import { useRealtime } from "../lib/useRealtime";
import { supabase } from "../lib/supabase";
import { esDispositivoAdmin } from "../lib/acceso";
import { Badge, Spinner } from "../components/ui";
import FormEntidad from "../components/FormEntidad";

export default function Inicio() {
  const { data: areas, loading, reload } = useRealtime(
    getInicio,
    ["areas", "bases", "incidencias", "trabajadores", "vehiculos"],
    []
  );

  const [q, setQ] = useState("");
  const [res, setRes] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [form, setForm] = useState(null); // null | {modo, registro?}
  const [admin, setAdmin] = useState(false);
  useEffect(() => setAdmin(esDispositivoAdmin()), []);
  const totalPendientes = (areas || []).reduce((s, a) => s + (a.pendientes || 0), 0);

  async function buscar(texto) {
    setQ(texto);
    if (texto.trim().length < 2) { setRes(null); return; }
    setBuscando(true);
    const like = `%${texto.trim()}%`;
    const [b, t, v] = await Promise.all([
      supabase.from("bases").select("id, nombre, tipo").ilike("nombre", like).limit(8),
      supabase.from("trabajadores").select("id, nombre, base_id").ilike("nombre", like).limit(8),
      supabase.from("vehiculos").select("id, matricula, base_id").ilike("matricula", like).limit(8),
    ]);
    setRes({ bases: b.data || [], trabajadores: t.data || [], vehiculos: v.data || [] });
    setBuscando(false);
  }

  return (
    <main className="pb-24">
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+20px)] pb-2">
        <p className="text-accent text-xs font-bold tracking-widest uppercase">Consola operativa</p>
        <h1 className="title text-4xl font-extrabold leading-none mt-1">Espartanos</h1>
      </div>

      {/* Buscador global */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 bg-panel border border-line rounded-2xl px-4 py-3">
          <span className="text-mut">🔎</span>
          <input
            value={q}
            onChange={(e) => buscar(e.target.value)}
            inputMode="search"
            placeholder="Buscar base, trabajador o matrícula…"
            className="bg-transparent outline-none w-full text-ink placeholder:text-mut"
          />
          {q && (
            <button onClick={() => buscar("")} className="text-mut text-lg tap" aria-label="Limpiar">×</button>
          )}
        </div>
      </div>

      {/* Resultados de búsqueda */}
      {res && (
        <div className="px-4 mt-3 space-y-2">
          {buscando && <p className="text-mut text-sm">Buscando…</p>}
          {res.bases.map((b) => (
            <Link key={"b" + b.id} href={`/base/${b.id}`} className="tap block bg-panel2 border border-line rounded-xl px-4 py-3">
              <span className="text-mut text-xs">Base</span>
              <p className="font-semibold">{b.nombre} <span className="text-mut font-normal">· {b.tipo}</span></p>
            </Link>
          ))}
          {res.trabajadores.map((t) => (
            <Link key={"t" + t.id} href={`/base/${t.base_id}`} className="tap block bg-panel2 border border-line rounded-xl px-4 py-3">
              <span className="text-mut text-xs">Trabajador</span>
              <p className="font-semibold">{t.nombre}</p>
            </Link>
          ))}
          {res.vehiculos.map((v) => (
            <Link key={"v" + v.id} href={`/base/${v.base_id}`} className="tap block bg-panel2 border border-line rounded-xl px-4 py-3">
              <span className="text-mut text-xs">Vehículo</span>
              <p className="font-semibold">{v.matricula}</p>
            </Link>
          ))}
          {!buscando &&
            !res.bases.length && !res.trabajadores.length && !res.vehiculos.length && (
              <p className="text-mut text-sm py-4 text-center">Sin resultados para “{q}”.</p>
            )}
        </div>
      )}

      {/* Accesos a listas globales + Áreas */}
      {!res && (
        <div className="px-4 mt-6">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Link
              href="/trabajadores"
              className="tap bg-panel border border-line rounded-2xl p-4 active:scale-[.98] transition-transform"
            >
              <div className="text-2xl mb-1">👤</div>
              <h2 className="font-bold leading-tight">Trabajadores</h2>
              <p className="text-mut text-xs mt-0.5">Ver todos</p>
            </Link>
            <Link
              href="/vehiculos"
              className="tap bg-panel border border-line rounded-2xl p-4 active:scale-[.98] transition-transform"
            >
              <div className="text-2xl mb-1">🚑</div>
              <h2 className="font-bold leading-tight">Vehículos</h2>
              <p className="text-mut text-xs mt-0.5">Ver todos</p>
            </Link>
          </div>

          <Link
            href="/incidencias"
            className="tap flex items-center justify-between bg-panel border border-line rounded-2xl p-4 mb-6 active:scale-[.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <h2 className="font-bold leading-tight">Incidencias</h2>
                <p className="text-mut text-xs mt-0.5">Ver todas</p>
              </div>
            </div>
            {totalPendientes > 0 && <Badge tone="accent">{totalPendientes} sin resolver</Badge>}
          </Link>

          <p className="text-mut text-xs font-bold uppercase tracking-wider mb-3">Áreas</p>
          {loading ? (
            <Spinner />
          ) : (
            <div className="grid gap-3">
              {(areas || []).map((a) => (
                <div key={a.id} className="relative">
                  <Link
                    href={`/area/${a.id}`}
                    className="tap block bg-panel border border-line rounded-2xl p-4 pr-14 active:scale-[.98] transition-transform"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="title text-2xl font-bold">{a.nombre}</h2>
                        <p className="text-mut text-sm mt-0.5">{a.n_bases} bases</p>
                      </div>
                      {a.pendientes > 0 ? (
                        <Badge tone="accent">{a.pendientes} incidencias</Badge>
                      ) : (
                        <Badge tone="ok">Sin incidencias</Badge>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={() => setForm({ modo: "edit", registro: a })}
                    aria-label="Editar área"
                    className="tap absolute top-3 right-3 w-9 h-9 rounded-full grid place-items-center bg-panel2 border border-line text-mut active:scale-95"
                  >
                    ✎
                  </button>
                </div>
              ))}
              {!(areas || []).length && (
                <p className="text-mut text-center py-6">No hay áreas. Pulsa + para añadir.</p>
              )}
            </div>
          )}

          <Link
            href="/sugerencias"
            className="tap flex items-center gap-3 mt-6 bg-panel border border-line rounded-2xl p-4 active:scale-[.98] transition-transform"
          >
            <div className="text-2xl">💬</div>
            <div>
              <h2 className="font-bold leading-tight">Sugerencias</h2>
              <p className="text-mut text-xs mt-0.5">Enviar idea o reportar un fallo</p>
            </div>
          </Link>

          {admin && (
            <Link
              href="/admin"
              className="tap flex items-center gap-3 mt-3 bg-panel border border-line rounded-2xl p-4 active:scale-[.98] transition-transform"
            >
              <div className="text-2xl">⚙️</div>
              <div>
                <h2 className="font-bold leading-tight">Dispositivos</h2>
                <p className="text-mut text-xs mt-0.5">Gestionar códigos de acceso</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Botón flotante: añadir área */}
      {!loading && !res && (
        <button
          onClick={() => setForm({ modo: "add" })}
          className="tap fixed bottom-[calc(env(safe-area-inset-bottom)+18px)] right-5 w-14 h-14 rounded-full bg-accent text-white text-3xl grid place-items-center shadow-lg shadow-accent/30 active:scale-95"
          aria-label="Añadir área"
        >
          +
        </button>
      )}

      {form && (
        <FormEntidad
          tipo="area"
          modo={form.modo}
          registro={form.registro}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); reload(); }}
        />
      )}
    </main>
  );
}
