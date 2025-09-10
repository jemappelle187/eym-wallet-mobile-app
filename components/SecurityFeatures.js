import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Vibration,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

// PIN Input Component
export const PINInput = ({ 
  length = 6, 
  onComplete, 
  onCancel,
  title = 'Enter your PIN',
  subtitle = 'For your security',
  showBiometric = true,
}) => {
  const [pin, setPin] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const handleNumberPress = (number) => {
    if (pin.length < length) {
      const newPin = pin + number;
      setPin(newPin);
      
      if (newPin.length === length) {
        // Add slight delay for visual feedback
        setTimeout(() => {
          onComplete?.(newPin);
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const handleBiometric = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        Alert.alert('Biometric not available', 'Please use PIN instead');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to continue',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        onComplete?.('biometric');
      }
    } catch (error) {
      // console.error('Biometric error:', error);
    }
  };

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderPINDot = (index) => (
    <View
      key={index}
      style={[
        styles.pinDot,
        index < pin.length && styles.pinDotFilled,
      ]}
    />
  );

  const renderNumberButton = (number) => (
    <TouchableOpacity
      key={number}
      style={styles.numberButton}
      onPress={() => handleNumberPress(number)}
      activeOpacity={0.7}
    >
      <Text style={styles.numberText}>{number}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.pinContainer}>
      <View style={styles.pinHeader}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Ionicons name="close" size={24} color={Colors.textMuted} />
        </TouchableOpacity>
        <Text style={styles.pinTitle}>{title}</Text>
        <TouchableOpacity 
          style={styles.visibilityButton} 
          onPress={() => setIsVisible(!isVisible)}
        >
          <Ionicons 
            name={isVisible ? "eye-off" : "eye"} 
            size={20} 
            color={Colors.textMuted} 
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.pinSubtitle}>{subtitle}</Text>

      <Animated.View 
        style={[
          styles.pinDotsContainer,
          { transform: [{ translateX: shakeAnim }] }
        ]}
      >
        {Array.from({ length }, (_, index) => renderPINDot(index))}
      </Animated.View>

      <View style={styles.numbersContainer}>
        <View style={styles.numberRow}>
          {[1, 2, 3].map(renderNumberButton)}
        </View>
        <View style={styles.numberRow}>
          {[4, 5, 6].map(renderNumberButton)}
        </View>
        <View style={styles.numberRow}>
          {[7, 8, 9].map(renderNumberButton)}
        </View>
        <View style={styles.numberRow}>
          {showBiometric && (
            <TouchableOpacity style={styles.biometricButton} onPress={handleBiometric}>
              <Ionicons name="finger-print" size={24} color={Colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.numberButton} onPress={() => handleNumberPress('0')}>
            <Text style={styles.numberText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="backspace" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.securityNotice}>
        <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
        <Text style={styles.securityText}>Your PIN is encrypted and secure</Text>
      </View>
    </View>
  );
};

// Security Status Component
export const SecurityStatus = ({ status = 'secure' }) => {
  const statusConfig = {
    secure: {
      icon: 'shield-checkmark',
      color: Colors.success,
      text: 'Account Secure',
      description: 'All security features are active',
    },
    warning: {
      icon: 'warning',
      color: Colors.warning,
      text: 'Security Warning',
      description: 'Some security features need attention',
    },
    critical: {
      icon: 'alert-circle',
      color: Colors.error,
      text: 'Security Alert',
      description: 'Immediate action required',
    },
  };

  const config = statusConfig[status];

  return (
    <View style={styles.securityStatusContainer}>
      <View style={[styles.statusIcon, { backgroundColor: config.color + '20' }]}>
        <Ionicons name={config.icon} size={24} color={config.color} />
      </View>
      <View style={styles.statusInfo}>
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.text}
        </Text>
        <Text style={styles.statusDescription}>
          {config.description}
        </Text>
      </View>
    </View>
  );
};

// Two-Factor Authentication Component
export const TwoFactorAuth = ({ onVerify, onCancel }) => {
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleCodeChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setCode(cleaned);
    
    if (cleaned.length === 6) {
      onVerify?.(cleaned);
    }
  };

  const handleResend = () => {
    setTimeLeft(30);
    setCanResend(false);
    setCode('');
    // Trigger resend logic here
  };

  return (
    <View style={styles.twoFactorContainer}>
      <View style={styles.twoFactorHeader}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Ionicons name="close" size={24} color={Colors.textMuted} />
        </TouchableOpacity>
        <Text style={styles.twoFactorTitle}>Two-Factor Authentication</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.twoFactorContent}>
        <View style={styles.codeIcon}>
          <Ionicons name="phone-portrait" size={48} color={Colors.primary} />
        </View>
        
        <Text style={styles.codeTitle}>Enter verification code</Text>
        <Text style={styles.codeSubtitle}>
          We've sent a 6-digit code to your phone
        </Text>

        <View style={styles.codeInputContainer}>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={handleCodeChange}
            placeholder="000000"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
            autoFocus
          />
        </View>

        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            Code expires in {timeLeft}s
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.resendButton, !canResend && styles.resendButtonDisabled]}
          onPress={handleResend}
          disabled={!canResend}
        >
          <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
            {canResend ? 'Resend Code' : `Resend in ${timeLeft}s`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // PIN Input Styles
  pinContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  pinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelButton: {
    padding: 8,
  },
  pinTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  visibilityButton: {
    padding: 8,
  },
  pinSubtitle: {
    ...Typography.bodyRegular,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 40,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    gap: 16,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  pinDotFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  numbersContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  numberButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  numberText: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  biometricButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  securityText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginLeft: 8,
  },

  // Security Status Styles
  securityStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    ...Typography.bodyRegular,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusDescription: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },

  // Two-Factor Auth Styles
  twoFactorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  twoFactorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  twoFactorTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  twoFactorContent: {
    flex: 1,
    alignItems: 'center',
    padding: 40,
  },
  codeIcon: {
    marginBottom: 24,
  },
  codeTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 8,
  },
  codeSubtitle: {
    ...Typography.bodyRegular,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  codeInputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  codeInput: {
    ...Typography.h1,
    color: Colors.textPrimary,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timerContainer: {
    marginBottom: 24,
  },
  timerText: {
    ...Typography.bodyRegular,
    color: Colors.textMuted,
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    ...Typography.bodyRegular,
    color: Colors.primary,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: Colors.textMuted,
  },
});

// Main SecurityFeatures component
export const SecurityFeatures = ({ visible, onClose, colors }) => {
  if (!visible) return null;
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SecurityStatus status="secure" />
      {/* Add other security features as needed */}
    </View>
  );
};

export default SecurityFeatures; 