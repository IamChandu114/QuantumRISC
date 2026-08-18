import { resolveBackendWsBase } from "./backend-endpoint";

type WebSocketMessageHandler = (data: any) => void;

type ConnectionState = "connecting" | "connected" | "reconnecting" | "backend-unavailable" | "websocket-failed" | "closed";

export interface WsClientOptions {
  onStateChange?: (state: ConnectionState, detail?: string) => void;
  onDisconnect?: () => void;
}

export class WsClient {
  private ws: WebSocket | null = null;
  private url: string;
  private readonly sessionId: string;
  private handlers: Set<WebSocketMessageHandler> = new Set();
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private manualDisconnect = false;
  private hadError = false;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly heartbeatTimeoutMs = 25_000;
  private readonly connectionTimeoutMs = 10_000;
  private readonly options: WsClientOptions;

  constructor(sessionId: string, options: WsClientOptions = {}) {
    this.sessionId = sessionId;
    this.url = `${resolveBackendWsBase()}/ws/sessions/${sessionId}`;
    this.options = options;
    console.log(`[QuantumRISC] websocket: initialized for session ${sessionId.slice(0, 8)} → ${this.url}`);
  }

  public connect() {
    if (this.ws || this.isConnecting || this.manualDisconnect) return;
    this.isConnecting = true;
    this.hadError = false;
    this.options.onStateChange?.(this.reconnectAttempts > 0 ? "reconnecting" : "connecting");

    console.log(`[QuantumRISC] websocket: connecting (attempt ${this.reconnectAttempts + 1}) → ${this.url}`);
    const ws = new WebSocket(this.url);
    this.ws = ws;

    this.connectionTimer = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        console.warn(`[QuantumRISC] websocket: connection timeout for session ${this.sessionId.slice(0, 8)}`);
        this.options.onStateChange?.("backend-unavailable", "websocket connection timed out");
        ws.close();
      }
    }, this.connectionTimeoutMs);

    ws.onopen = () => {
      if (ws !== this.ws) return; // stale socket
      console.log(`[QuantumRISC] websocket: connected → session ${this.sessionId.slice(0, 8)}`);
      this.isConnecting = false;
      this.hadError = false;
      this.reconnectAttempts = 0;
      this.clearConnectionTimer();
      this.startHeartbeatWatchdog();
      this.options.onStateChange?.("connected");
    };

    ws.onmessage = (event) => {
      if (ws !== this.ws) return; // stale socket
      try {
        const data = JSON.parse(event.data);
        if (data.type === "ping") {
          this.pong();
          this.refreshHeartbeatWatchdog();
          return;
        }
        this.refreshHeartbeatWatchdog();
        this.handlers.forEach((handler) => handler(data));
      } catch (err) {
        console.error("[QuantumRISC] websocket: failed to parse message", err);
      }
    };

    ws.onerror = () => {
      if (ws !== this.ws) return; // stale socket
      // onerror fires before onclose — mark it but let onclose handle reconnect
      this.hadError = true;
      console.warn(`[QuantumRISC] websocket: error on session ${this.sessionId.slice(0, 8)}`);
      this.options.onStateChange?.("websocket-failed", "websocket error");
    };

    ws.onclose = (event) => {
      if (ws !== this.ws) return; // stale socket
      console.log(`[QuantumRISC] websocket: closed (code=${event.code}) for session ${this.sessionId.slice(0, 8)}`);
      this.clearHeartbeatWatchdog();
      this.clearConnectionTimer();
      this.ws = null;
      this.isConnecting = false;

      if (this.manualDisconnect) {
        this.options.onStateChange?.("closed");
        this.options.onDisconnect?.();
        return;
      }

      // 4403/4404 = session not found on backend; stop reconnecting to this dead session
      // Also stop if the HTTP upgrade was rejected (code 1006 after an error = network / CORS / 403)
      if (this.hadError && (event.code === 1006 || event.code === 4403 || event.code === 4404)) {
        console.warn(`[QuantumRISC] websocket: session ${this.sessionId.slice(0, 8)} rejected (${event.code}) — not retrying`);
        this.options.onStateChange?.("backend-unavailable", "session rejected by backend");
        return;
      }

      this.attemptReconnect();
    };
  }

  private attemptReconnect() {
    this.clearHeartbeatWatchdog();
    this.clearConnectionTimer();
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10_000);
      console.log(`[QuantumRISC] websocket: reconnecting in ${timeout}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.options.onStateChange?.("reconnecting", `retry ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, timeout);
    } else {
      console.error(`[QuantumRISC] websocket: max reconnect attempts reached for session ${this.sessionId.slice(0, 8)}`);
      this.options.onStateChange?.("backend-unavailable", "max reconnect attempts reached");
    }
  }

  private pong() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "pong" }));
    }
  }

  private startHeartbeatWatchdog() {
    this.clearHeartbeatWatchdog();
    this.heartbeatTimer = setTimeout(() => {
      console.warn(`[QuantumRISC] websocket: heartbeat timeout for session ${this.sessionId.slice(0, 8)}`);
      this.options.onStateChange?.("websocket-failed", "heartbeat timed out");
      try { this.ws?.close(); } catch { /* ignore */ }
    }, this.heartbeatTimeoutMs);
  }

  private refreshHeartbeatWatchdog() {
    if (!this.heartbeatTimer) return;
    clearTimeout(this.heartbeatTimer);
    this.startHeartbeatWatchdog();
  }

  private clearHeartbeatWatchdog() {
    if (this.heartbeatTimer) clearTimeout(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  private clearConnectionTimer() {
    if (this.connectionTimer) clearTimeout(this.connectionTimer);
    this.connectionTimer = null;
  }

  public subscribe(handler: WebSocketMessageHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  public disconnect() {
    this.manualDisconnect = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.clearHeartbeatWatchdog();
    this.clearConnectionTimer();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers.clear();
  }
}
