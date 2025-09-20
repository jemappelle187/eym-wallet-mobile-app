import React, { useContext } from 'react'; // Added useContext
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, SafeAreaView } from 'react-native'; // Added Platform, SafeAreaView
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { AuthContext } from '../contexts/AuthContext'; // Import AuthContext

const ProfileSettingsScreen = ({ navigation }) => {
  const { user, logout, isLoading: authIsLoading } = useContext(AuthContext); // Get user and logout from context

  const settingsOptions = [
    { id: 'edit_profile', title: 'Edit Profile', icon: 'person-outline', action: () => Alert.alert('Edit Profile', 'Navigation to edit profile screen (not implemented).') },
    { id: 'notifications', title: 'Notification Settings', icon: 'notifications-outline', action: () => Alert.alert('Notifications', 'Navigation to notification settings (not implemented).') },
    { id: 'security', title: 'Security & Privacy', icon: 'shield-checkmark-outline', action: () => Alert.alert('Security', 'Navigation to security settings (not implemented).') },
    { id: 'linked_accounts', title: 'Linked Accounts', icon: 'link-outline', action: () => Alert.alert('Linked Accounts', 'Navigation to linked accounts (not implemented).') },
    { id: 'help', title: 'Help & Support', icon: 'help-circle-outline', action: () => Alert.alert('Help', 'Navigation to help center (not implemented).') },
    { id: 'about', title: 'About SendNReceive', icon: 'information-circle-outline', action: () => Alert.alert('About', 'Display app version and info (not implemented).') },
  ];

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
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={28} color={Colors.cardBackground} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile & Settings</Text>
            <View style={{width: 28}} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.profileSection}>
            <Ionicons name="person-circle-outline" size={90} color={Colors.primary} />
            <Text style={styles.userName}>{user?.fullName ?? 'User Name'}</Text>
            <Text style={styles.userEmail}>{user?.email ?? 'user@example.com'}</Text>
            </View>

            {settingsOptions.map(option => (
            <TouchableOpacity key={option.id} style={styles.optionItem} onPress={option.action}>
                <Ionicons name={option.icon} size={24} color={Colors.primary} style={styles.optionIcon} />
                <Text style={styles.optionText}>{option.title}</Text>
                <Ionicons name="chevron-forward-outline" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
            ))}

            <TouchableOpacity
                style={[styles.logoutButton, authIsLoading && styles.buttonDisabled]}
                onPress={handleLogoutPress}
                disabled={authIsLoading}
            >
            <Ionicons name="log-out-outline" size={24} color={Colors.error} style={styles.optionIcon} />
            <Text style={[styles.optionText, styles.logoutText]}>
                {authIsLoading ? 'Logging out...' : 'Logout'}
            </Text>
            </TouchableOpacity>

            <Text style={styles.appVersion}>App Version 1.0.0 (MVP)</Text>
        </ScrollView>
        </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    ...Typography.subHeader,
    color: Colors.cardBackground,
    fontSize: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom:10,
  },
  userName: {
    ...Typography.header,
    fontSize: 22,
    marginTop: 12,
  },
  userEmail: {
    ...Typography.bodyText,
    color: Colors.textMuted,
    fontSize: 15,
    marginTop: 5,
  },
  optionItem: {
    backgroundColor: Colors.cardBackground,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  optionIcon: {
    marginRight: 20,
  },
  optionText: {
    ...Typography.bodyText,
    flex: 1,
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: Colors.cardBackground,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  logoutText: {
    color: Colors.error,
    fontWeight: '600',
  },
  appVersion: {
      ...Typography.smallText,
      textAlign: 'center',
      marginTop: 30,
      color: '#bbb',
  }
});

export default ProfileSettingsScreen;
