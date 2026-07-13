"use client";
import { useState } from "react";
import Link from "next/link";
import { getTodosTrabajadores } from "../../lib/data";
import { useRealtime } from "../../lib/useRealtime";
import { Header, Badge, Spinner } from "../../components/ui";

export default function TrabajadoresPage() {
  const { data, loading } = useRealtime(
    () => getTodosTrabajadores(),
    ["trabajadores", "bases"],
    []
  );
  const [q, setQ] = useState("");
  const s = q.trim().toLowerCase();
  const items = (data || []).filter((t) => (t.nombre || "").toLowerCase().includes(s));

  return (
    <main className="pb-10">
      <Header titulo="Trabajadores" subtitulo={data ? `${data.length} en total` : ""} back />

      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 bg-panel border border-line rounded-2xl px-4 py-3">
          <span className="text-mut">🔎</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            inputMode="search"
            placeholder="Buscar por nombre…"
            className="bg-transparent outline-none w-full text-ink placeholder:text-mut"
          />
          {q && <button onClick={() => setQ("")} className="text-mut text-lg tap" aria-label="Limpiar">×</button>}
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="px-4 mt-4 grid gap-2">
          {items.map((t) => (
            <Link
              key={t.id}
              href={`/trabajador/${t.id}`}
              className="tap block bg-panel border border-line rounded-xl p-4 active:scale-[.98] transition-transform"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold">{t.nombre}</h3>
                {t.id_personal && <Badge>ID {t.id_personal}</Badge>}
                {t.de_baja && <Badge tone="accent">De baja</Badge>}
                {t.tipo_contrato && <Badge>{t.tipo_contrato}</Badge>}
              </div>
              <p className="text-mut text-sm mt-0.5">
                {[t.titulo, t.puesto_trabajo, t.base?.nombre].filter(Boolean).join(" · ") || "Sin datos"}
              </p>
            </Link>
          ))}
          {!items.length && <p className="text-mut text-center py-10">Sin resultados.</p>}
        </div>
      )}
    </main>
  );
}
