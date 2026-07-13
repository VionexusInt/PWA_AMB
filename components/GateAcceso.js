"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const KEY = "disp_codigo";

// Comprueba si un código está en la whitelist y activo
async function validar(cod) {
  const { data, error } = await supabase
    .from("dispositivos")
    .select("id")
    .eq("codigo", cod)
    .eq("activo", true)
    .maybeSingle();
  return !error && !!data;
}

export default function GateAcceso({ children }) {
  const [estado, setEstado] = useState("check"); // check | ok | bloq
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState(null);
  const [verificando, setVerificando] = useState(false);

  useEffect(() => {
    const guardado = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (!guardado) { setEstado("bloq"); return; }
    validar(guardado).then((ok) => {
      if (ok) setEstado("ok");
      else { localStorage.removeItem(KEY); setEstado("bloq"); }
    });
  }, []);

  async function entrar() {
    const cod = codigo.trim();
    if (!cod) { setError("Escribe tu código."); return; }
    setVerificando(true); setError(null);
    const ok = await validar(cod);
    setVerificando(false);
    if (ok) {
      localStorage.setItem(KEY, cod);
      setEstado("ok");
    } else {
      setError("Código no válido o desactivado.");
    }
  }

  if (estado === "ok") return children;

  if (estado === "check") {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="w-8 h-8 rounded-full border-2 border-line border-t-accent animate-spin" />
      </div>
    );
  }

  // Pantalla de bloqueo / entrada de código
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