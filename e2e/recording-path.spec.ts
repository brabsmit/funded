import { test, expect } from '@playwright/test';

test('recording path: home → Oakridge → four blocks', async ({ page }, info) => {
  const shot = (name: string) => page.screenshot({ path: `e2e/screenshots/${info.project.name}-${name}.png`, fullPage: true });

  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("Check a school's status");
  await expect(page.getByText('Draft', { exact: true })).toBeVisible();
  // Four schools at different stages; the live one leads; every card says what is next.
  const cards = page.getByTestId('school-card');
  await expect(cards).toHaveCount(4);
  await expect(cards.first()).toContainText('Oakridge');
  await expect(cards.first()).toContainText(/Next: .*Nov 3, 2026/);
  await expect(page.getByText('draft record')).toHaveCount(3);
  await shot('1-home');

  await page.getByRole('link', { name: /Oakridge/ }).click();
  await expect(page).toHaveURL(/\/schools\/oakridge\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Oakridge');

  for (const h of ['The short answer', 'Where it is', 'What happens next', 'Who decides', 'Where to engage', 'What has been asked']) {
    await expect(page.getByRole('heading', { name: new RegExp(h) })).toBeVisible();
  }
  await expect(page.getByText('Next', { exact: true })).toHaveCount(1);

  // Understand: the short answer leads with one countdown, the scale axis and the money picture render.
  await expect(page.getByTestId('countdown')).toContainText(/\d+ days/);
  await expect(page.getByRole('img', { name: /From the first question to the planned fix/ })).toBeVisible();
  await expect(page.getByRole('figure', { name: /Where the money sits/ })).toBeVisible();
  await expect(page.getByText('Why this track')).toBeVisible();

  // Act: the soonest venue comes first with a closing date, carries a ready-to-say ask, and open questions are marked.
  const venues = page.getByTestId('engage-item');
  await expect(venues.first()).toContainText(/Closes|On /);
  await expect(page.getByTestId('ask').first()).toBeVisible();
  await expect(page.getByText('Not yet asked')).toHaveCount(2);
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

test('padding schools render at their own stages', async ({ page }, info) => {
  for (const [id, stage] of [['jamestown', 'Bond referendum'], ['hoffman-boston', 'Project development and design'], ['ashlawn', 'Construction']]) {
    await page.goto(`./schools/${id}/`);
    await expect(page.getByText('Where it stands').locator('..')).toContainText(stage);
    await expect(page.getByRole('figure', { name: /Where the money sits/ })).toBeVisible();
    if (info.project.name === 'laptop') await page.screenshot({ path: `e2e/screenshots/laptop-4-${id}.png`, fullPage: true });
  }
});
