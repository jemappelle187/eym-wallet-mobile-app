import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

const FloatingLabelInput = ({ label, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, editable, iconName }) => {
  const [isFocused, setIsFocused] = useState(false);
  const labelAnim = useState(new Animated.Value(value ? 1 : 0))[0];

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFocused || value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: 'absolute',
    left: 44,
    top: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 4],
    }),
    fontSize: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: isFocused ? Colors.primary : Colors.textMuted,
    fontFamily: 'Montserrat-Regular',
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 2,
    zIndex: 2,
  };

  return (
    <View style={styles.floatingInputContainer}>
      <Ionicons name={iconName} size={22} color={Colors.textMuted} style={styles.inputIcon} />
      <Animated.Text style={labelStyle}>{label}</Animated.Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={isFocused ? '' : label}
        placeholderTextColor={Colors.textMuted}
      />
    </View>
  );
};

const SignUpScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false); // Local loading state for signup
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Mock signup function
  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    console.log('SignUp attempt with:', name, email); // Avoid logging password
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    Alert.alert('Sign Up Successful (mock)!', 'Please proceed to Login.');
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Ionicons name="person-add-outline" size={50} color={Colors.primary} style={styles.logoPlaceholder} />
      <Text style={styles.appName}>Join SendNReceive</Text>
      <Text style={styles.tagline}>Fast, Secure, and Zero Fee Transactions</Text>

      <FloatingLabelInput
        label="Full Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          editable={!isLoading}
        iconName="person-outline"
      />
      <FloatingLabelInput
        label="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
        iconName="mail-outline"
      />
      <FloatingLabelInput
        label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
        iconName="lock-closed-outline"
        />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSignUp}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.cardBackground} />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isLoading}>
        <Text style={styles.linkText}>Already have an account? <Text style={styles.linkTextBold}>Login</Text></Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    backgroundColor: Colors.background,
  },
  logoPlaceholder: {
    marginBottom: 10,
  },
  appName: {
    ...Typography.header,
    color: Colors.primary,
    fontSize: 28,
    marginBottom: 8,
  },
  tagline: {
    ...Typography.bodyText,
    color: Colors.textMuted,
    marginBottom: 40,
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 18,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    ...Typography.bodyText,
    flex: 1,
    height: 55,
  },
  button: {
    width: '100%',
    height: 55,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: Colors.textMuted,
  },
  buttonText: {
    ...Typography.buttonText,
    color: Colors.cardBackground, // Ensure contrast with accent color
  },
  linkText: {
    ...Typography.bodyText,
    color: Colors.primary,
    fontSize: 15,
  },
  linkTextBold: {
    fontWeight: 'bold',
  },
  floatingInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 56,
    position: 'relative',
  },
});

export default SignUpScreen;
