"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Início",
    href: "/client/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    label: "Agendar",
    href: "/client/schedule",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    label: "Histórico",
    href: "/client/history",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="w-[22px] h-[22px]">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    label: "VIP",
    href: "/client/subscription",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <path d="M2 17l3.5-9L10 13l3-7 4.5 11H2z" />
      </svg>
    ),
  },
  {
    label: "Perfil",
    href: "/client/profile",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="w-[22px] h-[22px]">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div
      className="fixed bottom-3 left-3 right-3 z-50 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <nav className="max-w-[400px] mx-auto rounded-2xl bg-[#111]/95 backdrop-blur-xl border border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.7)] h-[60px] flex items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <motion.div key={item.href} whileTap={{ scale: 0.82 }}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-[3px] px-3 py-1.5 rounded-xl transition-colors duration-200 min-w-[52px]",
                  isActive ? "text-primary" : "text-white/30"
                )}
              >
                <span className={cn(
                  "transition-all duration-200",
                  isActive && "drop-shadow-[0_0_6px_rgba(201,169,110,0.6)]"
                )}>
                  {item.icon}
                </span>
                <span className={cn(
                  "text-[10px] font-medium tracking-wide leading-none",
                  isActive ? "text-primary" : "text-white/25"
                )}>
                  {item.label}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </div>
  );
}
