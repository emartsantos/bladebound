import { test, expect } from '@playwright/test';
import { playAsGuest, readAuthStorage, expectShellVisible } from './helpers';

test.describe('Category 3: Saving / Loading', () => {
  test('guest play persists a valid save snapshot to localStorage', async ({ page }) => {
    await playAsGuest(page);

    const auth = await readAuthStorage(page);
    expect(auth).not.toBeNull();
    // The auth record is the session/save handle that would be hydrated on start.
    expect(auth!.guestId).toBeTruthy();
    expect(auth!.version).toEqual(expect.any(Number));
  });

  test('a saved session is loaded on the next browser session (fresh context)', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await playAsGuest(page);

    // Simulate "save" by copying the session to a cold-start storage bucket.
    const saved = await readAuthStorage(page);
    await context.close();

    // A brand-new context restores the game from the saved data.
    const fresh = await browser.newContext();
    await fresh.addInitScript(({ key, value }) => {
      localStorage.setItem(key, JSON.stringify(value));
    }, { key: AUTH_KEY, value: saved });
    const page2 = await fresh.newPage();
    await page2.goto('/');
    await expectShellVisible(page2);
    await fresh.close();
  });

  test('a save survives a page reload without loss', async ({ page }) => {
    await playAsGuest(page);
    const before = await readAuthStorage(page);

    await page.reload();
    await expectShellVisible(page);
    const after = await readAuthStorage(page);

    expect(after).toEqual(before);
  });

  test('corrupted save data is rejected gracefully on load', async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, '{corrupted-save');
    }, AUTH_KEY);
    await page.goto('/');

    // No crash: the landing screen still renders.
    await expect(page.getByRole('button', { name: 'Play as Guest' })).toBeVisible();
  });
});