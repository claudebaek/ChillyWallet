/**
 * Keychain Service for secure storage
 * Uses react-native-keychain for secure storage of sensitive data
 */

import * as Keychain from 'react-native-keychain';

class KeychainService {
  /**
   * Save a value securely
   */
  async save(key: string, value: string): Promise<boolean> {
    try {
      await Keychain.setGenericPassword(key, value, { service: key });
      return true;
    } catch (error) {
      console.error('Failed to save to keychain:', error);
      return false;
    }
  }

  /**
   * Get a value from secure storage
   */
  async get(key: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({ service: key });
      if (credentials) {
        return credentials.password;
      }
      return null;
    } catch (error) {
      console.error('Failed to get from keychain:', error);
      return null;
    }
  }

  /**
   * Delete a value from secure storage
   */
  async delete(key: string): Promise<boolean> {
    try {
      await Keychain.resetGenericPassword({ service: key });
      return true;
    } catch (error) {
      console.error('Failed to delete from keychain:', error);
      return false;
    }
  }

  /**
   * Check if a value exists
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Get supported biometry type
   */
  async getSupportedBiometryType(): Promise<Keychain.BIOMETRY_TYPE | null> {
    try {
      return await Keychain.getSupportedBiometryType();
    } catch {
      return null;
    }
  }

  /**
   * Save with biometric protection
   */
  async saveWithBiometrics(key: string, value: string): Promise<boolean> {
    try {
      await Keychain.setGenericPassword(key, value, {
        service: key,
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      return true;
    } catch (error) {
      console.error('Failed to save with biometrics:', error);
      return false;
    }
  }

  /**
   * Get with biometric authentication
   */
  async getWithBiometrics(key: string, promptMessage: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: key,
        authenticationPrompt: {
          title: promptMessage,
        },
      });
      if (credentials) {
        return credentials.password;
      }
      return null;
    } catch (error) {
      console.error('Failed to get with biometrics:', error);
      return null;
    }
  }
}

export const keychainService = new KeychainService();
