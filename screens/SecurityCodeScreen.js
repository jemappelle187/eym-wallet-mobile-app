import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { saveSecurityCode, getSecurityCode } from '../utils/SecureTokenStorage';

const SecurityCodeScreen = ({ navigation, route }) => {
  const { colors, isDarkMode } = useTheme();
  const [code, setCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const { mode = 'setup' } = route.params || {}; // 'setup' or 'verify'

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      if (hasHardware && isEnrolled) {
        setBiometricAvailable(true);
        
        // Determine biometric type
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Touch ID');
        } else {
          setBiometricType('Biometric');
        }
      }
    } catch (error) {
      console.log('Error checking biometric availability:', error);
    }
  };

  const handleNumberPress = (number) => {
    Haptics.selectionAsync();
    
    if (mode === 'verify') {
      if (code.length < 6) {
        setCode(prev => prev + number);
      }
    } else {
      if (!isConfirming) {
        if (code.length < 6) {
          setCode(prev => prev + number);
        }
      } else {
        if (confirmCode.length < 6) {
          setConfirmCode(prev => prev + number);
        }
      }
    }
  };

  const handleDelete = () => {
    Haptics.selectionAsync();
    
    if (mode === 'verify') {
      setCode(prev => prev.slice(0, -1));
    } else {
      if (!isConfirming) {
        setCode(prev => prev.slice(0, -1));
      } else {
        setConfirmCode(prev => prev.slice(0, -1));
      }
    }
  };

  const shakeCodeInput = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCodeComplete = async () => {
    if (mode === 'verify') {
      // Verify the entered code against stored code
      const storedCode = await getSecurityCode();
      if (code === storedCode) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.navigate('BiometricSetup', { securityCode: code });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        shakeCodeInput();
        setCode('');
        Alert.alert('Incorrect Code', 'Please enter the correct security code.');
      }
    } else {
      // Setup mode
      if (!isConfirming) {
        if (code.length === 6) {
          setIsConfirming(true);
          Haptics.selectionAsync();
        }
      } else {
        if (confirmCode.length === 6) {
          if (code === confirmCode) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Save the security code securely
            await saveSecurityCode(code);
            navigation.navigate('BiometricSetup', { securityCode: code });
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            shakeCodeInput();
            setConfirmCode('');
            Alert.alert('Codes Don\'t Match', 'Please make sure both codes are identical.');
          }
        }
      }
    }
  };

  useEffect(() => {
    if (mode === 'verify') {
      if (code.length === 6) {
        handleCodeComplete();
      }
    } else {
      if (!isConfirming && code.length === 6) {
        handleCodeComplete();
      } else if (isConfirming && confirmCode.length === 6) {
        handleCodeComplete();
      }
    }
  }, [code, confirmCode]);

  const renderCodeInput = (inputCode, isActive) => (
    <Animated.View 
      style={[
        styles.codeInputContainer,
        { transform: [{ translateX: shakeAnimation }] }
      ]}
    >
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <View
          key={index}
          style={[
            styles.codeDot,
            {
              backgroundColor: inputCode.length > index ? colors.primary : colors.border,
              borderColor: isActive ? colors.primary : colors.border,
            }
          ]}
        />
      ))}
    </Animated.View>
  );

  const renderNumberPad = () => (
    <View style={styles.numberPad}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
        <TouchableOpacity
          key={number}
          style={[styles.numberButton, { backgroundColor: colors.backgroundSecondary }]}
          onPress={() => handleNumberPress(number.toString())}
          activeOpacity={0.7}
        >
          <Text style={[styles.numberText, { color: colors.textPrimary }]}>{number}</Text>
        </TouchableOpacity>
      ))}
      
      <View style={styles.numberButton} />
      
      <TouchableOpacity
        style={[styles.numberButton, { backgroundColor: colors.backgroundSecondary }]}
        onPress={() => handleNumberPress('0')}
        activeOpacity={0.7}
      >
        <Text style={[styles.numberText, { color: colors.textPrimary }]}>0</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.numberButton, { backgroundColor: colors.backgroundSecondary }]}
        onPress={handleDelete}
        activeOpacity={0.7}
      >
        <Ionicons name="backspace-outline" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
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
            {mode === 'verify' ? 'Enter Security Code' : 'Set Security Code'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconBackground, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="shield-checkmark" size={48} color={colors.primary} />
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {mode === 'verify' ? 'Enter Security Code' : 'Create Security Code'}
          </Text>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {mode === 'verify' 
              ? 'Enter your 6-digit security code to enable biometric login'
              : isConfirming 
                ? 'Confirm your security code'
                : 'Create a 6-digit security code for biometric authentication'
            }
          </Text>

          {/* Code Input */}
          <View style={styles.codeContainer}>
            {mode === 'verify' ? (
              renderCodeInput(code, true)
            ) : (
              <>
                {renderCodeInput(code, !isConfirming)}
                {isConfirming && (
                  <>
                    <Text style={[styles.confirmLabel, { color: colors.textMuted }]}>
                      Confirm Code
                    </Text>
                    {renderCodeInput(confirmCode, true)}
                  </>
                )}
              </>
            )}
          </View>

          {/* Biometric Info */}
          {biometricAvailable && mode !== 'verify' && (
            <View style={[styles.biometricInfo, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons 
                name={biometricType === 'Face ID' ? 'scan-outline' : 'finger-print-outline'} 
                size={20} 
                color={colors.primary} 
              />
              <Text style={[styles.biometricText, { color: colors.textSecondary }]}>
                {biometricType} will be available after setting up your security code
              </Text>
            </View>
          )}

          {/* Number Pad */}
          {renderNumberPad()}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  codeInputContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  codeDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  confirmLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    marginTop: 24,
    marginBottom: 16,
  },
  biometricInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 40,
    gap: 8,
  },
  biometricText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    flex: 1,
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  numberButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  numberText: {
    fontSize: 24,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
  },
});

export default SecurityCodeScreen;
