import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Standard instrument panel: sticky header, independently scrolling body. */
export function Panel({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
  scroll = true,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  scroll?: boolean;
}) {
  return (
    <section
      className={cn("glass-panel flex min-h-0 min-w-0 flex-col rounded-xl", className)}
      aria-label={title}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/70 px-4 py-2.5">
        <div className="min-w-0">
          <h2 className="truncate text-[13px] font-semibold tracking-wide text-foreground/90">{title}</h2>
          {subtitle ? (
            <p className="mono-num truncate text-[11px] text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
      </header>
      <div className={cn("min-h-0 min-w-0 flex-1", scroll && "panel-scroll", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Metric({
  label,
  value,
  unit,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  tone?: "default" | "good" | "warn" | "fault" | "signal";
}) {
  const toneClass = {
    default: "text-foreground",
    good: "text-good",
    warn: "text-warn",
    fault: "text-fault",
    signal: "text-signal",
  }[tone];

  return (
    <div className="rounded-lg border border-border/70 bg-surface-raised/50 px-3 py-2.5">
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={cn("mono-num text-xl font-semibold leading-none", toneClass)}>{value}</span>
        {unit ? <span className="text-[11px] text-muted-foreground">{unit}</span> : null}
      </div>
      {hint ? <div className="mono-num mt-1 text-[10px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export function Bar({ value, tone = "signal" }: { value: number; tone?: "signal" | "good" | "warn" | "fault" }) {
  const bg = { signal: "bg-signal", good: "bg-good", warn: "bg-warn", fault: "bg-fault" }[tone];
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-200 ease-out", bg)}
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
      />
    </div>
  );
}

export function Sparkline({
  data,
  height = 40,
  tone = "signal",
  max,
}: {
  data: readonly number[];
  height?: number;
  tone?: "signal" | "good" | "warn" | "fault";
  max?: number;
}) {
  const stroke = { signal: "var(--signal)", good: "var(--good)", warn: "var(--warn)", fault: "var(--fault)" }[tone];
  if (data.length < 2) return <div style={{ height }} className="rounded bg-muted/40" />;
  const peak = max ?? Math.max(...data, 0.0001);
  const points = data
    .map((d, i) => `${(i / (data.length - 1)) * 100},${100 - (d / peak) * 100}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height }} className="w-full" aria-hidden="true">
      <polyline points={`0,100 ${points} 100,100`} fill={stroke} opacity="0.12" />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function StatusDot({ tone }: { tone: "good" | "warn" | "fault" | "idle" }) {
  const cls = {
    good: "bg-good shadow-[0_0_10px_-1px_var(--good)]",
    warn: "bg-warn shadow-[0_0_10px_-1px_var(--warn)]",
    fault: "bg-fault shadow-[0_0_10px_-1px_var(--fault)]",
    idle: "bg-muted-foreground/60",
  }[tone];
  return <span className={cn("inline-block size-2 shrink-0 rounded-full", cls)} aria-hidden="true" />;
}

export function Chip({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "signal" | "good" | "warn" | "fault" | "violet";
}) {
  const cls = {
    default: "border-border bg-muted/60 text-muted-foreground",
    signal: "border-signal/40 bg-signal/10 text-signal",
    good: "border-good/40 bg-good/10 text-good",
    warn: "border-warn/40 bg-warn/10 text-warn",
    fault: "border-fault/40 bg-fault/10 text-fault",
    violet: "border-violet-signal/40 bg-violet-signal/10 text-violet-signal",
  }[tone];
  return (
    <span className={cn("mono-num rounded-md border px-1.5 py-0.5 text-[10px] font-medium", cls)}>{children}</span>
  );
}
