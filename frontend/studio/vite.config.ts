import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

/**
 * QuantumRISC Studio v3 — Vite SPA Configuration
 *
 * Vite + React + TanStack Router client-side SPA build.
 * Output: dist/index.html + dist/assets/ served by the FastAPI backend.
 */
export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
      // SPA mode: no server-side rendering
      enableRouteGeneration: true,
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          router: ["@tanstack/react-router"],
          query: ["@tanstack/react-query"],
          radix: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-tabs",
            "@radix-ui/react-scroll-area",
          ],
          charts: ["recharts"],
          icons: ["lucide-react"],
        },
      },
    },
  },
  // Needed for SPA routing: the FastAPI backend handles /studio,
  // and the frontend handles sub-routes client-side.
  base: "/studio/",
  // Explicitly define env vars at build time so Vite statically inlines them.
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(
      process.env["VITE_API_URL"] ?? "https://quantumrisc-production.up.railway.app"
    ),
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8000",
      "/ws": { target: "ws://localhost:8000", ws: true },
    },
  },
});
