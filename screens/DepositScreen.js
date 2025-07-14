import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, SafeAreaView, ActivityIndicator, ScrollView, Modal, Alert, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import PrimaryButton from '../components/PrimaryButton';
import { useTheme } from '../contexts/ThemeContext';

const currencyOptions = [
  { code: 'GHS', symbol: '₵', country: 'Ghana', flag: '🇬🇭' },
  { code: 'USD', symbol: '$', country: 'United States', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', country: 'European Union', flag: '🇪🇺' },
  { code: 'AED', symbol: 'د.إ', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'NGN', symbol: '₦', country: 'Nigeria', flag: '🇳🇬' },
];

const paymentOptions = [
  { 
    id: 'card', 
    label: 'Credit/Debit Card', 
    icon: 'card-outline',
    description: 'Visa, Mastercard',
    processingTime: 'Instant',
    fees: 'Free'
  },
  { 
    id: 'bank', 
    label: 'Bank Transfer', 
    icon: 'business-outline',
    description: 'Direct bank transfer',
    processingTime: 'Instant',
    fees: 'Free'
  },
  { 
    id: 'mobile_money', 
    label: 'Mobile Money', 
    icon: 'phone-portrait-outline',
    description: 'Mobile money services',
    processingTime: 'Instant',
    fees: 'Free'
  },
];

const DepositScreen = ({ navigation, isModal, onClose, onDepositConfirmed }) => {
  const { colors } = useTheme();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(currencyOptions[0]);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});
  const [amountError, setAmountError] = useState('');
  const [processingFee, setProcessingFee] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Calculate fees when amount or payment method changes
  useEffect(() => {
    if (amount && paymentMethod) {
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount)) {
        // All deposits are fee-free
        setProcessingFee(0);
        setTotalAmount(numAmount);
      }
    } else {
      setProcessingFee(0);
      setTotalAmount(0);
    }
  }, [amount, paymentMethod]);

  // Validate amount input
  const validateAmount = (value) => {
    setAmountError('');
    if (!value) return;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      setAmountError('Please enter a valid amount');
      return false;
    }
    if (numValue < 1) {
      setAmountError('Minimum deposit amount is 1');
      return false;
    }
    if (numValue > 10000) {
      setAmountError('Maximum deposit amount is 10,000');
      return false;
    }
    return true;
  };

  const handleAmountChange = (value) => {
    // Only allow numbers and decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = cleanValue.split('.');
    if (parts.length > 2) return;
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) return;
    
    setAmount(cleanValue);
    validateAmount(cleanValue);
  };

  const showAlert = (title, message, type = 'info') => {
    setAlertConfig({ title, message, type });
    setShowCustomAlert(true);
  };

  const handleDeposit = async () => {
    // Dismiss keyboard when proceeding to confirmation
    Keyboard.dismiss();
    
    if (!validateAmount(amount)) {
      showAlert('Invalid Amount', amountError || 'Please enter a valid amount to deposit.', 'error');
      return;
    }
    if (!paymentMethod) {
      showAlert('Payment Method', 'Please select a payment method.', 'error');
      return;
    }

    // Show confirmation modal
    setShowConfirmationModal(true);
  };

  const confirmDeposit = async () => {
    setShowConfirmationModal(false);
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    showAlert(
      'Deposit Initiated', 
      `Successfully initiated deposit of ${selectedCurrency.symbol}${amount} via ${paymentOptions.find(p => p.id === paymentMethod)?.label}.`,
      'success'
    );
    
    setIsLoading(false);
    if (onDepositConfirmed) onDepositConfirmed(); // Notify parent
    if (isModal && onClose) {
      onClose();
    }
    setAmount('');
    setPaymentMethod(null);
    setProcessingFee(0);
    setTotalAmount(0);
  };

  const handleAlertClose = () => {
    setShowCustomAlert(false);
    // Reset form and close modal only after user closes the success alert
    setAmount('');
    setPaymentMethod(null);
    setProcessingFee(0);
    setTotalAmount(0);
    if (isModal && onClose) {
      onClose();
    }
  };

  const handlePaymentMethodSelect = (methodId) => {
    // Dismiss keyboard when selecting payment method
    Keyboard.dismiss();
    setPaymentMethod(methodId);
  };

  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency);
    setShowCurrencyModal(false);
  };

  if (isModal) {
    return (
      <>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.modalCardContent, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={[styles.modalScrollContent, {paddingBottom: 32}]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
              onScrollBeginDrag={() => {
                if (amount) {
                  Keyboard.dismiss();
                }
              }}
          >
              {/* Modal Header (identical to send modal) */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderContent}>
                  <View style={styles.modalHeaderLeft}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Deposit Funds</Text>
                    <View style={styles.headerLimitsInfo}>
                      <View style={styles.headerLimitItem}>
                        <Ionicons name="information-circle-outline" size={12} color={colors.textMuted} />
                        <Text style={[styles.headerLimitText, { color: colors.textMuted }]}>Daily: $10,000</Text>
                      </View>
                      <View style={styles.headerLimitItem}>
                        <Ionicons name="shield-checkmark-outline" size={12} color={colors.success} />
                        <Text style={[styles.headerLimitText, { color: colors.textMuted }]}>Secure</Text>
                      </View>
                    </View>
                  </View>
                  {onClose && (
                    <TouchableOpacity
                      onPress={onClose}
                      style={styles.closeButton}
                      accessibilityLabel="Close deposit modal"
                    >
                      <Ionicons name="close" size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
        {/* Currency Selector */}
              <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Currency</Text>
        <TouchableOpacity
                style={[styles.modalCurrencySelector, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={() => setShowCurrencyModal(true)}
          activeOpacity={0.8}
        >
                <Text style={styles.currencyFlag}>{selectedCurrency.flag}</Text>
                <View style={styles.currencyInfo}>
                  <Text style={[styles.currencyCode, { color: colors.text }]}>{selectedCurrency.code}</Text>
                  <Text style={[styles.currencyCountry, { color: colors.textMuted }]}>{selectedCurrency.country}</Text>
                </View>
                <Text style={[styles.currencySymbol, { color: colors.textMuted }]}>{selectedCurrency.symbol}</Text>
                <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
              </TouchableOpacity>
              {/* Amount Input */}
              <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Enter Amount</Text>
              <View style={styles.amountInputContainer}>
                <Text style={[styles.currencySymbol, { color: colors.textMuted, marginRight: 8 }]}>{selectedCurrency.symbol}</Text>
                <TextInput
                  style={[styles.modalAmountInput, { backgroundColor: colors.background, borderColor: amountError ? colors.error : colors.border, color: colors.text }]}
                  placeholder={`0.00`}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={handleAmountChange}
                  editable={!isLoading}
                />
              </View>
              {amountError ? (
                <Text style={[styles.errorText, { color: colors.error }]}>{amountError}</Text>
              ) : null}
              {/* Payment Methods */}
              <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Payment Method</Text>
              {paymentOptions.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.modalPaymentOption,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    paymentMethod === option.id && { backgroundColor: colors.lightBlue, borderColor: colors.primary },
                  ]}
                  onPress={() => handlePaymentMethodSelect(option.id)}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  <View style={styles.paymentMethodContent}>
                    <Ionicons
                      name={option.icon}
                      size={24}
                      color={paymentMethod === option.id ? colors.primary : colors.text}
                    />
                    <View style={styles.paymentMethodInfo}>
                      <Text style={[styles.paymentMethodLabel, { color: colors.text }]}>{option.label}</Text>
                      <Text style={[styles.paymentMethodDescription, { color: colors.textMuted }]}>{option.description}</Text>
                    </View>
                  </View>
                  {paymentMethod === option.id && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                  )}
        </TouchableOpacity>
              ))}
              <PrimaryButton
                title={isLoading ? 'Processing...' : 'Continue to Deposit'}
                onPress={handleDeposit}
                loading={isLoading}
                disabled={isLoading || !amount || !paymentMethod || !!amountError}
                style={[styles.modalActionButton, { backgroundColor: colors.primary }]}
                textStyle={styles.modalActionButtonText}
              />
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>

        {/* Currency Selection Modal */}
        <Modal
          visible={showCurrencyModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCurrencyModal(false)}
        >
          <BlurView intensity={20} tint="light" style={styles.currencyModalOverlay}>
            <TouchableOpacity style={styles.currencyModalBackdrop} activeOpacity={1} onPress={() => setShowCurrencyModal(false)} />
            <View style={[styles.currencyModalContent, { backgroundColor: colors.cardBackground }]} pointerEvents="box-none">
              <Text style={[styles.currencyModalTitle, { color: colors.text }]}>Select Currency</Text>
              {currencyOptions.map(opt => (
                <TouchableOpacity
                  key={opt.code}
                  style={[
                    styles.currencyModalOption,
                    { backgroundColor: colors.background },
                    opt.code === selectedCurrency.code && { backgroundColor: colors.lightBlue },
                  ]}
                  onPress={() => handleCurrencySelect(opt)}
                >
                  <Text style={styles.currencyFlag}>{opt.flag}</Text>
                  <View style={styles.currencyModalInfo}>
                    <Text style={[styles.currencyCode, { color: colors.text }]}>{opt.code}</Text>
                    <Text style={[styles.currencyCountry, { color: colors.textMuted }]}>{opt.country}</Text>
                  </View>
                  <Text style={[styles.currencySymbol, { color: colors.textMuted }]}>{opt.symbol}</Text>
                  {opt.code === selectedCurrency.code && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>
        </Modal>

        {/* Confirmation Modal */}
        <Modal
          visible={showConfirmationModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowConfirmationModal(false)}
        >
          <BlurView intensity={20} tint="light" style={styles.confirmationModalOverlay}>
            <TouchableOpacity style={styles.confirmationModalBackdrop} activeOpacity={1} onPress={() => setShowConfirmationModal(false)} />
            <View style={[styles.confirmationModalContent, { backgroundColor: colors.cardBackground }]} pointerEvents="box-none">
              <View style={styles.confirmationHeader}>
                <Ionicons name="card-outline" size={32} color={colors.primary} />
                <Text style={[styles.confirmationTitle, { color: colors.text }]}>Confirm Deposit</Text>
              </View>
              
              <View style={styles.confirmationDetails}>
                <View style={styles.confirmationRow}>
                  <Text style={[styles.confirmationLabel, { color: colors.textMuted }]}>Amount:</Text>
                  <Text style={[styles.confirmationValue, { color: colors.text }]}>{selectedCurrency.symbol}{amount}</Text>
                </View>
                <View style={styles.confirmationRow}>
                  <Text style={[styles.confirmationLabel, { color: colors.textMuted }]}>Currency:</Text>
                  <Text style={[styles.confirmationValue, { color: colors.text }]}>{selectedCurrency.code}</Text>
                </View>
                <View style={styles.confirmationRow}>
                  <Text style={[styles.confirmationLabel, { color: colors.textMuted }]}>Method:</Text>
                  <Text style={[styles.confirmationValue, { color: colors.text }]}>
                    {paymentOptions.find(p => p.id === paymentMethod)?.label}
                  </Text>
                </View>
                <View style={[styles.confirmationRow, styles.confirmationTotal]}>
                  <Text style={[styles.confirmationLabel, { color: colors.text, fontWeight: '600' }]}>Total:</Text>
                  <Text style={[styles.confirmationValue, { color: colors.primary, fontWeight: '700' }]}>{selectedCurrency.symbol}{totalAmount.toFixed(2)}</Text>
                </View>
              </View>
              {/* Add info row for Fee and Transaction Time */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                  <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
                  <Text style={[styles.confirmationLabel, { color: colors.textMuted, fontSize: 12 }]}>Fee: <Text style={{ color: colors.success, fontWeight: '600' }}>Free</Text></Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="time-outline" size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
                  <Text style={[styles.confirmationLabel, { color: colors.textMuted, fontSize: 12 }]}>Transaction Time: <Text style={{ color: colors.success, fontWeight: '600' }}>Instant</Text></Text>
                </View>
              </View>
              
              <View style={styles.confirmationButtons}>
                <TouchableOpacity
                  style={[styles.confirmationButton, styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setShowConfirmationModal(false)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.confirmationButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
          <TouchableOpacity
                  style={[styles.confirmationButton, styles.confirmButton, { backgroundColor: colors.primary }]}
                  onPress={confirmDeposit}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.confirmationButtonText, { color: colors.textInverse }]}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Modal>

        {/* Custom Alert */}
        {showCustomAlert && (
          <BlurView intensity={20} tint="light" style={styles.alertOverlay}>
            <View style={styles.alertBackdrop}>
              <View style={[styles.alertContainer, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.alertHeader}>
            <Ionicons
                    name={alertConfig.type === 'error' ? 'close-circle' : alertConfig.type === 'success' ? 'checkmark-circle' : 'information-circle'} 
                    size={24} 
                    color={alertConfig.type === 'error' ? colors.error : alertConfig.type === 'success' ? colors.success : colors.primary} 
            />
                  <Text style={[Typography.h4, styles.alertTitle, { color: colors.textPrimary }]}>
                    {alertConfig.title}
                  </Text>
                </View>
                <Text style={[Typography.bodyRegular, styles.alertMessage, { color: colors.textSecondary }]}>
                  {alertConfig.message}
            </Text>
                <TouchableOpacity 
                  style={[styles.alertButton, { backgroundColor: colors.primary }]}
                  onPress={handleAlertClose}
                  activeOpacity={0.8}
                >
                  <Text style={[Typography.button, { color: colors.textInverse }]}>OK</Text>
          </TouchableOpacity>
              </View>
      </View>
          </BlurView>
        )}
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Premium Gradient Header */}
      <LinearGradient
        colors={Colors.gradientPrimary}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} disabled={isLoading}>
            <Ionicons name="arrow-back-outline" size={28} color={Colors.textInverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Deposit Funds</Text>
          <View style={{width:28}}/>
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        {/* Premium Card Container */}
        <LinearGradient
          colors={Colors.gradientPrimary}
          style={styles.cardContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardContent}>
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
                activeOpacity={0.85}
              >
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={paymentMethod === option.id ? Colors.primary : Colors.textPrimary}
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
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} style={styles.selectedIcon} />
                )}
              </TouchableOpacity>
            ))}
            <PrimaryButton
              title={isLoading ? '' : 'Confirm Deposit'}
              onPress={handleDeposit}
              loading={isLoading}
              disabled={isLoading}
              style={styles.actionButton}
              textStyle={styles.actionButtonText}
            />
          </View>
        </LinearGradient>
      </ScrollView>
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
  headerGradient: {
    paddingBottom: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 18,
    paddingHorizontal: 18,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.textInverse,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  contentContainer: {
    padding: 20,
  },
  cardContainer: {
    borderRadius: 24,
    marginTop: -32,
    marginHorizontal: 16,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    padding: 2,
  },
  cardContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 22,
    padding: 10,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    marginBottom: 8,
    marginTop: 15,
    fontWeight: '600',
  },
  input: {
    ...Typography.bodyLarge,
    width: '100%',
    height: 44,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    marginBottom: 8,
    color: Colors.textPrimary,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    textAlign: 'center',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 6,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedPaymentOption: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  paymentIcon: {
    marginRight: 15,
  },
  paymentOptionText: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedPaymentOptionText: {
    color: Colors.textPrimary,
  },
  selectedIcon: {
    marginLeft: 'auto',
  },
  actionButton: {
    marginTop: 30,
    borderRadius: 16,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonText: {
    ...Typography.button,
  },
  currencySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 4,
    marginTop: 0,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  currencySelectorFlag: {
    fontSize: 18,
    marginRight: 8,
    textAlign: 'center',
    alignSelf: 'center',
  },
  currencySelectorText: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    alignSelf: 'center',
  },
  currencySelectorSymbol: {
    color: Colors.textMuted,
    fontWeight: '400',
    marginLeft: 4,
    textAlign: 'center',
    alignSelf: 'center',
  },
  currencyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  currencyModalContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    padding: 24,
    width: 280,
    alignItems: 'center',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 15,
  },
  currencyModalTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 16,
  },
  currencyModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 8,
    width: '100%',
  },
  currencyModalInfo: {
    flex: 1,
    marginLeft: 10,
  },
  currencyModalOptionActive: {
    backgroundColor: Colors.primaryLight,
  },
  // Modal-specific styles
  modalKeyboardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    flex: 1,
    width: '100%',
  },
  modalScrollContent: {
    flexGrow: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  modalCardContent: {
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
    backgroundColor: Colors.cardBackground,
    width: '100%',
    maxWidth: 480,
    minHeight: 500,
    height: '100%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
  },
  modalHeader: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    marginBottom: 12,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalHeaderLeft: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
    alignSelf: 'flex-start',
  },
  modalLabel: {
    ...Typography.bodyLarge,
    marginBottom: 8,
    marginTop: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalCurrencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  currencyFlag: {
    fontSize: 24,
    marginRight: 10,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  currencyCountry: {
    ...Typography.bodySmall,
  },
  currencySymbol: {
    fontSize: 18,
    marginLeft: 10,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  modalAmountInput: {
    ...Typography.bodyLarge,
    flex: 1,
    paddingVertical: 0,
    textAlign: 'center',
  },
  errorText: {
    ...Typography.bodySmall,
    marginTop: 5,
    textAlign: 'center',
  },
  modalPaymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodInfo: {
    marginLeft: 10,
    alignItems: 'center',
  },
  paymentMethodLabel: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    textAlign: 'center',
  },
  paymentMethodDescription: {
    ...Typography.bodySmall,
    marginTop: -2,
    textAlign: 'center',
  },
  paymentMethodFees: {
    ...Typography.bodySmall,
    marginTop: 2,
    textAlign: 'center',
  },
  modalActionButton: {
    marginTop: 8,
    borderRadius: 16,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalActionButtonText: {
    ...Typography.button,
    textAlign: 'center',
  },
  confirmationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confirmationModalContent: {
    width: '90%',
    maxWidth: 350,
    borderRadius: 24,
    padding: 20,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 15,
    position: 'relative',
  },
  confirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  confirmationTitle: {
    ...Typography.h3,
    marginLeft: 10,
    textAlign: 'center',
  },
  confirmationDetails: {
    marginBottom: 20,
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  confirmationLabel: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  confirmationValue: {
    ...Typography.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmationTotal: {
    marginTop: 10,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 10,
  },
  confirmButton: {
    // backgroundColor: Colors.primary, // This will be handled by the button's style prop
  },
  confirmationButtonText: {
    ...Typography.button,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  alertContainer: {
    width: '90%',
    maxWidth: 300,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 15,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertTitle: {
    marginLeft: 10,
    textAlign: 'center',
  },
  alertMessage: {
    textAlign: 'center',
    marginBottom: 20,
  },
  alertButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  confirmationMessageBox: {
    marginTop: 24,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  confirmationMessageTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  confirmationMessageText: {
    fontSize: 15,
    marginBottom: 12,
  },
  confirmationMessageButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  // --- Add these styles for perfect match with send modal ---
  headerLimitsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  headerLimitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLimitText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 4,
  },
  // --- Modal header styles for perfect match with send modal ---
  modalHeader: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    marginBottom: 12,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalHeaderLeft: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
    alignSelf: 'flex-start',
  },
});

export default DepositScreen; 