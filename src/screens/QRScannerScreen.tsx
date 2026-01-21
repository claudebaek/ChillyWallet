/**
 * QR Scanner Screen
 * Scans QR codes for addresses or unsigned transactions (PSBT)
 */

import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components/native';
import { Alert, StyleSheet, Dimensions, Linking } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import { COLORS } from '../utils/constants';

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #000;
`;

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  position: absolute;
  top: 50px;
  left: 0;
  right: 0;
  z-index: 10;
`;

const BackButton = styled.TouchableOpacity`
  padding: 8px 16px;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 20px;
`;

const BackButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: 600;
`;

const Title = styled.Text`
  flex: 1;
  color: white;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  margin-right: 60px;
`;

const OverlayContainer = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  justify-content: center;
  align-items: center;
`;

const ScanFrame = styled.View`
  width: 280px;
  height: 280px;
  border-width: 2px;
  border-color: ${COLORS.bitcoinOrange};
  border-radius: 20px;
  background-color: transparent;
`;

const Corner = styled.View<{ position: string }>`
  position: absolute;
  width: 30px;
  height: 30px;
  border-color: ${COLORS.bitcoinOrange};
  border-width: 4px;
  ${({ position }) => {
    switch (position) {
      case 'topLeft':
        return 'top: -2px; left: -2px; border-right-width: 0; border-bottom-width: 0; border-top-left-radius: 20px;';
      case 'topRight':
        return 'top: -2px; right: -2px; border-left-width: 0; border-bottom-width: 0; border-top-right-radius: 20px;';
      case 'bottomLeft':
        return 'bottom: -2px; left: -2px; border-right-width: 0; border-top-width: 0; border-bottom-left-radius: 20px;';
      case 'bottomRight':
        return 'bottom: -2px; right: -2px; border-left-width: 0; border-top-width: 0; border-bottom-right-radius: 20px;';
      default:
        return '';
    }
  }}
`;

const Instructions = styled.Text`
  color: white;
  font-size: 16px;
  text-align: center;
  margin-top: 40px;
  padding: 0 40px;
`;

const ModeIndicator = styled.View`
  position: absolute;
  bottom: 120px;
  left: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 16px;
  border-radius: 12px;
`;

const ModeText = styled.Text`
  color: ${COLORS.bitcoinOrange};
  font-size: 14px;
  font-weight: 600;
  text-align: center;
`;

const PermissionContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px;
  background-color: ${COLORS.primaryBackground};
`;

const PermissionText = styled.Text`
  color: ${COLORS.primaryText};
  font-size: 18px;
  text-align: center;
  margin-bottom: 20px;
`;

const PermissionButton = styled.TouchableOpacity`
  background-color: ${COLORS.bitcoinOrange};
  padding: 16px 32px;
  border-radius: 12px;
`;

const PermissionButtonText = styled.Text`
  color: ${COLORS.primaryBackground};
  font-size: 16px;
  font-weight: bold;
`;

const ManualInputContainer = styled.View`
  position: absolute;
  bottom: 40px;
  left: 20px;
  right: 20px;
`;

const ManualInputButton = styled.TouchableOpacity`
  background-color: ${COLORS.cardBackground};
  padding: 16px;
  border-radius: 12px;
  align-items: center;
`;

const ManualInputText = styled.Text`
  color: ${COLORS.secondaryText};
  font-size: 14px;
`;

export type QRScannerMode = 'address' | 'transaction';

interface QRScannerScreenProps {
  navigation: any;
  route: {
    params: {
      mode: QRScannerMode;
      onScan?: (data: string) => void;
    };
  };
}

export const QRScannerScreen: React.FC<QRScannerScreenProps> = ({
  navigation,
  route,
}) => {
  const { mode, onScan } = route.params;
  const [isScanning, setIsScanning] = useState(true);
  const [scannedData, setScannedData] = useState<string | null>(null);

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (!isScanning || codes.length === 0) return;

      const code = codes[0];
      if (code.value) {
        setIsScanning(false);
        handleScannedCode(code.value);
      }
    },
  });

  const handleScannedCode = useCallback(
    (data: string) => {
      setScannedData(data);

      if (mode === 'address') {
        // Parse Bitcoin address from URI or raw address
        const address = parseBitcoinAddress(data);
        if (address) {
          if (onScan) {
            onScan(address);
          }
          navigation.goBack();
        } else {
          Alert.alert('Invalid QR Code', 'This QR code does not contain a valid Bitcoin address.', [
            {
              text: 'Scan Again',
              onPress: () => setIsScanning(true),
            },
          ]);
        }
      } else if (mode === 'transaction') {
        // Navigate to sign transaction screen with PSBT data
        navigation.replace('SignTransaction', { psbtData: data });
      }
    },
    [mode, navigation, onScan]
  );

  const parseBitcoinAddress = (data: string): string | null => {
    // Handle bitcoin: URI scheme
    if (data.toLowerCase().startsWith('bitcoin:')) {
      const address = data.replace(/^bitcoin:/i, '').split('?')[0];
      return address;
    }

    // Check if it's a valid Bitcoin address format
    if (
      data.startsWith('bc1') ||
      data.startsWith('tb1') ||
      data.startsWith('1') ||
      data.startsWith('3') ||
      data.startsWith('m') ||
      data.startsWith('n') ||
      data.startsWith('2')
    ) {
      return data;
    }

    return null;
  };

  const handleManualInput = () => {
    Alert.prompt(
      mode === 'address' ? 'Enter Address' : 'Enter Transaction Data',
      mode === 'address'
        ? 'Paste a Bitcoin address'
        : 'Paste the transaction hex or PSBT data',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: (text) => {
            if (text) {
              handleScannedCode(text);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  // Request permission on mount
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  if (!hasPermission) {
    return (
      <PermissionContainer>
        <PermissionText>
          Camera permission is required to scan QR codes
        </PermissionText>
        <PermissionButton onPress={handleOpenSettings}>
          <PermissionButtonText>Open Settings</PermissionButtonText>
        </PermissionButton>
      </PermissionContainer>
    );
  }

  if (!device) {
    return (
      <PermissionContainer>
        <PermissionText>No camera device found</PermissionText>
      </PermissionContainer>
    );
  }

  return (
    <Container>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isScanning}
        codeScanner={codeScanner}
      />

      <Header>
        <BackButton onPress={() => navigation.goBack()}>
          <BackButtonText>Cancel</BackButtonText>
        </BackButton>
        <Title>
          {mode === 'address' ? 'Scan Address' : 'Scan Transaction'}
        </Title>
      </Header>

      <OverlayContainer>
        <ScanFrame>
          <Corner position="topLeft" />
          <Corner position="topRight" />
          <Corner position="bottomLeft" />
          <Corner position="bottomRight" />
        </ScanFrame>
        <Instructions>
          {mode === 'address'
            ? 'Position the QR code within the frame to scan a Bitcoin address'
            : 'Scan the unsigned transaction QR code from your online device'}
        </Instructions>
      </OverlayContainer>

      <ModeIndicator>
        <ModeText>
          {mode === 'address' ? 'Scanning for Bitcoin Address' : 'Scanning for Transaction (PSBT)'}
        </ModeText>
      </ModeIndicator>

      <ManualInputContainer>
        <ManualInputButton onPress={handleManualInput}>
          <ManualInputText>
            Or enter {mode === 'address' ? 'address' : 'transaction'} manually
          </ManualInputText>
        </ManualInputButton>
      </ManualInputContainer>
    </Container>
  );
};
