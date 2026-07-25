"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Header({ titulo, subtitulo, back }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-10 bg-base/70 backdrop-blur-xl border-b border-white/[.05] px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-3.5 flex items-center gap-3">
      {back && (
        <button
          onClick={() => router.back()}
          aria-label="Atrás"
          className="tap w-9 h-9 -ml-1 rounded-full grid place-items-center bg-white/[.04] border border-white/[.06] text-ink/90 text-xl active:scale-90 hover:bg-white/[.07]"
        >
          ‹
        </button>
      )}
      <div className="min-w-0">
        <h1 className="title text-[26px] font-extrabold leading-[1.05] truncate">{titulo}</h1>
        {subtitulo && <p className="text-mut text-[13px] mt-0.5 truncate">{subtitulo}</p>}
      </div>
    </header>
  );
}

export function Badge({ children, tone = "mut" }) {
  const tones = {
    mut: "bg-white/[.045] text-mut border-white/[.06]",
    accent: "bg-accent/12 text-accent border-accent/25",
    ok: "bg-ok/12 text-ok border-ok/25",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full border ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function CardLink({ href, children }) {
  return (
    <Link
      href={href}
      className="tap block bg-panel/95 border border-white/[.055] rounded-2xl p-4 shadow-card active:scale-[.985] hover:border-white/[.09] transition-[transform,border-color]"
    >
      {children}
    </Link>
  );
}

export function Spinner() {
  return (
    <div className="grid place-items-center py-20" role="status" aria-label="Cargando">
      <div className="flex gap-1.5">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-accent/70 animate-pulse" style={{ animationDelay: "160ms" }} />
        <span className="w-2 h-2 rounded-full bg-accent/40 animate-pulse" style={{ animationDelay: "320ms" }} />
      </div>
    </div>
  );
}

// Bloque de carga tipo "esqueleto" (disponible por si se quiere usar)
export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-white/[.05] rounded-xl ${className}`} />;
}
