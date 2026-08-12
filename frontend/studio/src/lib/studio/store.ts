/**
 * Studio state layer — extended with QuantumRISC backend integration.
 *
 * A single external store drives every panel. React subscribes through
 * `useSyncExternalStore`, so the simulator can run on a requestAnimationFrame
 * clock without React re-rendering more than once per animation frame.
 *
 * The BackendBridge runs in parallel: when the FastAPI backend is reachable,
 * live VCD/waveform data enriches the display. When offline, the studio
 * operates in standalone mode with the built-in RV32I pipeline model.
 */

import { Simulator } from "@/lib/sim/core";
import { BackendBridge, backendBridge, type BackendStatus } from "./backend-bridge";

export interface StudioState {
  running: boolean;
  /** Target simulated cycles per second. */
  speed: number;
  /** Modelled core clock in MHz (affects reported wall-clock timing only). */
  frequencyMhz: number;
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  /** Bumped every time the simulator mutates, used as the snapshot identity. */
  version: number;
  notifications: Array<{ id: number; title: string; detail: string; level: "info" | "warn" | "error" }>;
  /** QuantumRISC backend connection state. */
  backendStatus: BackendStatus;
  /** Backend session ID (short display form). */
  backendSessionId: string | null;
  /** Backend top module name. */
  backendTop: string | null;
}

const STORAGE_KEY = "quantumrisc.studio.layout.v2";
const SPEEDS = [1, 2, 4, 8, 16, 32, 64] as const;

export const SIM_SPEEDS = SPEEDS;

function loadLayout(): Pick<StudioState, "sidebarWidth" | "sidebarCollapsed"> {
  if (typeof window === "undefined") return { sidebarWidth: 280, sidebarCollapsed: false };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { sidebarWidth: 280, sidebarCollapsed: false };
    const parsed = JSON.parse(raw) as Partial<StudioState>;
    return {
      sidebarWidth: Math.min(420, Math.max(220, Number(parsed.sidebarWidth) || 280)),
      sidebarCollapsed: Boolean(parsed.sidebarCollapsed),
    };
  } catch {
    return { sidebarWidth: 280, sidebarCollapsed: false };
  }
}

class StudioStore {
  readonly sim = new Simulator();
  readonly bridge: BackendBridge = backendBridge;

  private state: StudioState = {
    running: false,
    speed: 8,
    frequencyMhz: 1200,
    version: 0,
    notifications: [],
    backendStatus: "connecting",
    backendSessionId: null,
    backendTop: null,
    ...loadLayout(),
  };

  private listeners = new Set<() => void>();
  private rafId: number | null = null;
  private lastFrame = 0;
  private accumulator = 0;
  private notificationId = 1;

  constructor() {
    // Wire bridge callbacks
    this.bridge.onStatusChange = (status: BackendStatus) => {
      this.commit({
        backendStatus: status,
        backendSessionId:
          status === "connected" ? (this.bridge.currentSession?.id.slice(0, 8) ?? null) : this.state.backendSessionId,
        backendTop:
          status === "connected" ? (this.bridge.currentSession?.top ?? null) : this.state.backendTop,
      });
    };

    this.bridge.onSnapshot = (snap) => {
      BackendBridge.applySnapshot(this.sim, snap);
      this.commit({});
    };

    this.bridge.onNotify = (title, detail, level) => {
      this.notify(title, detail, level);
    };

    // Start the backend connection attempt (non-blocking)
    if (typeof window !== "undefined") {
      void this.bridge.start();
    }
  }

  getSnapshot = (): StudioState => this.state;
  getServerSnapshot = (): StudioState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private commit(patch: Partial<StudioState>): void {
    this.state = { ...this.state, ...patch, version: this.state.version + 1 };
    for (const l of this.listeners) l();
  }

  private persistLayout(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ sidebarWidth: this.state.sidebarWidth, sidebarCollapsed: this.state.sidebarCollapsed }),
      );
    } catch {
      /* storage disabled — layout simply won't persist */
    }
  }

  // ------------------------------------------------------------- transport --
  play(): void {
    if (this.state.running) return;
    this.commit({ running: true });
    this.lastFrame = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.tick);
    // Also resume backend if available
    void this.bridge.sendResume();
  }

  pause(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.commit({ running: false });
    void this.bridge.sendPause();
  }

  toggle(): void {
    this.state.running ? this.pause() : this.play();
  }

  stepOnce(): void {
    this.pause();
    this.sim.step();
    this.commit({});
    void this.bridge.sendStep();
  }

  stepMany(count: number): void {
    this.pause();
    for (let i = 0; i < count; i += 1) this.sim.step();
    this.commit({});
  }

  reset(): void {
    this.pause();
    this.sim.reset();
    this.commit({});
    void this.bridge.sendReset();
    this.notify("Core reset", "Architectural state, caches and predictor cleared.", "info");
  }

  /** Trigger a backend compile + run cycle. */
  async compileAndRun(): Promise<void> {
    await this.bridge.compileAndRun();
  }

  setSpeed(speed: number): void {
    this.commit({ speed });
  }

  setFrequency(frequencyMhz: number): void {
    this.commit({ frequencyMhz });
  }

  setSidebarWidth(width: number): void {
    this.commit({ sidebarWidth: Math.min(420, Math.max(220, Math.round(width))) });
    this.persistLayout();
  }

  toggleSidebar(): void {
    this.commit({ sidebarCollapsed: !this.state.sidebarCollapsed });
    this.persistLayout();
  }

  notify(title: string, detail: string, level: "info" | "warn" | "error" = "info"): void {
    const next = [{ id: this.notificationId++, title, detail, level }, ...this.state.notifications].slice(0, 12);
    this.commit({ notifications: next });
  }

  clearNotifications(): void {
    this.commit({ notifications: [] });
  }

  /**
   * Frame-locked simulation clock. Cycles are accumulated in simulated time so
   * the perceived speed is independent of display refresh rate; the per-frame
   * budget is capped to protect the 60 FPS target.
   */
  private tick = (now: number): void => {
    if (!this.state.running) return;
    const deltaSeconds = Math.min(0.1, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    this.accumulator += deltaSeconds * this.state.speed;

    let budget = 4096;
    while (this.accumulator >= 1 && budget > 0) {
      this.sim.step();
      this.accumulator -= 1;
      budget -= 1;
    }
    this.commit({});
    this.rafId = requestAnimationFrame(this.tick);
  };
}

export const studio = new StudioStore();
