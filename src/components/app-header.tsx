"use client";

import {
  Blocks,
  Building2,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { BrandMark } from "@/components/brand-mark";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/format";

const items = [
  { label: "Início", href: "/", icon: Home },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Hub", href: "/app/apps", icon: Blocks },
  { label: "Clientes/DB", href: "/db-admin", icon: Building2 },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/app/apps") {
    return pathname.startsWith("/apps") || pathname.startsWith("/app/apps");
  }
  return pathname.startsWith(href);
}

export function AppHeader({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
    } finally {
      window.location.assign("/login");
    }
  }

  return (
    <header className="no-print fixed inset-x-0 top-0 z-50 border-b border-[#dfe3df]/90 bg-[#f7f8f5]/92 backdrop-blur-xl">
      <div className="page-container flex h-[72px] items-center justify-between">
        <Link
          aria-label="Nexo Contábil — Início"
          className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#345c4526]"
          href="/"
          onClick={() => setOpen(false)}
        >
          <BrandMark />
          <span className="hidden text-[18px] font-semibold tracking-[-0.03em] text-ink sm:block">
            Nexo Contábil
          </span>
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden h-full items-stretch gap-1 md:flex"
        >
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-w-[112px] items-center justify-center gap-2.5 px-4 text-[13px] font-medium text-[#59635c] transition hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#345c4526]",
                  active && "font-semibold text-moss",
                )}
                href={item.href}
                key={item.href}
              >
                <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
                {item.label}
                <span
                  className={cn(
                    "absolute inset-x-4 bottom-0 h-[2px] origin-center rounded-full bg-moss transition-transform",
                    active ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            className="hidden items-center gap-2 rounded-control px-3 py-2 text-xs font-medium text-[#59635c] transition hover:bg-white hover:text-moss md:flex"
            href="/conta"
          >
            <UserRound size={16} />
            <span className="max-w-28 truncate">{userName}</span>
          </Link>
          <button
            aria-label="Sair do sistema"
            className="icon-button hidden md:inline-flex"
            disabled={signingOut}
            onClick={handleSignOut}
            title="Sair"
            type="button"
          >
            {signingOut ? <span className="button-spinner" /> : <LogOut size={18} />}
          </button>
          <button
            aria-expanded={open}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            className="icon-button md:hidden"
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          aria-label="Navegação móvel"
          className="border-t border-[#e2e6e2] bg-[#f7f8f5] px-5 py-3 md:hidden"
        >
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#59635c]",
                  active && "bg-[#eaf1eb] font-semibold text-moss",
                )}
                href={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} strokeWidth={1.8} />
                {item.label}
              </Link>
            );
          })}
          <div className="mt-2 border-t border-[#e2e6e2] pt-2">
            <Link
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#59635c]"
              href="/conta"
              onClick={() => setOpen(false)}
            >
              <UserRound size={18} strokeWidth={1.8} />
              {userName}
            </Link>
            <button
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-danger"
              disabled={signingOut}
              onClick={handleSignOut}
              type="button"
            >
              <LogOut size={18} strokeWidth={1.8} />
              {signingOut ? "Saindo..." : "Sair"}
            </button>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
