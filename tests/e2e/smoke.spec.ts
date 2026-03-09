import { expect, test } from '@playwright/test';

test.describe('Core Flow Smoke', () => {
  test('can log weight entry', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel("Today's Weight (lbs):").fill('154.8');
    await page.getByRole('button', { name: 'Submit Weight' }).click();
    await expect(page.locator('#message')).toContainText('Weight entry added successfully!');
  });

  test('can log workout entry', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Workout Type:').selectOption('Running');
    await page.getByLabel('Notes (optional):').first().fill('Playwright smoke run');
    await page.getByRole('button', { name: 'Log Workout' }).click();
    await expect(page.locator('#workout-message')).toContainText('Workout logged successfully!');
  });

  test('can add journal entry', async ({ page }) => {
    await page.goto('/journal');
    await page.getByLabel('New Entry (Markdown supported):').fill(`Playwright journal ${Date.now()}`);
    await page.getByRole('button', { name: 'Add Journal Entry' }).click();
    await expect(page.locator('#journal-message')).toContainText('Journal entry added successfully!');
  });

  test('can log meal entry', async ({ page }) => {
    await page.goto('/diet');
    await page.getByLabel('Meal Title:').fill(`Smoke Meal ${Date.now()}`);
    await page.getByLabel('Kilocalories (optional):').fill('550');
    await page.getByLabel('Notes (optional):').fill('Playwright smoke meal');
    await page.getByRole('button', { name: 'Log Meal' }).click();
    await expect(page.locator('#meal-message')).toContainText('Meal logged successfully!');
  });
});
