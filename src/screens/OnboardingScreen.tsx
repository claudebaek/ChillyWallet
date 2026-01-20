import React, { useState } from 'react';
import styled from 'styled-components/native';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useWalletStore } from '../stores';
import { bitcoinService } from '../services';
import { COLORS } from '../utils/constants';

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${COLORS.primaryBackground};
`;

const Content = styled.View`
  flex: 1;
  padding: 20px;
  justify-content: center;
`;

const LogoContainer = styled.View`
  align-items: center;
  margin-bottom: 48px;
`;

const LogoIcon = styled.Text`
  font-size: 72px;
  margin-bottom: 16px;
`;

const AppTitle = styled.Text`
  font-size: 32px;
  font-weight: bold;
  color: ${COLORS.primaryText};
`;

const AppSubtitle = styled.Text`
  font-size: 16px;
  color: ${COLORS.secondaryText};
  margin-top: 8px;
`;

const ButtonContainer = styled.View`
  gap: 16px;
`;

const PrimaryButton = styled.TouchableOpacity`
  background-color: ${COLORS.bitcoinOrange};
  padding: 18px;
  border-radius: 16px;
  align-items: center;
`;

const PrimaryButtonText = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${COLORS.primaryBackground};
`;

const SecondaryButton = styled.TouchableOpacity`
  background-color: ${COLORS.cardBackground};
  padding: 18px;
  border-radius: 16px;
  align-items: center;
  border-width: 1px;
  border-color: ${COLORS.secondaryBackground};
`;

const SecondaryButtonText = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: ${COLORS.primaryText};
`;

const ImportContainer = styled.View`
  flex: 1;
  padding: 20px;
`;

const BackButton = styled.TouchableOpacity`
  padding: 8px;
  margin-bottom: 24px;
`;

const BackButtonText = styled.Text`
  font-size: 16px;
  color: ${COLORS.bitcoinOrange};
`;

const ImportTitle = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: ${COLORS.primaryText};
  margin-bottom: 8px;
`;

const ImportSubtitle = styled.Text`
  font-size: 14px;
  color: ${COLORS.secondaryText};
  margin-bottom: 24px;
  line-height: 20px;
`;

const SeedInputContainer = styled.View`
  background-color: ${COLORS.cardBackground};
  border-radius: 16px;
  padding: 16px;
  min-height: 150px;
`;

const SeedInput = styled.TextInput`
  font-size: 16px;
  color: ${COLORS.primaryText};
  line-height: 24px;
`;

const WordCount = styled.Text`
  font-size: 12px;
  color: ${COLORS.secondaryText};
  text-align: right;
  margin-top: 8px;
`;

const ImportButton = styled.TouchableOpacity<{ disabled: boolean }>`
  background-color: ${({ disabled }) =>
    disabled ? COLORS.secondaryBackground : COLORS.bitcoinOrange};
  padding: 18px;
  border-radius: 16px;
  align-items: center;
  margin-top: 24px;
`;

const ImportButtonText = styled.Text<{ disabled: boolean }>`
  font-size: 18px;
  font-weight: bold;
  color: ${({ disabled }) => (disabled ? COLORS.tertiaryText : COLORS.primaryBackground)};
`;

const ErrorText = styled.Text`
  font-size: 14px;
  color: ${COLORS.error};
  margin-top: 12px;
  text-align: center;
`;

const InfoText = styled.Text`
  font-size: 12px;
  color: ${COLORS.tertiaryText};
  text-align: center;
  margin-top: 24px;
  line-height: 18px;
`;

type Mode = 'welcome' | 'import';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { createWallet, importWallet } = useWalletStore();
  const [mode, setMode] = useState<Mode>('welcome');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const wordCount = seedPhrase.trim().split(/\s+/).filter(Boolean).length;
  const isValidWordCount = wordCount === 12 || wordCount === 24;

  const handleCreateWallet = async () => {
    setLoading(true);
    try {
      const mnemonic = await createWallet();
      // Navigate to seed phrase screen to show the mnemonic
      Alert.alert(
        'Wallet Created!',
        'Your wallet has been created. Please backup your recovery phrase on the next screen.',
        [
          {
            text: 'Continue',
            onPress: () => {
              onComplete();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!isValidWordCount) {
      setError('Please enter 12 or 24 words');
      return;
    }

    const normalizedPhrase = seedPhrase.trim().toLowerCase().replace(/\s+/g, ' ');

    if (!bitcoinService.validateMnemonic(normalizedPhrase)) {
      setError('Invalid recovery phrase. Please check the words and try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await importWallet(normalizedPhrase);
      Alert.alert('Success', 'Wallet imported successfully!', [
        {
          text: 'Continue',
          onPress: onComplete,
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to import wallet');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'import') {
    return (
      <Container>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <ImportContainer>
              <BackButton onPress={() => setMode('welcome')}>
                <BackButtonText>← Back</BackButtonText>
              </BackButton>

              <ImportTitle>Import Wallet</ImportTitle>
              <ImportSubtitle>
                Enter your 12 or 24-word recovery phrase to restore your wallet. 
                Separate each word with a space.
              </ImportSubtitle>

              <SeedInputContainer>
                <SeedInput
                  multiline
                  placeholder="Enter your recovery phrase..."
                  placeholderTextColor={COLORS.tertiaryText}
                  value={seedPhrase}
                  onChangeText={(text) => {
                    setSeedPhrase(text);
                    setError('');
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlignVertical="top"
                />
              </SeedInputContainer>
              <WordCount>{wordCount} words</WordCount>

              {error ? <ErrorText>{error}</ErrorText> : null}

              <ImportButton
                disabled={!isValidWordCount || loading}
                onPress={handleImport}
              >
                <ImportButtonText disabled={!isValidWordCount || loading}>
                  {loading ? 'Importing...' : 'Import Wallet'}
                </ImportButtonText>
              </ImportButton>

              <InfoText>
                Your recovery phrase will be stored securely on this device.
                {'\n'}Never share it with anyone.
              </InfoText>
            </ImportContainer>
          </ScrollView>
        </KeyboardAvoidingView>
      </Container>
    );
  }

  return (
    <Container>
      <Content>
        <LogoContainer>
          <LogoIcon>₿</LogoIcon>
          <AppTitle>Bitcoin Wallet</AppTitle>
          <AppSubtitle>Your keys, your coins</AppSubtitle>
        </LogoContainer>

        <ButtonContainer>
          <PrimaryButton onPress={handleCreateWallet} disabled={loading}>
            <PrimaryButtonText>
              {loading ? 'Creating...' : 'Create New Wallet'}
            </PrimaryButtonText>
          </PrimaryButton>

          <SecondaryButton onPress={() => setMode('import')}>
            <SecondaryButtonText>Import Existing Wallet</SecondaryButtonText>
          </SecondaryButton>
        </ButtonContainer>

        <InfoText>
          By creating or importing a wallet, you agree to{'\n'}
          take full responsibility for your funds.
        </InfoText>
      </Content>
    </Container>
  );
};
