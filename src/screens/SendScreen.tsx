import React, { useState, useCallback } from 'react';
import styled from 'styled-components/native';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useWalletStore } from '../stores';
import { bitcoinService, blockchainService } from '../services';
import { COLORS, FEE_LEVELS } from '../utils/constants';
import {
  formatBTCCompact,
  formatUSD,
  formatSatoshis,
  parseBTCToSatoshis,
  isValidBTCAmount,
  satoshisToBTC,
} from '../utils/format';
import { createUnsignedPSBT, serializePSBT } from '../utils/psbt';

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${COLORS.primaryBackground};
`;

const Content = styled.View`
  flex: 1;
  padding: 20px;
`;

const Label = styled.Text`
  font-size: 14px;
  color: ${COLORS.secondaryText};
  margin-bottom: 8px;
  margin-top: 16px;
`;

const InputContainer = styled.View`
  background-color: ${COLORS.cardBackground};
  border-radius: 12px;
  padding: 16px;
`;

const Input = styled.TextInput`
  font-size: 16px;
  color: ${COLORS.primaryText};
`;

const AmountInputContainer = styled.View`
  background-color: ${COLORS.cardBackground};
  border-radius: 12px;
  padding: 16px;
`;

const AmountRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

const AmountInput = styled.TextInput`
  flex: 1;
  font-size: 32px;
  font-weight: bold;
  color: ${COLORS.primaryText};
`;

const AmountLabel = styled.Text`
  font-size: 24px;
  color: ${COLORS.bitcoinOrange};
  margin-left: 8px;
`;

const USDEquivalent = styled.Text`
  font-size: 14px;
  color: ${COLORS.secondaryText};
  margin-top: 8px;
`;

const BalanceRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
`;

const BalanceText = styled.Text`
  font-size: 12px;
  color: ${COLORS.secondaryText};
`;

const MaxButton = styled.TouchableOpacity`
  background-color: ${COLORS.bitcoinOrange};
  padding: 4px 12px;
  border-radius: 12px;
`;

const MaxButtonText = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: ${COLORS.primaryText};
`;

const FeeContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 8px;
`;

const FeeOption = styled.TouchableOpacity<{ selected: boolean }>`
  flex: 1;
  padding: 12px 8px;
  margin: 0 4px;
  background-color: ${({ selected }) =>
    selected ? COLORS.bitcoinOrange : COLORS.cardBackground};
  border-radius: 12px;
  align-items: center;
`;

const FeeOptionTitle = styled.Text<{ selected: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${({ selected }) => (selected ? COLORS.primaryBackground : COLORS.primaryText)};
`;

const FeeOptionRate = styled.Text<{ selected: boolean }>`
  font-size: 12px;
  color: ${({ selected }) => (selected ? COLORS.primaryBackground : COLORS.secondaryText)};
  margin-top: 2px;
`;

const FeeOptionTime = styled.Text<{ selected: boolean }>`
  font-size: 11px;
  color: ${({ selected }) => (selected ? COLORS.primaryBackground : COLORS.tertiaryText)};
  margin-top: 2px;
`;

const SummaryContainer = styled.View`
  background-color: ${COLORS.cardBackground};
  border-radius: 12px;
  padding: 16px;
  margin-top: 24px;
`;

const SummaryRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const SummaryLabel = styled.Text`
  font-size: 14px;
  color: ${COLORS.secondaryText};
`;

const SummaryValue = styled.Text`
  font-size: 14px;
  color: ${COLORS.primaryText};
`;

const TotalRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 12px;
  border-top-width: 1px;
  border-top-color: ${COLORS.secondaryBackground};
`;

const TotalLabel = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: ${COLORS.primaryText};
`;

const TotalValue = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: ${COLORS.bitcoinOrange};
`;

const ButtonRow = styled.View`
  flex-direction: row;
  margin-top: 24px;
  gap: 12px;
`;

const SendButton = styled.TouchableOpacity<{ disabled: boolean }>`
  flex: 1;
  background-color: ${({ disabled }) => (disabled ? COLORS.secondaryBackground : COLORS.bitcoinOrange)};
  padding: 18px;
  border-radius: 16px;
  align-items: center;
`;

const SendButtonText = styled.Text<{ disabled: boolean }>`
  font-size: 16px;
  font-weight: bold;
  color: ${({ disabled }) => (disabled ? COLORS.tertiaryText : COLORS.primaryBackground)};
`;

const ColdSignButton = styled.TouchableOpacity<{ disabled: boolean }>`
  background-color: ${({ disabled }) => (disabled ? COLORS.secondaryBackground : '#00BFA5')};
  padding: 18px 24px;
  border-radius: 16px;
  align-items: center;
`;

const ColdSignButtonText = styled.Text<{ disabled: boolean }>`
  font-size: 14px;
  font-weight: bold;
  color: ${({ disabled }) => (disabled ? COLORS.tertiaryText : '#0a1a1a')};
`;

const ErrorText = styled.Text`
  font-size: 12px;
  color: ${COLORS.error};
  margin-top: 8px;
`;

interface SendScreenProps {
  navigation: any;
}

type FeeLevel = 'low' | 'medium' | 'high';

export const SendScreen: React.FC<SendScreenProps> = ({ navigation }) => {
  const { wallet, btcPrice, sendBitcoin, isLoading } = useWalletStore();

  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [feeLevel, setFeeLevel] = useState<FeeLevel>('medium');
  const [sending, setSending] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [amountError, setAmountError] = useState('');

  const amountSatoshis = parseBTCToSatoshis(amount);
  const feeRate = FEE_LEVELS[feeLevel].rate;
  const estimatedFee = feeRate * 140; // ~140 vbytes for typical tx
  const totalSatoshis = amountSatoshis + estimatedFee;

  const usdEquivalent = satoshisToBTC(amountSatoshis) * btcPrice;

  const validateAddress = useCallback((address: string) => {
    if (!address) {
      setAddressError('');
      return;
    }
    if (!bitcoinService.isValidAddress(address)) {
      setAddressError('Invalid Bitcoin address');
    } else {
      setAddressError('');
    }
  }, []);

  const validateAmount = useCallback((value: string) => {
    if (!value) {
      setAmountError('');
      return;
    }
    if (!isValidBTCAmount(value)) {
      setAmountError('Invalid amount');
      return;
    }
    const sats = parseBTCToSatoshis(value);
    if (wallet && sats + estimatedFee > wallet.balance) {
      setAmountError('Insufficient balance');
    } else {
      setAmountError('');
    }
  }, [wallet, estimatedFee]);

  const handleAddressChange = (text: string) => {
    setToAddress(text);
    validateAddress(text);
  };

  const handleAmountChange = (text: string) => {
    // Only allow valid number input
    const cleaned = text.replace(/[^0-9.]/g, '');
    setAmount(cleaned);
    validateAmount(cleaned);
  };

  const handleMax = () => {
    if (!wallet) return;
    const maxSatoshis = wallet.balance - estimatedFee;
    if (maxSatoshis > 0) {
      const maxBTC = satoshisToBTC(maxSatoshis).toFixed(8);
      setAmount(maxBTC);
      setAmountError('');
    }
  };

  const canSend =
    toAddress &&
    amount &&
    !addressError &&
    !amountError &&
    amountSatoshis > 0 &&
    wallet &&
    totalSatoshis <= wallet.balance;

  const handleSend = async () => {
    if (!canSend || !wallet) return;

    setSending(true);
    try {
      const result = await sendBitcoin(toAddress, amountSatoshis, feeLevel);

      Alert.alert(
        'Transaction Sent',
        `Your transaction has been broadcast to the Bitcoin network.\n\nTxID: ${result.txid.slice(0, 16)}...\n\nFee: ${result.fee} sats`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Transaction Failed', error.message || 'Failed to send transaction');
    } finally {
      setSending(false);
    }
  };

  const handleColdSign = async () => {
    if (!canSend || !wallet) return;

    setSending(true);
    try {
      // Fetch UTXOs for the wallet
      const utxos = await blockchainService.getUTXOs(wallet.address);
      
      if (utxos.length === 0) {
        throw new Error('No UTXOs available');
      }

      // Select UTXOs (simple: use all)
      let totalInput = 0;
      const inputs = [];
      for (const utxo of utxos) {
        inputs.push({
          txid: utxo.txid,
          vout: utxo.vout,
          value: utxo.value,
        });
        totalInput += utxo.value;
        if (totalInput >= totalSatoshis) break;
      }

      if (totalInput < totalSatoshis) {
        throw new Error('Insufficient funds');
      }

      // Create outputs
      const outputs = [
        { address: toAddress, value: amountSatoshis },
      ];

      // Add change output if needed
      const change = totalInput - amountSatoshis - estimatedFee;
      let changeIndex: number | undefined;
      if (change > 546) { // dust threshold
        outputs.push({ address: wallet.address, value: change });
        changeIndex = 1;
      }

      // Create unsigned PSBT
      const network = wallet.address.startsWith('bc1') ? 'mainnet' : 'testnet';
      const psbt = createUnsignedPSBT(inputs, outputs, network, changeIndex);
      const psbtBase64 = serializePSBT(psbt);

      // Navigate to PSBT display screen
      navigation.navigate('PSBTDisplay', {
        psbtBase64,
        amount: amountSatoshis,
        fee: estimatedFee,
        recipient: toAddress,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create transaction');
    } finally {
      setSending(false);
    }
  };

  return (
    <Container>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView>
          <Content>
            <Label>Recipient Address</Label>
            <InputContainer>
              <Input
                placeholder="Enter Bitcoin address"
                placeholderTextColor={COLORS.tertiaryText}
                value={toAddress}
                onChangeText={handleAddressChange}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </InputContainer>
            {addressError ? <ErrorText>{addressError}</ErrorText> : null}

            <Label>Amount</Label>
            <AmountInputContainer>
              <AmountRow>
                <AmountInput
                  placeholder="0"
                  placeholderTextColor={COLORS.tertiaryText}
                  value={amount}
                  onChangeText={handleAmountChange}
                  keyboardType="decimal-pad"
                />
                <AmountLabel>BTC</AmountLabel>
              </AmountRow>
              <USDEquivalent>≈ {formatUSD(usdEquivalent)}</USDEquivalent>
              <BalanceRow>
                <BalanceText>
                  Available: {wallet ? formatBTCCompact(wallet.balance) : '0'} BTC
                </BalanceText>
                <MaxButton onPress={handleMax}>
                  <MaxButtonText>MAX</MaxButtonText>
                </MaxButton>
              </BalanceRow>
            </AmountInputContainer>
            {amountError ? <ErrorText>{amountError}</ErrorText> : null}

            <Label>Network Fee</Label>
            <FeeContainer>
              {(Object.keys(FEE_LEVELS) as FeeLevel[]).map((level) => (
                <FeeOption
                  key={level}
                  selected={feeLevel === level}
                  onPress={() => setFeeLevel(level)}
                >
                  <FeeOptionTitle selected={feeLevel === level}>
                    {FEE_LEVELS[level].name}
                  </FeeOptionTitle>
                  <FeeOptionRate selected={feeLevel === level}>
                    {FEE_LEVELS[level].rate} sat/vB
                  </FeeOptionRate>
                  <FeeOptionTime selected={feeLevel === level}>
                    {FEE_LEVELS[level].time}
                  </FeeOptionTime>
                </FeeOption>
              ))}
            </FeeContainer>

            {amountSatoshis > 0 && (
              <SummaryContainer>
                <SummaryRow>
                  <SummaryLabel>Amount</SummaryLabel>
                  <SummaryValue>{formatBTCCompact(amountSatoshis)} BTC</SummaryValue>
                </SummaryRow>
                <SummaryRow>
                  <SummaryLabel>Network Fee</SummaryLabel>
                  <SummaryValue>{formatSatoshis(estimatedFee)} sats</SummaryValue>
                </SummaryRow>
                <TotalRow>
                  <TotalLabel>Total</TotalLabel>
                  <TotalValue>{formatBTCCompact(totalSatoshis)} BTC</TotalValue>
                </TotalRow>
              </SummaryContainer>
            )}

            <ButtonRow>
              <SendButton disabled={!canSend || sending} onPress={handleSend}>
                <SendButtonText disabled={!canSend || sending}>
                  {sending ? 'Sending...' : 'Send'}
                </SendButtonText>
              </SendButton>
              <ColdSignButton disabled={!canSend || sending} onPress={handleColdSign}>
                <ColdSignButtonText disabled={!canSend || sending}>
                  Cold Sign
                </ColdSignButtonText>
              </ColdSignButton>
            </ButtonRow>
          </Content>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
};
