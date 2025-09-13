import React, { useContext } from 'react';
import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import existing working components
import HomeScreen from './screens/HomeScreen';
import ProfileSettingsScreen from './screens/ProfileSettingsScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import DepositScreen from './screens/DepositScreen';
import WithdrawScreen from './screens/WithdrawScreen';
import TransactionHistoryScreen from './screens/TransactionHistoryScreen';
import InviteFriendsScreen from './screens/InviteFriendsScreen';
import AirtimeDataScreen from './screens/AirtimeDataScreen';
import SecurityCodeScreen from './screens/SecurityCodeScreen';
import BiometricSetupScreen from './screens/BiometricSetupScreen';
import BiometricTestScreen from './screens/BiometricTestScreen';
import LanguageSelectorScreen from './screens/LanguageSelectorScreen';
// Removed auto-conversion related screens
// import AutoHedgingDashboardScreen from './screens/AutoHedgingDashboardScreen';
// import AutoConvertTestScreen from './app/screens/AutoConvertTestScreen';
import ConnectedBankAccountsScreen from './screens/ConnectedBankAccountsScreen';
import MobileMoneyPaymentScreen from './screens/MobileMoneyPaymentScreen';
import MobileMoneyConfirmScreen from './screens/MobileMoneyConfirmScreen';
import BankTransferPaymentScreen from './screens/BankTransferPaymentScreen';
import BankTransferAmountScreen from './screens/BankTransferAmountScreen';
import BankTransferConfirmScreen from './screens/BankTransferConfirmScreen';
import ProgressBarDemoScreen from './screens/ProgressBarDemoScreen';
import TestAccountSetupScreen from './screens/TestAccountSetupScreen';
import RemittanceScreen from './screens/RemittanceScreen';
import PremiumTabBar from './components/PremiumTabBar';

// Import missing screens from backup
import PayInStoreScreen from './screens/PayInStoreScreen';
import QuickSendModal from './screens/QuickSendModal';
import TransactionSuccessScreen from './screens/TransactionSuccessScreen';

// Import Send Flow screens
import SelectRecipientScreen from './screens/SelectRecipientScreen';
import ChooseCurrencyScreen from './screens/ChooseCurrencyScreen';
import ReviewSendScreen from './screens/ReviewSendScreen';

// Import Auth screens
import WelcomeScreen from './screens/WelcomeScreen';
import PhoneVerificationScreen from './screens/PhoneVerificationScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';

// Import Auth components (if they exist)
import { AuthContext } from './contexts/AuthContext';
import PremiumLoadingScreen from './components/PremiumLoadingScreen';
import { ROUTES } from './navigation/routes';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AppRootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

// Splash Screen Component
const SplashScreen = () => <PremiumLoadingScreen />;

// Authentication Stack Navigator
const AuthStackNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
};

// Home Tab Stack Navigator (from backup)
const HomeTabStack = createNativeStackNavigator();
const HomeTabNavigator = () => {
  return (
    <HomeTabStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeTabStack.Screen name="HomeDashboard" component={HomeScreen} />
      <HomeTabStack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
      <HomeTabStack.Screen name="EditProfile" component={EditProfileScreen} />
      <HomeTabStack.Screen 
        name="Deposit" 
        component={DepositScreen}
        options={{ tabBarStyle: { display: 'none' } }}
      />
      <HomeTabStack.Screen 
        name="Withdraw" 
        component={WithdrawScreen}
        options={{ tabBarStyle: { display: 'none' } }}
      />
      <HomeTabStack.Screen 
        name="PayInStore" 
        component={PayInStoreScreen}
        options={{ tabBarStyle: { display: 'none' } }}
      />
      <HomeTabStack.Screen name="InviteFriends" component={InviteFriendsScreen} />
              <HomeTabStack.Screen name="AirtimeDataScreen" component={AirtimeDataScreen} />
        <HomeTabStack.Screen name="SecurityCode" component={SecurityCodeScreen} />
        <HomeTabStack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
        <HomeTabStack.Screen name="BiometricTest" component={BiometricTestScreen} />
        <HomeTabStack.Screen name="LanguageSelector" component={LanguageSelectorScreen} />
        {/** Removed: AutoHedgingDashboard screen */}
        <HomeTabStack.Screen name="ConnectedBankAccounts" component={ConnectedBankAccountsScreen} />
        <HomeTabStack.Screen name="TestAccountSetup" component={TestAccountSetupScreen} />
        <HomeTabStack.Screen name="Remittance" component={RemittanceScreen} />
        <HomeTabStack.Screen 
          name="MobileMoneyPayment" 
          component={MobileMoneyPaymentScreen}
          options={{ tabBarStyle: { display: 'none' } }}
        />
        <HomeTabStack.Screen 
          name="MobileMoneyConfirm" 
          component={MobileMoneyConfirmScreen}
          options={{ tabBarStyle: { display: 'none' } }}
        />
        <HomeTabStack.Screen 
          name={ROUTES.BANK_AMOUNT} 
          component={BankTransferAmountScreen}
          options={{ tabBarStyle: { display: 'none' } }}
        />
        <HomeTabStack.Screen 
          name={ROUTES.BANK_CONFIRM} 
          component={BankTransferConfirmScreen}
          options={{ tabBarStyle: { display: 'none' } }}
        />
        <HomeTabStack.Screen 
          name={ROUTES.BANK_PROCESSING} 
          component={BankTransferPaymentScreen}
          options={{ tabBarStyle: { display: 'none' } }}
        />
      {/* Modal screens accessible from Home */}
      <HomeTabStack.Screen 
        name="QuickSendModal" 
        component={QuickSendModal}
        options={{ presentation: 'modal' }}
      />
      <HomeTabStack.Screen 
        name="SendFlowModal" 
        component={SendFlowNavigator}
        options={{ presentation: 'modal' }}
      />
      <HomeTabStack.Screen 
        name="TransactionSuccess" 
        component={TransactionSuccessScreen}
        options={{ presentation: 'modal' }}
      />
    </HomeTabStack.Navigator>
  );
};

// Send Flow Navigator (from backup)
const SendFlowStack = createNativeStackNavigator();
const SendFlowNavigator = () => {
  return (
    <SendFlowStack.Navigator screenOptions={{ headerShown: false }}>
      <SendFlowStack.Screen name="SelectRecipient" component={SelectRecipientScreen} />
      <SendFlowStack.Screen name="ChooseCurrency" component={ChooseCurrencyScreen} />
      <SendFlowStack.Screen name="ReviewSend" component={ReviewSendScreen} />
    </SendFlowStack.Navigator>
  );
};

// Bottom Tab Navigator with PremiumTabBar (enhanced from current)
function TabNavigator() {
  // Function to determine if tabs should be visible for a route in HomeTabNavigator
  const getTabBarVisibility = (route) => {
    const routeName = getFocusedRouteNameFromRoute(route) ?? 'HomeDashboard';
    // List of screens in HomeTabNavigator where tabs should be hidden
    const screensWithoutTabs = ['ProfileSettings', 'Deposit', 'Withdraw', 'PayInStore', 'MobileMoneyPayment', 'MobileMoneyConfirm', ROUTES.BANK_AMOUNT, ROUTES.BANK_CONFIRM, ROUTES.BANK_PROCESSING];
    console.log('🔍 TabBar Visibility Check:', { routeName, shouldHide: screensWithoutTabs.includes(routeName) });
    if (screensWithoutTabs.includes(routeName)) {
      return 'none';
    }
    return 'flex';
  };

  return (
    <Tab.Navigator
      tabBar={props => <PremiumTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: route.name === "Home" ? { 
          display: getTabBarVisibility(route) 
        } : {
          display: 'flex'
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeTabNavigator}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Activity" 
        component={TransactionHistoryScreen}
        options={{
          tabBarLabel: 'Activity',
        }}
      />
      <Tab.Screen 
        name="ProfileSettings" 
        component={ProfileSettingsScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
      {/** Removed: Dev AutoConvertTestScreen tab */}
    </Tab.Navigator>
  );
}

// Root App Stack Navigator (from backup)
const RootAppStackNavigator = () => {
  return (
    <AppRootStack.Navigator screenOptions={{ headerShown: false }}>
      <AppRootStack.Screen name="AppTabs" component={TabNavigator} />
      <AppRootStack.Screen 
        name="ProgressBarDemo" 
        component={ProgressBarDemoScreen}
        options={{ presentation: 'modal' }}
      />
    </AppRootStack.Navigator>
  );
};

// Main App Navigator (hybrid approach)
export default function AppNavigator() {
  // Try to use AuthContext if available, otherwise use simplified version
  let isAuthenticated = false; // Changed to false to show auth screens by default
  let isLoading = false;

  try {
    const authContext = useContext(AuthContext);
    if (authContext) {
      isAuthenticated = authContext.isAuthenticated;
      isLoading = authContext.isLoading;
    }
  } catch (error) {
    console.log('AuthContext not available, using default values');
  }

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <RootAppStackNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
}
