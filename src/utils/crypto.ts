/**
 * Bitcoin Cryptography Utilities
 * BIP-39 Mnemonic and BIP-84 Native SegWit Address Generation
 */

import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { HDKey } from '@scure/bip32';
import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { bech32 } from '@scure/base';

// BIP-84 derivation path for Native SegWit
// m/84'/0'/0'/0/0 for mainnet
// m/84'/1'/0'/0/0 for testnet
const BIP84_PURPOSE = 84;
const BITCOIN_MAINNET_COIN = 0;
const BITCOIN_TESTNET_COIN = 1;

/**
 * Generate a new BIP-39 mnemonic (12 words)
 */
export function generateMnemonic(): string {
  return bip39.generateMnemonic(wordlist, 128); // 128 bits = 12 words
}

/**
 * Validate a BIP-39 mnemonic
 */
export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic, wordlist);
}

/**
 * Convert mnemonic to seed
 */
export function mnemonicToSeed(mnemonic: string, passphrase: string = ''): Uint8Array {
  return bip39.mnemonicToSeedSync(mnemonic, passphrase);
}

/**
 * Derive BIP-84 Native SegWit address from mnemonic
 * @param mnemonic - 12 or 24 word seed phrase
 * @param network - 'mainnet' or 'testnet'
 * @param accountIndex - Account index (default 0)
 * @param addressIndex - Address index (default 0)
 */
export function deriveAddress(
  mnemonic: string,
  network: 'mainnet' | 'testnet' = 'mainnet',
  accountIndex: number = 0,
  addressIndex: number = 0
): { address: string; derivationPath: string } {
  const seed = mnemonicToSeed(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);

  const coinType = network === 'mainnet' ? BITCOIN_MAINNET_COIN : BITCOIN_TESTNET_COIN;
  const derivationPath = `m/${BIP84_PURPOSE}'/${coinType}'/${accountIndex}'/0/${addressIndex}`;

  const derived = hdKey.derive(derivationPath);

  if (!derived.publicKey) {
    throw new Error('Failed to derive public key');
  }

  // Create Native SegWit (P2WPKH) address
  const pubKeyHash = hash160(derived.publicKey);
  const prefix = network === 'mainnet' ? 'bc' : 'tb';
  const address = encodeBech32Address(prefix, 0, pubKeyHash);

  return { address, derivationPath };
}

/**
 * Derive private key from mnemonic
 * @param mnemonic - 12 or 24 word seed phrase
 * @param network - 'mainnet' or 'testnet'
 * @param accountIndex - Account index (default 0)
 * @param addressIndex - Address index (default 0)
 */
export function derivePrivateKey(
  mnemonic: string,
  network: 'mainnet' | 'testnet' = 'mainnet',
  accountIndex: number = 0,
  addressIndex: number = 0
): Uint8Array {
  const seed = mnemonicToSeed(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);

  const coinType = network === 'mainnet' ? BITCOIN_MAINNET_COIN : BITCOIN_TESTNET_COIN;
  const derivationPath = `m/${BIP84_PURPOSE}'/${coinType}'/${accountIndex}'/0/${addressIndex}`;

  const derived = hdKey.derive(derivationPath);

  if (!derived.privateKey) {
    throw new Error('Failed to derive private key');
  }

  return derived.privateKey;
}

/**
 * Derive public key from mnemonic
 */
export function derivePublicKey(
  mnemonic: string,
  network: 'mainnet' | 'testnet' = 'mainnet',
  accountIndex: number = 0,
  addressIndex: number = 0
): Uint8Array {
  const seed = mnemonicToSeed(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);

  const coinType = network === 'mainnet' ? BITCOIN_MAINNET_COIN : BITCOIN_TESTNET_COIN;
  const derivationPath = `m/${BIP84_PURPOSE}'/${coinType}'/${accountIndex}'/0/${addressIndex}`;

  const derived = hdKey.derive(derivationPath);

  if (!derived.publicKey) {
    throw new Error('Failed to derive public key');
  }

  return derived.publicKey;
}

/**
 * Hash160 = RIPEMD160(SHA256(data))
 */
export function hash160(data: Uint8Array): Uint8Array {
  return ripemd160(sha256(data));
}

/**
 * Double SHA256
 */
export function doubleSha256(data: Uint8Array): Uint8Array {
  return sha256(sha256(data));
}

/**
 * Encode address as Bech32 (Native SegWit)
 */
function encodeBech32Address(
  prefix: string,
  witnessVersion: number,
  witnessProgram: Uint8Array
): string {
  const words = bech32.toWords(witnessProgram);
  return bech32.encode(prefix, [witnessVersion, ...words]);
}

/**
 * Validate Bitcoin address
 */
export function isValidAddress(address: string): boolean {
  if (!address) return false;

  // Native SegWit (bc1q... or tb1q...)
  if (address.startsWith('bc1q') || address.startsWith('tb1q')) {
    try {
      const decoded = bech32.decode(address as `${string}1${string}`);
      return decoded.words.length >= 1 && decoded.words[0] === 0;
    } catch {
      return false;
    }
  }

  // Taproot (bc1p... or tb1p...)
  if (address.startsWith('bc1p') || address.startsWith('tb1p')) {
    try {
      // Taproot uses bech32m, simplified check
      return address.length === 62;
    } catch {
      return false;
    }
  }

  // Legacy (1...) and SegWit (3...)
  if (address.startsWith('1') || address.startsWith('3')) {
    return address.length >= 26 && address.length <= 35;
  }

  // Testnet legacy (m... or n...) and SegWit (2...)
  if (address.startsWith('m') || address.startsWith('n') || address.startsWith('2')) {
    return address.length >= 26 && address.length <= 35;
  }

  return false;
}

/**
 * Get address type
 */
export function getAddressType(address: string): 'legacy' | 'segwit' | 'native_segwit' | 'taproot' | 'unknown' {
  if (address.startsWith('bc1q') || address.startsWith('tb1q')) {
    return 'native_segwit';
  }
  if (address.startsWith('bc1p') || address.startsWith('tb1p')) {
    return 'taproot';
  }
  if (address.startsWith('3') || address.startsWith('2')) {
    return 'segwit';
  }
  if (address.startsWith('1') || address.startsWith('m') || address.startsWith('n')) {
    return 'legacy';
  }
  return 'unknown';
}

/**
 * Format address for display (truncate middle)
 */
export function formatAddressShort(address: string, chars: number = 8): string {
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
