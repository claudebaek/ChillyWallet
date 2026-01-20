import { device, element, by, expect } from 'detox';

describe('Onboarding Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display welcome screen on first launch', async () => {
    await expect(element(by.text('Web3 Wallet'))).toBeVisible();
    await expect(element(by.text('Create New Wallet'))).toBeVisible();
    await expect(element(by.text('Import Existing Wallet'))).toBeVisible();
  });

  it('should navigate to create wallet flow', async () => {
    await element(by.text('Create New Wallet')).tap();
    await expect(element(by.text('Your Seed Phrase'))).toBeVisible();
  });

  it('should display seed phrase warning', async () => {
    await element(by.text('Create New Wallet')).tap();
    await expect(element(by.text(/Store this phrase safely/))).toBeVisible();
  });

  it('should navigate to import wallet flow', async () => {
    await element(by.text('Import Existing Wallet')).tap();
    await expect(element(by.text('Import Wallet'))).toBeVisible();
    await expect(element(by.text('Seed Phrase'))).toBeVisible();
  });

  it('should show error for empty seed phrase on import', async () => {
    await element(by.text('Import Existing Wallet')).tap();
    await element(by.text('Import Wallet')).tap();
    // Should show error alert
    await expect(element(by.text('Error'))).toBeVisible();
  });

  it('should navigate back from import to welcome', async () => {
    await element(by.text('Import Existing Wallet')).tap();
    await element(by.text('Back')).tap();
    await expect(element(by.text('Create New Wallet'))).toBeVisible();
  });
});
