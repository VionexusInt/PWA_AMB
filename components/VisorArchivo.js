"use client";
import { useEffect, useRef, useState } from "react";

export function esImagenArchivo(tipo, ref = "") {
  return (tipo || "").startsWith("image/") || /\.(png|jpe?g|gif|webp|heic|bmp)(\?|$)/i.test(ref);
}
export function esPdfArchivo(tipo, ref = "") {
  return (tipo || "").includes("pdf") || /\.pdf(\?|$)/i.test(ref);
}

export default function VisorArchivo({ url, nombre, tipo, onClose }) {
  const ref = nombre || url || "";
  const img = esImagenArchivo(tipo, ref);
  const pdf = esPdfArchivo(tipo, ref);
  const cont = useRef(null);
  const [estado, setEstado] = useState(pdf ? "cargando" : "ok");

  useEffect(() => {
    if (!pdf || !url) return;
    let cancelado = false;

    (async () => {
      try {
        // Descargamos el PDF como blob para evitar problemas de CORS en Android
        const resp = await fetch(url, { mode: "cors" });
        if (!resp.ok) throw new Error("No se pudo descargar el PDF");
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);

        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

        const doc = await pdfjs.getDocument(blobUrl).promise;
        if (cancelado) { URL.revokeObjectURL(blobUrl); return; }

        const cajaAncho = Math.min(cont.current?.clientWidth || 900, 1000) - 4;
        cont.current.innerHTML = "";

        for (let n = 1; n <= doc.numPages; n++) {
          if (cancelado) break;
          const page = await doc.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const escala = cajaAncho / base.width;
          const viewport = page.getViewport({ scale: escala });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.style.maxWidth = viewport.width + "px";
          canvas.style.display = "block";
          canvas.style.margin = "0 auto 10px";
          canvas.style.borderRadius = "4px";
          canvas.style.background = "#fff";
          cont.current.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        }
        URL.revokeObjectURL(blobUrl);
        if (!cancelado) setEstado("ok");
      } catch (e) {
        console.error("VisorArchivo PDF error:", e);
        if (!cancelado) setEstado("error");
      }
    })();

    return () => { cancelado = true; };
  }, [pdf, url]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      {/* Barra superior */}
      <div
        className="flex items-center justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white/90 text-sm truncate">{nombre || "Archivo"}</span>
        <div className="flex gap-2 shrink-0">
          <a
            href={url}
            download
            rel="noreferrer"
            className="text-white text-sm font-semibold px-3 py-1.5 rounded-lg bg-white/10 active:scale-95"
            onClick={(e) => e.stopPropagation()}
          >
            Descargar
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
      <div className="flex-1 min-h-0 overflow-auto" onClick={(e) => e.stopPropagation()}>
        {img && (
          <div className="min-h-full flex items-center justify-center p-2">
            <img
              src={url}
              alt={nombre || ""}
              className="max-w-full max-h-full object-contain rounded"
              style={{ maxHeight: "85vh" }}
            />
          </div>
        )}

        {pdf && (
          <div className="p-2">
            {estado === "cargando" && (
              <div className="text-center py-16">
                <div className="text-white/60 text-sm mb-2">Cargando PDF…</div>
                <div className="flex justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: "160ms" }} />
                  <span className="w-2 h-2 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: "320ms" }} />
                </div>
              </div>
            )}
            {estado === "error" && (
              <div className="text-white/80 text-center py-10 px-6">
                <p className="mb-1">No se ha podido mostrar el PDF aquí.</p>
                <p className="text-white/50 text-sm mb-4">Puede que el archivo no tenga los permisos necesarios.</p>
                <a
                  href={url}
                  download
                  className="inline-block px-4 py-2 bg-white/10 rounded-lg text-white text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  Descargar PDF
                </a>
              </div>
            )}
            <div ref={cont} />
          </div>
        )}

        {!img && !pdf && (
          <div className="text-white/80 text-center py-10 px-8">
            <p>No se puede previsualizar este tipo de archivo.</p>
            <a
              href={url}
              download
              className="inline-block mt-3 underline text-white/60"
              onClick={(e) => e.stopPropagation()}
            >
              Descargar
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
