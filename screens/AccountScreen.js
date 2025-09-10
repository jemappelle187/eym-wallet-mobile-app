// sendnreceive-app/screens/AccountScreen.js
import React, { useContext, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
  Switch,
  Animated,
  Linking,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import GlobeBackground from '../components/GlobeBackground';
import StandardizedContainer from '../components/StandardizedContainer';

const AccountScreen = () => {
  const { user, logout, biometricEnabled, toggleBiometric } = useContext(AuthContext);
  const navigation = useNavigation();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const [localPhoto, setLocalPhoto] = useState(null);
  
  // Fade in animation
  const screenOpacity = useRef(new Animated.Value(0)).current;
  
  // Fade in animation when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reset opacity to 0 when screen loses focus
      screenOpacity.setValue(0);
      
      // Fade in when screen comes into focus
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, [])
  );

  // Streamlined menu items - consolidated and organized
  const menuItems = [
    {
      title: 'Account & Security',
      items: [
        { label: 'Edit Profile', icon: 'person-outline', action: () => navigation.navigate('Home', { screen: 'EditProfile' }), type: 'navigation' },
        { label: 'Change Password', icon: 'lock-closed-outline', action: () => Alert.alert('Security', 'Change Password screen coming soon!') },
        { label: 'Two-Factor Authentication', icon: 'shield-checkmark-outline', action: () => Alert.alert('Security', '2FA settings coming soon!') },
        { label: 'Linked Accounts', icon: 'link-outline', action: () => Alert.alert('Linked Accounts', 'Manage linked accounts coming soon!') },
      ],
    },
    {
      title: 'Payment & Cards',
      items: [
        { label: 'Payment Methods', icon: 'card-outline', action: () => Alert.alert('Payments', 'Manage payment methods screen coming soon!') },
        { label: 'My Virtual Cards', icon: 'wallet-outline', action: () => Alert.alert('Virtual Cards', 'Virtual cards feature coming soon!') },
        { label: 'Transaction Limits', icon: 'swap-horizontal-outline', action: () => Alert.alert('Limits', 'Transaction limits screen coming soon!') },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { label: 'Notifications', icon: 'notifications-outline', action: () => Alert.alert('Notifications', 'Notification settings coming soon!') },
        { label: 'Language', icon: 'language-outline', action: () => Alert.alert('Language', 'Language settings coming soon!') },
        { label: 'Dark Mode', icon: 'moon-outline', type: 'toggle', value: isDarkMode, onPress: toggleTheme },
        // Add biometric toggle
        { label: 'FaceID / Biometric Login', icon: 'finger-print-outline', type: 'toggle', value: biometricEnabled, onPress: () => toggleBiometric(!biometricEnabled) },
      ],
    },
    {
      title: 'Support & Legal',
      items: [
        { label: 'Help & Support', icon: 'help-circle-outline', action: () => Alert.alert('Support', 'Help center coming soon!') },
        { label: 'Contact Us', icon: 'chatbubble-ellipses-outline', action: () => Alert.alert('Contact', 'Contact Us screen coming soon!') },
        { label: 'Invite Friends', icon: 'people-outline', screen: 'InviteFriends', type: 'navigation' },
        { label: 'Learning Hub', icon: 'school-outline', action: () => Alert.alert('Learning Hub', 'Learning Hub coming soon!') },
        { label: 'Terms of Service', icon: 'document-text-outline', action: () => Alert.alert('Legal', 'Terms of Service screen coming soon!') },
        { label: 'Privacy Policy', icon: 'shield-outline', action: () => Linking.openURL('https://example.com/privacy-policy') },
      ],
    },
  ];
  
  const [expandedSections, setExpandedSections] = useState(menuItems.map(() => true));
  const animatedHeights = useRef(menuItems.map(() => new Animated.Value(1))).current;

  const toggleSection = idx => {
    Haptics.selectionAsync();
    setExpandedSections(prev => prev.map((v, i) => i === idx ? !v : v));
    Animated.timing(animatedHeights[idx], {
      toValue: expandedSections[idx] ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: () => logout && logout() }
    ]);
  };

  // Profile photo picker handler
  const handlePickPhoto = async () => {
    await Haptics.selectionAsync();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access media library is required!');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setLocalPhoto(result.assets[0].uri);
    }
  };

  // Enhanced MenuItem component with better visual feedback
  const MenuItem = ({ label, icon, onPress, isLast, type, value, accessibilityLabel }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const rippleAnim = useRef(new Animated.Value(0)).current;
    
    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 30,
        bounciness: 6,
      }).start();
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    };
    
    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 6,
      }).start();
      Animated.timing(rippleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity 
          style={[styles.menuItemButton, isLast && styles.menuItemButtonLast]} 
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.92}
          accessibilityRole={type === 'toggle' ? 'switch' : 'button'}
          accessibilityLabel={accessibilityLabel}
        >
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              backgroundColor: colors.primary + '10',
              opacity: rippleAnim,
              borderRadius: 12,
            }}
            pointerEvents="none"
          />
          <Ionicons name={icon} size={22} color={colors.primary} style={styles.menuItemIcon} />
          <Text style={[styles.menuItemText, { color: colors.text, fontFamily: 'Montserrat-Medium' }]}>{label}</Text>
          {type === 'toggle' ? (
            <Switch
              value={value}
              onValueChange={onPress}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
              thumbColor={value ? colors.primary : colors.textMuted}
              accessibilityLabel={label}
            />
          ) : (
            <Ionicons name="chevron-forward-outline" size={20} color={colors.textMuted} />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const [logoutScale] = useState(new Animated.Value(1));
  const handleLogoutPressIn = () => {
    Animated.spring(logoutScale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };
  const handleLogoutPressOut = () => {
    Animated.spring(logoutScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  return (
    <StandardizedContainer 
      backgroundColor={colors.background}
      showGlobeBackground={true}
      globeOpacity={0.13}
      statusBarStyle="dark-content"
    >
      <Animated.View style={{ flex: 1, opacity: screenOpacity }}>
        {/* Subtle background pattern */}
        <View style={[styles.backgroundPattern, { backgroundColor: colors.lightBlue + '10' }]} pointerEvents="none" />
        {/* Centered Avatar and Profile Info */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <View style={styles.profilePhotoContainer}>
            <Image
              source={localPhoto ? { uri: localPhoto } : (user?.photoUrl ? { uri: user.photoUrl } : require('../assets/images/avatar-default.png'))}
              style={styles.profilePhoto}
            />
            <TouchableOpacity style={styles.editPhotoButton} onPress={handlePickPhoto}>
              <Ionicons name="camera-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
            {user?.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              </View>
            )}
          </View>
          <Text style={[styles.profileName, { color: colors.text, marginTop: 12 }]}>{user?.fullName ?? 'Your Name'}</Text>
          <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{user?.email ?? 'your.email@example.com'}</Text>
          <View style={{ alignItems: 'center', width: '100%' }}>
            <View style={[styles.membershipBadge, { backgroundColor: colors.lightBlue, alignSelf: 'center' }]}> 
              <Ionicons name="star-outline" size={12} color={colors.indigo} />
              <Text style={[styles.membershipText, { color: colors.indigo }]}>Gold Member</Text>
            </View>
          </View>
        </View>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={[styles.scrollContentContainer, { paddingBottom: Platform.OS === 'ios' ? 110 : 100 }]}
        >
          {/* Enhanced Profile Section */}
          <View style={[styles.profileSection, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.editProfileButton} onPress={() => navigation.navigate('Home', { screen: 'EditProfile' })}>
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
              <View key={sectionIndex} style={[styles.sectionContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
                <LinearGradient
                  colors={[colors.lightBlue + '80', '#fff0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sectionHeaderGradient}
                >
                  <TouchableOpacity 
                    style={styles.sectionHeader} 
                    onPress={() => toggleSection(sectionIndex)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Toggle ${section.title} section`}
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
                      label={item.label}
                      icon={item.icon}
                      type={item.type}
                      value={item.value}
                      onPress={() => {
                        if (item.type === 'navigation' && item.screen) {
                          navigation.navigate(item.screen);
                        } else if (item.type === 'toggle') {
                          item.onPress();
                        } else if (item.action) {
                          item.action();
                        }
                      }}
                      isLast={itemIndex === section.items.length - 1}
                      accessibilityLabel={item.label}
                    />
                  ))}
                </Animated.View>
              </View>
            );
          })}

          {/* Logout Button */}
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]} 
            onPress={handleLogout}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Logout"
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
  container: {
    flex: 1,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'android' ? 16 : 12,
    borderBottomWidth: 1,
    alignItems: 'flex-start',
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
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  // profileHeader removed, avatar is now centered
  profilePhotoContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profilePhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#6366F1',
    backgroundColor: '#e0e7ff',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 3,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  profileInfo: {
    flex: 1,
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
    backgroundColor: '#f1f5f9',
    shadowColor: '#6366F1',
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
    shadowColor: '#6366F1',
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
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    borderBottomColor: '#e5e7eb',
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
    shadowColor: '#EF4444',
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
  avatarGradientRing: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 48,
    padding: 4,
    marginBottom: 8,
  },
  sectionHeaderGradient: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
});

export default AccountScreen;
