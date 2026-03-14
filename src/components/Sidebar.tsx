"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Truck,
  AlertTriangle,
  DollarSign,
  FileText,
  BarChart2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",      href: "/",             icon: LayoutDashboard },
  { label: "Clientes",       href: "/clientes",     icon: Users },
  { label: "Nuevo Despacho", href: "/envios/nuevo", icon: Truck },
  { label: "Mermas",         href: "/mermas",       icon: AlertTriangle },
  { label: "Liquidaciones",  href: "/liquidaciones",icon: DollarSign },
  { label: "Guías",          href: "/guias",        icon: FileText },
  { label: "Reportes",       href: "/reportes",     icon: BarChart2 },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40 flex flex-col
          bg-zinc-950 border-r border-zinc-800
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-[68px]" : "w-[240px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center border-b border-zinc-800 shrink-0 ${collapsed ? "justify-center py-4 px-2" : "px-5 py-4"}`}>
          {collapsed ? (
            <div className="w-9 h-9 relative flex items-center justify-center">
              {!logoError ? (
                <Image src="/logo.png" alt="Doña Any" fill className="object-contain" unoptimized onError={() => setLogoError(true)} />
              ) : (
                <span className="text-orange-500 font-black text-lg">D</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 relative shrink-0 flex items-center justify-center">
                {!logoError ? (
                  <Image src="/logo.png" alt="Doña Any" fill className="object-contain" unoptimized onError={() => setLogoError(true)} />
                ) : (
                  <div className="w-full h-full bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/20">
                    <span className="text-orange-500 font-black text-xl">A</span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-sm leading-tight truncate">Doña Any</p>
                <p className="text-zinc-500 text-[10px] truncate">Con molto amore</p>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-0.5 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-150 group relative
                      ${active
                        ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-transparent"
                      }
                      ${collapsed ? "justify-center" : ""}
                    `}
                  >
                    <Icon className={`shrink-0 ${active ? "text-orange-400" : "text-zinc-500 group-hover:text-white"} transition-colors`} size={18} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {collapsed && (
                      <span className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded-lg
                        opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-zinc-800 p-2 space-y-1">
          <button
            onClick={async () => { await signOut({ redirect: false }); window.location.href = "/login"; }}
            title={collapsed ? "Cerrar sesión" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent
              hover:border-red-500/20 group relative ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Cerrar sesión</span>}
            {collapsed && (
              <span className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded-lg
                opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                Cerrar sesión
              </span>
            )}
          </button>

          {/* Collapse toggle — desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden lg:flex w-full items-center gap-3 px-3 py-2 rounded-xl text-xs
              text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/40 transition-all
              ${collapsed ? "justify-center" : ""}`}
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Colapsar</span></>}
          </button>
        </div>
      </aside>
    </>
  );
}
