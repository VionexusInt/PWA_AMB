"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Header({ titulo, subtitulo, back }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-10 bg-base/95 backdrop-blur border-b border-line px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-3 flex items-center gap-3">
      {back && (
        <button
          onClick={() => router.back()}
          aria-label="Atrás"
          className="tap w-9 h-9 rounded-full grid place-items-center bg-panel2 border border-line text-ink text-xl active:scale-95"
        >
          ‹
        </button>
      )}
      <div className="min-w-0">
        <h1 className="title text-2xl font-extrabold leading-none truncate">{titulo}</h1>
        {subtitulo && <p className="text-mut text-sm mt-0.5 truncate">{subtitulo}</p>}
      </div>
    </header>
  );
}

export function Badge({ children, tone = "mut" }) {
  const tones = {
    mut: "bg-panel2 text-mut border-line",
    accent: "bg-accent/15 text-accent border-accent/30",
    ok: "bg-ok/15 text-ok border-ok/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function CardLink({ href, children }) {
  return (
    <Link
      href={href}
      className="tap block bg-panel border border-line rounded-2xl p-4 active:scale-[.98] transition-transform"
    >
      {children}
    </Link>
  );
}

export function Spinner() {
  return (
    <div className="grid place-items-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-line border-t-accent animate-spin" />
    </div>
  );
}
