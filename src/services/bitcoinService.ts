/**
 * Bitcoin Service
 * Handles wallet creation, address derivation, and real blockchain operations
 */

import { Transaction, Wallet, NetworkType, UTXO } from '../types';
import {
  generateMnemonic,
  validateMnemonic,
  deriveAddress,
  derivePrivateKey,
  isValidAddress,
} from '../utils/crypto';
import { blockchainService } from './blockchainService';
import { DUST_LIMIT } from '../utils/constants';

// P2WPKH input/output sizes for fee calculation
const P2WPKH_INPUT_SIZE = 68; // vbytes
const P2WPKH_OUTPUT_SIZE = 31; // vbytes
const TX_OVERHEAD = 10.5; // vbytes

class BitcoinService {
  private currentNetwork: NetworkType = 'mainnet';

  /**
   * Set the current network
   */
  setNetwork(network: NetworkType): void {
    this.currentNetwork = network;
  }

  /**
   * Get the current network
   */
  getNetwork(): NetworkType {
    return this.currentNetwork;
  }

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
  createWallet(mnemonic: string, network: NetworkType = 'mainnet'): Wallet {
    this.currentNetwork = network;
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
   * Get balance for an address from blockchain
   */
  async getBalance(address: string, network?: NetworkType): Promise<number> {
    const net = network || this.currentNetwork;
    return blockchainService.getBalance(address, net);
  }

  /**
   * Get transactions for an address from blockchain
   */
  async getTransactions(
    address: string,
    network?: NetworkType
  ): Promise<Transaction[]> {
    const net = network || this.currentNetwork;
    return blockchainService.getTransactions(address, net);
  }

  /**
   * Get UTXOs for an address
   */
  async getUTXOs(address: string, network?: NetworkType): Promise<UTXO[]> {
    const net = network || this.currentNetwork;
    return blockchainService.getUTXOs(address, net);
  }

  /**
   * Estimate transaction fee based on current network conditions
   * Returns fee in satoshis for a standard transaction
   */
  async estimateFee(
    priority: 'low' | 'medium' | 'high' = 'medium',
    inputCount: number = 1,
    outputCount: number = 2, // recipient + change
    network?: NetworkType
  ): Promise<{ fee: number; feeRate: number }> {
    const net = network || this.currentNetwork;
    const feeEstimates = await blockchainService.getFeeEstimates(net);

    // Map priority to fee rate
    let feeRate: number;
    switch (priority) {
      case 'high':
        feeRate = feeEstimates.fastestFee;
        break;
      case 'medium':
        feeRate = feeEstimates.halfHourFee;
        break;
      case 'low':
        feeRate = feeEstimates.hourFee;
        break;
    }

    // Calculate transaction size
    const txSize = Math.ceil(
      TX_OVERHEAD +
        inputCount * P2WPKH_INPUT_SIZE +
        outputCount * P2WPKH_OUTPUT_SIZE
    );

    return {
      fee: feeRate * txSize,
      feeRate,
    };
  }

  /**
   * Select UTXOs for a transaction (simple coin selection)
   */
  selectUTXOs(
    utxos: UTXO[],
    targetAmount: number,
    feeRate: number
  ): { selectedUTXOs: UTXO[]; fee: number; change: number } | null {
    // Sort UTXOs by value (largest first for fewer inputs)
    const sortedUTXOs = [...utxos].sort((a, b) => b.value - a.value);

    const selectedUTXOs: UTXO[] = [];
    let totalInput = 0;

    for (const utxo of sortedUTXOs) {
      selectedUTXOs.push(utxo);
      totalInput += utxo.value;

      // Calculate fee with current input count
      const hasChange = true; // Assume we'll have change
      const outputCount = hasChange ? 2 : 1;
      const txSize = Math.ceil(
        TX_OVERHEAD +
          selectedUTXOs.length * P2WPKH_INPUT_SIZE +
          outputCount * P2WPKH_OUTPUT_SIZE
      );
      const fee = feeRate * txSize;

      const change = totalInput - targetAmount - fee;

      // Check if we have enough
      if (change >= 0) {
        // If change is dust, absorb it into fee
        if (change < DUST_LIMIT) {
          return {
            selectedUTXOs,
            fee: fee + change,
            change: 0,
          };
        }
        return { selectedUTXOs, fee, change };
      }
    }

    // Not enough funds
    return null;
  }

  /**
   * Send Bitcoin - creates, signs, and broadcasts a transaction
   */
  async sendBitcoin(
    mnemonic: string,
    toAddress: string,
    amount: number, // in satoshis
    priority: 'low' | 'medium' | 'high' = 'medium',
    network?: NetworkType
  ): Promise<{ txid: string; fee: number }> {
    const net = network || this.currentNetwork;

    // Validate recipient address
    if (!this.isValidAddress(toAddress)) {
      throw new Error('Invalid recipient address');
    }

    if (amount < DUST_LIMIT) {
      throw new Error(`Amount too small. Minimum is ${DUST_LIMIT} satoshis`);
    }

    // Get our address and private key
    const { address } = deriveAddress(mnemonic, net);
    const privateKey = derivePrivateKey(mnemonic, net);

    // Get UTXOs
    const utxos = await this.getUTXOs(address, net);
    if (utxos.length === 0) {
      throw new Error('No UTXOs available');
    }

    // Get fee rate
    const feeEstimates = await blockchainService.getFeeEstimates(net);
    let feeRate: number;
    switch (priority) {
      case 'high':
        feeRate = feeEstimates.fastestFee;
        break;
      case 'medium':
        feeRate = feeEstimates.halfHourFee;
        break;
      case 'low':
        feeRate = feeEstimates.hourFee;
        break;
    }

    // Select UTXOs
    const selection = this.selectUTXOs(utxos, amount, feeRate);
    if (!selection) {
      throw new Error('Insufficient funds');
    }

    // Build and sign transaction
    const txHex = await this.buildAndSignTransaction(
      privateKey,
      address,
      toAddress,
      amount,
      selection.selectedUTXOs,
      selection.change,
      net
    );

    // Broadcast transaction
    const txid = await blockchainService.broadcastTransaction(txHex, net);

    return { txid, fee: selection.fee };
  }

  /**
   * Build and sign a transaction
   * This is a simplified implementation using native libraries
   */
  private async buildAndSignTransaction(
    privateKey: Uint8Array,
    fromAddress: string,
    toAddress: string,
    amount: number,
    utxos: UTXO[],
    change: number,
    network: NetworkType
  ): Promise<string> {
    // Import signing utilities
    const { buildTransaction, signTransaction } = await import('../utils/transaction');

    // Build unsigned transaction
    const unsignedTx = buildTransaction({
      inputs: utxos.map((utxo) => ({
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value,
      })),
      outputs: [
        { address: toAddress, value: amount },
        ...(change > 0 ? [{ address: fromAddress, value: change }] : []),
      ],
      network,
    });

    // Sign transaction
    const signedTx = signTransaction(unsignedTx, privateKey, network);

    return signedTx;
  }

  /**
   * Get address info from blockchain
   */
  async getAddressInfo(
    address: string,
    network?: NetworkType
  ): Promise<{
    balance: number;
    txCount: number;
  }> {
    const net = network || this.currentNetwork;

    const [balance, transactions] = await Promise.all([
      this.getBalance(address, net),
      this.getTransactions(address, net),
    ]);

    return {
      balance,
      txCount: transactions.length,
    };
  }
}

export const bitcoinService = new BitcoinService();
