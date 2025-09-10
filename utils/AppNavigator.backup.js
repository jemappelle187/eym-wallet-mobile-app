import React, { useContext } from 'react';
import { Platform, View, Text, Alert } from 'react-native'; // Added Platform, View, Text for placeholders
import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AuthContext } from './contexts/AuthContext'; // Assuming path
import { Colors } from './constants/Colors'; // Assuming path
import { Typography } from './constants/Typography'; // Assuming path
import PremiumTabBar from './components/PremiumTabBar';

// Import Screens
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import SendMoneyScreen from './screens/SendMoneyScreen'; // Old one, might be replaced
import TransactionHistoryScreen from './screens/TransactionHistoryScreen';
import ProfileSettingsScreen from './screens/ProfileSettingsScreen';
import DepositScreen from './screens/DepositScreen';
import WithdrawScreen from './screens/WithdrawScreen';
import PayInStoreScreen from './screens/PayInStoreScreen';
// import ReceiveMoneyScreen from './screens/ReceiveMoneyScreen'; // Not used in new design

// New Send Flow Screens
import SelectRecipientScreen from './screens/SelectRecipientScreen';
import ChooseCurrencyScreen from './screens/ChooseCurrencyScreen';
import ReviewSendScreen from './screens/ReviewSendScreen';
import QuickSendModal from './screens/QuickSendModal';
import TransactionSuccessScreen from './screens/TransactionSuccessScreen';
import InviteFriendsScreen from './screens/InviteFriendsScreen'; // Import InviteFriendsScreen
import EditProfileScreen from './screens/EditProfileScreen';


// Premium Loading Screen
import PremiumLoadingScreen from './components/PremiumLoadingScreen';

const SplashScreen = () => <PremiumLoadingScreen />;

// Placeholder for AccountScreen (to be designed later)
// const AccountScreenPlaceholder = () => {
//     const { user } = useContext(AuthContext);
//     return (
//         <SafeAreaView style={{flex:1, backgroundColor: Colors.background}} edges={['top']}>
//             <View style={{flex:1, justifyContent:'center', alignItems:'center', padding: 20}}>
//                 <Text style={Typography.h1}>Account</Text>
//                 {user && <Text style={Typography.bodyLarge}>User: {user.fullName}</Text>}
//                 <Text style={Typography.bodyRegular}>More account details and settings will be here.</Text>
//             </View>
//         </SafeAreaView>
//     );
// };
import AccountScreen from './screens/AccountScreen'; // Import the new AccountScreen

const AuthStack = createNativeStackNavigator();
const AppRootStack = createNativeStackNavigator(); // For modal presentation over tabs
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

// This is the stack that will be part of the "Home" tab.
const HomeTabStack = createNativeStackNavigator();
const HomeTabNavigator = () => {
  return (
    <HomeTabStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeTabStack.Screen name="HomeDashboard" component={HomeScreen} />
      {/* Screens pushed from HomeDashboard that are part of its flow but might not need tabs */}
      <HomeTabStack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
      <HomeTabStack.Screen name="EditProfile" component={EditProfileScreen} />
      <HomeTabStack.Screen name="Deposit" component={DepositScreen} />
      <HomeTabStack.Screen name="Withdraw" component={WithdrawScreen} />
      <HomeTabStack.Screen name="PayInStore" component={PayInStoreScreen} />
      <HomeTabStack.Screen name="InviteFriends" component={InviteFriendsScreen} />
      {/* TransactionHistoryFromHome will be the main Activity Tab screen */}
    </HomeTabStack.Navigator>
  )
}


// Main Bottom Tab Navigator
const AppTabNavigator = () => {
  // Function to determine if tabs should be visible for a route in HomeTabNavigator
  const getTabBarVisibility = (route) => {
    const routeName = getFocusedRouteNameFromRoute(route) ?? 'HomeDashboard';
    // List of screens in HomeTabNavigator where tabs should be hidden
    const screensWithoutTabs = ['ProfileSettings', 'Deposit', 'Withdraw'];
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
        display: route.name === "Home" ? getTabBarVisibility(route) : 'flex',
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeTabNavigator}
        // Options to hide tab bar can be set here too if getTabBarVisibility is complex for other tabs
      />
      <Tab.Screen name="Activity" component={TransactionHistoryScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
};

// This stack includes the TabNavigator and any modal screens (like the Send Flow)
const RootAppStackNavigator = () => {
  return (
    <AppRootStack.Navigator screenOptions={{ headerShown: false }}>
      <AppRootStack.Screen name="AppTabs" component={AppTabNavigator} />
      {/* Modal stack for the Send Flow */}
      <AppRootStack.Group screenOptions={{ presentation: 'modal' }}>
        <AppRootStack.Screen name="SendFlowModal" component={SendFlowNavigator} />
        <AppRootStack.Screen name="QuickSendModal" component={QuickSendModal} />
        <AppRootStack.Screen name="TransactionSuccess" component={TransactionSuccessScreen} />
      </AppRootStack.Group>
       {/* Other full-screen modals can be added here */}
    </AppRootStack.Navigator>
  );
}

// Dedicated Stack for the Send Flow (to be presented modally)
const SendFlowStack = createNativeStackNavigator();
const SendFlowNavigator = () => {
  return (
    <SendFlowStack.Navigator screenOptions={{ headerShown: false }}>
      <SendFlowStack.Screen name="SelectRecipient" component={SelectRecipientScreen} />
      <SendFlowStack.Screen name="ChooseCurrency" component={ChooseCurrencyScreen} />
      <SendFlowStack.Screen name="ReviewSend" component={ReviewSendScreen} />
    </SendFlowStack.Navigator>
  )
}


// Root Navigator - decides between Auth, App, or Splash
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <RootAppStackNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;
