import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../constants/Typography';

const RemittanceScreen = ({ navigation, onClose }) => {
  const [amount, setAmount] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [isProcessing, setIsProcessing] = useState(false);

  // Exchange rates for stablecoin conversion
  const exchangeRates = {
    USD: { USDC: 1.0, GHS: 12.5 },
    EUR: { USDC: 1.08, GHS: 13.8 },
    GHS: { USDC: 0.08, GHS: 1.0 },
    AED: { USDC: 0.27, GHS: 3.4 },
    NGN: { USDC: 0.001, GHS: 0.012 },
  };

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$', rate: 12.5 },
    { code: 'EUR', name: 'Euro', symbol: '€', rate: 13.8 },
    { code: 'GBP', name: 'British Pound', symbol: '£', rate: 16.2 },
  ];

  const calculateStablecoinValues = () => {
    if (!amount || isNaN(Number(amount))) {
      return { usdc: '0.00', local: '0.00' };
    }
    
    const rate = exchangeRates[selectedCurrency]?.USDC || 1;
    const localRate = exchangeRates[selectedCurrency]?.GHS || 1;
    
    return {
      usdc: (Number(amount) * rate).toFixed(2),
      local: (Number(amount) * localRate).toFixed(2)
    };
  };

  const handleSendRemittance = async () => {
    if (!amount || !recipientPhone || !recipientName || !senderName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setIsProcessing(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Remittance Successful',
        `Your remittance of ${selectedCurrency} ${amount} has been sent to ${recipientName}.`,
        [{ text: 'OK', onPress: () => onClose ? onClose() : navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process remittance');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <SafeAreaView style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => onClose ? onClose() : navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Remittance</Text>
        <View style={styles.placeholder} />
      </SafeAreaView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Currency</Text>
          <View style={styles.currencySelector}>
            <Text style={styles.currencyText}>
              {currencies.find(c => c.code === selectedCurrency)?.symbol} {selectedCurrency}
            </Text>
            <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.6)" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>
              {currencies.find(c => c.code === selectedCurrency)?.symbol}
            </Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="rgba(255,255,255,0.5)"
              keyboardType="numeric"
            />
          </View>

          {/* Dual Currency Display */}
          {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
            <View style={styles.dualCurrencyDisplay}>
              <View style={styles.currencyRow}>
                <Text style={styles.currencyLabel}>USDC Value:</Text>
                <Text style={styles.currencyValue}>USDC {calculateStablecoinValues().usdc}</Text>
              </View>
              <View style={styles.currencyRow}>
                <Text style={styles.currencyLabel}>Local Value:</Text>
                <Text style={styles.currencyValue}>₵ {calculateStablecoinValues().local}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sender Details</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person" size={20} color="rgba(255,255,255,0.6)" />
            <TextInput
              style={styles.input}
              value={senderName}
              onChangeText={setSenderName}
              placeholder="Your full name"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipient Details</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person" size={20} color="rgba(255,255,255,0.6)" />
            <TextInput
              style={styles.input}
              value={recipientName}
              onChangeText={setRecipientName}
              placeholder="Recipient full name"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="call" size={20} color="rgba(255,255,255,0.6)" />
            <TextInput
              style={styles.input}
              value={recipientPhone}
              onChangeText={setRecipientPhone}
              placeholder="Recipient phone number"
              placeholderTextColor="rgba(255,255,255,0.5)"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.sendButton, (!amount || !recipientPhone || !recipientName || !senderName) && styles.sendButtonDisabled]}
          onPress={handleSendRemittance}
          disabled={isProcessing || !amount || !recipientPhone || !recipientName || !senderName}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.sendButtonText}>Send Remittance</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
    fontFamily: Typography.fontFamily,
  },
  currencySelector: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currencyText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  amountContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginRight: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  dualCurrencyDisplay: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  currencyLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: Typography.fontFamily,
  },
  currencyValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 12,
    fontFamily: Typography.fontFamily,
  },
  sendButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(30, 64, 175, 0.5)',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
});

export default RemittanceScreen;
