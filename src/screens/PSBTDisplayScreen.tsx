/**
 * PSBT Display Screen
 * Shows unsigned transaction as QR code for cold wallet signing
 */

import React from 'react';
import styled from 'styled-components/native';
import { ScrollView, Share, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { COLORS, SATOSHIS_PER_BTC } from '../utils/constants';
import { formatSatoshis, formatAddress } from '../utils/format';

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${COLORS.primaryBackground};
`;

const Header = styled.View`
  padding: 20px;
  align-items: center;
  border-bottom-width: 1px;
  border-bottom-color: ${COLORS.cardBackground};
`;

const Title = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: ${COLORS.primaryText};
`;

const Subtitle = styled.Text`
  font-size: 14px;
  color: ${COLORS.secondaryText};
  margin-top: 4px;
  text-align: center;
`;

const Content = styled.ScrollView`
  flex: 1;
  padding: 20px;
`;

const QRContainer = styled.View`
  background-color: white;
  padding: 24px;
  border-radius: 20px;
  align-items: center;
  align-self: center;
  margin-bottom: 24px;
`;

const InfoCard = styled.View`
  background-color: ${COLORS.cardBackground};
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
`;

const InfoRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom-width: 1px;
  border-bottom-color: ${COLORS.secondaryBackground};
`;

const InfoRowLast = styled(InfoRow)`
  border-bottom-width: 0;
`;

const InfoLabel = styled.Text`
  font-size: 14px;
  color: ${COLORS.secondaryText};
`;

const InfoValue = styled.Text`
  font-size: 14px;
  color: ${COLORS.primaryText};
  font-weight: 500;
  max-width: 60%;
  text-align: right;
`;

const AddressValue = styled.Text`
  font-size: 12px;
  color: ${COLORS.primaryText};
  font-family: monospace;
  max-width: 70%;
  text-align: right;
`;

const InstructionBox = styled.View`
  background-color: ${COLORS.bitcoinOrange}20;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
`;

const InstructionTitle = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: ${COLORS.bitcoinOrange};
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

const ShareButton = styled.TouchableOpacity`
  background-color: ${COLORS.cardBackground};
  padding: 16px;
  border-radius: 12px;
  align-items: center;
  margin-bottom: 12px;
`;

const ShareButtonText = styled.Text`
  font-size: 16px;
  color: ${COLORS.primaryText};
`;

const ScanButton = styled.TouchableOpacity`
  background-color: ${COLORS.bitcoinOrange};
  padding: 18px;
  border-radius: 16px;
  align-items: center;
`;

const ScanButtonText = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${COLORS.primaryBackground};
`;

const CancelButton = styled.TouchableOpacity`
  padding: 16px;
  align-items: center;
`;

const CancelButtonText = styled.Text`
  font-size: 16px;
  color: ${COLORS.secondaryText};
`;

interface PSBTDisplayScreenProps {
  navigation: any;
  route: {
    params: {
      psbtBase64: string;
      amount: number;
      fee: number;
      recipient: string;
    };
  };
}

export const PSBTDisplayScreen: React.FC<PSBTDisplayScreenProps> = ({
  navigation,
  route,
}) => {
  const { psbtBase64, amount, fee, recipient } = route.params;

  const handleShare = async () => {
    try {
      await Share.share({
        message: psbtBase64,
        title: 'Unsigned Bitcoin Transaction (PSBT)',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share PSBT');
    }
  };

  const handleScanSigned = () => {
    navigation.navigate('QRScanner', {
      mode: 'signedTx',
      onScan: (signedTxHex: string) => {
        // Navigate to broadcast screen or broadcast directly
        navigation.replace('BroadcastTx', { signedTxHex });
      },
    });
  };

  return (
    <Container>
      <Header>
        <Title>Unsigned Transaction</Title>
        <Subtitle>Scan this with your cold wallet to sign</Subtitle>
      </Header>

      <Content>
        <QRContainer>
          <QRCode
            value={psbtBase64}
            size={250}
            backgroundColor="white"
            color="black"
          />
        </QRContainer>

        <InfoCard>
          <InfoRow>
            <InfoLabel>Amount</InfoLabel>
            <InfoValue>
              {(amount / SATOSHIS_PER_BTC).toFixed(8)} BTC
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Network Fee</InfoLabel>
            <InfoValue>{formatSatoshis(fee)} sats</InfoValue>
          </InfoRow>
          <InfoRowLast>
            <InfoLabel>Recipient</InfoLabel>
            <AddressValue numberOfLines={1}>
              {formatAddress(recipient, 12)}
            </AddressValue>
          </InfoRowLast>
        </InfoCard>

        <InstructionBox>
          <InstructionTitle>How to Sign</InstructionTitle>
          <InstructionText>
            1. Open ChillyWallet on your offline device{'\n'}
            2. Go to Settings → Signer Mode{'\n'}
            3. Tap "Sign Transaction"{'\n'}
            4. Scan this QR code{'\n'}
            5. Review and sign the transaction{'\n'}
            6. Come back here and scan the signed transaction
          </InstructionText>
        </InstructionBox>
      </Content>

      <ButtonContainer>
        <ShareButton onPress={handleShare}>
          <ShareButtonText>Share PSBT Data</ShareButtonText>
        </ShareButton>

        <ScanButton onPress={handleScanSigned}>
          <ScanButtonText>Scan Signed Transaction</ScanButtonText>
        </ScanButton>

        <CancelButton onPress={() => navigation.goBack()}>
          <CancelButtonText>Cancel</CancelButtonText>
        </CancelButton>
      </ButtonContainer>
    </Container>
  );
};
