export const LOCAL_BACKEND_URL = "http://localhost:8000";
export const RAILWAY_BACKEND_URL = "https://quantumrisc-production.up.railway.app";

function isVercelHost(hostname: string): boolean {
  return hostname === "vercel.app" || hostname.endsWith(".vercel.app") || hostname.includes("vercel.app");
}

export function resolveBackendApiBase(): string {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envUrl && envUrl.trim()) return envUrl.replace(/\/+$/, "");

  if (typeof window === "undefined") return LOCAL_BACKEND_URL;

  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") return LOCAL_BACKEND_URL;
  if (isVercelHost(hostname)) return RAILWAY_BACKEND_URL;

  return window.location.origin;
}

export function resolveBackendWsBase(): string {
  return resolveBackendApiBase()
    .replace(/^https:\/\//, "wss://")
    .replace(/^http:\/\//, "ws://");
}
