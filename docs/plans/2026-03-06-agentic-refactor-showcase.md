# Agentic Refactor Showcase Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure this repo into a reliable, test-backed, modular full-stack app that demonstrates end-to-end agentic coding workflows (plan -> implement -> verify -> document).

**Architecture:** Keep Flask + TypeScript, but split backend by concerns (routes/services/storage/schemas), centralize frontend API/date logic, and add strong automated verification (unit + integration + e2e + CI). Move from ad-hoc JSON mutations to atomic repository operations while preserving current API behavior.

**Tech Stack:** Flask, Python typing/dataclasses, pytest, TypeScript, Playwright CLI, GitHub Actions, Nix/direnv/just.

---

### Task 1: Establish Verification Baseline (Backend + Frontend + CI)

**Files:**
- Modify: `/Users/estrada/workspace/health_dash/pyproject.toml`
- Modify: `/Users/estrada/workspace/health_dash/package.json`
- Modify: `/Users/estrada/workspace/health_dash/justfile`
- Create: `/Users/estrada/workspace/health_dash/tests/api/test_healthcheck.py`
- Create: `/Users/estrada/workspace/health_dash/.github/workflows/ci.yml`

**Step 1: Write the failing backend test**

```python
# tests/api/test_healthcheck.py
from app import app

def test_healthcheck_route_exists():
    client = app.test_client()
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.get_json() == {"status": "ok"}
```

**Step 2: Run test to verify it fails**

Run: `uv run pytest tests/api/test_healthcheck.py -v`  
Expected: `FAIL` with 404 for `/api/health`.

**Step 3: Write minimal implementation**

```python
# app.py
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})
```

Add dev tooling:
- `pyproject.toml` dev deps: `pytest`
- `package.json` scripts: `lint` (placeholder command), `test:e2e` (Playwright screenshot smoke script)
- `justfile`: `test-py`, `type-check`, `verify`

**Step 4: Run test and checks**

Run: `uv run pytest tests/api/test_healthcheck.py -v && pnpm type-check`  
Expected: test `PASS`, TypeScript check `PASS`.

**Step 5: Commit**

```bash
git add pyproject.toml package.json justfile tests/api/test_healthcheck.py .github/workflows/ci.yml app.py
git commit -m "chore: add baseline verification and CI workflow"
```

---

### Task 2: Add Typed Request Validation Layer

**Files:**
- Create: `/Users/estrada/workspace/health_dash/backend/schemas.py`
- Create: `/Users/estrada/workspace/health_dash/backend/http.py`
- Create: `/Users/estrada/workspace/health_dash/tests/api/test_request_validation.py`
- Modify: `/Users/estrada/workspace/health_dash/app.py`

**Step 1: Write failing validation tests**

```python
def test_weights_rejects_non_json(client):
    response = client.post("/api/weights", data="not-json", content_type="text/plain")
    assert response.status_code == 400
    assert response.get_json()["error"] == "Request must be valid JSON"
```

**Step 2: Run test to verify it fails**

Run: `uv run pytest tests/api/test_request_validation.py -v`  
Expected: `FAIL` with current 500-path behavior.

**Step 3: Write minimal implementation**

```python
# backend/http.py
from flask import request

def require_json():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ValueError("Request must be valid JSON")
    return data
```

Use `require_json()` in all POST/PUT handlers before field access.

**Step 4: Run tests**

Run: `uv run pytest tests/api/test_request_validation.py -v`  
Expected: `PASS`.

**Step 5: Commit**

```bash
git add backend/http.py backend/schemas.py tests/api/test_request_validation.py app.py
git commit -m "refactor: centralize request json validation"
```

---

### Task 3: Introduce Atomic JSON Repository

**Files:**
- Create: `/Users/estrada/workspace/health_dash/backend/storage/json_repository.py`
- Create: `/Users/estrada/workspace/health_dash/tests/storage/test_json_repository.py`
- Modify: `/Users/estrada/workspace/health_dash/app.py`

**Step 1: Write failing storage tests**

```python
def test_append_is_atomic(tmp_path):
    repo = JsonRepository(tmp_path / "weights.json")
    repo.append({"weight": 150})
    assert repo.read_all() == [{"weight": 150}]
```

**Step 2: Run test to verify it fails**

Run: `uv run pytest tests/storage/test_json_repository.py -v`  
Expected: `FAIL` because repository does not exist.

**Step 3: Write minimal implementation**

```python
class JsonRepository:
    def append(self, item):
        data = self.read_all()
        data.append(item)
        self._atomic_write(data)
```

Use temp file + `os.replace` for atomic write. Replace direct read/write callsites in API handlers.

**Step 4: Run tests**

Run: `uv run pytest tests/storage/test_json_repository.py -v`  
Expected: `PASS`.

**Step 5: Commit**

```bash
git add backend/storage/json_repository.py tests/storage/test_json_repository.py app.py
git commit -m "refactor: add atomic json repository and migrate handlers"
```

---

### Task 4: Split Backend into Blueprints + Services

**Files:**
- Create: `/Users/estrada/workspace/health_dash/backend/app_factory.py`
- Create: `/Users/estrada/workspace/health_dash/backend/routes/pages.py`
- Create: `/Users/estrada/workspace/health_dash/backend/routes/weights.py`
- Create: `/Users/estrada/workspace/health_dash/backend/routes/workouts.py`
- Create: `/Users/estrada/workspace/health_dash/backend/routes/journal.py`
- Create: `/Users/estrada/workspace/health_dash/backend/routes/meals.py`
- Create: `/Users/estrada/workspace/health_dash/backend/services/journal_service.py`
- Modify: `/Users/estrada/workspace/health_dash/app.py`
- Modify: `/Users/estrada/workspace/health_dash/tests/api/test_healthcheck.py`

**Step 1: Write failing integration test for app factory**

```python
from backend.app_factory import create_app

def test_factory_registers_routes():
    app = create_app()
    client = app.test_client()
    assert client.get("/").status_code == 200
    assert client.get("/api/health").status_code == 200
```

**Step 2: Run test to verify it fails**

Run: `uv run pytest tests/api/test_healthcheck.py -v`  
Expected: import failure / missing factory.

**Step 3: Write minimal implementation**

```python
def create_app():
    app = Flask(__name__)
    app.register_blueprint(pages_bp)
    app.register_blueprint(weights_bp, url_prefix="/api")
    ...
    return app
```

Keep `app.py` as thin entrypoint that calls factory.

**Step 4: Run tests**

Run: `uv run pytest tests/api -v`  
Expected: `PASS`.

**Step 5: Commit**

```bash
git add backend app.py tests/api
git commit -m "refactor: introduce app factory blueprints and services"
```

---

### Task 5: Publish API Contract and Generate Frontend Types

**Files:**
- Create: `/Users/estrada/workspace/health_dash/docs/api/openapi.yaml`
- Create: `/Users/estrada/workspace/health_dash/src/api/types.ts`
- Create: `/Users/estrada/workspace/health_dash/src/api/client.ts`
- Modify: `/Users/estrada/workspace/health_dash/package.json`
- Create: `/Users/estrada/workspace/health_dash/tests/contracts/test_openapi_examples.py`

**Step 1: Write failing contract test**

```python
def test_openapi_file_exists():
    import pathlib
    assert pathlib.Path("docs/api/openapi.yaml").exists()
```

**Step 2: Run test to verify it fails**

Run: `uv run pytest tests/contracts/test_openapi_examples.py -v`  
Expected: `FAIL` (file missing).

**Step 3: Write minimal implementation**

- Add OpenAPI spec for:
  - `GET/POST /api/weights`
  - `GET/POST /api/workouts`
  - `GET/POST /api/meals`
  - `GET/POST/PUT /api/journal`
- Add `src/api/types.ts` initial generated/static types.
- Add typed `apiRequest<T>()` wrapper in `src/api/client.ts`.

**Step 4: Run checks**

Run: `uv run pytest tests/contracts/test_openapi_examples.py -v && pnpm type-check`  
Expected: `PASS`.

**Step 5: Commit**

```bash
git add docs/api/openapi.yaml src/api package.json tests/contracts
git commit -m "feat: add api contract and typed frontend client foundation"
```

---

### Task 6: Refactor Frontend Modules to Shared API + Date Utilities

**Files:**
- Create: `/Users/estrada/workspace/health_dash/src/lib/time.ts`
- Modify: `/Users/estrada/workspace/health_dash/src/shared.ts`
- Modify: `/Users/estrada/workspace/health_dash/src/weights.ts`
- Modify: `/Users/estrada/workspace/health_dash/src/workouts.ts`
- Modify: `/Users/estrada/workspace/health_dash/src/journal.ts`
- Modify: `/Users/estrada/workspace/health_dash/src/diet.ts`
- Create: `/Users/estrada/workspace/health_dash/src/lib/summary.ts`

**Step 1: Write failing TypeScript unit-style assertions (temporary)**

```typescript
// src/lib/time.test.ts (or script-based assertion if no test runner yet)
assert.equal(toLocalDateKey(new Date("2026-03-01T00:30:00Z"), "America/Los_Angeles"), "2026-02-28");
```

**Step 2: Run check to verify fail**

Run: `pnpm type-check`  
Expected: `FAIL` due to missing utility exports/imports.

**Step 3: Write minimal implementation**

- Add `toLocalDateKey`, `isWithinLastDays`, and shared summary calculators.
- Replace duplicated `fetch + error` branches with shared `api/client.ts` helpers.
- Ensure all summary cards use consistent date boundaries.

**Step 4: Run checks**

Run: `pnpm type-check && pnpm build`  
Expected: `PASS`.

**Step 5: Commit**

```bash
git add src/shared.ts src/lib src/weights.ts src/workouts.ts src/journal.ts src/diet.ts
git commit -m "refactor: centralize frontend api and time utilities"
```

---

### Task 7: Convert CSS to Intentional Design System Layers

**Files:**
- Create: `/Users/estrada/workspace/health_dash/static/css/tokens.css`
- Create: `/Users/estrada/workspace/health_dash/static/css/components.css`
- Create: `/Users/estrada/workspace/health_dash/static/css/utilities.css`
- Modify: `/Users/estrada/workspace/health_dash/static/css/style.css`
- Modify: `/Users/estrada/workspace/health_dash/templates/index.html`
- Modify: `/Users/estrada/workspace/health_dash/templates/journal.html`
- Modify: `/Users/estrada/workspace/health_dash/templates/diet.html`

**Step 1: Write failing visual consistency check (screenshot smoke)**

```bash
pnpm dlx playwright@latest screenshot --device="Desktop Chrome" http://127.0.0.1:5001 /tmp/before_refactor.png
```

Use this as baseline artifact; expected differences after refactor.

**Step 2: Verify current drift**

Run: `rg "#journal-input|#meal-title|#meal-calories|#weight-input" static/css/style.css`  
Expected: duplicated component-specific overrides.

**Step 3: Write minimal implementation**

- Move tokens to `tokens.css`.
- Move reusable card/form/message primitives to `components.css`.
- Keep page-specific exceptions minimal in `style.css`.
- Update templates if class hooks are needed.

**Step 4: Run verification**

Run: `pnpm build` and take fresh screenshots for `/`, `/journal`, `/diet` on desktop/mobile.  
Expected: no regressions, improved consistency.

**Step 5: Commit**

```bash
git add static/css templates
git commit -m "refactor: split css into tokens and component layers"
```

---

### Task 8: Add End-to-End Regression Checks for Core Flows

**Files:**
- Create: `/Users/estrada/workspace/health_dash/tests/e2e/smoke.spec.ts`
- Modify: `/Users/estrada/workspace/health_dash/package.json`
- Modify: `/Users/estrada/workspace/health_dash/justfile`

**Step 1: Write failing e2e test**

```typescript
test("can log weight and see success message", async ({ page }) => {
  await page.goto("http://127.0.0.1:5001/");
  await page.getByLabel("Today's Weight (lbs):").fill("154.8");
  await page.getByRole("button", { name: "Submit Weight" }).click();
  await expect(page.locator("#message")).toContainText("successfully");
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test:e2e`  
Expected: `FAIL` before harness setup.

**Step 3: Write minimal implementation**

- Add Playwright test command + config.
- Add smoke specs for:
  - weight submit
  - workout submit
  - journal submit
  - meal submit

**Step 4: Run full verification**

Run: `just verify`  
Expected: `pytest`, `type-check`, `build`, `e2e` all pass.

**Step 5: Commit**

```bash
git add tests/e2e package.json justfile
git commit -m "test: add e2e smoke coverage for all core flows"
```

---

### Task 9: Documentation + “Agentic Coding” Showcase Narrative

**Files:**
- Modify: `/Users/estrada/workspace/health_dash/README.md`
- Create: `/Users/estrada/workspace/health_dash/docs/architecture.md`
- Create: `/Users/estrada/workspace/health_dash/docs/agentic-showcase.md`

**Step 1: Write failing doc checklist**

```markdown
- [ ] Architecture diagram and module boundaries documented
- [ ] Verification commands listed
- [ ] Example agent workflow included
```

**Step 2: Verify checklist currently unmet**

Run: `rg "Architecture|agentic" README.md docs || true`  
Expected: missing/partial docs.

**Step 3: Write minimal implementation**

- Update README for current feature scope and dev shell/just usage.
- Add architecture doc with backend/frontend module map.
- Add showcase doc: “How an agent executed this refactor safely.”

**Step 4: Run verification**

Run: `just verify`  
Expected: all checks still pass after docs updates.

**Step 5: Commit**

```bash
git add README.md docs
git commit -m "docs: add architecture and agentic-coding showcase narrative"
```

---

### Task 10: Final Gate (Evidence-Based Completion)

**Files:**
- Modify: `/Users/estrada/workspace/health_dash/justfile` (if needed for final verify target)
- Create: `/Users/estrada/workspace/health_dash/docs/plans/2026-03-06-agentic-refactor-retro.md`

**Step 1: Run full pipeline**

Run:

```bash
just verify
```

Expected:
- `uv run pytest` -> all pass
- `pnpm type-check` -> pass
- `pnpm build` -> pass
- `pnpm test:e2e` -> pass

**Step 2: Capture evidence**

- Save command output excerpts and screenshot paths in retro doc.

**Step 3: Write retro**

Document:
- what changed
- defects caught by tests
- what agent automation accelerated
- remaining debt

**Step 4: Commit**

```bash
git add justfile docs/plans/2026-03-06-agentic-refactor-retro.md
git commit -m "chore: finalize verification evidence and refactor retro"
```

