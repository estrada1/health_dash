set shell := ["bash", "-cu"]

default:
  @just --list

install:
  uv sync --all-groups
  pnpm install

build:
  pnpm build

watch:
  pnpm watch

serve:
  uv run python app.py

dev:
  @echo "Run in two terminals:"
  @echo "  1) just watch"
  @echo "  2) just serve"

check:
  pnpm type-check

test-py:
  uv run pytest

test-e2e:
  pnpm test:e2e

verify:
  uv run pytest
  pnpm type-check
  pnpm build
  pnpm test:e2e
