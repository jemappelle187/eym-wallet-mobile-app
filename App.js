import 'react-native-gesture-handler';
import React from 'react'; // Removed useState, useEffect from here as they are in context now
import { UIManager, Platform, LayoutAnimation } from 'react-native';
import { AuthProvider } from './contexts/AuthContext'; // Import AuthProvider
import { TransactionProvider } from './contexts/TransactionContext'; // Import TransactionProvider
import AppNavigator from './navigation/AppNavigator'; // Will be created in next step

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}
// Configure LayoutAnimation for transitions (can be done in context handlers too)
// LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

const App = () => {
  return (
    <AuthProvider>
      <TransactionProvider>
        {/* AppNavigator will consume AuthContext to decide what to render */}
        <AppNavigator />
      </TransactionProvider>
    </AuthProvider>
  );
};

export default App;
