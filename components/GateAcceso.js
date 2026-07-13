"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { KEY_CODIGO, KEY_ADMIN } from "../lib/acceso";

// Devuelve la fila del dispositivo si el código está en la whitelist y activo, o null
async function validar(cod) {
  const { data, error } = await supabase
    .from("dispositivos")
    .select("id, es_admin")
    .eq("codigo", cod)
    .eq("activo", true)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

function guardar(cod, row) {
  localStorage.setItem(KEY_CODIGO, cod);
  localStorage.setItem(KEY_ADMIN, row.es_admin ? "1" : "0");
}

export default function GateAcceso({ children }) {
  const [estado, setEstado] = useState("check"); // check | ok | bloq
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState(null);
  const [verificando, setVerificando] = useState(false);

  useEffect(() => {
    const g = typeof window !== "undefined" ? localStorage.getItem(KEY_CODIGO) : null;
    if (!g) { setEstado("bloq"); return; }
    validar(g).then((row) => {
      if (row) { guardar(g, row); setEstado("ok"); }
      else {
        localStorage.removeItem(KEY_CODIGO);
        localStorage.removeItem(KEY_ADMIN);
        setEstado("bloq");
      }
    });
  }, []);

  async function entrar() {
    const cod = codigo.trim();
    if (!cod) { setError("Escribe tu código."); return; }
    setVerificando(true); setError(null);
    const row = await validar(cod);
    setVerificando(false);
    if (row) { guardar(cod, row); setEstado("ok"); }
    else setError("Código no válido o desactivado.");
  }

  if (estado === "ok") return children;

  if (estado === "check") {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="w-8 h-8 rounded-full border-2 border-line border-t-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-sm text-center">
        <p className="text-accent text-xs font-bold tracking-widest uppercase mb-1">Acceso restringido</p>
        <h1 className="title text-3xl font-extrabold mb-2">Espartanos</h1>
        <p className="text-mut text-sm mb-6">Introduce el código de tu dispositivo para entrar.</p>
        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && entrar()}
          placeholder="Código"
          autoCapitalize="characters"
          className="w-full bg-panel border border-line rounded-xl px-4 py-3 text-ink text-center outline-none focus:border-accent"
        />
        {error && <p className="text-accent text-sm mt-3">{error}</p>}
        <button
          onClick={entrar}
          disabled={verificando}
          className="tap w-full mt-4 py-3 rounded-xl bg-accent text-white font-semibold disabled:opacity-50"
        >
          {verificando ? "Comprobando…" : "Entrar"}
        </button>
      </div>
    </div>
  );
}
