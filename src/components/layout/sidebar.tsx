"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Kanban,
  Building2,
  Handshake,
  Cog,
  ChevronLeft,
  ChevronRight,
  Wrench,
  LogOut,
} from "lucide-react";
import { logout } from "@/lib/actions/auth-actions";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "DASHBOARD", icon: LayoutDashboard },
  { href: "/pipeline", label: "PIPELINE", icon: Kanban },
  { href: "/foretag", label: "KUNDER", icon: Building2 },
  { href: "/aterforsaljare", label: "ÅTERFÖRSÄLJARE", icon: Handshake },
  { href: "/prospekt", label: "PROSPEKT", icon: Users, indent: true },
  { href: "/maskiner", label: "MASKINER", icon: Wrench },
  { href: "/installningar", label: "INSTÄLLNINGAR", icon: Cog },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col bg-[#1A1A1A] text-[#FAFAFA] transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_20%_50%,#333333_0%,transparent_50%)]" />

      {/* Logo area */}
      <div className="relative z-10 flex items-center justify-between px-4 py-5 border-b border-[#333333]/60">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/forsell-logo-white.png"
              alt="Forsell System"
              width={130}
              height={38}
              className="h-auto w-[130px] opacity-90 hover:opacity-100 transition-opacity"
              priority
            />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 hover:bg-[#333333] transition-colors"
          aria-label={collapsed ? "Expandera meny" : "Minimera meny"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-[#9A9A9A]" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-[#9A9A9A]" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 space-y-0.5 px-2 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          const isIndented = "indent" in item && item.indent;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 text-[11px] font-medium tracking-[0.12em] transition-all duration-200",
                "font-condensed",
                isIndented && !collapsed && "opacity-90",
                isActive
                  ? "text-white border-l-2 border-[#F2BB01] rounded-none bg-[#333333]/40"
                  : "text-[#9A9A9A] hover:bg-[#333333]/60 hover:text-[#FAFAFA] rounded-lg"
              )}
            >
              <Icon
                className={cn(
                  "shrink-0 transition-colors",
                  "h-[18px] w-[18px]",
                  isActive ? "text-[#F2BB01]" : "text-[#808080] group-hover:text-[#9A9A9A]"
                )}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="relative z-10 border-t border-[#333333]/60 px-2 py-3">
        <form action={logout}>
          <button
            type="submit"
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[11px] font-medium tracking-[0.12em] transition-all duration-200",
              "font-condensed text-[#9A9A9A] hover:bg-[#333333]/60 hover:text-[#FAFAFA]"
            )}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0 text-[#808080]" />
            {!collapsed && <span>LOGGA UT</span>}
          </button>
        </form>
        {!collapsed && (
          <div className="px-3 mt-3">
            <p className="font-condensed text-[9px] text-[#808080] tracking-[0.2em]">
              FORSELL SYSTEM AB
            </p>
            <p className="text-[11px] text-[#656565] mt-0.5 font-display italic">
              Maskiner som transporterar värde
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
