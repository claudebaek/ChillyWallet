import { SATOSHIS_PER_BTC } from './constants';

/**
 * Convert satoshis to BTC
 */
export const satoshisToBTC = (satoshis: number): number => {
  return satoshis / SATOSHIS_PER_BTC;
};

/**
 * Convert BTC to satoshis
 */
export const btcToSatoshis = (btc: number): number => {
  return Math.round(btc * SATOSHIS_PER_BTC);
};

/**
 * Format satoshis as BTC string
 */
export const formatBTC = (satoshis: number, decimals: number = 8): string => {
  const btc = satoshisToBTC(satoshis);
  return btc.toFixed(decimals);
};

/**
 * Format satoshis as compact BTC string (removes trailing zeros)
 */
export const formatBTCCompact = (satoshis: number): string => {
  const btc = satoshisToBTC(satoshis);
  // Remove trailing zeros but keep at least 2 decimals for small amounts
  if (btc === 0) return '0';
  if (btc >= 1) return btc.toFixed(4).replace(/\.?0+$/, '');
  return btc.toFixed(8).replace(/\.?0+$/, '');
};

/**
 * Format satoshis with comma separators
 */
export const formatSatoshis = (satoshis: number): string => {
  return satoshis.toLocaleString('en-US');
};

/**
 * Format USD amount
 */
export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format large USD amounts (compact)
 */
export const formatUSDCompact = (amount: number): string => {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(2)}K`;
  }
  return formatUSD(amount);
};

/**
 * Format Bitcoin address for display (truncate middle)
 */
export const formatAddress = (address: string, chars: number = 8): string => {
  if (!address) return '';
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

/**
 * Format timestamp to readable date/time
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format timestamp as relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }
  return 'Just now';
};

/**
 * Format percentage change
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
};

/**
 * Parse BTC string to satoshis
 */
export const parseBTCToSatoshis = (btcString: string): number => {
  const btc = parseFloat(btcString);
  if (isNaN(btc)) return 0;
  return btcToSatoshis(btc);
};

/**
 * Validate if string is valid BTC amount
 */
export const isValidBTCAmount = (value: string): boolean => {
  if (!value) return false;
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) return false;
  // Check for too many decimal places
  const parts = value.split('.');
  if (parts.length > 2) return false;
  if (parts[1] && parts[1].length > 8) return false;
  return true;
};

/**
 * Format confirmation count
 */
export const formatConfirmations = (confirmations: number): string => {
  if (confirmations === 0) return 'Unconfirmed';
  if (confirmations < 6) return `${confirmations} confirmation${confirmations > 1 ? 's' : ''}`;
  return '6+ confirmations';
};
