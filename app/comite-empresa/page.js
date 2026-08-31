"use client";

import Link from "next/link";
import { Header } from "../../components/ui";

const secciones = [
  { id: "convenio", nombre: "Convenio", icono: "📋" },
  { id: "reglamentos", nombre: "Reglamento", icono: "📜" },
  { id: "actas", nombre: "Actas", icono: "📝" },
  { id: "denuncias", nombre: "Denuncias", icono: "⚠️" },
  { id: "sentencias", nombre: "Sentencias", icono: "⚖️" },
  { id: "informes-delegados", nombre: "Informes Delegados", icono: "📊" },
  { id: "incidencias", nombre: "Incidencias", icono: "🚨" },
  { id: "protocolos", nombre: "Protocolos y Procedimientos", icono: "📁" },
  { id: "propuestas", nombre: "Propuestas", icono: "💡" },
  { id: "calendarios", nombre: "Calendarios Laborales", icono: "📅" },
];

export default function ComiteEmpresaPage() {
  return (
    <main className="pb-16">
      <Header titulo="Comité Empresa" back />
      
      <div className="px-4 mt-6">
        <div className="grid gap-3">
          {secciones.map((seccion) => (
            <Link
              key={seccion.id}
              href={`/comite-empresa/${seccion.id}`}
              className="tap block bg-panel border border-line rounded-2xl p-4 active:scale-[.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">{seccion.icono}</div>
                <h2 className="title text-2xl font-bold">{seccion.nombre}</h2>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}