"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { BottomNav } from "@/components/client/bottom-nav";
import type { UserRole } from "@/types/database";

interface DashboardShellProps {
  role: UserRole;
  fullName: string;
  children: React.ReactNode;
}

export function DashboardShell({ role, fullName, children }: DashboardShellProps) {
  const [open, setOpen] = useState(false);
  const isClient = role === "client";

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ height: "100dvh" }}>
      {/* Desktop sidebar */}
      <AppSidebar role={role} fullName={fullName} className="hidden md:flex" />

      {/* Mobile overlay backdrop (barber/admin only) */}
      {!isClient && open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer (barber/admin only) */}
      {!isClient && (
        <AppSidebar
          role={role}
          fullName={fullName}
          onClose={() => setOpen(false)}
          className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-200 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
        {/* Mobile sticky header — only for barber/admin */}
        {!isClient && (
          <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-30 shrink-0">
            <button
              onClick={() => setOpen(true)}
              className="p-3 -ml-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Abrir menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <rect y="3" width="20" height="2" rx="1" />
                <rect y="9" width="20" height="2" rx="1" />
                <rect y="15" width="20" height="2" rx="1" />
              </svg>
            </button>
            <span className="font-heading text-lg font-bold tracking-widest text-primary">
              BARBERFLIX
            </span>
          </header>
        )}

        {/* Content area — extra bottom padding on mobile for client bottom nav */}
        <div className={`p-4 md:p-6 flex-1 ${isClient ? "pb-24 md:pb-6" : ""}`}>
          {children}
        </div>
      </main>

      {/* Bottom navigation — client only, mobile only */}
      {isClient && <BottomNav />}
    </div>
  );
}
