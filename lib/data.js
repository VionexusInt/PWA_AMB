import { supabase } from "./supabase";

// --- INICIO: áreas + nº de incidencias pendientes por área ---
export async function getInicio() {
  const [areasR, basesR, incR] = await Promise.all([
    supabase.from("areas").select("id, nombre").order("nombre"),
    supabase.from("bases").select("id, area_id"),
    supabase
      .from("incidencias")
      .select("id, base_id, vehiculo:vehiculos(base_id), trabajador:trabajadores(base_id)")
      .eq("resuelta", false),
  ]);
  const err = areasR.error || basesR.error || incR.error;
  if (err) return { data: null, error: err };

  const baseToArea = {};
  (basesR.data || []).forEach((b) => (baseToArea[b.id] = b.area_id));

  const pendientesPorArea = {};
  (incR.data || []).forEach((i) => {
    const baseId = i.base_id || i.vehiculo?.base_id || i.trabajador?.base_id;
    const areaId = baseToArea[baseId];
    if (areaId) pendientesPorArea[areaId] = (pendientesPorArea[areaId] || 0) + 1;
  });

  const data = (areasR.data || []).map((a) => ({
    ...a,
    n_bases: (basesR.data || []).filter((b) => b.area_id === a.id).length,
    pendientes: pendientesPorArea[a.id] || 0,
  }));
  return { data, error: null };
}

// --- ÁREA: datos del área + sus bases con contadores ---
export async function getArea(areaId) {
  const [areaR, basesR] = await Promise.all([
    supabase.from("areas").select("id, nombre").eq("id", areaId).single(),
    supabase.from("bases").select("id, nombre, tipo").eq("area_id", areaId).order("nombre"),
  ]);
  if (areaR.error || basesR.error) return { data: null, error: areaR.error || basesR.error };

  const baseIds = (basesR.data || []).map((b) => b.id);
  let trab = [], veh = [], inc = [];
  if (baseIds.length) {
    const [t, v, i] = await Promise.all([
      supabase.from("trabajadores").select("id, base_id").in("base_id", baseIds),
      supabase.from("vehiculos").select("id, base_id").in("base_id", baseIds),
      supabase.from("incidencias").select("base_id").eq("resuelta", false).in("base_id", baseIds),
    ]);
    trab = t.data || []; veh = v.data || []; inc = i.data || [];
  }
  const bases = (basesR.data || []).map((b) => ({
    ...b,
    n_trab: trab.filter((x) => x.base_id === b.id).length,
    n_veh: veh.filter((x) => x.base_id === b.id).length,
    pendientes: inc.filter((x) => x.base_id === b.id).length,
  }));
  return { data: { area: areaR.data, bases }, error: null };
}

// --- BASE: datos + trabajadores + vehículos + incidencias ---
export async function getBase(baseId) {
  const [baseR, trabR, vehR, incR] = await Promise.all([
    supabase.from("bases").select("id, nombre, tipo, area_id").eq("id", baseId).single(),
    supabase.from("trabajadores").select("*").eq("base_id", baseId).order("nombre"),
    supabase.from("vehiculos").select("*").eq("base_id", baseId).order("matricula"),
    supabase.from("incidencias").select("*, adjuntos(id)").eq("base_id", baseId).order("fecha", { ascending: false }),
  ]);
  const err = baseR.error || trabR.error || vehR.error || incR.error;
  if (err) return { data: null, error: err };
  return {
    data: {
      base: baseR.data,
      trabajadores: trabR.data || [],
      vehiculos: vehR.data || [],
      incidencias: incR.data || [],
    },
    error: null,
  };
}

// --- ÁREAS: alta / edición / borrado ---
export const addArea = (campos) => supabase.from("areas").insert(campos);
export const updateArea = (id, campos) => supabase.from("areas").update(campos).eq("id", id);
export const deleteArea = (id) => supabase.from("areas").delete().eq("id", id);

// --- BASES: alta / edición / borrado ---
export const addBase = (area_id, campos) => supabase.from("bases").insert({ area_id, ...campos });
export const updateBase = (id, campos) => supabase.from("bases").update(campos).eq("id", id);
export const deleteBase = (id) => supabase.from("bases").delete().eq("id", id);

// --- TRABAJADORES: alta / edición / borrado ---
export const addTrabajador = (base_id, campos) => supabase.from("trabajadores").insert({ base_id, ...campos });
export const updateTrabajador = (id, campos) => supabase.from("trabajadores").update(campos).eq("id", id);
export const deleteTrabajador = (id) => supabase.from("trabajadores").delete().eq("id", id);

// --- VEHÍCULOS: alta / edición / borrado ---
export const addVehiculo = (base_id, campos) => supabase.from("vehiculos").insert({ base_id, ...campos });
export const updateVehiculo = (id, campos) => supabase.from("vehiculos").update(campos).eq("id", id);
export const deleteVehiculo = (id) => supabase.from("vehiculos").delete().eq("id", id);

// --- INCIDENCIAS: alta / edición / borrado / resolver ---
// campos: objeto tipo { base_id, descripcion } o { trabajador_id, descripcion } o { vehiculo_id, descripcion }
export const addIncidencia = (campos) => supabase.from("incidencias").insert(campos).select().single();
export const updateIncidencia = (id, campos) => supabase.from("incidencias").update(campos).eq("id", id);
export const deleteIncidencia = (id) => supabase.from("incidencias").delete().eq("id", id);
export const resolverIncidencia = (id, resuelta) =>
  supabase
    .from("incidencias")
    .update({ resuelta, fecha_resolucion: resuelta ? new Date().toISOString() : null })
    .eq("id", id);

// --- FICHA TRABAJADOR: datos + base + coches asignados + incidencias propias ---
export async function getTrabajador(trabajadorId) {
  const [trabR, asigR, incR] = await Promise.all([
    supabase.from("trabajadores").select("*, base:bases(id, nombre)").eq("id", trabajadorId).single(),
    supabase.from("asignaciones").select("id, rol, vehiculo:vehiculos(id, matricula, id_personal)").eq("trabajador_id", trabajadorId),
    supabase.from("incidencias").select("*, adjuntos(id)").eq("trabajador_id", trabajadorId).order("fecha", { ascending: false }),
  ]);
  const err = trabR.error || asigR.error || incR.error;
  if (err) return { data: null, error: err };
  return {
    data: {
      trabajador: trabR.data,
      asignaciones: asigR.data || [],
      incidencias: incR.data || [],
    },
    error: null,
  };
}

// --- FICHA VEHÍCULO: datos + base + personal asignado + incidencias + trabajadores de su base ---
export async function getVehiculo(vehiculoId) {
  const vehR = await supabase.from("vehiculos").select("*, base:bases(id, nombre)").eq("id", vehiculoId).single();
  if (vehR.error) return { data: null, error: vehR.error };
  const baseId = vehR.data.base_id;
  const [asigR, incR, plantillaR, vehsR] = await Promise.all([
    supabase.from("asignaciones").select("id, rol, trabajador:trabajadores(id, nombre, puesto_trabajo)").eq("vehiculo_id", vehiculoId),
    supabase.from("incidencias").select("*, adjuntos(id)").eq("vehiculo_id", vehiculoId).order("fecha", { ascending: false }),
    supabase.from("trabajadores").select("id, nombre").eq("base_id", baseId).order("nombre"),
    supabase.from("vehiculos").select("id, matricula, id_personal").eq("base_id", baseId).neq("id", vehiculoId).order("matricula"),
  ]);
  const err = asigR.error || incR.error || plantillaR.error || vehsR.error;
  if (err) return { data: null, error: err };
  return {
    data: {
      vehiculo: vehR.data,
      asignaciones: asigR.data || [],
      incidencias: incR.data || [],
      plantillaBase: plantillaR.data || [], // trabajadores de la misma base (para asignar)
      vehiculosBase: vehsR.data || [],      // otros coches de la base (para transferir)
    },
    error: null,
  };
}

// --- ASIGNACIONES: trabajador <-> vehículo ---
export const addAsignacion = (vehiculo_id, trabajador_id, rol) =>
  supabase.from("asignaciones").insert({ vehiculo_id, trabajador_id, rol });
export const updateAsignacion = (id, rol) =>
  supabase.from("asignaciones").update({ rol }).eq("id", id);
export const moverAsignacion = (id, vehiculo_id) =>
  supabase.from("asignaciones").update({ vehiculo_id }).eq("id", id);
export const deleteAsignacion = (id) =>
  supabase.from("asignaciones").delete().eq("id", id);

// --- LISTAS GLOBALES (todos, con nombre de su base) ---
export const getTodosTrabajadores = () =>
  supabase.from("trabajadores").select("*, base:bases(nombre)").order("nombre");
export const getTodosVehiculos = () =>
  supabase.from("vehiculos").select("*, base:bases(nombre)").order("matricula");

// --- TODAS LAS INCIDENCIAS (con su origen: base / trabajador / vehículo) ---
export const getTodasIncidencias = () =>
  supabase
    .from("incidencias")
    .select("*, adjuntos(id), base:bases(id,nombre), trabajador:trabajadores(id,nombre), vehiculo:vehiculos(id,matricula)")
    .order("fecha", { ascending: false });

// --- TRANSFER: mover un trabajador a otra base ---
export const getAreasConBases = () =>
  supabase.from("areas").select("id, nombre, bases(id, nombre)").order("nombre");
export const transferirTrabajador = (id, base_id) =>
  supabase.from("trabajadores").update({ base_id }).eq("id", id);

// --- DISPOSITIVOS (gestión de códigos de acceso, solo admin) ---
export const getDispositivos = () =>
  supabase.from("dispositivos").select("*").order("creado_en", { ascending: false });
export const addDispositivo = (codigo, nombre, es_admin) =>
  supabase.from("dispositivos").insert({ codigo, nombre, es_admin });
export const updateDispositivo = (id, campos) =>
  supabase.from("dispositivos").update(campos).eq("id", id);
export const deleteDispositivo = (id) =>
  supabase.from("dispositivos").delete().eq("id", id);

// --- SUGERENCIAS / REPORTE DE FALLOS ---
export const addSugerencia = (tipo, texto, dispositivo, tema) =>
  supabase.from("sugerencias").insert({ tipo, texto, dispositivo, tema });
export const getSugerencias = () =>
  supabase.from("sugerencias").select("*").order("creado_en", { ascending: false });
export const updateSugerencia = (id, campos) =>
  supabase.from("sugerencias").update(campos).eq("id", id);
export const deleteSugerencia = (id) =>
  supabase.from("sugerencias").delete().eq("id", id);

// --- ADJUNTOS (imágenes / PDF de las incidencias) ---
export const getAdjuntos = (incidenciaId) =>
  supabase.from("adjuntos").select("*").eq("incidencia_id", incidenciaId).order("creado_en");

export const urlAdjunto = (ruta) =>
  supabase.storage.from("adjuntos").getPublicUrl(ruta).data.publicUrl;

export async function subirAdjunto(incidenciaId, file) {
  const limpio = file.name.replace(/[^\w.\-]/g, "_");
  const ruta = `${incidenciaId}/${Date.now()}_${limpio}`;
  const up = await supabase.storage.from("adjuntos").upload(ruta, file, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });
  if (up.error) return { error: up.error };
  return supabase.from("adjuntos").insert({
    incidencia_id: incidenciaId,
    ruta,
    nombre: file.name,
    tipo: file.type,
  });
}

export async function borrarAdjunto(id, ruta) {
  await supabase.storage.from("adjuntos").remove([ruta]);
  return supabase.from("adjuntos").delete().eq("id", id);
}

// --- DATOS PARA INFORMES / EXPORTAR A PDF ---
export async function getDatosInforme() {
  const [areasR, trabR, vehR, incR] = await Promise.all([
    supabase.from("areas").select("id, nombre, bases(id, nombre)").order("nombre"),
    supabase.from("trabajadores").select("*, base:bases(id, nombre, area_id)").order("nombre"),
    supabase.from("vehiculos").select("*, base:bases(id, nombre, area_id)").order("matricula"),
    supabase
      .from("incidencias")
      .select("*, base:bases(id,nombre,area_id), trabajador:trabajadores(id,nombre,base_id), vehiculo:vehiculos(id,matricula,base_id)")
      .order("fecha", { ascending: false }),
  ]);
  const err = areasR.error || trabR.error || vehR.error || incR.error;
  if (err) return { data: null, error: err };
  return {
    data: {
      areas: areasR.data || [],
      trabajadores: trabR.data || [],
      vehiculos: vehR.data || [],
      incidencias: incR.data || [],
    },
    error: null,
  };
}

// --- TIPOS DE INCIDENCIA PERSONALIZADOS (los de "Otro") ---
// normaliza: minúsculas, sin acentos, sin espacios de más (para detectar duplicados)
function normalizaTipo(s) {
  return (s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export const getTiposIncidencia = () =>
  supabase.from("tipos_incidencia").select("nombre").order("nombre");

// Devuelve el nombre canónico del tipo, creándolo si es nuevo y evitando duplicados.
export async function resolverTipoIncidencia(nombreEscrito, fijos = []) {
  const clave = normalizaTipo(nombreEscrito);
  if (!clave) return { nombre: null };

  // 1) ¿coincide con un tipo fijo? (Seguridad, Avería…)
  const fijo = fijos.find((f) => normalizaTipo(f) === clave);
  if (fijo) return { nombre: fijo };

  // 2) ¿ya existe uno personalizado igual?
  const existe = await supabase.from("tipos_incidencia").select("nombre").eq("clave", clave).maybeSingle();
  if (existe.data) return { nombre: existe.data.nombre };

  // 3) crear nuevo
  const nombreLimpio = nombreEscrito.trim();
  const ins = await supabase.from("tipos_incidencia").insert({ nombre: nombreLimpio, clave });
  if (ins.error) {
    // por si otro lo creó a la vez: recuperar el existente
    const r = await supabase.from("tipos_incidencia").select("nombre").eq("clave", clave).maybeSingle();
    return { nombre: r.data?.nombre || nombreLimpio };
  }
  return { nombre: nombreLimpio };
}
