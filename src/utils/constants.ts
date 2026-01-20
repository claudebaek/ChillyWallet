import { Network, Transaction } from '../types';

// Bitcoin Networks
export const NETWORKS: Record<string, Network> = {
  mainnet: {
    name: 'Bitcoin Mainnet',
    type: 'mainnet',
    addressPrefix: 'bc1',
    explorerUrl: 'https://mempool.space',
  },
  testnet: {
    name: 'Bitcoin Testnet',
    type: 'testnet',
    addressPrefix: 'tb1',
    explorerUrl: 'https://mempool.space/testnet',
  },
};

export const DEFAULT_NETWORK = NETWORKS.mainnet;

// Storage Keys for Keychain
export const STORAGE_KEYS = {
  MNEMONIC: 'btc_wallet_mnemonic',
  WALLET: 'btc_wallet_data',
  NETWORK: 'btc_wallet_network',
  IS_INITIALIZED: 'btc_wallet_initialized',
};

// Satoshi conversions
export const SATOSHIS_PER_BTC = 100_000_000;

// Sample balance for demo (0.00625 BTC = 625,000 satoshis)
export const SAMPLE_BALANCE_SATOSHIS = 625000;

// Sample transactions for demo
export const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    txid: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    amount: 125000, // 0.00125 BTC received
    fee: 2100,
    confirmations: 6,
    type: 'received',
    status: 'confirmed',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    fromAddress: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
  },
  {
    txid: 'b2c3d4e5f67890123456789012345678901abcdef23456789012345678901234',
    amount: -50000, // 0.0005 BTC sent
    fee: 1500,
    confirmations: 12,
    type: 'sent',
    status: 'confirmed',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    toAddress: 'bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3pjxtptv',
  },
  {
    txid: 'c3d4e5f678901234567890123456789012abcdef34567890123456789012345',
    amount: 300000, // 0.003 BTC received
    fee: 2500,
    confirmations: 100,
    type: 'received',
    status: 'confirmed',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
    fromAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
  },
  {
    txid: 'd4e5f6789012345678901234567890123abcdef456789012345678901234567',
    amount: 250000, // 0.0025 BTC received
    fee: 1800,
    confirmations: 500,
    type: 'received',
    status: 'confirmed',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 7, // 1 week ago
    fromAddress: 'bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297',
  },
];

// UI Colors - Bitcoin Orange Theme
export const COLORS = {
  // Primary
  bitcoinOrange: '#F7931A',
  bitcoinOrangeDark: '#E07C00',
  bitcoinOrangeLight: '#FFB347',

  // Backgrounds
  primaryBackground: '#0d0d0d',
  cardBackground: '#1a1a1a',
  secondaryBackground: '#262626',

  // Text
  primaryText: '#FFFFFF',
  secondaryText: '#A0A0A0',
  tertiaryText: '#666666',

  // Status
  success: '#00C853',
  error: '#FF5252',
  warning: '#FFD600',
  info: '#2196F3',

  // Transaction
  received: '#00C853',
  sent: '#FF5252',
  pending: '#FFD600',
};

// Fee levels (satoshis per vbyte)
export const FEE_LEVELS = {
  low: {
    name: 'Low',
    rate: 5,
    time: '~60 min',
  },
  medium: {
    name: 'Medium',
    rate: 15,
    time: '~30 min',
  },
  high: {
    name: 'High',
    rate: 30,
    time: '~10 min',
  },
};

// Minimum dust amount (in satoshis)
export const DUST_LIMIT = 546;

// API endpoints (for future use)
export const API_ENDPOINTS = {
  blockstream: {
    mainnet: 'https://blockstream.info/api',
    testnet: 'https://blockstream.info/testnet/api',
  },
  mempool: {
    mainnet: 'https://mempool.space/api',
    testnet: 'https://mempool.space/testnet/api',
  },
};
