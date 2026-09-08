import { test, expect } from '@playwright/test';
import { playAsGuest, collectPageErrors, openSection } from './helpers';

test.describe('Category 1: Network failure', () => {
  test('aborted API calls degrade gracefully (no crash, shell still usable)', async ({ page }) => {
    await playAsGuest(page);
    const errors = collectPageErrors(page);

    // Simulate a dead backend: every /api call fails fast.
    await page.route('**/api/**', (route) => route.abort('failed'));
    await page.route('**/verify**', (route) => route.abort('failed'));

    await openSection(page, 'World');
    await expect(page.getByRole('heading', { name: 'World Map' })).toBeVisible();

    await openSection(page, 'Skills');
    await expect(page.getByRole('heading', { name: 'Skills' })).toBeVisible();

    // No uncaught page errors and no app-level crash.
    expect(errors.length).toBe(0);
  });

  test('hard offline: in-app navigation still works without a reload', async ({ page }) => {
    await playAsGuest(page);
    const errors = collectPageErrors(page);

    const session = await page.context().newCDPSession(page);
    await session.send('Network.enable');
    await session.send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    });

    // SPA navigation must not depend on the network once bootstrapped.
    await openSection(page, 'Inventory');
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();

    await openSection(page, 'Quests');
    await expect(page.getByRole('heading', { name: 'Quests' })).toBeVisible();

    expect(errors.length).toBe(0);
  });
});