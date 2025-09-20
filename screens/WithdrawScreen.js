import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WithdrawScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState(null); // e.g., 'bank_account', 'mobile_wallet'

  const handleWithdraw = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to withdraw.');
      return;
    }
    if (!withdrawalMethod) {
      Alert.alert('Withdrawal Method', 'Please select a withdrawal method.');
      return;
    }
    // Mock withdrawal action
    Alert.alert('Withdrawal Initiated', `Successfully initiated withdrawal of $${amount} to ${withdrawalMethod}.`);
    setAmount('');
    setWithdrawalMethod(null);
    // navigation.goBack();
  };

  // Mock withdrawal methods
  const withdrawalOptions = [
    { id: 'bank_account', label: 'Bank Account', icon: 'business-outline' },
    { id: 'mobile_wallet', label: 'Mobile Money Wallet', icon: 'phone-portrait-outline' },
    // Add other methods as needed
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw Funds</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Enter Amount (USD)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 50"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Select Withdrawal Method</Text>
        {withdrawalOptions.map(option => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.paymentOption, // Reusing paymentOption style
              withdrawalMethod === option.id && styles.selectedPaymentOption // Reusing selected style
            ]}
            onPress={() => setWithdrawalMethod(option.id)}
          >
            <Ionicons
              name={option.icon}
              size={24}
              color={withdrawalMethod === option.id ? '#fff' : '#004AAD'}
              style={styles.paymentIcon} // Reusing icon style
            />
            <Text
              style={[
                styles.paymentOptionText, // Reusing text style
                withdrawalMethod === option.id && styles.selectedPaymentOptionText // Reusing selected text style
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw}>
          <Text style={styles.withdrawButtonText}>Confirm Withdrawal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  header: {
    backgroundColor: '#004AAD',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  paymentOption: { // Reused from DepositScreen styles for consistency
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  selectedPaymentOption: { // Reused
    backgroundColor: '#004AAD',
    borderColor: '#004AAD',
  },
  paymentIcon: { // Reused
    marginRight: 10,
  },
  paymentOptionText: { // Reused
    fontSize: 16,
    color: '#004AAD',
  },
  selectedPaymentOptionText: { // Reused
    color: '#fff',
  },
  withdrawButton: {
    backgroundColor: '#FF3B30', // A warning/action red
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WithdrawScreen;
