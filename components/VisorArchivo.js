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
    if (!pdf) return;
    let cancelado = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
        const doc = await pdfjs.getDocument(url).promise;
        if (cancelado) return;
        const cajaAncho = Math.min(cont.current?.clientWidth || 900, 1000) - 4;
        cont.current.innerHTML = "";
        for (let n = 1; n <= doc.numPages; n++) {
          if (cancelado) return;
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
          cont.current.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        }
        if (!cancelado) setEstado("ok");
      } catch (e) {
        if (!cancelado) setEstado("error");
      }
    })();
    return () => { cancelado = true; };
  }, [pdf, url]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      <div
        className="flex items-center justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white/90 text-sm truncate">{nombre || "Archivo"}</span>
        <div className="flex gap-2 shrink-0">
          <a href={url} target="_blank" rel="noreferrer"
            className="text-white text-sm font-semibold px-3 py-1.5 rounded-lg bg-white/10 active:scale-95">
            Descargar
          </a>
          <button onClick={onClose}
            className="text-white text-sm font-semibold px-3 py-1.5 rounded-lg bg-white/10 active:scale-95">
            Cerrar
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto" onClick={(e) => e.stopPropagation()}>
        {img && (
          <div className="h-full flex items-center justify-center p-2">
            <img src={url} alt={nombre || ""} className="max-w-full max-h-full object-contain rounded" />
          </div>
        )}
        {pdf && (
          <div className="p-2">
            {estado === "cargando" && <p className="text-white/70 text-center py-10">Cargando PDF…</p>}
            {estado === "error" && (
              <div className="text-white/80 text-center py-10 px-6">
                <p>No se ha podido mostrar el PDF aquí.</p>
                <a href={url} target="_blank" rel="noreferrer" className="inline-block mt-3 underline">Abrir o descargar</a>
              </div>
            )}
            <div ref={cont} />
          </div>
        )}
        {!img && !pdf && (
          <div className="text-white/80 text-center py-10 px-8">
            <p>No se puede previsualizar este tipo de archivo.</p>
            <a href={url} target="_blank" rel="noreferrer" className="inline-block mt-3 underline">Abrir o descargar</a>
          </div>
        )}
      </div>
    </div>
  );
}
