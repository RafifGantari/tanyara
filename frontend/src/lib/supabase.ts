import { createBrowserClient } from "@supabase/ssr";

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// Automatically strip /rest/v1 or trailing slashes if user pasted the PostgREST endpoint
export const cleanSupabaseUrl = rawSupabaseUrl.includes("/rest/v1")
  ? rawSupabaseUrl.split("/rest/v1")[0].replace(/\/+$/, "")
  : rawSupabaseUrl.replace(/\/+$/, "");

// Support both standard PUBLISHABLE_KEY and backward-compatible ANON_KEY
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export const isSupabaseConfigured = Boolean(cleanSupabaseUrl && supabasePublishableKey);

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured) {
    return null;
  }
  if (!browserClient) {
    browserClient = createBrowserClient(cleanSupabaseUrl, supabasePublishableKey);
  }
  return browserClient;
}

export async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}
