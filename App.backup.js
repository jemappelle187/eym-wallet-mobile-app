import 'react-native-gesture-handler';
import React from 'react';
import { UIManager, Platform, Alert, AppState, TouchableWithoutFeedback, View } from 'react-native';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppNavigator from './AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Font from 'expo-font';
import { useState, useContext, useRef } from 'react';
import { ActivityIndicator } from 'react-native';
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

const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const WARNING_BEFORE_LOGOUT_MS = 30 * 1000; // 30 seconds

function SessionTimeoutWrapper({ children }) {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const timerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const [warningShown, setWarningShown] = React.useState(false);

  // Reset timers on user activity
  const resetTimer = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    setWarningShown(false);
    if (isAuthenticated) {
      warningTimerRef.current = setTimeout(() => {
        setWarningShown(true);
        Alert.alert(
          'Session Expiring Soon',
          'You will be logged out in 30 seconds due to inactivity.',
        );
      }, SESSION_TIMEOUT_MS - WARNING_BEFORE_LOGOUT_MS);
      timerRef.current = setTimeout(() => {
        logout && logout();
      }, SESSION_TIMEOUT_MS);
    }
  }, [isAuthenticated, logout]);

  // Listen for app state changes (background/foreground)
  React.useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        resetTimer();
      }
      appState.current = nextAppState;
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [resetTimer]);

  // Start/reset timer on auth change
  React.useEffect(() => {
    if (isAuthenticated) {
      resetTimer();
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      setWarningShown(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Reset timer on any touch
  return (
    <TouchableWithoutFeedback onPress={resetTimer} onLongPress={resetTimer}>
      <View style={{ flex: 1 }}>{children}</View>
    </TouchableWithoutFeedback>
  );
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
            <SessionTimeoutWrapper>
              <TransactionProvider>
                <NotificationProvider>
                  <AppNavigator />
                </NotificationProvider>
              </TransactionProvider>
            </SessionTimeoutWrapper>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
};

export default App; 