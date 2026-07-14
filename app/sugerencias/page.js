"use client";
import { useState, useEffect } from "react";
import {
  addSugerencia, getSugerencias, updateSugerencia, deleteSugerencia,
} from "../../lib/data";
import { useRealtime } from "../../lib/useRealtime";
import { esDispositivoAdmin, KEY_CODIGO } from "../../lib/acceso";
import { Header, Badge, Spinner } from "../../components/ui";

export default function SugerenciasPage() {
  const [admin, setAdmin] = useState(false);
  useEffect(() => setAdmin(esDispositivoAdmin()), []);

  return (
    <main className="pb-16">
      <Header titulo="Sugerencias" subtitulo="Ideas y reporte de fallos" back />
      <Enviar />
      {admin && <ListaAdmin />}
    </main>
  );
}

/* ---------- Formulario para enviar (lo ven todos) ---------- */
function Enviar() {
  const [tipo, setTipo] = useState("Sugerencia");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [enviado, setEnviado] = useState(false);

  async function enviar() {
    if (!texto.trim()) { setError("Escribe tu mensaje."); return; }
    setEnviando(true); setError(null);
    const disp = typeof window !== "undefined" ? localStorage.getItem(KEY_CODIGO) : null;
    const r = await addSugerencia(tipo, texto.trim(), disp);
    setEnviando(false);
    if (r?.error) { setError(r.error.message); return; }
    setTexto("");
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="px-4 mt-6">
        <div className="bg-panel border border-ok/40 rounded-2xl p-5 text-center">
          <div className="text-3xl mb-2">✅</div>
          <p className="font-bold">¡Enviado, gracias!</p>
          <p className="text-mut text-sm mt-1">Lo revisaremos.</p>
          <button
            onClick={() => setEnviado(false)}
            className="tap mt-4 text-sm font-semibold px-4 py-2 rounded-xl bg-panel2 border border-line"
          >
            Enviar otra
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 mt-6">
      <span className="text-mut text-sm">¿Qué quieres enviar?</span>
      <div className="mt-1 flex gap-2">
        {["Sugerencia", "Fallo"].map((op) => (
          <button
            key={op}
            onClick={() => setTipo(op)}
            className={`tap flex-1 py-3 rounded-xl border font-semibold ${
              tipo === op ? "bg-accent text-white border-accent" : "bg-panel2 text-mut border-line"
            }`}
          >
            {op === "Fallo" ? "Reportar fallo" : "Sugerencia"}
          </button>
        ))}
      </div>

      <label className="block mt-4">
        <span className="text-mut text-sm">
          {tipo === "Fallo" ? "Cuéntanos qué ha fallado y cuándo" : "Cuéntanos tu idea"}
        </span>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={5}
          placeholder="Escribe aquí…"
          className="mt-1 w-full bg-panel2 border border-line rounded-xl px-3 py-3 text-ink outline-none focus:border-accent resize-none"
        />
      </label>

      {error && <p className="text-accent text-sm mt-2">{error}</p>}

      <button
        onClick={enviar}
        disabled={enviando}
        className="tap w-full mt-4 py-3 rounded-xl bg-accent text-white font-semibold disabled:opacity-50"
      >
        {enviando ? "Enviando…" : "Enviar"}
      </button>
    </div>
  );
}

/* ---------- Lista para el admin ---------- */
function ListaAdmin() {
  const { data, loading, reload } = useRealtime(() => getSugerencias(), ["sugerencias"], []);
  const [filtro, setFiltro] = useState("pendientes"); // pendientes | todas

  const todas = data || [];
  const items = filtro === "pendientes" ? todas.filter((s) => !s.atendida) : todas;
  const nPend = todas.filter((s) => !s.atendida).length;

  async function toggle(s) {
    await updateSugerencia(s.id, { atendida: !s.atendida });
    reload();
  }
  async function borrar(s) {
    await deleteSugerencia(s.id);
    reload();
  }

  return (
    <section className="px-4 mt-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="title text-xl font-bold">Recibidas</h2>
        <span className="text-mut text-sm">{nPend} sin atender</span>
      </div>

      <div className="flex gap-2 mb-3">
        {[
          { k: "pendientes", label: "Sin atender" },
          { k: "todas", label: "Todas" },
        ].map((f) => (
          <button
            key={f.k}
            onClick={() => setFiltro(f.k)}
            className={`tap px-4 py-2 rounded-full text-sm font-semibold border ${
              filtro === f.k ? "bg-accent text-white border-accent" : "bg-panel text-mut border-line"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid gap-2">
          {items.map((s) => (
            <div
              key={s.id}
              className={`border rounded-xl p-4 ${
                s.atendida ? "bg-panel border-line opacity-70" : "bg-panel border-accent/40"
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {s.tipo === "Fallo" ? <Badge tone="accent">Fallo</Badge> : <Badge>Sugerencia</Badge>}
                {s.atendida && <Badge tone="ok">Atendida</Badge>}
              </div>
              <p className={s.atendida ? "text-mut" : "text-ink"}>{s.texto}</p>
              <p className="text-mut text-xs mt-2">
                {new Date(s.creado_en).toLocaleString("es-ES")}
                {s.dispositivo && ` · ${s.dispositivo}`}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => toggle(s)}
                  className={`tap text-xs font-bold px-3 py-1.5 rounded-full border ${
                    s.atendida ? "bg-panel2 text-mut border-line" : "bg-ok/15 text-ok border-ok/40"
                  }`}
                >
                  {s.atendida ? "Marcar pendiente" : "Marcar atendida"}
                </button>
                <button
                  onClick={() => borrar(s)}
                  className="tap text-xs font-bold px-3 py-1.5 rounded-full border border-accent/40 text-accent"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          {!items.length && (
            <p className="text-mut text-center py-8">
              {filtro === "pendientes" ? "Nada sin atender." : "No hay nada todavía."}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
