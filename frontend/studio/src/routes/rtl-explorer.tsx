import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useStudio } from "@/hooks/use-studio";
import { Chip, Metric, Panel } from "@/components/studio/panel";

type DiscoveryFile = {
  path: string;
  kind: string;
  module_names: string[];
};

type Discovery = {
  tops: string[];
  smoke_tops: string[];
  testbenches: string[];
  rtl_files: DiscoveryFile[];
  verification_files: DiscoveryFile[];
  default_top: string;
  default_testbench: string;
};

export const Route = createFileRoute("/rtl-explorer")({
  component: RtlExplorerPage,
});

function RtlExplorerPage() {
  const { top, testbench, sessionId, discovery } = useStudio();
  const [query, setQuery] = useState("");
  const payload = discovery as Discovery | undefined;
  const rtlFiles = payload?.rtl_files ?? [];

  const filteredFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rtlFiles;
    return rtlFiles.filter((file: DiscoveryFile) => `${file.path} ${file.module_names.join(" ")}`.toLowerCase().includes(q));
  }, [rtlFiles, query]);

  const modules = useMemo(() => {
    const map = new Map<string, DiscoveryFile[]>();
    for (const file of filteredFiles) {
      for (const moduleName of file.module_names) {
        const bucket = map.get(moduleName) ?? [];
        bucket.push(file);
        map.set(moduleName, bucket);
      }
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filteredFiles]);

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
      <Panel title="RTL Explorer" subtitle="module hierarchy, dependencies, and source navigation from backend discovery" className="xl:col-span-12" scroll={false}>
        <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-4 lg:grid-cols-6">
          <Metric label="Session" value={sessionId ? sessionId.slice(0, 8) : "none"} tone={sessionId ? "signal" : "warn"} />
          <Metric label="Top" value={top || payload?.default_top || "n/a"} />
          <Metric label="Testbench" value={testbench || payload?.default_testbench || "n/a"} />
          <Metric label="RTL files" value={rtlFiles.length.toLocaleString()} tone="good" />
          <Metric label="Modules" value={modules.length.toLocaleString()} tone="signal" />
          <Metric label="Testbenches" value={(payload?.testbenches.length ?? 0).toLocaleString()} tone="warn" />
        </div>
      </Panel>

      <Panel title="File browser" subtitle="live discovery payload" className="xl:col-span-5">
        <div className="space-y-2 p-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search file or module"
            className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-[12px] text-foreground outline-none placeholder:text-muted-foreground focus:border-signal/40"
          />
          <div className="space-y-1.5">
            {filteredFiles.slice(0, 18).map((file: DiscoveryFile) => (
              <div key={file.path} className="rounded-lg border border-border/70 bg-surface-raised/35 p-3">
                <div className="mono-num text-[11px] text-foreground">{file.path}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {file.module_names.length > 0 ? file.module_names.map((moduleName: string) => <Chip key={moduleName}>{moduleName}</Chip>) : <Chip tone="default">no modules</Chip>}
                </div>
              </div>
            ))}
            {filteredFiles.length === 0 && (
              <div className="rounded-lg border border-border/70 bg-surface-raised/35 px-3 py-6 text-[12px] text-muted-foreground">
                No matching RTL files in discovery payload.
              </div>
            )}
          </div>
        </div>
      </Panel>

      <Panel title="Module hierarchy" subtitle="grouped by module name with cross references" className="xl:col-span-7" bodyClassName="p-0">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-surface/95 backdrop-blur">
            <tr className="mono-num text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 font-medium">Module</th>
              <th className="px-3 py-2 font-medium">Files</th>
              <th className="px-3 py-2 font-medium">Refs</th>
            </tr>
          </thead>
          <tbody>
            {modules.map(([moduleName, files]: [string, DiscoveryFile[]]) => (
              <tr key={moduleName} className="border-t border-border/50">
                <td className="mono-num px-3 py-2 text-[11px] text-foreground">{moduleName}</td>
                <td className="mono-num px-3 py-2 text-[11px] text-muted-foreground">{files.length}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {files.slice(0, 3).map((file: DiscoveryFile) => (
                      <Chip key={file.path} tone="signal">
                        {file.path}
                      </Chip>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {modules.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-[12px] text-muted-foreground">
                  Discovery has not yet reported any RTL modules.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>

      <Panel title="Cross references" subtitle="module-to-file relationships" className="xl:col-span-12">
        <div className="grid gap-2.5 p-3 sm:grid-cols-2 xl:grid-cols-4">
          {rtlFiles.slice(0, 12).map((file: DiscoveryFile) => (
            <article key={file.path} className="rounded-lg border border-border/70 bg-surface-raised/35 p-3">
              <div className="mono-num text-[11px] text-foreground">{file.path}</div>
              <div className="mono-num mt-1 text-[10px] text-muted-foreground">
                {file.module_names.length ? file.module_names.join(" · ") : "No module declarations"}
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
