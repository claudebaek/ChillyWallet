import { keychainService } from '../../src/services/keychainService';

// Note: These tests require mocking react-native-keychain
// For now, we'll skip the actual keychain calls in a test environment

describe('KeychainService', () => {
  beforeEach(() => {
    // Reset mocks before each test
  });

  it('should have save method', () => {
    expect(typeof keychainService.save).toBe('function');
  });

  it('should have get method', () => {
    expect(typeof keychainService.get).toBe('function');
  });

  it('should have delete method', () => {
    expect(typeof keychainService.delete).toBe('function');
  });

  it('should have has method', () => {
    expect(typeof keychainService.has).toBe('function');
  });
});
