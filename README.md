# Health Dash

Local-first health dashboard with:
- Weight tracking + trend chart
- Workout logging + calendar/timeline
- Journal entries (markdown + edit)
- Diet/meal logging + calorie summaries

Data is stored in local JSON/Markdown files under `data/`.

## Tooling

- Python + Flask backend (`uv`)
- TypeScript frontend (`pnpm`)
- Nix + direnv dev shell (`flake.nix`, `.envrc`)
- Just command runner (`justfile`)
- Pytest verification baseline

## Quick Start

```bash
direnv allow
just install
pnpm build
just serve
```

Open: `http://127.0.0.1:5001`

## Development

Run in two terminals:

```bash
just watch
just serve
```

## Verification

Primary gate:

```bash
just verify
```

This runs:
- `uv run pytest`
- `pnpm type-check`

## Project Structure

- `backend/`: app factory, route blueprints, services, shared HTTP/storage helpers
- `app.py`: thin entrypoint
- `src/`: TypeScript frontend modules
- `static/css/`: tokens/components/utilities + page styles
- `templates/`: Flask HTML templates
- `docs/api/openapi.yaml`: API contract
- `tests/`: backend and contract tests

## Useful Commands

- `just install` - Sync Python + Node dependencies
- `just watch` - TypeScript watch
- `just serve` - Flask dev server
- `just verify` - tests + type-check
- `pnpm build` - compile TypeScript
