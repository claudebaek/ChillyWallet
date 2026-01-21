import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  HomeScreen,
  SendScreen,
  ReceiveScreen,
  SettingsScreen,
  SeedPhraseScreen,
} from '../screens';
import { SignerModeScreen } from '../screens/SignerModeScreen';
import { PhotoEntropyScreen } from '../screens/PhotoEntropyScreen';
import { QRScannerScreen, QRScannerMode } from '../screens/QRScannerScreen';
import { SignTransactionScreen } from '../screens/SignTransactionScreen';
import { SignedTxDisplayScreen } from '../screens/SignedTxDisplayScreen';
import { PSBTDisplayScreen } from '../screens/PSBTDisplayScreen';
import { COLORS } from '../utils/constants';

export type RootStackParamList = {
  Home: undefined;
  Send: undefined;
  Receive: undefined;
  Settings: undefined;
  SeedPhrase: undefined;
  // PSBT / Cold wallet screens
  PSBTDisplay: {
    psbtBase64: string;
    amount: number;
    fee: number;
    recipient: string;
  };
  // Signer mode screens
  SignerMode: undefined;
  PhotoEntropy: undefined;
  QRScanner: {
    mode: QRScannerMode;
    onScan?: (data: string) => void;
  };
  SignTransaction: {
    psbtData: string;
  };
  SignedTxDisplay: {
    signedTx: string;
    amount: number;
    fee: number;
    recipient: string | null;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  onLogout: () => void;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({ onLogout }) => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.cardBackground,
          },
          headerTintColor: COLORS.bitcoinOrange,
          headerTitleStyle: {
            fontWeight: '600',
            color: COLORS.primaryText,
          },
          contentStyle: {
            backgroundColor: COLORS.primaryBackground,
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Send"
          component={SendScreen}
          options={{ title: 'Send Bitcoin' }}
        />
        <Stack.Screen
          name="Receive"
          component={ReceiveScreen}
          options={{ title: 'Receive Bitcoin' }}
        />
        <Stack.Screen
          name="SeedPhrase"
          component={SeedPhraseScreen}
          options={{ title: 'Recovery Phrase' }}
        />
        <Stack.Screen
          name="Settings"
          options={{ title: 'Settings' }}
        >
          {(props) => <SettingsScreen {...props} onLogout={onLogout} />}
        </Stack.Screen>

        {/* PSBT / Cold Wallet Screens */}
        <Stack.Screen
          name="PSBTDisplay"
          component={PSBTDisplayScreen}
          options={{
            title: 'Unsigned Transaction',
            animation: 'slide_from_right',
          }}
        />

        {/* Signer Mode Screens */}
        <Stack.Screen
          name="SignerMode"
          component={SignerModeScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="PhotoEntropy"
          component={PhotoEntropyScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="QRScanner"
          component={QRScannerScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="SignTransaction"
          component={SignTransactionScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="SignedTxDisplay"
          component={SignedTxDisplayScreen}
          options={{
            headerShown: false,
            animation: 'fade',
            gestureEnabled: false, // Prevent accidental back swipe
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
