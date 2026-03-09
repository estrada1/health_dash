# Architecture

## Overview

Health Dash is a Flask + TypeScript app with local file persistence.

- Backend serves HTML pages and JSON APIs.
- Frontend calls APIs and renders dashboard sections.
- Data persists in `data/*.json` and `data/journal/*.md`.

## Backend

- `backend/app_factory.py`
  - Creates Flask app and registers blueprints.
- `backend/routes/`
  - `pages.py`: `/`, `/journal`, `/diet`
  - `health.py`: `/api/health`
  - `weights.py`, `workouts.py`, `meals.py`, `journal.py`: API handlers
- `backend/services/`
  - `data_service.py`: weights/workouts/meals persistence operations
  - `journal_service.py`: journal file lifecycle + markdown sanitization
- `backend/http.py`
  - Shared JSON request validation (`require_json_object`)
- `backend/storage/json_repository.py`
  - Atomic JSON write helper for file-backed collections

## Frontend

- `src/app.ts`: entrypoint and feature init orchestration
- Feature modules:
  - `src/weights.ts`
  - `src/workouts.ts`
  - `src/journal.ts`
  - `src/diet.ts`
- Shared libraries:
  - `src/api/client.ts`: typed request helper
  - `src/api/types.ts`: shared API shapes
  - `src/lib/time.ts`: date key and window helpers
  - `src/lib/summary.ts`: reusable summary calculations
  - `src/shared.ts`: DOM + formatting utilities

## Styling

- `static/css/tokens.css`: design tokens
- `static/css/components.css`: reusable component primitives
- `static/css/utilities.css`: utility classes
- `static/css/style.css`: page-specific rules

## Verification

- Backend tests: `pytest` in `tests/`
- Frontend type safety: `pnpm type-check`
- Unified command: `just verify`
