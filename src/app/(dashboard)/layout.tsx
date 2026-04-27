import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { IconNav } from "@/shared/ui/IconNav";

// Dashboard shell with minimal icon-only sidebar navigation
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Double-check auth (middleware should handle this, but defense in depth)
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left sidebar: icon-only nav */}
      <IconNav />

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
