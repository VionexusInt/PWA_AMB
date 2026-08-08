"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getTrabajadoresBolsa, readmitirTrabajador, getAreasConBases } from "../../lib/data";
import { Header, Badge, Spinner } from "../../components/ui";

export default function BolsaPage() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readmitiendo, setReadmitiendo] = useState(null); // id del trabajador
  const [areas, setAreas] = useState([]);
  const [areaId, setAreaId] = useState("");
  const [baseId, setBaseId] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargar();
    getAreasConBases().then(({ data }) => setAreas(data || []));
  }, []);

  async function cargar() {
    setLoading(true);
    const data = await getTrabajadoresBolsa();
    setTrabajadores(data);
    setLoading(false);
  }

  const basesDeArea = areas.find((a) => a.id === areaId)?.bases || [];

  async function confirmarReadmision() {
    if (!baseId) return;
    setGuardando(true);
    await readmitirTrabajador(readmitiendo, baseId);
    setReadmitiendo(null);
    setAreaId("");
    setBaseId("");
    setGuardando(false);
    cargar();
  }

  return (
    <main className="pb-24">
      <Header titulo="Bolsa de trabajadores" subtitulo={`${trabajadores.length} en bolsa`} back />

      {loading ? (
        <Spinner />
      ) : (
        <div className="px-4 mt-4 grid gap-3">
          {trabajadores.map((t) => (
            <div key={t.id} className="bg-panel border border-line rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/trabajador/${t.id}`} className="font-bold text-lg hover:underline">
                    {t.nombre}
                  </Link>
                  <p className="text-mut text-sm mt-0.5">
                    {[t.titulo, t.puesto_trabajo].filter(Boolean).join(" · ") || "Sin datos adicionales"}
                  </p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {t.id_personal && <Badge>ID {t.id_personal}</Badge>}
                    {t.tipo_contrato && <Badge>{t.tipo_contrato}</Badge>}
                    {t.incidencias?.length > 0 && (
                      <Badge tone="accent">⚠️ {t.incidencias.length} incidencias</Badge>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => { setReadmitiendo(t.id); setAreaId(""); setBaseId(""); }}
                  className="tap shrink-0 text-sm font-semibold px-3 py-2 rounded-xl bg-ok/10 border border-ok/30 text-ok active:scale-95"
                >
                  Readmitir
                </button>
              </div>

              {/* Panel de readmisión inline */}
              {readmitiendo === t.id && (
                <div className="mt-4 pt-4 border-t border-line">
                  <p className="text-sm font-semibold mb-3">¿A qué base lo mandamos?</p>
                  <select
                    value={areaId}
                    onChange={(e) => { setAreaId(e.target.value); setBaseId(""); }}
                    className="w-full bg-panel2 border border-line rounded-xl px-3 py-3 text-ink outline-none focus:border-accent mb-2"
                  >
                    <option value="">— Elige área —</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>

                  {areaId && (
                    <select
                      value={baseId}
                      onChange={(e) => setBaseId(e.target.value)}
                      className="w-full bg-panel2 border border-line rounded-xl px-3 py-3 text-ink outline-none focus:border-accent mb-3"
                    >
                      <option value="">— Elige base —</option>
                      {basesDeArea.map((b) => (
                        <option key={b.id} value={b.id}>{b.nombre}</option>
                      ))}
                    </select>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setReadmitiendo(null)}
                      className="tap flex-1 py-2.5 rounded-xl bg-panel2 border border-line text-sm font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmarReadmision}
                      disabled={!baseId || guardando}
                      className="tap flex-1 py-2.5 rounded-xl bg-ok text-white text-sm font-semibold disabled:opacity-50"
                    >
                      {guardando ? "Readmitiendo…" : "Confirmar readmisión"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {!trabajadores.length && (
            <p className="text-mut text-center py-14">
              La bolsa está vacía. Los trabajadores que mandes a la bolsa aparecerán aquí.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
