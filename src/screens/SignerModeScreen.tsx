/**
 * Signer Mode Screen
 * Main screen for cold wallet signing operations
 * 
 * Features:
 * - Airplane mode detection and warning
 * - Create new wallet with photo entropy
 * - Sign transactions via QR scan
 * - Display address as QR
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components/native';
import { Alert, ScrollView } from 'react-native';
import { COLORS } from '../utils/constants';
import { networkService, NetworkStatus } from '../services/networkService';
import { useWalletStore } from '../stores';
import { formatAddress } from '../utils/format';
import QRCode from 'react-native-qrcode-svg';

// Signer mode uses a distinct color theme (teal/cyan)
const SIGNER_COLORS = {
  primary: '#00BFA5',
  primaryDark: '#00897B',
  background: '#0a1a1a',
  card: '#0f2f2f',
  warning: '#FF6B6B',
  success: '#00BFA5',
};

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${SIGNER_COLORS.background};
`;

const Header = styled.View`
  padding: 20px;
  border-bottom-width: 1px;
  border-bottom-color: ${SIGNER_COLORS.card};
`;

const Title = styled.Text`
  font-size: 28px;
  font-weight: bold;
  color: ${SIGNER_COLORS.primary};
  text-align: center;
`;

const Subtitle = styled.Text`
  font-size: 14px;
  color: ${COLORS.secondaryText};
  text-align: center;
  margin-top: 4px;
`;

const StatusBanner = styled.View<{ isOffline: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  background-color: ${({ isOffline }) =>
    isOffline ? SIGNER_COLORS.success + '20' : SIGNER_COLORS.warning + '20'};
  margin: 16px;
  border-radius: 12px;
  border-width: 1px;
  border-color: ${({ isOffline }) =>
    isOffline ? SIGNER_COLORS.success : SIGNER_COLORS.warning};
`;

const StatusIcon = styled.Text`
  font-size: 20px;
  margin-right: 8px;
`;

const StatusText = styled.Text<{ isOffline: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${({ isOffline }) =>
    isOffline ? SIGNER_COLORS.success : SIGNER_COLORS.warning};
`;

const Content = styled.ScrollView`
  flex: 1;
  padding: 16px;
`;

const Section = styled.View`
  margin-bottom: 24px;
`;

const SectionTitle = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: ${COLORS.secondaryText};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
  padding-left: 4px;
`;

const ActionButton = styled.TouchableOpacity<{ variant?: 'primary' | 'secondary' }>`
  background-color: ${({ variant }) =>
    variant === 'primary' ? SIGNER_COLORS.primary : SIGNER_COLORS.card};
  padding: 20px;
  border-radius: 16px;
  flex-direction: row;
  align-items: center;
  margin-bottom: 12px;
`;

const ActionIcon = styled.Text`
  font-size: 28px;
  margin-right: 16px;
`;

const ActionContent = styled.View`
  flex: 1;
`;

const ActionTitle = styled.Text<{ variant?: 'primary' | 'secondary' }>`
  font-size: 18px;
  font-weight: 600;
  color: ${({ variant }) =>
    variant === 'primary' ? SIGNER_COLORS.background : COLORS.primaryText};
`;

const ActionDescription = styled.Text<{ variant?: 'primary' | 'secondary' }>`
  font-size: 13px;
  color: ${({ variant }) =>
    variant === 'primary' ? SIGNER_COLORS.background + 'CC' : COLORS.secondaryText};
  margin-top: 4px;
`;

const WalletCard = styled.View`
  background-color: ${SIGNER_COLORS.card};
  border-radius: 16px;
  padding: 20px;
  align-items: center;
  margin-bottom: 12px;
`;

const QRContainer = styled.View`
  background-color: white;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
`;

const AddressText = styled.Text`
  font-size: 14px;
  color: ${COLORS.primaryText};
  font-family: monospace;
  text-align: center;
`;

const AddressLabel = styled.Text`
  font-size: 12px;
  color: ${COLORS.secondaryText};
  margin-top: 8px;
  text-align: center;
`;

const BackButton = styled.TouchableOpacity`
  padding: 16px;
  align-items: center;
  margin-top: 20px;
`;

const BackButtonText = styled.Text`
  color: ${COLORS.secondaryText};
  font-size: 16px;
`;

const WarningBox = styled.View`
  background-color: ${SIGNER_COLORS.warning}20;
  border-width: 1px;
  border-color: ${SIGNER_COLORS.warning};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
`;

const WarningText = styled.Text`
  color: ${SIGNER_COLORS.warning};
  font-size: 14px;
  text-align: center;
`;

interface SignerModeScreenProps {
  navigation: any;
}

export const SignerModeScreen: React.FC<SignerModeScreenProps> = ({
  navigation,
}) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: false,
    isAirplaneMode: true,
    type: 'none',
  });
  const { wallet, network } = useWalletStore();

  // Subscribe to network changes
  useEffect(() => {
    // Get initial status
    networkService.getNetworkStatus().then(setNetworkStatus);

    // Subscribe to changes
    const unsubscribe = networkService.subscribe(setNetworkStatus);
    return unsubscribe;
  }, []);

  const handleCreateWallet = useCallback(() => {
    if (!networkStatus.isAirplaneMode) {
      Alert.alert(
        'Security Warning',
        'Creating a wallet while connected to the internet is less secure. Enable Airplane Mode for maximum security.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue Anyway',
            style: 'destructive',
            onPress: () => navigation.navigate('PhotoEntropy'),
          },
          {
            text: 'Enable Airplane Mode',
            onPress: () => {
              Alert.alert(
                'Enable Airplane Mode',
                'Please enable Airplane Mode in your device settings, then return to this screen.'
              );
            },
          },
        ]
      );
    } else {
      navigation.navigate('PhotoEntropy');
    }
  }, [navigation, networkStatus.isAirplaneMode]);

  const handleSignTransaction = useCallback(() => {
    if (!wallet) {
      Alert.alert('No Wallet', 'Please create or import a wallet first.');
      return;
    }

    if (!networkStatus.isAirplaneMode) {
      Alert.alert(
        'Security Warning',
        'Signing transactions while connected to the internet exposes your device. Enable Airplane Mode for secure signing.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue Anyway',
            style: 'destructive',
            onPress: () =>
              navigation.navigate('QRScanner', { mode: 'transaction' }),
          },
        ]
      );
    } else {
      navigation.navigate('QRScanner', { mode: 'transaction' });
    }
  }, [navigation, wallet, networkStatus.isAirplaneMode]);

  const handleViewSeedPhrase = useCallback(() => {
    Alert.alert(
      'View Recovery Phrase',
      'This will show your secret recovery phrase. Make sure no one is watching your screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Show Phrase',
          onPress: () => navigation.navigate('SeedPhrase'),
        },
      ]
    );
  }, [navigation]);

  return (
    <Container>
      <Header>
        <Title>Signer Mode</Title>
        <Subtitle>Secure Cold Wallet Signing</Subtitle>
      </Header>

      <StatusBanner isOffline={networkStatus.isAirplaneMode}>
        <StatusIcon>
          {networkStatus.isAirplaneMode ? '✈️' : '⚠️'}
        </StatusIcon>
        <StatusText isOffline={networkStatus.isAirplaneMode}>
          {networkStatus.isAirplaneMode
            ? 'Airplane Mode - Secure'
            : 'Online - Enable Airplane Mode for Security'}
        </StatusText>
      </StatusBanner>

      <Content>
        {!networkStatus.isAirplaneMode && (
          <WarningBox>
            <WarningText>
              Your device is connected to the internet. For maximum security,
              enable Airplane Mode before performing any signing operations.
            </WarningText>
          </WarningBox>
        )}

        {wallet && (
          <Section>
            <SectionTitle>Your Wallet</SectionTitle>
            <WalletCard>
              <QRContainer>
                <QRCode
                  value={`bitcoin:${wallet.address}`}
                  size={180}
                  backgroundColor="white"
                  color="black"
                />
              </QRContainer>
              <AddressText>{formatAddress(wallet.address, 12)}</AddressText>
              <AddressLabel>
                {network.type === 'mainnet' ? 'Mainnet' : 'Testnet'} Address
              </AddressLabel>
            </WalletCard>
          </Section>
        )}

        <Section>
          <SectionTitle>Actions</SectionTitle>

          {wallet ? (
            <>
              <ActionButton variant="primary" onPress={handleSignTransaction}>
                <ActionIcon>✍️</ActionIcon>
                <ActionContent>
                  <ActionTitle variant="primary">Sign Transaction</ActionTitle>
                  <ActionDescription variant="primary">
                    Scan a PSBT QR code to sign
                  </ActionDescription>
                </ActionContent>
              </ActionButton>

              <ActionButton onPress={handleViewSeedPhrase}>
                <ActionIcon>🔑</ActionIcon>
                <ActionContent>
                  <ActionTitle>View Recovery Phrase</ActionTitle>
                  <ActionDescription>
                    Show your 12-word backup phrase
                  </ActionDescription>
                </ActionContent>
              </ActionButton>
            </>
          ) : (
            <>
              <ActionButton variant="primary" onPress={handleCreateWallet}>
                <ActionIcon>📷</ActionIcon>
                <ActionContent>
                  <ActionTitle variant="primary">Create New Wallet</ActionTitle>
                  <ActionDescription variant="primary">
                    Generate keys from photo entropy
                  </ActionDescription>
                </ActionContent>
              </ActionButton>

              <ActionButton
                onPress={() => navigation.navigate('Onboarding')}
              >
                <ActionIcon>📝</ActionIcon>
                <ActionContent>
                  <ActionTitle>Import Existing Wallet</ActionTitle>
                  <ActionDescription>
                    Enter your 12-word recovery phrase
                  </ActionDescription>
                </ActionContent>
              </ActionButton>
            </>
          )}
        </Section>

        <Section>
          <SectionTitle>Information</SectionTitle>
          <ActionButton>
            <ActionIcon>ℹ️</ActionIcon>
            <ActionContent>
              <ActionTitle>About Cold Signing</ActionTitle>
              <ActionDescription>
                Your private keys never leave this device. Sign transactions
                securely offline and broadcast from another device.
              </ActionDescription>
            </ActionContent>
          </ActionButton>
        </Section>

        <BackButton onPress={() => navigation.goBack()}>
          <BackButtonText>Exit Signer Mode</BackButtonText>
        </BackButton>
      </Content>
    </Container>
  );
};
