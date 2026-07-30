# Contributing to QuantumRISC

QuantumRISC is intended to stay production-grade and easy to maintain.

## Principles

- Keep the RTL as the source of truth.
- Prefer real simulation data over mock data.
- Preserve the separation between website, Studio, docs, backend, and RTL.
- Keep changes small, reviewable, and well documented.

## Workflow

1. Create a topic branch.
2. Make focused changes.
3. Run the relevant build or smoke checks.
4. Update docs if the behavior changed.
5. Open a pull request with a concise summary.

## What to include

- What changed
- Why it changed
- How you verified it
- Any limitations or follow-up work

## What to avoid

- Placeholder data
- Dead code
- Duplicate front ends
- Unreviewed binary assets unless they are intentional release media

## Helpful checks

- Backend startup
- Website build
- Studio load
- Documentation load
- RTL compile and simulation

