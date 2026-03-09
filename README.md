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


## Preview

![Health Dash preview](docs/img/dashboard-preview.png)
