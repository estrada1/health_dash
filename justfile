set shell := ["bash", "-cu"]

# Show available commands when running `just` with no args.
default:
  @just --list

# Install Python and Node dependencies.
install:
  uv sync --all-groups
  pnpm install

# Compile TypeScript into `static/js/`.
build:
  pnpm build

# Watch TypeScript sources and rebuild on changes.
watch:
  pnpm watch

# Start the Flask development server.
serve:
  uv run python app.py

# Quick reminder for the two-terminal dev workflow.
dev:
  @echo "Run in two terminals:"
  @echo "  1) just watch"
  @echo "  2) just serve"

# Run frontend type checks without emitting JS.
check:
  pnpm type-check

# Run backend test suite.
test-py:
  uv run pytest

# Run browser-based end-to-end smoke tests.
test-e2e:
  pnpm test:e2e

# Full verification gate used before completion/commit.
verify:
  uv run pytest
  pnpm type-check
  pnpm build
  pnpm test:e2e
