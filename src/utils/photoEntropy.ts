/**
 * Photo Entropy Generator
 * Generates cryptographic entropy from camera photos for mnemonic creation
 * 
 * Security: Combines photo pixel data with system entropy for enhanced randomness
 */

import { sha256 } from '@noble/hashes/sha256';
import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

// Minimum image size for sufficient entropy
const MIN_IMAGE_SIZE = 10000; // bytes

/**
 * Generate a BIP-39 mnemonic from photo entropy
 * 
 * Process:
 * 1. Decode base64 image to raw bytes
 * 2. Hash the image data with SHA-256
 * 3. Combine with system random data for extra security
 * 4. Use first 128 bits as entropy for 12-word mnemonic
 * 
 * @param imageBase64 - Base64 encoded image data
 * @returns 12-word BIP-39 mnemonic
 */
export async function generateMnemonicFromPhoto(imageBase64: string): Promise<string> {
  // Validate input
  if (!imageBase64 || imageBase64.length < MIN_IMAGE_SIZE) {
    throw new Error('Image too small for sufficient entropy. Please take a more detailed photo.');
  }

  // Remove base64 prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  
  // Decode base64 to bytes
  const imageBytes = base64ToBytes(base64Data);
  
  // Generate entropy from image
  const photoEntropy = generateEntropyFromBytes(imageBytes);
  
  // Combine with system entropy for extra security
  const systemEntropy = getSystemEntropy();
  const combinedEntropy = combineEntropy(photoEntropy, systemEntropy);
  
  // Use first 128 bits (16 bytes) for 12-word mnemonic
  const finalEntropy = combinedEntropy.slice(0, 16);
  
  // Convert to mnemonic
  const mnemonic = bip39.entropyToMnemonic(finalEntropy, wordlist);
  
  return mnemonic;
}

/**
 * Generate entropy from raw bytes using SHA-256
 */
function generateEntropyFromBytes(data: Uint8Array): Uint8Array {
  // Hash the entire image data
  const hash1 = sha256(data);
  
  // Double hash for additional mixing
  const hash2 = sha256(hash1);
  
  return hash2;
}

/**
 * Get system random entropy
 */
function getSystemEntropy(): Uint8Array {
  const entropy = new Uint8Array(32);
  
  // Use crypto.getRandomValues if available (React Native polyfill)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(entropy);
  } else {
    // Fallback: use Math.random (less secure, but combined with photo entropy)
    for (let i = 0; i < entropy.length; i++) {
      entropy[i] = Math.floor(Math.random() * 256);
    }
  }
  
  return entropy;
}

/**
 * Combine two entropy sources using XOR
 */
function combineEntropy(entropy1: Uint8Array, entropy2: Uint8Array): Uint8Array {
  const combined = new Uint8Array(32);
  
  for (let i = 0; i < 32; i++) {
    combined[i] = entropy1[i] ^ entropy2[i];
  }
  
  // Final hash to mix thoroughly
  return sha256(combined);
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  // React Native compatible base64 decoding
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}

/**
 * Validate that the image has sufficient entropy
 * Checks for image diversity (not all same color)
 */
export function validateImageEntropy(imageBase64: string): boolean {
  if (!imageBase64 || imageBase64.length < MIN_IMAGE_SIZE) {
    return false;
  }
  
  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const bytes = base64ToBytes(base64Data);
    
    // Check for byte diversity (simple entropy check)
    const uniqueBytes = new Set(bytes);
    
    // Require at least 50 unique byte values for sufficient entropy
    return uniqueBytes.size >= 50;
  } catch {
    return false;
  }
}

/**
 * Calculate approximate entropy bits from image
 */
export function calculateImageEntropyBits(imageBase64: string): number {
  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const bytes = base64ToBytes(base64Data);
    
    // Calculate Shannon entropy
    const frequency = new Map<number, number>();
    for (const byte of bytes) {
      frequency.set(byte, (frequency.get(byte) || 0) + 1);
    }
    
    let entropy = 0;
    const len = bytes.length;
    
    for (const count of frequency.values()) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }
    
    // Return total entropy bits
    return entropy * bytes.length;
  } catch {
    return 0;
  }
}
