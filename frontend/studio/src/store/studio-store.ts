import { create } from "zustand";
import { ApiClient } from "../lib/api-client";
import { WsClient } from "../lib/ws-client";

interface StudioState {
  sessionId: string | null;
  status: string;
  transportState: "connecting" | "connected" | "reconnecting" | "backend-unavailable" | "websocket-failed" | "closed";
  transportDetail: string;
  top: string;
  testbench: string;
  isConnected: boolean;
  discovery: any;
  notifications: Array<{ id: number; title: string; detail: string; level: "info" | "warn" | "error" }>;
  
  // Data models (matching backend SessionSnapshot)
  playback: any;
  compile: any;
  run: any;
  architecture: any;
  registers: any;
  memory: any;
  pipeline: any;
  hazards: any;
  forwarding: any;
  metrics: any;
  waveforms: any;
  vcd: any;
  cache: any;
  branch: any;
  verification: any;
  fpga: any;

  // Actions
  initializeSession: (top?: string, testbench?: string) => Promise<void>;
  connectSession: (sessionId: string) => void;
  disconnectSession: () => void;
  
  // API Controls
  compileRtl: () => Promise<void>;
  runSimulation: () => Promise<void>;
  stepSimulation: () => Promise<void>;
  resetSimulation: () => Promise<void>;
  notify: (title: string, detail: string, level?: "info" | "warn" | "error") => void;
  clearNotifications: () => void;
}

let activeWsClient: WsClient | null = null;
let bootstrapPromise: Promise<void> | null = null;
let bootstrapRetryTimer: ReturnType<typeof setTimeout> | null = null;
let bootstrapRetryDelay = 1_000;
// Track which session has already been bootstrapped with compile+run so we
// don't fire it again on every WebSocket reconnect.
let telemetryBootstrapSessionId: string | null = null;
let notificationId = 1;
let lastNotificationKey: string | null = null;

function scheduleBootstrapRetry() {
  if (bootstrapRetryTimer) clearTimeout(bootstrapRetryTimer);
  bootstrapRetryTimer = setTimeout(() => {
    bootstrapRetryTimer = null;
    bootstrapRetryDelay = Math.min(bootstrapRetryDelay * 2, 15_000);
    void useStudioStore.getState().initializeSession();
  }, bootstrapRetryDelay);
}

/**
 * Fire compile + run for a session.
 *
 * This is called ONLY after the WebSocket for that session has confirmed
 * "connected" — so the initial state.snapshot broadcast won't be missed.
 *
 * Guard: if the session has already been bootstrapped (e.g. WS reconnect),
 * skip the extra compile+run to avoid re-running a finished simulation.
 */
async function bootstrapTelemetry(sessionId: string) {
  // Already done for this session — don't re-compile on WS reconnects
  if (telemetryBootstrapSessionId === sessionId) {
    console.log(`[QuantumRISC] telemetry: session ${sessionId.slice(0, 8)} already bootstrapped — skipping compile+run`);
    return;
  }

  telemetryBootstrapSessionId = sessionId;
  try {
    useStudioStore.getState().notify("Bootstrapping simulation", "Compiling RTL and starting live telemetry.", "info");
    useStudioStore.setState({ transportDetail: "compiling RTL for live telemetry" });

    console.log(`[QuantumRISC] compile session: ${sessionId.slice(0, 8)}`);
    const compileResult: any = await ApiClient.compile(sessionId);
    if (!compileResult?.ok) {
      const stderr = compileResult?.stderr ?? "Compile failed";
      console.warn(`[QuantumRISC] compile: FAIL — ${stderr.slice(0, 120)}`);
      useStudioStore.getState().notify("Compile failed", stderr.slice(0, 200), "error");
      useStudioStore.setState({ transportDetail: `compile failed: ${stderr.slice(0, 80)}` });
      return;
    }
    console.log(`[QuantumRISC] compile: PASS`);

    useStudioStore.setState({ transportDetail: "starting simulation and awaiting backend snapshots" });
    console.log(`[QuantumRISC] run session: ${sessionId.slice(0, 8)}`);
    await ApiClient.run(sessionId);
    console.log(`[QuantumRISC] run: complete`);

    useStudioStore.getState().notify("Simulation started", "Live backend telemetry is now streaming.", "info");

    // Pull a snapshot immediately after run so the dashboard populates
    // even if the WS snapshot hasn't arrived yet.
    try {
      console.log(`[QuantumRISC] snapshot session: ${sessionId.slice(0, 8)} (post-run pull)`);
      const snap: any = await ApiClient.getSnapshot(sessionId);
      if (snap) {
        useStudioStore.setState({
          status: snap.status ?? "running",
          top: snap.top ?? "",
          testbench: snap.testbench ?? "",
          discovery: snap.discovery || {},
          playback: snap.playback || {},
          compile: snap.compile || {},
          run: snap.run || {},
          architecture: snap.architecture || {},
          registers: snap.registers || [],
          memory: snap.memory || {},
          pipeline: snap.pipeline || {},
          hazards: snap.hazards || [],
          forwarding: snap.forwarding || [],
          metrics: snap.metrics || {},
          waveforms: snap.waveforms || {},
          vcd: snap.vcd || {},
          cache: snap.cache || {},
          branch: snap.branch || {},
          verification: snap.verification || {},
          fpga: snap.fpga || {},
        });
        console.log(`[QuantumRISC] snapshot: applied — cycles=${snap.metrics?.cycles} retired=${snap.metrics?.retired}`);
      }
    } catch (snapErr) {
      console.warn(`[QuantumRISC] snapshot: pull failed (WS will deliver next)`, snapErr);
    }
  } catch (e) {
    // Don't reset telemetryBootstrapSessionId here — avoid re-triggering on every WS reconnect
    console.error("[QuantumRISC] telemetry bootstrap failed", e);
    const message = e instanceof Error ? e.message : String(e);
    useStudioStore.getState().notify("Simulation bootstrap failed", message || "automatic simulation bootstrap failed", "error");
    useStudioStore.setState({ transportDetail: message || "automatic simulation bootstrap failed" });
  }
}

export const useStudioStore = create<StudioState>((set, get) => ({
  sessionId: null,
  status: "waiting",
  transportState: "connecting",
  transportDetail: "booting",
  top: "",
  testbench: "",
  isConnected: false,
  discovery: {},
  notifications: [],
  
  playback: {},
  compile: {},
  run: {},
  architecture: {},
  registers: [],
  memory: {},
  pipeline: {},
  hazards: [],
  forwarding: [],
  metrics: {},
  waveforms: {},
  vcd: {},
  cache: {},
  branch: {},
  verification: {},
  fpga: {},

  initializeSession: async (top?: string, testbench?: string) => {
    if (bootstrapPromise) return bootstrapPromise;
    bootstrapPromise = (async () => {
      try {
        set({ transportState: "connecting", transportDetail: "probing Render backend" });
        await ApiClient.health();
        const discovery: any = await ApiClient.getDiscovery();
        const selectedTop = top ?? discovery?.default_top;
        const selectedTestbench = testbench ?? discovery?.default_testbench;
        set({ discovery: discovery ?? {} });
        const resp = await ApiClient.createSession(selectedTop, selectedTestbench);
        bootstrapRetryDelay = 1_000;
        console.log(`[QuantumRISC] session created: ${resp.id}`);
        // connectSession will wire up WS; bootstrapTelemetry is called
        // from the onStateChange("connected") callback so compile+run only
        // fires AFTER the WebSocket is actually open and subscribed.
        get().connectSession(resp.id);
      } catch (e) {
        console.error("[QuantumRISC] session: failed to initialize", e);
        set({
          transportState: "backend-unavailable",
          transportDetail: "backend unavailable during session bootstrap",
          isConnected: false,
          sessionId: null,
          status: "waiting",
        });
        scheduleBootstrapRetry();
      } finally {
        bootstrapPromise = null;
      }
    })();
    return bootstrapPromise;
  },

  connectSession: (sessionId: string) => {
    if (activeWsClient) {
      activeWsClient.disconnect();
      activeWsClient = null;
    }

    // Reset notification dedup so new session gets fresh notifications
    lastNotificationKey = null;
    notificationId = 1;
    // Reset telemetry guard for this new session so compile+run will fire
    telemetryBootstrapSessionId = null;

    set({
      sessionId,
      status: "connecting",
      transportState: "connecting",
      transportDetail: `session ${sessionId.slice(0, 8)} initializing`,
      isConnected: false,
      // Clear stale data from previous session
      compile: {},
      run: {},
      metrics: {},
      waveforms: {},
      registers: [],
      pipeline: {},
      hazards: [],
      forwarding: [],
      playback: {},
      architecture: {},
      memory: {},
    });

    console.log(`[QuantumRISC] websocket connecting: session ${sessionId.slice(0, 8)}`);

    let telemetryFired = false;

    activeWsClient = new WsClient(sessionId, {
      onStateChange: (state, detail) => {
        if (state === "connected") {
          set({ transportState: "connected", transportDetail: `session ${sessionId.slice(0, 8)} live`, isConnected: true });

          // Fire compile+run ONCE per session, only after WS is open so we
          // don't miss the state.snapshot broadcast that follows.
          if (!telemetryFired) {
            telemetryFired = true;
            void bootstrapTelemetry(sessionId);
          }
          return;
        }
        if (state === "connecting") {
          set({ transportState: "connecting", transportDetail: detail ?? "connecting to Render backend", isConnected: false });
          return;
        }
        if (state === "reconnecting") {
          set({ transportState: "reconnecting", transportDetail: detail ?? "reconnecting to Render backend", isConnected: false });
          return;
        }
        if (state === "backend-unavailable") {
          set({ transportState: "backend-unavailable", transportDetail: detail ?? "backend unavailable", isConnected: false });
          // Schedule a full re-init (new session) rather than reconnecting to a dead session
          scheduleBootstrapRetry();
          return;
        }
        if (state === "websocket-failed") {
          set({ transportState: "websocket-failed", transportDetail: detail ?? "websocket failed", isConnected: false });
          return;
        }
        set({ transportState: "closed", transportDetail: detail ?? "session closed", isConnected: false });
      },
      onDisconnect: () => {
        set({ transportState: "closed", transportDetail: "session closed", isConnected: false });
      },
    });

    activeWsClient.subscribe((msg) => {
      const currentSessionId = get().sessionId;

      if (msg.type === "state.snapshot") {
        // Guard: ignore snapshots from stale sessions if the store has moved on
        if (msg.payload?.session_id && msg.payload.session_id !== currentSessionId) {
          console.warn(`[QuantumRISC] ignored stale session update: ${msg.payload.session_id?.slice(0, 8)} (active: ${currentSessionId?.slice(0, 8)})`);
          return;
        }
        const { payload } = msg;
        console.log(`[QuantumRISC] snapshot session: ${sessionId.slice(0, 8)} — status=${payload.status} cycles=${payload.metrics?.cycles}`);
        set({
          status: payload.status,
          top: payload.top,
          testbench: payload.testbench,
          discovery: payload.discovery || {},
          playback: payload.playback || {},
          compile: payload.compile || {},
          run: payload.run || {},
          architecture: payload.architecture || {},
          registers: payload.registers || [],
          memory: payload.memory || {},
          pipeline: payload.pipeline || {},
          hazards: payload.hazards || [],
          forwarding: payload.forwarding || [],
          metrics: payload.metrics || {},
          waveforms: payload.waveforms || {},
          vcd: payload.vcd || {},
          cache: payload.cache || {},
          branch: payload.branch || {},
          verification: payload.verification || {},
          fpga: payload.fpga || {},
          isConnected: true,
          transportState: "connected",
          transportDetail: `session ${sessionId.slice(0, 8)} live`,
        });
      } else if (msg.type === "session.created") {
        set({ isConnected: true, transportState: "connected", transportDetail: `session ${sessionId.slice(0, 8)} created` });
      }
      // state.delta: the backend broadcasts a full snapshot frequently; delta handling is a no-op for now.
    });

    activeWsClient.connect();
  },

  disconnectSession: () => {
    if (activeWsClient) {
      activeWsClient.disconnect();
      activeWsClient = null;
    }
    lastNotificationKey = null;
    notificationId = 1;
    telemetryBootstrapSessionId = null;
    if (bootstrapRetryTimer) {
      clearTimeout(bootstrapRetryTimer);
      bootstrapRetryTimer = null;
    }
    set({ isConnected: false, sessionId: null, status: "waiting", transportState: "closed", transportDetail: "session closed" });
  },

  compileRtl: async () => {
    const id = get().sessionId;
    if (!id) return;
    console.log(`[QuantumRISC] compile session: ${id.slice(0, 8)} (manual)`);
    const result: any = await ApiClient.compile(id);
    set({ compile: result || {} });
  },

  runSimulation: async () => {
    const id = get().sessionId;
    if (!id) return;
    console.log(`[QuantumRISC] run session: ${id.slice(0, 8)} (manual)`);
    const result: any = await ApiClient.run(id);
    if (result) set({ run: result });

    // Pull snapshot after run so metrics appear immediately
    try {
      const snap: any = await ApiClient.getSnapshot(id);
      if (snap) {
        set({
          status: snap.status ?? "running",
          compile: snap.compile || {},
          run: snap.run || {},
          architecture: snap.architecture || {},
          registers: snap.registers || [],
          memory: snap.memory || {},
          pipeline: snap.pipeline || {},
          hazards: snap.hazards || [],
          forwarding: snap.forwarding || [],
          metrics: snap.metrics || {},
          waveforms: snap.waveforms || {},
        });
      }
    } catch { /* WS will deliver */ }
  },

  stepSimulation: async () => {
    const id = get().sessionId;
    if (id) await ApiClient.step(id);
  },

  resetSimulation: async () => {
    const id = get().sessionId;
    if (!id) return;
    console.log(`[QuantumRISC] reset session: ${id.slice(0, 8)}`);
    await ApiClient.reset(id);
  },

  notify: (title: string, detail: string, level: "info" | "warn" | "error" = "info") => {
    const key = `${level}:${title}:${detail}`;
    if (lastNotificationKey === key) return;
    set((state) => ({
      notifications: [{ id: notificationId++, title, detail, level }, ...state.notifications].slice(0, 12),
    }));
    lastNotificationKey = key;
  },

  clearNotifications: () => {
    set({ notifications: [] });
    lastNotificationKey = null;
  }
}));
