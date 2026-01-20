import { device, element, by } from 'detox';
import * as fs from 'fs';
import * as path from 'path';

/**
 * App Store Screenshot Tests
 * 
 * This test suite captures screenshots for App Store submission.
 * Run with: npx detox test -c ios.sim.release e2e/screenshots.test.ts
 */

const SCREENSHOTS_DIR = path.join(__dirname, '../ios/fastlane/screenshots/en-US');

// Ensure screenshots directory exists
beforeAll(() => {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
});

describe('App Store Screenshots', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('01 - Onboarding Screen', async () => {
    // Wait for app to fully load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot of onboarding/welcome screen
    await device.takeScreenshot('iPhone_6.7_01_onboarding');
  });

  it('02 - Seed Phrase Screen', async () => {
    // Tap Create New Wallet
    await element(by.text('Create New Wallet')).tap();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot of seed phrase screen
    await device.takeScreenshot('iPhone_6.7_02_seedphrase');
  });

  it('03 - Home Screen', async () => {
    // Complete wallet creation
    await element(by.text("I've Saved My Seed Phrase")).tap();
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Take screenshot of home screen with balance
    await device.takeScreenshot('iPhone_6.7_03_home');
  });

  it('04 - Send Screen', async () => {
    // Navigate to Send screen
    await element(by.text('Send')).tap();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot of send screen
    await device.takeScreenshot('iPhone_6.7_04_send');
    
    // Go back to home
    await device.pressBack();
  });

  it('05 - Receive Screen', async () => {
    // Navigate to Receive screen
    await element(by.text('Receive')).tap();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot of receive screen with QR code
    await device.takeScreenshot('iPhone_6.7_05_receive');
    
    // Go back to home
    await device.pressBack();
  });

  it('06 - Settings Screen', async () => {
    // Navigate to Settings screen
    await element(by.text('Settings')).tap();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot of settings screen
    await device.takeScreenshot('iPhone_6.7_06_settings');
  });
});
