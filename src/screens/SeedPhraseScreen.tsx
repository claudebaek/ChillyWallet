import React, { useState, useEffect } from 'react';
import styled from 'styled-components/native';
import { Alert, ScrollView, Share } from 'react-native';
import { keychainService } from '../services';
import { COLORS, STORAGE_KEYS } from '../utils/constants';

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${COLORS.primaryBackground};
`;

const Content = styled.ScrollView`
  flex: 1;
  padding: 20px;
`;

const WarningCard = styled.View`
  background-color: rgba(255, 82, 82, 0.15);
  border: 1px solid ${COLORS.error};
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 24px;
`;

const WarningIcon = styled.Text`
  font-size: 24px;
  margin-bottom: 8px;
`;

const WarningTitle = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: ${COLORS.error};
  margin-bottom: 8px;
`;

const WarningText = styled.Text`
  font-size: 14px;
  color: ${COLORS.secondaryText};
  line-height: 20px;
`;

const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: ${COLORS.primaryText};
  margin-bottom: 16px;
`;

const SeedContainer = styled.View`
  background-color: ${COLORS.cardBackground};
  border-radius: 16px;
  padding: 20px;
`;

const SeedGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
`;

const WordContainer = styled.View`
  width: 48%;
  flex-direction: row;
  align-items: center;
  background-color: ${COLORS.secondaryBackground};
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
`;

const WordNumber = styled.Text`
  font-size: 12px;
  color: ${COLORS.tertiaryText};
  width: 24px;
`;

const WordText = styled.Text`
  font-size: 16px;
  color: ${COLORS.primaryText};
  font-weight: 500;
`;

const HiddenOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${COLORS.cardBackground};
  border-radius: 16px;
  align-items: center;
  justify-content: center;
`;

const HiddenText = styled.Text`
  font-size: 16px;
  color: ${COLORS.secondaryText};
  margin-top: 8px;
`;

const HiddenIcon = styled.Text`
  font-size: 48px;
`;

const RevealButton = styled.TouchableOpacity`
  background-color: ${COLORS.bitcoinOrange};
  padding: 12px 24px;
  border-radius: 12px;
  margin-top: 16px;
`;

const RevealButtonText = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: ${COLORS.primaryBackground};
`;

const ActionRow = styled.View`
  flex-direction: row;
  justify-content: center;
  margin-top: 20px;
  gap: 12px;
`;

const ActionButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 12px 24px;
  background-color: ${COLORS.secondaryBackground};
  border-radius: 12px;
`;

const ActionButtonText = styled.Text`
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

const CopiedToast = styled.View`
  position: absolute;
  bottom: 100px;
  left: 50%;
  margin-left: -75px;
  background-color: ${COLORS.success};
  padding: 12px 24px;
  border-radius: 24px;
`;

const CopiedText = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #fff;
`;

interface SeedPhraseScreenProps {
  navigation: any;
}

export const SeedPhraseScreen: React.FC<SeedPhraseScreenProps> = ({ navigation }) => {
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCopied, setShowCopied] = useState(false);

  useEffect(() => {
    loadSeedPhrase();
  }, []);

  const loadSeedPhrase = async () => {
    try {
      const mnemonic = await keychainService.get(STORAGE_KEYS.MNEMONIC);
      if (mnemonic) {
        setSeedPhrase(mnemonic.split(' '));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load recovery phrase');
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = () => {
    Alert.alert(
      'Reveal Recovery Phrase',
      'Make sure no one is watching your screen. Your recovery phrase gives full access to your wallet.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reveal', onPress: () => setIsRevealed(true) },
      ]
    );
  };

  const handleCopy = () => {
    Alert.alert(
      'Share Recovery Phrase',
      'Are you sure? This will open the share dialog. Never share your phrase with anyone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share',
          onPress: async () => {
            try {
              await Share.share({
                message: seedPhrase.join(' '),
              });
            } catch (error) {
              console.error('Share error:', error);
            }
          },
        },
      ]
    );
  };

  const handleHide = () => {
    setIsRevealed(false);
  };

  if (loading) {
    return (
      <Container>
        <Content>
          <SectionTitle>Loading...</SectionTitle>
        </Content>
      </Container>
    );
  }

  return (
    <Container>
      <Content>
        <WarningCard>
          <WarningIcon>⚠️</WarningIcon>
          <WarningTitle>Keep your recovery phrase safe!</WarningTitle>
          <WarningText>
            Never share your recovery phrase with anyone.{'\n'}
            Anyone with this phrase can access and steal your funds.{'\n'}
            Write it down and store it in a secure location.
          </WarningText>
        </WarningCard>

        <SectionTitle>Recovery Phrase</SectionTitle>

        <SeedContainer>
          <SeedGrid>
            {seedPhrase.map((word, index) => (
              <WordContainer key={index}>
                <WordNumber>{index + 1}.</WordNumber>
                <WordText>{isRevealed ? word : '••••••'}</WordText>
              </WordContainer>
            ))}
          </SeedGrid>

          {!isRevealed && (
            <HiddenOverlay>
              <HiddenIcon>🔒</HiddenIcon>
              <HiddenText>Tap to reveal your recovery phrase</HiddenText>
              <RevealButton onPress={handleReveal}>
                <RevealButtonText>Reveal</RevealButtonText>
              </RevealButton>
            </HiddenOverlay>
          )}
        </SeedContainer>

        {isRevealed && (
          <ActionRow>
            <ActionButton onPress={handleCopy}>
              <ActionIcon>📋</ActionIcon>
              <ActionButtonText>Copy</ActionButtonText>
            </ActionButton>
            <ActionButton onPress={handleHide}>
              <ActionIcon>🔒</ActionIcon>
              <ActionButtonText>Hide</ActionButtonText>
            </ActionButton>
          </ActionRow>
        )}

        <InfoCard>
          <InfoTitle>Tips for storing your phrase</InfoTitle>
          <InfoText>
            • Write it down on paper and store in a safe place{'\n'}
            • Consider using a metal backup for fire/water protection{'\n'}
            • Never store it digitally (screenshots, notes, email){'\n'}
            • Never share it with anyone, even support staff
          </InfoText>
        </InfoCard>
      </Content>

      {showCopied && (
        <CopiedToast>
          <CopiedText>Copied to clipboard!</CopiedText>
        </CopiedToast>
      )}
    </Container>
  );
};
