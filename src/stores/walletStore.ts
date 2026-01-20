import { create } from 'zustand';
import { Network, Wallet, WalletState, Transaction } from '../types';
import { DEFAULT_NETWORK, SAMPLE_TRANSACTIONS, SAMPLE_BALANCE_SATOSHIS } from '../utils/constants';
import { bitcoinService, priceService, keychainService } from '../services';
import { STORAGE_KEYS } from '../utils/constants';

interface WalletStore extends WalletState {
  // Actions
  createWallet: () => Promise<string>; // Returns mnemonic
  importWallet: (mnemonic: string) => Promise<void>;
  loadWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  refreshPrice: () => Promise<void>;
  setNetwork: (network: Network) => void;
  lock: () => void;
  unlock: () => void;
  reset: () => Promise<void>;
}

const initialState: WalletState = {
  isInitialized: false,
  isLocked: true,
  wallet: null,
  network: DEFAULT_NETWORK,
  transactions: [],
  btcPrice: 0,
  priceChange24h: 0,
};

export const useWalletStore = create<WalletStore>((set, get) => ({
  ...initialState,

  // Create a new wallet
  createWallet: async () => {
    const mnemonic = bitcoinService.generateMnemonic();
    const { network } = get();
    const wallet = bitcoinService.createWallet(mnemonic, network.type);

    // Save mnemonic securely
    await keychainService.save(STORAGE_KEYS.MNEMONIC, mnemonic);

    // Fetch initial price
    try {
      const priceData = await priceService.getBTCPrice();
      set({
        isInitialized: true,
        isLocked: false,
        wallet: {
          ...wallet,
          balance: SAMPLE_BALANCE_SATOSHIS,
          balanceUSD: (SAMPLE_BALANCE_SATOSHIS / 100_000_000) * priceData.usd,
        },
        transactions: SAMPLE_TRANSACTIONS,
        btcPrice: priceData.usd,
        priceChange24h: priceData.usdChange24h,
      });
    } catch {
      set({
        isInitialized: true,
        isLocked: false,
        wallet: {
          ...wallet,
          balance: SAMPLE_BALANCE_SATOSHIS,
          balanceUSD: 0,
        },
        transactions: SAMPLE_TRANSACTIONS,
      });
    }

    return mnemonic;
  },

  // Import wallet from mnemonic
  importWallet: async (mnemonic: string) => {
    if (!bitcoinService.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    const { network } = get();
    const wallet = bitcoinService.createWallet(mnemonic, network.type);

    // Save mnemonic securely
    await keychainService.save(STORAGE_KEYS.MNEMONIC, mnemonic);

    // Fetch price and balance
    try {
      const priceData = await priceService.getBTCPrice();
      const balance = await bitcoinService.getBalance(wallet.address);
      const transactions = await bitcoinService.getTransactions(wallet.address);

      set({
        isInitialized: true,
        isLocked: false,
        wallet: {
          ...wallet,
          balance,
          balanceUSD: (balance / 100_000_000) * priceData.usd,
        },
        transactions,
        btcPrice: priceData.usd,
        priceChange24h: priceData.usdChange24h,
      });
    } catch {
      set({
        isInitialized: true,
        isLocked: false,
        wallet: {
          ...wallet,
          balance: SAMPLE_BALANCE_SATOSHIS,
          balanceUSD: 0,
        },
        transactions: SAMPLE_TRANSACTIONS,
      });
    }
  },

  // Load existing wallet from keychain
  loadWallet: async () => {
    try {
      const mnemonic = await keychainService.get(STORAGE_KEYS.MNEMONIC);
      if (!mnemonic) {
        set({ isInitialized: false, isLocked: true });
        return;
      }

      const { network } = get();
      const wallet = bitcoinService.createWallet(mnemonic, network.type);

      // Fetch price and balance
      const priceData = await priceService.getBTCPrice();
      const balance = await bitcoinService.getBalance(wallet.address);
      const transactions = await bitcoinService.getTransactions(wallet.address);

      set({
        isInitialized: true,
        isLocked: false,
        wallet: {
          ...wallet,
          balance,
          balanceUSD: (balance / 100_000_000) * priceData.usd,
        },
        transactions,
        btcPrice: priceData.usd,
        priceChange24h: priceData.usdChange24h,
      });
    } catch (error) {
      console.error('Failed to load wallet:', error);
      set({ isInitialized: false, isLocked: true });
    }
  },

  // Refresh balance
  refreshBalance: async () => {
    const { wallet, btcPrice } = get();
    if (!wallet) return;

    try {
      const balance = await bitcoinService.getBalance(wallet.address);
      const transactions = await bitcoinService.getTransactions(wallet.address);

      set({
        wallet: {
          ...wallet,
          balance,
          balanceUSD: (balance / 100_000_000) * btcPrice,
        },
        transactions,
      });
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  },

  // Refresh price
  refreshPrice: async () => {
    try {
      const priceData = await priceService.getBTCPrice();
      const { wallet } = get();

      set({
        btcPrice: priceData.usd,
        priceChange24h: priceData.usdChange24h,
        wallet: wallet
          ? {
              ...wallet,
              balanceUSD: (wallet.balance / 100_000_000) * priceData.usd,
            }
          : null,
      });
    } catch (error) {
      console.error('Failed to refresh price:', error);
    }
  },

  // Set network
  setNetwork: (network: Network) => {
    set({ network });
    // Optionally regenerate address for new network
    // This would require reloading the wallet
  },

  // Lock wallet
  lock: () => {
    set({ isLocked: true });
  },

  // Unlock wallet
  unlock: () => {
    set({ isLocked: false });
  },

  // Reset wallet (delete all data)
  reset: async () => {
    await keychainService.delete(STORAGE_KEYS.MNEMONIC);
    set(initialState);
  },
}));
