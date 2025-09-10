import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../contexts/AuthContext';

const BiometricSetupScreen = ({ navigation, route }) => {
  const { colors, isDarkMode } = useTheme();
  const { enableBiometric } = useAuth();
  const [biometricType, setBiometricType] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  const { securityCode } = route.params || {};

  useEffect(() => {
    checkBiometricType();
    startPulseAnimation();
  }, []);

  const checkBiometricType = async () => {
    try {
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Touch ID');
      } else {
        setBiometricType('Biometric');
      }
    } catch (error) {
      console.log('Error checking biometric type:', error);
      setBiometricType('Biometric');
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleEnableBiometric = async () => {
    setIsSettingUp(true);
    
    try {
      // First, authenticate with the security code
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Enable ${biometricType}`,
        fallbackLabel: 'Use Security Code',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSetupComplete(true);
        
        // Save the biometric preference
        await enableBiometric();
        
        setTimeout(() => {
          Alert.alert(
            `${biometricType} Enabled`,
            `${biometricType} has been successfully enabled for your wallet. You can now use ${biometricType} to unlock your wallet.`,
            [
              {
                text: 'Continue',
                onPress: () => navigation.navigate('ProfileSettings')
              }
            ]
          );
        }, 1000);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Setup Failed',
          `${biometricType} setup was not completed. You can try again or skip for now.`,
          [
            { text: 'Skip', onPress: () => navigation.navigate('ProfileSettings') },
            { text: 'Try Again', onPress: () => setIsSettingUp(false) }
          ]
        );
      }
    } catch (error) {
      console.log('Biometric setup error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Setup Error',
        'There was an error setting up biometric authentication. Please try again.',
        [
          { text: 'Skip', onPress: () => navigation.navigate('ProfileSettings') },
          { text: 'Try Again', onPress: () => setIsSettingUp(false) }
        ]
      );
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Biometric Setup',
      'You can always enable biometric authentication later in your profile settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          onPress: () => navigation.navigate('ProfileSettings')
        }
      ]
    );
  };

  const getBiometricIcon = () => {
    if (biometricType === 'Face ID') {
      return 'scan-outline';
    } else if (biometricType === 'Touch ID') {
      return 'finger-print-outline';
    } else {
      return 'shield-checkmark-outline';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Enable {biometricType}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Animated Icon */}
        <Animated.View 
          style={[
            styles.iconContainer,
            { transform: [{ scale: pulseAnimation }] }
          ]}
        >
          <View style={[styles.iconBackground, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons 
              name={getBiometricIcon()} 
              size={64} 
              color={setupComplete ? colors.success : colors.primary} 
            />
          </View>
          {setupComplete && (
            <View style={[styles.successBadge, { backgroundColor: colors.success }]}>
              <Ionicons name="checkmark" size={20} color={colors.white} />
            </View>
          )}
        </Animated.View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {setupComplete ? `${biometricType} Enabled!` : `Enable ${biometricType}`}
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {setupComplete 
            ? `You can now use ${biometricType} to quickly and securely unlock your wallet.`
            : `Use ${biometricType} to unlock your wallet quickly and securely.`
          }
        </Text>

        {/* Security Info */}
        <View style={[styles.securityInfo, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          <Text style={[styles.securityText, { color: colors.textSecondary }]}>
            Your security code will always be available as a backup option
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <Text style={[styles.benefitsTitle, { color: colors.textPrimary }]}>
            Benefits of {biometricType}:
          </Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="flash-outline" size={16} color={colors.primary} />
              <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                Faster access to your wallet
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.primary} />
              <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                Enhanced security with biometric data
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="hand-left-outline" size={16} color={colors.primary} />
              <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                No need to remember complex codes
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {!setupComplete && (
            <TouchableOpacity
              style={[styles.enableButton, { backgroundColor: colors.primary }]}
              onPress={handleEnableBiometric}
              disabled={isSettingUp}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, colors.primary + 'DD']}
                style={styles.enableButtonGradient}
              >
                <Ionicons 
                  name={getBiometricIcon()} 
                  size={20} 
                  color={colors.white} 
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.enableButtonText}>
                  {isSettingUp ? 'Setting up...' : `Enable ${biometricType}`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.skipButton, { borderColor: colors.border }]}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
              {setupComplete ? 'Continue' : 'Skip for now'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  iconContainer: {
    marginBottom: 32,
    position: 'relative',
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Montserrat-Bold',
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 32,
    gap: 8,
  },
  securityText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    flex: 1,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 40,
  },
  benefitsTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  enableButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  enableButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
  },
  skipButton: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    fontWeight: '500',
  },
});

export default BiometricSetupScreen;
