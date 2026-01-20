/**
 * Price Service
 * Fetches Bitcoin price data from CoinGecko API
 */

import { PriceData } from '../types';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION = 60 * 1000; // 1 minute cache

class PriceService {
  private cache: {
    data: PriceData | null;
    timestamp: number;
  } = {
    data: null,
    timestamp: 0,
  };

  /**
   * Get current Bitcoin price in USD
   */
  async getBTCPrice(): Promise<PriceData> {
    // Check cache
    if (this.isCacheValid()) {
      return this.cache.data!;
    }

    try {
      const response = await fetch(
        `${COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const priceData: PriceData = {
        usd: data.bitcoin.usd,
        usdChange24h: data.bitcoin.usd_24h_change || 0,
        lastUpdated: Date.now(),
      };

      // Update cache
      this.cache = {
        data: priceData,
        timestamp: Date.now(),
      };

      return priceData;
    } catch (error) {
      console.error('Failed to fetch BTC price:', error);

      // Return cached data if available, otherwise return fallback
      if (this.cache.data) {
        return this.cache.data;
      }

      // Fallback price data
      return {
        usd: 100000, // Fallback price
        usdChange24h: 0,
        lastUpdated: Date.now(),
      };
    }
  }

  /**
   * Get price in different currency
   */
  async getPriceInCurrency(currency: string = 'usd'): Promise<number> {
    try {
      const response = await fetch(
        `${COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=${currency}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.bitcoin[currency] || 0;
    } catch (error) {
      console.error(`Failed to fetch BTC price in ${currency}:`, error);
      return 0;
    }
  }

  /**
   * Get historical price (simplified)
   */
  async getHistoricalPrice(days: number = 7): Promise<{ prices: [number, number][] }> {
    try {
      const response = await fetch(
        `${COINGECKO_API}/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { prices: data.prices };
    } catch (error) {
      console.error('Failed to fetch historical price:', error);
      return { prices: [] };
    }
  }

  /**
   * Convert satoshis to USD
   */
  satoshisToUSD(satoshis: number, btcPrice: number): number {
    const btc = satoshis / 100_000_000;
    return btc * btcPrice;
  }

  /**
   * Convert BTC to USD
   */
  btcToUSD(btc: number, btcPrice: number): number {
    return btc * btcPrice;
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    return (
      this.cache.data !== null &&
      Date.now() - this.cache.timestamp < CACHE_DURATION
    );
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = {
      data: null,
      timestamp: 0,
    };
  }
}

export const priceService = new PriceService();
