import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnboardingScreen } from './screens';
import { AppNavigator } from './navigation';
import { useWalletStore } from './stores';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
    },
  },
});

const AppContent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { isInitialized, loadWallet, reset } = useWalletStore();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await loadWallet();
    } catch (error) {
      console.error('Failed to load wallet:', error);
    }
    setIsLoading(false);
  };

  const handleOnboardingComplete = () => {
    // Wallet is already initialized in OnboardingScreen
    // Force re-render by checking isInitialized
  };

  const handleLogout = async () => {
    await reset();
  };

  if (isLoading) {
    return null; // Show splash screen in production
  }

  if (!isInitialized) {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <AppNavigator onLogout={handleLogout} />
    </>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;
