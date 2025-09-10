import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';

const BiometricTestScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [biometricType, setBiometricType] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      setIsAvailable(hasHardware && isEnrolled);
      
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Touch ID');
      } else {
        setBiometricType('Biometric');
      }
    } catch (error) {
      console.log('Error checking biometric availability:', error);
    }
  };

  const testBiometric = async () => {
    setIsTesting(true);
    
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Test ${biometricType}`,
        fallbackLabel: 'Use Security Code',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Success!',
          `${biometricType} authentication successful!`,
          [{ text: 'OK' }]
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Authentication Failed',
          `${biometricType} authentication was not successful.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('Biometric test error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        'There was an error testing biometric authentication.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsTesting(false);
    }
  };

  React.useEffect(() => {
    checkBiometricAvailability();
  }, []);

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
          Biometric Test
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={isAvailable ? 'checkmark-circle' : 'close-circle'} 
              size={32} 
              color={isAvailable ? colors.success : colors.error} 
            />
            <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>
              {isAvailable ? `${biometricType} Available` : 'Biometric Not Available'}
            </Text>
          </View>
          
          <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
            {isAvailable 
              ? `${biometricType} is properly configured and ready to use.`
              : 'Your device does not support biometric authentication or it is not configured.'
            }
          </Text>
        </View>

        {/* Test Button */}
        {isAvailable && (
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.primary }]}
            onPress={testBiometric}
            disabled={isTesting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.primary + 'DD']}
              style={styles.testButtonGradient}
            >
              <Ionicons 
                name={biometricType === 'Face ID' ? 'scan-outline' : 'finger-print-outline'} 
                size={24} 
                color={colors.white} 
                style={{ marginRight: 12 }}
              />
              <Text style={styles.testButtonText}>
                {isTesting ? 'Testing...' : `Test ${biometricType}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
            About Biometric Authentication
          </Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Secure and encrypted authentication
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="flash-outline" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Faster than entering passwords
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Protected by device security
              </Text>
            </View>
          </View>
        </View>

        {/* Setup Instructions */}
        {!isAvailable && (
          <View style={[styles.setupSection, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.setupTitle, { color: colors.textPrimary }]}>
              Setup Instructions
            </Text>
            <Text style={[styles.setupText, { color: colors.textSecondary }]}>
              To enable biometric authentication:
            </Text>
            <View style={styles.setupSteps}>
              <Text style={[styles.setupStep, { color: colors.textSecondary }]}>
                1. Go to your device Settings
              </Text>
              <Text style={[styles.setupStep, { color: colors.textSecondary }]}>
                2. Navigate to Face ID & Passcode (iOS) or Security (Android)
              </Text>
              <Text style={[styles.setupStep, { color: colors.textSecondary }]}>
                3. Set up Face ID or fingerprint
              </Text>
              <Text style={[styles.setupStep, { color: colors.textSecondary }]}>
                4. Return to this app and test again
              </Text>
            </View>
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statusCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    marginLeft: 12,
  },
  statusDescription: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    lineHeight: 20,
  },
  testButton: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  testButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
  },
  infoSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    marginBottom: 16,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    flex: 1,
  },
  setupSection: {
    padding: 20,
    borderRadius: 16,
  },
  setupTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    marginBottom: 12,
  },
  setupText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    marginBottom: 16,
  },
  setupSteps: {
    gap: 8,
  },
  setupStep: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    lineHeight: 20,
  },
});

export default BiometricTestScreen;


