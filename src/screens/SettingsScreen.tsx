import React, { useState } from 'react';
import styled from 'styled-components/native';
import { Alert, ScrollView, Switch } from 'react-native';
import { useWalletStore } from '../stores';
import { COLORS, NETWORKS } from '../utils/constants';
import { formatAddress } from '../utils/format';
import { Network } from '../types';

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${COLORS.primaryBackground};
`;

const Content = styled.ScrollView`
  flex: 1;
`;

const Section = styled.View`
  margin-bottom: 24px;
`;

const SectionTitle = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: ${COLORS.secondaryText};
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 16px 20px 8px;
`;

const SettingsItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 16px 20px;
  background-color: ${COLORS.cardBackground};
  border-bottom-width: 1px;
  border-bottom-color: ${COLORS.secondaryBackground};
`;

const SettingsItemFirst = styled(SettingsItem)`
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  margin-left: 16px;
  margin-right: 16px;
`;

const SettingsItemLast = styled(SettingsItem)`
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  border-bottom-width: 0;
  margin-left: 16px;
  margin-right: 16px;
`;

const SettingsItemMiddle = styled(SettingsItem)`
  margin-left: 16px;
  margin-right: 16px;
`;

const SettingsItemSingle = styled(SettingsItem)`
  border-radius: 12px;
  border-bottom-width: 0;
  margin-left: 16px;
  margin-right: 16px;
`;

const ItemIcon = styled.Text`
  font-size: 22px;
  margin-right: 12px;
`;

const ItemContent = styled.View`
  flex: 1;
`;

const ItemTitle = styled.Text`
  font-size: 16px;
  color: ${COLORS.primaryText};
`;

const ItemSubtitle = styled.Text`
  font-size: 13px;
  color: ${COLORS.secondaryText};
  margin-top: 2px;
`;

const ItemValue = styled.Text`
  font-size: 14px;
  color: ${COLORS.secondaryText};
`;

const ArrowIcon = styled.Text`
  font-size: 16px;
  color: ${COLORS.tertiaryText};
  margin-left: 8px;
`;

const DangerItem = styled(SettingsItemSingle)`
  background-color: rgba(255, 82, 82, 0.1);
`;

const DangerTitle = styled.Text`
  font-size: 16px;
  color: ${COLORS.error};
`;

const VersionText = styled.Text`
  font-size: 12px;
  color: ${COLORS.tertiaryText};
  text-align: center;
  margin-top: 24px;
  margin-bottom: 40px;
`;

const NetworkOption = styled.TouchableOpacity<{ selected: boolean }>`
  flex-direction: row;
  align-items: center;
  padding: 16px 20px;
  background-color: ${({ selected }) =>
    selected ? COLORS.bitcoinOrange + '20' : COLORS.cardBackground};
  margin: 4px 16px;
  border-radius: 12px;
  border-width: ${({ selected }) => (selected ? '2px' : '0')};
  border-color: ${COLORS.bitcoinOrange};
`;

const NetworkInfo = styled.View`
  flex: 1;
`;

const NetworkName = styled.Text`
  font-size: 16px;
  font-weight: 500;
  color: ${COLORS.primaryText};
`;

const NetworkType = styled.Text`
  font-size: 13px;
  color: ${COLORS.secondaryText};
  margin-top: 2px;
`;

const CheckIcon = styled.Text`
  font-size: 20px;
  color: ${COLORS.bitcoinOrange};
`;

interface SettingsScreenProps {
  onLogout: () => void;
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onLogout, navigation }) => {
  const { wallet, network, setNetwork, reset } = useWalletStore();
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);

  const handleNetworkChange = (newNetwork: Network) => {
    setNetwork(newNetwork);
    setShowNetworkPicker(false);
    Alert.alert(
      'Network Changed',
      `Switched to ${newNetwork.name}. Note: Your address may change on different networks.`
    );
  };

  const handleViewSeedPhrase = () => {
    Alert.alert(
      'View Recovery Phrase',
      'This will show your secret recovery phrase. Make sure you are in a private place.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => navigation.navigate('SeedPhrase'),
        },
      ]
    );
  };

  const handleResetWallet = () => {
    Alert.alert(
      'Delete Wallet',
      'This will permanently delete your wallet from this device. Make sure you have backed up your recovery phrase!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'This action cannot be undone. You will lose access to your funds if you have not backed up your recovery phrase.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Wallet',
                  style: 'destructive',
                  onPress: async () => {
                    await reset();
                    onLogout();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <Container>
      <Content>
        <Section>
          <SectionTitle>Wallet</SectionTitle>
          <SettingsItemFirst activeOpacity={0.7}>
            <ItemIcon>💼</ItemIcon>
            <ItemContent>
              <ItemTitle>Address</ItemTitle>
              <ItemSubtitle>
                {wallet ? formatAddress(wallet.address, 12) : 'No wallet'}
              </ItemSubtitle>
            </ItemContent>
          </SettingsItemFirst>
          <SettingsItemLast onPress={handleViewSeedPhrase} activeOpacity={0.7}>
            <ItemIcon>🔑</ItemIcon>
            <ItemContent>
              <ItemTitle>Recovery Phrase</ItemTitle>
              <ItemSubtitle>View your 12-word backup phrase</ItemSubtitle>
            </ItemContent>
            <ArrowIcon>›</ArrowIcon>
          </SettingsItemLast>
        </Section>

        <Section>
          <SectionTitle>Network</SectionTitle>
          {Object.values(NETWORKS).map((net) => (
            <NetworkOption
              key={net.type}
              selected={network.type === net.type}
              onPress={() => handleNetworkChange(net)}
              activeOpacity={0.7}
            >
              <ItemIcon>{net.type === 'mainnet' ? '🌐' : '🧪'}</ItemIcon>
              <NetworkInfo>
                <NetworkName>{net.name}</NetworkName>
                <NetworkType>
                  {net.type === 'mainnet' ? 'Real Bitcoin' : 'Test coins only'}
                </NetworkType>
              </NetworkInfo>
              {network.type === net.type && <CheckIcon>✓</CheckIcon>}
            </NetworkOption>
          ))}
        </Section>

        <Section>
          <SectionTitle>About</SectionTitle>
          <SettingsItemFirst activeOpacity={0.7}>
            <ItemIcon>📱</ItemIcon>
            <ItemContent>
              <ItemTitle>Version</ItemTitle>
            </ItemContent>
            <ItemValue>2.0.0</ItemValue>
          </SettingsItemFirst>
          <SettingsItemLast activeOpacity={0.7}>
            <ItemIcon>🔗</ItemIcon>
            <ItemContent>
              <ItemTitle>Block Explorer</ItemTitle>
            </ItemContent>
            <ItemValue>{network.explorerUrl.replace('https://', '')}</ItemValue>
          </SettingsItemLast>
        </Section>

        <Section>
          <SectionTitle>Danger Zone</SectionTitle>
          <DangerItem onPress={handleResetWallet} activeOpacity={0.7}>
            <ItemIcon>🗑️</ItemIcon>
            <ItemContent>
              <DangerTitle>Delete Wallet</DangerTitle>
              <ItemSubtitle>Remove wallet from this device</ItemSubtitle>
            </ItemContent>
          </DangerItem>
        </Section>

        <VersionText>
          Bitcoin Wallet v2.0.0{'\n'}
          Built with ❤️ and ₿
        </VersionText>
      </Content>
    </Container>
  );
};
