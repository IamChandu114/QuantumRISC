import { createFileRoute } from "@tanstack/react-router";
import { useStudio } from "@/hooks/use-studio";
import { Bar, Chip, Metric, Panel } from "@/components/studio/panel";

export const Route = createFileRoute("/fpga")({
  component: FpgaPage,
});

function FpgaPage() {
  const { compile, run, metrics, status, isConnected, discovery, fpga } = useStudio();
  const rtlCount = discovery?.rtl_files?.length ?? fpga?.rtl_files?.length ?? 0;
  const verificationCount = discovery?.verification_files?.length ?? fpga?.verification_files?.length ?? 0;
  const synthesisNotes = compile?.stderr || run?.stderr || fpga?.reason || "No synthesis report emitted by the current backend session.";
  const resourceRows = [
    { label: "LUT", value: fpga?.resource_report?.lut, hint: "backend synthesis report" },
    { label: "FF", value: fpga?.resource_report?.ff, hint: "backend synthesis report" },
    { label: "BRAM", value: fpga?.resource_report?.bram, hint: "backend synthesis report" },
    { label: "DSP", value: fpga?.resource_report?.dsp, hint: "backend synthesis report" },
    { label: "Timing slack", value: fpga?.timing_report?.slack, hint: "backend synthesis report" },
    { label: "Fmax", value: fpga?.timing_report?.fmax, hint: "backend synthesis report" },
  ];

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
          {resourceRows.map(({ label, value, hint }) => (
            <div key={label} className="rounded-lg border border-border/70 bg-surface-raised/35 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-foreground/90">{label}</span>
                <span className="mono-num text-[11px] text-muted-foreground">{value ?? "n/a"}</span>
              </div>
              <div className="mono-num mt-1 text-[10px] text-muted-foreground">{hint}</div>
              <div className="mt-2">
                <Bar value={value != null ? 1 : 0} tone={value != null ? "good" : "warn"} />
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
              <Chip>{discovery?.rtl_files?.[0]?.module_names?.[0] ?? fpga?.signals?.[0] ?? "no module metadata"}</Chip>
            </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-surface-raised/35 p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Timing summary</div>
            <div className="mono-num mt-1 text-[11px] text-muted-foreground">
              {fpga?.reason ?? "The current backend does not yet emit a synthesis timing report."}
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
            {(discovery?.rtl_files ?? []).slice(0, 20).map((file: { path: string; kind: string; module_names: string[] }) => (
              <tr key={file.path} className="border-t border-border/50">
                <td className="mono-num px-3 py-2 text-[11px] text-foreground">{file.path}</td>
                <td className="px-3 py-2"><Chip tone="signal">{file.kind}</Chip></td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {file.module_names.length > 0 ? file.module_names.map((moduleName: string) => <Chip key={moduleName}>{moduleName}</Chip>) : <span className="mono-num text-[11px] text-muted-foreground">No modules</span>}
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
