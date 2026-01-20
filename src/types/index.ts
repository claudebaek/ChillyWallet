// Bitcoin Network types
export type NetworkType = 'mainnet' | 'testnet';

export interface Network {
  name: string;
  type: NetworkType;
  addressPrefix: string; // bc1 for mainnet, tb1 for testnet
  explorerUrl: string;
}

// Wallet types
export interface Wallet {
  address: string; // bc1q... or tb1q...
  balance: number; // in satoshis
  balanceUSD: number;
  derivationPath: string; // m/84'/0'/0'/0/0
}

// Transaction types
export interface Transaction {
  txid: string;
  amount: number; // in satoshis (positive for received, negative for sent)
  fee: number; // in satoshis
  confirmations: number;
  type: 'sent' | 'received';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  toAddress?: string;
  fromAddress?: string;
}

// UTXO types
export interface UTXO {
  txid: string;
  vout: number;
  value: number; // in satoshis
  scriptPubKey: string;
  confirmations: number;
}

// Price data
export interface PriceData {
  usd: number;
  usdChange24h: number;
  lastUpdated: number;
}

// Wallet state
export interface WalletState {
  isInitialized: boolean;
  isLocked: boolean;
  wallet: Wallet | null;
  network: Network;
  transactions: Transaction[];
  btcPrice: number;
  priceChange24h: number;
}

// Address types for validation
export type AddressType = 'legacy' | 'segwit' | 'native_segwit' | 'taproot' | 'unknown';
