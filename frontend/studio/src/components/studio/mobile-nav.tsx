import { Link, useRouterState } from "@tanstack/react-router";
import { NAV_ITEMS } from "./sidebar";
import { cn } from "@/lib/utils";

/** Horizontal module rail shown below the toolbar on small viewports. */
export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-border bg-surface/60 px-3 py-2 md:hidden"
      aria-label="Modules"
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px]",
              active
                ? "border-signal/40 bg-signal/10 text-signal"
                : "border-border text-muted-foreground",
            )}
          >
            <item.icon className="size-3.5" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
