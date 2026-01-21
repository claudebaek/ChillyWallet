/**
 * Network Service
 * Detects airplane mode and network connectivity for cold wallet security
 */

import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isAirplaneMode: boolean;
  type: string;
}

class NetworkService {
  private subscription: NetInfoSubscription | null = null;
  private listeners: Set<(status: NetworkStatus) => void> = new Set();

  /**
   * Check if device is in airplane mode (no network connection)
   * For cold wallet security, we consider airplane mode when there's no connection
   */
  async isAirplaneMode(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return this.checkAirplaneMode(state);
  }

  /**
   * Get current network status
   */
  async getNetworkStatus(): Promise<NetworkStatus> {
    const state = await NetInfo.fetch();
    return {
      isConnected: state.isConnected ?? false,
      isAirplaneMode: this.checkAirplaneMode(state),
      type: state.type,
    };
  }

  /**
   * Check if the state indicates airplane mode
   */
  private checkAirplaneMode(state: NetInfoState): boolean {
    // Consider airplane mode when:
    // - No connection type (type === 'none')
    // - Not connected
    // - No internet reachable
    return (
      state.type === 'none' ||
      state.isConnected === false ||
      state.isInternetReachable === false
    );
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(callback: (status: NetworkStatus) => void): () => void {
    this.listeners.add(callback);

    // Start listening if this is the first subscriber
    if (!this.subscription) {
      this.subscription = NetInfo.addEventListener((state) => {
        const status: NetworkStatus = {
          isConnected: state.isConnected ?? false,
          isAirplaneMode: this.checkAirplaneMode(state),
          type: state.type,
        };

        this.listeners.forEach((listener) => listener(status));
      });
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);

      // Stop listening if no more subscribers
      if (this.listeners.size === 0 && this.subscription) {
        this.subscription();
        this.subscription = null;
      }
    };
  }

  /**
   * Check if device is safe for cold wallet operations
   * Returns true only when device is truly offline
   */
  async isSafeForColdWallet(): Promise<boolean> {
    const status = await this.getNetworkStatus();
    return status.isAirplaneMode && !status.isConnected;
  }

  /**
   * Get warning message based on network status
   */
  getSecurityWarning(status: NetworkStatus): string | null {
    if (status.isConnected) {
      return 'Warning: Device is connected to the internet. For maximum security, enable Airplane Mode before signing transactions.';
    }
    if (!status.isAirplaneMode) {
      return 'Warning: Network connection detected. Enable Airplane Mode for secure signing.';
    }
    return null;
  }
}

export const networkService = new NetworkService();
