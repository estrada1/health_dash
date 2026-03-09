import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:5010',
    trace: 'off',
  },
  webServer: {
    command: 'rm -rf /tmp/health_dash_e2e_data && mkdir -p /tmp/health_dash_e2e_data/journal && HEALTH_DASH_DATA_DIR=/tmp/health_dash_e2e_data uv run python -c "from app import app; app.run(host=\'127.0.0.1\', port=5010, debug=False)"',
    url: 'http://127.0.0.1:5010',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
