import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true } });
}

function ensureClient() {
  if (!supabase) throw new Error('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  return supabase;
}

// Auth
export async function supaRegister(email, password, metadata = {}) {
  const sb = ensureClient();
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  if (error) throw error;
  return data;
}

export async function supaLogin(email, password) {
  const sb = ensureClient();
  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function supaGetUser() {
  const sb = ensureClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function supaLogout() {
  const sb = ensureClient();
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}

// Sheets
export async function supaCreateSheet(sheetData) {
  const sb = ensureClient();

  // Debug: Check current auth state
  const { data: { user } } = await sb.auth.getUser();
  console.log('Debug: Current Supabase User:', user?.id);

  // Map camelCase userId to snake_case user_id for Supabase
  const payload = { ...sheetData };
  if ('userId' in payload) {
    payload.user_id = payload.userId;
    delete payload.userId;
  }
  if ('userEmail' in payload) {
    payload.user_email = payload.userEmail;
    delete payload.userEmail;
  }

  console.log('Debug: supaCreateSheet payload keys:', Object.keys(payload));
  console.log('Debug: Payload user_id:', payload.user_id);

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
  // Map camelCase userId to snake_case user_id if present
  const payload = { ...updates };
  if ('userId' in payload) {
    payload.user_id = payload.userId;
    delete payload.userId;
  }
  if ('userEmail' in payload) {
    payload.user_email = payload.userEmail;
    delete payload.userEmail;
  }

  const { data, error } = await sb.from('sheets').update(payload).eq('id', id).select().single();
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
  supaDeletePoint,
  supaRegister,
  supaLogin,
  supaGetUser,
  supaLogout
};
