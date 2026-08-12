import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Toolbar } from "./toolbar";
import { StatusBar } from "./status-bar";
import { MobileNav } from "./mobile-nav";

/**
 * Application chrome. A fixed-height flex column so the workspace is the only
 * scrolling region — panels manage their own overflow with `min-height: 0`.
 */
export function StudioShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Toolbar />
        <MobileNav />
        <main
          id="workspace"
          className="grid-backdrop min-h-0 min-w-0 flex-1 overflow-auto p-3 md:p-4"
          tabIndex={-1}
        >
          {children}
        </main>
        <StatusBar />
      </div>
    </div>
  );
}
