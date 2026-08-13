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
let telemetryBootstrapPromise: Promise<void> | null = null;
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

async function bootstrapTelemetry(sessionId: string) {
  if (telemetryBootstrapSessionId === sessionId || telemetryBootstrapPromise) return telemetryBootstrapPromise;
  telemetryBootstrapPromise = (async () => {
    try {
      useStudioStore.getState().notify("Bootstrapping simulation", "Compiling RTL and starting live telemetry.", "info");
      useStudioStore.setState({
        transportDetail: "compiling RTL for live telemetry",
      });
      await ApiClient.compile(sessionId);
      useStudioStore.setState({
        transportDetail: "starting simulation and awaiting backend snapshots",
      });
      await ApiClient.run(sessionId);
      telemetryBootstrapSessionId = sessionId;
      useStudioStore.getState().notify("Simulation started", "Live backend telemetry is now streaming.", "info");
    } catch (e) {
      console.error("Failed to bootstrap simulation telemetry", e);
      const message = e instanceof Error ? e.message : String(e);
      useStudioStore.getState().notify("Simulation bootstrap failed", message || "automatic simulation bootstrap failed", "error");
      useStudioStore.setState({
        transportDetail: message || "automatic simulation bootstrap failed",
      });
    } finally {
      telemetryBootstrapPromise = null;
    }
  })();
  return telemetryBootstrapPromise;
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
        set({ transportState: "connecting", transportDetail: "probing Railway backend" });
        await ApiClient.health();
        const resp = await ApiClient.createSession(top, testbench);
        bootstrapRetryDelay = 1_000;
        get().connectSession(resp.id);
        void bootstrapTelemetry(resp.id);
      } catch (e) {
        console.error("Failed to initialize session", e);
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
    }
    lastNotificationKey = null;
    notificationId = 1;
    
    set({ sessionId, status: "connecting", transportState: "connecting", transportDetail: `session ${sessionId.slice(0, 8)} initializing`, isConnected: false });
    
    activeWsClient = new WsClient(sessionId, {
      onStateChange: (state, detail) => {
        if (state === "connected") {
          set({ transportState: "connected", transportDetail: `session ${sessionId.slice(0, 8)} live`, isConnected: true });
          return;
        }
        if (state === "connecting") {
          set({ transportState: "connecting", transportDetail: detail ?? "connecting to Railway backend", isConnected: false });
          return;
        }
        if (state === "reconnecting") {
          set({ transportState: "reconnecting", transportDetail: detail ?? "reconnecting to Railway backend", isConnected: false });
          return;
        }
        if (state === "backend-unavailable") {
          set({ transportState: "backend-unavailable", transportDetail: detail ?? "backend unavailable", isConnected: false });
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
      if (msg.type === "state.snapshot") {
        const { payload } = msg;
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
      } else if (msg.type === "state.delta") {
        // Handle delta updates if your backend sends them, for now merge into state
        // This is a simplified merge, depending on backend's delta structure
        // A full snapshot is sent frequently enough for now.
      } else if (msg.type === "session.created") {
        set({ isConnected: true, transportState: "connected", transportDetail: `session ${sessionId.slice(0, 8)} created` });
      }
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
    telemetryBootstrapPromise = null;
    set({ isConnected: false, sessionId: null, status: "waiting", transportState: "closed", transportDetail: "session closed" });
  },
  
  compileRtl: async () => {
    const id = get().sessionId;
    if (id) await ApiClient.compile(id);
  },
  
  runSimulation: async () => {
    const id = get().sessionId;
    if (id) await ApiClient.run(id);
  },
  
  stepSimulation: async () => {
    const id = get().sessionId;
    if (id) await ApiClient.step(id);
  },
  
  resetSimulation: async () => {
    const id = get().sessionId;
    if (id) await ApiClient.reset(id);
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
