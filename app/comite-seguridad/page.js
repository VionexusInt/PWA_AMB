"use client";

import Link from "next/link";
import { Header } from "../../components/ui";

const secciones = [
  { id: "reglamentos", nombre: "Reglamento", icono: "📜" },
  { id: "actas", nombre: "Actas", icono: "📝" },
  { id: "denuncias", nombre: "Denuncias", icono: "⚠️" },
  { id: "informes-delegados", nombre: "Informes Delegados", icono: "📊" },
  { id: "sentencias", nombre: "Sentencias", icono: "⚖️" },
  { id: "revaloracion-riesgos", nombre: "Evaluación de riesgos", icono: "🔄" }, // CAMBIADO
  { id: "incidencias", nombre: "Incidencias CSS", icono: "" },
];

export default function ComiteSeguridadPage() {
  return (
    <main className="pb-16">
      <Header titulo="Comité de Seguridad y Salud" back />
      
      <div className="px-4 mt-6">
        <div className="grid gap-3">
          {secciones.map((seccion) => (
            <Link
              key={seccion.id}
              href={`/comite-seguridad/${seccion.id}`}
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