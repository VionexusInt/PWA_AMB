"use client";

export function esImagenArchivo(tipo, ref = "") {
  return (tipo || "").startsWith("image/") || /\.(png|jpe?g|gif|webp|heic|bmp)(\?|$)/i.test(ref);
}
export function esPdfArchivo(tipo, ref = "") {
  return (tipo || "").includes("pdf") || /\.pdf(\?|$)/i.test(ref);
}

/**
 * Ventana de vista previa dentro de la app.
 * @param url     URL pública del archivo
 * @param nombre  nombre a mostrar (opcional)
 * @param tipo    mime (opcional)
 * @param onClose cerrar
 */
export default function VisorArchivo({ url, nombre, tipo, onClose }) {
  const ref = nombre || url || "";
  const img = esImagenArchivo(tipo, ref);
  const pdf = esPdfArchivo(tipo, ref);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      {/* Barra superior */}
      <div
        className="flex items-center justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white/90 text-sm truncate">{nombre || "Archivo"}</span>
        <div className="flex gap-2 shrink-0">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-white text-sm font-semibold px-3 py-1.5 rounded-lg bg-white/10 active:scale-95"
          >
            Abrir
          </a>
          <button
            onClick={onClose}
            className="text-white text-sm font-semibold px-3 py-1.5 rounded-lg bg-white/10 active:scale-95"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
        {img ? (
          <img src={url} alt={nombre || ""} className="max-w-full max-h-full object-contain rounded" />
        ) : pdf ? (
          <iframe src={url} title={nombre || "PDF"} className="w-full h-full bg-white rounded" />
        ) : (
          <div className="text-white/80 text-center px-8">
            <p>No se puede previsualizar este tipo de archivo.</p>
            <a href={url} target="_blank" rel="noreferrer" className="inline-block mt-3 underline">
              Abrir o descargar
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
