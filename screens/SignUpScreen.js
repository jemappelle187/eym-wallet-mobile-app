import React, { useState } from 'react';
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
import PrimaryButton from '../components/PrimaryButton';

const { width, height } = Dimensions.get('window');

const SignUpScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email) => {
    // Simple email regex
    return /^\S+@\S+\.\S+$/.test(email);
  };

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }
    if (!validateEmail(email.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters long.');
      return;
    }
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    Alert.alert('Success', 'Sign up successful! Please proceed to login.');
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
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
                />
                <Text style={[Typography.bodyRegular, styles.tagline]}>
                  Fast, Secure, and Zero Fee Transactions
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Sign Up Form Section */}
          <View style={styles.formSection}>
            <View style={styles.formContainer}>
              <Text style={[Typography.h2, styles.welcomeText]}>Create Account</Text>
              <Text style={[Typography.bodyRegular, styles.subtitleText]}>
                Start your journey with SendNReceive
              </Text>

              {/* Full Name Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!isLoading}
                  autoComplete="name"
                />
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                  autoComplete="email"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                  autoComplete="new-password"
                />
                <TouchableOpacity 
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={Colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor={Colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  editable={!isLoading}
                  autoComplete="new-password"
                />
                <TouchableOpacity 
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={Colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>

              {/* Terms and Conditions */}
              <View style={styles.termsContainer}>
                <Text style={[Typography.bodySmall, styles.termsText]}>
                  By creating an account, you agree to our{' '}
                  <Text style={[Typography.link, styles.termsLink]}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={[Typography.link, styles.termsLink]}>Privacy Policy</Text>
                </Text>
              </View>

              {/* Sign Up Button */}
              <PrimaryButton
                title="Create Account"
                onPress={handleSignUp}
                loading={isLoading}
                disabled={isLoading}
              />

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={[Typography.bodySmall, styles.dividerText]}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Sign Up Buttons */}
              <View style={styles.socialButtonsContainer}>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-google" size={20} color={Colors.textPrimary} />
                  <Text style={[Typography.buttonSmall, styles.socialButtonText]}>Google</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-apple" size={20} color={Colors.textPrimary} />
                  <Text style={[Typography.buttonSmall, styles.socialButtonText]}>Apple</Text>
                </TouchableOpacity>
              </View>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={[Typography.bodyRegular, styles.loginText]}>
                  Already have an account?{' '}
                  <Text 
                    style={[Typography.link, styles.loginLink]}
                    onPress={() => navigation.navigate('Login')}
                  >
                    Sign In
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
    backgroundColor: Colors.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: Colors.primary,
  },
  
  // Premium Header Section
  headerSection: {
    height: height * 0.35 + (Platform.OS === 'ios' ? 44 : 24), // Add status bar height
    overflow: 'hidden',
    paddingTop: Platform.OS === 'ios' ? 44 : 24, // Add padding for status bar
    backgroundColor: Colors.primary,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 4,
    tintColor: Colors.textInverse,
  },
  tagline: {
    color: Colors.textInverse,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Form Section
  formSection: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingTop: 20,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  welcomeText: {
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  
  // Premium Input Fields
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIconContainer: {
    marginRight: 12,
  },
  input: {
    ...Typography.bodyRegular,
    flex: 1,
    color: Colors.textPrimary,
    height: '100%',
  },
  passwordToggle: {
    padding: 4,
  },
  
  // Terms and Conditions
  termsContainer: {
    marginBottom: 24,
  },
  termsText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary,
  },
  
  // Premium Sign Up Button
  signUpButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.textInverse,
    marginLeft: 8,
  },
  
  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  dividerText: {
    color: Colors.textSecondary,
    marginHorizontal: 16,
  },
  
  // Social Sign Up Buttons
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  socialButtonText: {
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  
  // Login Link
  loginContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  loginText: {
    color: Colors.textSecondary,
  },
  loginLink: {
    color: Colors.primary,
  },
});

export default SignUpScreen; 