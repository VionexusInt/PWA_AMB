"use client";
import { useState } from "react";
import Link from "next/link";
import { getTodosVehiculos } from "../../lib/data";
import { useRealtime } from "../../lib/useRealtime";
import { Header, Badge, Spinner } from "../../components/ui";

export default function VehiculosPage() {
  const { data, loading } = useRealtime(
    () => getTodosVehiculos(),
    ["vehiculos", "bases"],
    []
  );
  const [q, setQ] = useState("");
  const s = q.trim().toLowerCase();
  const items = (data || []).filter(
    (v) => (v.matricula || "").toLowerCase().includes(s) || (v.id_personal || "").toLowerCase().includes(s)
  );

  return (
    <main className="pb-10">
      <Header titulo="Vehículos" subtitulo={data ? `${data.length} en total` : ""} back />

      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 bg-panel border border-line rounded-2xl px-4 py-3">
          <span className="text-mut">🔎</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            inputMode="search"
            placeholder="Buscar por matrícula o ID…"
            className="bg-transparent outline-none w-full text-ink placeholder:text-mut"
          />
          {q && <button onClick={() => setQ("")} className="text-mut text-lg tap" aria-label="Limpiar">×</button>}
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="px-4 mt-4 grid gap-2">
          {items.map((v) => (
            <Link
              key={v.id}
              href={`/vehiculo/${v.id}`}
              className="tap block bg-panel border border-line rounded-xl p-4 active:scale-[.98] transition-transform"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold title text-lg tracking-wide">{v.matricula || "Sin matrícula"}</h3>
                {v.id_personal && <Badge>ID {v.id_personal}</Badge>}
                {v.clase && <Badge>{v.clase}</Badge>}
              </div>
              <p className="text-mut text-sm mt-0.5">
                {[v.modelo, v.base?.nombre].filter(Boolean).join(" · ") || "Sin datos"}
              </p>
            </Link>
          ))}
          {!items.length && <p className="text-mut text-center py-10">Sin resultados.</p>}
        </div>
      )}
    </main>
  );
}
