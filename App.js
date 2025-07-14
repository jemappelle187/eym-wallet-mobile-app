import 'react-native-gesture-handler';
import React from 'react';
import { UIManager, Platform, Alert } from 'react-native';
import { AuthProvider } from './contexts/AuthContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppNavigator from './AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Font from 'expo-font';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import ErrorBoundary from './components/ErrorBoundary';
import * as Device from 'expo-device';

// ---
// IMPORTANT: Download these Montserrat font files from Google Fonts and place them in assets/fonts:
// - Montserrat-Regular.ttf
// - Montserrat-Medium.ttf
// - Montserrat-SemiBold.ttf
// - Montserrat-Bold.ttf
// https://fonts.google.com/specimen/Montserrat
// ---

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const App = () => {
  const [fontsLoaded] = Font.useFonts({
    'Montserrat-Regular': require('./assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-Medium': require('./assets/fonts/Montserrat-Medium.ttf'),
    'Montserrat-SemiBold': require('./assets/fonts/Montserrat-SemiBold.ttf'),
    'Montserrat-Bold': require('./assets/fonts/Montserrat-Bold.ttf'),
  });

  React.useEffect(() => {
    // Root/jailbreak detection
    if (Device.osName === 'Android' && Device.isRootedExperimental) {
      Alert.alert(
        'Security Warning',
        'This device appears to be rooted. For your security, this app cannot be used on rooted devices.'
      );
    } else if (Device.osName === 'iOS') {
      // Expo does not provide jailbreak detection, but you can warn
      // (In a bare/ejected app, use a native module for iOS jailbreak detection)
    }
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <TransactionProvider>
              <NotificationProvider>
                <AppNavigator />
              </NotificationProvider>
            </TransactionProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
};

export default App; 