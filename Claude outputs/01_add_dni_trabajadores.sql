-- Ejecutar en el SQL Editor de Supabase (paso único)
-- Añade el campo DNI a la ficha de trabajador (sugerencia "Añadir pestaña DNI")

alter table trabajadores
  add column if not exists dni text;
