import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native'; // For mock login messages
import { saveToken, getToken, deleteToken } from '../utils/SecureTokenStorage';
import * as LocalAuthentication from 'expo-local-authentication';
import { saveBiometricEnabled, getBiometricEnabled, deleteBiometricEnabled } from '../utils/SecureTokenStorage';

// Create Context
export const AuthContext = createContext();

// Create Provider Component
export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); // To store user data (e.g., { fullName: 'Demo User', kycStatus: 'not_verified' })
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Check for biometric preference and token on app load
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        console.log('Checking biometric preference...');
        const enabled = await getBiometricEnabled();
        setBiometricEnabled(enabled);
        
        const token = await getToken();
        console.log('Token found:', !!token);
        
        if (token) {
          if (enabled) {
            // Check if biometric is available and enrolled
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            console.log('Biometric hardware:', hasHardware, 'Enrolled:', isEnrolled);
            
            if (hasHardware && isEnrolled) {
              // Attempt biometric authentication
              const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to unlock your wallet',
                fallbackLabel: 'Use Security Code',
                disableDeviceFallback: false,
                cancelLabel: 'Cancel',
              });
              console.log('Biometric result:', result);
              
              if (result.success) {
                // Biometric success, set authenticated and user
                setIsAuthenticated(true);
                setUser({ fullName: 'Demo User', kycStatus: 'not_verified' }); // Placeholder user
              } else {
                // Biometric failed, but user might want to use security code
                // For now, we'll require re-authentication
                setIsAuthenticated(false);
                setUser(null);
                await deleteToken();
                Alert.alert('Authentication Required', 'Please log in again to access your wallet.');
              }
            } else {
              // Biometric not available, fall back to token-based auth
              setIsAuthenticated(true);
              setUser({ fullName: 'Demo User', kycStatus: 'not_verified' });
            }
          } else {
            // Biometric not enabled, use token-based auth
            setIsAuthenticated(true);
            setUser({ fullName: 'Demo User', kycStatus: 'not_verified' });
          }
        } else {
          // No token found, user needs to log in
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (e) {
        console.log('Error during biometric/token check:', e);
        // On error, fall back to token-based auth
        const token = await getToken();
        if (token) {
          setIsAuthenticated(true);
          setUser({ fullName: 'Demo User', kycStatus: 'not_verified' });
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } finally {
        // Add 2-second delay before hiding loading screen
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    };
    checkBiometric();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    // Mock API call or validation
    // console.log('Attempting login with:', email); // Keep password out of logs in real apps
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    if (email && password) { // Basic check for mock
      // In a real app, you'd get user data from your backend
      const mockUser = {
        id: '123',
        fullName: 'Demo User',
        email: email,
        kycStatus: 'not_verified', // Example KYC status
        // Add other relevant user details
      };
      setUser(mockUser);
      setIsAuthenticated(true);
      await saveToken('mock_token_123'); // Save a mock token securely
      Alert.alert('Login Successful', `Welcome back, ${mockUser.fullName}!`);
    } else {
      Alert.alert('Login Failed', 'Invalid credentials (mock).');
      setIsAuthenticated(false); // Ensure state is false on failure
    }
    setIsLoading(false);
  };

  const signup = async (userData) => {
    setIsLoading(true);
    // Mock API call for signup
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay

    if (userData.personal.firstName && userData.personal.email) { // Basic validation
      // In a real app, you'd send this data to your backend
      const mockUser = {
        id: '456',
        fullName: `${userData.personal.firstName} ${userData.personal.lastName}`,
        email: userData.personal.email,
        kycStatus: 'not_verified', // Example KYC status
        // Add other relevant user details
      };
      setUser(mockUser);
      setIsAuthenticated(true);
      await saveToken('mock_signup_token_456'); // Save a mock token securely
      Alert.alert('Signup Successful', `Welcome to SendNReceive, ${mockUser.fullName}!`);
    } else {
      Alert.alert('Signup Failed', 'Please fill in all required fields.');
      setIsAuthenticated(false); // Ensure state is false on failure
    }
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    await deleteToken(); // Remove token from secure storage
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    setUser(null);
    setIsAuthenticated(false);
    Alert.alert('Logged Out', 'You have been successfully logged out.');
    setIsLoading(false);
  };

  // Function to simulate KYC update - for testing the verification card
  const updateUserKycStatus = (status) => {
    if (user) {
      setUser(prevUser => ({ ...prevUser, kycStatus: status }));
      Alert.alert("KYC Status Updated", `Your KYC status is now: ${status}`);
    }
  };

  // Toggle biometric preference with security verification
  const toggleBiometric = async (enabled) => {
    if (enabled) {
      // Navigate to security code setup/verification
      // This will be handled by the navigation system
      // The actual biometric setup will happen in BiometricSetupScreen
    } else {
      // Disable biometric
      setBiometricEnabled(false);
      await saveBiometricEnabled(false);
      Alert.alert('Biometric Disabled', 'FaceID/biometric login is now turned off.');
    }
  };

  // Function to enable biometric (called from BiometricSetupScreen)
  const enableBiometric = async () => {
    setBiometricEnabled(true);
    await saveBiometricEnabled(true);
  };


  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated,
        user,
        login,
        signup,
        logout,
        updateUserKycStatus, // Added for testing
        biometricEnabled,
        toggleBiometric,
        enableBiometric,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 