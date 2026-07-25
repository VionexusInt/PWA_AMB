// Claves guardadas en el navegador del dispositivo
export const KEY_CODIGO = "disp_codigo";
export const KEY_ADMIN = "disp_admin";
export const KEY_ROL_ID = "disp_rol_id";
export const KEY_PERMISOS = "disp_permisos";

import { supabase } from "./supabase";

// ¿Este dispositivo entró con un código de admin?
export function esDispositivoAdmin() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY_ADMIN) === "1";
}

// Guardar datos del dispositivo al hacer login
export function guardarDispositivo(codigo, es_admin, rol_id = null) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_CODIGO, codigo);
  localStorage.setItem(KEY_ADMIN, es_admin ? "1" : "0");
  localStorage.setItem(KEY_ROL_ID, rol_id || "");
}

// Obtener los permisos del dispositivo actual
export async function getPermisosDispositivo() {
  if (typeof window === "undefined") return [];
  
  const codigo = localStorage.getItem(KEY_CODIGO);
  if (!codigo) return [];
  
  // Si es admin, tiene todos los permisos
  const esAdmin = localStorage.getItem(KEY_ADMIN) === "1";
  if (esAdmin) {
    return ["buscador", "areas", "comite_seguridad", "comite_empresa", "sugerencias", "admin"];
  }
  
  // Si no es admin, consultar el rol del dispositivo
  try {
    const { data: dispositivo } = await supabase
      .from("dispositivos")
      .select("rol_id, roles(permisos)")
      .eq("codigo", codigo)
      .single();
    
    if (!dispositivo?.rol_id) return [];
    if (!dispositivo?.roles?.permisos) return [];
    
    return dispositivo.roles.permisos;
  } catch (error) {
    console.error("Error obteniendo permisos:", error);
    return [];
  }
}