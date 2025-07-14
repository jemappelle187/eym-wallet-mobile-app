import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

// Profile Section Component
export const ProfileSection = ({ user, onEditProfile }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Profile</Text>
      
      <TouchableOpacity style={styles.profileCard} onPress={onEditProfile}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>{user?.fullName || 'User Name'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'user@email.com'}</Text>
            <Text style={styles.profilePhone}>{user?.phone || '+233 XX XXX XXXX'}</Text>
          </View>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
};

// Security Settings Component
export const SecuritySettings = ({ onBiometricToggle, onPinChange, onTwoFactorToggle }) => {
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleBiometricToggle = () => {
    setBiometricEnabled(!biometricEnabled);
    onBiometricToggle?.(!biometricEnabled);
  };

  const handleTwoFactorToggle = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    onTwoFactorToggle?.(!twoFactorEnabled);
  };

  const securityItems = [
    {
      id: 'biometric',
      title: 'Biometric Authentication',
      subtitle: 'Use fingerprint or face ID',
      icon: 'finger-print',
      type: 'toggle',
      value: biometricEnabled,
      onPress: handleBiometricToggle,
    },
    {
      id: 'pin',
      title: 'Change PIN',
      subtitle: 'Update your security PIN',
      icon: 'keypad',
      type: 'action',
      onPress: onPinChange,
    },
    {
      id: 'twoFactor',
      title: 'Two-Factor Authentication',
      subtitle: 'Add an extra layer of security',
      icon: 'shield-checkmark',
      type: 'toggle',
      value: twoFactorEnabled,
      onPress: handleTwoFactorToggle,
    },
    {
      id: 'devices',
      title: 'Active Devices',
      subtitle: 'Manage logged-in devices',
      icon: 'phone-portrait',
      type: 'action',
      onPress: () => Alert.alert('Active Devices', 'Device management coming soon'),
    },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Security</Text>
      
      {securityItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.settingItem}
          onPress={item.onPress}
          activeOpacity={0.7}
        >
          <View style={styles.settingIcon}>
            <Ionicons name={item.icon} size={20} color={Colors.primary} />
          </View>
          
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          </View>
          
          {item.type === 'toggle' ? (
            <Switch
              value={item.value}
              onValueChange={item.onPress}
              trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
              thumbColor={item.value ? Colors.primary : Colors.textMuted}
            />
          ) : (
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Preferences Component
export const PreferencesSettings = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const preferenceItems = [
    {
      id: 'notifications',
      title: 'Push Notifications',
      subtitle: 'Receive app notifications',
      icon: 'notifications',
      type: 'toggle',
      value: notificationsEnabled,
      onPress: () => setNotificationsEnabled(!notificationsEnabled),
    },
    {
      id: 'email',
      title: 'Email Notifications',
      subtitle: 'Get updates via email',
      icon: 'mail',
      type: 'toggle',
      value: emailNotifications,
      onPress: () => setEmailNotifications(!emailNotifications),
    },
    {
      id: 'sms',
      title: 'SMS Notifications',
      subtitle: 'Receive SMS alerts',
      icon: 'chatbubble',
      type: 'toggle',
      value: smsNotifications,
      onPress: () => setSmsNotifications(!smsNotifications),
    },
    {
      id: 'darkMode',
      title: 'Dark Mode',
      subtitle: 'Switch to dark theme',
      icon: 'moon',
      type: 'toggle',
      value: darkMode,
      onPress: () => setDarkMode(!darkMode),
    },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Preferences</Text>
      
      {preferenceItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.settingItem}
          onPress={item.onPress}
          activeOpacity={0.7}
        >
          <View style={styles.settingIcon}>
            <Ionicons name={item.icon} size={20} color={Colors.primary} />
          </View>
          
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          </View>
          
          <Switch
            value={item.value}
            onValueChange={item.onPress}
            trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
            thumbColor={item.value ? Colors.primary : Colors.textMuted}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Account Actions Component
export const AccountActions = ({ onLogout, onDeleteAccount }) => {
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: onLogout },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDeleteAccount },
      ]
    );
  };

  const actionItems = [
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: 'help-circle',
      onPress: () => Alert.alert('Help', 'Support features coming soon'),
    },
    {
      id: 'about',
      title: 'About',
      subtitle: 'App version and information',
      icon: 'information-circle',
      onPress: () => Alert.alert('About', 'SendNReceive v2.1.0\n\nAfrica to World, World to Africa'),
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      subtitle: 'Read our privacy policy',
      icon: 'shield',
      onPress: () => Alert.alert('Privacy Policy', 'Privacy policy coming soon'),
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      subtitle: 'Read our terms of service',
      icon: 'document-text',
      onPress: () => Alert.alert('Terms of Service', 'Terms of service coming soon'),
    },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Account</Text>
      
      {actionItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.settingItem}
          onPress={item.onPress}
          activeOpacity={0.7}
        >
          <View style={styles.settingIcon}>
            <Ionicons name={item.icon} size={20} color={Colors.primary} />
          </View>
          
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          </View>
          
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      ))}

      <View style={styles.divider} />

      <TouchableOpacity style={styles.dangerButton} onPress={handleLogout}>
        <View style={styles.settingIcon}>
          <Ionicons name="log-out" size={20} color={Colors.error} />
        </View>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: Colors.error }]}>Logout</Text>
          <Text style={styles.settingSubtitle}>Sign out of your account</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
        <View style={styles.settingIcon}>
          <Ionicons name="trash" size={20} color={Colors.error} />
        </View>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: Colors.error }]}>Delete Account</Text>
          <Text style={styles.settingSubtitle}>Permanently delete your account</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// Main Settings Screen Component
export const SettingsScreen = ({ user, onLogout, onEditProfile }) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ProfileSection user={user} onEditProfile={onEditProfile} />
      <SecuritySettings />
      <PreferencesSettings />
      <AccountActions onLogout={onLogout} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.h2,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    ...Typography.bodyRegular,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  profilePhone: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    ...Typography.bodyRegular,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 20,
    marginVertical: 16,
  },
});

export default {
  ProfileSection,
  SecuritySettings,
  PreferencesSettings,
  AccountActions,
  SettingsScreen,
}; 