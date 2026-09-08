import { expect, type Page } from '@playwright/test';

export const AUTH_KEY = 'premium-rpg-auth';

/** Wait for the in-game shell (post-auth) to be visible. */
export async function expectShellVisible(
  page: Page,
  opts: { level?: string; name?: string } = {}
): Promise<void> {
  const level = opts.level ?? '26'; // guest/demo character is L26
  // Header logo + the current player's level chip only render inside the shell.
  await expect(page.locator('header').getByText(level, { exact: true })).toBeVisible();
  await expect(page.locator('header').getByText('Premium RPG')).toBeVisible();
  if (opts.name) {
    await expect(page.locator('header button').filter({ hasText: opts.name }).first()).toBeVisible();
  }
}

export async function gotoHome(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play as Guest' }).waitFor({ timeout: 20_000 });
}

export async function playAsGuest(page: Page): Promise<void> {
  await gotoHome(page);
  await page.getByRole('button', { name: 'Play as Guest' }).click();
  await expectShellVisible(page);
}

export async function registerUser(
  page: Page,
  username: string,
  password = 'hunter2'
): Promise<void> {
  await gotoHome(page);
  await page.getByRole('button', { name: 'Register', exact: true }).click();
  await page.getByPlaceholder('Username').fill(username);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Register', exact: true }).click();
  // A registered account sees its own character: level 1 + its username.
  await expectShellVisible(page, { level: '1', name: username });
}

export async function readAuthStorage(page: Page): Promise<Record<string, unknown> | null> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }, AUTH_KEY);
}

export async function collectPageErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('requestfailed', (req) => {
    const failure = req.failure();
    if (failure && req.url().includes('/api/')) {
      errors.push(`${req.method()} ${req.url()} -> ${failure.errorText}`);
    }
  });
  return errors;
}

/** Click a nav section by its visible label. */
export async function openSection(page: Page, label: string): Promise<void> {
  await page.locator('nav button').filter({ hasText: label }).first().click();
}

/** Open the profile dropdown (trigger shows the player name). */
export async function openProfileMenu(page: Page, name = 'Theron'): Promise<void> {
  await page.locator('header button').filter({ hasText: name }).click();
}

/** Log out through the real profile dropdown. */
export async function logoutViaUi(page: Page, name = 'Theron'): Promise<void> {
  await openProfileMenu(page, name);
  await page.getByRole('button', { name: 'Logout' }).click();
}