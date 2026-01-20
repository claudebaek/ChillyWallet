import { useWalletStore } from '../../src/stores';
import { DEFAULT_NETWORK } from '../../src/utils/constants';

describe('WalletStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useWalletStore.getState().reset();
  });

  it('should have initial state', () => {
    const state = useWalletStore.getState();
    expect(state.isInitialized).toBe(false);
    expect(state.isLocked).toBe(true);
    expect(state.wallet).toBeNull();
    expect(state.network).toEqual(DEFAULT_NETWORK);
    expect(state.transactions).toEqual([]);
  });

  it('should have createWallet method', () => {
    expect(typeof useWalletStore.getState().createWallet).toBe('function');
  });

  it('should have importWallet method', () => {
    expect(typeof useWalletStore.getState().importWallet).toBe('function');
  });

  it('should have refreshBalance method', () => {
    expect(typeof useWalletStore.getState().refreshBalance).toBe('function');
  });

  it('should have setNetwork method', () => {
    expect(typeof useWalletStore.getState().setNetwork).toBe('function');
  });

  it('should change network', () => {
    const { setNetwork } = useWalletStore.getState();
    const newNetwork = {
      name: 'Bitcoin Mainnet',
      type: 'mainnet' as const,
      addressPrefix: 'bc1',
      explorerUrl: 'https://mempool.space',
    };
    
    setNetwork(newNetwork);
    
    expect(useWalletStore.getState().network).toEqual(newNetwork);
  });

  it('should reset store', async () => {
    const { reset, setNetwork } = useWalletStore.getState();
    
    // Make some changes
    setNetwork({
      name: 'Test',
      type: 'mainnet',
      addressPrefix: 'bc1',
      explorerUrl: 'https://test.com',
    });
    
    // Reset
    await reset();
    
    // Should be back to initial state
    const state = useWalletStore.getState();
    expect(state.isInitialized).toBe(false);
    expect(state.network).toEqual(DEFAULT_NETWORK);
  });
});
