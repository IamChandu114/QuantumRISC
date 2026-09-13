export const LOCAL_BACKEND_URL = "http://127.0.0.1:8000";
export const PRODUCTION_BACKEND_URL = "https://quantumrisc.onrender.com";

export function resolveBackendApiBase(): string {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envUrl && envUrl.trim()) return envUrl.replace(/\/+$/, "");

  if (typeof window === "undefined") return LOCAL_BACKEND_URL;

  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") return LOCAL_BACKEND_URL;
  return PRODUCTION_BACKEND_URL;
}

export function resolveBackendWsBase(): string {
  return resolveBackendApiBase()
    .replace(/^https:\/\//, "wss://")
    .replace(/^http:\/\//, "ws://");
}
