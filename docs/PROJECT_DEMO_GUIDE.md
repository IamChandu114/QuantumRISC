# QuantumRISC Project Demo and Presentation Guide

This guide is written for recording demos, presenting live, and answering questions in interviews, hackathons, conferences, and portfolio reviews.

It is based on the actual QuantumRISC implementation:
- public Professional Website
- QuantumRISC Studio
- FastAPI backend
- real RTL and verification
- Icarus Verilog simulation
- VCD-driven live visualization

Use this document as your presentation script and rehearsal guide.

---

## 1. 30 Second Elevator Pitch

QuantumRISC is a complete CPU engineering platform that connects a real SystemVerilog RISC-V processor, a FastAPI simulation backend, and a live engineering Studio UI. The public website launches the Studio, the Studio compiles and runs the RTL, and the backend parses the resulting VCD to show live registers, memory, pipeline behavior, hazards, forwarding, and performance metrics. It is designed as a portfolio-grade demo of end-to-end hardware/software integration.

---

## 2. 2 Minute Demo Script

Suggested script:

"Welcome to QuantumRISC, a live CPU engineering platform. The public website is the showcase entrypoint, and from there I launch the QuantumRISC Studio. The Studio is not mock data. It connects to a FastAPI backend that discovers the RTL, compiles the selected testbench with Icarus Verilog, runs the simulation, and parses the VCD output.

Once the simulation runs, the UI updates registers, memory, pipeline state, hazards, forwarding, and performance metrics directly from the trace. The waveform viewer also shows the latest generated VCD. This means the entire experience is driven by actual hardware simulation, not static screenshots or hardcoded values.

The platform is organized so the public website stays separate from the engineering application. The website presents the project professionally, and the Studio is where the real analysis happens. This makes QuantumRISC useful for interviews, demos, and technical conversations because it demonstrates RTL, verification, backend automation, and frontend visualization in one place." 

What to show:
- homepage
- Launch Studio button
- Studio loading
- compile/run result
- registers
- hazards
- waveform

---

## 3. 5 Minute Demo Script

### Opening

"QuantumRISC is a full engineering platform for a RISC-V CPU. It combines RTL, verification, a live simulation backend, and a real-time UI."

### Step 1: Website

Show the Professional Website first.

Say:
- "This is the public-facing showcase."
- "It does not duplicate the Studio."
- "Its job is to present the project and launch the engineering app."

### Step 2: Launch Studio

Click `Launch Studio`.

Say:
- "This opens the actual QuantumRISC Studio."
- "The Studio is the engineering environment."

### Step 3: Backend connection

When the Studio loads:
- point out that the backend creates a session
- explain that it discovers RTL and testbenches
- explain that it compiles with Icarus Verilog
- explain that it runs the simulation and parses the VCD

Say:
- "The UI is now connected to live simulation state."

### Step 4: Dashboard

Show the dashboard.

Say:
- "This summary comes from the current session snapshot."
- "It reflects the real simulation state."

### Step 5: Registers

Open the register view.

Say:
- "Registers are reconstructed from the writeback trace."
- "The values are not hardcoded."

### Step 6: Pipeline

Open the pipeline view.

Say:
- "This shows the stage-level flow through IF, ID, EX, MEM, and WB."
- "The backend drives it from the VCD timeline."

### Step 7: Hazards and forwarding

Open hazard and forwarding panels.

Say:
- "Hazards are derived from actual instruction dependencies."
- "Forwarding paths are inferred from the live trace."

### Step 8: Waveforms

Open the waveform viewer.

Say:
- "This is the latest generated VCD."
- "The waveform is built from real simulation output."

### Step 9: Performance

Open performance metrics.

Say:
- "IPC, CPI, retired instructions, and hazard counts are computed from the parsed run."

### Closing

Say:
- "QuantumRISC demonstrates the complete CPU engineering lifecycle from source code to simulation to live visualization."

---

## 4. 10 Minute Technical Presentation

### 0:00 to 1:00

Introduce the problem:
- CPU RTL is difficult to inspect
- simulation output is usually disconnected from presentations
- teams need a way to visualize real engineering state

### 1:00 to 2:00

Explain the architecture:
- website
- Studio
- backend
- RTL
- simulation
- VCD
- UI

### 2:00 to 3:00

Show the public website.

Explain:
- it is the landing page
- it launches Studio
- it does not contain the engineering controls

### 3:00 to 5:00

Open Studio and explain the session lifecycle:
- health
- discovery
- create session
- compile
- run
- parse
- stream

### 5:00 to 7:00

Show pipeline, hazards, forwarding, registers, memory.

Explain:
- values come from the trace
- backend computes the UI state
- playback controls step through the parsed timeline

### 7:00 to 8:30

Show waveform and performance.

Explain:
- the waveform is the latest VCD
- metrics are computed from the same run

### 8:30 to 10:00

Wrap up:
- talk about design decisions
- explain why the system is valuable
- point out its interview/demo readiness

---

## 5. Full Deep Technical Walkthrough

Use this when a reviewer wants the full story.

### Screen 1: Professional Website

What to say:
- "This is the public showcase."
- "It is the first impression of the project."
- "The design is separate from the engineering app."

What to notice:
- Launch Studio button
- architecture sections
- performance/verification narrative

### Screen 2: Studio landing view

What to say:
- "This is the engineering console."
- "It starts a backend session and loads live data."

### Screen 3: Dashboard

What to say:
- "This summarizes the current CPU run."
- "It reflects live simulation results, not placeholder content."

### Screen 4: Pipeline viewer

What to say:
- "Each stage shows where the instruction is in the pipeline."
- "The backend derives this from the parsed trace."

### Screen 5: Registers

What to say:
- "Register values come from writeback events in the simulation."
- "x0 remains zero as required by RISC-V."

### Screen 6: Memory

What to say:
- "Memory is not invented in the UI."
- "It is derived from the trace and run artifacts."

### Screen 7: Waveforms

What to say:
- "This is the live VCD visualization."
- "It is the strongest proof that the UI is driven by real simulation."

### Screen 8: Hazards

What to say:
- "RAW hazards are detected from the instruction flow."
- "The system shows when forwarding resolves them or when a stall is needed."

### Screen 9: Forwarding

What to say:
- "This explains how the pipeline bypasses results to avoid stalls."

### Screen 10: Performance

What to say:
- "IPC and CPI are computed from the live session."
- "These metrics help measure how the design behaves under simulation."

### Screen 11: Simulation controls

What to say:
- "Run compiles and executes the RTL."
- "Pause and resume control timeline playback."
- "Step advances one sample."
- "Reset returns to the start of the parsed trace."

### Screen 12: Backend and session flow

What to say:
- "The backend owns discovery, compile, run, parse, and stream."
- "The Studio is a client of the backend, not a separate simulation engine."

### Screen 13: RTL and verification

What to say:
- "The CPU source is SystemVerilog."
- "Testbenches are compiled automatically."
- "The entire platform is anchored on real HDL behavior."

---

## 6. Live Demo Order

Recommended live order:

1. Open the public website
2. Explain it is the launch surface
3. Click `Launch Studio`
4. Wait for Studio load
5. Show backend health / discovery if needed
6. Click Run or let the bridge auto-run
7. Show dashboard
8. Show registers
9. Show pipeline
10. Show memory
11. Show hazards
12. Show forwarding
13. Show waveform
14. Show performance
15. Optionally step/pause/reset

What recruiters should notice:
- real hardware flow
- polished UI
- backend automation
- structured architecture
- professional separation of concerns

---

## 7. Frequently Asked Questions

Below are 100 FAQ items with concise professional answers.

1. What is QuantumRISC?
   - A live CPU engineering platform for a real SystemVerilog RISC-V project.

2. Is the Studio real or mocked?
   - Real; it uses live backend simulation data.

3. Is the website separate from the Studio?
   - Yes; the website is the public launch surface.

4. What opens when I click Launch Studio?
   - The actual QuantumRISC Studio.

5. What powers the backend?
   - FastAPI, Icarus Verilog, VVP, and VCD parsing.

6. What file is the Studio?
   - `frontend/studio/quantumrisc-studio.html`.

7. What file is the public website?
   - `frontend/website/src/app/App.tsx` and its built output in `dist/`.

8. What is the main RTL top?
   - `pipeline_cpu_complete`.

9. What is the smoke RTL top?
   - `cpu_top`.

10. Why two tops?
    - One for the production demo and one for quick validation.

11. How is RTL discovered?
    - By scanning the repository for SystemVerilog modules.

12. How is compilation done?
    - Through `iverilog`.

13. How is execution done?
    - Through `vvp`.

14. What is parsed after run?
    - The generated VCD.

15. What is a VCD?
    - A waveform file containing signal changes over time.

16. Why parse the VCD?
    - To reconstruct live CPU state for the UI.

17. What does the register view show?
    - The architectural register file from the trace.

18. What does the memory view show?
    - The live memory window derived from the trace.

19. What does the pipeline view show?
    - Stage-level CPU execution state.

20. What does the hazard panel show?
    - RAW hazards derived from actual instruction flow.

21. What does the forwarding panel show?
    - Bypass paths used to resolve hazards.

22. What does the performance panel show?
    - CPI, IPC, retired instructions, hazards, and stalls.

23. What does the waveform view show?
    - The latest generated VCD timeline.

24. What does Run do?
    - Compiles and executes the selected simulation.

25. What does Pause do?
    - Stops playback of the parsed timeline.

26. What does Resume do?
    - Continues playback.

27. What does Step do?
    - Advances one sample.

28. What does Reset do?
    - Returns to the beginning of the trace.

29. Is the register file hardcoded?
    - No; it is derived from simulation output.

30. Is the memory hardcoded?
    - No; it is derived from the run trace.

31. Is the waveform hardcoded?
    - No; it comes from the actual VCD.

32. Are hazards hardcoded?
    - No; they are derived from instruction dependencies.

33. Are forwarding paths hardcoded?
    - No; they are derived from hazards.

34. Are performance metrics hardcoded?
    - No; they are computed from the live trace.

35. Why use WebSocket?
    - To stream live state updates instantly.

36. What does the session manager do?
    - It owns the state of each simulation run.

37. What does the discovery service do?
    - It identifies tops and testbenches automatically.

38. What does the compile manager do?
    - It invokes Icarus Verilog.

39. What does the run manager do?
    - It invokes VVP and finds the VCD.

40. What does the parser do?
    - It converts waveform changes into state snapshots.

41. What does the tracker layer do?
    - It turns timeline data into registers, memory, and pipeline views.

42. What does the analyzer layer do?
    - It computes hazards, forwarding, and metrics.

43. What is the main architectural style?
    - Single-issue, in-order, five-stage pipeline.

44. What makes the project presentation-ready?
    - A separated website, a polished Studio, and live simulation.

45. Why is this better than screenshots?
    - Because every value is derived from real simulation.

46. Can it be used in interviews?
    - Yes, it is designed for that.

47. Can it be used in a portfolio?
    - Yes, it is GitHub-ready and demo-friendly.

48. Can it be used for teaching?
    - Yes, it explains CPU behavior visually.

49. Can it be extended?
    - Yes, the architecture is modular.

50. What is the biggest technical strength?
    - The end-to-end connection from RTL to live UI.

51. What is the biggest presentation strength?
    - It looks like a real engineering product.

52. What is the biggest backend strength?
    - It compiles and runs actual RTL automatically.

53. What is the biggest frontend strength?
    - It shows live CPU state instead of mock panels.

54. Why is the public site separate?
    - To keep the landing page clean and professional.

55. Why is the Studio separate?
    - To keep the engineering workflow focused.

56. What does the Studio bridge do?
    - It connects the HTML UI to the backend session APIs.

57. What does the backend return to the UI?
    - Snapshots, metrics, waveform data, and runtime state.

58. What is the backend health endpoint for?
    - A quick readiness check.

59. What is the discovery endpoint for?
    - Showing detected RTL and testbenches.

60. Why is auto-discovery important?
    - It avoids hardcoded simulation lists.

61. Why is `pipeline_cpu_complete` preferred?
    - It is the production simulation anchor.

62. Why keep `cpu_top`?
    - It is a lightweight smoke target.

63. What is the role of `runs/`?
    - To isolate generated build and waveform artifacts.

64. What is the role of `verification/`?
    - To hold testbenches and verification collateral.

65. What is the role of `rtl/`?
    - To hold the hardware source of truth.

66. What is the role of `scripts/`?
    - To automate verification and smoke testing.

67. What is the role of `docs/`?
    - To document the project for developers and presenters.

68. What is the role of `frontend/website/`?
    - To host the public showcase.

69. What is the role of `frontend/studio/`?
    - To host the engineering app.

70. What is the role of `backend/`?
    - To orchestrate discovery, simulation, parsing, and live updates.

71. What should I say when opening the demo?
    - "This is a full CPU engineering platform built around real RTL."

72. What should I say before clicking Launch Studio?
    - "The website is the public entrypoint; the Studio is the engineering app."

73. What should I say when the Studio opens?
    - "The Studio is now connecting to the backend and simulation pipeline."

74. What should I say when the simulation runs?
    - "The backend is compiling and running the actual SystemVerilog design."

75. What should I say when the waveform appears?
    - "This waveform is the latest VCD from the run."

76. What should I say when registers update?
    - "These values are reconstructed from writeback activity in the trace."

77. What should I say when hazards appear?
    - "These are real dependencies detected from the instruction stream."

78. What should I say when forwarding appears?
    - "The backend inferred the bypass path from the hazard relationship."

79. What should I say when showing performance?
    - "These metrics are calculated from the live timeline."

80. Why is the project useful in recruiting?
    - It demonstrates both hardware depth and software integration.

81. Why is the project useful for professors?
    - It shows a complete architecture-to-UI system.

82. Why is the project useful for hackathons?
    - It is a polished, functional demo with live data.

83. Why is the project useful for conferences?
    - It presents a complete engineering pipeline in a visual way.

84. How do I explain the backend in one sentence?
    - It is the simulation control and data extraction layer.

85. How do I explain the frontend in one sentence?
    - It is the live visualization and presentation layer.

86. How do I explain the RTL in one sentence?
    - It is the actual CPU hardware being simulated.

87. How do I explain the verification in one sentence?
    - It is the testbench and assertion layer that validates the design.

88. How do I explain the architecture in one sentence?
    - It is a connected website, Studio, backend, and RTL simulation system.

89. What is the most convincing thing to show?
    - The live waveform and live register/pipeline updates.

90. What if someone asks whether it is real?
    - Show the VCD, the session API, and the changing state.

91. What if someone asks about extensibility?
    - Explain that discovery, parsing, and UI binding are modular.

92. What if someone asks about maintainability?
    - Explain the separation of website, Studio, backend, and RTL.

93. What if someone asks about performance?
    - Explain that the backend computes IPC/CPI and the UI renders them live.

94. What if someone asks about debugging?
    - Explain that the VCD, session snapshot, and timeline make debugging visible.

95. What if someone asks about realism?
    - Explain that all visible values come from actual simulation output.

96. What if someone asks about future roadmap?
    - Mention richer verification analytics and more RTL views.

97. What if someone asks what makes this special?
    - It turns hardware simulation into a product-like live experience.

98. What if someone asks why this matters?
    - It makes CPU engineering easier to present and understand.

99. What if someone asks for the bottom line?
    - It is a full-stack hardware engineering showcase built on real RTL.

100. What is the core message?
    - QuantumRISC proves that a CPU can be simulated, analyzed, and presented as a polished live system.

---

## 8. Technical Story

### Why this was built

QuantumRISC was built to bridge a common gap:
- RTL exists
- simulations exist
- waveforms exist
- but the experience is often disconnected and hard to present

This platform turns that into a product-like demo.

### Problems solved

- No single place to see the CPU run
- No clean launch flow from public site to engineering app
- No automatic backend orchestration
- No live VCD-driven UI
- No easy way to show hazards, forwarding, registers, memory, and metrics together

### Challenges

- keeping RTL as source of truth
- avoiding mock frontend state
- mapping VCD signals to architecture state
- keeping website and Studio separate
- preserving a polished presentation layer

### Architecture decisions

- Use FastAPI for simple, fast backend routing
- Use sessions to isolate runs
- Use discovery instead of hardcoded file lists
- Use WebSocket for live UI updates
- Keep website and Studio separate
- Keep the backend focused on simulation and data extraction

### Lessons learned

- hardware and frontend can work together cleanly
- real simulation data makes a much stronger demo
- separation of public site and engineering app keeps the product clearer
- good architecture makes maintenance easier

### Future roadmap

- richer waveform navigation
- more verification summaries
- deeper branch/cache analytics
- optional deeper CPU telemetry
- stronger automation around regression suites

---

## 9. Recruiter Highlights

- Built a real end-to-end CPU engineering platform
- Integrated RTL, verification, backend automation, and frontend visualization
- Automated Icarus Verilog compilation and VVP execution
- Parsed VCD output into live UI state
- Implemented live WebSocket session streaming
- Kept the professional website separate from the engineering app
- Removed placeholder UI data from the visible flow
- Produced a polished, interview-ready portfolio project

---

## 10. Resume Talking Points

- Built a full-stack QuantumRISC engineering platform connecting SystemVerilog RTL, FastAPI backend, VCD parsing, and a live CPU visualization UI
- Automated RTL discovery, compilation, simulation execution, and waveform parsing using Icarus Verilog and VVP
- Implemented live register, pipeline, memory, hazard, forwarding, and performance views from real simulation data
- Separated the public professional website from the engineering Studio while preserving a clean launch flow
- Designed a session-based backend architecture with REST APIs and WebSocket event streaming

---

## 11. LinkedIn Talking Points

- Completed a production-ready RISC-V engineering platform with live RTL simulation visualization
- Turned waveform data into a real-time engineering UI
- Built a FastAPI backend that compiles, runs, and parses SystemVerilog simulations automatically
- Integrated a polished showcase website with a separate engineering Studio

---

## 12. GitHub Showcase Description

QuantumRISC is a live RISC-V CPU engineering platform that connects real SystemVerilog RTL, automated simulation, VCD parsing, and a professional engineering UI. The public website launches the QuantumRISC Studio, where the backend compiles and runs the design, parses the waveform output, and streams live CPU state including registers, memory, pipeline flow, hazards, forwarding, and performance metrics.

---

## 13. Portfolio Description

QuantumRISC is an end-to-end CPU engineering platform designed to demonstrate real hardware/software integration. It includes a professional showcase website, a live engineering Studio, and a FastAPI backend that compiles RTL, runs simulations, parses VCD traces, and drives live visualizations of the CPU pipeline and architectural state.

---

## 14. Hackathon Pitch

QuantumRISC makes CPU simulation visible. Instead of treating RTL, testbenches, and waveforms as isolated artifacts, it connects them into a live product experience. A public website launches the Studio, the Studio connects to the backend, and the backend compiles the CPU, runs the simulation, parses the VCD, and streams live state to the UI. It is a complete, impressive demo for hardware teams and judges.

---

## 15. Investor Style Pitch

QuantumRISC is a hardware engineering platform that transforms CPU simulation into a polished, interactive product. It reduces the friction between RTL development and presentation by connecting real SystemVerilog design, automatic simulation, and live visualization in one system. The result is a highly demonstrable, technically credible platform suitable for education, recruiting, and engineering workflows.

---

## Final Note

If you are recording a demo, keep the story simple:

1. This is the public website.
2. This launches the Studio.
3. The Studio connects to the backend.
4. The backend compiles and runs the RTL.
5. The waveform becomes live UI state.
6. The platform shows the real CPU, not a mockup.

