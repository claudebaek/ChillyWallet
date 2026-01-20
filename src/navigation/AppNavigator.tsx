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
import { COLORS } from '../utils/constants';

export type RootStackParamList = {
  Home: undefined;
  Send: undefined;
  Receive: undefined;
  Settings: undefined;
  SeedPhrase: undefined;
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};
