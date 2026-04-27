import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client (used in client components)
// Uses a singleton to avoid creating multiple clients
let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;

  // During prerendering (build time), env vars may be missing.
  // Return a stub that won't crash the build -- it's never actually called at build time.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Provide placeholder values for the prerender pass.
    // These are never used -- the real client is created in the browser.
    return createBrowserClient("https://placeholder.supabase.co", "placeholder");
  }

  client = createBrowserClient(url, key);
  return client;
}
