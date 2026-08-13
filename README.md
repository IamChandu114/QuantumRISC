# QuantumRISC

<div align="center">
  <img src="assets/screenshots/website-hero.svg" alt="QuantumRISC logo" width="720" />

  <h3>Backend-driven RISC-V CPU architecture and RTL engineering platform for live simulation, waveform analysis, and verification.</h3>

  <p>
    QuantumRISC turns RTL, VCD traces, and backend telemetry into a synchronized engineering workstation for CPU design, debugging, and validation.
  </p>

  <p>
    <a href="https://github.com/IamChandu114/QuantumRISC">
      <img src="https://img.shields.io/badge/QuantumRISC-v1.0.0-00d4ff?style=for-the-badge" alt="QuantumRISC v1.0.0" />
    </a>
    <img src="https://img.shields.io/badge/Backend-FastAPI-00c2ff?style=for-the-badge" alt="FastAPI backend" />
    <img src="https://img.shields.io/badge/Streaming-WebSocket-00ff88?style=for-the-badge" alt="WebSocket streaming" />
    <img src="https://img.shields.io/badge/ISA-RV32I-7c3aed?style=for-the-badge" alt="RV32I ISA" />
    <img src="https://img.shields.io/badge/RTL-SystemVerilog-ff9f1c?style=for-the-badge" alt="SystemVerilog RTL" />
    <img src="https://img.shields.io/badge/License-MIT-3b82f6?style=for-the-badge" alt="MIT license" />
  </p>
</div>

## Why QuantumRISC Exists

QuantumRISC exists to close the gap between RTL development, simulation output, and architectural visibility. Instead of forcing engineers to stitch together simulators, waveform viewers, scripts, and spreadsheets, it presents the CPU as a live backend-driven system with synchronized pipeline, register, memory, hazard, and waveform state.

## The Engineering Problem

CPU and RTL workflows are usually fragmented:

- RTL compiles in one toolchain.
- Simulation runs in another.
- VCD traces are inspected in a separate viewer.
- Architectural state is reconstructed manually.
- Verification, performance, and telemetry are often disconnected from the live debug loop.

That fragmentation slows down root-cause analysis, makes reviews harder, and hides the relationship between microarchitecture and signal-level behavior.

## The QuantumRISC Solution

QuantumRISC unifies the workflow into a single engineering platform:

- FastAPI orchestrates sessions, compile/run flows, snapshots, and telemetry.
- WebSockets stream cycle-aligned state into the Studio.
- The backend reconstructs architectural data from simulation and VCD traces.
- The UI presents pipeline, registers, memory, hazards, waveforms, verification, RTL hierarchy, and FPGA analysis in one place.
- Missing telemetry is shown explicitly as unavailable state rather than being fabricated.

## System Architecture

![Overall system](assets/diagrams/overall-system.svg)
![Backend architecture](assets/diagrams/backend-architecture.svg)
![Simulation flow](assets/diagrams/simulation-flow.svg)
![WebSocket sync](assets/diagrams/websocket-sync.svg)

- Frontend: `frontend/website`, `frontend/studio`, `frontend/docs`
- Backend: `backend`
- RTL: `rtl`
- Verification: `verification`
- Artifacts: `runs`, `waveforms`, `reports`, `assets`

## End-to-End Workflow

1. Select RTL and testbench inputs.
2. Backend discovers the project, compiles the design, and starts simulation.
3. Simulation generates VCD and runtime artifacts.
4. Backend parses traces and derives architectural snapshots.
5. WebSocket updates stream into the Studio cycle by cycle.
6. Engineers inspect pipeline state, memory, registers, waveforms, hazards, and verification results.

## What I Built

- A production-style Studio for CPU architecture visualization.
- A FastAPI backend for session control and simulation orchestration.
- A WebSocket telemetry layer for live, synchronized UI updates.
- A VCD parsing and state reconstruction pipeline.
- A real RV32I RTL codebase with verification testbenches.
- A documentation portal and public website for project presentation.

![Studio dashboard](assets/screenshots/studio-dashboard.svg)
![Pipeline visualizer](assets/screenshots/pipeline-visualizer.svg)
![RTL explorer](assets/screenshots/rtl-explorer.svg)
![Verification dashboard](assets/screenshots/verification-dashboard.svg)
![Documentation portal](assets/screenshots/documentation-portal.svg)

## Technical Challenges Solved

- Cycle-accurate state synchronization across pipeline, register, memory, and waveform views.
- Backend-driven reconstruction of architectural state from simulation output and VCD traces.
- Low-latency streaming of session snapshots over WebSockets.
- Clear representation of missing telemetry without fake values or demo data.
- Separation of frontend presentation from backend authority to keep the system reproducible.

## Skills Demonstrated

- Computer architecture and microarchitecture visualization
- RTL engineering and simulation workflow design
- FastAPI backend development
- WebSocket and realtime state systems
- VCD parsing and signal-to-state mapping
- Frontend systems engineering and product presentation
- Documentation architecture for technical audiences

## Why QuantumRISC Is Different

QuantumRISC is not a mock dashboard or a classroom CPU demo. It is built around live simulation data and a backend source of truth, so the UI reflects real engineering state instead of invented telemetry. That makes it more suitable for serious architecture review, verification debugging, and systems presentation.

## Industry Relevance

QuantumRISC maps directly to work commonly evaluated by engineering teams at Google, Microsoft, Qualcomm, NVIDIA, AMD, Intel, and Apple:

- CPU architecture and RTL development
- Verification and debug infrastructure
- Simulation automation and backend orchestration
- Real-time engineering tools
- Trace analysis and hardware visualization

## Repository Structure

```text
QuantumRISC/
  backend/        FastAPI backend, simulation orchestration, telemetry
  frontend/
    website/      Public project website
    studio/       Live engineering Studio
    docs/         Documentation portal
  rtl/            SystemVerilog CPU implementation
  verification/   Testbenches and verification assets
  assets/         Diagrams, screenshots, and release media
  runs/           Simulation output and session artifacts
  waveforms/      VCD traces and waveform data
  reports/        Build and verification reports
```

## Documentation Links

- Repository: [GitHub](https://github.com/IamChandu114/QuantumRISC)
- Studio source: [`frontend/studio`](frontend/studio/)
- Website source: [`frontend/website`](frontend/website/)
- Documentation portal source: [`frontend/docs`](frontend/docs/)
- Backend source: [`backend`](backend/)
- RTL source: [`rtl`](rtl/)

## License

MIT
