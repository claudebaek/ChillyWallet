import React, { useEffect, useCallback } from 'react';
import styled from 'styled-components/native';
import { ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useWalletStore } from '../stores';
import { COLORS } from '../utils/constants';
import {
  formatBTCCompact,
  formatUSD,
  formatAddress,
  formatRelativeTime,
  formatPercentage,
  formatSatoshis,
} from '../utils/format';
import { Transaction } from '../types';

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${COLORS.primaryBackground};
`;

const Header = styled.View`
  padding: 20px;
  background-color: ${COLORS.cardBackground};
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
`;

const HeaderTitle = styled.Text`
  font-size: 16px;
  color: ${COLORS.secondaryText};
  text-align: center;
`;

const BalanceContainer = styled.View`
  align-items: center;
  margin-top: 16px;
`;

const BTCBalance = styled.Text`
  font-size: 40px;
  font-weight: bold;
  color: ${COLORS.primaryText};
`;

const BTCLabel = styled.Text`
  font-size: 20px;
  color: ${COLORS.bitcoinOrange};
  margin-left: 8px;
`;

const USDBalance = styled.Text`
  font-size: 18px;
  color: ${COLORS.secondaryText};
  margin-top: 4px;
`;

const PriceRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
`;

const PriceText = styled.Text`
  font-size: 14px;
  color: ${COLORS.secondaryText};
`;

const PriceChange = styled.Text<{ positive: boolean }>`
  font-size: 14px;
  color: ${({ positive }) => (positive ? COLORS.success : COLORS.error)};
  margin-left: 8px;
`;

const AddressContainer = styled.TouchableOpacity`
  background-color: ${COLORS.secondaryBackground};
  padding: 8px 16px;
  border-radius: 20px;
  margin-top: 16px;
`;

const AddressText = styled.Text`
  font-size: 14px;
  color: ${COLORS.bitcoinOrange};
`;

const ActionRow = styled.View`
  flex-direction: row;
  justify-content: space-around;
  padding: 24px 16px;
`;

const ActionButton = styled.TouchableOpacity`
  align-items: center;
  padding: 16px 32px;
  background-color: ${COLORS.cardBackground};
  border-radius: 16px;
  min-width: 100px;
`;

const ActionIcon = styled.Text`
  font-size: 28px;
  margin-bottom: 8px;
`;

const ActionLabel = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: ${COLORS.primaryText};
`;

const SectionHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
`;

const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: ${COLORS.primaryText};
`;

const SeeAllText = styled.Text`
  font-size: 14px;
  color: ${COLORS.bitcoinOrange};
`;

const TransactionItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  background-color: ${COLORS.cardBackground};
  margin: 4px 16px;
  border-radius: 12px;
`;

const TxIconContainer = styled.View<{ type: 'sent' | 'received' }>`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${({ type }) =>
    type === 'received' ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 82, 82, 0.15)'};
  align-items: center;
  justify-content: center;
  margin-right: 12px;
`;

const TxIcon = styled.Text`
  font-size: 20px;
`;

const TxInfo = styled.View`
  flex: 1;
`;

const TxType = styled.Text`
  font-size: 16px;
  font-weight: 500;
  color: ${COLORS.primaryText};
`;

const TxAddress = styled.Text`
  font-size: 12px;
  color: ${COLORS.secondaryText};
  margin-top: 2px;
`;

const TxAmountContainer = styled.View`
  align-items: flex-end;
`;

const TxAmount = styled.Text<{ type: 'sent' | 'received' }>`
  font-size: 16px;
  font-weight: 600;
  color: ${({ type }) => (type === 'received' ? COLORS.received : COLORS.sent)};
`;

const TxTime = styled.Text`
  font-size: 12px;
  color: ${COLORS.secondaryText};
  margin-top: 2px;
`;

const EmptyState = styled.View`
  padding: 40px;
  align-items: center;
`;

const EmptyText = styled.Text`
  font-size: 16px;
  color: ${COLORS.secondaryText};
`;

const BalanceRow = styled.View`
  flex-direction: row;
  align-items: baseline;
  justify-content: center;
`;

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { wallet, network, transactions, btcPrice, priceChange24h, refreshBalance, refreshPrice } =
    useWalletStore();

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    refreshPrice();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshBalance(), refreshPrice()]);
    setRefreshing(false);
  }, [refreshBalance, refreshPrice]);

  const renderTransaction = (tx: Transaction) => {
    const address = tx.type === 'received' ? tx.fromAddress : tx.toAddress;
    const sign = tx.type === 'received' ? '+' : '-';

    return (
      <TransactionItem key={tx.txid} onPress={() => {}}>
        <TxIconContainer type={tx.type}>
          <TxIcon>{tx.type === 'received' ? '↓' : '↑'}</TxIcon>
        </TxIconContainer>
        <TxInfo>
          <TxType>{tx.type === 'received' ? 'Received' : 'Sent'}</TxType>
          <TxAddress>{address ? formatAddress(address, 6) : 'Unknown'}</TxAddress>
        </TxInfo>
        <TxAmountContainer>
          <TxAmount type={tx.type}>
            {sign}{formatBTCCompact(Math.abs(tx.amount))} BTC
          </TxAmount>
          <TxTime>{formatRelativeTime(tx.timestamp)}</TxTime>
        </TxAmountContainer>
      </TransactionItem>
    );
  };

  return (
    <Container>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.bitcoinOrange}
          />
        }
      >
        <Header>
          <HeaderTitle>{network.name}</HeaderTitle>
          <BalanceContainer>
            <BalanceRow>
              <BTCBalance>{wallet ? formatBTCCompact(wallet.balance) : '0'}</BTCBalance>
              <BTCLabel>BTC</BTCLabel>
            </BalanceRow>
            <USDBalance>
              {wallet ? formatUSD(wallet.balanceUSD) : '$0.00'}
            </USDBalance>
            <PriceRow>
              <PriceText>1 BTC = {formatUSD(btcPrice)}</PriceText>
              <PriceChange positive={priceChange24h >= 0}>
                {formatPercentage(priceChange24h)}
              </PriceChange>
            </PriceRow>
            <AddressContainer onPress={() => navigation.navigate('Receive')}>
              <AddressText>
                {wallet ? formatAddress(wallet.address, 10) : 'No wallet'}
              </AddressText>
            </AddressContainer>
          </BalanceContainer>
        </Header>

        <ActionRow>
          <ActionButton onPress={() => navigation.navigate('Send')}>
            <ActionIcon>↑</ActionIcon>
            <ActionLabel>Send</ActionLabel>
          </ActionButton>
          <ActionButton onPress={() => navigation.navigate('Receive')}>
            <ActionIcon>↓</ActionIcon>
            <ActionLabel>Receive</ActionLabel>
          </ActionButton>
          <ActionButton onPress={() => navigation.navigate('Settings')}>
            <ActionIcon>⚙️</ActionIcon>
            <ActionLabel>Settings</ActionLabel>
          </ActionButton>
        </ActionRow>

        <SectionHeader>
          <SectionTitle>Transactions</SectionTitle>
          {transactions.length > 0 && (
            <TouchableOpacity>
              <SeeAllText>See All</SeeAllText>
            </TouchableOpacity>
          )}
        </SectionHeader>

        {transactions.length > 0 ? (
          transactions.slice(0, 5).map(renderTransaction)
        ) : (
          <EmptyState>
            <EmptyText>No transactions yet</EmptyText>
          </EmptyState>
        )}
      </ScrollView>
    </Container>
  );
};
