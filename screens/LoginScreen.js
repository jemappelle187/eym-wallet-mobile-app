import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Image,
  StatusBar,
  Animated,
  Easing,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { AuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { BlurView } from 'expo-blur';
import GlobeBackground from '../components/GlobeBackground';
import FloatingValutas from '../components/FloatingValutas';



const { width, height } = Dimensions.get('window');

// Popular country codes for remittance app
const popularCountries = [
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+1', flag: '🇨🇦', name: 'Canada' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: '+31', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+34', flag: '🇪🇸', name: 'Spain' },
  { code: '+39', flag: '🇮🇹', name: 'Italy' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
].sort((a, b) => {
  // Remove '+' and convert to number for proper sorting
  const codeA = parseInt(a.code.replace('+', ''));
  const codeB = parseInt(b.code.replace('+', ''));
  return codeA - codeB;
});

const LoginScreen = ({ navigation }) => {
  const { login, isLoading } = useContext(AuthContext);
  const { colors = Colors } = useTheme();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState({ code: '+1', flag: '🇺🇸', name: 'United States' });
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  
  // Animation refs
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const globeAnim = React.useRef(new Animated.Value(0)).current;
  const valutasAnim = React.useRef(new Animated.Value(0)).current;
  const codeBorderAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    // Staggered entrance animations
    Animated.sequence([
      // Main content fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
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

  const logoAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(logoAnim, {
      toValue: 1,
      duration: 900,
      delay: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  // Diagonal shimmer animation: move from top left to bottom right
  const shimmerTranslate = React.useRef(new Animated.Value(-1)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerTranslate, {
        toValue: 1,
        duration: 2200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  }, []);





  // Resend timer effect
  React.useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Code border animation effect
  React.useEffect(() => {
    if (showVerificationCode) {
      Animated.timing(codeBorderAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(codeBorderAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [showVerificationCode]);





  const validatePhoneNumber = (phone) => {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    // Check if it's a valid international phone number (7-15 digits)
    return cleanPhone.length >= 7 && cleanPhone.length <= 15;
  };

  const formatPhoneNumber = (text) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format based on length (basic formatting)
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const validateVerificationCode = (code) => {
    // Check if it's a 6-digit code
    return /^\d{6}$/.test(code);
  };

  const handleSendCode = () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Validation Error", "Please enter your phone number.");
      return;
    }
    if (!validatePhoneNumber(phoneNumber.trim())) {
      setPhoneError(true);
      Alert.alert("Validation Error", "Please enter a valid phone number.");
      return;
    }
    setPhoneError(false);
    // Simulate sending verification code
    setIsCodeSent(true);
    setResendTimer(60); // 60 second cooldown
    Alert.alert("Code Sent", `Verification code sent to ${selectedCountry.code} ${phoneNumber}`);
  };

  const handleResendCode = () => {
    if (resendTimer > 0) return;
    setResendTimer(60);
    Alert.alert("Code Resent", `New verification code sent to ${selectedCountry.code} ${phoneNumber}`);
  };

  const handleVerifyCode = () => {
    if (!verificationCode.trim()) {
      Alert.alert("Validation Error", "Please enter the verification code.");
      return;
    }
    if (!validateVerificationCode(verificationCode.trim())) {
      setCodeError(true);
      Alert.alert("Validation Error", "Please enter a valid 6-digit code.");
      return;
    }
    setCodeError(false);
    // Simulate verification and login
    login(phoneNumber, verificationCode);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0f172a' }]} edges={['left', 'right']}>
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
      
      {/* Country Picker Dropdown - Root Level */}
      {showCountryPicker && (
        <TouchableWithoutFeedback onPress={() => setShowCountryPicker(false)}>
          <View style={styles.dropdownOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.countryPickerContainer}>
                <Text style={styles.countryPickerTitle}>Select Country</Text>
                <ScrollView style={styles.countryList} showsVerticalScrollIndicator={false}>
                  {popularCountries.map((country, index) => (
                    <TouchableOpacity
                      key={`${country.code}-${country.name}-${index}`}
                      style={styles.countryItem}
                      onPress={() => {
                        setSelectedCountry(country);
                        setShowCountryPicker(false);
                      }}
                    >
                      <Text style={styles.countryItemFlag}>{country.flag}</Text>
                      <Text style={styles.countryItemName}>{country.name}</Text>
                      <Text style={styles.countryItemCode}>{country.code}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}
      
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
              <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Compact Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          {/* Login Form Section */}
          <View style={styles.formSectionAligned}>
            <View style={styles.formContainer}>
                  <Text style={styles.loginTitle}>Welcome Back</Text>
                  <Text style={[Typography.bodyRegular, styles.subtitleText, { color: '#e0e7ef' }]}>Sign in to continue to your account</Text>
                  
                  {/* Phone Number Input */}
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
                  </View>

                  {/* Verification Code Input (shown after code is sent) */}
                  {isCodeSent && (
                    <View style={styles.inputWrapper}>
                      <Animated.View style={[
                        styles.inputContainer, 
                        { 
                          backgroundColor: '#ffffff', 
                          borderColor: codeError ? '#EF4444' : codeBorderAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['rgba(255,255,255,0.22)', '#3B82F6'],
                          }),
                          borderWidth: codeError ? 2 : codeBorderAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1.5, 2],
                          }),
                          shadowOpacity: codeError ? 0.3 : codeBorderAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.10, 0.25],
                          }),
                          shadowColor: codeError ? '#EF4444' : '#3B82F6',
                        }
                      ]}>
                      <View style={styles.inputIconContainer}>
                          <Animated.View style={{
                            transform: [{
                              scale: codeBorderAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 1.1],
                              })
                            }]
                          }}>
                            <Ionicons 
                              name="key-outline" 
                              size={20} 
                              color={codeError ? '#EF4444' : codeFocused ? '#3B82F6' : '#e0e7ef'} 
                            />
                          </Animated.View>
                      </View>
                        <View style={styles.inputContent}>
                          <Animated.Text style={[
                            styles.floatingLabel, 
                            { 
                              color: codeFocused ? '#3B82F6' : '#e0e7ef',
                              backgroundColor: 'rgba(30, 58, 138, 1)',
                              opacity: codeLabelAnim,
                              transform: [{
                                translateY: codeLabelAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, -8],
                                })
                              }, {
                                scale: codeLabelAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.8, 1],
                                })
                              }],
                              fontSize: 12,
                            }
                          ]}>
                            Verification Code
                          </Animated.Text>
                      <TextInput
                            style={[styles.input, { color: '#000' }]}
                        value={verificationCode}
                        onChangeText={setVerificationCode}
                        keyboardType="number-pad"
                        autoCapitalize="none"
                        editable={!isLoading}
                        maxLength={6}
                            placeholder="Enter 6-digit code"
                            placeholderTextColor="rgba(0, 0, 0, 0.6)"
                      />
                        </View>
                      </Animated.View>
                    </View>
                  )}

                  {/* Send Code / Verify Code Button */}
                  <TouchableOpacity
                    style={[styles.loginButton, (isSendingCode || isVerifyingCode) && styles.buttonDisabled]}
                    onPress={isCodeSent ? handleVerifyCode : handleSendCode}
                    disabled={isSendingCode || isVerifyingCode}
                    activeOpacity={0.8}
                  >
                    <Animated.View style={{ transform: [{ scale: (isSendingCode || isVerifyingCode) ? 1 : 0.98 }] }}>
                        <View style={styles.buttonGradient}>
                          {(isSendingCode || isVerifyingCode) ? (
                            <>
                              <ActivityIndicator color={'#2563EB'} size="small" />
                              <Text style={[Typography.button, styles.buttonText, { color: '#2563EB', marginLeft: 8 }]}>
                                {isSendingCode ? 'Sending...' : 'Verifying...'}
                              </Text>
                            </>
                          ) : (
                            <>
                              <Ionicons 
                                name={isCodeSent ? "checkmark-outline" : "send-outline"} 
                                size={20} 
                                color={'#2563EB'} 
                              />
                              <Text style={[Typography.button, styles.buttonText, { color: '#2563EB' }]}>
                                {isCodeSent ? 'Verify Code' : 'Send Code'}
                              </Text>
                            </>
                          )}
                        </View>
                    </Animated.View>
                  </TouchableOpacity>

                  {/* Resend Code Link with Timer (shown after code is sent) */}
                  {isCodeSent && (
                    <TouchableOpacity 
                      style={styles.forgotPasswordContainer} 
                      activeOpacity={resendTimer > 0 ? 1 : 0.7}
                      onPress={handleResendCode}
                      disabled={resendTimer > 0}
                    >
                      <Text style={[
                        Typography.link, 
                        styles.forgotPasswordText, 
                        { 
                          color: resendTimer > 0 ? 'rgba(255,255,255,0.5)' : '#fff' 
                        }
                      ]}>
                        {resendTimer > 0 
                          ? `Resend code in ${resendTimer}s` 
                          : "Didn't receive code? Resend"
                        }
                      </Text>
                    </TouchableOpacity>
                  )}
                  {/* Network Status & Alternative Login */}
                  <View style={styles.bottomOptionsContainer}>
                    {networkError && (
                      <View style={styles.networkErrorContainer}>
                        <Ionicons name="wifi-outline" size={16} color="#EF4444" />
                        <Text style={styles.networkErrorText}>Check your connection</Text>
                      </View>
                    )}
                    

                  </View>



                  {/* Divider */}
                  <View style={styles.dividerContainer}>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                    <Text style={[Typography.bodySmall, styles.dividerText, { color: colors.textMuted }]}>or</Text>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                  </View>



                  {/* Social Login Buttons */}
                  <View style={styles.socialButtonsContainer}>
                    <TouchableOpacity 
                      style={[styles.emailButton]} 
                      activeOpacity={0.8}
                      onPress={() => {
                        Alert.alert('Email Login', 'Email login functionality would be implemented here');
                      }}
                    >
                      <Ionicons name="mail-outline" size={20} color="#ffffff" />
                      <Text style={[styles.socialButtonText, { color: '#ffffff' }]}>Continue with Email</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.googleButton]} 
                      activeOpacity={0.8}
                      onPress={() => {
                        Alert.alert('Google Login', 'Google login functionality would be implemented here');
                      }}
                    >
                      <View style={styles.googleIconContainer}>
                        <Text style={styles.googleG}>G</Text>
                      </View>
                      <Text style={[styles.socialButtonText, { color: '#ffffff' }]}>Continue with Google</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.appleButton]} 
                      activeOpacity={0.8}
                      onPress={() => {
                        Alert.alert('Apple Login', 'Apple login functionality would be implemented here');
                      }}
                    >
                      <Ionicons name="logo-apple" size={20} color="#ffffff" />
                      <Text style={[styles.socialButtonText, { color: '#ffffff' }]}>Continue with Apple</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Sign Up Link */}
                  <View style={styles.signUpContainer}>
                    <Text style={[Typography.bodyRegular, styles.signUpText, { color: '#e0e7ef' }]}>
                      Don't have an account?{' '}
                      <Text 
                        style={[Typography.link, styles.signUpLink, { color: '#fff' }]}
                        onPress={() => navigation.navigate('PhoneVerification', { mode: 'signup' })}
                      >
                        Sign Up
                      </Text>
                    </Text>
                  </View>
            </View>
          </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
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
  scrollContent: {
    flexGrow: 1,
  },
  headerSection: {
    height: height * 0.35,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24, // Space between logo and card
  },
  logoImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
  },
  tagline: {
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  formSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  formSectionAligned: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    paddingHorizontal: 24,
    marginTop: height * 0.2,
    zIndex: 1,
  },
  formContainer: {
    flex: 1,
    paddingVertical: 20,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  welcomeText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#e0e7ef', // light gray for subtitle
  },
  inputSection: {
    gap: 24,
    marginBottom: 20,
  },
  phoneInputContainer: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 20,
    top: '50%',
    transform: [{ translateY: -10 }],
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
  passwordToggle: {
    padding: 8,
    marginLeft: 8,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontWeight: '500',
    color: '#fff',
  },
  loginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    // Enhanced glassmorphism
    backdropFilter: 'blur(12px)',
    // Add transform for scale animation on press (handled in JSX)
},
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    backgroundColor: 'transparent',
    borderRadius: 16,
    borderWidth: 0,
    borderColor: 'transparent',
},
  buttonText: {
    color: Colors.textInverse,
    fontWeight: '700',
    letterSpacing: 0.2,
},
  buttonDisabled: {
    opacity: 0.6,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontWeight: '500',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  socialButtonsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 12,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 8,
    // Enhanced glassmorphism
    backdropFilter: 'blur(8px)',
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4285F4',
    fontFamily: 'Montserrat',
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 12,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    // Enhanced glassmorphism
    backdropFilter: 'blur(8px)',
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 12,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    // Enhanced glassmorphism
    backdropFilter: 'blur(8px)',
  },
  socialButtonText: {
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'Montserrat',
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
    fontSize: 16,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
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


  bottomOptionsContainer: {
    marginBottom: 16,
  },
  networkErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  networkErrorText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 6,
    fontFamily: 'Montserrat',
  },


  signUpContainer: {
    alignItems: 'center',
  },
  signUpText: {
    textAlign: 'center',
    color: '#e0e7ef',
  },
  signUpLink: {
    fontWeight: '600',
  },
  glassCard: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    overflow: 'hidden',
  },
  glassCardAligned: {
    borderRadius: 32,
    padding: 36,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#1e40af',
    shadowOpacity: 0.25,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 12 },
    elevation: 20,
    overflow: 'hidden',
    marginBottom: 0,
    // Enhanced glassmorphism effect
    backdropFilter: 'blur(20px)',
},
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a',
    zIndex: -2,
  },
  trustBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 12,
    backgroundColor: 'rgba(127,156,245,0.08)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'center',
  },
  trustBadgeText: {
    fontSize: 13,
    color: '#e0e7ef',
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  taglineBelowCardContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  taglineBelowCard: {
    color: '#e0e7ef',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.95,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  litHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    borderRadius: 28,
    opacity: 0.7,
    // Optionally, you can use transform to rotate for a more diagonal effect
    // transform: [{ rotate: '12deg' }],
  },
  buttonGlassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 20,
},
});

export default LoginScreen; 