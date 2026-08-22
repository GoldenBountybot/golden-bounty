import { supabase } from '@/api/supabaseClient';
import { FUNCTIONS } from '@/api/supabaseMaps';

// Calls a Supabase Edge Function using the legacy backend-function name.
// Returns { data, status } so existing `res.data` call sites keep working.
export async function invoke(name, payload = {}) {
  const slug = FUNCTIONS[name] || name;
  const { data, error } = await supabase.functions.invoke(slug, { body: payload });
  if (error) {
    // Edge functions return their error details in the response body.
    let detail = null;
    try { detail = await error.context?.json?.(); } catch { /* non-JSON body */ }
    const err = new Error(detail?.error || error.message || 'Function failed');
    err.status = error.context?.status || 500;
    err.data = detail;
    throw err;
  }
  return { data, status: 200 };
}

// File uploads go to the public `media` storage bucket.
export async function uploadFile({ file }) {
  const safeName = String(file?.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `uploads/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
  const { error } = await supabase.storage.from('media').upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return { file_url: data.publicUrl };
}