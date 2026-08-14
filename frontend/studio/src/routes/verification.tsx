import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useStudio } from "@/hooks/use-studio";
import { Bar, Chip, Metric, Panel } from "@/components/studio/panel";
import { asNumber, derivedProgramHistory, hex, timelineSamples } from "@/lib/studio/live";

export const Route = createFileRoute("/verification")({
  component: VerificationPage,
});

function VerificationPage() {
  const { compile, run, waveforms, metrics, hazards, playback, isConnected, vcd, verification } = useStudio();
  const samples = useMemo(() => timelineSamples(waveforms), [waveforms]);
  const history = useMemo(() => derivedProgramHistory(samples, 120), [samples]);
  const verificationFiles = verification?.files ?? [];
  const verificationLogs = verification?.logs ?? {};
  const verificationSignals = verification?.signals ?? [];

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
      <Panel title="Verification workstation" subtitle="compile, run, waveform, and diagnostics tracking from the backend" className="xl:col-span-7">
        <div className="space-y-1.5 p-3">
          <div className="rounded-lg border border-border/70 bg-surface-raised/30 px-3 py-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Metric
                label="Compile"
                value={compile?.ok === true ? "PASS" : compile?.ok === false ? "FAIL" : "PENDING"}
                tone={compile?.ok === true ? "good" : compile?.ok === false ? "fault" : "warn"}
              />
              <Metric
                label="Run"
                value={run?.ok === true ? "PASS" : run?.ok === false ? "FAIL" : "PENDING"}
                tone={run?.ok === true ? "good" : run?.ok === false ? "fault" : "warn"}
              />
              <Metric label="Verification files" value={verificationFiles.length.toLocaleString()} tone="signal" />
              <Metric label="Signals" value={verificationSignals.length.toLocaleString()} tone="warn" />
            </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-surface-raised/30 px-3 py-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Backend diagnostics</div>
            <div className="mono-num mt-1 text-[11px] text-foreground/90 whitespace-pre-wrap">
              {verificationLogs.compile_stderr || verificationLogs.run_stderr || compile?.stderr || run?.stderr || "No backend diagnostics emitted for this session."}
            </div>
          </div>
        </div>
      </Panel>

      <div className="flex min-h-0 flex-col gap-3 xl:col-span-5">
        <Panel title="Session health" subtitle="authoritative backend status" scroll={false}>
          <div className="grid grid-cols-2 gap-2.5 p-3">
            <Metric label="Compile" value={compile?.ok === true ? "PASS" : compile?.ok === false ? "FAIL" : "PENDING"} tone={compile?.ok ? "good" : compile?.ok === false ? "fault" : "warn"} />
            <Metric label="Run" value={run?.ok === true ? "PASS" : run?.ok === false ? "FAIL" : "PENDING"} tone={run?.ok ? "good" : run?.ok === false ? "fault" : "warn"} />
            <Metric label="Cycles" value={asNumber(metrics?.cycles, 0).toLocaleString()} />
            <Metric label="Retired" value={asNumber(metrics?.retired, 0).toLocaleString()} tone="good" />
          </div>
          <div className="border-t border-border/70 p-3">
            <div className="rounded-lg border border-border/70 bg-surface-raised/35 p-3 text-[12px] text-muted-foreground">
              {isConnected ? "Live WebSocket stream connected." : "Waiting for backend connection."}
            </div>
          </div>
        </Panel>

        <Panel title="Regression suite" subtitle="backend session status and emitted diagnostics" bodyClassName="p-0">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface/95 backdrop-blur">
              <tr className="mono-num text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-medium">File</th>
                <th className="px-3 py-2 font-medium">Kind</th>
                <th className="px-3 py-2 font-medium">Modules</th>
              </tr>
            </thead>
            <tbody>
              {verificationFiles.slice(0, 12).map((file: any) => (
                <tr key={file.path} className="border-t border-border/50">
                  <td className="mono-num px-3 py-1.5 text-[11px]">{file.path}</td>
                  <td className="px-3 py-1.5"><Chip tone="signal">{file.kind}</Chip></td>
                  <td className="px-3 py-1.5 text-[11px] text-muted-foreground">
                    {Array.isArray(file.module_names) && file.module_names.length ? file.module_names.join(" · ") : "No modules"}
                  </td>
                </tr>
              ))}
              {verificationFiles.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-[12px] text-muted-foreground">
                    {verification?.reason ?? "No verification files were reported by the backend."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>

        <Panel title="Diagnostics" subtitle="logs and waveform links from the current session" scroll={false}>
          <div className="space-y-2.5 p-3">
            <div className="rounded-lg border border-border/70 bg-surface-raised/35 p-3">
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">VCD</div>
              <div className="mono-num mt-1 text-[12px] text-foreground">{vcd?.name ?? "No VCD file reported"}</div>
              <div className="mono-num text-[11px] text-muted-foreground">{vcd?.path ?? "Waiting for simulation output."}</div>
            </div>
            <div className="rounded-lg border border-border/70 bg-surface-raised/35 p-3">
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Waveform samples</div>
              <div className="mono-num mt-1 text-[12px] text-foreground">{history.length.toLocaleString()} backend cycles</div>
              <div className="mono-num text-[11px] text-muted-foreground">{history.length ? `latest ${hex(history.at(-1)?.pc ?? 0)}` : "No cursor trace yet."}</div>
            </div>
            <div className="rounded-lg border border-border/70 bg-surface-raised/35 p-3">
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Failure trace</div>
              <div className="mono-num mt-1 text-[11px] text-muted-foreground">
                {verificationLogs.compile_stdout || verificationLogs.run_stdout || "Backend compile and run output is surfaced directly from the session snapshot."}
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Trace coverage" subtitle="derived from backend timeline" scroll={false}>
          <div className="space-y-3 p-3">
            <div>
              <div className="mb-1 flex justify-between text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <span>Timeline presence</span>
                <span className="mono-num normal-case">{samples.length > 0 ? "100.0%" : "0.0%"}</span>
              </div>
              <Bar value={samples.length > 0 ? 1 : 0} tone={samples.length > 0 ? "good" : "warn"} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Current cycle" value={asNumber(playback?.cursor ?? metrics?.cycles, 0).toLocaleString()} />
              <Metric label="Hazards" value={hazards.length.toLocaleString()} tone="warn" />
            </div>
            <div className="rounded-lg border border-border/70 bg-surface-raised/35 p-3 text-[11px] text-muted-foreground">
              {verification?.reason ?? "Verification telemetry is sourced from the live backend snapshot stream."}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
