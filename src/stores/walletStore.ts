import { create } from 'zustand';
import { Network, Wallet, WalletState, Transaction } from '../types';
import { DEFAULT_NETWORK } from '../utils/constants';
import { bitcoinService, priceService, keychainService } from '../services';
import { STORAGE_KEYS, SATOSHIS_PER_BTC } from '../utils/constants';

interface WalletStore extends WalletState {
  // State
  isLoading: boolean;
  error: string | null;

  // Actions
  createWallet: () => Promise<string>; // Returns mnemonic
  importWallet: (mnemonic: string) => Promise<void>;
  loadWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  refreshPrice: () => Promise<void>;
  setNetwork: (network: Network) => Promise<void>;
  sendBitcoin: (
    toAddress: string,
    amount: number,
    priority?: 'low' | 'medium' | 'high'
  ) => Promise<{ txid: string; fee: number }>;
  lock: () => void;
  unlock: () => void;
  reset: () => Promise<void>;
  clearError: () => void;
}

interface ExtendedWalletState extends WalletState {
  isLoading: boolean;
  error: string | null;
}

const initialState: ExtendedWalletState = {
  isInitialized: false,
  isLocked: true,
  wallet: null,
  network: DEFAULT_NETWORK,
  transactions: [],
  btcPrice: 0,
  priceChange24h: 0,
  isLoading: false,
  error: null,
};

export const useWalletStore = create<WalletStore>((set, get) => ({
  ...initialState,

  // Clear error
  clearError: () => set({ error: null }),

  // Create a new wallet
  createWallet: async () => {
    set({ isLoading: true, error: null });

    try {
      const mnemonic = bitcoinService.generateMnemonic();
      const { network } = get();

      // Set network in bitcoin service
      bitcoinService.setNetwork(network.type);

      const wallet = bitcoinService.createWallet(mnemonic, network.type);

      // Save mnemonic securely
      await keychainService.save(STORAGE_KEYS.MNEMONIC, mnemonic);
      await keychainService.save(STORAGE_KEYS.NETWORK, network.type);

      // New wallet starts with 0 balance
      set({
        isInitialized: true,
        isLocked: false,
        isLoading: false,
        wallet: {
          ...wallet,
          balance: 0,
          balanceUSD: 0,
        },
        transactions: [],
      });

      // Fetch price in background
      get().refreshPrice();

      return mnemonic;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create wallet';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  // Import wallet from mnemonic
  importWallet: async (mnemonic: string) => {
    set({ isLoading: true, error: null });

    try {
      if (!bitcoinService.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      const { network } = get();
      bitcoinService.setNetwork(network.type);
      const wallet = bitcoinService.createWallet(mnemonic, network.type);

      // Save mnemonic securely
      await keychainService.save(STORAGE_KEYS.MNEMONIC, mnemonic);
      await keychainService.save(STORAGE_KEYS.NETWORK, network.type);

      // Fetch real balance and transactions from blockchain
      const [balance, transactions, priceData] = await Promise.all([
        bitcoinService.getBalance(wallet.address, network.type),
        bitcoinService.getTransactions(wallet.address, network.type),
        priceService.getBTCPrice().catch(() => ({ usd: 0, usdChange24h: 0 })),
      ]);

      set({
        isInitialized: true,
        isLocked: false,
        isLoading: false,
        wallet: {
          ...wallet,
          balance,
          balanceUSD: (balance / SATOSHIS_PER_BTC) * priceData.usd,
        },
        transactions,
        btcPrice: priceData.usd,
        priceChange24h: priceData.usdChange24h,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import wallet';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  // Load existing wallet from keychain
  loadWallet: async () => {
    set({ isLoading: true, error: null });

    try {
      const mnemonic = await keychainService.get(STORAGE_KEYS.MNEMONIC);
      if (!mnemonic) {
        set({ isInitialized: false, isLocked: true, isLoading: false });
        return;
      }

      // Load saved network preference
      const savedNetwork = await keychainService.get(STORAGE_KEYS.NETWORK);
      const { network: currentNetwork } = get();
      const network = savedNetwork === 'testnet'
        ? { ...currentNetwork, type: 'testnet' as const, name: 'Bitcoin Testnet', addressPrefix: 'tb1', explorerUrl: 'https://mempool.space/testnet' }
        : currentNetwork;

      bitcoinService.setNetwork(network.type);
      const wallet = bitcoinService.createWallet(mnemonic, network.type);

      // Fetch real data from blockchain
      const [balance, transactions, priceData] = await Promise.all([
        bitcoinService.getBalance(wallet.address, network.type),
        bitcoinService.getTransactions(wallet.address, network.type),
        priceService.getBTCPrice().catch(() => ({ usd: 0, usdChange24h: 0 })),
      ]);

      set({
        isInitialized: true,
        isLocked: false,
        isLoading: false,
        network,
        wallet: {
          ...wallet,
          balance,
          balanceUSD: (balance / SATOSHIS_PER_BTC) * priceData.usd,
        },
        transactions,
        btcPrice: priceData.usd,
        priceChange24h: priceData.usdChange24h,
      });
    } catch (error) {
      console.error('Failed to load wallet:', error);
      // Even if blockchain fetch fails, still load the wallet
      try {
        const mnemonic = await keychainService.get(STORAGE_KEYS.MNEMONIC);
        if (mnemonic) {
          const { network } = get();
          const wallet = bitcoinService.createWallet(mnemonic, network.type);
          set({
            isInitialized: true,
            isLocked: false,
            isLoading: false,
            wallet: { ...wallet, balance: 0, balanceUSD: 0 },
            transactions: [],
            error: 'Failed to fetch blockchain data. Pull to refresh.',
          });
        } else {
          set({ isInitialized: false, isLocked: true, isLoading: false });
        }
      } catch {
        set({ isInitialized: false, isLocked: true, isLoading: false });
      }
    }
  },

  // Refresh balance from blockchain
  refreshBalance: async () => {
    const { wallet, btcPrice, network } = get();
    if (!wallet) return;

    set({ isLoading: true, error: null });

    try {
      const [balance, transactions] = await Promise.all([
        bitcoinService.getBalance(wallet.address, network.type),
        bitcoinService.getTransactions(wallet.address, network.type),
      ]);

      set({
        isLoading: false,
        wallet: {
          ...wallet,
          balance,
          balanceUSD: (balance / SATOSHIS_PER_BTC) * btcPrice,
        },
        transactions,
      });
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      set({
        isLoading: false,
        error: 'Failed to refresh balance. Please try again.',
      });
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
              balanceUSD: (wallet.balance / SATOSHIS_PER_BTC) * priceData.usd,
            }
          : null,
      });
    } catch (error) {
      console.error('Failed to refresh price:', error);
    }
  },

  // Set network and reload wallet
  setNetwork: async (network: Network) => {
    set({ isLoading: true, error: null });

    try {
      bitcoinService.setNetwork(network.type);
      await keychainService.save(STORAGE_KEYS.NETWORK, network.type);

      const mnemonic = await keychainService.get(STORAGE_KEYS.MNEMONIC);
      if (!mnemonic) {
        set({ network, isLoading: false });
        return;
      }

      const wallet = bitcoinService.createWallet(mnemonic, network.type);

      // Fetch data for new network
      const [balance, transactions] = await Promise.all([
        bitcoinService.getBalance(wallet.address, network.type),
        bitcoinService.getTransactions(wallet.address, network.type),
      ]);

      const { btcPrice } = get();

      set({
        network,
        isLoading: false,
        wallet: {
          ...wallet,
          balance,
          balanceUSD: (balance / SATOSHIS_PER_BTC) * btcPrice,
        },
        transactions,
      });
    } catch (error) {
      console.error('Failed to switch network:', error);
      set({
        isLoading: false,
        error: 'Failed to switch network. Please try again.',
      });
    }
  },

  // Send Bitcoin
  sendBitcoin: async (toAddress, amount, priority = 'medium') => {
    const { network } = get();
    set({ isLoading: true, error: null });

    try {
      const mnemonic = await keychainService.get(STORAGE_KEYS.MNEMONIC);
      if (!mnemonic) {
        throw new Error('Wallet not found');
      }

      const result = await bitcoinService.sendBitcoin(
        mnemonic,
        toAddress,
        amount,
        priority,
        network.type
      );

      // Refresh balance after sending
      await get().refreshBalance();

      set({ isLoading: false });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send transaction';
      set({ isLoading: false, error: message });
      throw error;
    }
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
    await keychainService.delete(STORAGE_KEYS.NETWORK);
    set(initialState);
  },
}));
