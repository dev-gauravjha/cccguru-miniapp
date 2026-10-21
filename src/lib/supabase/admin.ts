import { createClient, SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient<any, "public", any> | null = null;

export function getSupabaseAdminClient(): SupabaseClient<any, "public", any> {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  adminClient = createClient<any>(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return adminClient;
}

