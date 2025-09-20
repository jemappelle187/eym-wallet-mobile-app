import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PayPalAPI } from '../utils/MobileMoneyAPIs';
import PrimaryButton from '../components/PrimaryButton';

const PayPalPaymentScreen = ({ navigation, route, onClose }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  
  // Determine if this is for deposit (Add Money) or send (Send Money)
  const isDeposit = route.params?.isDeposit || false;
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [amount, setAmount] = useState('');
  const [usdcValue, setUsdcValue] = useState('0.00');
  const [localValue, setLocalValue] = useState('0.00');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [fees, setFees] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paypalAPI] = useState(new PayPalAPI());

  // Get initial data from route params
  const { initialAmount, initialCurrency } = route.params || {};

  useEffect(() => {
    initializePayPal();
  }, []);

  useEffect(() => {
    if (initialAmount) setAmount(initialAmount.toString());
    if (initialCurrency) setSelectedCurrency(initialCurrency);
  }, [initialAmount, initialCurrency]);

  useEffect(() => {
    calculateFees();
  }, [amount, selectedCurrency]);

  // Exchange rates for stablecoin conversion
  const exchangeRates = {
    USD: { USDC: 1.0, GHS: 12.5 },
    EUR: { USDC: 1.08, GHS: 13.8 },
    GHS: { USDC: 0.08, GHS: 1.0 },
    AED: { USDC: 0.27, GHS: 3.4 },
    NGN: { USDC: 0.001, GHS: 0.012 },
  };

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

  const initializePayPal = async () => {
    try {
      setIsLoading(true);
      
      // Test PayPal connection
      const balanceResult = await paypalAPI.getAccountBalance();
      console.log('PayPal connection test:', balanceResult);
      
    } catch (error) {
      console.error('PayPal initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFees = () => {
    if (!amount || isNaN(Number(amount))) {
      setFees(0);
      setTotalAmount(0);
      return;
    }

    const numAmount = parseFloat(amount);
    // PayPal fees: 2.9% + $0.30 for US transactions
    const percentageFee = (numAmount * 0.029);
    const fixedFee = 0.30;
    const calculatedFees = Math.max(percentageFee + fixedFee, 0.30);
    
    setFees(calculatedFees);
    setTotalAmount(numAmount + calculatedFees);
  };

  const validateForm = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return false;
    }

    if (isDeposit) {
      // For deposit, we need recipient email (PayPal account)
      if (!recipientEmail.trim()) {
        Alert.alert('Missing Email', 'Please enter your PayPal email address.');
        return false;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail.trim())) {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
        return false;
      }
    } else {
      // For send, we need recipient details
      if (!recipientEmail.trim()) {
        Alert.alert('Missing Email', 'Please enter the recipient\'s PayPal email address.');
        return false;
      }
      
      if (!recipientName.trim()) {
        Alert.alert('Missing Name', 'Please enter the recipient\'s name.');
        return false;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail.trim())) {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
        return false;
      }
    }

    // Check transaction limits
    const numAmount = parseFloat(amount);
    if (numAmount < 1) {
      Alert.alert('Amount Too Low', 'Minimum transaction amount is $1.00.');
      return false;
    }
    
    if (numAmount > 50000) {
      Alert.alert('Amount Too High', 'Maximum transaction amount is $50,000.00.');
      return false;
    }

    return true;
  };

  const handlePayPalAction = async () => {
    if (!validateForm()) return;
    
    setIsProcessing(true);
    
    try {
      if (isDeposit) {
        // Handle deposit (Add Money) - Create PayPal payment
        const paymentData = {
          amount: parseFloat(amount),
          currency: selectedCurrency,
          description: description.trim() || 'PayPal deposit to wallet',
          returnUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel'
        };

        // Show processing status
        Alert.alert(
          'Processing Payment',
          'Creating PayPal payment...',
          [{ text: 'OK' }],
          { cancelable: false }
        );

        // Create PayPal payment
        const result = await paypalAPI.createPayment(paymentData);

        if (result.success) {
          setTransactionDetails(result);
          
          if (result.isMock) {
            // For mock payments, show success without redirect
            Alert.alert(
              '🎉 Payment Created!',
              `PayPal payment created successfully\n\nPayment ID: ${result.paymentId}\nStatus: ${result.status}\n\nNote: This is a mock payment for testing. Real API integration pending.`,
              [
                {
                  text: 'View Details',
                  onPress: () => navigation.navigate('TransactionSuccess', { 
                    transaction: {
                      ...result,
                      method: 'PayPal',
                      type: 'deposit',
                      provider: 'paypal',
                      icon: '💳'
                    }
                  })
                },
                {
                  text: 'Done',
                  onPress: () => onClose ? onClose() : navigation.goBack()
                }
              ]
            );
          } else {
            // For real payments, redirect to PayPal
            Alert.alert(
              '🎉 Payment Created!',
              `PayPal payment created successfully\n\nPayment ID: ${result.paymentId}\nStatus: ${result.status}\n\nYou will be redirected to PayPal to complete the payment.`,
              [
                {
                  text: 'Continue to PayPal',
                  onPress: () => {
                    // Open PayPal approval URL
                    if (result.approvalUrl) {
                      Linking.openURL(result.approvalUrl);
                    }
                  }
                },
                {
                  text: 'View Details',
                  onPress: () => navigation.navigate('TransactionSuccess', { 
                    transaction: {
                      ...result,
                      method: 'PayPal',
                      type: 'deposit',
                      provider: 'paypal',
                      icon: '💳'
                    }
                  })
                },
                {
                  text: 'Done',
                  onPress: () => onClose ? onClose() : navigation.goBack()
                }
              ]
            );
          }
        } else {
          Alert.alert('Error', result.error || 'Payment creation failed. Please try again.');
        }
      } else {
        // Handle send (Send Money) - Create PayPal payout
        const payoutData = {
          amount: parseFloat(amount),
          currency: selectedCurrency,
          recipientEmail: recipientEmail.trim(),
          note: description.trim() || `Payment to ${recipientName}`
        };

        // Show processing status
        Alert.alert(
          'Processing Payment',
          'Sending via PayPal...',
          [{ text: 'OK' }],
          { cancelable: false }
        );

        // Create PayPal payout
        const result = await paypalAPI.createPayout(payoutData);

        if (result.success) {
          setTransactionDetails(result);
          
          // Show success with payout details
          Alert.alert(
            '🎉 Payment Sent!',
            `Successfully sent ${amount} ${selectedCurrency} to ${recipientName} via PayPal\n\nPayout ID: ${result.payoutId}\nStatus: ${result.status}`,
            [
              {
                text: 'View Details',
                onPress: () => navigation.navigate('TransactionSuccess', { 
                  transaction: {
                    ...result,
                    method: 'PayPal',
                    type: 'transfer',
                    provider: 'paypal',
                    icon: '💳',
                    recipient: recipientName
                  }
                })
              },
              {
                text: 'Done',
                onPress: () => onClose ? onClose() : navigation.goBack()
              }
            ]
          );
        } else {
          Alert.alert('Error', result.error || 'Payment failed. Please try again.');
        }
      }

    } catch (error) {
      console.error('PayPal action error:', error);
      Alert.alert('Error', isDeposit ? 'Payment creation failed. Please try again.' : 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigation.goBack();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Initializing PayPal...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isDeposit ? 'Add Money via PayPal' : 'Send Money via PayPal'}
        </Text>
        <View style={styles.placeholder} />
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* PayPal Branding Section */}
          <View style={styles.paypalBrandingSection}>
            <View style={styles.paypalLogoContainer}>
              <View style={styles.paypalIconContainer}>
                <Ionicons name="logo-paypal" size={28} color="#ffffff" />
              </View>
              <View style={styles.paypalBranding}>
                <Text style={styles.paypalTitle} numberOfLines={1} ellipsizeMode="tail">PayPal</Text>
              </View>
            </View>
            <View style={styles.paypalStatusIndicator}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Connected</Text>
            </View>
          </View>

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Amount
            </Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>
                {selectedCurrency === 'USD' ? '$' : 
                 selectedCurrency === 'EUR' ? '€' : 
                 selectedCurrency === 'GHS' ? '₵' : 
                 selectedCurrency === 'AED' ? 'د.إ' : 
                 selectedCurrency === 'NGN' ? '₦' : '$'}
              </Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.6)"
                keyboardType="numeric"
                fontSize={24}
                fontFamily={Typography.fontFamily}
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

          {/* Recipient Details */}
          {isDeposit ? (
            <View style={styles.section}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>PayPal Email</Text>
                <TextInput
                  style={styles.textInput}
                  value={recipientEmail}
                  onChangeText={setRecipientEmail}
                  placeholder="your-email@example.com"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Recipient Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={recipientName}
                  onChangeText={setRecipientName}
                  placeholder="Enter recipient's full name"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>PayPal Email</Text>
                <TextInput
                  style={styles.textInput}
                  value={recipientEmail}
                  onChangeText={setRecipientEmail}
                  placeholder="recipient@example.com"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={description}
                onChangeText={setDescription}
                placeholder="e.g., Wallet deposit"
                placeholderTextColor="rgba(255,255,255,0.6)"
                maxLength={100}
              />
            </View>
          </View>

          {/* Fee Breakdown */}
          {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fee Breakdown</Text>
              <View style={styles.feeContainer}>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Amount</Text>
                  <Text style={styles.feeValue}>
                    {selectedCurrency === 'USD' ? '$' : 
                     selectedCurrency === 'EUR' ? '€' : 
                     selectedCurrency === 'GHS' ? '₵' : 
                     selectedCurrency === 'AED' ? 'د.إ' : 
                     selectedCurrency === 'NGN' ? '₦' : '$'}{amount}
                  </Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>PayPal Fee (2.9% + $0.30)</Text>
                  <Text style={styles.feeValue}>
                    {selectedCurrency === 'USD' ? '$' : 
                     selectedCurrency === 'EUR' ? '€' : 
                     selectedCurrency === 'GHS' ? '₵' : 
                     selectedCurrency === 'AED' ? 'د.إ' : 
                     selectedCurrency === 'NGN' ? '₦' : '$'}{fees.toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.feeRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    {selectedCurrency === 'USD' ? '$' : 
                     selectedCurrency === 'EUR' ? '€' : 
                     selectedCurrency === 'GHS' ? '₵' : 
                     selectedCurrency === 'AED' ? 'د.إ' : 
                     selectedCurrency === 'NGN' ? '₦' : '$'}{totalAmount.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title={isDeposit ? "ADD MONEY" : "SEND MONEY"}
            onPress={handlePayPalAction}
            loading={isProcessing}
            disabled={isProcessing}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
    fontFamily: Typography.fontFamily,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: 'rgba(15, 15, 35, 0.95)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
  paypalBrandingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    width: '100%',
  },
  paypalLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  paypalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#003087',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  paypalBranding: {
    flex: 1,
  },
  paypalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
    numberOfLines: 1, // Prevents text wrapping
    ellipsizeMode: 'tail', // Adds ... if text is too long
  },
  paypalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
    fontFamily: Typography.fontFamily,
    numberOfLines: 1, // Prevents text wrapping
    ellipsizeMode: 'tail', // Adds ... if text is too long
  },
  paypalStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
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
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  currencySymbol: {
    fontSize: 24,
    color: '#ffffff',
    marginRight: 12,
    fontFamily: Typography.fontFamily,
    fontWeight: '600',
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
    fontWeight: '500',
  },
  dualCurrencyDisplay: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currencyLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Typography.fontFamily,
  },
  currencyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    fontFamily: Typography.fontFamily,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    fontFamily: Typography.fontFamily,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  feeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feeLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Typography.fontFamily,
  },
  feeValue: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(15, 15, 35, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

});

export default PayPalPaymentScreen;
