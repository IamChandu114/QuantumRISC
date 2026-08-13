import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useStudio } from "@/hooks/use-studio";
import { Bar, Chip, Metric, Panel } from "@/components/studio/panel";
import { ApiClient } from "@/lib/api-client";
import { useEffect, useState } from "react";

type DiscoveryFile = { path: string; kind: string; module_names: string[] };
type Discovery = {
  rtl_files: DiscoveryFile[];
  verification_files: DiscoveryFile[];
};

export const Route = createFileRoute("/fpga")({
  component: FpgaPage,
});

function FpgaPage() {
  const { compile, run, metrics, status, isConnected } = useStudio();
  const [discovery, setDiscovery] = useState<Discovery | null>(null);

  useEffect(() => {
    let mounted = true;
    void ApiClient.getDiscovery()
      .then((data) => {
        if (mounted) setDiscovery(data as Discovery);
      })
      .catch(() => {
        if (mounted) setDiscovery(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const synthesisNotes = useMemo(() => {
    if (compile?.stderr) return compile.stderr;
    if (run?.stderr) return run.stderr;
    return "No synthesis report emitted by the current backend session.";
  }, [compile, run]);

  const rtlCount = discovery?.rtl_files.length ?? 0;
  const verificationCount = discovery?.verification_files.length ?? 0;

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
      <Panel title="FPGA analysis" subtitle="resource, timing, and synthesis status from live backend inputs" className="xl:col-span-12" scroll={false}>
        <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="Connection" value={isConnected ? "LIVE" : "WAIT"} tone={isConnected ? "good" : "warn"} />
          <Metric label="Status" value={status} />
          <Metric label="RTL files" value={rtlCount.toLocaleString()} tone="signal" />
          <Metric label="Verification" value={verificationCount.toLocaleString()} tone="warn" />
          <Metric label="Cycles" value={(metrics?.cycles ?? 0).toLocaleString()} />
          <Metric label="Retired" value={(metrics?.retired ?? 0).toLocaleString()} tone="good" />
        </div>
      </Panel>

      <Panel title="Resource summary" subtitle="backend-derived design scale and availability" className="xl:col-span-7">
        <div className="space-y-3 p-3">
          {[
            ["LUT", "not emitted", "wait for synthesis reporting"],
            ["FF", "not emitted", "wait for synthesis reporting"],
            ["BRAM", "not emitted", "wait for synthesis reporting"],
            ["DSP", "not emitted", "wait for synthesis reporting"],
            ["Timing slack", "not emitted", "wait for synthesis reporting"],
            ["Fmax", "not emitted", "wait for synthesis reporting"],
          ].map(([label, value, hint]) => (
            <div key={label} className="rounded-lg border border-border/70 bg-surface-raised/35 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-foreground/90">{label}</span>
                <span className="mono-num text-[11px] text-muted-foreground">{value}</span>
              </div>
              <div className="mono-num mt-1 text-[10px] text-muted-foreground">{hint}</div>
              <div className="mt-2">
                <Bar value={0} tone="warn" />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Synthesis report viewer" subtitle="compile and run output from the current session" className="xl:col-span-5">
        <div className="space-y-2.5 p-3">
          <div className="rounded-lg border border-border/70 bg-surface-raised/35 p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Report</div>
            <div className="mono-num mt-1 break-words text-[11px] text-foreground/90">{synthesisNotes}</div>
          </div>
          <div className="rounded-lg border border-border/70 bg-surface-raised/35 p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">RTL inventory</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip tone="signal">{rtlCount} rtl files</Chip>
              <Chip tone="warn">{verificationCount} verification files</Chip>
              <Chip>{discovery?.rtl_files[0]?.module_names[0] ?? "no module metadata"}</Chip>
            </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-surface-raised/35 p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Timing summary</div>
            <div className="mono-num mt-1 text-[11px] text-muted-foreground">
              The current backend does not yet emit a synthesis timing report, so the workstation keeps this panel explicitly unavailable instead of synthesizing a fictional slack value.
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Design inventory" subtitle="backend discovery payload" className="xl:col-span-12" bodyClassName="p-0">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-surface/95 backdrop-blur">
            <tr className="mono-num text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 font-medium">File</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Modules</th>
            </tr>
          </thead>
          <tbody>
            {(discovery?.rtl_files ?? []).slice(0, 20).map((file) => (
              <tr key={file.path} className="border-t border-border/50">
                <td className="mono-num px-3 py-2 text-[11px] text-foreground">{file.path}</td>
                <td className="px-3 py-2"><Chip tone="signal">{file.kind}</Chip></td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {file.module_names.length > 0 ? file.module_names.map((module) => <Chip key={module}>{module}</Chip>) : <span className="mono-num text-[11px] text-muted-foreground">No modules</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
