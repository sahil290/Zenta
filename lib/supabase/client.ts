import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Single consistent client using standard supabase-js
// This stores session in localStorage which works reliably
let client: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (client) return client
  client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        storageKey: 'zenta-auth',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    }
  )
  return client
}