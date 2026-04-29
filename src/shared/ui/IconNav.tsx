"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Target,
  CalendarRange,
  Calendar,
  Users,
  Focus,
  Bot,
  ShoppingBag,
  Settings,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// Icon-only sidebar nav items
const navItems = [
  { href: "/week", icon: CalendarDays, label: "Week" },
  { href: "/focus", icon: Focus, label: "Focus" },
  { href: "/month", icon: CalendarRange, label: "Month" },
  { href: "/year", icon: Calendar, label: "Year" },
  { href: "/team", icon: Users, label: "Team" },
  { href: "/agent", icon: Bot, label: "Hermes" },
  { href: "/calendar", icon: Target, label: "Calendar" },
  { href: "/shopify", icon: ShoppingBag, label: "Shopify" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

// Minimal icon-only sidebar navigation
// Shapes over text: icons only, labels appear on hover
export function IconNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="flex w-14 flex-col items-center border-r border-border py-6 gap-1">
      {/* Logo mark: small black square */}
      <div className="mb-6 h-6 w-6 bg-active" />

      {/* Nav icons */}
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            title={label}
            className={`group relative flex h-10 w-10 items-center justify-center
                        rounded transition-colors
                        ${isActive ? "bg-active text-bg" : "text-text-muted hover:bg-hover hover:text-text"}`}
          >
            <Icon size={18} strokeWidth={1.5} />
            {/* Hover tooltip */}
            <span
              className="pointer-events-none absolute left-full ml-2 rounded bg-active
                         px-2 py-1 text-xs text-bg opacity-0 transition-opacity
                         group-hover:opacity-100 whitespace-nowrap"
            >
              {label}
            </span>
          </Link>
        );
      })}

      {/* Spacer pushes sign-out to bottom */}
      <div className="flex-1" />

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        title="Sign out"
        className="group relative flex h-10 w-10 items-center justify-center
                   rounded text-text-muted transition-colors hover:bg-hover hover:text-text"
      >
        <LogOut size={18} strokeWidth={1.5} />
        <span
          className="pointer-events-none absolute left-full ml-2 rounded bg-active
                     px-2 py-1 text-xs text-bg opacity-0 transition-opacity
                     group-hover:opacity-100 whitespace-nowrap"
        >
          Sign out
        </span>
      </button>
    </nav>
  );
}
