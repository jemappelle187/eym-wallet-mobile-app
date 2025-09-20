// sendnreceive-app/screens/DepositScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Platform, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

const DepositScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to deposit.');
      return;
    }
    if (!paymentMethod) {
      Alert.alert('Payment Method', 'Please select a payment method.');
      return;
    }
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    Alert.alert('Deposit Initiated (Mock)', `Successfully initiated deposit of $${amount} via ${paymentMethod}.`);
    setIsLoading(false);
    setAmount('');
    setPaymentMethod(null);
  };

  const paymentOptions = [
    { id: 'card', label: 'Credit/Debit Card', icon: 'card-outline' },
    { id: 'bank', label: 'Bank Transfer', icon: 'business-outline' },
    { id: 'mobile_money', label: 'Mobile Money', icon: 'phone-portrait-outline' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} disabled={isLoading}>
            <Ionicons name="arrow-back-outline" size={28} color={Colors.cardBackground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Deposit Funds</Text>
          <View style={{width:28}}/>
        </View>

        <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Enter Amount (USD)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 100"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            editable={!isLoading}
          />

          <Text style={styles.label}>Select Payment Method</Text>
          {paymentOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.paymentOption,
                paymentMethod === option.id && styles.selectedPaymentOption
              ]}
              onPress={() => setPaymentMethod(option.id)}
              disabled={isLoading}
            >
              <Ionicons
                name={option.icon}
                size={24}
                color={paymentMethod === option.id ? Colors.cardBackground : Colors.primary}
                style={styles.paymentIcon}
              />
              <Text
                style={[
                  styles.paymentOptionText,
                  paymentMethod === option.id && styles.selectedPaymentOptionText
                ]}
              >
                {option.label}
              </Text>
              {paymentMethod === option.id && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.cardBackground} style={styles.selectedIcon} />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.actionButton, isLoading && styles.buttonDisabled]}
            onPress={handleDeposit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.cardBackground} />
            ) : (
              <Text style={styles.actionButtonText}>Confirm Deposit</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    ...Typography.subHeader,
    color: Colors.cardBackground,
    fontSize: 20,
  },
  contentContainer: {
    padding: 20,
  },
  label: {
    ...Typography.bodyText,
    color: Colors.textMuted,
    marginBottom: 8,
    marginTop: 15,
    fontWeight: '600',
  },
  input: {
    ...Typography.bodyText,
    width: '100%',
    height: 50,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    marginBottom: 12,
  },
  selectedPaymentOption: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  paymentIcon: {
    marginRight: 15,
  },
  paymentOptionText: {
    ...Typography.bodyText,
    color: Colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  selectedPaymentOptionText: {
    color: Colors.cardBackground,
  },
  selectedIcon: {
    marginLeft: 'auto',
  },
  actionButton: {
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: Colors.textMuted,
  },
  actionButtonText: {
    ...Typography.buttonText,
  },
});

export default DepositScreen;
