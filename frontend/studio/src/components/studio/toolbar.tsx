import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Pause, Play, RotateCcw, Search, SkipForward, ServerCog } from "lucide-react";
import { useStudio } from "@/hooks/use-studio";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./sidebar";
import { StatusDot } from "./panel";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

function ToolButton({
  label,
  onClick,
  active,
  children,
  shortcut,
  disabled,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={cn(
        "grid size-8 place-items-center rounded-lg border transition-colors",
        active ? "border-signal/50 bg-signal/15 text-signal" : "border-border bg-surface-raised/60 text-muted-foreground hover:border-signal/40 hover:text-foreground",
        disabled && "cursor-not-allowed opacity-50 hover:border-border hover:text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function Toolbar() {
  const { isConnected, status, playback, metrics, compileRtl, runSimulation, stepSimulation, resetSimulation, transportState } = useStudio();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setPaletteOpen((value) => !value);
        return;
      }
      if (typing || paletteOpen) return;
      if (event.code === "Space") {
        event.preventDefault();
        if (status !== "running") runSimulation();
      } else if (event.key === "s") {
        stepSimulation();
      } else if (event.key === "r") {
        resetSimulation();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, status, runSimulation, stepSimulation, resetSimulation]);

  const cycle = playback?.cycle || 0;
  const ipc = metrics?.ipc || 0;
  const health = transportState === "connected" ? (status === "running" ? "good" : "idle") : transportState === "connecting" || transportState === "reconnecting" ? "warn" : transportState === "backend-unavailable" || transportState === "websocket-failed" ? "fault" : "idle";
  const transportLabel =
    transportState === "connected"
      ? "core0"
      : transportState === "connecting"
        ? "connecting to Railway"
        : transportState === "reconnecting"
          ? "reconnecting"
          : transportState === "backend-unavailable"
            ? "backend unavailable"
            : transportState === "websocket-failed"
              ? "websocket failed"
              : "session closed";

  return (
    <header className="z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface/70 px-3 backdrop-blur-xl">
      <div className="flex items-center gap-1.5">
        <ToolButton label="Compile" shortcut="C" onClick={() => compileRtl()} disabled={!isConnected}>
          <ServerCog className={cn("size-4", status === "compiled" ? "text-good" : "")} />
        </ToolButton>
        <div className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
        <ToolButton label={status === "running" ? "Running" : "Run simulation"} shortcut="Space" active={status === "running"} onClick={() => runSimulation()} disabled={!isConnected}>
          {status === "running" ? <Pause className="size-4" /> : <Play className="size-4" />}
        </ToolButton>
        <ToolButton label="Step one cycle" shortcut="S" onClick={() => stepSimulation()} disabled={!isConnected}>
          <SkipForward className="size-4" />
        </ToolButton>
        <ToolButton label="Reset core" shortcut="R" onClick={() => resetSimulation()} disabled={!isConnected}>
          <RotateCcw className="size-4" />
        </ToolButton>
      </div>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="ml-auto flex h-8 min-w-0 max-w-md flex-1 items-center gap-2 rounded-lg border border-border bg-surface-raised/60 px-2.5 text-[12px] text-muted-foreground transition-colors hover:border-signal/40"
      >
        <Search className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">Search modules, registers, commands...</span>
        <kbd className="mono-num ml-auto shrink-0 rounded border border-border px-1 text-[10px]">Cmd+K</kbd>
      </button>

      <div className="mono-num hidden items-center gap-2 rounded-lg border border-border bg-surface-raised/60 px-2.5 py-1.5 text-[11px] lg:flex">
        <StatusDot tone={health} />
        <span className="text-muted-foreground">{transportLabel}</span>
        <span className="text-foreground">{cycle.toLocaleString()} cy</span>
        <span className="text-muted-foreground/70">IPC {ipc.toFixed(3)}</span>
      </div>

      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Jump to module or run a command..." />
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
            <CommandItem value="run simulation" onSelect={() => { runSimulation(); setPaletteOpen(false); }}>
              <Play className="size-4" /> Run simulation
            </CommandItem>
            <CommandItem value="step cycle" onSelect={() => { stepSimulation(); setPaletteOpen(false); }}>
              <SkipForward className="size-4" /> Step one cycle
            </CommandItem>
            <CommandItem value="reset core" onSelect={() => { resetSimulation(); setPaletteOpen(false); }}>
              <RotateCcw className="size-4" /> Reset core
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
