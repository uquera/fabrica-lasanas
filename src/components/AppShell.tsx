"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

const NO_SIDEBAR_PATHS = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = !NO_SIDEBAR_PATHS.includes(pathname);

  if (!showSidebar) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      {/* Spacer que empuja el contenido según el estado del sidebar */}
      <main className="flex-1 min-w-0 lg:ml-[240px] transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
