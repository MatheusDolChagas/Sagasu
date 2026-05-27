import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/** Deve ser igual ao `id` do bucket em Storage (ex.: SIGHTINGS ou sightings). */
const SIGHTINGS_BUCKET =
  import.meta.env.VITE_SUPABASE_SIGHTINGS_BUCKET ?? 'sightings';

if (url && anonKey) {
  client = createClient(url, anonKey);
}

export function isSupabaseConfigured(): boolean {
  return client !== null;
}

const CASES_BUCKET =
  import.meta.env.VITE_SUPABASE_CASES_BUCKET ?? 'cases';
const AVATARS_BUCKET =
  import.meta.env.VITE_SUPABASE_AVATARS_BUCKET ?? 'avatars';

export async function uploadCasePhoto(file: File): Promise<string> {
  if (!client) {
    throw new Error(
      'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env do frontend.',
    );
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `cases/${crypto.randomUUID()}-${safeName}`;
  const { error } = await client.storage.from(CASES_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    throw new Error(error.message || 'Falha no upload da foto do caso');
  }
  const { data } = client.storage.from(CASES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadProfileAvatar(
  userId: string,
  file: File,
): Promise<string> {
  if (!client) {
    throw new Error(
      'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env do frontend.',
    );
  }
  const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
  const path = `avatars/${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await client.storage.from(AVATARS_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    throw new Error(error.message || 'Falha no upload do avatar');
  }
  const { data } = client.storage.from(AVATARS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Bucket no Supabase Storage + políticas RLS (INSERT para anon, SELECT público). */
export async function uploadSightingPhoto(file: File): Promise<string> {
  if (!client) {
    throw new Error(
      'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env do frontend.',
    );
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `sightings/${crypto.randomUUID()}-${safeName}`;

  const { error } = await client.storage.from(SIGHTINGS_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw new Error(error.message || 'Falha no upload da foto');
  }

  const { data } = client.storage.from(SIGHTINGS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
