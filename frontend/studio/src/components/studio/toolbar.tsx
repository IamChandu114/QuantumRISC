import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell, ChevronDown, Gauge, Pause, Play, RotateCcw, Search, SkipForward, Zap, Cpu, ServerCog
} from "lucide-react";
import { useStudio } from "@/hooks/use-studio";
import { SIM_SPEEDS } from "@/lib/studio/store";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./sidebar";
import { StatusDot } from "./panel";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const FREQUENCIES = [400, 800, 1200, 1800, 2400, 3200] as const;

function ToolButton({
  label, onClick, active, children, shortcut,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  shortcut?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={cn(
        "grid size-8 place-items-center rounded-lg border transition-colors",
        active
          ? "border-signal/50 bg-signal/15 text-signal"
          : "border-border bg-surface-raised/60 text-muted-foreground hover:border-signal/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function Toolbar() {
  const { state, sim, store } = useStudio();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (typing || paletteOpen) return;
      if (e.code === "Space") {
        e.preventDefault();
        store.toggle();
      } else if (e.key === "s") {
        store.stepOnce();
      } else if (e.key === "S") {
        store.stepMany(10);
      } else if (e.key === "r") {
        store.reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store, paletteOpen]);

  const unread = state.notifications.length;
  const health = useMemo(() => {
    const acc = sim.predictor.accuracy;
    if (sim.cycle === 0) return "idle" as const;
    if (acc < 0.6 || sim.metrics.ipc < 0.35) return "warn" as const;
    return "good" as const;
  }, [sim.cycle, sim.predictor.accuracy, sim.metrics.ipc]);

  return (
    <header className="z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface/70 px-3 backdrop-blur-xl">
      <div className="flex items-center gap-1.5">
        <ToolButton label="Compile & Run" shortcut="C" onClick={() => { void store.compileAndRun(); }}>
          <ServerCog className={cn("size-4", state.backendStatus === "connected" ? "text-good" : "")} />
        </ToolButton>
        <div className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
        <ToolButton label={state.running ? "Pause simulation" : "Run simulation"} shortcut="Space" active={state.running} onClick={() => store.toggle()}>
          {state.running ? <Pause className="size-4" /> : <Play className="size-4" />}
        </ToolButton>
        <ToolButton label="Step one cycle" shortcut="S" onClick={() => store.stepOnce()}>
          <SkipForward className="size-4" />
        </ToolButton>
        <ToolButton label="Step ten cycles" shortcut="Shift+S" onClick={() => store.stepMany(10)}>
          <Zap className="size-4" />
        </ToolButton>
        <ToolButton label="Reset core" shortcut="R" onClick={() => store.reset()}>
          <RotateCcw className="size-4" />
        </ToolButton>
      </div>

      <div className="mx-1 h-6 w-px bg-border" aria-hidden="true" />

      <DropdownMenu>
        <DropdownMenuTrigger className="mono-num flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface-raised/60 px-2.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
          <Gauge className="size-3.5" aria-hidden="true" />
          {state.frequencyMhz} MHz
          <ChevronDown className="size-3 opacity-60" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel className="text-[11px]">Core frequency</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {FREQUENCIES.map((f) => (
            <DropdownMenuItem key={f} className="mono-num text-[12px]" onSelect={() => store.setFrequency(f)}>
              {f} MHz
              {f === state.frequencyMhz ? <span className="ml-auto text-signal">●</span> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger className="mono-num flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface-raised/60 px-2.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
          {state.speed}× cycles/s
          <ChevronDown className="size-3 opacity-60" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel className="text-[11px]">Simulation rate</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SIM_SPEEDS.map((s) => (
            <DropdownMenuItem key={s} className="mono-num text-[12px]" onSelect={() => store.setSpeed(s)}>
              {s} cycles / second
              {s === state.speed ? <span className="ml-auto text-signal">●</span> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="ml-auto flex h-8 min-w-0 max-w-md flex-1 items-center gap-2 rounded-lg border border-border bg-surface-raised/60 px-2.5 text-[12px] text-muted-foreground transition-colors hover:border-signal/40"
      >
        <Search className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">Search modules, registers, commands…</span>
        <kbd className="mono-num ml-auto shrink-0 rounded border border-border px-1 text-[10px]">⌘K</kbd>
      </button>

      <div className="mono-num hidden items-center gap-2 rounded-lg border border-border bg-surface-raised/60 px-2.5 py-1.5 text-[11px] lg:flex">
        <StatusDot tone={health} />
        <span className="text-muted-foreground">core0</span>
        <span className="text-foreground">{sim.cycle.toLocaleString()} cy</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Notifications (${unread})`}
          className="relative grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-surface-raised/60 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Bell className="size-4" aria-hidden="true" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-signal text-[9px] font-bold text-primary-foreground">
              {unread}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between text-[11px]">
            Event log
            <button type="button" className="text-[10px] text-muted-foreground hover:text-foreground" onClick={() => store.clearNotifications()}>
              Clear
            </button>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {state.notifications.length === 0 ? (
            <div className="px-2 py-6 text-center text-[12px] text-muted-foreground">No events recorded</div>
          ) : (
            state.notifications.map((n) => (
              <div key={n.id} className="px-2 py-1.5">
                <div className="flex items-center gap-2 text-[12px]">
                  <StatusDot tone={n.level === "error" ? "fault" : n.level === "warn" ? "warn" : "good"} />
                  <span className="font-medium">{n.title}</span>
                </div>
                <p className="mono-num pl-4 text-[10px] text-muted-foreground">{n.detail}</p>
              </div>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Jump to module or run a command…" />
        <CommandList>
          <CommandEmpty>No matching command.</CommandEmpty>
          <CommandGroup heading="Modules">
            {NAV_ITEMS.map((item) => (
              <CommandItem
                key={item.to}
                value={`${item.label} ${item.hint}`}
                onSelect={() => {
                  setPaletteOpen(false);
                  void navigate({ to: item.to });
                }}
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
                <span className="mono-num ml-auto text-[10px] text-muted-foreground">{item.hint}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Transport">
            <CommandItem value="run pause toggle" onSelect={() => { store.toggle(); setPaletteOpen(false); }}>
              <Play className="size-4" /> Toggle run / pause
            </CommandItem>
            <CommandItem value="step cycle" onSelect={() => { store.stepOnce(); setPaletteOpen(false); }}>
              <SkipForward className="size-4" /> Step one cycle
            </CommandItem>
            <CommandItem value="step 100 cycles fast forward" onSelect={() => { store.stepMany(100); setPaletteOpen(false); }}>
              <Zap className="size-4" /> Advance 100 cycles
            </CommandItem>
            <CommandItem value="reset core" onSelect={() => { store.reset(); setPaletteOpen(false); }}>
              <RotateCcw className="size-4" /> Reset core
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
