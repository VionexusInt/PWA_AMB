// Las fuentes estándar de pdf-lib (Helvetica) solo saben escribir caracteres "WinAnsi"
// (latín básico + tildes, ñ, €, comillas…). Cualquier otro carácter (emojis, acentos
// sueltos como " ́", letras de otros alfabetos…) hace que pdf-lib lance un error y el
// PDF no se genere. Esta función deja el texto solo con caracteres que se pueden pintar.

const EXTRA_CP1252 = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";

function esPintable(ch) {
  const c = ch.codePointAt(0);
  return (c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) || EXTRA_CP1252.includes(ch);
}

export function limpiarTextoPdf(s) {
  const t = String(s ?? "").normalize("NFC").replace(/[\r\n\t]+/g, " ");
  let out = "";
  for (const ch of t) {
    if (esPintable(ch)) { out += ch; continue; }
    // Intentar quedarse con la letra base (p.ej. "ș" -> "s"); si no, se descarta
    const base = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (base && [...base].every(esPintable)) out += base;
  }
  return out;
}
