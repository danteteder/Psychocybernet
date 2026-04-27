import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Auth session refresh + redirect for unauthenticated users
// Next.js 16: "proxy" replaces the deprecated "middleware" convention
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

// Protect all routes except static files and API health
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
