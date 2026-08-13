/**
 * QuantumRISC Studio v3 — Backend Bridge
 *
 * Connects the studio to the QuantumRISC FastAPI backend.
 * When the backend is reachable, live VCD/waveform/register/hazard data
 * from real Icarus Verilog simulations enriches the in-browser simulator.
 * When the backend is offline, the studio runs in standalone mode with its
 * own built-in RV32I cycle-accurate model — no degradation in UI quality.
 *
 * Integration points:
 *   REST  /api/health         – liveness probe
 *   REST  /api/sessions       – create session
 *   REST  /api/sessions/{id}/compile  – compile RTL
 *   REST  /api/sessions/{id}/run      – run simulation
 *   REST  /api/sessions/{id}/snapshot – pull full state
 *   REST  /api/sessions/{id}/pause|resume|step|reset
 *   WS    /ws/sessions/{id}   – streaming state.snapshot / state.delta events
 */

import type { Simulator } from "@/lib/sim/core";

export type BackendStatus = "connecting" | "connected" | "offline" | "disabled";

export interface BackendSession {
  id: string;
  top: string;
  testbench: string;
  created_at: string;
}

interface BackendSnapshot {
  status?: string;
  metrics?: {
    cycles?: number;
    retired?: number;
    ipc?: number;
    cpi?: number;
    stalls?: number;
    forwards?: number;
    flushes?: number;
  };
  registers?: Array<{ index: number; name: string; abi: string; value: string } | null>;
  pipeline?: {
    pc: string;
    instruction: string;
    opcode: string;
    rs1: string;
    rs2: string;
    rd: string;
    immediate: string;
    alu_result: string;
    writeback_data: string;
    regwrite: string;
  };
  memory?: {
    base: string;
    words: Array<{ address: string; value: string }>;
  };
  hazards?: Array<{ type?: string; from?: number; to?: number; resolved?: string; kind?: string }>;
  forwarding?: Array<{ from?: number; to?: number; type?: string }>;
  waveforms?: { timeline?: unknown[]; cursor?: number };
  compile?: { ok?: boolean; stderr?: string };
  run?: { ok?: boolean; stderr?: string };
  vcd?: { name?: string; path?: string };
  top?: string;
  testbench?: string;
  playback?: { paused?: boolean; cursor?: number };
}

const MAX_RECONNECT_DELAY_MS = 16_000;
const HEALTH_TIMEOUT_MS = 3_000;

function describeHttpStatus(method: string, endpoint: string, status: number): string {
  if (status === 500) return `QuantumRISC backend error while handling ${method} ${endpoint}`;
  if (status === 404) return `QuantumRISC could not find ${method} ${endpoint}`;
  if (status === 503) return `QuantumRISC backend is temporarily unavailable for ${method} ${endpoint}`;
  return `Backend returned HTTP ${status} for ${method} ${endpoint}`;
}

async function jsonFetch(url: string, init?: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) {
      const method = String(init?.method ?? "GET").toUpperCase();
      const endpoint = new URL(url).pathname;
      const fallback = describeHttpStatus(method, endpoint, res.status);
      try {
        const body = await res.text();
        if (!body) throw new Error(fallback);
        try {
          const parsed = JSON.parse(body) as { detail?: unknown; message?: unknown; error?: unknown };
          const detail = parsed.detail ?? parsed.message ?? parsed.error;
          if (typeof detail === "string" && detail.trim()) {
            throw new Error(`${fallback}: ${detail}`);
          }
        } catch {
          // Non-JSON response, fall through.
        }
        throw new Error(`${fallback}: ${body.slice(0, 240)}`);
      } catch (error) {
        if (error instanceof Error) throw error;
        throw new Error(fallback);
      }
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export class BackendBridge {
  private session: BackendSession | null = null;
  private ws: WebSocket | null = null;
  private reconnectDelay = 1_000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private active = false;
  private lastNotificationKey: string | null = null;

  /** Called by the store whenever status changes. */
  onStatusChange: (status: BackendStatus) => void = () => {};
  /** Called by the store when a full snapshot arrives. */
  onSnapshot: (snap: BackendSnapshot) => void = () => {};
  /** Called by the store to trigger a re-render. */
  onNotify: (title: string, detail: string, level: "info" | "warn" | "error") => void = () => {};

  /** Begin the connect → probe → session → compile+run → WebSocket flow. */
  async start(): Promise<void> {
    this.active = true;
    await this.connect();
  }

  stop(): void {
    this.active = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.closeWs();
  }

  // ----------------------------------------------------------------- REST API

  /** REST API base URL — uses VITE_API_URL in production, window.origin in dev. */
  private apiBase(): string {
    const envUrl = import.meta.env.VITE_API_URL as string | undefined;
    if (envUrl && envUrl.length > 0) return envUrl;
    
    // If deployed to Vercel without env vars, forcefully point to Railway
    if (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")) {
      return "https://quantumrisc-production.up.railway.app";
    }
    return typeof window !== "undefined" ? window.location.origin : "";
  }

  /** WebSocket base URL — derived from apiBase, swapping http(s) for ws(s). */
  private wsBase(): string {
    const base = this.apiBase();
    return base.replace(/^https:\/\//, "wss://").replace(/^http:\/\//, "ws://");
  }

  async compileAndRun(): Promise<void> {
    if (!this.session) return;
    try {
      const compileRes = (await jsonFetch(`${this.apiBase()}/api/sessions/${this.session.id}/compile`, {
        method: "POST",
      })) as { ok?: boolean; stderr?: string };

      if (!compileRes.ok) {
        this.notifyOnce("Compile failed", compileRes.stderr ?? "Unknown error", "error");
        return;
      }
      this.notifyOnce("Compiled", `RTL compiled successfully.`, "info");

      const runRes = (await jsonFetch(`${this.apiBase()}/api/sessions/${this.session.id}/run`, {
        method: "POST",
      })) as { ok?: boolean; stderr?: string };

      if (!runRes.ok) {
        this.notifyOnce("Simulation failed", runRes.stderr ?? "Unknown error", "error");
        return;
      }
      this.notifyOnce("Simulation complete", "VCD waveform data is ready.", "info");
      await this.fetchSnapshot();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const title =
        message.includes("QuantumRISC backend error")
          ? "QuantumRISC backend error"
          : message.includes("compile")
          ? "Compile request failed"
          : message.includes("run")
            ? "Simulation request failed"
              : "Backend request failed";
      this.notifyOnce(title, `${message}. Check the session output and backend logs.`, "error");
    }
  }

  async sendPause(): Promise<void> {
    if (!this.session) return;
    await jsonFetch(`${this.apiBase()}/api/sessions/${this.session.id}/pause`, { method: "POST" }).catch(() => {});
  }

  async sendResume(): Promise<void> {
    if (!this.session) return;
    await jsonFetch(`${this.apiBase()}/api/sessions/${this.session.id}/resume`, { method: "POST" }).catch(() => {});
  }

  async sendStep(): Promise<void> {
    if (!this.session) return;
    await jsonFetch(`${this.apiBase()}/api/sessions/${this.session.id}/step`, { method: "POST" }).catch(() => {});
    await this.fetchSnapshot();
  }

  async sendReset(): Promise<void> {
    if (!this.session) return;
    await jsonFetch(`${this.apiBase()}/api/sessions/${this.session.id}/reset`, { method: "POST" }).catch(() => {});
    await this.fetchSnapshot();
  }

  private async fetchSnapshot(): Promise<void> {
    if (!this.session) return;
    try {
      const snap = (await jsonFetch(`${this.apiBase()}/api/sessions/${this.session.id}/snapshot`)) as BackendSnapshot;
      this.onSnapshot(snap);
    } catch {
      /* WebSocket will deliver the next snapshot */
    }
  }

  // ---------------------------------------------------- connection lifecycle

  private async connect(): Promise<void> {
    this.onStatusChange("connecting");
    try {
      // 1. Health probe
      await jsonFetch(`${this.apiBase()}/api/health`);

      // 2. Discover available tops
      const discovery = (await jsonFetch(`${this.apiBase()}/api/discovery`)) as {
        tops?: string[];
        default_testbench?: string;
        default_top?: string;
      };

      const top =
        discovery.tops?.includes("pipeline_cpu_complete") ? "pipeline_cpu_complete"
        : discovery.tops?.[0] ?? "pipeline_cpu_complete";
      const testbench = discovery.default_testbench ?? "pipeline_cpu_complete_tb";

      // 3. Create session
      const session = (await jsonFetch(`${this.apiBase()}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ top, testbench }),
      })) as BackendSession;

      this.session = session;
      this.reconnectDelay = 1_000;
      this.onStatusChange("connected");
      this.notifyOnce("Backend connected", `Session ${session.id.slice(0, 8)} · ${top}`, "info");

      // 4. Open WebSocket
      this.openWs(session.id);

      // 5. Auto compile + run
      await this.compileAndRun();
    } catch {
      this.onStatusChange("offline");
      this.scheduleReconnect();
    }
  }

  private openWs(sessionId: string): void {
    this.closeWs();
    const ws = new WebSocket(`${this.wsBase()}/ws/sessions/${sessionId}`);
    this.ws = ws;

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(event.data) as { type: string; payload?: BackendSnapshot };
        if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
          return;
        }
        if ((msg.type === "state.snapshot" || msg.type === "state.delta") && msg.payload) {
          this.onSnapshot(msg.payload);
        }
      } catch {
        /* ignore malformed frames */
      }
    };

    ws.onclose = () => {
      if (this.active) {
        this.onStatusChange("connecting");
        this.scheduleReconnect();
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }

  private closeWs(): void {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      try { this.ws.close(); } catch { /* ignore */ }
      this.ws = null;
    }
  }

  private scheduleReconnect(): void {
    if (!this.active) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.active) void this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
  }

  private notifyOnce(title: string, detail: string, level: "info" | "warn" | "error"): void {
    const key = `${level}:${title}:${detail}`;
    if (this.lastNotificationKey === key) return;
    this.lastNotificationKey = key;
    this.onNotify(title, detail, level);
  }

  // -------------------------------------------- apply snapshot to simulator

  /**
   * Maps backend snapshot data onto the in-browser simulator state.
   * Overwrites the internal mock state with actual backend trace data.
   */
  static applySnapshot(sim: Simulator, snap: BackendSnapshot): void {
    // Registers (x0–x31) — backend produces [{index, name, abi, value: "0xHHHH"}]
    if (snap.registers && Array.isArray(snap.registers)) {
      for (const entry of snap.registers) {
        if (!entry) continue;
        const idx = entry.index;
        if (idx >= 1 && idx < 32 && entry.value) {
          const val = parseInt(entry.value.replace(/^0x/i, ""), 16);
          if (!isNaN(val)) sim.regs[idx] = val | 0;
        }
      }
    }

    // Pipeline — update the in-browser PC from the backend trace
    if (snap.pipeline) {
      const pcStr = snap.pipeline.pc ?? "0x0";
      const pc = parseInt(pcStr.replace(/^0x/i, ""), 16);
      if (!isNaN(pc) && pc > 0) sim.pc = pc >>> 0;
    }

    // Memory — backend produces { base: "0x…", words: [{address, value}] }
    if (snap.memory && Array.isArray(snap.memory.words)) {
      for (const word of snap.memory.words) {
        const addr = parseInt(word.address.replace(/^0x/i, ""), 16);
        const val  = parseInt(word.value.replace(/^0x/i, ""), 16);
        if (!isNaN(addr) && !isNaN(val)) sim.writeWord(addr, val);
      }
    }

    // Metrics — backend produces {cycles, ipc, cpi, stalls, retired, forwards, flushes}
    if (snap.metrics) {
      const m = snap.metrics;
      if (m.cycles  != null) { sim.metrics.cycles      = m.cycles;  sim.cycle = m.cycles; }
      if (m.retired != null)   sim.metrics.retired      = m.retired;
      if (m.ipc     != null)   sim.metrics.ipc          = m.ipc;
      if (m.cpi     != null)   sim.metrics.cpi          = m.cpi;
      if (m.stalls  != null)   sim.metrics.stallCycles  = m.stalls;
      if (m.forwards!= null)   sim.metrics.forwards     = m.forwards;
      if (m.flushes != null)   sim.metrics.flushes      = m.flushes;
    }
  }

  get currentSession(): BackendSession | null {
    return this.session;
  }
}

/** Singleton bridge instance shared across the studio store. */
export const backendBridge = new BackendBridge();
