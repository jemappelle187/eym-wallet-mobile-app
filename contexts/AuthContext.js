import React, { createContext, useState, useEffect } from 'react';
import { Alert } from 'react-native'; // For mock login messages
import { saveToken, getToken, deleteToken } from '../utils/SecureTokenStorage';

// Create Context
export const AuthContext = createContext();

// Create Provider Component
export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); // To store user data (e.g., { fullName: 'Demo User', kycStatus: 'not_verified' })

  // Simulate checking auth status on app load (e.g., from AsyncStorage)
  useEffect(() => {
    // On app load, check for stored token
    const checkToken = async () => {
      const token = await getToken();
      if (token) {
        // In a real app, validate token with backend
        setIsAuthenticated(true);
        setUser({ fullName: 'Demo User', kycStatus: 'not_verified' }); // Placeholder user
      }
      setIsLoading(false);
    };
    checkToken();
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


  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated,
        user,
        login,
        logout,
        updateUserKycStatus, // Added for testing
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 