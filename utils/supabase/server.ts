import { createClient } from "@supabase/supabase-js"

export function createAdminClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY não definidos")
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  })
}
