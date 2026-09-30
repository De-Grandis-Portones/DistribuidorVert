import { supabase } from '../lib/supabaseClient';

// Tickets: misma tabla compartida public.tickets que usan Planificación e
// Integrador (ver Backend/server/index.js de Planificación, migración
// "tickets"/"tickets_multi_app"). Acá no hay backend propio, así que se
// inserta directo con la clave anon de Supabase - requiere que la tabla
// tenga una policy de RLS que permita el insert (ver
// distributor-app/README_TICKETS.md).
// `titulo` necesita la columna tickets.titulo (migración tickets_titulo de
// Planificación): esta app no puede crearla (clave anon), así que se publica
// después de que esa migración haya corrido.
export async function createDistributorTicket({ titulo, categoria, mensaje, creadoPorId, creadoPorUsername, rutaOrigen, adjuntos }) {
  const { data, error } = await supabase
    .from('tickets')
    .insert({
      titulo: String(titulo || '').trim().slice(0, 120) || null,
      categoria,
      mensaje,
      ruta_origen: rutaOrigen || null,
      creado_por_id: creadoPorId != null ? String(creadoPorId) : null,
      creado_por_username: creadoPorUsername || null,
      app_origen: 'distribuidor',
      adjuntos: Array.isArray(adjuntos) ? adjuntos.slice(0, 5) : [],
    })
    .select()
    .single();

  if (error) throw new Error(error.message || 'No se pudo enviar el ticket.');
  return data;
}
