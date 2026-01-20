import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWalletStore } from '../stores';
import { priceService } from '../services';

/**
 * Hook to get and refresh BTC price
 */
export const useBTCPrice = () => {
  const { btcPrice, priceChange24h, refreshPrice } = useWalletStore();

  const { refetch, isLoading, isError } = useQuery({
    queryKey: ['btcPrice'],
    queryFn: async () => {
      await refreshPrice();
      return null;
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000,
  });

  return {
    price: btcPrice,
    priceChange24h,
    isLoading,
    isError,
    refetch,
  };
};

/**
 * Hook to refresh wallet data
 */
export const useWalletRefresh = () => {
  const { refreshBalance, refreshPrice, wallet, transactions } = useWalletStore();

  const refresh = useCallback(async () => {
    await Promise.all([refreshBalance(), refreshPrice()]);
  }, [refreshBalance, refreshPrice]);

  return {
    refresh,
    wallet,
    transactions,
  };
};

/**
 * Hook to get formatted wallet balance
 */
export const useFormattedBalance = () => {
  const { wallet, btcPrice } = useWalletStore();

  const btcBalance = wallet ? wallet.balance / 100_000_000 : 0;
  const usdBalance = wallet ? wallet.balanceUSD : 0;

  return {
    btc: btcBalance,
    usd: usdBalance,
    satoshis: wallet?.balance || 0,
    price: btcPrice,
  };
};
