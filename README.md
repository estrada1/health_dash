# Health Tracker

Simple weight tracking dashboard with local JSON storage and TypeScript frontend.

## Prerequisites

- Python 3.14+
- Node.js (for pnpm)
- pnpm

## Setup

### 1. Install Python dependencies

```bash
uv sync
```

### 2. Install Node.js dependencies and build TypeScript

```bash
pnpm install
pnpm build
```

This compiles `src/app.ts` to `static/js/app.js`.

## Development

Run in two separate terminals:

### Terminal 1: TypeScript watch mode (auto-recompile)

```bash
pnpm watch
```

This watches `src/app.ts` and automatically recompiles to `static/js/app.js` when you save changes.

### Terminal 2: Flask dev server

```bash
uv run python app.py
```

## Access

- Local: http://localhost:5001
- Network: http://[YOUR_IP]:5001

## TypeScript

The frontend is written in TypeScript for type safety. Source files are in `src/` and compile to `static/js/`.

- **Source**: `src/app.ts` (edit this)
- **Compiled**: `static/js/app.js` (generated, don't edit)
- **Source maps**: `static/js/app.js.map` (for debugging)

### Available npm scripts

- `pnpm build` - Compile TypeScript once
- `pnpm watch` - Auto-compile on file changes
- `pnpm type-check` - Check types without emitting files
- `pnpm clean` - Remove compiled files

Press Ctrl+C to stop.
