import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StripeProvider } from '@stripe/stripe-react-native';
import { LogBox, NativeModules } from 'react-native';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AppNavigator from './AppNavigator';
import { PAYMENT_CONFIG } from './utils/PaymentAPIs';

// Silence only this warning in dev
if (__DEV__) {
  LogBox.ignoreLogs(['new NativeEventEmitter() was called with a non-null argument']);

  // Optional: apply no-op stubs to common emitters to stop the message at source
  const candidates = [
    'ExpoLocalAuthentication',
    'RNDeviceInfo',
    'RNReactNativeHapticFeedback',
    'ExpoNotifications',
  ];
  for (const name of candidates) {
    const mod = NativeModules[name];
    if (mod && !mod.addListener) mod.addListener = () => {};
    if (mod && !mod.removeListeners) mod.removeListeners = () => {};
  }
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StripeProvider 
        publishableKey={PAYMENT_CONFIG.stripe.publishableKey}
        merchantIdentifier="merchant.com.sendnreceive.app" // Replace with your merchant ID
      >
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
                <TransactionProvider>
                  <NotificationProvider>
                    <AppNavigator />
                  </NotificationProvider>
                </TransactionProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}