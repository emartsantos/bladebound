import { test, expect } from '@playwright/test';
import { playAsGuest, expectShellVisible, readAuthStorage, logoutViaUi, openSection } from './helpers';

test.describe('Category 5: Multiple tabs', () => {
  test('login in one tab is visible to a second tab in the same context', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const pageA = await context.newPage();
    await playAsGuest(pageA);

    // A second tab in the same browser context shares the origin's storage,
    // so it boots straight into the shell without re-authentication.
    const pageB = await context.newPage();
    await pageB.goto('/');
    await expectShellVisible(pageB);

    const authB = await readAuthStorage(pageB);
    expect(authB).not.toBeNull();

    await context.close();
  });

  test('tabs do not corrupt shared session state when both navigate', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const pageA = await context.newPage();
    await playAsGuest(pageA);

    const pageB = await context.newPage();
    await pageB.goto('/');
    await expectShellVisible(pageB);

    // Interleave SPA navigation in both tabs; shared storage stays intact.
    await openSection(pageA, 'World');
    await openSection(pageB, 'Inventory');

    await expect(pageA.getByRole('heading', { name: 'World Map' })).toBeVisible();
    await expect(pageB.getByRole('heading', { name: 'Inventory' })).toBeVisible();

    const auth = await readAuthStorage(pageA);
    expect(auth!.guestId).toBeTruthy();

    await context.close();
  });

  test('logout in one tab invalidates the session for a fresh tab', async ({ browser }) => {
    const context = await browser.newContext();
    const pageA = await context.newPage();
    await playAsGuest(pageA);

    await logoutViaUi(pageA);

    const pageB = await context.newPage();
    await pageB.goto('/');
    // Storage was cleared, so a fresh tab shows the landing screen.
    await expect(pageB.getByRole('button', { name: 'Play as Guest' })).toBeVisible();

    await context.close();
  });
});