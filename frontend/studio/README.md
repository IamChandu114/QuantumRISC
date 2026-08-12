# QuantumRISC Studio

**QuantumRISC Studio v3** — RV32I Microarchitecture Engineering Workbench

A production-grade RISC-V CPU engineering platform built for cycle-accurate simulation, waveform analysis, hazard detection, and verification telemetry.

---

## Overview

QuantumRISC Studio connects to the QuantumRISC FastAPI backend and visualises live data from real Icarus Verilog RTL simulations. When the backend is offline, the studio runs in standalone mode using its own built-in cycle-accurate RV32I pipeline model — with no degradation in UI quality.

---

## Features

| Module | Description |
|---|---|
| **Dashboard** | Core telemetry: IPC, cycle count, stall rate, cache health |
| **Pipeline Viewer** | 5-stage visualisation (IF · ID · EX · MEM · WB) with forwarding paths |
| **Register File** | 32 × 32-bit GPRs with hex/dec/bin display and write-cycle highlighting |
| **Hazard Analyzer** | RAW · WAR · WAW · load-use · control hazard events |
| **Memory Viewer** | Physical hex dump with load/store event highlighting |
| **Cache Explorer** | L1I · L1D hit/miss/eviction statistics |
| **Branch Predictor** | Gshare predictor accuracy and misprediction timeline |
| **Waveform Viewer** | VCD-style timing viewer with cursor measurement |
| **Verification** | Assertions, functional coverage, and testbench results |
| **Performance** | IPC trend, CPI breakdown, and pipeline efficiency |

---

## Architecture

```
frontend/studio/
  src/
    lib/
      sim/            # Built-in RV32I cycle-accurate simulator
      studio/         # BackendBridge + StudioStore state management
    components/
      studio/         # Sidebar, Toolbar, StatusBar, Panel components
    routes/           # TanStack Router file-based pages
```

**Backend integration** is handled by [`backend-bridge.ts`](src/lib/studio/backend-bridge.ts):

- `GET /api/health` — liveness probe; reconnects automatically on failure
- `GET /api/discovery` — discovers compiled RTL top modules
- `POST /api/sessions` — creates a simulation session
- `POST /api/sessions/{id}/compile` — compiles RTL with Icarus Verilog
- `POST /api/sessions/{id}/run` — runs simulation, generates VCD
- `GET /api/sessions/{id}/snapshot` — pulls full state (registers, memory, metrics)
- `WS /ws/sessions/{id}` — streams `state.snapshot` / `state.delta` events

---

## Getting Started

### Development

```bash
cd frontend/studio
npm install
npm run dev
```

The dev server proxies `/api` and `/ws` to `http://localhost:8000` (the FastAPI backend).

### Production Build

```bash
npm run build
```

Output goes to `dist/`. The FastAPI backend serves `dist/index.html` at `/studio`.

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Routing | TanStack Router (file-based) |
| State | `useSyncExternalStore` + custom `StudioStore` |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Build | Vite 6 |
| Icons | Lucide React |

---

## Repository

[github.com/IamChandu114/QuantumRISC](https://github.com/IamChandu114/QuantumRISC)
