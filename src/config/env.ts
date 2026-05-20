const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const allowGuestScans = import.meta.env.VITE_ALLOW_GUEST_SCANS === 'true'

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  allowGuestScans,
  isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
}

export function getSupabaseEnv() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error(
      'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.',
    )
  }

  return {
    url: env.supabaseUrl,
    anonKey: env.supabaseAnonKey,
  }
}
