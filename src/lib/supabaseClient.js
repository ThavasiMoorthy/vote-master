import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
}

function ensureClient() {
  if (!supabase) throw new Error('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  return supabase;
}

// Sheets
export async function supaCreateSheet(sheetData) {
  const sb = ensureClient();
  const payload = { ...sheetData };
  const { data, error } = await sb.from('sheets').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function supaListSheets(userId) {
  const sb = ensureClient();
  let query = sb.from('sheets').select('*').order('createdAt', { ascending: false });

  // If userId is provided, filter by it (though RLS should also enforce this)
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function supaGetSheet(id) {
  const sb = ensureClient();
  const { data, error } = await sb.from('sheets').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function supaUpdateSheet(id, updates) {
  const sb = ensureClient();
  const { data, error } = await sb.from('sheets').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function supaDeleteSheet(id) {
  const sb = ensureClient();
  const { error } = await sb.from('sheets').delete().eq('id', id);
  if (error) throw error;
  return { success: true };
}

// Points
export async function supaCreatePoint(pointData) {
  const sb = ensureClient();
  const { data, error } = await sb.from('points').insert([pointData]).select().single();
  if (error) throw error;
  return data;
}

export async function supaListPoints() {
  const sb = ensureClient();
  const { data, error } = await sb.from('points').select('*').order('createdAt', { ascending: false });
  if (error) throw error;
  return data;
}

export async function supaUpdatePoint(id, updates) {
  const sb = ensureClient();
  const { data, error } = await sb.from('points').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function supaDeletePoint(id) {
  const sb = ensureClient();
  const { error } = await sb.from('points').delete().eq('id', id);
  if (error) throw error;
  return { success: true };
}

export default {
  supaCreateSheet,
  supaListSheets,
  supaGetSheet,
  supaUpdateSheet,
  supaDeleteSheet,
  supaCreatePoint,
  supaListPoints,
  supaUpdatePoint,
  supaDeletePoint
};
