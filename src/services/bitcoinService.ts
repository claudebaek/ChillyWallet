/**
 * Bitcoin Service
 * Handles wallet creation, address derivation, and transaction data
 */

import { Transaction, Wallet, NetworkType } from '../types';
import {
  generateMnemonic,
  validateMnemonic,
  deriveAddress,
  isValidAddress,
} from '../utils/crypto';
import { SAMPLE_TRANSACTIONS, SAMPLE_BALANCE_SATOSHIS } from '../utils/constants';

class BitcoinService {
  /**
   * Generate a new 12-word mnemonic
   */
  generateMnemonic(): string {
    return generateMnemonic();
  }

  /**
   * Validate a mnemonic phrase
   */
  validateMnemonic(mnemonic: string): boolean {
    return validateMnemonic(mnemonic);
  }

  /**
   * Create a wallet from mnemonic
   */
  createWallet(mnemonic: string, network: NetworkType = 'testnet'): Wallet {
    const { address, derivationPath } = deriveAddress(mnemonic, network);

    return {
      address,
      balance: 0,
      balanceUSD: 0,
      derivationPath,
    };
  }

  /**
   * Validate a Bitcoin address
   */
  isValidAddress(address: string): boolean {
    return isValidAddress(address);
  }

  /**
   * Get balance for an address (demo: returns sample data)
   */
  async getBalance(address: string): Promise<number> {
    // In a real app, this would call a blockchain API like:
    // - Blockstream API: https://blockstream.info/api/
    // - BlockCypher API: https://api.blockcypher.com/
    // - Mempool.space API: https://mempool.space/api/

    // Simulate network delay
    await this.delay(500);

    // Return sample balance for demo
    return SAMPLE_BALANCE_SATOSHIS;
  }

  /**
   * Get transactions for an address (demo: returns sample data)
   */
  async getTransactions(address: string): Promise<Transaction[]> {
    // Simulate network delay
    await this.delay(500);

    // Return sample transactions for demo
    return SAMPLE_TRANSACTIONS;
  }

  /**
   * Estimate transaction fee (demo)
   * Returns fee in satoshis
   */
  async estimateFee(priority: 'low' | 'medium' | 'high' = 'medium'): Promise<number> {
    await this.delay(200);

    // Sample fee rates (satoshis per vbyte)
    const feeRates = {
      low: 5,
      medium: 15,
      high: 30,
    };

    // Assume a typical transaction size of ~140 vbytes
    const txSize = 140;
    return feeRates[priority] * txSize;
  }

  /**
   * Send Bitcoin (demo: simulates transaction)
   * In production, this would create, sign, and broadcast a real transaction
   */
  async sendBitcoin(
    fromAddress: string,
    toAddress: string,
    amount: number, // in satoshis
    fee: number // in satoshis
  ): Promise<{ txid: string; success: boolean }> {
    // Validate addresses
    if (!this.isValidAddress(fromAddress)) {
      throw new Error('Invalid sender address');
    }
    if (!this.isValidAddress(toAddress)) {
      throw new Error('Invalid recipient address');
    }
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Simulate transaction broadcast
    await this.delay(2000);

    // Generate a fake txid for demo
    const txid = this.generateFakeTxid();

    return { txid, success: true };
  }

  /**
   * Get address info from blockchain (demo)
   */
  async getAddressInfo(address: string): Promise<{
    balance: number;
    txCount: number;
    unconfirmedBalance: number;
  }> {
    await this.delay(300);

    return {
      balance: SAMPLE_BALANCE_SATOSHIS,
      txCount: SAMPLE_TRANSACTIONS.length,
      unconfirmedBalance: 0,
    };
  }

  /**
   * Helper: Generate fake transaction ID for demo
   */
  private generateFakeTxid(): string {
    const chars = '0123456789abcdef';
    let txid = '';
    for (let i = 0; i < 64; i++) {
      txid += chars[Math.floor(Math.random() * chars.length)];
    }
    return txid;
  }

  /**
   * Helper: Delay for simulating network calls
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const bitcoinService = new BitcoinService();
