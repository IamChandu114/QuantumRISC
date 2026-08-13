import { create } from "zustand";
import { ApiClient } from "../lib/api-client";
import { WsClient } from "../lib/ws-client";

interface StudioState {
  sessionId: string | null;
  status: string;
  top: string;
  testbench: string;
  isConnected: boolean;
  discovery: any;
  
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
}

let activeWsClient: WsClient | null = null;

export const useStudioStore = create<StudioState>((set, get) => ({
  sessionId: null,
  status: "disconnected",
  top: "",
  testbench: "",
  isConnected: false,
  discovery: {},
  
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
    try {
      const resp = await ApiClient.createSession(top, testbench);
      get().connectSession(resp.id);
    } catch (e) {
      console.error("Failed to initialize session", e);
    }
  },

  connectSession: (sessionId: string) => {
    if (activeWsClient) {
      activeWsClient.disconnect();
    }
    
    set({ sessionId, status: "connecting", isConnected: false });
    
    activeWsClient = new WsClient(sessionId);
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
        });
      } else if (msg.type === "state.delta") {
        // Handle delta updates if your backend sends them, for now merge into state
        // This is a simplified merge, depending on backend's delta structure
        // A full snapshot is sent frequently enough for now.
      } else if (msg.type === "session.created") {
        set({ isConnected: true });
      }
    });
    
    activeWsClient.connect();
  },

  disconnectSession: () => {
    if (activeWsClient) {
      activeWsClient.disconnect();
      activeWsClient = null;
    }
    set({ isConnected: false, sessionId: null, status: "disconnected" });
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
  }
}));
