import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity, Binary, Boxes, CircuitBoard, Cpu, Gauge, GitBranch, LayoutDashboard,
  MemoryStick, PanelLeftClose, PanelLeftOpen, ShieldCheck, Waves, Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useStudio } from "@/hooks/use-studio";
import { cn } from "@/lib/utils";
import { StatusDot } from "./panel";

export interface NavItem {
  to: string;
  label: string;
  hint: string;
  icon: typeof Cpu;
  group: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", hint: "Core telemetry", icon: LayoutDashboard, group: "Overview" },
  { to: "/pipeline", label: "Pipeline Viewer", hint: "IF · ID · EX · MEM · WB", icon: CircuitBoard, group: "Microarchitecture" },
  { to: "/registers", label: "Register File", hint: "32 × 32-bit GPR", icon: Binary, group: "Microarchitecture" },
  { to: "/hazards", label: "Hazard Analyzer", hint: "RAW · WAR · WAW", icon: Zap, group: "Microarchitecture" },
  { to: "/memory", label: "Memory Viewer", hint: "Physical hex dump", icon: MemoryStick, group: "Memory System" },
  { to: "/cache", label: "Cache Explorer", hint: "L1I · L1D", icon: Boxes, group: "Memory System" },
  { to: "/branch", label: "Branch Predictor", hint: "Gshare · BTB", icon: GitBranch, group: "Memory System" },
  { to: "/waveforms", label: "Waveform Viewer", hint: "VCD timing", icon: Waves, group: "Analysis" },
  { to: "/verification", label: "Verification", hint: "Assertions · coverage", icon: ShieldCheck, group: "Analysis" },
  { to: "/performance", label: "Performance", hint: "IPC · CPI · stalls", icon: Gauge, group: "Analysis" },
];

const MIN_WIDTH = 220;
const MAX_WIDTH = 420;

export function Sidebar() {
  const { state, sim, store } = useStudio();
  const asideRef = useRef<HTMLElement>(null);
  const draggingRef = useRef(false);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      draggingRef.current = true;
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current || !asideRef.current) return;
      const left = asideRef.current.getBoundingClientRect().left;
      store.setSidebarWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, event.clientX - left)));
    },
    [store],
  );

  const endDrag = useCallback(() => {
    draggingRef.current = false;
  }, []);

  // Keyboard resize for pointer-free operation.
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") store.setSidebarWidth(state.sidebarWidth - 16);
      if (event.key === "ArrowRight") store.setSidebarWidth(state.sidebarWidth + 16);
    },
    [state.sidebarWidth, store],
  );

  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        store.toggleSidebar();
      }
    };
    window.addEventListener("keydown", onGlobalKey);
    return () => window.removeEventListener("keydown", onGlobalKey);
  }, [store]);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const collapsed = state.sidebarCollapsed;
  const groups = [...new Set(NAV_ITEMS.map((i) => i.group))];

  return (
    <aside
      ref={asideRef}
      className="relative z-20 hidden shrink-0 flex-col border-r border-border bg-surface/70 backdrop-blur-xl md:flex"
      style={{ width: collapsed ? 68 : state.sidebarWidth }}
      aria-label="Module navigation"
    >
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg border border-signal/40 bg-signal/10">
          <Cpu className="size-4 text-signal" aria-hidden="true" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold tracking-tight">QuantumRISC Studio</div>
            <div className="mono-num truncate text-[10px] text-muted-foreground">RV32I · 5-stage in-order</div>
          </div>
        )}
      </div>

      <nav className="panel-scroll flex-1 px-2 py-3" aria-label="Engineering modules">
        {groups.map((group) => (
          <div key={group} className="mb-4">
            {!collapsed && (
              <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                {group}
              </div>
            )}
            <ul className="space-y-0.5">
              {NAV_ITEMS.filter((i) => i.group === group).map((item) => {
                const active = pathname === item.to;
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
                        active
                          ? "bg-signal/10 text-signal ring-1 ring-signal/25"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      {!collapsed && (
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{item.label}</span>
                          <span className="mono-num block truncate text-[10px] opacity-60">{item.hint}</span>
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-border p-2.5">
        {!collapsed && (
          <div className="mb-2 rounded-lg border border-border/70 bg-surface-raised/50 px-2.5 py-2">
            <div className="flex items-center gap-2 text-[11px]">
              <StatusDot tone={state.running ? "good" : "idle"} />
              <span className="text-muted-foreground">{state.running ? "Simulating" : "Halted"}</span>
              <span className="mono-num ml-auto text-foreground">{sim.cycle.toLocaleString()} cy</span>
            </div>
            <div className="mono-num mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
              <Activity className="size-3" aria-hidden="true" />
              IPC {sim.metrics.ipc.toFixed(3)} · {state.frequencyMhz} MHz
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => store.toggleSidebar()}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          {!collapsed && <span>Collapse</span>}
          {!collapsed && <kbd className="mono-num ml-auto text-[10px] opacity-60">⌘B</kbd>}
        </button>
      </div>

      {!collapsed && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
          className="absolute inset-y-0 -right-1 w-2 cursor-col-resize touch-none hover:bg-signal/30"
        />
      )}
    </aside>
  );
}
