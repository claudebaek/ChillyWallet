import { device, element, by, expect } from 'detox';

describe('Wallet Features', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    // Complete onboarding first
    await element(by.text('Create New Wallet')).tap();
    await element(by.text("I've Saved My Seed Phrase")).tap();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Home Screen', () => {
    it('should display balance card', async () => {
      await expect(element(by.text('Total Balance'))).toBeVisible();
    });

    it('should display action buttons', async () => {
      await expect(element(by.text('Send'))).toBeVisible();
      await expect(element(by.text('Receive'))).toBeVisible();
      await expect(element(by.text('Connect'))).toBeVisible();
    });

    it('should display network badge', async () => {
      await expect(element(by.text('Sepolia Testnet'))).toBeVisible();
    });
  });

  describe('Send Screen', () => {
    beforeEach(async () => {
      await element(by.text('Send')).tap();
    });

    it('should display send form', async () => {
      await expect(element(by.text('Send ETH'))).toBeVisible();
      await expect(element(by.text('Recipient Address'))).toBeVisible();
      await expect(element(by.text('Amount (ETH)'))).toBeVisible();
    });

    it('should validate empty address', async () => {
      await element(by.text('Send')).tap();
      await expect(element(by.text('Invalid Ethereum address'))).toBeVisible();
    });

    it('should have max button', async () => {
      await expect(element(by.text('Max'))).toBeVisible();
    });
  });

  describe('Receive Screen', () => {
    beforeEach(async () => {
      await element(by.text('Receive')).tap();
    });

    it('should display receive screen', async () => {
      await expect(element(by.text('Receive ETH'))).toBeVisible();
      await expect(element(by.text('Your Address'))).toBeVisible();
    });

    it('should have copy and share buttons', async () => {
      await expect(element(by.text('Copy Address'))).toBeVisible();
      await expect(element(by.text('Share Address'))).toBeVisible();
    });
  });

  describe('WalletConnect Screen', () => {
    beforeEach(async () => {
      await element(by.text('Connect')).tap();
    });

    it('should display WalletConnect screen', async () => {
      await expect(element(by.text('WalletConnect'))).toBeVisible();
      await expect(element(by.text('WalletConnect URI'))).toBeVisible();
    });

    it('should show empty sessions message', async () => {
      await expect(element(by.text('No active connections.'))).toBeVisible();
    });
  });
});
