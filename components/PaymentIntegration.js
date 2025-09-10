// PaymentIntegration.js - Unified payment handling component
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { paymentManager, TEST_DATA } from '../utils/PaymentAPIs';

const PaymentIntegration = ({ 
  isVisible, 
  onClose, 
  onPaymentSuccess, 
  onPaymentError,
  paymentType = 'deposit', // 'deposit', 'send', 'withdraw'
  defaultAmount = '',
  defaultCurrency = 'USD',
  defaultMethod = null
}) => {
  const [currentStep, setCurrentStep] = useState('method'); // 'method', 'details', 'confirmation', 'processing'
  const [selectedMethod, setSelectedMethod] = useState(defaultMethod);
  const [amount, setAmount] = useState(defaultAmount);
  const [currency, setCurrency] = useState(defaultCurrency);
  const [paymentDetails, setPaymentDetails] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Payment method options
  const paymentMethods = [
    {
      id: 'card',
      title: 'Credit/Debit Card',
      subtitle: 'Visa, Mastercard, American Express',
      icon: 'card-outline',
      color: Colors.primary,
      gradient: [Colors.primary, '#3b82f6'],
      fee: '2.9% + 30¢',
      processingTime: 'Instant'
    },
    {
      id: 'mobile_money',
      title: 'Mobile Money',
      subtitle: 'MTN, Vodafone, Airtel Money',
      icon: 'phone-portrait-outline',
      color: Colors.accent,
      gradient: [Colors.accent, '#8b5cf6'],
      fee: '1%',
      processingTime: 'Instant'
    },
    {
      id: 'bank',
      title: 'Bank Transfer',
      subtitle: 'Direct bank transfer',
      icon: 'business-outline',
      color: Colors.success,
      gradient: [Colors.success, '#10b981'],
      fee: 'Free',
      processingTime: '1-3 business days'
    },
    {
      id: 'paypal',
      title: 'PayPal',
      subtitle: 'PayPal account or card',
      icon: 'logo-paypal',
      color: '#003087',
      gradient: ['#003087', '#009cde'],
      fee: '2.9% + 30¢',
      processingTime: 'Instant'
    }
  ];

  useEffect(() => {
    if (isVisible) {
      setCurrentStep('method');
      setSelectedMethod(defaultMethod);
      setAmount(defaultAmount);
      setCurrency(defaultCurrency);
      setPaymentDetails({});
      setError(null);
    }
  }, [isVisible, defaultMethod, defaultAmount, defaultCurrency]);

  const handleMethodSelect = (method) => {
    Haptics.selectionAsync();
    setSelectedMethod(method.id);
    setCurrentStep('details');
  };

  const handleAmountChange = (value) => {
    // Remove non-numeric characters except decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    setAmount(cleanValue);
  };

  const handlePaymentDetailsChange = (field, value) => {
    setPaymentDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validatePaymentDetails = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    switch (selectedMethod) {
      case 'card':
        if (!paymentDetails.cardNumber || !paymentDetails.expiry || !paymentDetails.cvc) {
          setError('Please fill in all card details');
          return false;
        }
        break;
      case 'mobile_money':
        if (!paymentDetails.phoneNumber) {
          setError('Please enter a valid phone number');
          return false;
        }
        break;
      case 'bank':
        if (!paymentDetails.accountNumber || !paymentDetails.routingNumber) {
          setError('Please fill in all bank details');
          return false;
        }
        break;
    }

    return true;
  };

  const handleContinue = () => {
    if (validatePaymentDetails()) {
      setCurrentStep('confirmation');
      setError(null);
    }
  };

  const handleConfirmPayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const paymentData = {
        method: selectedMethod,
        amount: parseFloat(amount),
        currency,
        ...paymentDetails
      };

      const result = await paymentManager.processPayment(paymentData);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onPaymentSuccess?.(result);
        setCurrentStep('success');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(error.message);
      onPaymentError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMethodSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choose Payment Method</Text>
      <Text style={styles.stepSubtitle}>Select how you'd like to {paymentType}</Text>
      
      <ScrollView style={styles.methodsContainer} showsVerticalScrollIndicator={false}>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={styles.methodCard}
            onPress={() => handleMethodSelect(method)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={method.gradient}
              style={styles.methodGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.methodContent}>
                <View style={styles.methodIconContainer}>
                  <Ionicons name={method.icon} size={24} color="white" />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodTitle}>{method.title}</Text>
                  <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
                  <View style={styles.methodDetails}>
                    <Text style={styles.methodDetail}>Fee: {method.fee}</Text>
                    <Text style={styles.methodDetail}>•</Text>
                    <Text style={styles.methodDetail}>{method.processingTime}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPaymentDetails = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <TouchableOpacity onPress={() => setCurrentStep('method')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.stepTitle}>Payment Details</Text>
      </View>

      <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
        {/* Amount Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>{getCurrencySymbol(currency)}</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              keyboardType="numeric"
              autoFocus
            />
          </View>
        </View>

        {/* Method-specific inputs */}
        {selectedMethod === 'card' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Card Information</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Card Number"
              value={paymentDetails.cardNumber}
              onChangeText={(value) => handlePaymentDetailsChange('cardNumber', value)}
              keyboardType="numeric"
              maxLength={16}
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.textInput, styles.halfInput]}
                placeholder="MM/YY"
                value={paymentDetails.expiry}
                onChangeText={(value) => handlePaymentDetailsChange('expiry', value)}
                maxLength={5}
              />
              <TextInput
                style={[styles.textInput, styles.halfInput]}
                placeholder="CVC"
                value={paymentDetails.cvc}
                onChangeText={(value) => handlePaymentDetailsChange('cvc', value)}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </View>
        )}

        {selectedMethod === 'mobile_money' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Money Details</Text>
            <View style={styles.providerSelector}>
              {['mtn', 'vodafone', 'airtel'].map((provider) => (
                <TouchableOpacity
                  key={provider}
                  style={[
                    styles.providerOption,
                    paymentDetails.provider === provider && styles.selectedProvider
                  ]}
                  onPress={() => handlePaymentDetailsChange('provider', provider)}
                >
                  <Text style={styles.providerText}>{provider.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Phone Number"
              value={paymentDetails.phoneNumber}
              onChangeText={(value) => handlePaymentDetailsChange('phoneNumber', value)}
              keyboardType="phone-pad"
            />
          </View>
        )}

        {selectedMethod === 'bank' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bank Account Details</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Account Number"
              value={paymentDetails.accountNumber}
              onChangeText={(value) => handlePaymentDetailsChange('accountNumber', value)}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.textInput}
              placeholder="Routing Number"
              value={paymentDetails.routingNumber}
              onChangeText={(value) => handlePaymentDetailsChange('routingNumber', value)}
              keyboardType="numeric"
            />
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.continueButton, !amount && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!amount}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderConfirmation = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <TouchableOpacity onPress={() => setCurrentStep('details')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.stepTitle}>Confirm Payment</Text>
      </View>

      <View style={styles.confirmationContainer}>
        <View style={styles.confirmationCard}>
          <Text style={styles.confirmationTitle}>Payment Summary</Text>
          
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Amount:</Text>
            <Text style={styles.confirmationValue}>
              {getCurrencySymbol(currency)}{amount}
            </Text>
          </View>
          
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Method:</Text>
            <Text style={styles.confirmationValue}>
              {paymentMethods.find(m => m.id === selectedMethod)?.title}
            </Text>
          </View>
          
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Fee:</Text>
            <Text style={styles.confirmationValue}>
              {paymentMethods.find(m => m.id === selectedMethod)?.fee}
            </Text>
          </View>

          {selectedMethod === 'card' && (
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Card:</Text>
              <Text style={styles.confirmationValue}>
                **** **** **** {paymentDetails.cardNumber?.slice(-4)}
              </Text>
            </View>
          )}

          {selectedMethod === 'mobile_money' && (
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Phone:</Text>
              <Text style={styles.confirmationValue}>
                {paymentDetails.phoneNumber}
              </Text>
            </View>
          )}

          <View style={styles.divider} />
          
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Total:</Text>
            <Text style={styles.confirmationValue}>
              {getCurrencySymbol(currency)}{amount}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, isLoading && styles.disabledButton]}
          onPress={handleConfirmPayment}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm Payment</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.stepContainer}>
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
        </View>
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successSubtitle}>
          Your {paymentType} of {getCurrencySymbol(currency)}{amount} has been processed.
        </Text>
        
        <TouchableOpacity style={styles.doneButton} onPress={onClose}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getCurrencySymbol = (curr) => {
    const symbols = {
      USD: '$',
      EUR: '€',
      GHS: '₵',
      NGN: '₦',
      AED: 'د.إ'
    };
    return symbols[curr] || curr;
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'method':
        return renderMethodSelection();
      case 'details':
        return renderPaymentDetails();
      case 'confirmation':
        return renderConfirmation();
      case 'success':
        return renderSuccess();
      default:
        return renderMethodSelection();
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <BlurView intensity={20} style={styles.blurContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {paymentType.charAt(0).toUpperCase() + paymentType.slice(1)} Money
            </Text>
            <View style={styles.placeholder} />
          </View>

          {renderCurrentStep()}
        </BlurView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    marginBottom: 24,
  },
  methodsContainer: {
    flex: 1,
  },
  methodCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  methodGradient: {
    padding: 20,
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  methodSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  methodDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodDetail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
  },
  detailsContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.background,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
  },
  textInput: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  providerSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  providerOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectedProvider: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  providerText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginLeft: 8,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  disabledButton: {
    opacity: 0.5,
  },
  confirmationContainer: {
    flex: 1,
    paddingVertical: 20,
  },
  confirmationCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmationLabel: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  confirmationValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  confirmButton: {
    backgroundColor: Colors.success,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default PaymentIntegration;
