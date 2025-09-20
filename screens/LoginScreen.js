import React, { useState, useContext, useEffect } from 'react'; // Added useContext, useEffect
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Animated } from 'react-native'; // Added ActivityIndicator, Alert, Animated
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { AuthContext } from '../contexts/AuthContext';

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

const LoginScreen = ({ navigation }) => {
  const { login, isLoading } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginPress = () => {
    if (!email.trim() || !password.trim()) { // Added trim() for basic validation
        Alert.alert("Validation Error", "Please enter both email and password.");
        return;
    }
    login(email, password);
  };

  return (
    <View style={styles.container}>
      <Ionicons name="paper-plane-outline" size={60} color={Colors.primary} style={styles.logoPlaceholder} />
      <Text style={styles.appName}>SendNReceive</Text>
      <Text style={styles.tagline}>Africa to World, World to Africa – Zero Fees</Text>

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
        onPress={handleLoginPress}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.cardBackground} />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')} disabled={isLoading}>
        <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text></Text>
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
    fontSize: 32,
    marginBottom: 8,
  },
  tagline: {
    ...Typography.bodyText,
    color: Colors.textMuted,
    marginBottom: 40,
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: 14, // Adjusted for better fit
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: '#E0E0E0', // Lighter border
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
    backgroundColor: Colors.primary,
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
  },
  linkText: {
    ...Typography.bodyText,
    color: Colors.primary,
    fontSize: 15, // Adjusted
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

export default LoginScreen;
