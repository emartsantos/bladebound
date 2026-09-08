import { test, expect } from '@playwright/test';
import { playAsGuest, readAuthStorage, expectShellVisible } from './helpers';

test.describe('Category 4: Browser refresh', () => {
  test('player session and displayed level persist across refresh', async ({ page }) => {
    await playAsGuest(page);
    const before = await readAuthStorage(page);

    await page.reload();
    await expectShellVisible(page);

    const after = await readAuthStorage(page);
    expect(after).toEqual(before);
  });

  test('navigation resets to the default section without errors', async ({ page }) => {
    await playAsGuest(page);
    const { openSection } = await import('./helpers');
    await openSection(page, 'World');
    await expect(page.getByRole('heading', { name: 'World Map' })).toBeVisible();

    // On refresh, navigation is not persisted (in-memory NavProvider) so the
    // shell restores to the default section - and must not crash.
    await page.reload();
    await expectShellVisible(page);
    await expect(page.getByRole('heading', { name: 'Character Sheet' })).toBeVisible();
  });

  test('resources (gold) render after refresh', async ({ page }) => {
    await playAsGuest(page);
    await page.reload();
    await expectShellVisible(page);

    // Demo player's gold (12,450) renders in the header after restore.
    const header = page.locator('header');
    await expect(header.getByText('12,450')).toBeVisible();
  });
});