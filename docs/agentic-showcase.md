# Agentic Coding Showcase

This repo is structured to demonstrate practical agentic development:

1. Plan-first workflow (`docs/plans/`)
2. TDD cycle for behavior changes
3. Incremental refactoring with verification gates
4. Cross-layer consistency checks (API contract, tests, type-check, UI screenshot validation)

## Example Workflow

1. Define scope and create plan document.
2. Implement task-by-task with red/green verification.
3. Run `just verify` after each task.
4. Capture visual evidence with Playwright screenshots.
5. Document architecture and decisions.

## Why This Demonstrates Agentic Value

- **Reliability:** tests and type-check run continuously.
- **Traceability:** plan and architecture docs provide explicit reasoning.
- **Safety:** request validation and atomic persistence reduce failure modes.
- **Maintainability:** backend blueprints + service split and shared frontend API utilities reduce duplication.

## Core Commands

```bash
just install
just watch
just serve
just verify
```

## Artifacts

- Plans: `docs/plans/`
- API contract: `docs/api/openapi.yaml`
- Architecture map: `docs/architecture.md`
