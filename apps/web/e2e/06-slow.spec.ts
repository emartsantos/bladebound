import { test, expect } from '@playwright/test';
import { playAsGuest, collectPageErrors, openSection } from './helpers';

test.describe('Category 6: Slow connections', () => {
  test('3G throttling still renders the shell with no data loss or errors', async ({ page }) => {
    const errors = collectPageErrors(page);

    // 3G-ish profile: ~750 kbps down, ~250 kbps up, 100 ms latency.
    const session = await page.context().newCDPSession(page);
    await session.send('Network.enable');
    await session.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 100,
      downloadThroughput: 750 * 1000 / 8,
      uploadThroughput: 250 * 1000 / 8,
    });

    await playAsGuest(page);
    await openSection(page, 'World');
    await expect(page.getByRole('heading', { name: 'World Map' })).toBeVisible();

    expect(errors.length).toBe(0);
  });

  test('slow initial chunk: loading state renders before the shell', async ({ page }) => {
    // Delay every JS chunk by 1.2s so a loading state is observable.
    await page.route('**/_next/static/chunks/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.continue();
    });

    await page.goto('/');

    // The app's initial "Loading..." state (state.loading) appears first…
    await expect(page.getByText('Loading...')).toBeVisible({ timeout: 20_000 });

    // …and the shell eventually hydrates without timing out or going stale.
    await playAsGuest(page);
  });

  test('timeouts on slow API responses are tolerated (requests simply fail)', async ({ page }) => {
    await playAsGuest(page);
    const errors = collectPageErrors(page);

    // Make every /api request hang ~2x the client timeout, then fail.
    await page.route('**/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    });

    await openSection(page, 'Skills');
    await expect(page.getByRole('heading', { name: 'Skills' })).toBeVisible();

    expect(errors.length).toBe(0);
  });
});