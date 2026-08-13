const API_BASE = "http://localhost:8000/api"; // Default dev base url

export class ApiClient {
  static async get(endpoint: string) {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) {
      throw await this.httpError("GET", endpoint, response);
    }
    return response.json();
  }

  static async post(endpoint: string, body?: any) {
    const init: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...init,
    });
    if (!response.ok) {
      throw await this.httpError("POST", endpoint, response);
    }
    return response.json();
  }

  private static async httpError(method: string, endpoint: string, response: Response): Promise<Error> {
    const fallback = `Backend returned HTTP ${response.status} for ${method} ${endpoint}`;
    try {
      const text = await response.text();
      if (!text) return new Error(fallback);

      try {
        const parsed = JSON.parse(text) as { detail?: unknown; message?: unknown };
        const detail = parsed.detail ?? parsed.message;
        if (typeof detail === "string" && detail.trim()) {
          return new Error(`${fallback}: ${detail}`);
        }
      } catch {
        // Not JSON, fall through to raw text.
      }

      return new Error(`${fallback}: ${text.slice(0, 240)}`);
    } catch {
      return new Error(fallback);
    }
  }

  static async getDiscovery() {
    return this.get("/discovery");
  }

  static async createSession(top?: string, testbench?: string) {
    return this.post("/sessions", { top, testbench });
  }

  static async getSession(id: string) {
    return this.get(`/sessions/${id}`);
  }

  static async compile(id: string) {
    return this.post(`/sessions/${id}/compile`);
  }

  static async run(id: string) {
    return this.post(`/sessions/${id}/run`);
  }

  static async step(id: string) {
    return this.post(`/sessions/${id}/step`);
  }

  static async reset(id: string) {
    return this.post(`/sessions/${id}/reset`);
  }

  static async getSnapshot(id: string) {
    return this.get(`/sessions/${id}/snapshot`);
  }
}
