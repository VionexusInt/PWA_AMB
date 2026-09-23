-- Ejecutar en el SQL Editor de Supabase (paso único)
-- Añade la fecha de antigüedad (opcional) a la ficha de trabajador

alter table trabajadores
  add column if not exists fecha_antiguedad date;
