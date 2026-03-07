set shell := ["bash", "-cu"]

default:
  @just --list

install:
  uv sync
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
