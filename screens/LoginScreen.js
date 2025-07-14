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
  StatusBar
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { AuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const { login, isLoading } = useContext(AuthContext);
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  const handleEmailFocus = () => {
    setEmailFocused(true);
  };

  const handleEmailBlur = () => {
    setEmailFocused(false);
  };

  const handlePasswordFocus = () => {
    setPasswordFocused(true);
  };

  const handlePasswordBlur = () => {
    setPasswordFocused(false);
  };

  const validateEmail = (email) => {
    // Simple email regex
    return /^\S+@\S+\.\S+$/.test(email);
  };

  const handleLoginPress = () => {
    if (!email.trim() || !password.trim()) {
        Alert.alert("Validation Error", "Please enter both email and password.");
        return;
    }
    if (!validateEmail(email.trim())) {
        Alert.alert("Validation Error", "Please enter a valid email address.");
        return;
    }
    login(email, password);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Premium Header Section */}
          <View style={styles.headerSection}>
            <LinearGradient
              colors={Colors.gradientPrimary}
              style={styles.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.logoContainer}>
                <Image
                  source={require('../assets/images/sendnreceive_logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                  tintColor={Colors.textInverse}
                />
                <Text style={[Typography.bodyRegular, styles.tagline]}>
                  Zero Fees • Whenever and Wherever
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Login Form Section */}
          <View style={styles.formSection}>
            <View style={styles.formContainer}>
              <Text style={[Typography.h1, styles.welcomeText, { color: colors.textPrimary }]}>Welcome Back</Text>
              <Text style={[Typography.bodyRegular, styles.subtitleText, { color: colors.textMuted }]}>
                Sign in to continue to your account
              </Text>

              {/* Email Input with Floating Label */}
              <View style={styles.inputWrapper}>
                <View style={[
                  styles.inputContainer, 
                  { 
                    backgroundColor: colors.background, 
                    borderColor: emailFocused ? colors.primary : colors.border 
                  }
                ]}>
                <View style={styles.inputIconContainer}>
                    <Ionicons 
                      name="mail-outline" 
                      size={20} 
                      color={emailFocused ? colors.primary : colors.textMuted} 
                    />
                </View>
                  <View style={styles.inputContent}>
                    {(emailFocused || email) && (
                      <Text style={[
                        styles.floatingLabel, 
                        { 
                          color: emailFocused ? colors.primary : colors.textMuted,
                          transform: [{ translateY: -8 }],
                          fontSize: 12,
                        }
                      ]}>
                        Email Address
                      </Text>
                    )}
                <TextInput
                      style={[styles.input, { color: colors.textPrimary }]}
                  value={email}
                  onChangeText={setEmail}
                      onFocus={handleEmailFocus}
                      onBlur={handleEmailBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                  autoComplete="email"
                      placeholder={emailFocused || email ? "" : "Enter your email"}
                      placeholderTextColor={colors.textMuted}
                />
                  </View>
                </View>
              </View>

              {/* Password Input with Floating Label */}
              <View style={styles.inputWrapper}>
                <View style={[
                  styles.inputContainer, 
                  { 
                    backgroundColor: colors.background, 
                    borderColor: passwordFocused ? colors.primary : colors.border 
                  }
                ]}>
                <View style={styles.inputIconContainer}>
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={20} 
                      color={passwordFocused ? colors.primary : colors.textMuted} 
                    />
                </View>
                  <View style={styles.inputContent}>
                    {(passwordFocused || password) && (
                      <Text style={[
                        styles.floatingLabel, 
                        { 
                          color: passwordFocused ? colors.primary : colors.textMuted,
                          transform: [{ translateY: -8 }],
                          fontSize: 12,
                        }
                      ]}>
                        Password
                      </Text>
                    )}
                <TextInput
                      style={[styles.input, { color: colors.textPrimary }]}
                  value={password}
                  onChangeText={setPassword}
                      onFocus={handlePasswordFocus}
                      onBlur={handlePasswordBlur}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                  autoComplete="password"
                      placeholder={passwordFocused || password ? "" : "Enter your password"}
                      placeholderTextColor={colors.textMuted}
                />
                  </View>
                <TouchableOpacity 
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                      color={passwordFocused ? colors.primary : colors.textMuted} 
                  />
                </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity style={styles.forgotPasswordContainer} activeOpacity={0.7}>
                <Text style={[Typography.link, styles.forgotPasswordText, { color: colors.primary }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                onPress={handleLoginPress}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isLoading ? [Colors.textMuted, Colors.textMuted] : Colors.gradientPrimary}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.textInverse} size="small" />
                  ) : (
                    <>
                      <Ionicons name="log-in-outline" size={20} color={Colors.textInverse} />
                      <Text style={[Typography.button, styles.buttonText]}>Sign In</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[Typography.bodySmall, styles.dividerText, { color: colors.textMuted }]}>or</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              {/* Social Login Buttons */}
              <View style={styles.socialButtonsContainer}>
                <TouchableOpacity style={[styles.socialButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]} activeOpacity={0.8}>
                  <Ionicons name="logo-google" size={20} color={colors.textPrimary} />
                  <Text style={[Typography.buttonSmall, styles.socialButtonText, { color: colors.textPrimary }]}>Google</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.socialButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]} activeOpacity={0.8}>
                  <Ionicons name="logo-apple" size={20} color={colors.textPrimary} />
                  <Text style={[Typography.buttonSmall, styles.socialButtonText, { color: colors.textPrimary }]}>Apple</Text>
                </TouchableOpacity>
              </View>

              {/* Sign Up Link */}
              <View style={styles.signUpContainer}>
                <Text style={[Typography.bodyRegular, styles.signUpText, { color: colors.textMuted }]}>
                  Don't have an account?{' '}
                  <Text 
                    style={[Typography.link, styles.signUpLink, { color: colors.primary }]}
                    onPress={() => navigation.navigate('SignUp')}
                  >
                    Sign Up
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
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
  },
  logoImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  tagline: {
    color: Colors.textInverse,
    textAlign: 'center',
    opacity: 0.9,
  },
  formSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  formContainer: {
    flex: 1,
  },
  welcomeText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    textAlign: 'center',
    marginBottom: 32,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 18, // Increased to give label more space
    paddingBottom: 6,
    marginBottom: 0,
    backgroundColor: '#fff',
    minHeight: 54,
  },
  inputIconContainer: {
    marginRight: 8,
    marginTop: -2,
  },
  inputContent: {
    flex: 1,
    position: 'relative',
  },
  floatingLabel: {
    position: 'absolute',
    left: 0,
    top: -14, // Move label further up
    fontSize: 12,
    zIndex: 2,
    backgroundColor: 'transparent',
    paddingHorizontal: 2,
    fontWeight: '500',
  },
  input: {
    height: 28,
    fontSize: 16,
    paddingTop: 6,
    paddingBottom: 0,
    color: '#111827',
    backgroundColor: 'transparent',
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
  },
  loginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: Colors.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    color: Colors.textInverse,
    fontWeight: '600',
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
  socialButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  socialButtonText: {
    fontWeight: '600',
  },
  signUpContainer: {
    alignItems: 'center',
  },
  signUpText: {
    textAlign: 'center',
  },
  signUpLink: {
    fontWeight: '600',
  },
});

export default LoginScreen; 