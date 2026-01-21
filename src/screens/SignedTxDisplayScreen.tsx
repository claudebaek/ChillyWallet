/**
 * Signed Transaction Display Screen
 * Displays the signed transaction as QR code and hex string for broadcast
 */

import React, { useState, useCallback } from 'react';
import styled from 'styled-components/native';
import { Alert, ScrollView, Clipboard, Dimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { COLORS, SATOSHIS_PER_BTC } from '../utils/constants';
import { serializeSignedTx } from '../utils/psbt';
import { formatSatoshis } from '../utils/format';

const SIGNER_COLORS = {
  primary: '#00BFA5',
  background: '#0a1a1a',
  card: '#0f2f2f',
  success: '#00BFA5',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QR_SIZE = Math.min(SCREEN_WIDTH - 80, 280);

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${SIGNER_COLORS.background};
`;

const Header = styled.View`
  padding: 20px;
  border-bottom-width: 1px;
  border-bottom-color: ${SIGNER_COLORS.card};
  align-items: center;
`;

const SuccessIcon = styled.Text`
  font-size: 48px;
  margin-bottom: 12px;
`;

const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: ${SIGNER_COLORS.success};
  text-align: center;
`;

const Subtitle = styled.Text`
  font-size: 14px;
  color: ${COLORS.secondaryText};
  text-align: center;
  margin-top: 8px;
`;

const Content = styled.ScrollView`
  flex: 1;
  padding: 20px;
`;

const QRSection = styled.View`
  align-items: center;
  margin-bottom: 24px;
`;

const QRContainer = styled.View`
  background-color: white;
  padding: 20px;
  border-radius: 20px;
  margin-bottom: 16px;
`;

const QRLabel = styled.Text`
  font-size: 14px;
  color: ${COLORS.secondaryText};
  text-align: center;
`;

const TabContainer = styled.View`
  flex-direction: row;
  background-color: ${SIGNER_COLORS.card};
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 16px;
`;

const Tab = styled.TouchableOpacity<{ active: boolean }>`
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  background-color: ${({ active }) =>
    active ? SIGNER_COLORS.primary : 'transparent'};
  align-items: center;
`;

const TabText = styled.Text<{ active: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${({ active }) =>
    active ? SIGNER_COLORS.background : COLORS.secondaryText};
`;

const HexContainer = styled.View`
  background-color: ${SIGNER_COLORS.card};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
`;

const HexLabel = styled.Text`
  font-size: 12px;
  color: ${COLORS.secondaryText};
  margin-bottom: 8px;
`;

const HexValue = styled.Text`
  font-size: 12px;
  color: ${COLORS.primaryText};
  font-family: monospace;
  line-height: 18px;
`;

const CopyButton = styled.TouchableOpacity`
  background-color: ${SIGNER_COLORS.primary}20;
  padding: 12px;
  border-radius: 8px;
  align-items: center;
  margin-top: 12px;
`;

const CopyButtonText = styled.Text`
  color: ${SIGNER_COLORS.primary};
  font-size: 14px;
  font-weight: 600;
`;

const SummarySection = styled.View`
  background-color: ${SIGNER_COLORS.card};
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
`;

const SummaryTitle = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: ${COLORS.secondaryText};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
`;

const SummaryRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  padding: 8px 0;
`;

const SummaryLabel = styled.Text`
  font-size: 14px;
  color: ${COLORS.secondaryText};
`;

const SummaryValue = styled.Text`
  font-size: 14px;
  color: ${COLORS.primaryText};
  font-weight: 500;
`;

const InstructionBox = styled.View`
  background-color: ${SIGNER_COLORS.primary}10;
  border-width: 1px;
  border-color: ${SIGNER_COLORS.primary}40;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
`;

const InstructionTitle = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: ${SIGNER_COLORS.primary};
  margin-bottom: 8px;
`;

const InstructionText = styled.Text`
  font-size: 13px;
  color: ${COLORS.secondaryText};
  line-height: 20px;
`;

const ButtonContainer = styled.View`
  padding: 20px;
`;

const DoneButton = styled.TouchableOpacity`
  background-color: ${SIGNER_COLORS.primary};
  padding: 18px;
  border-radius: 16px;
  align-items: center;
`;

const DoneButtonText = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${SIGNER_COLORS.background};
`;

type DisplayMode = 'qr' | 'hex';

interface SignedTxDisplayScreenProps {
  navigation: any;
  route: {
    params: {
      signedTx: string;
      amount: number;
      fee: number;
      recipient: string | null;
    };
  };
}

export const SignedTxDisplayScreen: React.FC<SignedTxDisplayScreenProps> = ({
  navigation,
  route,
}) => {
  const { signedTx, amount, fee, recipient } = route.params;
  const [displayMode, setDisplayMode] = useState<DisplayMode>('qr');
  const [copied, setCopied] = useState(false);

  // Prepare QR data (wrap in our format for easier parsing)
  const qrData = serializeSignedTx({
    txHex: signedTx,
    txid: '', // Will be calculated by broadcast node
    network: 'mainnet', // Could be passed from previous screen
  });

  const handleCopyHex = useCallback(() => {
    Clipboard.setString(signedTx);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert('Copied', 'Transaction hex copied to clipboard');
  }, [signedTx]);

  const handleCopyQRData = useCallback(() => {
    Clipboard.setString(qrData);
    Alert.alert('Copied', 'QR data copied to clipboard');
  }, [qrData]);

  const handleDone = useCallback(() => {
    // Navigate back to signer mode
    navigation.navigate('SignerMode');
  }, [navigation]);

  // Check if hex is too long for single QR
  const isHexTooLong = signedTx.length > 2000;

  return (
    <Container>
      <Header>
        <SuccessIcon>✅</SuccessIcon>
        <Title>Transaction Signed</Title>
        <Subtitle>
          Scan this QR code from your online device to broadcast
        </Subtitle>
      </Header>

      <Content>
        <TabContainer>
          <Tab active={displayMode === 'qr'} onPress={() => setDisplayMode('qr')}>
            <TabText active={displayMode === 'qr'}>QR Code</TabText>
          </Tab>
          <Tab active={displayMode === 'hex'} onPress={() => setDisplayMode('hex')}>
            <TabText active={displayMode === 'hex'}>Hex Data</TabText>
          </Tab>
        </TabContainer>

        {displayMode === 'qr' ? (
          <QRSection>
            <QRContainer>
              {isHexTooLong ? (
                <QRCode
                  value={qrData}
                  size={QR_SIZE}
                  backgroundColor="white"
                  color="black"
                  ecl="L" // Lower error correction for more data
                />
              ) : (
                <QRCode
                  value={signedTx}
                  size={QR_SIZE}
                  backgroundColor="white"
                  color="black"
                />
              )}
            </QRContainer>
            <QRLabel>
              {isHexTooLong
                ? 'Encoded signed transaction'
                : 'Raw transaction hex'}
            </QRLabel>
            <CopyButton onPress={isHexTooLong ? handleCopyQRData : handleCopyHex}>
              <CopyButtonText>Copy QR Data</CopyButtonText>
            </CopyButton>
          </QRSection>
        ) : (
          <HexContainer>
            <HexLabel>Signed Transaction Hex</HexLabel>
            <HexValue numberOfLines={20} ellipsizeMode="middle">
              {signedTx}
            </HexValue>
            <CopyButton onPress={handleCopyHex}>
              <CopyButtonText>
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </CopyButtonText>
            </CopyButton>
          </HexContainer>
        )}

        <SummarySection>
          <SummaryTitle>Transaction Summary</SummaryTitle>
          <SummaryRow>
            <SummaryLabel>Amount</SummaryLabel>
            <SummaryValue>
              {(amount / SATOSHIS_PER_BTC).toFixed(8)} BTC
            </SummaryValue>
          </SummaryRow>
          <SummaryRow>
            <SummaryLabel>Fee</SummaryLabel>
            <SummaryValue>{formatSatoshis(fee)} sats</SummaryValue>
          </SummaryRow>
          {recipient && (
            <SummaryRow>
              <SummaryLabel>Recipient</SummaryLabel>
              <SummaryValue numberOfLines={1} style={{ maxWidth: '60%' }}>
                {recipient.slice(0, 10)}...{recipient.slice(-8)}
              </SummaryValue>
            </SummaryRow>
          )}
          <SummaryRow>
            <SummaryLabel>Size</SummaryLabel>
            <SummaryValue>{Math.ceil(signedTx.length / 2)} bytes</SummaryValue>
          </SummaryRow>
        </SummarySection>

        <InstructionBox>
          <InstructionTitle>Next Steps</InstructionTitle>
          <InstructionText>
            1. On your online device, open a Bitcoin wallet or broadcast service
            {'\n'}
            2. Scan this QR code or paste the hex data
            {'\n'}
            3. Broadcast the transaction to the Bitcoin network
            {'\n'}
            4. The transaction will be confirmed in the next block(s)
          </InstructionText>
        </InstructionBox>
      </Content>

      <ButtonContainer>
        <DoneButton onPress={handleDone}>
          <DoneButtonText>Done</DoneButtonText>
        </DoneButton>
      </ButtonContainer>
    </Container>
  );
};
