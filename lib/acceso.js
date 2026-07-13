// Claves guardadas en el navegador del dispositivo
export const KEY_CODIGO = "disp_codigo";
export const KEY_ADMIN = "disp_admin";

// ¿Este dispositivo entró con un código de admin?
export function esDispositivoAdmin() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY_ADMIN) === "1";
}
