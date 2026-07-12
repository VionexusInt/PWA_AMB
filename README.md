# Control · Ambulancias — Fase 2

PWA con Next.js (App Router) + Tailwind + Supabase, en tiempo real e instalable en el móvil.

## Puesta en marcha (local, en VSC)

1. Requisitos: Node.js 18+ instalado.
2. Descomprime el proyecto y ábrelo en VS Code.
3. Instala dependencias:
   ```
   npm install
   ```
4. Copia `.env.local.example` a `.env.local` y rellena con tus datos de Supabase
   (Supabase → Project Settings → API):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ```
5. Arranca en local:
   ```
   npm run dev
   ```
   Abre http://localhost:3000

> Nota: para poder leer/escribir necesitas estar autenticado (las políticas RLS
> exigen usuario `authenticated`). El login lo montamos en una fase posterior.
> Para probar YA sin login, puedes cambiar temporalmente en Supabase las policies
> de `authenticated` a `anon`, o crear un usuario de prueba en Authentication.

## Subir a GitHub y desplegar en Vercel

1. Crea un repositorio nuevo en GitHub y sube esta carpeta con GitHub Desktop.
2. En Vercel: **New Project → Import** el repo. Framework: Next.js (lo detecta solo).
3. En Vercel → Settings → **Environment Variables**, añade las dos variables
   `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy. A partir de ahí, cada push a GitHub (desde GitHub Desktop) redesplega solo.

## Instalar como app en el móvil

Abre la URL de Vercel en el móvil → menú del navegador → "Añadir a pantalla de inicio".

## Estructura

```
app/
  layout.js            layout raíz + PWA + fuentes
  page.js              INICIO: buscador + tarjetas de áreas
  area/[id]/page.js    ÁREA: lista de bases
  base/[id]/page.js    BASE: pestañas Trabajadores / Coches / Incidencias + altas
components/
  ui.js                Header, Badge, CardLink, Spinner
  RegistrarSW.js       registra el service worker
lib/
  supabase.js          cliente Supabase
  useRealtime.js       hook de tiempo real
  data.js              todas las consultas y altas
public/
  manifest.json, sw.js, icons/
```

## Qué falta (siguientes fases)

- Fase 3: fichas de detalle de Trabajador (con SUS incidencias) y de Vehículo.
- Fase 4: login/autenticación y roles (admin / consulta).
- Fase 5: editar y borrar registros, filtros y pantalla de resultados de búsqueda ampliada.
