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
export const addDispositivo = (codigo, nombre, es_admin, rol_id = null) =>
  supabase.from("dispositivos").insert({ codigo, nombre, es_admin, rol_id });
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

// ============================================
// FUNCIONES PARA COMITÉ DE SEGURIDAD Y SALUD (CSS)
// ============================================

// --- SUBIDA DE ARCHIVOS A SUPABASE STORAGE ---
export async function subirArchivoCSS(file, carpeta) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${carpeta}/${fileName}`;

  const { error } = await supabase.storage
    .from('css-files')
    .upload(filePath, file, { contentType: file.type || 'application/octet-stream', upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('css-files').getPublicUrl(filePath);
  return data.publicUrl;
}

// --- FUNCIONES GENÉRICAS PARA DOCUMENTOS CSS ---
// Sirve para: reglamentos, actas, denuncias, informes_delegados, sentencias
export async function getDocumentosCSS(tabla) {
  const { data, error } = await supabase
    .from(tabla)
    .select('*')
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data;
}

export async function crearDocumentoCSS(tabla, formData, file) {
  let archivo_url = null;
  let archivo_nombre = null;

  if (file) {
    archivo_url = await subirArchivoCSS(file, tabla);
    archivo_nombre = file.name;
  }

  const payload = {
    titulo: formData.titulo,
    descripcion: formData.descripcion,
    fecha: formData.fecha,
    archivo_url,
    archivo_nombre,
  };

  // Campos extra específicos según la tabla
  if (tabla === 'informes_delegados') {
    payload.delegado_nombre = formData.delegado_nombre;
  }
  if (tabla === 'sentencias') {
    payload.juzgado = formData.juzgado;
    payload.numero_sentencia = formData.numero_sentencia;
  }

  const { data, error } = await supabase
    .from(tabla)
    .insert([payload])
    .select();
  if (error) throw error;
  return data;
}

// --- REVALORACIÓN DE RIESGOS (Con joins a áreas y bases) ---
export async function getRevaloracionRiesgos() {
  const { data, error } = await supabase
    .from('revaloracion_riesgos')
    .select('*, areas(nombre), bases(nombre)')
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data;
}

export async function crearRevaloracionRiesgo(formData, file) {
  let archivo_url = null;
  if (file) {
    archivo_url = await subirArchivoCSS(file, 'revaloracion_riesgos');
  }

  const payload = {
    area_id: formData.area_id,
    base_id: formData.base_id,
    titulo: formData.titulo,
    descripcion: formData.descripcion,
    fecha: formData.fecha,
    archivo_url,
    resuelta: false,
  };

  const { data, error } = await supabase
    .from('revaloracion_riesgos')
    .insert([payload])
    .select();
  if (error) throw error;
  return data;
}

// ... (mantén todo lo anterior de CSS) ...

// --- INCIDENCIAS (Con filtro opcional por tipo) ---
export async function getIncidencias(tipoFiltro = null) {
  let query = supabase
    .from('incidencias')
    .select('*, bases(nombre), vehiculos(matricula), trabajadores(nombre)')
    .order('fecha', { ascending: false });

  // Si nos pasan un filtro (ej: 'Seguridad' o 'CSS'), lo aplicamos
  if (tipoFiltro) {
    query = query.eq('tipo', tipoFiltro);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ============================================
// EDITAR Y BORRAR - COMITÉ SEGURIDAD Y SALUD
// ============================================

export async function actualizarDocumentoCSS(tabla, id, formData, file) {
  let archivo_url = null;
  let archivo_nombre = null;

  if (file) {
    archivo_url = await subirArchivoCSS(file, tabla);
    archivo_nombre = file.name;
  }

  const payload = {
    titulo: formData.titulo,
    descripcion: formData.descripcion,
    fecha: formData.fecha,
  };

  if (archivo_url) payload.archivo_url = archivo_url;
  if (archivo_nombre) payload.archivo_nombre = archivo_nombre;

  if (tabla === "informes_delegados") {
    payload.delegado_nombre = formData.delegado_nombre;
  }
  if (tabla === "sentencias") {
    payload.juzgado = formData.juzgado;
    payload.numero_sentencia = formData.numero_sentencia;
  }

  const { data, error } = await supabase
    .from(tabla)
    .update(payload)
    .eq("id", id)
    .select();
  if (error) throw error;
  return data;
}

export async function borrarDocumentoCSS(tabla, id) {
  const { error } = await supabase.from(tabla).delete().eq("id", id);
  if (error) throw error;
}

export async function actualizarIncidencia(id, payload) {
  const { data, error } = await supabase
    .from("incidencias")
    .update(payload)
    .eq("id", id)
    .select();
  if (error) throw error;
  return data;
}

export async function borrarIncidencia(id) {
  const { error } = await supabase.from("incidencias").delete().eq("id", id);
  if (error) throw error;
}

// ============================================
// COMITÉ EMPRESA
// ============================================

// --- FUNCIONES GENÉRICAS PARA DOCUMENTOS DE COMITÉ EMPRESA ---
export async function getDocumentosEmpresa(tabla) {
  const { data, error } = await supabase
    .from(tabla)
    .select("*")
    .order("fecha", { ascending: false });
  if (error) throw error;
  return data;
}

export async function crearDocumentoEmpresa(tabla, formData, file) {
  let archivo_url = null;
  let archivo_nombre = null;

  if (file) {
    archivo_url = await subirArchivoCSS(file, tabla); // Reutilizamos la misma función de subida
    archivo_nombre = file.name;
  }

  const payload = {
    titulo: formData.titulo,
    descripcion: formData.descripcion,
    fecha: formData.fecha,
    archivo_url,
    archivo_nombre,
  };

  // Campos extra específicos
  if (tabla === "informes_delegados_empresa") {
    payload.delegado_nombre = formData.delegado_nombre;
  }

  const { data, error } = await supabase
    .from(tabla)
    .insert([payload])
    .select();
  if (error) throw error;
  return data;
}

// ============================================
// FUNCIONES DE EDITAR Y BORRAR (Comité Empresa y CSS)
// ============================================

export async function actualizarDocumentoEmpresa(tabla, id, formData, file) {
  let archivo_url = null;
  let archivo_nombre = null;

  if (file) {
    archivo_url = await subirArchivoCSS(file, tabla);
    archivo_nombre = file.name;
  }

  const payload = {
    titulo: formData.titulo,
    descripcion: formData.descripcion,
    fecha: formData.fecha,
  };

  if (archivo_url) payload.archivo_url = archivo_url;
  if (archivo_nombre) payload.archivo_nombre = archivo_nombre;

  if (tabla === "informes_delegados_empresa") {
    payload.delegado_nombre = formData.delegado_nombre;
  }
  if (tabla === "sentencias_empresa") {
    payload.juzgado = formData.juzgado;
    payload.numero_sentencia = formData.numero_sentencia;
  }

  const { data, error } = await supabase
    .from(tabla)
    .update(payload)
    .eq("id", id)
    .select();
  if (error) throw error;
  return data;
}

export async function borrarDocumentoEmpresa(tabla, id) {
  const { error } = await supabase.from(tabla).delete().eq("id", id);
  if (error) throw error;
}

export async function crearIncidenciaEmpresa(formData) {
  const payload = {
    descripcion: formData.descripcion,
    fecha: formData.fecha,
    tipo: formData.tipo_incidencia,
    resuelta: false,
  };

  const { data, error } = await supabase
    .from("incidencias_empresa")
    .insert([payload])
    .select();
  if (error) throw error;
  return data;
}

export async function getIncidenciasEmpresa() {
  const { data, error } = await supabase
    .from("incidencias_empresa")
    .select("*")
    .order("fecha", { ascending: false });
  if (error) throw error;
  return data;
}


// ============================================
// ROLES Y PERMISOS
// ============================================

export async function getRoles() {
  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .order("nombre");
  if (error) throw error;
  return data || [];
}

export async function getRolPorId(id) {
  if (!id) return null;
  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function crearRol({ nombre, descripcion, es_admin, permisos }) {
  const { data, error } = await supabase
    .from("roles")
    .insert([{ nombre, descripcion: descripcion || "", es_admin: !!es_admin, permisos: permisos || [] }])
    .select();
  if (error) throw error;
  return data;
}

export async function actualizarRol(id, { nombre, descripcion, es_admin, permisos }) {
  const { data, error } = await supabase
    .from("roles")
    .update({ nombre, descripcion: descripcion || "", es_admin: !!es_admin, permisos: permisos || [] })
    .eq("id", id)
    .select();
  if (error) throw error;
  return data;
}

export async function borrarRol(id) {
  // Los dispositivos con este rol quedan con rol_id = null (ON DELETE SET NULL)
  const { error } = await supabase.from("roles").delete().eq("id", id);
  if (error) throw error;
}
// ============================================
// ADJUNTOS MÚLTIPLES CSS (todas las secciones: seguridad y empresa)
// ============================================
export async function subirArchivoCSSConRuta(file, carpeta) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${carpeta}/${fileName}`;
  const { error } = await supabase.storage
    .from('css-files')
    .upload(filePath, file, { contentType: file.type || 'application/octet-stream', upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('css-files').getPublicUrl(filePath);
  return { url: data.publicUrl, ruta: filePath };
}

export async function getCSSAdjuntosMulti(tabla, registroId) {
  const { data, error } = await supabase
    .from('css_adjuntos')
    .select('*')
    .eq('tabla', tabla)
    .eq('registro_id', registroId)
    .order('creado_en');
  if (error) throw error;
  return data || [];
}

export async function subirCSSAdjuntoMulti(tabla, registroId, file) {
  const { url, ruta } = await subirArchivoCSSConRuta(file, tabla);
  const { error } = await supabase.from('css_adjuntos').insert({
    tabla, registro_id: registroId, url, ruta, nombre: file.name, tipo: file.type,
  });
  if (error) throw error;
}

export async function borrarCSSAdjuntoMulti(id, ruta) {
  await supabase.storage.from('css-files').remove([ruta]);
  const { error } = await supabase.from('css_adjuntos').delete().eq('id', id);
  if (error) throw error;
}

// Borra el archivo "antiguo" (el único que guardaba cada fila antes de tener adjuntos múltiples)
export async function borrarArchivoLegadoCSS(tabla, id) {
  const { error } = await supabase.from(tabla).update({ archivo_url: null, archivo_nombre: null }).eq('id', id);
  if (error) throw error;
}

// Evaluación de riesgos no tenía función de actualizar (solo crear). La añadimos.
export async function actualizarRevaloracionRiesgo(id, formData) {
  const payload = {
    area_id: formData.area_id || null,
    base_id: formData.base_id || null,
    titulo: formData.titulo,
    descripcion: formData.descripcion,
    fecha: formData.fecha || null,
  };
  const { data, error } = await supabase
    .from('revaloracion_riesgos')
    .update(payload)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

// ============================================
// TRASPASO DE DOCUMENTOS ENTRE COMITÉS
// ============================================
// Secciones que existen en AMBOS comités (tienen equivalente _empresa o sin sufijo)
// reglamentos <-> reglamentos_empresa
// actas <-> actas_empresa
// denuncias <-> denuncias_empresa
// sentencias <-> sentencias_empresa
// informes_delegados <-> informes_delegados_empresa

export function tablaDestinoTraspaso(tablaOrigen) {
  if (tablaOrigen.endsWith("_empresa")) {
    return tablaOrigen.replace(/_empresa$/, ""); // empresa -> seguridad
  }
  return tablaOrigen + "_empresa"; // seguridad -> empresa
}

export async function traspasarDocumento(tablaOrigen, registroId) {
  // 1) Leer el registro original
  const { data: orig, error: errOrig } = await supabase
    .from(tablaOrigen)
    .select("*")
    .eq("id", registroId)
    .single();
  if (errOrig) throw errOrig;

  const tablaDestino = tablaDestinoTraspaso(tablaOrigen);

  // 2) Insertar en destino (sin el id ni creado_en, que se generan solos)
  const { id, creado_en, ...campos } = orig;
  const { data: nuevo, error: errIns } = await supabase
    .from(tablaDestino)
    .insert([campos])
    .select()
    .single();
  if (errIns) throw errIns;

  // 3) Mover los adjuntos múltiples (css_adjuntos) al nuevo registro
  const { data: adjs } = await supabase
    .from("css_adjuntos")
    .select("*")
    .eq("tabla", tablaOrigen)
    .eq("registro_id", registroId);

  if (adjs?.length) {
    const nuevosAdjs = adjs.map(({ id, creado_en, ...a }) => ({
      ...a,
      tabla: tablaDestino,
      registro_id: nuevo.id,
    }));
    await supabase.from("css_adjuntos").insert(nuevosAdjs);
  }

  // 4) Borrar el original
  await supabase.from(tablaOrigen).delete().eq("id", registroId);
}
