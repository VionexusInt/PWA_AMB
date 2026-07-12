"use client";
import { createBrowserClient } from "@supabase/ssr";

// Cliente único de Supabase para todo el lado cliente.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
