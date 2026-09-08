/* eslint-env detox/detox, jest */

// Core player-flow smoke tests. Requires a booted iOS simulator and a
// Detox-built app binary (see .detoxrc.json). In this workspace there is no
// native build toolchain, so this spec runs in CI after `npm run ios` compiles.

describe('Emberhollow smoke flows', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('walks through the 5-step onboarding flow', async () => {
    await expect(element(by.text('Welcome to Emberhollow'))).toBeVisible();
    await element(by.text('Begin')).tap();
    await expect(element(by.text('Offline Progression'))).toBeVisible();
    await element(by.text('Continue')).tap();
    await expect(element(by.text('Explore Regions'))).toBeVisible();
    await element(by.text('Explore')).tap();
    await expect(element(by.text('Level Up Your Character'))).toBeVisible();
    await element(by.text('Continue')).tap();
    await expect(element(by.text('Manage Your Inventory'))).toBeVisible();
    await element(by.text('Play')).tap();

    // Navigation container is now mounted (Home tab).
    await expect(element(by.text('Home'))).toBeVisible();
  });

  it('shows the player summary on the home screen', async () => {
    await expect(element(by.text('Theron'))).toBeVisible();
    await expect(element(by.text(/Level 24/))).toBeVisible();
    await expect(element(by.text(/gold/))).toBeVisible();
  });

  it('travels to an unlocked region from the adventure tab', async () => {
    await element(by.text('Adventure')).tap();
    await expect(element(by.text('Starter Frontier'))).toBeVisible();
    await element(by.text('Travel')).atIndex(0).tap();
    await expect(element(by.text('Arrived at Starter Frontier.'))).toBeVisible();
  });

  it('lists inventory items on the inventory tab', async () => {
    await element(by.text('Inventory')).tap();
    await expect(element(by.text('Iron Ore'))).toBeVisible();
    await expect(element(by.text('x20'))).toBeVisible();
  });

  it('toggles sound off in settings', async () => {
    await element(by.text('More')).tap();
    await expect(element(by.text('Settings'))).toBeVisible();
    await element(by.text('Sound')).tap();
  });
});