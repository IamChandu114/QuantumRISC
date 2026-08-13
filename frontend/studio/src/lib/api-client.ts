const API_BASE = "http://localhost:8000/api"; // Default dev base url

export class ApiClient {
  static async get(endpoint: string) {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
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
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
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
