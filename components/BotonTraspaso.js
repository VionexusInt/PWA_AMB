"use client";
import { useState } from "react";
import { traspasarDocumento, tablaDestinoTraspaso } from "../lib/data";

// Secciones que tienen equivalente en el otro comité
const SECCIONES_TRASPASABLES = [
  "reglamentos", "reglamentos_empresa",
  "actas", "actas_empresa",
  "denuncias", "denuncias_empresa",
  "sentencias", "sentencias_empresa",
  "informes_delegados", "informes_delegados_empresa",
];

function nombreDestino(tabla) {
  const esEmpresa = tabla.endsWith("_empresa");
  const seccion = tabla.replace(/_empresa$/, "")
    .split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  return esEmpresa
    ? `Comité de Seguridad · ${seccion}`
    : `Comité de Empresa · ${seccion}`;
}

export default function BotonTraspaso({ tabla, registroId, onTraspasado }) {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  if (!SECCIONES_TRASPASABLES.includes(tabla)) return null;

  async function confirmar() {
    setCargando(true); setError(null);
    try {
      await traspasarDocumento(tabla, registroId);
      setAbierto(false);
      onTraspasado?.();
    } catch (e) {
      setError(e.message || "Error al traspasar.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        title="Traspasar al otro comité"
        className="text-blue-500 hover:text-blue-400 p-2"
      >
        ⇄
      </button>

      {abierto && (
        <div className="fixed inset-0 z-40 flex items-end" onClick={() => setAbierto(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative w-full bg-panel border-t border-line rounded-t-3xl p-5 pb-[calc(env(safe-area-inset-bottom)+20px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-line rounded-full mx-auto mb-4" />
            <h2 className="title text-xl font-bold mb-2">Traspasar documento</h2>
            <p className="text-mut text-sm mb-4">
              Se moverá a <span className="text-ink font-semibold">{nombreDestino(tabla)}</span> con todos sus archivos adjuntos. El original se eliminará.
            </p>

            {error && <p className="text-accent text-sm mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setAbierto(false)}
                className="tap flex-1 py-3 rounded-xl bg-panel2 border border-line font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={confirmar}
                disabled={cargando}
                className="tap flex-1 py-3 rounded-xl bg-accent text-white font-semibold disabled:opacity-50"
              >
                {cargando ? "Moviendo…" : "Confirmar traspaso"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
