type WebSocketMessageHandler = (data: any) => void;

export class WsClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Set<WebSocketMessageHandler> = new Set();
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(sessionId: string) {
    // Determine the correct WS URL based on current origin, defaulting to localhost for dev
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname === "localhost" ? "localhost:8000" : window.location.host;
    this.url = `${protocol}//${host}/ws/sessions/${sessionId}`;
  }

  public connect() {
    if (this.ws || this.isConnecting) return;
    this.isConnecting = true;
    
    console.log(`[WS] Connecting to ${this.url}`);
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("[WS] Connected");
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "ping") {
          // ignore heartbeat
          return;
        }
        this.handlers.forEach((handler) => handler(data));
      } catch (err) {
        console.error("[WS] Failed to parse message", err);
      }
    };

    this.ws.onclose = () => {
      console.log("[WS] Connection closed");
      this.ws = null;
      this.isConnecting = false;
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error("[WS] Error", error);
      // Close will be called, triggering reconnect
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.log(`[WS] Reconnecting in ${timeout}ms...`);
      setTimeout(() => this.connect(), timeout);
    } else {
      console.error("[WS] Max reconnect attempts reached");
    }
  }

  public subscribe(handler: WebSocketMessageHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers.clear();
  }
}
