/**
 * Photo Entropy Screen
 * Captures a photo to generate cryptographic entropy for mnemonic creation
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import styled from 'styled-components/native';
import { Alert, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  PhotoFile,
} from 'react-native-vision-camera';
import { COLORS } from '../utils/constants';
import {
  generateMnemonicFromPhoto,
  validateImageEntropy,
  calculateImageEntropyBits,
} from '../utils/photoEntropy';
import { useWalletStore } from '../stores';
import { keychainService } from '../services';
import { STORAGE_KEYS } from '../utils/constants';

const SIGNER_COLORS = {
  primary: '#00BFA5',
  background: '#0a1a1a',
  card: '#0f2f2f',
};

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #000;
`;

const Header = styled.View`
  position: absolute;
  top: 50px;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 0 20px;
`;

const BackButton = styled.TouchableOpacity`
  padding: 8px 16px;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 20px;
  align-self: flex-start;
`;

const BackButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: 600;
`;

const InstructionContainer = styled.View`
  position: absolute;
  top: 120px;
  left: 20px;
  right: 20px;
  z-index: 10;
`;

const InstructionCard = styled.View`
  background-color: rgba(0, 0, 0, 0.8);
  padding: 20px;
  border-radius: 16px;
`;

const InstructionTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: ${SIGNER_COLORS.primary};
  text-align: center;
  margin-bottom: 12px;
`;

const InstructionText = styled.Text`
  font-size: 14px;
  color: white;
  text-align: center;
  line-height: 20px;
`;

const CaptureContainer = styled.View`
  position: absolute;
  bottom: 60px;
  left: 0;
  right: 0;
  align-items: center;
`;

const CaptureButton = styled.TouchableOpacity<{ disabled: boolean }>`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background-color: ${({ disabled }) =>
    disabled ? COLORS.secondaryBackground : SIGNER_COLORS.primary};
  align-items: center;
  justify-content: center;
  border-width: 4px;
  border-color: white;
`;

const CaptureButtonInner = styled.View`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: white;
`;

const CaptureHint = styled.Text`
  color: white;
  font-size: 14px;
  margin-top: 16px;
  text-align: center;
`;

const ProcessingOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  justify-content: center;
  align-items: center;
  z-index: 100;
`;

const ProcessingCard = styled.View`
  background-color: ${SIGNER_COLORS.card};
  padding: 40px;
  border-radius: 20px;
  align-items: center;
  margin: 20px;
`;

const ProcessingTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: ${SIGNER_COLORS.primary};
  margin-top: 20px;
  text-align: center;
`;

const ProcessingText = styled.Text`
  font-size: 14px;
  color: ${COLORS.secondaryText};
  margin-top: 12px;
  text-align: center;
`;

const MnemonicContainer = styled.View`
  flex: 1;
  background-color: ${SIGNER_COLORS.background};
  padding: 20px;
`;

const MnemonicHeader = styled.View`
  padding-top: 40px;
  margin-bottom: 20px;
`;

const MnemonicTitle = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: ${SIGNER_COLORS.primary};
  text-align: center;
`;

const MnemonicSubtitle = styled.Text`
  font-size: 14px;
  color: ${COLORS.secondaryText};
  text-align: center;
  margin-top: 8px;
`;

const WarningBox = styled.View`
  background-color: #ff6b6b20;
  border-width: 1px;
  border-color: #ff6b6b;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
`;

const WarningText = styled.Text`
  color: #ff6b6b;
  font-size: 14px;
  text-align: center;
`;

const WordsGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const WordItem = styled.View`
  width: 48%;
  background-color: ${SIGNER_COLORS.card};
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  flex-direction: row;
  align-items: center;
`;

const WordNumber = styled.Text`
  font-size: 12px;
  color: ${COLORS.secondaryText};
  width: 24px;
`;

const WordText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: ${COLORS.primaryText};
`;

const ConfirmButton = styled.TouchableOpacity`
  background-color: ${SIGNER_COLORS.primary};
  padding: 18px;
  border-radius: 16px;
  align-items: center;
  margin-top: auto;
`;

const ConfirmButtonText = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${SIGNER_COLORS.background};
`;

const PermissionContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px;
  background-color: ${SIGNER_COLORS.background};
`;

const PermissionText = styled.Text`
  color: ${COLORS.primaryText};
  font-size: 18px;
  text-align: center;
  margin-bottom: 20px;
`;

interface PhotoEntropyScreenProps {
  navigation: any;
}

type ScreenState = 'camera' | 'processing' | 'mnemonic';

export const PhotoEntropyScreen: React.FC<PhotoEntropyScreenProps> = ({
  navigation,
}) => {
  const [state, setState] = useState<ScreenState>('camera');
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  const cameraRef = useRef<Camera>(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const { importWallet } = useWalletStore();

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);

    try {
      // Capture photo
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'quality',
      });

      setState('processing');

      // Read photo as base64
      const response = await fetch(`file://${photo.path}`);
      const blob = await response.blob();

      // Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1] || result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Validate entropy
      if (!validateImageEntropy(base64)) {
        Alert.alert(
          'Insufficient Entropy',
          'The photo does not have enough detail for secure key generation. Please take a photo of something more complex (e.g., a textured surface, random objects).',
          [
            {
              text: 'Try Again',
              onPress: () => {
                setState('camera');
                setIsCapturing(false);
              },
            },
          ]
        );
        return;
      }

      // Generate mnemonic
      const generatedMnemonic = await generateMnemonicFromPhoto(base64);
      const words = generatedMnemonic.split(' ');

      setMnemonic(words);
      setState('mnemonic');
    } catch (error) {
      console.error('Failed to capture photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
      setState('camera');
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  const handleConfirmMnemonic = useCallback(async () => {
    try {
      const mnemonicString = mnemonic.join(' ');

      // Save mnemonic and create wallet
      await importWallet(mnemonicString);

      Alert.alert(
        'Wallet Created',
        'Your cold wallet has been created successfully. Make sure to backup your recovery phrase in a secure location.',
        [
          {
            text: 'Done',
            onPress: () => navigation.navigate('SignerMode'),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to create wallet:', error);
      Alert.alert('Error', 'Failed to create wallet. Please try again.');
    }
  }, [mnemonic, importWallet, navigation]);

  if (!hasPermission) {
    return (
      <Container>
        <PermissionContainer>
          <PermissionText>
            Camera permission is required to generate entropy from photos
          </PermissionText>
        </PermissionContainer>
      </Container>
    );
  }

  if (!device) {
    return (
      <Container>
        <PermissionContainer>
          <PermissionText>No camera device found</PermissionText>
        </PermissionContainer>
      </Container>
    );
  }

  if (state === 'mnemonic') {
    return (
      <Container>
        <MnemonicContainer>
          <MnemonicHeader>
            <MnemonicTitle>Recovery Phrase</MnemonicTitle>
            <MnemonicSubtitle>
              Write down these 12 words in order
            </MnemonicSubtitle>
          </MnemonicHeader>

          <WarningBox>
            <WarningText>
              Never share these words. Anyone with this phrase can access your
              Bitcoin. Store it securely offline.
            </WarningText>
          </WarningBox>

          <WordsGrid>
            {mnemonic.map((word, index) => (
              <WordItem key={index}>
                <WordNumber>{index + 1}.</WordNumber>
                <WordText>{word}</WordText>
              </WordItem>
            ))}
          </WordsGrid>

          <ConfirmButton onPress={handleConfirmMnemonic}>
            <ConfirmButtonText>I Have Saved My Phrase</ConfirmButtonText>
          </ConfirmButton>
        </MnemonicContainer>
      </Container>
    );
  }

  return (
    <Container>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={state === 'camera'}
        photo={true}
      />

      <Header>
        <BackButton onPress={() => navigation.goBack()}>
          <BackButtonText>Cancel</BackButtonText>
        </BackButton>
      </Header>

      <InstructionContainer>
        <InstructionCard>
          <InstructionTitle>Generate Secure Keys</InstructionTitle>
          <InstructionText>
            Take a photo of something random - a textured surface, scattered
            objects, or anything with visual complexity. The image pixels will
            be used to generate your wallet&apos;s cryptographic keys.
          </InstructionText>
        </InstructionCard>
      </InstructionContainer>

      <CaptureContainer>
        <CaptureButton disabled={isCapturing} onPress={handleCapture}>
          {isCapturing ? (
            <ActivityIndicator color="white" size="large" />
          ) : (
            <CaptureButtonInner />
          )}
        </CaptureButton>
        <CaptureHint>
          {isCapturing ? 'Processing...' : 'Tap to capture'}
        </CaptureHint>
      </CaptureContainer>

      {state === 'processing' && (
        <ProcessingOverlay>
          <ProcessingCard>
            <ActivityIndicator color={SIGNER_COLORS.primary} size="large" />
            <ProcessingTitle>Generating Keys</ProcessingTitle>
            <ProcessingText>
              Extracting entropy from photo and generating your secure recovery
              phrase...
            </ProcessingText>
          </ProcessingCard>
        </ProcessingOverlay>
      )}
    </Container>
  );
};
