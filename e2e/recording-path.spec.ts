import { test, expect } from '@playwright/test';

test('recording path: home → Oakridge → four blocks', async ({ page }, info) => {
  const shot = (name: string) => page.screenshot({ path: `e2e/screenshots/${info.project.name}-${name}.png`, fullPage: true });

  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("Check a school's status");
  await expect(page.getByText('Draft', { exact: true })).toBeVisible();
  await shot('1-home');

  await page.getByRole('link', { name: /Oakridge/ }).click();
  await expect(page).toHaveURL(/\/schools\/oakridge\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Oakridge');

  for (const h of ['Where it is', 'What happens next', 'Who decides', 'Where to engage']) {
    await expect(page.getByRole('heading', { name: new RegExp(h) })).toBeVisible();
  }
  await expect(page.getByText('Next', { exact: true })).toHaveCount(1);
  await shot('2-oakridge');

  // Source popover opens without JavaScript beyond the platform.
  const chip = page.getByRole('button', { name: /source:/ }).first();
  await chip.click();
  await expect(page.locator('[popover]:popover-open')).toBeVisible();
  await shot('3-popover');
});

test('tracks and roadmap render', async ({ page }) => {
  await page.goto('./tracks/');
  await expect(page.locator('section#cip, section#mcmm, section#gift')).toHaveCount(3);
  await page.goto('./roadmap/');
  await expect(page.getByText('Phase 1 · Now')).toBeVisible();
});
