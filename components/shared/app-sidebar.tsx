"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/database";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: string };

const CLIENT_NAV: NavItem[] = [
  { label: "Início", href: "/client/dashboard", icon: "⬡" },
  { label: "Agendar", href: "/client/schedule", icon: "📅" },
  { label: "Histórico", href: "/client/history", icon: "🕐" },
  { label: "Assinatura VIP", href: "/client/subscription", icon: "♛" },
  { label: "Perfil", href: "/client/profile", icon: "◉" },
];

const BARBER_NAV: NavItem[] = [
  { label: "Agenda", href: "/barber/dashboard", icon: "⬡" },
  { label: "Horários", href: "/barber/schedule", icon: "📅" },
  { label: "Disponibilidade", href: "/barber/availability", icon: "⏰" },
  { label: "Perfil", href: "/barber/profile", icon: "◉" },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "⬡" },
  { label: "Barbeiros", href: "/admin/barbers", icon: "✂" },
  { label: "Serviços", href: "/admin/services", icon: "◈" },
  { label: "Clientes", href: "/admin/clients", icon: "◉" },
];

const OWNER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "⬡" },
  { label: "Financeiro", href: "/admin/finance", icon: "◆" },
  { label: "Barbeiros", href: "/admin/barbers", icon: "✂" },
  { label: "Serviços", href: "/admin/services", icon: "◈" },
  { label: "Clientes", href: "/admin/clients", icon: "◉" },
];

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  client: CLIENT_NAV,
  barber: BARBER_NAV,
  owner: OWNER_NAV,
  admin: ADMIN_NAV,
};

interface AppSidebarProps {
  role: UserRole;
  fullName: string;
}

export function AppSidebar({ role, fullName }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV_BY_ROLE[role];

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-border">
        <span className="font-heading text-xl font-bold tracking-widest text-primary">
          BARBERFLIX
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === item.href || pathname.startsWith(item.href + "/")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User + Sign Out */}
      <div className="border-t border-border p-4 space-y-2">
        <p className="truncate text-xs font-medium text-foreground">{fullName}</p>
        <p className="text-xs text-muted-foreground capitalize">{role === "owner" ? "Proprietário" : role === "barber" ? "Barbeiro" : role === "admin" ? "Admin" : "Cliente"}</p>
        <button
          onClick={handleSignOut}
          className="w-full rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors text-left"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
