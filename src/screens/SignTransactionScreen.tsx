/**
 * Sign Transaction Screen
 * Reviews and signs an unsigned transaction (PSBT)
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components/native';
import { Alert, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS, SATOSHIS_PER_BTC } from '../utils/constants';
import {
  deserializePSBT,
  UnsignedPSBT,
  getSendAmount,
  getRecipientAddress,
} from '../utils/psbt';
import { useWalletStore } from '../stores';
import { keychainService } from '../services';
import { STORAGE_KEYS } from '../utils/constants';
import { buildTransaction, signTransaction } from '../utils/transaction';
import { derivePrivateKey } from '../utils/crypto';
import { formatBTC, formatSatoshis, formatAddress } from '../utils/format';

const SIGNER_COLORS = {
  primary: '#00BFA5',
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
  flex-direction: row;
  align-items: center;
`;

const BackButton = styled.TouchableOpacity`
  padding: 8px;
  margin-right: 12px;
`;

const BackButtonText = styled.Text`
  color: ${COLORS.secondaryText};
  font-size: 16px;
`;

const HeaderTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: ${COLORS.primaryText};
  flex: 1;
`;

const Content = styled.ScrollView`
  flex: 1;
  padding: 20px;
`;

const Section = styled.View`
  background-color: ${SIGNER_COLORS.card};
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
`;

const SectionTitle = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: ${COLORS.secondaryText};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
`;

const AmountContainer = styled.View`
  align-items: center;
  padding: 20px 0;
`;

const AmountLabel = styled.Text`
  font-size: 14px;
  color: ${COLORS.secondaryText};
  margin-bottom: 8px;
`;

const AmountValue = styled.Text`
  font-size: 36px;
  font-weight: bold;
  color: ${COLORS.primaryText};
`;

const AmountUnit = styled.Text`
  font-size: 18px;
  color: ${SIGNER_COLORS.primary};
  margin-top: 4px;
`;

const DetailRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom-width: 1px;
  border-bottom-color: ${SIGNER_COLORS.background};
`;

const DetailLabel = styled.Text`
  font-size: 14px;
  color: ${COLORS.secondaryText};
`;

const DetailValue = styled.Text`
  font-size: 14px;
  color: ${COLORS.primaryText};
  font-weight: 500;
  text-align: right;
  max-width: 60%;
`;

const AddressValue = styled.Text`
  font-size: 12px;
  color: ${COLORS.primaryText};
  font-family: monospace;
  text-align: right;
  max-width: 70%;
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

const InfoBox = styled.View`
  background-color: ${SIGNER_COLORS.primary}20;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
`;

const InfoText = styled.Text`
  color: ${SIGNER_COLORS.primary};
  font-size: 14px;
  text-align: center;
`;

const ButtonContainer = styled.View`
  padding: 20px;
`;

const SignButton = styled.TouchableOpacity<{ disabled: boolean }>`
  background-color: ${({ disabled }) =>
    disabled ? COLORS.secondaryBackground : SIGNER_COLORS.primary};
  padding: 18px;
  border-radius: 16px;
  align-items: center;
`;

const SignButtonText = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${SIGNER_COLORS.background};
`;

const CancelButton = styled.TouchableOpacity`
  padding: 16px;
  align-items: center;
  margin-top: 8px;
`;

const CancelButtonText = styled.Text`
  color: ${COLORS.secondaryText};
  font-size: 16px;
`;

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const LoadingText = styled.Text`
  color: ${COLORS.secondaryText};
  font-size: 16px;
  margin-top: 16px;
`;

const ErrorContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const ErrorText = styled.Text`
  color: ${SIGNER_COLORS.warning};
  font-size: 16px;
  text-align: center;
  margin-bottom: 20px;
`;

const RetryButton = styled.TouchableOpacity`
  background-color: ${SIGNER_COLORS.card};
  padding: 16px 32px;
  border-radius: 12px;
`;

const RetryButtonText = styled.Text`
  color: ${COLORS.primaryText};
  font-size: 16px;
`;

interface SignTransactionScreenProps {
  navigation: any;
  route: {
    params: {
      psbtData: string;
    };
  };
}

export const SignTransactionScreen: React.FC<SignTransactionScreenProps> = ({
  navigation,
  route,
}) => {
  const { psbtData } = route.params;
  const [psbt, setPsbt] = useState<UnsignedPSBT | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  const { wallet, network } = useWalletStore();

  // Parse PSBT on mount
  useEffect(() => {
    try {
      const parsed = deserializePSBT(psbtData);

      // Validate network matches
      if (parsed.network !== network.type) {
        setError(
          `Network mismatch: Transaction is for ${parsed.network}, but wallet is on ${network.type}`
        );
        return;
      }

      setPsbt(parsed);
    } catch (err) {
      console.error('Failed to parse PSBT:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse transaction data');
    }
  }, [psbtData, network.type]);

  const handleSign = useCallback(async () => {
    if (!psbt || !wallet) return;

    setIsSigning(true);

    try {
      // Get mnemonic from keychain
      const mnemonic = await keychainService.get(STORAGE_KEYS.MNEMONIC);
      if (!mnemonic) {
        throw new Error('Wallet not found. Please import your wallet first.');
      }

      // Derive private key
      const privateKey = derivePrivateKey(mnemonic, network.type);

      // Build unsigned transaction
      const unsignedTx = buildTransaction({
        inputs: psbt.inputs.map((input) => ({
          txid: input.txid,
          vout: input.vout,
          value: input.value,
        })),
        outputs: psbt.outputs.map((output) => ({
          address: output.address,
          value: output.value,
        })),
        network: network.type,
      });

      // Sign transaction
      const signedTxHex = signTransaction(unsignedTx, privateKey, network.type);

      // Navigate to display screen
      navigation.replace('SignedTxDisplay', {
        signedTx: signedTxHex,
        amount: getSendAmount(psbt),
        fee: psbt.fee,
        recipient: getRecipientAddress(psbt),
      });
    } catch (err) {
      console.error('Failed to sign transaction:', err);
      Alert.alert(
        'Signing Failed',
        err instanceof Error ? err.message : 'Failed to sign transaction'
      );
    } finally {
      setIsSigning(false);
    }
  }, [psbt, wallet, network.type, navigation]);

  if (error) {
    return (
      <Container>
        <Header>
          <BackButton onPress={() => navigation.goBack()}>
            <BackButtonText>Cancel</BackButtonText>
          </BackButton>
          <HeaderTitle>Error</HeaderTitle>
        </Header>
        <ErrorContainer>
          <ErrorText>{error}</ErrorText>
          <RetryButton onPress={() => navigation.goBack()}>
            <RetryButtonText>Go Back</RetryButtonText>
          </RetryButton>
        </ErrorContainer>
      </Container>
    );
  }

  if (!psbt) {
    return (
      <Container>
        <LoadingContainer>
          <ActivityIndicator color={SIGNER_COLORS.primary} size="large" />
          <LoadingText>Parsing transaction...</LoadingText>
        </LoadingContainer>
      </Container>
    );
  }

  const sendAmount = getSendAmount(psbt);
  const recipientAddress = getRecipientAddress(psbt);
  const totalInput = psbt.inputs.reduce((sum, input) => sum + input.value, 0);

  return (
    <Container>
      <Header>
        <BackButton onPress={() => navigation.goBack()}>
          <BackButtonText>Cancel</BackButtonText>
        </BackButton>
        <HeaderTitle>Review Transaction</HeaderTitle>
      </Header>

      <Content>
        <WarningBox>
          <WarningText>
            Review all details carefully before signing. This action cannot be
            undone.
          </WarningText>
        </WarningBox>

        <Section>
          <SectionTitle>Sending</SectionTitle>
          <AmountContainer>
            <AmountLabel>Amount</AmountLabel>
            <AmountValue>
              {(sendAmount / SATOSHIS_PER_BTC).toFixed(8)}
            </AmountValue>
            <AmountUnit>BTC</AmountUnit>
          </AmountContainer>
        </Section>

        <Section>
          <SectionTitle>Details</SectionTitle>

          <DetailRow>
            <DetailLabel>To Address</DetailLabel>
            <AddressValue numberOfLines={2}>
              {recipientAddress || 'Unknown'}
            </AddressValue>
          </DetailRow>

          <DetailRow>
            <DetailLabel>Network Fee</DetailLabel>
            <DetailValue>{formatSatoshis(psbt.fee)} sats</DetailValue>
          </DetailRow>

          <DetailRow>
            <DetailLabel>Total Input</DetailLabel>
            <DetailValue>
              {(totalInput / SATOSHIS_PER_BTC).toFixed(8)} BTC
            </DetailValue>
          </DetailRow>

          <DetailRow>
            <DetailLabel>Inputs</DetailLabel>
            <DetailValue>{psbt.inputs.length} UTXO(s)</DetailValue>
          </DetailRow>

          <DetailRow>
            <DetailLabel>Outputs</DetailLabel>
            <DetailValue>{psbt.outputs.length} output(s)</DetailValue>
          </DetailRow>

          <DetailRow style={{ borderBottomWidth: 0 }}>
            <DetailLabel>Network</DetailLabel>
            <DetailValue>
              {psbt.network === 'mainnet' ? 'Bitcoin Mainnet' : 'Bitcoin Testnet'}
            </DetailValue>
          </DetailRow>
        </Section>

        <InfoBox>
          <InfoText>
            Signing this transaction will authorize the transfer of{' '}
            {(sendAmount / SATOSHIS_PER_BTC).toFixed(8)} BTC plus{' '}
            {formatSatoshis(psbt.fee)} sats in network fees.
          </InfoText>
        </InfoBox>
      </Content>

      <ButtonContainer>
        <SignButton disabled={isSigning} onPress={handleSign}>
          {isSigning ? (
            <ActivityIndicator color={SIGNER_COLORS.background} />
          ) : (
            <SignButtonText>Sign Transaction</SignButtonText>
          )}
        </SignButton>

        <CancelButton onPress={() => navigation.goBack()}>
          <CancelButtonText>Cancel</CancelButtonText>
        </CancelButton>
      </ButtonContainer>
    </Container>
  );
};
