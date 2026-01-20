import { device, element, by, expect } from 'detox';

describe('Settings', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    // Complete onboarding first
    await element(by.text('Create New Wallet')).tap();
    await element(by.text("I've Saved My Seed Phrase")).tap();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Settings Screen', () => {
    beforeEach(async () => {
      // Navigate to settings (assuming there's a settings icon or tab)
      // This may need to be adjusted based on actual navigation
    });

    it('should display network options', async () => {
      // Navigate to settings first
      await expect(element(by.text('NETWORK'))).toBeVisible();
      await expect(element(by.text('Ethereum Mainnet'))).toBeVisible();
      await expect(element(by.text('Sepolia Testnet'))).toBeVisible();
    });

    it('should allow network switching', async () => {
      await element(by.text('Ethereum Mainnet')).tap();
      // Check that mainnet is now selected
      await expect(element(by.text('✓'))).toBeVisible();
    });

    it('should display wallet options', async () => {
      await expect(element(by.text('WALLET'))).toBeVisible();
      await expect(element(by.text('Backup Seed Phrase'))).toBeVisible();
      await expect(element(by.text('Security'))).toBeVisible();
    });

    it('should display version info', async () => {
      await expect(element(by.text('Version'))).toBeVisible();
      await expect(element(by.text('1.0.0'))).toBeVisible();
    });

    it('should display reset wallet option', async () => {
      await expect(element(by.text('Reset Wallet'))).toBeVisible();
    });

    it('should show confirmation dialog on reset', async () => {
      await element(by.text('Reset Wallet')).tap();
      await expect(element(by.text('Reset'))).toBeVisible();
      await expect(element(by.text('Cancel'))).toBeVisible();
      await element(by.text('Cancel')).tap();
    });
  });
});
