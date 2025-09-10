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
  ScrollView,
  Animated,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import GlobeBackground from '../components/GlobeBackground';
import FloatingValutas from '../components/FloatingValutas';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const SignUpScreen = ({ navigation, route }) => {
  const { phoneNumber, verified, skipPhone } = route.params || {};
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Multi-step profile completion
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(3);
  const [profileData, setProfileData] = useState({
    personal: { firstName: '', lastName: '', email: '' },
    security: { password: '', confirmPassword: '' },
    preferences: { notifications: true, marketing: false }
  });
  
  // Animation refs
  const stepAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const globeAnim = useRef(new Animated.Value(0)).current;
  const valutasAnim = useRef(new Animated.Value(0)).current;

  // Staggered entrance animations
  useEffect(() => {
    Animated.sequence([
      Animated.timing(globeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.delay(500),
      Animated.timing(valutasAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Step animation effect
  useEffect(() => {
    Animated.timing(stepAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);

  const nextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      stepAnim.setValue(0);
    } else {
      handleCompleteSignUp();
    }
  };

  const prevStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      stepAnim.setValue(0);
    }
  };

  const handleCompleteSignUp = async () => {
    setIsLoading(true);
    try {
      // Use AuthContext signup function
      await signup(profileData);
      // The AuthContext will handle navigation automatically
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Developer skip function
  const handleDeveloperSkip = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', `${(currentStep / totalSteps) * 100}%`],
                }),
              }
            ]}
          />
        </View>
        <Text style={styles.progressText}>Step {currentStep} of {totalSteps}</Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <TouchableOpacity
          style={styles.developerSkipButton}
          onPress={handleDeveloperSkip}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Ionicons name="rocket" size={20} color="#F59E0B" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step Content */}
        <Animated.View 
          style={[
            styles.stepContent,
            {
              opacity: stepAnim,
              transform: [{
                translateX: stepAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                })
              }]
            }
          ]}
        >
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <Ionicons name="person" size={32} color="#2563EB" />
                <Text style={styles.stepTitle}>Personal Information</Text>
                <Text style={styles.stepSubtitle}>Tell us about yourself</Text>
              </View>
              
              <View style={styles.formFields}>
                <View style={styles.nameRow}>
                  <View style={styles.nameField}>
                    <TextInput
                      style={styles.input}
                      placeholder="First name"
                      placeholderTextColor="#64748B"
                      value={profileData.personal.firstName}
                      onChangeText={(text) => setProfileData({
                        ...profileData,
                        personal: { ...profileData.personal, firstName: text }
                      })}
                    />
                  </View>
                  <View style={styles.nameField}>
                    <TextInput
                      style={styles.input}
                      placeholder="Last name"
                      placeholderTextColor="#64748B"
                      value={profileData.personal.lastName}
                      onChangeText={(text) => setProfileData({
                        ...profileData,
                        personal: { ...profileData.personal, lastName: text }
                      })}
                    />
                  </View>
                </View>
                
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="#64748B"
                    keyboardType="email-address"
                    value={profileData.personal.email}
                    onChangeText={(text) => setProfileData({
                      ...profileData,
                      personal: { ...profileData.personal, email: text }
                    })}
                  />
                  <Ionicons name="mail" size={20} color="#64748B" style={styles.inputIcon} />
                </View>
              </View>
            </View>
          )}

          {/* Step 2: Security Setup */}
          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <Ionicons name="shield-checkmark" size={32} color="#10B981" />
                <Text style={styles.stepTitle}>Security Setup</Text>
                <Text style={styles.stepSubtitle}>Create a strong password</Text>
              </View>
              
              <View style={styles.formFields}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Create password"
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showPassword}
                    value={profileData.security.password}
                    onChangeText={(text) => setProfileData({
                      ...profileData,
                      security: { ...profileData.security, password: text }
                    })}
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#64748B" 
                    />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm password"
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showConfirmPassword}
                    value={profileData.security.confirmPassword}
                    onChangeText={(text) => setProfileData({
                      ...profileData,
                      security: { ...profileData.security, confirmPassword: text }
                    })}
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggle}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#64748B" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Step 3: Preferences */}
          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <Ionicons name="settings" size={32} color="#F59E0B" />
                <Text style={styles.stepTitle}>Preferences</Text>
                <Text style={styles.stepSubtitle}>Customize your experience</Text>
              </View>
              
              <View style={styles.formFields}>
                <TouchableOpacity 
                  style={styles.preferenceItem}
                  onPress={() => setProfileData({
                    ...profileData,
                    preferences: { 
                      ...profileData.preferences, 
                      notifications: !profileData.preferences.notifications 
                    }
                  })}
                >
                  <View style={styles.preferenceContent}>
                    <Ionicons name="notifications" size={24} color="#2563EB" />
                    <View style={styles.preferenceText}>
                      <Text style={styles.preferenceTitle}>Push Notifications</Text>
                      <Text style={styles.preferenceSubtitle}>Get updates about your transactions</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.toggle,
                    profileData.preferences.notifications && styles.toggleActive
                  ]}>
                    <View style={[
                      styles.toggleThumb,
                      profileData.preferences.notifications && styles.toggleThumbActive
                    ]} />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.preferenceItem}
                  onPress={() => setProfileData({
                    ...profileData,
                    preferences: { 
                      ...profileData.preferences, 
                      marketing: !profileData.preferences.marketing 
                    }
                  })}
                >
                  <View style={styles.preferenceContent}>
                    <Ionicons name="megaphone" size={24} color="#F59E0B" />
                    <View style={styles.preferenceText}>
                      <Text style={styles.preferenceTitle}>Marketing Updates</Text>
                      <Text style={styles.preferenceSubtitle}>Receive offers and promotions</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.toggle,
                    profileData.preferences.marketing && styles.toggleActive
                  ]}>
                    <View style={[
                      styles.toggleThumb,
                      profileData.preferences.marketing && styles.toggleThumbActive
                    ]} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={prevStep}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color="#94A3B8" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.nextButton}
            onPress={nextStep}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#2563EB', '#1D4ED8']}
              style={styles.nextButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>
                    {currentStep === totalSteps ? 'Create Account' : 'Next'}
                  </Text>
                  <Ionicons 
                    name={currentStep === totalSteps ? 'checkmark' : 'arrow-forward'} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Developer Skip Button */}
        <TouchableOpacity
          style={styles.developerSkipLargeButton}
          onPress={handleDeveloperSkip}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(245, 158, 11, 0.2)', 'rgba(251, 191, 36, 0.2)']}
            style={styles.developerSkipGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="rocket" size={24} color="#F59E0B" />
            <Text style={styles.developerSkipText}>🚀 Developer Skip</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
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
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
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
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  progressText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 8,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  formFields: {
    gap: 20,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameField: {
    flex: 1,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingLeft: 50,
  },
  inputIcon: {
    position: 'absolute',
    left: 20,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  passwordToggle: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  preferenceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceText: {
    marginLeft: 16,
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
  },
  preferenceSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontFamily: 'Montserrat',
    marginTop: 2,
  },
  toggle: {
    width: 44,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#2563EB',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#94A3B8',
    fontFamily: 'Montserrat',
    fontWeight: '600',
    marginLeft: 8,
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
  },
  developerSkipLargeButton: {
    marginTop: 20,
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  developerSkipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  developerSkipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
    fontFamily: 'Montserrat',
  },
});

export default SignUpScreen; 