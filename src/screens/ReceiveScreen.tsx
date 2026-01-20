import React, { useState } from 'react';
import styled from 'styled-components/native';
import { Share, Alert, Dimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useWalletStore } from '../stores';
import { COLORS } from '../utils/constants';
import { formatAddress } from '../utils/format';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QR_SIZE = SCREEN_WIDTH * 0.6;

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${COLORS.primaryBackground};
`;

const Content = styled.ScrollView`
  flex: 1;
  padding: 20px;
`;

const QRContainer = styled.View`
  align-items: center;
  padding: 32px;
  background-color: ${COLORS.cardBackground};
  border-radius: 24px;
  margin: 20px 0;
`;

const QRWrapper = styled.View`
  padding: 16px;
  background-color: #fff;
  border-radius: 16px;
`;

const AddressLabel = styled.Text`
  font-size: 14px;
  color: ${COLORS.secondaryText};
  margin-top: 24px;
  margin-bottom: 8px;
`;

const AddressContainer = styled.View`
  background-color: ${COLORS.secondaryBackground};
  padding: 16px;
  border-radius: 12px;
  width: 100%;
`;

const AddressText = styled.Text`
  font-size: 14px;
  color: ${COLORS.primaryText};
  text-align: center;
  font-family: ${Platform.OS === 'ios' ? 'Menlo' : 'monospace'};
`;

const ButtonRow = styled.View`
  flex-direction: row;
  justify-content: center;
  margin-top: 16px;
  gap: 12px;
`;

const ActionButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 12px 24px;
  background-color: ${COLORS.bitcoinOrange};
  border-radius: 12px;
`;

const ActionButtonSecondary = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 12px 24px;
  background-color: ${COLORS.secondaryBackground};
  border-radius: 12px;
`;

const ActionButtonText = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: ${COLORS.primaryBackground};
  margin-left: 8px;
`;

const ActionButtonTextSecondary = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: ${COLORS.primaryText};
  margin-left: 8px;
`;

const ActionIcon = styled.Text`
  font-size: 16px;
`;

const InfoCard = styled.View`
  background-color: ${COLORS.cardBackground};
  padding: 16px;
  border-radius: 12px;
  margin-top: 24px;
`;

const InfoTitle = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: ${COLORS.bitcoinOrange};
  margin-bottom: 8px;
`;

const InfoText = styled.Text`
  font-size: 13px;
  color: ${COLORS.secondaryText};
  line-height: 20px;
`;

const NetworkBadge = styled.View`
  background-color: ${COLORS.bitcoinOrange};
  padding: 4px 12px;
  border-radius: 12px;
  align-self: center;
  margin-bottom: 16px;
`;

const NetworkText = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: ${COLORS.primaryBackground};
`;

const CopiedToast = styled.View`
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-75px);
  background-color: ${COLORS.success};
  padding: 12px 24px;
  border-radius: 24px;
`;

const CopiedText = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #fff;
`;

import { Platform } from 'react-native';

interface ReceiveScreenProps {
  navigation: any;
}

export const ReceiveScreen: React.FC<ReceiveScreenProps> = ({ navigation }) => {
  const { wallet, network } = useWalletStore();
  const [showCopied, setShowCopied] = useState(false);

  const address = wallet?.address || '';
  const bitcoinUri = `bitcoin:${address}`;

  const handleCopy = async () => {
    if (!address) return;

    try {
      // Use Share API as copy functionality
      await Share.share({ message: address, title: 'Bitcoin Address' });
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch {
      Alert.alert('Error', 'Failed to copy address');
    }
  };

  const handleShare = async () => {
    if (!address) return;

    try {
      await Share.share({
        message: address,
        title: 'Bitcoin Address',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <Container>
      <Content>
        <QRContainer>
          <NetworkBadge>
            <NetworkText>{network.name}</NetworkText>
          </NetworkBadge>

          <QRWrapper>
            {address ? (
              <QRCode
                value={bitcoinUri}
                size={QR_SIZE}
                backgroundColor="#fff"
                color="#000"
              />
            ) : (
              <AddressText>No wallet address</AddressText>
            )}
          </QRWrapper>

          <AddressLabel>Your Bitcoin Address</AddressLabel>
          <AddressContainer>
            <AddressText>{address || 'No address'}</AddressText>
          </AddressContainer>

          <ButtonRow>
            <ActionButton onPress={handleCopy}>
              <ActionIcon>📋</ActionIcon>
              <ActionButtonText>Copy</ActionButtonText>
            </ActionButton>
            <ActionButtonSecondary onPress={handleShare}>
              <ActionIcon>📤</ActionIcon>
              <ActionButtonTextSecondary>Share</ActionButtonTextSecondary>
            </ActionButtonSecondary>
          </ButtonRow>
        </QRContainer>

        <InfoCard>
          <InfoTitle>How to receive Bitcoin</InfoTitle>
          <InfoText>
            Share this address with the sender or let them scan the QR code.{'\n\n'}
            Only send Bitcoin (BTC) to this address. Sending any other cryptocurrency
            may result in permanent loss.
          </InfoText>
        </InfoCard>

        {network.type === 'testnet' && (
          <InfoCard>
            <InfoTitle>Testnet Mode</InfoTitle>
            <InfoText>
              This is a testnet address. Testnet coins have no real value and are
              used for testing purposes only.
            </InfoText>
          </InfoCard>
        )}
      </Content>

      {showCopied && (
        <CopiedToast>
          <CopiedText>Address Copied!</CopiedText>
        </CopiedToast>
      )}
    </Container>
  );
};
