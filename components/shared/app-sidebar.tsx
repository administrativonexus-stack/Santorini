"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/database";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: React.ReactNode };

function HomeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>;
}
function CalIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
}
function ClockIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" className="w-[18px] h-[18px]"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>;
}
function CrownIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><path d="M2 17l3.5-9L10 13l3-7 4.5 11H2z"/></svg>;
}
function UserIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" className="w-[18px] h-[18px]"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
}
function ScissorsIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" className="w-[18px] h-[18px]"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"/></svg>;
}
function GridIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" className="w-[18px] h-[18px]"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
}
function UsersIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" className="w-[18px] h-[18px]"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
}
function ChartIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" className="w-[18px] h-[18px]"><path d="M3 3v18h18"/><path d="M18 9l-5 5-4-4-3 3"/></svg>;
}

const CLIENT_NAV: NavItem[] = [
  { label: "Início", href: "/client/dashboard", icon: <HomeIcon /> },
  { label: "Agendar", href: "/client/schedule", icon: <CalIcon /> },
  { label: "Histórico", href: "/client/history", icon: <ClockIcon /> },
  { label: "Assinatura VIP", href: "/client/subscription", icon: <CrownIcon /> },
  { label: "Perfil", href: "/client/profile", icon: <UserIcon /> },
];

const BARBER_NAV: NavItem[] = [
  { label: "Agenda", href: "/barber/dashboard", icon: <HomeIcon /> },
  { label: "Horários", href: "/barber/schedule", icon: <CalIcon /> },
  { label: "Disponibilidade", href: "/barber/availability", icon: <ClockIcon /> },
  { label: "Perfil", href: "/barber/profile", icon: <UserIcon /> },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <GridIcon /> },
  { label: "Barbeiros", href: "/admin/barbers", icon: <ScissorsIcon /> },
  { label: "Serviços", href: "/admin/services", icon: <GridIcon /> },
  { label: "Clientes", href: "/admin/clients", icon: <UsersIcon /> },
];

const OWNER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <GridIcon /> },
  { label: "Financeiro", href: "/admin/finance", icon: <ChartIcon /> },
  { label: "Barbeiros", href: "/admin/barbers", icon: <ScissorsIcon /> },
  { label: "Serviços", href: "/admin/services", icon: <GridIcon /> },
  { label: "Clientes", href: "/admin/clients", icon: <UsersIcon /> },
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
  avatarUrl?: string | null;
  isVip?: boolean;
  className?: string;
  onClose?: () => void;
}

export function AppSidebar({ role, fullName, avatarUrl, isVip, className, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV_BY_ROLE[role];

  const initials = fullName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className={`flex h-full w-60 flex-col bg-sidebar ${className ?? ""}`}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-primary">
            <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" strokeLinejoin="round"/>
            <path d="M8 10l2.5 2.5M16 10l-2.5 2.5M10.5 12.5L12 15l1.5-2.5" strokeLinecap="round"/>
          </svg>
          <span className="font-heading text-lg font-bold tracking-widest text-primary">BARBERFLIX</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors" aria-label="Fechar">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
              <path d="M3.293 3.293a1 1 0 011.414 0L8 6.586l3.293-3.293a1 1 0 111.414 1.414L9.414 8l3.293 3.293a1 1 0 01-1.414 1.414L8 9.414l-3.293 3.293a1 1 0 01-1.414-1.414L6.586 8 3.293 4.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        )}
      </div>

      {/* User profile block */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt={fullName} className="h-10 w-10 rounded-full object-cover border border-primary/30 shrink-0" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-primary font-heading font-bold text-sm shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
            <span className={cn(
              "inline-block text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded mt-0.5",
              isVip
                ? "text-primary bg-primary/15 border border-primary/25"
                : "text-muted-foreground bg-white/5 border border-white/10"
            )}>
              {isVip ? "♛ CLIENTE VIP" : role === "barber" ? "BARBEIRO" : role === "owner" ? "PROPRIETÁRIO" : role === "admin" ? "ADMIN" : "CLIENTE"}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/12 text-primary glow-gold-xs border border-primary/15"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80 border border-transparent"
              )}
            >
              <span className={isActive ? "text-primary" : "text-white/40"}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* VIP upsell for non-vip clients */}
      {role === "client" && !isVip && (
        <div className="mx-3 mb-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 p-3 space-y-2">
          <div>
            <p className="text-xs font-bold text-primary leading-tight">Eleve seu estilo.</p>
            <p className="text-xs font-bold text-primary leading-tight">Seja VIP.</p>
            <p className="text-[10px] text-muted-foreground mt-1 leading-snug">Cortes ilimitados, prioridade e benefícios exclusivos.</p>
          </div>
          <Link
            href="/client/subscription"
            className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-primary text-background text-[11px] font-bold py-2 hover:bg-primary/90 transition-colors"
          >
            ♛ QUERO SER VIP
          </Link>
        </div>
      )}

      {/* Sign out */}
      <div className="border-t border-white/[0.06] p-3">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full rounded-xl px-3 py-2 text-xs text-white/30 hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" className="w-4 h-4">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Sair
        </button>
      </div>
    </aside>
  );
}
