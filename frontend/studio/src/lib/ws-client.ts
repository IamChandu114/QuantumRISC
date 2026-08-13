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
  private handlers: Set<WebSocketMessageHandler> = new Set();
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private manualDisconnect = false;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly heartbeatTimeoutMs = 25_000;
  private readonly connectionTimeoutMs = 10_000;
  private readonly options: WsClientOptions;

  constructor(sessionId: string, options: WsClientOptions = {}) {
    this.url = `${resolveBackendWsBase()}/ws/sessions/${sessionId}`;
    this.options = options;
  }

  public connect() {
    if (this.ws || this.isConnecting) return;
    this.isConnecting = true;
    this.manualDisconnect = false;
    this.options.onStateChange?.(this.reconnectAttempts > 0 ? "reconnecting" : "connecting");
    
    console.log(`[WS] Connecting to ${this.url}`);
    this.ws = new WebSocket(this.url);

    this.connectionTimer = setTimeout(() => {
      if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
        console.warn("[WS] Connection timeout");
        this.options.onStateChange?.("backend-unavailable", "websocket connection timed out");
        this.ws.close();
      }
    }, this.connectionTimeoutMs);

    this.ws.onopen = () => {
      console.log("[WS] Connected");
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.clearConnectionTimer();
      this.startHeartbeatWatchdog();
      this.options.onStateChange?.("connected");
    };

    this.ws.onmessage = (event) => {
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
        console.error("[WS] Failed to parse message", err);
      }
    };

    this.ws.onclose = () => {
      console.log("[WS] Connection closed");
      this.clearHeartbeatWatchdog();
      this.clearConnectionTimer();
      this.ws = null;
      this.isConnecting = false;
      if (this.manualDisconnect) {
        this.options.onStateChange?.("closed");
        this.options.onDisconnect?.();
        return;
      }
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error("[WS] Error", error);
      this.options.onStateChange?.("websocket-failed", "websocket error");
    };
  }

  private attemptReconnect() {
    this.clearHeartbeatWatchdog();
    this.clearConnectionTimer();
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.log(`[WS] Reconnecting in ${timeout}ms...`);
      this.options.onStateChange?.("reconnecting", `retry ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      setTimeout(() => this.connect(), timeout);
    } else {
      console.error("[WS] Max reconnect attempts reached");
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
      console.warn("[WS] Heartbeat timeout");
      this.options.onStateChange?.("websocket-failed", "heartbeat timed out");
      try {
        this.ws?.close();
      } catch {
        /* ignore */
      }
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
    this.clearHeartbeatWatchdog();
    this.clearConnectionTimer();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers.clear();
  }
}
