/**
 * PSBT (Partially Signed Bitcoin Transaction) Utilities
 * Handles serialization/deserialization for QR code transmission
 * 
 * Format: Simplified JSON-based PSBT for air-gapped signing
 */

import { base64 } from '@scure/base';
import { NetworkType } from '../types';

/**
 * Input for unsigned transaction
 */
export interface PSBTInput {
  txid: string;
  vout: number;
  value: number; // in satoshis
  scriptPubKey?: string;
}

/**
 * Output for unsigned transaction
 */
export interface PSBTOutput {
  address: string;
  value: number; // in satoshis
}

/**
 * Unsigned PSBT structure for QR transmission
 */
export interface UnsignedPSBT {
  version: number;
  inputs: PSBTInput[];
  outputs: PSBTOutput[];
  network: NetworkType;
  fee: number; // calculated fee in satoshis
  changeIndex?: number; // index of change output, if any
}

/**
 * Signed transaction for broadcast
 */
export interface SignedTransaction {
  txHex: string;
  txid: string;
  network: NetworkType;
}

// Magic bytes for identifying our PSBT format
const PSBT_MAGIC = 'CWPSBT'; // ChillyWallet PSBT
const PSBT_VERSION = 1;

/**
 * Serialize an unsigned PSBT to a string for QR code
 * Format: Base64-encoded JSON with magic header
 */
export function serializePSBT(psbt: UnsignedPSBT): string {
  const payload = {
    magic: PSBT_MAGIC,
    version: PSBT_VERSION,
    data: psbt,
  };

  const jsonString = JSON.stringify(payload);
  
  // Base64 encode for QR compatibility
  const encoder = new TextEncoder();
  return base64.encode(encoder.encode(jsonString));
}

/**
 * Deserialize a PSBT from string
 */
export function deserializePSBT(encoded: string): UnsignedPSBT {
  try {
    // Decode base64
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(base64.decode(encoded));
    const payload = JSON.parse(jsonString);

    // Validate magic and version
    if (payload.magic !== PSBT_MAGIC) {
      throw new Error('Invalid PSBT format: magic mismatch');
    }

    if (payload.version > PSBT_VERSION) {
      throw new Error(`Unsupported PSBT version: ${payload.version}`);
    }

    // Validate required fields
    const psbt = payload.data as UnsignedPSBT;
    validatePSBT(psbt);

    return psbt;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse PSBT: ${error.message}`);
    }
    throw new Error('Failed to parse PSBT: Unknown error');
  }
}

/**
 * Validate PSBT structure
 */
function validatePSBT(psbt: UnsignedPSBT): void {
  if (!psbt.inputs || !Array.isArray(psbt.inputs) || psbt.inputs.length === 0) {
    throw new Error('PSBT must have at least one input');
  }

  if (!psbt.outputs || !Array.isArray(psbt.outputs) || psbt.outputs.length === 0) {
    throw new Error('PSBT must have at least one output');
  }

  if (!['mainnet', 'testnet'].includes(psbt.network)) {
    throw new Error('Invalid network in PSBT');
  }

  // Validate each input
  for (const input of psbt.inputs) {
    if (!input.txid || typeof input.txid !== 'string' || input.txid.length !== 64) {
      throw new Error('Invalid input txid');
    }
    if (typeof input.vout !== 'number' || input.vout < 0) {
      throw new Error('Invalid input vout');
    }
    if (typeof input.value !== 'number' || input.value <= 0) {
      throw new Error('Invalid input value');
    }
  }

  // Validate each output
  for (const output of psbt.outputs) {
    if (!output.address || typeof output.address !== 'string') {
      throw new Error('Invalid output address');
    }
    if (typeof output.value !== 'number' || output.value < 0) {
      throw new Error('Invalid output value');
    }
  }
}

/**
 * Serialize a signed transaction for QR code transmission
 */
export function serializeSignedTx(signedTx: SignedTransaction): string {
  const payload = {
    magic: 'CWSTX', // ChillyWallet Signed TX
    version: 1,
    data: signedTx,
  };

  const encoder = new TextEncoder();
  return base64.encode(encoder.encode(JSON.stringify(payload)));
}

/**
 * Deserialize a signed transaction
 */
export function deserializeSignedTx(encoded: string): SignedTransaction {
  try {
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(base64.decode(encoded));
    const payload = JSON.parse(jsonString);

    if (payload.magic !== 'CWSTX') {
      throw new Error('Invalid signed transaction format');
    }

    return payload.data as SignedTransaction;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse signed transaction: ${error.message}`);
    }
    throw new Error('Failed to parse signed transaction');
  }
}

/**
 * Create an unsigned PSBT from transaction parameters
 */
export function createUnsignedPSBT(
  inputs: PSBTInput[],
  outputs: PSBTOutput[],
  network: NetworkType,
  changeIndex?: number
): UnsignedPSBT {
  const totalInput = inputs.reduce((sum, input) => sum + input.value, 0);
  const totalOutput = outputs.reduce((sum, output) => sum + output.value, 0);
  const fee = totalInput - totalOutput;

  if (fee < 0) {
    throw new Error('Invalid transaction: outputs exceed inputs');
  }

  return {
    version: 2,
    inputs,
    outputs,
    network,
    fee,
    changeIndex,
  };
}

/**
 * Calculate the total input amount
 */
export function getTotalInput(psbt: UnsignedPSBT): number {
  return psbt.inputs.reduce((sum, input) => sum + input.value, 0);
}

/**
 * Calculate the total output amount (excluding change)
 */
export function getSendAmount(psbt: UnsignedPSBT): number {
  return psbt.outputs
    .filter((_, index) => index !== psbt.changeIndex)
    .reduce((sum, output) => sum + output.value, 0);
}

/**
 * Get the recipient address (first non-change output)
 */
export function getRecipientAddress(psbt: UnsignedPSBT): string | null {
  const recipientOutput = psbt.outputs.find((_, index) => index !== psbt.changeIndex);
  return recipientOutput?.address || null;
}

/**
 * Check if the PSBT string is too large for a single QR code
 * Standard QR codes can hold ~2953 bytes in alphanumeric mode
 */
export function isPSBTTooLargeForQR(psbt: UnsignedPSBT): boolean {
  const serialized = serializePSBT(psbt);
  return serialized.length > 2500; // Leave some margin
}

/**
 * Split a large PSBT into multiple parts for animated QR
 * Returns array of base64 strings
 */
export function splitPSBT(psbt: UnsignedPSBT, maxSize: number = 500): string[] {
  const serialized = serializePSBT(psbt);
  const parts: string[] = [];
  
  for (let i = 0; i < serialized.length; i += maxSize) {
    const partData = serialized.slice(i, i + maxSize);
    const partHeader = `${i / maxSize + 1}/${Math.ceil(serialized.length / maxSize)}:`;
    parts.push(partHeader + partData);
  }
  
  return parts;
}

/**
 * Reassemble split PSBT parts
 */
export function reassemblePSBT(parts: string[]): UnsignedPSBT {
  // Sort parts by index
  const sortedParts = parts.sort((a, b) => {
    const indexA = parseInt(a.split('/')[0], 10);
    const indexB = parseInt(b.split('/')[0], 10);
    return indexA - indexB;
  });

  // Extract data from each part
  const data = sortedParts.map((part) => {
    const colonIndex = part.indexOf(':');
    return part.slice(colonIndex + 1);
  });

  // Combine and deserialize
  const combined = data.join('');
  return deserializePSBT(combined);
}
