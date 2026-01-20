/**
 * Blockchain Service
 * Connects to Mempool.space API for real Bitcoin data
 * Supports both mainnet and testnet
 */

import { Transaction, UTXO, NetworkType } from '../types';
import { API_ENDPOINTS } from '../utils/constants';

// Mempool.space API response types
interface MempoolAddressInfo {
  address: string;
  chain_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
  mempool_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
}

interface MempoolUTXO {
  txid: string;
  vout: number;
  value: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
}

interface MempoolTransaction {
  txid: string;
  version: number;
  locktime: number;
  vin: Array<{
    txid: string;
    vout: number;
    prevout: {
      scriptpubkey: string;
      scriptpubkey_asm: string;
      scriptpubkey_type: string;
      scriptpubkey_address: string;
      value: number;
    };
    scriptsig: string;
    scriptsig_asm: string;
    witness?: string[];
    is_coinbase: boolean;
    sequence: number;
  }>;
  vout: Array<{
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    scriptpubkey_address?: string;
    value: number;
  }>;
  size: number;
  weight: number;
  fee: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
}

interface FeeEstimates {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

class BlockchainService {
  private getBaseUrl(network: NetworkType): string {
    return network === 'mainnet'
      ? API_ENDPOINTS.mempool.mainnet
      : API_ENDPOINTS.mempool.testnet;
  }

  /**
   * Fetch with timeout and error handling
   */
  private async fetchWithTimeout(
    url: string,
    timeout: number = 10000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Get address balance in satoshis
   */
  async getBalance(address: string, network: NetworkType): Promise<number> {
    const baseUrl = this.getBaseUrl(network);
    const url = `${baseUrl}/address/${address}`;

    try {
      const response = await this.fetchWithTimeout(url);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data: MempoolAddressInfo = await response.json();

      // Calculate balance: funded - spent (both confirmed and unconfirmed)
      const confirmedBalance =
        data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
      const unconfirmedBalance =
        data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum;

      return confirmedBalance + unconfirmedBalance;
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      throw new Error('Failed to fetch balance from blockchain');
    }
  }

  /**
   * Get UTXOs for an address
   */
  async getUTXOs(address: string, network: NetworkType): Promise<UTXO[]> {
    const baseUrl = this.getBaseUrl(network);
    const url = `${baseUrl}/address/${address}/utxo`;

    try {
      const response = await this.fetchWithTimeout(url);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data: MempoolUTXO[] = await response.json();

      return data.map((utxo) => ({
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value,
        scriptPubKey: '', // Will be filled when needed for signing
        confirmations: utxo.status.confirmed ? 1 : 0, // Simplified
      }));
    } catch (error) {
      console.error('Failed to fetch UTXOs:', error);
      throw new Error('Failed to fetch UTXOs from blockchain');
    }
  }

  /**
   * Get transaction history for an address
   */
  async getTransactions(
    address: string,
    network: NetworkType
  ): Promise<Transaction[]> {
    const baseUrl = this.getBaseUrl(network);
    const url = `${baseUrl}/address/${address}/txs`;

    try {
      const response = await this.fetchWithTimeout(url);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data: MempoolTransaction[] = await response.json();

      return data.map((tx) => this.parseTransaction(tx, address));
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      throw new Error('Failed to fetch transactions from blockchain');
    }
  }

  /**
   * Parse Mempool transaction to our Transaction format
   */
  private parseTransaction(
    tx: MempoolTransaction,
    ourAddress: string
  ): Transaction {
    // Calculate amount received
    let received = 0;
    let sent = 0;

    // Check outputs for received amount
    for (const vout of tx.vout) {
      if (vout.scriptpubkey_address === ourAddress) {
        received += vout.value;
      }
    }

    // Check inputs for sent amount
    for (const vin of tx.vin) {
      if (vin.prevout?.scriptpubkey_address === ourAddress) {
        sent += vin.prevout.value;
      }
    }

    const netAmount = received - sent;
    const isSent = netAmount < 0;

    // Get counterparty address
    let counterpartyAddress: string | undefined;
    if (isSent) {
      // Find first output that's not ours (recipient)
      const recipient = tx.vout.find(
        (v) => v.scriptpubkey_address && v.scriptpubkey_address !== ourAddress
      );
      counterpartyAddress = recipient?.scriptpubkey_address;
    } else {
      // Find first input (sender)
      counterpartyAddress = tx.vin[0]?.prevout?.scriptpubkey_address;
    }

    return {
      txid: tx.txid,
      amount: isSent ? netAmount + tx.fee : netAmount, // For sent, add back fee for display
      fee: tx.fee,
      confirmations: tx.status.confirmed ? 6 : 0, // Simplified
      type: isSent ? 'sent' : 'received',
      status: tx.status.confirmed ? 'confirmed' : 'pending',
      timestamp: tx.status.block_time
        ? tx.status.block_time * 1000
        : Date.now(),
      toAddress: isSent ? counterpartyAddress : undefined,
      fromAddress: !isSent ? counterpartyAddress : undefined,
    };
  }

  /**
   * Get recommended fee rates (sat/vB)
   */
  async getFeeEstimates(network: NetworkType): Promise<FeeEstimates> {
    const baseUrl = this.getBaseUrl(network);
    const url = `${baseUrl}/v1/fees/recommended`;

    try {
      const response = await this.fetchWithTimeout(url);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch fee estimates:', error);
      // Return default fee estimates
      return {
        fastestFee: 30,
        halfHourFee: 20,
        hourFee: 10,
        economyFee: 5,
        minimumFee: 1,
      };
    }
  }

  /**
   * Broadcast a signed transaction
   */
  async broadcastTransaction(
    txHex: string,
    network: NetworkType
  ): Promise<string> {
    const baseUrl = this.getBaseUrl(network);
    const url = `${baseUrl}/tx`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: txHex,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Broadcast failed: ${errorText}`);
      }

      // Returns txid on success
      const txid = await response.text();
      return txid;
    } catch (error) {
      console.error('Failed to broadcast transaction:', error);
      throw error;
    }
  }

  /**
   * Get current block height
   */
  async getBlockHeight(network: NetworkType): Promise<number> {
    const baseUrl = this.getBaseUrl(network);
    const url = `${baseUrl}/blocks/tip/height`;

    try {
      const response = await this.fetchWithTimeout(url);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const height = await response.text();
      return parseInt(height, 10);
    } catch (error) {
      console.error('Failed to fetch block height:', error);
      throw new Error('Failed to fetch block height');
    }
  }

  /**
   * Get transaction details by txid
   */
  async getTransaction(
    txid: string,
    network: NetworkType
  ): Promise<MempoolTransaction> {
    const baseUrl = this.getBaseUrl(network);
    const url = `${baseUrl}/tx/${txid}`;

    try {
      const response = await this.fetchWithTimeout(url);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch transaction:', error);
      throw new Error('Failed to fetch transaction');
    }
  }
}

export const blockchainService = new BlockchainService();
