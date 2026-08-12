# RISC-V Architect Pro

QuantumRISC Studio v2 — Qualcomm / Google / Microsoft production engineering prompt

You are a Principal Software Engineer and Systems Architect with experience at Qualcomm, Google, Microsoft, NVIDIA, Apple, and Intel.

Your task is to redesign and rebuild QuantumRISC Studio from scratch as a world-class semiconductor engineering platform.

This is not a UI redesign.

This is a production-grade RISC-V microarchitecture engineering environment that must be portfolio-quality and technically credible for Qualcomm, Google, Microsoft, NVIDIA, Intel, AMD, and Apple hardware/software engineering interviews.

The final result should look like a product used by CPU architects, RTL engineers, compiler engineers, verification engineers, and performance analysts.

Primary objective

Transform the current QuantumRISC Studio into a professional CPU engineering workstation that demonstrates:

Computer architecture expertise

RTL understanding

Pipeline visualization

Performance analysis

Verification workflows

Modern frontend engineering

Production software architecture

Architecture requirements

Completely replace the existing monolithic HTML file.

Build a modular architecture.

Required structure

frontend/studio-v2/

index.html

styles/

tokens.css

layout.css

components.css

animations.css

responsive.css

js/

app.js

state.js

router.js

sidebar.js

toolbar.js

dashboard.js

pipeline.js

registers.js

memory.js

cache.js

branch.js

hazards.js

waveforms.js

verification.js

performance.js

backend-bridge.js

components/

sidebar.html

toolbar.html

statusbar.html

assets/

No inline JavaScript.

No inline CSS.

No renderSidebar innerHTML architecture.

Use component-based rendering.

Visual design goals

Use a design language inspired by:

Apple Xcode

NVIDIA Nsight

Intel VTune

VS Code

Figma

Qualcomm engineering tools

Dark engineering aesthetic.

Cyan/emerald accent colors.

Glass panels.

Subtle grid background.

Hardware terminal feel.

Pixel-perfect spacing.

Excellent typography.

Layout requirements

Left sidebar (280px)

Always visible on desktop.

Collapsible.

Resizable.

Remember width and collapsed state using localStorage.

Top toolbar

Play

Pause

Step

Reset

Frequency control

Simulation speed

Search / command palette

Notifications

Theme switch

Main workspace

Responsive CSS Grid.

Independent panel scrolling.

No overflow clipping.

No horizontal scrolling.

Min-width:0 and min-height:0 correctly applied.

Required engineering modules

Dashboard

CPU status

Pipeline occupancy

IPC

Frequency

Execution timeline

Health indicators

Pipeline viewer

5-stage visualization

Instruction movement animation

Stalls

Bubbles

Flushes

Hazards

Forwarding paths

Register file

32 registers

Hex

Binary

Signed decimal

Live updates

Recently modified highlighting

Memory viewer

Segmented memory

Address navigation

Hex dump

ASCII view

Load/store highlighting

Cache explorer

L1 I-cache

L1 D-cache

Hit/miss visualization

Evictions

Replacement policy

Statistics

Branch predictor

Prediction history

Accuracy

Mispredictions

Recovery cycles

Hazard analyzer

RAW

WAR

WAW

Structural hazards

Forwarding diagnostics

Pipeline stall explanations

Waveforms

Professional timing viewer

Signal groups

Zoom

Cursor measurements

VCD-style interface

Verification center

Assertions

Coverage

Testbench results

Regression status

Pass/fail dashboard

Performance center

IPC trend

CPI breakdown

Cache statistics

Branch accuracy

Pipeline efficiency

Cycle accounting

Technical requirements

Use:

CSS custom properties

CSS Grid

Flexbox

ES modules

requestAnimationFrame

Mutation-safe rendering

Event delegation

State management

ResizeObserver

IntersectionObserver where appropriate

Avoid:

jQuery

Massive DOM re-renders

Inline event handlers

Global mutable state

Monolithic functions

Code quality

Write code that would pass a Google L4/L5 frontend review.

Use:

descriptive naming

modular functions

separation of concerns

documentation

defensive programming

accessibility

keyboard navigation

Performance targets

First render under 100ms.

60 FPS animations.

Minimal layout thrashing.

Efficient DOM updates.

Deliverables

Provide:

Complete production-ready code.

New architecture explanation.

File-by-file implementation.

Performance rationale.

Accessibility improvements.

Responsive behavior.

State management design.

Future extensibility plan.

Final requirement

The result must be so polished that a recruiter at Qualcomm, Google, Microsoft, NVIDIA, Intel, or Apple could reasonably believe it was built by a professional systems engineer with deep knowledge of RISC-V microarchitecture and production software engineering.

Do not produce a prototype.

Produce a production-quality engineering platform. Look like TOP Notch

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7a2fae67-7e8f-462a-9d16-78a7aea14a77).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
