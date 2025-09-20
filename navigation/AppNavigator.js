import React, { useContext } from 'react';
import { Platform, View, Text } from 'react-native'; // Added Platform, View, Text for placeholders
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Using Ionicons for all tab icons for consistency

import { AuthContext } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';

// Import Screens
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import HomeScreen from '../screens/HomeScreen'; // Current DashboardScreen will become HomeScreen
import SendMoneyScreen from '../screens/SendMoneyScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
// Import other screens that might be part of HomeStack like ProfileSettings
import ProfileSettingsScreen from '../screens/ProfileSettingsScreen';
import DepositScreen from '../screens/DepositScreen';
import WithdrawScreen from '../screens/WithdrawScreen';
import PayInStoreScreen from '../screens/PayInStoreScreen';
import ReceiveMoneyScreen from '../screens/ReceiveMoneyScreen';


// Placeholder for SplashScreen - will be created properly in the next step
const SplashScreen = () => <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor: Colors.primary}}><Text style={{color: Colors.cardBackground, fontSize: 24}}>Loading App...</Text></View>;

// Placeholder for AccountScreen
const AccountScreenPlaceholder = () => {
    const { user } = useContext(AuthContext); // Example usage of context
    return (
        <View style={{flex:1, justifyContent:'center', alignItems:'center', padding: 20}}>
            <Text style={{fontSize: 20, fontWeight: 'bold', marginBottom: 10}}>Account Screen</Text>
            {user && <Text>User: {user.fullName}</Text>}
            <Text>More account details and settings will be here.</Text>
        </View>
    );
};

const AuthStack = createNativeStackNavigator();
const HomeStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Authentication Stack
const AuthStackNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
};

// Home Stack (nested within Tabs)
// This stack will contain screens that are part of the "Home" flow
// but might not need the bottom tabs visible or are pushed from HomeScreen.
const HomeStackNavigator = () => {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="HomeDashboard" component={HomeScreen} />
      {/* Screens from original MainNavigator that are typically pushed from Dashboard/Home */}
      <HomeStackNav.Screen name="SendMoneyFromHome" component={SendMoneyScreen} />
      <HomeStackNav.Screen name="TransactionHistoryFromHome" component={TransactionHistoryScreen} />
      <HomeStackNav.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
      <HomeStackNav.Screen name="Deposit" component={DepositScreen} />
      <HomeStackNav.Screen name="Withdraw" component={WithdrawScreen} />
      <HomeStackNav.Screen name="PayInStore" component={PayInStoreScreen} />
      <HomeStackNav.Screen name="ReceiveMoney" component={ReceiveMoneyScreen} />
      {/* Add TransactionDetailScreen etc. here if needed */}
    </HomeStackNav.Navigator>
  );
};


// Main Bottom Tab Navigator
const AppTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.cardBackground,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: -5, // Adjust label position if needed
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          let size = focused ? 28 : 24;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Send') {
            iconName = focused ? 'paper-plane' : 'paper-plane-outline';
          } else if (route.name === 'Activity') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Account') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen
        name="Send"
        component={SendMoneyScreen} // Direct screen for Send tab
        // If SendMoneyScreen needs its own header when in a tab, options can be set here
        // options={{ headerShown: true, title: 'Send Money' }}
      />
      <Tab.Screen
        name="Activity"
        component={TransactionHistoryScreen} // Direct screen for Activity tab
      />
      <Tab.Screen name="Account" component={AccountScreenPlaceholder} />
    </Tab.Navigator>
  );
};

// Root Navigator - decides between Auth, App, or Splash
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppTabNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;
