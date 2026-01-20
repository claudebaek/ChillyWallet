/**
 * Bitcoin Transaction Builder
 * Creates and signs P2WPKH (Native SegWit) transactions
 */

import * as secp256k1 from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { bech32 } from '@scure/base';
import { hash160, derivePublicKey, doubleSha256 } from './crypto';

// Transaction version
const TX_VERSION = 2;
const SIGHASH_ALL = 0x01;

interface TxInput {
  txid: string;
  vout: number;
  value: number;
}

interface TxOutput {
  address: string;
  value: number;
}

interface BuildTransactionParams {
  inputs: TxInput[];
  outputs: TxOutput[];
  network: 'mainnet' | 'testnet';
}

interface UnsignedTransaction {
  version: number;
  inputs: TxInput[];
  outputs: TxOutput[];
  locktime: number;
  network: 'mainnet' | 'testnet';
}

/**
 * Build an unsigned transaction
 */
export function buildTransaction(params: BuildTransactionParams): UnsignedTransaction {
  return {
    version: TX_VERSION,
    inputs: params.inputs,
    outputs: params.outputs,
    locktime: 0,
    network: params.network,
  };
}

/**
 * Sign a transaction and return the raw hex
 */
export function signTransaction(
  tx: UnsignedTransaction,
  privateKey: Uint8Array,
  network: 'mainnet' | 'testnet'
): string {
  const publicKey = secp256k1.getPublicKey(privateKey, true); // compressed
  const pubKeyHash = hash160(publicKey);

  // Serialize for signing (BIP-143 for SegWit)
  const preimages: Uint8Array[] = [];

  // Calculate hashPrevouts
  const prevoutsData = new Uint8Array(tx.inputs.length * 36);
  for (let i = 0; i < tx.inputs.length; i++) {
    const txidBytes = hexToBytes(tx.inputs[i].txid).reverse();
    prevoutsData.set(txidBytes, i * 36);
    const voutBytes = uint32ToLE(tx.inputs[i].vout);
    prevoutsData.set(voutBytes, i * 36 + 32);
  }
  const hashPrevouts = doubleSha256(prevoutsData);

  // Calculate hashSequence
  const sequenceData = new Uint8Array(tx.inputs.length * 4);
  for (let i = 0; i < tx.inputs.length; i++) {
    sequenceData.set(uint32ToLE(0xffffffff), i * 4);
  }
  const hashSequence = doubleSha256(sequenceData);

  // Calculate hashOutputs
  const outputsBuffer: number[] = [];
  for (const output of tx.outputs) {
    // value (8 bytes LE)
    const valueBytes = uint64ToLE(output.value);
    outputsBuffer.push(...valueBytes);

    // scriptPubKey
    const scriptPubKey = addressToScriptPubKey(output.address, network);
    outputsBuffer.push(scriptPubKey.length);
    outputsBuffer.push(...scriptPubKey);
  }
  const hashOutputs = doubleSha256(new Uint8Array(outputsBuffer));

  // Sign each input
  const witnesses: Uint8Array[][] = [];

  for (let i = 0; i < tx.inputs.length; i++) {
    const input = tx.inputs[i];

    // BIP-143 preimage
    const preimage = buildBIP143Preimage(
      tx.version,
      hashPrevouts,
      hashSequence,
      input.txid,
      input.vout,
      pubKeyHash,
      input.value,
      0xffffffff,
      hashOutputs,
      tx.locktime
    );

    preimages.push(preimage);

    // Sign
    const sigHash = doubleSha256(preimage);
    const signature = secp256k1.sign(sigHash, privateKey);
    const derSignature = signature.toDERRawBytes();

    // Append SIGHASH_ALL
    const sigWithHashType = new Uint8Array(derSignature.length + 1);
    sigWithHashType.set(derSignature);
    sigWithHashType[derSignature.length] = SIGHASH_ALL;

    witnesses.push([sigWithHashType, publicKey]);
  }

  // Serialize final transaction
  return serializeTransaction(tx, witnesses, network);
}

/**
 * Build BIP-143 preimage for SegWit signing
 */
function buildBIP143Preimage(
  version: number,
  hashPrevouts: Uint8Array,
  hashSequence: Uint8Array,
  txid: string,
  vout: number,
  pubKeyHash: Uint8Array,
  value: number,
  sequence: number,
  hashOutputs: Uint8Array,
  locktime: number
): Uint8Array {
  const buffer: number[] = [];

  // 1. nVersion (4 bytes LE)
  buffer.push(...uint32ToLE(version));

  // 2. hashPrevouts (32 bytes)
  buffer.push(...hashPrevouts);

  // 3. hashSequence (32 bytes)
  buffer.push(...hashSequence);

  // 4. outpoint (36 bytes)
  const txidBytes = hexToBytes(txid).reverse();
  buffer.push(...txidBytes);
  buffer.push(...uint32ToLE(vout));

  // 5. scriptCode (P2WPKH: OP_DUP OP_HASH160 <20 bytes> OP_EQUALVERIFY OP_CHECKSIG)
  const scriptCode = new Uint8Array(25);
  scriptCode[0] = 0x19; // length
  scriptCode[1] = 0x76; // OP_DUP
  scriptCode[2] = 0xa9; // OP_HASH160
  scriptCode[3] = 0x14; // push 20 bytes
  scriptCode.set(pubKeyHash, 4);
  scriptCode[24] = 0x88; // OP_EQUALVERIFY
  // Wait, this is wrong. Let me fix the scriptCode construction
  buffer.push(0x19); // length of scriptCode
  buffer.push(0x76); // OP_DUP
  buffer.push(0xa9); // OP_HASH160
  buffer.push(0x14); // push 20 bytes
  buffer.push(...pubKeyHash);
  buffer.push(0x88); // OP_EQUALVERIFY
  buffer.push(0xac); // OP_CHECKSIG

  // 6. value (8 bytes LE)
  buffer.push(...uint64ToLE(value));

  // 7. nSequence (4 bytes LE)
  buffer.push(...uint32ToLE(sequence));

  // 8. hashOutputs (32 bytes)
  buffer.push(...hashOutputs);

  // 9. nLocktime (4 bytes LE)
  buffer.push(...uint32ToLE(locktime));

  // 10. sighash type (4 bytes LE)
  buffer.push(...uint32ToLE(SIGHASH_ALL));

  return new Uint8Array(buffer);
}

/**
 * Serialize the final signed transaction
 */
function serializeTransaction(
  tx: UnsignedTransaction,
  witnesses: Uint8Array[][],
  network: 'mainnet' | 'testnet'
): string {
  const buffer: number[] = [];

  // Version (4 bytes LE)
  buffer.push(...uint32ToLE(tx.version));

  // Marker and flag for SegWit
  buffer.push(0x00); // marker
  buffer.push(0x01); // flag

  // Input count (varint)
  buffer.push(...encodeVarInt(tx.inputs.length));

  // Inputs
  for (const input of tx.inputs) {
    // txid (32 bytes, reversed)
    const txidBytes = hexToBytes(input.txid).reverse();
    buffer.push(...txidBytes);

    // vout (4 bytes LE)
    buffer.push(...uint32ToLE(input.vout));

    // scriptSig (empty for SegWit)
    buffer.push(0x00);

    // sequence (4 bytes LE)
    buffer.push(...uint32ToLE(0xffffffff));
  }

  // Output count (varint)
  buffer.push(...encodeVarInt(tx.outputs.length));

  // Outputs
  for (const output of tx.outputs) {
    // value (8 bytes LE)
    buffer.push(...uint64ToLE(output.value));

    // scriptPubKey
    const scriptPubKey = addressToScriptPubKey(output.address, network);
    buffer.push(...encodeVarInt(scriptPubKey.length));
    buffer.push(...scriptPubKey);
  }

  // Witness data
  for (const witness of witnesses) {
    buffer.push(...encodeVarInt(witness.length));
    for (const item of witness) {
      buffer.push(...encodeVarInt(item.length));
      buffer.push(...item);
    }
  }

  // Locktime (4 bytes LE)
  buffer.push(...uint32ToLE(tx.locktime));

  return bytesToHex(new Uint8Array(buffer));
}

/**
 * Convert address to scriptPubKey
 */
function addressToScriptPubKey(
  address: string,
  network: 'mainnet' | 'testnet'
): Uint8Array {
  const prefix = network === 'mainnet' ? 'bc' : 'tb';

  // Native SegWit (P2WPKH)
  if (address.startsWith(`${prefix}1q`)) {
    const decoded = bech32.decode(address as `${string}1${string}`);
    const witnessVersion = decoded.words[0];
    const witnessProgram = bech32.fromWords(decoded.words.slice(1));

    // OP_0 <20 bytes>
    const script = new Uint8Array(22);
    script[0] = witnessVersion; // OP_0
    script[1] = witnessProgram.length; // push 20 bytes
    script.set(witnessProgram, 2);
    return script;
  }

  // Taproot (P2TR)
  if (address.startsWith(`${prefix}1p`)) {
    // Use bech32m for Taproot
    const decoded = bech32.decode(address as `${string}1${string}`);
    const witnessVersion = decoded.words[0];
    const witnessProgram = bech32.fromWords(decoded.words.slice(1));

    // OP_1 <32 bytes>
    const script = new Uint8Array(34);
    script[0] = 0x51; // OP_1
    script[1] = witnessProgram.length; // push 32 bytes
    script.set(witnessProgram, 2);
    return script;
  }

  throw new Error(`Unsupported address format: ${address}`);
}

// Helper functions

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function uint32ToLE(value: number): Uint8Array {
  const buffer = new Uint8Array(4);
  buffer[0] = value & 0xff;
  buffer[1] = (value >> 8) & 0xff;
  buffer[2] = (value >> 16) & 0xff;
  buffer[3] = (value >> 24) & 0xff;
  return buffer;
}

function uint64ToLE(value: number): Uint8Array {
  const buffer = new Uint8Array(8);
  // JavaScript can handle up to 2^53 - 1 safely
  buffer[0] = value & 0xff;
  buffer[1] = (value >> 8) & 0xff;
  buffer[2] = (value >> 16) & 0xff;
  buffer[3] = (value >> 24) & 0xff;
  // For values > 2^32, we need BigInt
  const high = Math.floor(value / 0x100000000);
  buffer[4] = high & 0xff;
  buffer[5] = (high >> 8) & 0xff;
  buffer[6] = (high >> 16) & 0xff;
  buffer[7] = (high >> 24) & 0xff;
  return buffer;
}

function encodeVarInt(value: number): Uint8Array {
  if (value < 0xfd) {
    return new Uint8Array([value]);
  } else if (value <= 0xffff) {
    return new Uint8Array([0xfd, value & 0xff, (value >> 8) & 0xff]);
  } else if (value <= 0xffffffff) {
    return new Uint8Array([
      0xfe,
      value & 0xff,
      (value >> 8) & 0xff,
      (value >> 16) & 0xff,
      (value >> 24) & 0xff,
    ]);
  } else {
    // 8-byte varint (rare)
    const buffer = new Uint8Array(9);
    buffer[0] = 0xff;
    const le = uint64ToLE(value);
    buffer.set(le, 1);
    return buffer;
  }
}
