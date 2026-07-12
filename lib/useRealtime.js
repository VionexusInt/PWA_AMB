"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";

/**
 * Ejecuta `queryFn` (que debe devolver { data, error }) y la vuelve a ejecutar
 * automáticamente cada vez que cambia cualquiera de las `tables` indicadas.
 * Así toda la app funciona en tiempo real sin recargar.
 *
 * @param {() => Promise<{data:any, error:any}>} queryFn
 * @param {string[]} tables  tablas a vigilar, p.ej. ["bases","incidencias"]
 * @param {any[]} deps       dependencias que fuerzan recarga (ids de ruta, etc.)
 */
export function useRealtime(queryFn, tables, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const { data, error } = await queryFn();
    if (error) setError(error);
    setData(data);
    setLoading(false);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
    const channel = supabase.channel("rt-" + tables.join("-"));
    tables.forEach((t) =>
      channel.on("postgres_changes", { event: "*", schema: "public", table: t }, load)
    );
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, reload: load };
}
