import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import GlobeBackground from '../components/GlobeBackground';
import FloatingValutas from '../components/FloatingValutas';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const PhoneVerificationScreen = ({ navigation, route }) => {
  const { mode = 'signup' } = route.params || {};
  const { signup } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState({
    name: 'Netherlands',
    code: '+31',
    flag: '🇳🇱'
  });
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [verificationStep, setVerificationStep] = useState(1); // 1: Phone, 2: Code, 3: Biometric, 4: Success
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [verificationTime, setVerificationTime] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showTutorialOverlay, setShowTutorialOverlay] = useState(false);
  
  // Animation refs
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const globeAnim = useRef(new Animated.Value(0)).current;
  const valutasAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const globeRotationAnim = useRef(new Animated.Value(0)).current;
  const tutorialAnim = useRef(new Animated.Value(0)).current;

  // Tutorial steps data
  const tutorialSteps = [
    {
      title: "Welcome to SendNReceive!",
      subtitle: "Your bridge to the global financial network",
      description: "Send money worldwide, receive payments, and manage your finances with ease.",
      icon: "globe",
      color: "#2563EB"
    },
    {
      title: "Send Money Globally",
      subtitle: "Fast, secure, and affordable transfers",
      description: "Send money to over 150 countries with competitive exchange rates and low fees.",
      icon: "send",
      color: "#10B981"
    },
    {
      title: "Receive Payments",
      subtitle: "Get paid from anywhere in the world",
      description: "Receive money from friends, family, or business partners worldwide.",
      icon: "download",
      color: "#F59E0B"
    },
    {
      title: "Secure & Protected",
      subtitle: "Bank-level security for your money",
      description: "Your funds are protected with advanced encryption and regulatory compliance.",
      icon: "shield-checkmark",
      color: "#EF4444"
    }
  ];

  const popularCountries = [
    { name: 'United States', code: '+1', flag: '🇺🇸' },
    { name: 'Canada', code: '+1', flag: '🇨🇦' },
    { name: 'South Africa', code: '+27', flag: '🇿🇦' },
    { name: 'Netherlands', code: '+31', flag: '🇳🇱' },
    { name: 'France', code: '+33', flag: '🇫🇷' },
    { name: 'Spain', code: '+34', flag: '🇪🇸' },
    { name: 'Italy', code: '+39', flag: '🇮🇹' },
    { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
    { name: 'Germany', code: '+49', flag: '🇩🇪' },
    { name: 'Australia', code: '+61', flag: '🇦🇺' },
    { name: 'Japan', code: '+81', flag: '🇯🇵' },
    { name: 'China', code: '+86', flag: '🇨🇳' },
    { name: 'India', code: '+91', flag: '🇮🇳' },
    { name: 'Ghana', code: '+233', flag: '🇬🇭' },
    { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
    { name: 'Kenya', code: '+254', flag: '🇰🇪' },
  ].sort((a, b) => {
    // Remove '+' and convert to number for proper sorting
    const codeA = parseInt(a.code.replace('+', ''));
    const codeB = parseInt(b.code.replace('+', ''));
    return codeA - codeB;
  });

  // Country code mapping for IP-based detection
  const countryCodeMap = {
    'NL': { name: 'Netherlands', code: '+31', flag: '🇳🇱' },
    'US': { name: 'United States', code: '+1', flag: '🇺🇸' },
    'GB': { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
    'DE': { name: 'Germany', code: '+49', flag: '🇩🇪' },
    'FR': { name: 'France', code: '+33', flag: '🇫🇷' },
    'ES': { name: 'Spain', code: '+34', flag: '🇪🇸' },
    'IT': { name: 'Italy', code: '+39', flag: '🇮🇹' },
    'CA': { name: 'Canada', code: '+1', flag: '🇨🇦' },
    'AU': { name: 'Australia', code: '+61', flag: '🇦🇺' },
    'GH': { name: 'Ghana', code: '+233', flag: '🇬🇭' },
    'NG': { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
    'KE': { name: 'Kenya', code: '+254', flag: '🇰🇪' },
  };

  // Format phone number
  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `${match[1]} ${match[2]} ${match[3]}`;
    }
    return cleaned;
  };

  // Detect user's country based on IP
  useEffect(() => {
    detectUserCountry();
  }, []);

  // Check biometric support
  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      setIsBiometricSupported(hasHardware && isEnrolled);
      
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Touch ID');
      } else {
        setBiometricType('Biometric');
      }
    } catch (error) {
      console.log('Biometric check failed:', error);
    }
  };

  const startTutorial = () => {
    // Dismiss keyboard first
    Keyboard.dismiss();
    
    setShowTutorialOverlay(true);
    setTutorialStep(0);
    Animated.timing(tutorialAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const nextTutorialStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      finishTutorial();
    }
  };

  const finishTutorial = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(tutorialAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowTutorialOverlay(false);
      navigation.navigate('SignUp', { 
        phoneNumber: selectedCountry.code + phoneNumber,
        verified: true 
      });
    });
  };

  // Developer skip function
  const handleDeveloperSkip = async () => {
    try {
      // Create mock user data for developer skip
      const mockUserData = {
        personal: {
          firstName: 'Developer',
          lastName: 'User',
          email: 'dev@sendnreceive.com'
        },
        security: {
          password: 'devpassword123',
          confirmPassword: 'devpassword123'
        },
        preferences: {
          notifications: true,
          marketing: false
        }
      };
      
      await signup(mockUserData);
      Alert.alert('Developer Mode', 'Skipped to HomeScreen successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to skip to HomeScreen.');
    }
  };

  // Staggered entrance animations
  useEffect(() => {
    Animated.sequence([
      // Globe fade in
      Animated.timing(globeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Wait a bit, then show valutas
      Animated.delay(500),
      // Valutas fade in
      Animated.timing(valutasAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Resend timer effect
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Dropdown animation effect
  useEffect(() => {
    if (showCountryPicker) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showCountryPicker]);

  const detectUserCountry = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.country_code && countryCodeMap[data.country_code]) {
        setSelectedCountry(countryCodeMap[data.country_code]);
      }
    } catch (error) {
      console.log('Could not detect user country:', error);
      // Keep default country (Netherlands)
    }
  };

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setIsSendingCode(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsCodeSent(true);
      setResendTimer(30);
      Alert.alert('Success', 'Verification code sent to your phone');
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit verification code.');
      return;
    }

    // Dismiss keyboard immediately
    Keyboard.dismiss();
    
    setIsVerifyingCode(true);
    setVerificationStep(2);
    const startTime = Date.now();

    // Start progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    // Start globe rotation (removed for now to fix error)
    // Animated.loop(
    //   Animated.timing(globeRotationAnim, {
    //     toValue: 1,
    //     duration: 3000,
    //     useNativeDriver: true,
    //   })
    // ).start();

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const endTime = Date.now();
      setVerificationTime(Math.round((endTime - startTime) / 1000));

      // Success animation sequence
      setShowSuccessAnimation(true);
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
      ]).start(() => {
        // Show biometric setup for new users
        if (mode === 'signup' && isBiometricSupported) {
          setShowBiometricSetup(true);
          setShowSuccessAnimation(false);
        } else {
          // Navigate directly for existing users or unsupported devices
          if (mode === 'signup') {
            navigation.navigate('SignUp', { 
              phoneNumber: selectedCountry.code + phoneNumber,
              verified: true 
            });
          } else {
            navigation.navigate('Login', { 
              phoneNumber: selectedCountry.code + phoneNumber,
              verified: true 
            });
          }
        }
      });

    } catch (error) {
      Alert.alert('Error', 'Invalid verification code. Please try again.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleResendCode = () => {
    if (resendTimer === 0) {
      handleSendCode();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Dark Background */}
      <View style={styles.background} />
      
      {/* Globe Background */}
      <Animated.View style={{ opacity: globeAnim }}>
        <GlobeBackground color="#ffffff" />
      </Animated.View>
      
      {/* Floating Valutas */}
      <Animated.View style={{ opacity: valutasAnim }}>
        <FloatingValutas />
      </Animated.View>

      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <Animated.View 
          style={[
            styles.successOverlay,
            {
              opacity: successAnim,
              transform: [{
                scale: successAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                })
              }]
            }
          ]}
        >
          <View style={styles.successContent}>
            <Animated.View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#10B981" />
            </Animated.View>
            <Text style={styles.successTitle}>Verification Successful!</Text>
            <Text style={styles.successSubtitle}>
              Verified in {verificationTime} seconds
            </Text>
            <Text style={styles.successMessage}>
              99.9% of verifications complete successfully
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Biometric Setup Overlay */}
      {showBiometricSetup && (
        <Animated.View 
          style={[
            styles.biometricOverlay,
            {
              opacity: successAnim,
              transform: [{
                scale: successAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                })
              }]
            }
          ]}
        >
          <View style={styles.biometricContent}>
            <View style={styles.biometricIcon}>
              <Ionicons 
                name={biometricType === 'Face ID' ? 'scan' : 'finger-print'} 
                size={80} 
                color="#2563EB" 
              />
            </View>
            <Text style={styles.biometricTitle}>Set up {biometricType}</Text>
            <Text style={styles.biometricSubtitle}>
              Use {biometricType} for quick and secure access to your account
            </Text>
            
            <View style={styles.biometricButtons}>
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={() => {
                  Keyboard.dismiss();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowBiometricSetup(false);
                  startTutorial();
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#2563EB', '#1D4ED8']}
                  style={styles.biometricButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.biometricButtonText}>Set up {biometricType}</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => {
                  Keyboard.dismiss();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowBiometricSetup(false);
                  startTutorial();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Tutorial Overlay */}
      {showTutorialOverlay && (
        <Animated.View 
          style={[
            styles.tutorialOverlay,
            {
              opacity: tutorialAnim,
            }
          ]}
        >
          <View style={styles.tutorialContent}>
            {/* Progress Dots */}
            <View style={styles.progressDots}>
              {tutorialSteps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index === tutorialStep && styles.progressDotActive
                  ]}
                />
              ))}
            </View>

            {/* Tutorial Step Content */}
            <View style={styles.tutorialStepContent}>
              <View style={[
                styles.tutorialIcon,
                { backgroundColor: tutorialSteps[tutorialStep].color + '20' }
              ]}>
                <Ionicons 
                  name={tutorialSteps[tutorialStep].icon} 
                  size={60} 
                  color={tutorialSteps[tutorialStep].color} 
                />
              </View>
              
              <Text style={styles.tutorialTitle}>
                {tutorialSteps[tutorialStep].title}
              </Text>
              
              <Text style={styles.tutorialSubtitle}>
                {tutorialSteps[tutorialStep].subtitle}
              </Text>
              
              <Text style={styles.tutorialDescription}>
                {tutorialSteps[tutorialStep].description}
              </Text>
            </View>

            {/* Navigation Buttons */}
            <View style={styles.tutorialNavigation}>
              <TouchableOpacity
                style={styles.tutorialSkipButton}
                onPress={finishTutorial}
                activeOpacity={0.7}
              >
                <Text style={styles.tutorialSkipText}>Skip Tutorial</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.tutorialNextButton}
                onPress={nextTutorialStep}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#2563EB', '#1D4ED8']}
                  style={styles.tutorialNextGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.tutorialNextText}>
                    {tutorialStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
                  </Text>
                  <Ionicons 
                    name={tutorialStep === tutorialSteps.length - 1 ? 'rocket' : 'arrow-forward'} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
      
      {/* Country Picker Dropdown - Root Level */}
      {showCountryPicker && (
        <TouchableWithoutFeedback onPress={() => setShowCountryPicker(false)}>
          <Animated.View 
            style={[
              styles.dropdownOverlay,
              {
                opacity: dropdownAnim,
                backgroundColor: dropdownAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.5)'],
                }),
              }
            ]}
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View 
                style={[
                  styles.countryPickerContainer,
                  {
                    transform: [{
                      scale: dropdownAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      })
                    }, {
                      translateY: dropdownAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      })
                    }],
                    opacity: dropdownAnim,
                  }
                ]}
              >
                <Text style={styles.countryPickerTitle}>Select Country</Text>
                                  <ScrollView 
                    style={styles.countryList} 
                    showsVerticalScrollIndicator={false}
                    onScrollBeginDrag={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    scrollEventThrottle={16}
                  >
                                          {popularCountries.map((country, index) => (
                          <TouchableOpacity
                            key={`${country.code}-${country.name}-${index}`}
                            style={[
                              styles.countryItem,
                              selectedCountry.code === country.code && styles.selectedCountryItem
                            ]}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              setSelectedCountry(country);
                              setShowCountryPicker(false);
                            }}
                            activeOpacity={0.7}
                          >
                      <Text style={styles.countryItemFlag}>{country.flag}</Text>
                      <Text style={styles.countryItemName}>{country.name}</Text>
                      <Text style={styles.countryItemCode}>{country.code}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      )}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === 'signup' ? 'Create Account' : 'Verify Phone'}
        </Text>
        <TouchableOpacity
          style={styles.developerSkipButton}
          onPress={handleDeveloperSkip}
          activeOpacity={0.7}
        >
          <Ionicons name="rocket" size={20} color="#F59E0B" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>
            {isCodeSent ? 'Enter Verification Code' : 'Enter Your Phone Number'}
          </Text>
          <Text style={styles.subtitle}>
            {isCodeSent 
              ? `We've sent a code to ${selectedCountry.code} ${phoneNumber}`
              : "We'll send you a verification code to confirm your number"
            }
          </Text>
        </View>

        {!isCodeSent ? (
          /* Phone Number Input */
          <View style={styles.inputSection}>
            {/* Country Code Selector */}
            <View style={styles.countryCodeContainer}>
              <TouchableOpacity
                style={styles.countryCodeButton}
                onPress={() => setShowCountryPicker(!showCountryPicker)}
                activeOpacity={0.7}
              >
                <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                <Text style={styles.countryCode}>{selectedCountry.code}</Text>
                <Ionicons name="chevron-down" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>



            {/* Phone Number Input */}
            <View style={styles.phoneInputContainer}>
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter phone number"
                placeholderTextColor="#64748B"
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                keyboardType="phone-pad"
                maxLength={12}
              />
              <Ionicons name="call" size={20} color="#64748B" style={styles.inputIcon} />
            </View>

            {/* Send Code Button */}
            <TouchableOpacity
              style={[styles.sendCodeButton, isSendingCode && styles.buttonDisabled]}
              onPress={handleSendCode}
              disabled={isSendingCode}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#2563EB', '#1D4ED8']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isSendingCode ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.sendCodeText}>Sending...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#FFFFFF" />
                    <Text style={styles.sendCodeText}>Send Code</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          /* Verification Code Input */
          <View style={styles.inputSection}>
            <View style={styles.codeInputContainer}>
              <TextInput
                style={styles.codeInput}
                placeholder="Enter 6-digit code"
                placeholderTextColor="#64748B"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
              <Ionicons name="key" size={20} color="#64748B" style={styles.inputIcon} />
            </View>

            {/* Progress Indicator */}
            {isVerifyingCode && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <Animated.View 
                    style={[
                      styles.progressFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>Verifying your code...</Text>
              </View>
            )}

            {/* Verify Code Button */}
            <TouchableOpacity
              style={[styles.verifyCodeButton, isVerifyingCode && styles.buttonDisabled]}
              onPress={handleVerifyCode}
              disabled={isVerifyingCode}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#2563EB', '#1D4ED8']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isVerifyingCode ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.verifyCodeText}>Verifying...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    <Text style={styles.verifyCodeText}>Verify Code</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Security Badge */}
            <View style={styles.securityBadge}>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text style={styles.securityText}>Secured by SendNReceive</Text>
            </View>

            {/* Enhanced Resend Options */}
            <View style={styles.resendSection}>
              <TouchableOpacity
                style={styles.resendContainer}
                onPress={handleResendCode}
                disabled={resendTimer > 0}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={16} color={resendTimer > 0 ? "#64748B" : "#2563EB"} />
                <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
                  {resendTimer > 0 
                    ? `Resend SMS in ${resendTimer}s` 
                    : 'Resend SMS'
                  }
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.resendContainer}
                onPress={() => Alert.alert('Call Option', 'Call verification would be implemented here')}
                activeOpacity={0.7}
              >
                <Ionicons name="call" size={16} color="#2563EB" />
                <Text style={styles.resendText}>Call me instead</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Alternative Options */}
        <View style={styles.alternativeSection}>
          <TouchableOpacity
            style={styles.alternativeButton}
            onPress={() => {
              if (mode === 'signup') {
                navigation.navigate('Login');
              } else {
                navigation.navigate('Welcome');
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.alternativeText}>
              {mode === 'signup' ? 'Already have an account?' : 'Continue with email'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  developerSkipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  titleSection: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    fontFamily: 'Montserrat',
    lineHeight: 24,
  },
  inputSection: {
    gap: 24,
  },
  countryCodeContainer: {
    alignItems: 'center',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 8,
  },
  countryFlag: {
    fontSize: 20,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryPickerContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    maxHeight: 300,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    // Glassmorphism effect
    backdropFilter: 'blur(20px)',
  },
  countryPickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  countryList: {
    maxHeight: 240,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  countryItemFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  countryItemName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Montserrat',
  },
  countryItemCode: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    fontFamily: 'Montserrat',
  },
  selectedCountryItem: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  phoneInputContainer: {
    position: 'relative',
  },
  phoneInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingLeft: 50,
  },
  codeInputContainer: {
    position: 'relative',
  },
  codeInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingLeft: 50,
    letterSpacing: 4,
  },
  inputIcon: {
    position: 'absolute',
    left: 20,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  sendCodeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  verifyCodeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  sendCodeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
  },
  verifyCodeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  resendText: {
    fontSize: 14,
    color: '#2563EB',
    fontFamily: 'Montserrat',
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: '#64748B',
  },
  alternativeSection: {
    marginTop: 40,
    alignItems: 'center',
  },
  alternativeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  alternativeText: {
    fontSize: 16,
    color: '#94A3B8',
    fontFamily: 'Montserrat',
    fontWeight: '500',
  },
  // Enhanced verification styles
  progressContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  progressText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 8,
    fontFamily: 'Montserrat',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  securityText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'Montserrat',
  },
  resendSection: {
    marginTop: 20,
    gap: 12,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Montserrat',
  },
  successSubtitle: {
    fontSize: 18,
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Montserrat',
  },
  successMessage: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  // Biometric setup styles
  biometricOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  biometricContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  biometricIcon: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(37, 99, 235, 0.3)',
  },
  biometricTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Montserrat',
  },
  biometricSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontFamily: 'Montserrat',
  },
  biometricButtons: {
    width: '100%',
    gap: 16,
  },
  biometricButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  biometricButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  biometricButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
  },
  skipButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#94A3B8',
    fontFamily: 'Montserrat',
    fontWeight: '600',
  },
  // Tutorial styles
  tutorialOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  tutorialContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    backgroundColor: '#2563EB',
    width: 24,
  },
  tutorialStepContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tutorialIcon: {
    padding: 24,
    borderRadius: 50,
    marginBottom: 32,
  },
  tutorialTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Montserrat',
  },
  tutorialSubtitle: {
    fontSize: 20,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Montserrat',
    fontWeight: '600',
  },
  tutorialDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Montserrat',
  },
  tutorialNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tutorialSkipButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  tutorialSkipText: {
    fontSize: 16,
    color: '#94A3B8',
    fontFamily: 'Montserrat',
    fontWeight: '600',
  },
  tutorialNextButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tutorialNextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  tutorialNextText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
  },
});

export default PhoneVerificationScreen;
