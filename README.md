# QuantumRISC Studio

![QuantumRISC logo](assets/screenshots/website-hero.svg)

QuantumRISC Studio — A backend‑driven RISC‑V CPU architecture and RTL engineering platform  
Tagline: Unified RTL implementation, cycle‑accurate simulation, VCD‑driven state reconstruction, and realtime engineering telemetry for professional CPU design teams.

[Repository](https://github.com/IamChandu114/QuantumRISC) · Website: http://127.0.0.1:8000/ · Studio: http://127.0.0.1:8000/studio · Docs: http://127.0.0.1:8000/docs

Badges: v1.0.0 · MIT

---

Executive summary
-----------------
QuantumRISC is a production‑grade engineering platform that integrates a real SystemVerilog RISC‑V implementation with a backend orchestration layer and a live Studio UI. It is designed to remove the friction between RTL, verification, and architectural debugging by turning VCD traces, simulator runs, and verification flows into a single, backend‑driven engineering workstation.

QuantumRISC targets professional engineering teams who need:
- cycle‑accurate visibility into pipeline state and hazards,
- deterministic reconstruction of architectural state from waveform traces,
- reproducible simulation sessions with programmatic orchestration,
- and realtime telemetry to drive tooling and automation.

The problem
-----------
Modern RTL and verification workflows are fragmented. Engineers routinely work across a set of disconnected tools:

- text editors, build scripts and Makefiles for RTL compilation,
- command‑line simulators (Icarus, VCS, Verilator) that emit VCD and log files,
- waveform viewers (GTKWave) that provide signal traces but not architectural context,
- ad‑hoc scripts that map signals to registers/memory and generate human‑readable dumps,
- separate dashboards or spreadsheets to track pipeline hazards, forwarding decisions and performance.

This fragmentation creates three recurring engineering issues:
1. Lack of end‑to‑end reproducibility — simulations, traces and derived state are not reproducible or easily shareable.
2. Limited architectural visibility — waveforms are low‑level; mapping them to ISA state and pipeline semantics is manual and error‑prone.
3. Slow iteration and debugging — context switching and manual parsing slow down root‑cause analysis of functional and microarchitectural bugs.

The solution
------------
QuantumRISC solves these problems by unifying the toolchain into a backend‑driven engineering workstation:

- FastAPI backend for deterministic session orchestration (compile → run → snapshot).
- Standard simulator integration (Icarus Verilog / vvp) to produce VCD artifacts.
- Robust VCD parser that maps signal transitions to architectural events and reconstructs register/memory state.
- Telemetry pipeline and WebSocket stream to push structured, time‑aligned snapshots to the Studio.
- Engineering Studio that visualizes pipeline stages, register files, memory views, hazards, forwarding networks and waveforms in sync.

The platform treats the VCD as the canonical source and derives a structured architectural model from it, enabling deterministic debugging and automated analysis across runs and engineers.

Why QuantumRISC is different
---------------------------
QuantumRISC is not a waveform viewer or a toy CPU simulator. Key distinctions:

- vs GTKWave: GTKWave is a trace explorer; QuantumRISC reconstructs ISA and pipeline semantics from traces and streams structured state to tooling and automation.
- vs standalone simulators: Simulators produce VCD and logs; QuantumRISC provides orchestration, parsing, and state synthesis so traces are actionable engineering assets.
- vs educational or browser-only visualizers: Those prioritize exposition and limited models. QuantumRISC is built around real RTL, verification infrastructure, and production‑quality telemetry with an emphasis on engineering correctness and reproducibility.

Architecture overview
---------------------
(Refer to assets/diagrams/overall-system.svg for a high‑level diagram.)

Core components:
- Frontend (Studio, Website, Docs)
  - Studio consumes structured telemetry and renders architectural views.
  - Site and docs provide product and developer entry points.
- Backend (FastAPI)
  - Session management, compile/run orchestration, VCD ingestion, telemetry pipeline, REST and WebSocket interfaces.
- Simulation engine
  - Standard RTL toolchain integration (Icarus Verilog / vvp by default), configurable topologies for different verification targets.
- VCD parser & state reconstructor
  - Converts signal transitions into time‑sticky architectural facts (register writes, memory access, pipeline latching).
- Telemetry pipeline & WebSocket sync
  - Streams time‑aligned deltas and snapshots to the Studio, supports session replay and live stepping.
- Documentation and validation portal
  - Developer and architecture guides served alongside the Studio.

End‑to‑end engineering workflow
-------------------------------
RTL → compile → simulate → VCD output → parse waveform → reconstruct architectural state → stream telemetry → visualize in Studio.

1. Select RTL top and testbench via the Studio or API.
2. Backend invokes the simulator, writes VCD into a run directory.
3. VCD parser extracts signal transitions, identifies architectural events and builds delta snapshots.
4. Backend persists snapshots and publishes a WebSocket stream for the Studio.
5. Studio visualizes pipeline state, memory/register contents and correlated waveforms; engineers can step, rewind or snapshot sessions.

Core engineering capabilities
-----------------------------
Grouped by engineering domain (feature focus on technical capability):

Processor architecture
- RV32IMAC base implementation with ISA‑level mapping and test vectors.
- Full register file, ALU, control and CSR handling implemented in SystemVerilog.

Pipeline
- Five‑stage pipeline with explicit pipeline registers.
- Hazard detection, forwarding network, branch resolution and pipeline stall logic exposed to the Studio.
- Cycle‑accurate mapping from signal transitions to in‑flight instruction context.

Verification
- Testbench inventory and harnesses under verification/tb/.
- Simulation orchestration and repeatable session management.
- Automatic VCD capture and run directory organization for traceability.

Debugging
- Reconstructed register and memory views aligned to cycle timestamps.
- Synchronized waveform + architectural state for stepwise debugging.
- Snapshot export and trace replay for offline analysis.

Analysis
- Hazard and forwarding analyzers that derive root causes from waveform data.
- Performance counters and telemetry aggregation for IPC and pipeline throughput analysis (backend‑dependent).

Documentation & reproducibility
- Developer and architecture guides served as a portal; session artifacts are stored per run for reproducibility.

Deployment & automation
- Containerized backend and CI workflows for consistent developer environments.
- REST API and CLI entry points for automation in CI and verification farms.

Technical challenges solved
--------------------------
This project addresses several non‑trivial engineering problems:

- Cycle‑accurate pipeline tracking:
  - Correlating signal transitions across multiple modules to reconstruct per‑cycle instruction context requires robust timing alignment and deterministic snapshot models.
- Architectural state reconstruction from VCD:
  - VCD is a signal‑level timeline; mapping it into ISA writes, memory transactions and register lifetimes requires explicit heuristics and signal correlation logic that tolerate optimizations and instrumentation gaps.
- Real‑time telemetry and websocket synchronization:
  - Delivering timely, consistent snapshots under step/run/rewind operations demands carefully designed deltas, backpressure handling, and a canonical authoritative backend state.
- Backend/frontend consistency:
  - The backend is the source of truth. The Studio is a thin consumer: UI state must gracefully represent missing telemetry while preserving session semantics.
- Session management and orchestration:
  - Deterministic compile/run pipelines, reproducible run directories and trace metadata for regression and root‑cause analysis across engineers.
- VCD signal correlation at scale:
  - Large traces require streaming parsing and incremental state updates to avoid excessive memory use and to enable live streaming to the Studio.

Project scale and composition
-----------------------------
This repository is organized to represent a production engineering platform rather than a tutorial:

- Languages (repo composition): TypeScript 83.7% · Python 6.6% · SystemVerilog 5.4% · CSS, JS, HTML, other.
- Major components:
  - frontend/ (website, studio, docs)
  - backend/ (FastAPI app, sim orchestration, telemetry)
  - rtl/ (CPU, memory, pipeline)
  - verification/ (testbenches, harnesses)
  - scripts/ and deployment artifacts
- Codebase is modular: separate concerns for simulation orchestration, parsing, tracking, analyzers and UI.

What is included (what I built)
-------------------------------
This repository contains a complete engineering platform that implements:

- Processor architecture and RTL (rtl/cpu/ and pipeline components).
- Verification harnesses and testbenches (verification/tb/).
- Simulation orchestration (backend/app/sim/): compile, run, manage sessions.
- VCD parsing and state reconstruction (backend/app/vcd/).
- Trackers and analyzers (backend/app/trackers/, backend/app/analyzers/).
- WebSocket telemetry engine (backend/app/websocket/) and REST control APIs.
- Engineering Studio UI (frontend/studio/) that consumes structured telemetry.
- Documentation portal and developer guides (frontend/docs/ and /docs route).
- Containerized deployment and CI workflows for reproducible builds.

Validation
----------
Honest, engineering‑focused validation that is reproducible:

- RTL compilation and simulation: wired through the backend using Icarus Verilog by default. Runs produce VCD artifacts under runs/.
- VCD parsing: backend parses VCD and generates time‑aligned snapshots for the Studio.
- Telemetry: WebSocket stream is implemented and used by the Studio; available session telemetry is consumed live. Some higher‑level metrics (e.g., branch prediction accuracy, cache statistics) are emitted only when backends or instrumentation generate the corresponding telemetry.
- CI: Frontend build and linting are validated in GitHub Actions for build stability.
Note: performance metrics and synthesis/frequency targets are backend/instrumentation dependent; they appear when the relevant synthesis or telemetry reports are available.

Industry relevance
------------------
QuantumRISC maps directly to tasks common in professional CPU/SoC engineering:

- CPU architecture design and microarchitecture verification.
- RTL engineering and synthesis preparation for FPGA/ASIC flows.
- Verification infrastructure for regression, CI and debug.
- Hardware‑software integration and toolchain validation.
- Developer tools for reproducible simulation and trace analysis.

Documentation
-------------
This README is an executive entry point. Detailed guides, API references, architecture docs and developer tutorials are in the documentation portal: http://127.0.0.1:8000/docs

Repository structure (concise)
-----------------------------
QuantumRISC/
  backend/                # FastAPI backend, simulation managers, VCD parsing, trackers, analyzers
  frontend/
    website/              # Public site
    studio/               # Live engineering Studio UI
    docs/                 # Documentation site
  rtl/                    # SystemVerilog CPU implementation and pipeline
  verification/           # SystemVerilog testbenches
  scripts/                # Automation and smoke tests
  runs/                   # Simulation runs and VCD artifacts
  assets/                 # Diagrams and release media
  docs/                   # Long‑form engineering guides

Engineering philosophy
----------------------
QuantumRISC is governed by pragmatic engineering principles:

- Correctness first: the backend is authoritative; the Studio visualizes derived state rather than inventing it.
- Visibility and traceability: every session, run and VCD artifact is persisted and linkable for reproducible analysis.
- Reproducibility: deterministic orchestration and run metadata enable consistent debugging across engineers and CI systems.
- Engineering integrity: clear separation of concerns, testable parsers, and analyzers designed for deterministic behavior under large traces.
- Backend‑driven state: UI is a consumer of structured telemetry; meaningful analysis requires well‑instrumented simulation and deterministic data pipelines.
