# Changelog

## [1.0.0] - 2026-08-13

### Added

- QuantumRISC Studio v1.0.0 release packaging and documentation
- Backend-driven Studio workflow powered by FastAPI and websocket snapshot streaming
- Live engineering workstations for pipeline, registers, memory, hazards, waveform analysis, and performance
- Real session lifecycle operations for discovery, compile, run, step, reset, and snapshot
- Professional README release hero and GitHub release notes
- Changelog entry for the first production release

### Fixed

- Replaced public-facing demo language with production-oriented QuantumRISC messaging
- Clarified that cache, branch prediction, verification, and FPGA panels show explicit unavailable states when the backend does not emit those metrics
- Preserved the separation between the website, Studio, backend, and docs portal

### Verified

- Frontend production build
- FastAPI session and websocket integration
- Backend-driven Studio routing and snapshot consumption
