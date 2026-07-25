# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) cuando trabaja con código en este repositorio.

## 📋 Visión General del Proyecto

Este es **Control · Ambulancias — Fase 2**, una Aplicación Web Progresiva (PWA) para la gestión de servicios de ambulancia construida con:
- **Frontend**: Next.js 14 (App Router) + React 18 + Tailwind CSS
- **Backend**: Supabase (PostgreSQL con capacidades en tiempo real)
- **Características**: Actualizaciones en tiempo real, PWA instalable en móvil, operaciones CRUD para recursos de servicio de emergencias

La aplicación gestiona bases, trabajadores, vehículos e incidencias para servicios de ambulancia, proporcionando monitoreo y control operativo en tiempo real.

## 🏗️ Arquitectura y Estructura

### Modelo de Datos Principal (lib/data.js)
- **Áreas** (regiones geográficas)
- **Bases** (estaciones de ambulancia dentro de áreas)
- **Trabajadores** (trabajadores/paramédicos)
- **Vehículos** (ambulancias/vehículos)
- **Incidencias** (incidentes/informes con adjuntos)
- **Asignaciones** (asignaciones trabajador-vehículo)
- **Sugerencias** (sistema de feedback/sugerencias)
- **Dispositivos** (control de acceso de dispositivos para admin)
- **Módulos de comités** (Comité de Empresa & Comité de Seguridad)

### Características Técnicas Clave

#### Actualizaciones en Tiempo Real
- Utiliza Supabase Realtime a través del hook `lib/useRealtime.js` hook con Supabase Realtime
- Actualiza automáticamente la UI cuando cambian las tablas: áreas, bases, incidencias, trabajadores, vehiculos
- Ejemplo de uso en `app/page.js`: `useRealtime(getInicio, ["areas", "bases", "incidencias", "trabajadores", "vehiculos"])`

#### Integración con Supabase
- Cliente: `lib/supabase.js` (cliente de navegador)
- Todas las operaciones de datos pasan por las funciones de `lib/data.js`
- Almacenamiento: Adjuntos de incidencias almacenados en el bucket de Supabase Storage "adjuntos"

#### Características PWA
- Servicio worker: `components/RegistrarSW.js`
- Manifiesto e iconos: directorio `/public/`
- Instalable mediante "Añadir a Pantalla de Inicio" en navegadores móviles

#### Estructura Principal de Páginas
```
app/
├─ page.js              # Panel de control: búsqueda + estadísticas generales
├─ area/[id]/page.js    # Detalles de área + bases
├─ base/[id]/page.js    # Detalles de base (trabajadores, vehículos, incidencias)
├─ trabajador/[id]/page.js # Perfil de trabajador
├─ vehiculo/[id]/page.js  # Perfil de vehículo
├─ comite-empresa/      # Documentos del comité de empresa
├─ comite-seguridad/    # Documentos del comité de seguridad
├─ sugerencias/         # Sistema de retroalimentación
├─ exportar/            # Generación de informes PDF
└─ admin/               # Control de acceso de dispositivos
```

## 🔧 Comandos de Desarrollo

### Configuración Inicial
```bash
# Instalar dependencias
npm install

# Configurar variables de entorno (.env.local)
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon

# Iniciar servidor de desarrollo
npm run dev
# Visitar http://localhost:3000
```

### Producción
```bash
# Construir para producción
npm run build

# Iniciar servidor de producción
npm start

# Lintar código
npm run lint
```

### Operaciones de Base de Datos
Todas las operaciones de Supabase están en `lib/data.js`:
- **Consultas**: `getInicio()`, `getArea()`, `getBase()`, etc.
- **Mutaciones**: `addArea()`, `updateBase()`, `deleteTrabajador()`, etc.
- **Tiempo real**: Utiliza `useRealtime()` hook para actualizaciones automáticas
- **Almacenamiento**: `subirAdjunto()` para carga de archivos, `urlAdjunto()` para URLs públicas

## 📱 Características Clave de Implementación

### Funcionalidad de Búsqueda
- Búsqueda global en `app/page.js` (buscador)
- Busca en bases, trabajadores, vehículos e incidencias
- Utiliza consultas ILIKE para coincidencias parciales

### Gestión de Incidencias
- Creación con `addIncidencia()` (soporta referencias a base/trabajador/vehiculo)
- Adjuntos mediante `subirAdjunto()` (imágenes/PDFs almacenados en Supabase Storage)
- Resolución mediante `resolverIncidencia()`
- Actualizaciones en tiempo real mediante suscripción a la tabla de incidencias

### Sistema de Asignaciones
- Relación Trabajadores ↔ Vehículos mediante tabla `asignaciones`
- Funciones: `addAsignacion()`, `updateAsignacion()`, `deleteAsignacion()`
- Visualización de asignaciones en páginas de detalle de trabajador/vehículo

### Informes y Exportación
- Generación de PDF en ruta `/exportar`
- Agregación de datos mediante `getDatosInforme()`
- Incluye áreas, trabajadores, vehículos, incidencias con relaciones

### Sistemas de Comités
- Módulos separados para Comité de Empresa y Comité de Seguridad
- Gestión de documentos con carga de archivos a Supabase Storage
- Almacenamiento de actas, informes, resoluciones, etc.

## 🔑 Autenticación y Control de Acceso

### Estado Actual (Fase 2)
- Sistema de login de usuario aún no implementado (planificado para Fase 4)
- Control de acceso basado en dispositivos vía `lib/acceso.js`:
  - Dispositivos admin registrados en tabla `dispositivos`
  - `esDispositivoAdmin()` verifica si el dispositivo actual tiene privilegios admin
  - Características admin: gestión de dispositivos, exportación PDF, ciertas operaciones CRUD

### Autenticación Planificada (Fase 4)
- Integración con Supabase Auth
- Roles: admin/consulta
- Políticas RLS que aplicarán niveles de acceso

## 📱 Especificidades PWA

### Instalación
1. Visitar la URL desplegada en navegador móvil
2. Menú del navegador → "Añadir a Pantalla de Inicio"
3. Funciona sin conexión con assets en caché
2. Posibilidad de notificaciones push vía service worker

### Service Worker (`components/RegistrarSW.js`)
- Registra el service worker para caché offline
- Gestiona el caché de assets para funcionalidad PWA
- Implementación estándar basada en Workbox

## 🗄️ Esquema de Base de Datos General

### Tablas Principales
- `areas`: id, nombre
- `bases`: id, nombre, tipo, area_id
- `trabajadores`: id, nombre, base_id, puesto_trabajo, etc.
- `vehiculos`: id, matricula, base_id, id_personal, etc.
- `incidencias`: id, descripcion, tipo, base_id/trabajador_id/vehiculo_id, resuelta, fecha, etc.
- `asignaciones`: id, vehiculo_id, trabajador_id, rol
- `sugerencias`: id, tipo, texto, dispositivo, tema
- `dispositivos`: id, codigo, nombre, es_admin
- `adjuntos`: id, incidencia_id, nombre, tipo, ruta (referencia a Storage)

### Relaciones
- Uno-a-Muchos: Área → Bases → {Trabajadores, Vehiculos}
- Polimórfica: Incidencias enlaza a base O trabajador O vehículo
- Muchos-a-Muchos: Trabajadores ↔ Vehiculos (vía asignaciones)
- Almacenamiento: Adjuntos referencia archivos en supabase_storage

## 🔄 Patrón de Implementación en Tiempo Real

Patrón consistente utilizado a lo largo de la aplicación:
```javascript
// En página o componente
const { data: items } = useRealtime(
  () => getItemsFunction(),  // Función de consulta
  ["table1", "table2"],      // Tablas a vigilar
  [routeParams]              // Dependencias que forzado recarga
);

// Los datos se actualizan automáticamente cuando cualquier tabla vigilada cambia
```

## 📱 Diseño Mobile-First

- Utiliza utilidades responsivas de Tailwind CSS
- Controles amigables para toque (mínimo 48px de objetivo táctil)
- Optimizado para visualización e instalación móvil
- Service worker permite caché offline
- Manifiesto permite comportamiento de aplicación independiente

## 🚀 Próximas Funcionalidades Planificadas (desde README)

**Fase 3**: Fichas de detalle de Trabajador/Vehículo con sus incidencias  
**Fase 4**: Login/autenticación y roles (admin/consulta)  
**Fase 5**: Edición/eliminación de registros, filtros avanzados, pantalla de búsqueda ampliada  

## 🧠 Principios Clave de Desarrollo

1. **Primero en Tiempo Real**: Todas las actualizaciones de datos mediante suscripciones de Supabase
2. **Capa de Datos Modular**: Todas las interacciones con Supabase en `lib/data.js`
3. **Optimizado para PWA**: Service worker, manifiesto, UI amigable para toque
4. **Mejora Progresiva**: Funciona sin JS, mejorado con JS
5. **Enfoque Mobile-First**: Diseñado para responders de emergencias en campo
6. **Separación de Responsabilidades**: División clara entre UI, datos y capas de almacenamiento

## 🔍 Consejos para Depuración

1. **Problemas en Tiempo Real**: Verificar consola del navegador para estado de conexión de Supabase Realtime
2. **Errores de Base de Datos**: Todas las funciones de datos devuelven objetos `{data, error}`
3. **Problemas de Almacenamiento**: Verificar permisos y estructura de carpetas del bucket de Supabase Storage
4. **Instalación PWA**: Usar pestaña Application en DevTools de Chrome para inspeccionar manifiesto/service worker
5. **Entorno**: Verificar que las variables `.env.local` estén correctamente establecidas (prefijo con `NEXT_PUBLIC_`)

## 📝 Estándares de Código

- **Estilo**: Seguir convenciones existentes de ESLint/Tailwind
- **Componentes**: Utilizar componentes inspirados en shadcn/ui de `components/ui.js`
- **Obtención de Datos**: Siempre utilizar `useRealtime()` para datos en vivo
- **Manejo de Errores**: Verificar `.error` en todas las respuestas de Supabase
- **Carga de Archivos**: Utilizar `subirAdjunto()` para adjuntos, nunca llamadas directas a Storage
- **Variables de Entorno**: Nunca hardcodear claves de Supabase - siempre usar variables de entorno

Esta base de código sigue patrones de Next.js App Router con características de React 18 (useCallback, useEffect, useState) y aprovecha las capacidades en tiempo real de Supabase para una PWA de gestión de servicios de emergencias responsiva.