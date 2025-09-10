import React, { useContext, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Linking, Switch, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CommonActions } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { AuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import StandardizedContainer from '../components/StandardizedContainer';

const ProfileSettingsScreen = ({ navigation }) => {
  const { user, logout, isLoading: authIsLoading, biometricEnabled, toggleBiometric, enableBiometric } = useContext(AuthContext);
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const { t, getCurrentLanguageInfo } = useLanguage();

  // Direct biometric setup function
  const handleBiometricSetup = async () => {
    try {
      // Check if biometric hardware is available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware) {
        Alert.alert('Not Available', 'Biometric authentication is not available on this device.');
        return;
      }
      
      if (!isEnrolled) {
        Alert.alert('Not Enrolled', 'Please set up Face ID or Touch ID in your device settings first.');
        return;
      }

      // Get supported authentication types
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      let biometricType = 'Biometric';
      
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'Face ID';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = 'Touch ID';
      }

      // Prompt for biometric authentication to enable
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Enable ${biometricType}`,
        subMessage: `Use your ${biometricType} to enable biometric login`,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Enable biometric in the context
        await enableBiometric();
        Alert.alert(
          `${biometricType} Enabled`,
          `${biometricType} has been successfully enabled for your wallet.`,
          [{ text: 'OK' }]
        );
      } else {
        if (result.error !== 'UserCancel') {
          Alert.alert('Authentication Failed', 'Unable to enable biometric authentication.');
        }
      }
    } catch (error) {
      console.log('Biometric setup error:', error);
      Alert.alert('Error', 'Unable to set up biometric authentication. Please try again.');
    }
  };
  
  // Animation states for collapsible sections
  const [expandedSections, setExpandedSections] = useState([true, true, true, true, true]);
  const animatedHeights = useRef(Array(5).fill(0).map(() => new Animated.Value(1))).current;

  // Organized menu sections matching AccountScreen structure
  const accountSecurityOptions = [
    { id: 'edit_profile', title: t('editProfile'), icon: 'person-outline', action: () => navigation.navigate('EditProfile') },
    { id: 'change_password', title: 'Change Password', icon: 'lock-closed-outline', action: () => Alert.alert('Security', 'Change Password screen coming soon!') },
    { id: 'two_factor', title: t('twoFactorAuth'), icon: 'shield-checkmark-outline', action: () => Alert.alert('Security', '2FA settings coming soon!') },
    { id: 'linked_accounts', title: 'Linked Accounts', icon: 'link-outline', action: () => Alert.alert('Linked Accounts', 'Manage linked accounts coming soon!') },
  ];

  const paymentCardsOptions = [
          { id: 'connected_banks', title: 'Connected Bank Accounts', icon: 'business-outline', action: () => navigation.navigate('ConnectedBankAccounts') },
      { id: 'test_accounts', title: 'Test Account Setup', icon: 'settings-outline', action: () => navigation.navigate('TestAccountSetup') },
    { id: 'payment_methods', title: 'Payment Methods', icon: 'card-outline', action: () => Alert.alert('Payments', 'Manage payment methods screen coming soon!') },
    { id: 'virtual_cards', title: t('virtualCards'), icon: 'wallet-outline', action: () => Alert.alert('Virtual Cards', 'Virtual cards feature coming soon!') },
    { id: 'transaction_limits', title: t('transactionLimits'), icon: 'swap-horizontal-outline', action: () => Alert.alert('Limits', 'Transaction limits screen coming soon!') },
  ];

  const preferencesOptions = [
    { id: 'notifications', title: t('notifications'), icon: 'notifications-outline', action: () => Alert.alert('Notifications', 'Notification settings coming soon!') },
    { id: 'language', title: t('language'), icon: 'language-outline', action: () => navigation.navigate('LanguageSelector') },
    { id: 'dark_mode', title: t('darkMode'), icon: 'moon-outline', type: 'toggle', value: isDarkMode, action: toggleTheme },
    { id: 'biometric', title: t('faceIdBiometric'), icon: 'finger-print-outline', type: 'toggle', value: biometricEnabled, action: () => {
      if (!biometricEnabled) {
        // Use direct biometric setup function
        handleBiometricSetup();
      } else {
        // Disable biometric
        toggleBiometric(false);
      }
    }},
    { id: 'biometric_test', title: t('testBiometric'), icon: 'shield-checkmark-outline', action: () => navigation.navigate('BiometricTest') },
  ];

  const servicesUtilitiesOptions = [
    { id: 'airtime_data', title: t('buyAirtimeData'), icon: 'phone-portrait-outline', action: () => navigation.navigate('AirtimeDataScreen') },
    { id: 'bill_payments', title: t('billPayments'), icon: 'receipt-outline', action: () => Alert.alert('Bill Payments', 'Bill payments feature coming soon!') },
    { id: 'gift_cards', title: t('giftCards'), icon: 'gift-outline', action: () => Alert.alert('Gift Cards', 'Gift cards feature coming soon!') },
    { id: 'crypto_services', title: t('cryptoServices'), icon: 'logo-bitcoin', action: () => Alert.alert('Crypto Services', 'Crypto services coming soon!') },
    { id: 'progress_demo', title: 'Progress Bar Demo', icon: 'bar-chart-outline', action: () => {
      // Navigate to root stack screen
      navigation.getParent()?.getParent()?.navigate('ProgressBarDemo');
    }},
  ];

  const supportLegalOptions = [
    { id: 'help', title: t('helpSupport'), icon: 'help-circle-outline', action: () => Alert.alert('Support', 'Help center coming soon!') },
    { id: 'contact', title: t('contactUs'), icon: 'chatbubble-ellipses-outline', action: () => Alert.alert('Contact', 'Contact Us screen coming soon!') },
    { id: 'invite_friends', title: t('inviteFriends'), icon: 'people-outline', action: () => navigation.navigate('InviteFriends') },
    { id: 'learning_hub', title: t('learningHub'), icon: 'school-outline', action: () => Alert.alert('Learning Hub', 'Learning Hub coming soon!') },
    { id: 'terms', title: t('termsOfService'), icon: 'document-text-outline', action: () => Alert.alert('Legal', 'Terms of Service screen coming soon!') },
    { id: 'privacy', title: t('privacyPolicy'), icon: 'shield-outline', action: () => Linking.openURL('https://example.com/privacy-policy') },
  ];

  // Menu sections organized like AccountScreen
  const menuItems = [
    {
      title: t('accountSecurity'),
      items: accountSecurityOptions,
    },
    {
      title: t('paymentCards'),
      items: paymentCardsOptions,
    },
    {
      title: t('servicesUtilities'),
      items: servicesUtilitiesOptions,
    },
    {
      title: t('preferences'),
      items: preferencesOptions,
    },
    {
      title: t('supportLegal'),
      items: supportLegalOptions,
    },
  ];

  const toggleSection = (idx) => {
    setExpandedSections(prev => prev.map((v, i) => i === idx ? !v : v));
    Animated.timing(animatedHeights[idx], {
      toValue: expandedSections[idx] ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  // Enhanced MenuItem component with animations
  const MenuItem = ({ label, icon, onPress, isLast, type, value }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 30,
        bounciness: 6,
      }).start();
    };
    
    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 6,
      }).start();
    };

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.menuItemButton, isLast && styles.menuItemButtonLast, { borderBottomColor: colors.border }]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
        >
          <Ionicons name={icon} size={24} color={colors.primary} style={styles.menuItemIcon} />
          <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>{label}</Text>
          {type === 'toggle' ? (
            <Switch
              value={value}
              onValueChange={onPress}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={value ? colors.cardBackground : colors.textMuted}
            />
          ) : (
            <Ionicons name="chevron-forward-outline" size={20} color={colors.textMuted} />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const handleLogoutPress = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          onPress: () => {
            if (logout) logout();
          },
          style: "destructive"
        }
      ]
    );
  };

  return (
    <StandardizedContainer 
      backgroundColor={colors.background}
      showGlobeBackground={true}
      globeOpacity={0.13}
      statusBarStyle={isDarkMode ? "light-content" : "dark-content"}
    >
      <Animated.View style={{ flex: 1 }}>
        {/* Subtle background pattern */}
        <View style={[styles.backgroundPattern, { backgroundColor: colors.primaryLight + '10' }]} pointerEvents="none" />
        
        {/* Centered Avatar and Profile Info */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <View style={styles.profilePhotoContainer}>
            <Image
              source={user?.photoUrl ? { uri: user.photoUrl } : require('../assets/images/avatar-default.png')}
              style={[styles.profilePhoto, { borderColor: colors.primary }]}
            />
            <TouchableOpacity style={[styles.editPhotoButton, { 
              backgroundColor: colors.cardBackground,
              shadowColor: colors.primary 
            }]}>
              <Ionicons name="camera-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
            {user?.isVerified && (
              <View style={[styles.verifiedBadge, { 
                backgroundColor: colors.cardBackground, 
                borderColor: colors.success,
                shadowColor: colors.success 
              }]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              </View>
            )}
        </View>
          <Text style={[styles.profileName, { color: colors.textPrimary, marginTop: 12 }]}>{user?.fullName ?? 'Your Name'}</Text>
          <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{user?.email ?? 'your.email@example.com'}</Text>
          <View style={{ alignItems: 'center', width: '100%' }}>
            <View style={[styles.membershipBadge, { backgroundColor: colors.primaryLight, alignSelf: 'center' }]}> 
              <Ionicons name="star-outline" size={12} color={colors.primary} />
              <Text style={[styles.membershipText, { color: colors.primary }]}>Gold Member</Text>
            </View>
          </View>
            </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={[styles.scrollContentContainer, { paddingBottom: Platform.OS === 'ios' ? 110 : 100 }]}
        >
          {/* Enhanced Profile Section */}
          <View style={[styles.profileSection, { 
            backgroundColor: colors.cardBackground, 
            borderColor: colors.border,
            shadowColor: colors.primary 
          }]}>
            <TouchableOpacity style={[styles.editProfileButton, { 
              backgroundColor: colors.backgroundSecondary,
              shadowColor: colors.primary 
            }]} onPress={() => navigation.navigate('EditProfile')}>
              <Ionicons name="pencil-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.editProfileText, { color: colors.primary }]}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Menu Sections */}
          {menuItems.map((section, sectionIndex) => {
            const sectionHeight = section.items.length * 56 + 8;
            const animatedStyle = {
              height: animatedHeights[sectionIndex].interpolate({
                inputRange: [0, 1],
                outputRange: [0, sectionHeight],
              }),
              overflow: 'hidden',
            };
            const chevronRotation = animatedHeights[sectionIndex].interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '-180deg'],
            });
            return (
              <View key={sectionIndex} style={[styles.sectionContainer, { 
                backgroundColor: colors.cardBackground, 
                borderColor: colors.border,
                shadowColor: colors.primary 
              }]}> 
                <LinearGradient
                  colors={[colors.primaryLight + '80', colors.cardBackground + '00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sectionHeaderGradient}
                >
                  <TouchableOpacity 
                    style={[styles.sectionHeader, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]} 
                    onPress={() => toggleSection(sectionIndex)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: 'Montserrat-SemiBold' }]}>{section.title}</Text>
                    <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
                      <Ionicons 
                        name={expandedSections[sectionIndex] ? 'chevron-up-outline' : 'chevron-down-outline'} 
                        size={18} 
                        color={colors.primary} 
                      />
                    </Animated.View>
                  </TouchableOpacity>
                </LinearGradient>
                <Animated.View style={animatedStyle}>
                  {section.items.map((item, itemIndex) => (
                    <MenuItem
                      key={itemIndex}
                      label={item.title}
                      icon={item.icon}
                      onPress={item.action}
                      type={item.type}
                      value={item.value}
                      isLast={itemIndex === section.items.length - 1}
                    />
                  ))}
                </Animated.View>
              </View>
            );
          })}



          {/* Logout Button */}
            <TouchableOpacity
            style={[styles.logoutButton, { 
              backgroundColor: colors.cardBackground, 
              borderColor: colors.border,
              shadowColor: colors.error 
            }]} 
                onPress={handleLogoutPress}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.error} style={styles.menuItemIcon} />
            <Text style={[styles.menuItemText, { color: colors.error }]}>Logout</Text>
            </TouchableOpacity>

          {/* App Info */}
          <View style={styles.appInfoContainer}>
            <Text style={[styles.appVersion, { color: colors.textMuted }]}>App Version 1.0.0 (MVP)</Text>
            <Text style={[styles.legalInfo, { color: colors.textMuted }]}>© 2026 SendNReceive. All rights reserved.</Text>
          </View>
        </ScrollView>
      </Animated.View>
    </StandardizedContainer>
  );
};

const styles = StyleSheet.create({
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  
  // Enhanced Profile Section
  profileSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  profilePhotoContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profilePhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    backgroundColor: '#e0e7ff',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    borderRadius: 12,
    padding: 3,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
  },
  profileName: {
    ...Typography.subHeader,
    marginBottom: 2,
    fontWeight: '600',
  },
  profileEmail: {
    ...Typography.bodyText,
    marginBottom: 6,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  membershipText: {
    ...Typography.smallText,
    marginLeft: 4,
    fontWeight: '600',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  editProfileText: {
    ...Typography.bodyText,
    fontWeight: '600',
  },
  
  // Menu Sections
  sectionContainer: {
    borderRadius: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    opacity: 0.7,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    ...Typography.subHeader,
    fontWeight: '600',
  },
  menuItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuItemButtonLast: {
    borderBottomWidth: 0,
  },
  menuItemIcon: {
    marginRight: 16,
  },
  menuItemText: {
    ...Typography.bodyText,
    flex: 1,
  },
  
  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // App Info
  appInfoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  appVersion: {
      ...Typography.smallText,
      textAlign: 'center',
    marginBottom: 4,
  },
  legalInfo: {
    ...Typography.smallText,
    textAlign: 'center',
  },
  sectionHeaderGradient: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
});

export default ProfileSettingsScreen; 