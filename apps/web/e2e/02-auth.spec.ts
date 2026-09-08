import { test, expect } from '@playwright/test';
import { playAsGuest, registerUser, readAuthStorage, AUTH_KEY, expectShellVisible, logoutViaUi } from './helpers';

test.describe('Category 2: Auth', () => {
  test('register a new account lands in the shell and persists a session', async ({ page }) => {
    const username = `alice_${Date.now()}`;
    await registerUser(page, username, 'hunter2');

    const auth = await readAuthStorage(page);
    expect(auth).not.toBeNull();
    expect(auth!.token).toBeTruthy();
    expect(auth!.playerId).toBe(username);

    // The shell now renders the registered account's own character, not the
    // demo player: starting gold, combat level 1, and the account's username.
    await expect(page.locator('header').getByText('500', { exact: true })).toBeVisible();
    await expect(page.locator('header button').filter({ hasText: username })).toBeVisible();
  });

  test('invalid credentials show an error and never enter the shell', async ({ page }) => {
    const username = `bob_${Date.now()}`;
    await registerUser(page, username, 'correct-pass');

    // Log out through the real UI (a registered profile is the account name).
    await logoutViaUi(page, username);
    await page.getByRole('button', { name: 'Play as Guest' }).waitFor();

    await page.getByRole('button', { name: 'Log In', exact: true }).click();
    await page.getByPlaceholder('Username').fill('bob_x');
    await page.getByPlaceholder('Password').fill('wrong-pass');
    await page.getByRole('button', { name: 'Log In', exact: true }).click();

    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Play as Guest' })).toBeVisible();
  });

  test('guest login writes a token + guestId to storage', async ({ page }) => {
    await playAsGuest(page);

    const auth = await readAuthStorage(page);
    expect(auth).not.toBeNull();
    expect(auth!.token).toBeTruthy();
    expect(auth!.guestId).toBeTruthy();
  });

  test('logout clears the session and returns to the landing screen', async ({ page }) => {
    await playAsGuest(page);

    await logoutViaUi(page);

    await expect(page.getByRole('button', { name: 'Play as Guest' })).toBeVisible();

    const auth = await readAuthStorage(page);
    expect(auth!.token).toBe(null);
    expect(auth!.characterId).toBe(null);
  });

  test('auth persists across a full reload (session restore)', async ({ page }) => {
    await playAsGuest(page);
    await page.reload();
    await expectShellVisible(page);
  });

  test('corrupt auth storage does not crash the app', async ({ page }) => {
    await playAsGuest(page);
    await page.evaluate((key) => localStorage.setItem(key, '{definitely-not-json'), AUTH_KEY);
    await page.reload();

    // App handles the JSON.parse failure and shows the landing screen.
    await expect(page.getByRole('button', { name: 'Play as Guest' })).toBeVisible();
  });
});