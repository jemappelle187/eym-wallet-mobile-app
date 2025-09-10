import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, SafeAreaView, ActivityIndicator, ScrollView, Modal, Alert, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback, StatusBar, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import PrimaryButton from '../components/PrimaryButton';
import { getFxQuote } from '../app/config/api';
import FxBanner from '../app/components/FxBanner';
import { useTheme } from '../contexts/ThemeContext';
import { paymentManager } from '../utils/PaymentAPIs';
import { mobileMoneyManager } from '../utils/MobileMoneyAPIs';
import { ROUTES } from '../navigation/routes';

const currencyOptions = [
  { code: 'GHS', symbol: '₵', country: 'Ghana', flag: '🇬🇭' },
  { code: 'USD', symbol: '$', country: 'United States', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', country: 'European Union', flag: '🇪🇺' },
  { code: 'AED', symbol: 'د.إ', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'NGN', symbol: '₦', country: 'Nigeria', flag: '🇳🇬' },
];

const paymentOptions = [
  { 
    id: 'mobile_money', 
    label: 'Mobile Money', 
    icon: 'phone-portrait-outline',
    description: 'Mobile money services',
    processingTime: 'Instant',
    fees: 'Free'
  },
  { 
    id: 'apple_pay', 
    label: 'Apple Pay', 
    icon: 'logo-apple',
    description: 'Pay with Apple Pay',
    processingTime: 'Instant',
    fees: 'Free'
  },
  { 
    id: 'google_pay', 
    label: 'Google Pay', 
    icon: 'logo-google',
    description: 'Pay with Google Pay',
    processingTime: 'Instant',
    fees: 'Free'
  },
  { 
    id: 'paypal', 
    label: 'PayPal', 
    icon: 'logo-paypal',
    description: 'Pay with PayPal',
    processingTime: 'Instant',
    fees: 'Free'
  },
  { 
    id: 'ideal', 
    label: 'iDEAL', 
    icon: 'card-outline',
    description: 'Pay from your Dutch bank',
    processingTime: 'Instant',
    fees: 'Free'
  },
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
    description: 'Bank account in your name',
    processingTime: 'Instant',
    fees: 'Free'
  },
];

const DepositScreen = ({ navigation, isModal, onClose, onDepositConfirmed }) => {
  const { colors = Colors } = useTheme();
  const { confirmPayment: stripeConfirmPayment } = useStripe();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(paymentOptions[0]); // Default to first option to prevent null errors
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(currencyOptions[2]); // Default to EUR
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});
  const [amountError, setAmountError] = useState('');
  const [processingFee, setProcessingFee] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardBrand, setCardBrand] = useState(null);
  const [bankLinked, setBankLinked] = useState(null);
  const [mobileProvider, setMobileProvider] = useState('mtn');
  const [mobilePhone, setMobilePhone] = useState('');
  const [methodModalAnimation] = useState(new Animated.Value(400));
  const [paymentSheetAnimation] = useState(new Animated.Value(600));
  const [isFullScreenModal, setIsFullScreenModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false); // Add animation lock
  // FX state for confirmation step
  const [fxInfo, setFxInfo] = useState(null);
  const [fxLoading, setFxLoading] = useState(false);
  const [fxError, setFxError] = useState('');
  // Preview under amount
  const [quotePreview, setQuotePreview] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteErr, setQuoteErr] = useState('');

  const computeTargetSymbol = (code) => (code === 'EUR' ? 'EUR' : 'USD');
  const computeStablecoin = (code) => (code === 'EUR' ? 'EURC' : 'USDC');

  useEffect(() => {
    async function fetchFx() {
      try {
        setFxError(''); setFxLoading(true);
        const base = selectedCurrency?.code || 'USD';
        const target = computeTargetSymbol(base);
        const amt = Number(amount) || 0;
        if (amt <= 0) { setFxInfo(null); return; }
        const q = await getFxQuote(base, target, amt);
        setFxInfo(q);
      } catch (e) {
        setFxError(e?.message || String(e));
        setFxInfo(null);
      } finally { setFxLoading(false); }
    }
    if (showConfirmationModal) fetchFx();
  }, [showConfirmationModal]);

  // Debounced live preview while typing amount
  useEffect(() => {
    setQuoteErr('');
    setQuotePreview(null);
    const amt = Number(amount);
    if (!amount || Number.isNaN(amt) || amt <= 0) return;
    const base = selectedCurrency?.code || 'USD';
    const target = computeTargetSymbol(base);
    const t = setTimeout(async () => {
      try {
        setQuoteLoading(true);
        const q = await getFxQuote(base, target, amt);
        setQuotePreview(q);
      } catch (e) {
        setQuoteErr(e?.message || String(e));
      } finally {
        setQuoteLoading(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [amount, selectedCurrency?.code]);

  // TEMPORARILY DISABLED: Animate method modal to prevent freezing
  useEffect(() => {
    if (showMethodModal) {
      // Disable animation temporarily to prevent freezing
      methodModalAnimation.setValue(0);
    } else {
      methodModalAnimation.setValue(400);
    }
  }, [showMethodModal, methodModalAnimation]);

  // TEMPORARILY DISABLED: Animate payment sheet to prevent freezing
  useEffect(() => {
    if (showPaymentMethodModal) {
      // Disable animation temporarily to prevent freezing
      paymentSheetAnimation.setValue(0);
    } else {
      paymentSheetAnimation.setValue(600);
    }
  }, [showPaymentMethodModal, paymentSheetAnimation]);

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

  const openMethodModal = () => {
    Keyboard.dismiss();
    if (!validateAmount(amount)) {
      showAlert('Invalid Amount', amountError || 'Please enter a valid amount to deposit.', 'error');
      return;
    }
    if (!paymentMethod) {
      showAlert('Payment Method', 'Please select a payment method.', 'error');
      return;
    }
    setShowMethodModal(true);
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
    
    try {
      await paymentManager.initialize();
      
      let res;
      
      // Handle different payment methods
      if (paymentMethod?.id === 'paypal') {
        res = await paymentManager.createPayPalPayment({
          amount: parseFloat(amount),
          currency: selectedCurrency.code,
          description: `Add money via ${paymentMethod?.label}`,
        });
      } else if (paymentMethod?.id === 'mobile_money') {
        // Validate mobile money input
        if (!mobilePhone.trim()) {
          showAlert('Phone Number Required', 'Please enter a valid phone number.', 'error');
          return;
        }
        
        res = await paymentManager.processMobileMoneyPayment({
          amount: parseFloat(amount),
          currency: selectedCurrency.code,
          phoneNumber: mobilePhone.trim(),
          provider: mobileProvider,
          description: `Add money via ${mobileProvider.toUpperCase()}`,
        });
      } else {
        res = await paymentManager.processPayment({
          method: paymentMethod?.id,
          amount: parseFloat(amount),
          currency: selectedCurrency.code,
          description: `Add money via ${paymentMethod?.label}`,
        });
      }
      
      if (res?.success) {
        if (paymentMethod?.id === 'paypal') {
          showAlert('PayPal Payment Created', 'Redirecting to PayPal for approval...', 'success');
          // In a real app, you would redirect to PayPal here
          setTimeout(() => {
            showAlert('Payment successful', `Added ${selectedCurrency.symbol}${amount} to your account.`, 'success');
            // Close all modals
            setShowMethodModal(false);
            setShowConfirmationModal(false);
            if (onDepositConfirmed) onDepositConfirmed();
            if (isModal && onClose) onClose();
          }, 2000);
        } else {
          showAlert('Payment successful', `Added ${selectedCurrency.symbol}${amount} to your account.`, 'success');
          // Close all modals
          setShowMethodModal(false);
          setShowConfirmationModal(false);
          if (onDepositConfirmed) onDepositConfirmed();
          if (isModal && onClose) onClose();
        }
      } else {
        showAlert('Payment failed', res?.error || 'Unable to process payment.', 'error');
      }
    } catch (e) {
      showAlert('Payment failed', e.message || 'Unable to process payment.', 'error');
    } finally {
      setIsLoading(false);
      // Don't reset payment method here as it might cause issues
      // Only reset if payment was successful
      if (res?.success) {
        setAmount('');
        setPaymentMethod(null);
        setProcessingFee(0);
        setTotalAmount(0);
        setMobilePhone('');
      }
    }
  };

  const handleStripeCardConfirm = async () => {
    try {
      if (!cardComplete) {
        showAlert('Card details', 'Please complete your card details.', 'error');
        return;
      }
      setIsLoading(true);
      // Create a payment intent (mocked in PaymentAPIs; replace with backend in production)
      const intent = await paymentManager.createPaymentIntent({ amount: parseFloat(amount), currency: selectedCurrency.code });
      if (!intent?.client_secret) {
        throw new Error('Failed to get client secret');
      }
      // Attempt to confirm with Stripe SDK. This requires a real Stripe client secret.
      // In test/dev without backend, this may fail; we catch and show a simulated success.
      try {
        const { error, paymentIntent } = await stripeConfirmPayment(intent.client_secret, { paymentMethodType: 'Card' });
        if (error) {
          // Stripe confirm error handled
          // Fall back to simulated success for sandbox UX
          showAlert('Sandbox', 'Simulated payment in test mode (no backend).', 'success');
        } else if (paymentIntent) {
          showAlert('Payment success', 'Your card was charged in test mode.', 'success');
        }
      } catch (stripeErr) {
        // Stripe SDK error handled
        showAlert('Sandbox', 'Simulated payment in test mode (no backend).', 'success');
      }
    } catch (e) {
      showAlert('Payment error', e.message || 'Something went wrong.', 'error');
    } finally {
      setIsLoading(false);
      setShowMethodModal(false);
    }
  };

  const handlePlaidLink = async () => {
    try {
      setIsLoading(true);
      await paymentManager.initialize();
      
      // Starting Plaid Link flow
      
      // Call the Plaid Link flow
      const res = await paymentManager.openPlaidLinkFlow();
      
              // Plaid Link result received
      
      if (res?.success) {
        setBankLinked(res);
        const accountInfo = `${res.accountName} ••••${res.lastFour}`;
        const institutionInfo = res.institution ? ` (${res.institution})` : '';
        showAlert('Bank linked successfully', `${accountInfo}${institutionInfo} is now connected to your account.`, 'success');
        // Close the sheet shortly after success
        setTimeout(() => setShowMethodModal(false), 1000);
      } else {
        // Handle specific error cases
        let errorMessage = res?.error || 'Unable to link bank account. Please try again.';
        
        // Check for specific error patterns
        if (errorMessage.includes('timeout')) {
          errorMessage = 'Connection timeout - please check your internet and try again.';
        } else if (errorMessage.includes('SDK')) {
          errorMessage = 'Bank linking service temporarily unavailable - please try again later.';
        } else if (errorMessage.includes('cancelled')) {
          errorMessage = 'Bank linking was cancelled.';
        }
        
        showAlert('Link failed', errorMessage, 'error');
      }
    } catch (e) {
      // Plaid Link error handled
      let errorMessage = e.message || 'Unable to link bank account. Please try again.';
      
      // Handle specific error patterns
      if (errorMessage.includes('public_key is being deprecated')) {
        errorMessage = 'Bank linking service is being updated - please try again later.';
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'Connection timeout - please check your internet and try again.';
      }
      
      showAlert('Link failed', errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
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

  const handlePaymentMethodSelect = (method) => {
    // SIMPLIFIED: Direct state update without animations to prevent freezing
    setPaymentMethod(method);
    setShowPaymentMethodModal(false);
    
    // Only open method modal for specific payment types
    if (method?.id === 'card' || method?.id === 'bank' || method?.id === 'mobile_money' || method?.id === 'ideal') {
      if (method?.id === 'mobile_money') {
        // Navigate to dedicated mobile money payment screen
        navigation.navigate('MobileMoneyPayment', {
          initialAmount: parseFloat(amount),
          initialCurrency: selectedCurrency.code,
          initialProvider: 'mtn'
        });
        return;
      }
      setMobileProvider('mtn');
      setMobilePhone('');
      setShowMethodModal(true);
    }
  };

  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency);
    setShowCurrencyModal(false);
  };

  const handleMobileMoneyContinue = async () => {
    try {
      if (!mobilePhone || mobilePhone.replace(/\D/g, '').length < 7) {
        showAlert('Phone number', 'Please enter a valid phone number.', 'error');
        return;
      }
      setIsLoading(true);
      const res = await paymentManager.requestMobileMoneyPayment({
        amount: parseFloat(amount),
        currency: selectedCurrency.code,
        phoneNumber: mobilePhone,
        provider: mobileProvider,
        description: 'Add money via Mobile Money',
      });
      if (res?.success) {
        showAlert('Request sent', 'Approve the request on your phone to complete payment.', 'success');
        setShowMethodModal(false);
      } else {
        showAlert('Payment failed', res?.error || 'Unable to initiate mobile money payment.', 'error');
      }
    } catch (e) {
      showAlert('Payment failed', e.message || 'Unable to initiate mobile money payment.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isModal) {
    return (
      <>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.glassmorphismContainer}>
            <BlurView intensity={20} tint="light" style={styles.glassmorphismCard}>
              <View style={styles.glassmorphismContent}>
            {/* Header */}
            <View style={styles.revolutHeader}>
              <TouchableOpacity onPress={onClose} style={styles.revolutCloseButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.revolutTitle, { color: '#1a1a1a', fontWeight: '700' }]}>Add money</Text>
              <Text style={[styles.revolutBalance, { color: '#666666' }]}>Balance: {selectedCurrency.symbol} 0</Text>
            </View>

            {/* Main Content Area */}
            <View style={styles.revolutContent}>
              {/* Live FX banner */}
              <FxBanner
                base={selectedCurrency.code}
                target={selectedCurrency.code === 'EUR' ? 'EUR' : 'USD'}
                amount={Number(amount) || 100}
              />
              
              {/* Large Amount Input */}
              <View style={styles.revolutAmountContainer}>
                <TextInput
                  style={[styles.revolutAmountInput, { color: '#1a1a1a' }]}
                  placeholder={`${selectedCurrency.symbol} 50`}
                  placeholderTextColor={'#999999'}
                  keyboardType="numeric"
                  value={amount ? `${selectedCurrency.symbol} ${amount}` : ''}
                  onChangeText={text => {
                    const clean = text.replace(selectedCurrency.symbol, '').replace(/\s/g, '').replace(/[^0-9.]/g, '');
                    handleAmountChange(clean);
                  }}
                  editable={!isLoading}
                  autoFocus={true}
                />
              </View>
              {/* Stablecoin preview under amount */}
              <View style={{ marginTop: 6 }}>
                {quoteLoading ? (
                  <Text style={{ color: colors.text }}>Calculating…</Text>
                ) : quoteErr ? (
                  <Text style={{ color: colors.error }}>FX unavailable</Text>
                ) : quotePreview ? (
                  <Text style={{ color: colors.text }}>
                    ≈ {quotePreview.targetAmount?.toFixed(2)} {computeStablecoin(selectedCurrency.code)}
                  </Text>
                ) : null}
              </View>

              {/* Currency Selector Dropdown */}
              <TouchableOpacity 
                style={[styles.currencyDropdown, { backgroundColor: 'rgba(0,0,0,0.1)' }]}
                onPress={() => setShowCurrencyModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.currencyDropdownContent}>
                  <Text style={styles.currencyDropdownFlag}>{selectedCurrency.flag}</Text>
                  <Text style={[styles.currencyDropdownText, { color: '#1a1a1a' }]}>
                    {selectedCurrency.code}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#666666" />
                </View>
              </TouchableOpacity>

              {/* Payment Method Dropdown */}
              <TouchableOpacity 
                style={[styles.revolutDropdown, { backgroundColor: 'rgba(0,0,0,0.1)' }]}
                onPress={() => setShowPaymentMethodModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.revolutDropdownContent}>
                  <Ionicons name={paymentMethod?.icon || 'card-outline'} size={20} color="#1a1a1a" />
                  <Text style={[styles.revolutDropdownText, { color: '#1a1a1a' }]}>
                    {paymentMethod?.label || 'Select Payment Method'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666666" />
                </View>
              </TouchableOpacity>

              {/* Processing Info */}
              <Text style={[styles.revolutProcessingText, { color: '#666666' }]}>
                Arriving • {paymentMethod?.processingTime || 'Instant'}
              </Text>
            </View>

            {/* Bottom CTA Button */}
            <View style={styles.revolutBottomArea}>
              {paymentMethod?.id === 'apple_pay' ? (
                <TouchableOpacity
                  onPress={openMethodModal}
                  disabled={isLoading || !amount || !!amountError}
                  activeOpacity={0.85}
                  style={[styles.applePayButton, (isLoading || !amount || !!amountError) && { opacity: 0.5 }]}
                >
                  <Ionicons name="logo-apple" size={22} color={'#1a1a1a'} style={{ marginRight: 8 }} />
                  <Text style={styles.applePayText}>Pay</Text>
                </TouchableOpacity>
              ) : paymentMethod?.id === 'google_pay' ? (
                <TouchableOpacity
                  onPress={openMethodModal}
                  disabled={isLoading || !amount || !!amountError}
                  activeOpacity={0.85}
                  style={[styles.googlePayButton, (isLoading || !amount || !!amountError) && { opacity: 0.5 }]}
                >
                  <Ionicons name="logo-google" size={22} color={'#1a1a1a'} style={{ marginRight: 8 }} />
                  <Text style={styles.googlePayText}>Pay</Text>
                </TouchableOpacity>
              ) : (
                <PrimaryButton
                  title={paymentMethod?.label || 'Select Payment Method'}
                  onPress={openMethodModal}
                  loading={isLoading}
                  disabled={isLoading || !amount || !!amountError || !paymentMethod}
                  style={[styles.revolutCTAButton, { backgroundColor: colors.background }]}
                  textStyle={[styles.revolutCTAText, { color: colors.text }]}
                />
              )}
            </View>
              </View>
            </BlurView>
          </View>
        </TouchableWithoutFeedback>

        {/* iOS-Style Slide-Up Sheet for Payment Methods */}
        <Modal
          visible={showPaymentMethodModal}
          transparent
          animationType="none"
          onRequestClose={() => setShowPaymentMethodModal(false)}
        >
          <View style={styles.iosSheetOverlay}>
            <TouchableOpacity 
              style={styles.iosSheetBackdrop} 
              activeOpacity={1} 
              onPress={() => setShowPaymentMethodModal(false)} 
            />
            <Animated.View 
              style={[
                styles.iosSheetContainer,
                {
                  transform: [{
                    translateY: paymentSheetAnimation
                  }]
                }
              ]}
            >
              {/* Drag Handle */}
              <View style={styles.iosSheetHandle}>
                <View style={styles.iosSheetHandleBar} />
              </View>
              
              {/* Header */}
              <View style={styles.iosSheetHeader}>
                <Text style={styles.iosSheetTitle}>Payment Methods</Text>
                <TouchableOpacity 
                  style={styles.iosSheetCloseButton}
                  onPress={() => setShowPaymentMethodModal(false)}
                >
                  <Ionicons name="close" size={24} color="#1a1a1a" />
                </TouchableOpacity>
              </View>

              {/* Payment Methods */}
              <ScrollView 
                style={styles.iosSheetContent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.iosSheetScrollContent}
              >
                {paymentOptions.map(method => (
                  <TouchableOpacity
                    key={method.id}
                    style={styles.iosSheetMethodItem}
                    onPress={() => handlePaymentMethodSelect(method)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.iosSheetMethodContent}>
                      <View style={styles.iosSheetMethodIcon}>
                        <Ionicons name={method.icon} size={24} color="#1e40af" />
                      </View>
                      <View style={styles.iosSheetMethodInfo}>
                        <Text style={styles.iosSheetMethodTitle}>{method.label}</Text>
                        <Text style={styles.iosSheetMethodSubtitle}>
                          {method.description}
                        </Text>
                      </View>
                      <View style={styles.iosSheetRightContainer}>
                        <View style={styles.iosSheetProcessingTime}>
                          <Ionicons name="time-outline" size={12} color="#666666" />
                          <Text style={styles.iosSheetProcessingText}>
                            {method.processingTime}
                          </Text>
                        </View>
                        {(method.id === 'card' || method.id === 'bank') && (
                          <View style={styles.iosSheetFeeContainer}>
                            <Ionicons name="alert-circle-outline" size={10} color="#ff6b6b" />
                            <Text style={styles.iosSheetFeeText}>
                              {method.id === 'card' ? '2.5% fee applies' : '1.5% fee applies'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* Currency Selection Modal */}
        <Modal
          visible={showCurrencyModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCurrencyModal(false)}
        >
          <View style={styles.revolutModalOverlay}>
            <TouchableOpacity 
              style={styles.revolutModalBackdrop} 
              activeOpacity={1} 
              onPress={() => setShowCurrencyModal(false)} 
            />
            <BlurView intensity={20} tint="light" style={styles.glassmorphismModalCard}>
              <View style={styles.glassmorphismModalContent}>
                {/* Modal Header */}
                <View style={styles.revolutModalHeader}>
                  <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                    <Ionicons name="close" size={24} color="#1a1a1a" />
                  </TouchableOpacity>
                  <Text style={styles.revolutModalTitle}>Select Currency</Text>
                  <View style={{ width: 24 }} />
                </View>

                {/* Currency Options */}
                <View style={styles.currencyModalContent}>
                  {currencyOptions.map(currency => (
                    <TouchableOpacity
                      key={currency.code}
                      style={[
                        styles.currencyModalItem,
                        { backgroundColor: currency.code === selectedCurrency.code ? 'rgba(30, 64, 175, 0.1)' : 'transparent' }
                      ]}
                      onPress={() => {
                        setSelectedCurrency(currency);
                        setShowCurrencyModal(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.currencyModalItemContent}>
                        <Text style={styles.currencyModalFlag}>{currency.flag}</Text>
                        <View style={styles.currencyModalInfo}>
                          <Text style={[styles.currencyModalCode, { color: '#1a1a1a' }]}>{currency.code}</Text>
                          <Text style={[styles.currencyModalCountry, { color: '#666666' }]}>{currency.country}</Text>
                        </View>
                        {currency.code === selectedCurrency.code && (
                          <Ionicons name="checkmark" size={20} color="#1e40af" />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </BlurView>
          </View>
        </Modal>

        {/* Method-specific Flow Modal */}
        <Modal
          visible={showMethodModal}
          transparent
          animationType="none"
          onRequestClose={() => setShowMethodModal(false)}
        >
          <View style={styles.revolutModalOverlay}>
            <TouchableOpacity 
              style={styles.revolutModalBackdrop} 
              activeOpacity={1} 
              onPress={() => setShowMethodModal(false)} 
            />
            <Animated.View 
              style={[
                styles.glassmorphismModalCard,
                {
                  transform: [{
                    translateY: methodModalAnimation
                  }]
                }
              ]}
            >
              <BlurView intensity={20} tint="light" style={styles.glassmorphismModalContent}>
                {/* Header */}
                <View style={styles.revolutModalHeader}>
                  <TouchableOpacity onPress={() => setShowMethodModal(false)}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.revolutModalTitle}>
                    {paymentMethod?.id === 'apple_pay' && 'Apple Pay'}
                    {paymentMethod?.id === 'bank' && 'Easy bank transfer'}
                    {paymentMethod?.id === 'card' && 'Card in your name'}
                    {paymentMethod?.id === 'ideal' && 'iDEAL'}
                    {paymentMethod?.id === 'mobile_money' && 'Mobile Money'}
                  </Text>
                  <View style={{ width: 24 }} />
                </View>

                {/* Body per method */}
                {paymentMethod?.id === 'apple_pay' && (
                  <View style={{ paddingHorizontal: 20 }}>
                    <Text style={[Typography.bodyLarge, { color: colors.text, textAlign: 'center', marginBottom: 16 }]}>Pay {selectedCurrency.symbol}{amount}</Text>
                    <TouchableOpacity activeOpacity={0.85} style={styles.applePayButtonLarge} onPress={confirmDeposit}>
                      <Ionicons name="logo-apple" size={24} color={'#1a1a1a'} style={{ marginRight: 8 }} />
                      <Text style={styles.applePayText}>Pay</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {paymentMethod?.id === 'google_pay' && (
                  <View style={{ paddingHorizontal: 20 }}>
                    <Text style={[Typography.bodyLarge, { color: colors.text, textAlign: 'center', marginBottom: 16 }]}>Pay {selectedCurrency.symbol}{amount}</Text>
                    <TouchableOpacity activeOpacity={0.85} style={styles.googlePayButtonLarge} onPress={confirmDeposit}>
                      <Ionicons name="logo-google" size={24} color={'#1a1a1a'} style={{ marginRight: 8 }} />
                      <Text style={styles.googlePayText}>Pay</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {paymentMethod?.id === 'ideal' && (
                  <View style={{ paddingHorizontal: 20 }}>
                    <Text style={[Typography.bodyLarge, { color: colors.text, textAlign: 'center', marginBottom: 16 }]}>Select your bank to pay with iDEAL</Text>
                    <PrimaryButton title="Continue" onPress={confirmDeposit} style={styles.modalActionButton} textStyle={styles.modalActionButtonText} />
                  </View>
                )}

                {paymentMethod?.id === 'bank' && (
                  <View style={{ paddingHorizontal: 20 }}>
                    <Text style={[Typography.bodyLarge, { color: colors.text, textAlign: 'center', marginBottom: 16 }]}>Transfer from your bank account</Text>
                    <PrimaryButton 
                      title="Continue" 
                      onPress={() => {
                        setShowMethodModal(false);
                        navigation.navigate(ROUTES.BANK_AMOUNT, {
                          amount: amount,
                          currency: selectedCurrency.code
                        });
                      }} 
                      style={styles.modalActionButton} 
                      textStyle={styles.modalActionButtonText} 
                    />
                  </View>
                )}

                {paymentMethod?.id === 'card' && (
                  <View style={{ paddingHorizontal: 20 }}>
                    {/* Stripe CardField for tokenization (keeps design minimal) */}
                    <View style={{ position: 'relative' }}>
                      <CardField
                        postalCodeEnabled={true}
                        placeholders={{ number: '1234 1234 1234 1234' }}
                        cardStyle={{
                          backgroundColor: Colors.background,
                          textColor: colors.text,
                          placeholderColor: colors.textMuted,
                          borderRadius: 14,
                        }}
                        style={{ width: '100%', height: 52, marginTop: 8 }}
                        onCardChange={(details) => {
                          setCardComplete(details.complete);
                          setCardBrand(details.brand || null);
                        }}
                      />
                      {cardBrand && (
                        <View style={styles.cardBrandBadge}>
                          <Text style={styles.cardBrandText}>{cardBrand?.toUpperCase()}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.cardFieldRow}>
                      <TextInput placeholder="Name on card" placeholderTextColor={colors.textMuted} style={styles.cardField} />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                      <TextInput placeholder="MM/YY" placeholderTextColor={colors.textMuted} style={[styles.cardField, { flex: 1 }]} keyboardType="number-pad" />
                      <TextInput placeholder="CVV" placeholderTextColor={colors.textMuted} style={[styles.cardField, { flex: 1 }]} keyboardType="number-pad" />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                      <TextInput placeholder="Postal / ZIP" placeholderTextColor={colors.textMuted} style={[styles.cardField, { flex: 1 }]} keyboardType="default" />
                    </View>
                    <PrimaryButton title="Continue" onPress={handleStripeCardConfirm} style={[styles.modalActionButton, { marginTop: 16 }]} textStyle={styles.modalActionButtonText} />
                  </View>
                )}

                {paymentMethod?.id === 'paypal' && (
                  <View style={{ paddingHorizontal: 20 }}>
                    <Text style={[Typography.bodyLarge, { color: colors.text, textAlign: 'center', marginBottom: 16 }]}>Pay with PayPal</Text>
                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                      <Ionicons name="logo-paypal" size={48} color="#0070BA" />
                    </View>
                    <Text style={[Typography.bodyMedium, { color: colors.textMuted, textAlign: 'center', marginBottom: 20 }]}>
                      You'll be redirected to PayPal to complete your payment securely.
                    </Text>
                    <View style={{ backgroundColor: colors.cardBackground, padding: 16, borderRadius: 12, marginBottom: 20 }}>
                      <Text style={[Typography.bodyMedium, { color: colors.text, textAlign: 'center', fontWeight: '600' }]}>
                        Amount: {selectedCurrency.symbol}{amount}
                      </Text>
                    </View>
                    <PrimaryButton 
                      title="Continue with PayPal" 
                      onPress={confirmDeposit} 
                      style={styles.modalActionButton} 
                      textStyle={styles.modalActionButtonText} 
                    />
                  </View>
                )}

                {paymentMethod?.id === 'mobile_money' && (
                  <View style={{ paddingHorizontal: 20 }}>
                    <Text style={[Typography.bodyLarge, { color: colors.text, textAlign: 'center', marginBottom: 16 }]}>Mobile Money Payment</Text>
                    
                    {/* Provider Selection */}
                    <View style={{ marginBottom: 20 }}>
                      <Text style={[Typography.bodyMedium, { color: colors.text, marginBottom: 8 }]}>Select Provider</Text>
                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                        {['mtn', 'vodafone', 'airtel', 'mpesa'].map(provider => (
                          <TouchableOpacity
                            key={provider}
                            style={[
                              styles.providerButton,
                              { 
                                backgroundColor: mobileProvider === provider ? colors.primary : colors.cardBackground,
                                borderColor: colors.border
                              }
                            ]}
                            onPress={() => setMobileProvider(provider)}
                          >
                            <Text style={[
                              styles.providerButtonText,
                              { color: mobileProvider === provider ? colors.textInverse : colors.text }
                            ]}>
                              {provider.toUpperCase()}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Phone Number Input */}
                    <View style={{ marginBottom: 20 }}>
                      <Text style={[Typography.bodyMedium, { color: colors.text, marginBottom: 8 }]}>Phone Number</Text>
                      <TextInput
                        placeholder={`Enter ${mobileProvider.toUpperCase()} number`}
                        placeholderTextColor={colors.textMuted}
                        value={mobilePhone}
                        onChangeText={setMobilePhone}
                        style={[
                          styles.mobilePhoneInput,
                          { 
                            backgroundColor: colors.cardBackground,
                            borderColor: colors.border,
                            color: colors.text
                          }
                        ]}
                        keyboardType="phone-pad"
                      />
                    </View>

                    {/* Amount Display */}
                    <View style={{ backgroundColor: colors.cardBackground, padding: 16, borderRadius: 12, marginBottom: 20 }}>
                      <Text style={[Typography.bodyMedium, { color: colors.text, textAlign: 'center', fontWeight: '600' }]}>
                        Amount: {selectedCurrency.symbol}{amount}
                      </Text>
                    </View>

                    <PrimaryButton 
                      title={`Pay with ${mobileProvider.toUpperCase()}`} 
                      onPress={confirmDeposit} 
                      style={styles.modalActionButton} 
                      textStyle={styles.modalActionButtonText} 
                    />
                  </View>
                )}
              </BlurView>
            </Animated.View>
          </View>
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
                    {paymentMethod?.label}
                  </Text>
                </View>
                <View style={[styles.confirmationRow, styles.confirmationTotal]}>
                  <Text style={[styles.confirmationLabel, { color: colors.text, fontWeight: '600' }]}>Total:</Text>
                  <Text style={[styles.confirmationValue, { color: colors.primary, fontWeight: '700' }]}>{selectedCurrency.symbol}{totalAmount.toFixed(2)}</Text>
                </View>
              </View>
              {/* FX details (live, cached server-side) */}
              <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>FX details</Text>
                  <TouchableOpacity onPress={async()=>{
                    try { setFxError(''); setFxLoading(true);
                      const base = selectedCurrency?.code || 'USD';
                      const target = computeTargetSymbol(base);
                      const amt = Number(amount) || 0; if (amt <= 0) return;
                      const q = await getFxQuote(base, target, amt); setFxInfo(q);
                    } catch(e){ setFxError(e?.message||String(e)); }
                    finally{ setFxLoading(false);} }} disabled={fxLoading}>
                    <Text style={{ color: colors.primary }}>{fxLoading ? 'Refreshing…' : 'Refresh'}</Text>
                  </TouchableOpacity>
                </View>
                {fxError ? (
                  <Text style={{ color: colors.error, marginTop: 6 }}>Error: {fxError}</Text>
                ) : fxInfo ? (
                  <View style={{ marginTop: 6 }}>
                    <Text style={{ color: colors.textMuted }}>
                      {fxInfo.base}→{fxInfo.target} rate {fxInfo.rate.toFixed(6)} (eff {fxInfo.effectiveRate.toFixed(6)}) • {fxInfo.source}
                    </Text>
                    <Text style={{ color: colors.textMuted, marginTop: 2 }}>
                      You will receive ≈ {fxInfo.targetAmount.toFixed(2)} {computeStablecoin(selectedCurrency.code)}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                      Updated {new Date(fxInfo.ts).toLocaleTimeString()}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ color: colors.textMuted, marginTop: 6 }}>FX will be calculated using a live quote.</Text>
                )}
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
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
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
            {/* Live FX banner */}
            <FxBanner
              base={selectedCurrency?.code || 'USD'}
              target={(selectedCurrency?.code === 'EUR') ? 'EUR' : 'USD'}
              amount={Number(amount) || 100}
            />
            {/* Stablecoin preview under amount */}
            {(() => {
              const stable = computeStablecoin(selectedCurrency?.code || 'USD');
              return (
                <View style={{ marginTop: 6 }}>
                  {quoteLoading ? (
                    <Text style={{ color: colors.textMuted }}>Calculating…</Text>
                  ) : quoteErr ? (
                    <Text style={{ color: colors.error }}>FX unavailable</Text>
                  ) : quotePreview ? (
                    <Text style={{ color: colors.textMuted }}>≈ {quotePreview.targetAmount?.toFixed(2)} {stable}</Text>
                  ) : null}
                </View>
              );
            })()}
            
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
    paddingVertical: 8,
    paddingHorizontal: 20,
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
    minHeight: 400,
    height: '90%',
    marginTop: 60,
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
    marginBottom: 6,
    marginTop: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalCurrencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
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
    alignItems: 'center',
  },
  currencyCode: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    textAlign: 'center',
  },
  currencyCountry: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  currencySymbol: {
    fontSize: 18,
    marginLeft: 10,
    textAlign: 'center',
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
    marginBottom: 8,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
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
    maxWidth: 380,
    borderRadius: 20,
    padding: 24,
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
    marginBottom: 20,
  },
  confirmationTitle: {
    ...Typography.h3,
    marginLeft: 12,
    textAlign: 'center',
  },
  confirmationDetails: {
    marginBottom: 24,
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
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: Colors.border,
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
  
  // Glassmorphism Components
  glassmorphismContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  glassmorphismCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 20,
  },
  glassmorphismContent: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minHeight: 400,
  },
  revolutHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'relative',
  },
  revolutCloseButton: {
    position: 'absolute',
    left: 20,
    top: 0,
    padding: 8,
  },
  revolutTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  revolutBalance: {
    fontSize: 14,
  },
  revolutContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  revolutAmountContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  currencyDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
    minWidth: 120,
    justifyContent: 'space-between',
  },
  currencyDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencyDropdownFlag: {
    fontSize: 18,
  },
  currencyDropdownText: {
    fontSize: 16,
    fontWeight: '500',
  },
  revolutAmountInput: {
    fontSize: 72,
    fontWeight: '700',
    fontFamily: 'Montserrat',
    textAlign: 'center',
    minWidth: 200,
    backgroundColor: 'transparent',
  },
  revolutDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
    minWidth: 280,
    justifyContent: 'center',
  },
  revolutDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  revolutDropdownText: {
    fontSize: 16,
    fontWeight: '500',
  },
  revolutProcessingText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 40,
  },
  revolutBottomArea: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  revolutCTAButton: {
    borderRadius: 25,
    height: 50,
  },
  revolutCTAText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applePayButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  applePayButtonLarge: {
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  applePayText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  googlePayButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  googlePayButtonLarge: {
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  googlePayText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  
  // Modal Styles
  revolutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  revolutModalBackdrop: {
    flex: 1,
  },
  revolutModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  glassmorphismModalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 20,
  },
  glassmorphismModalContent: {
    paddingTop: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  revolutModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  revolutModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  revolutCurrencySection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  revolutSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    color: '#ffffff',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  revolutCurrencyPills: {
    flexDirection: 'row',
  },
  revolutCurrencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    gap: 6,
  },
  revolutCurrencyFlag: {
    fontSize: 16,
  },
  revolutCurrencyCode: {
    fontSize: 14,
    fontWeight: '500',
  },
  revolutMethodsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },

  revolutMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'center',
  },
  revolutMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.textMuted + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  revolutMethodInfo: {
    flex: 1,
    alignItems: 'center',
  },
  revolutMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  revolutMethodSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#ffffff',
  },
  revolutModalBottom: {
    paddingHorizontal: 20,
  },
  cardFieldRow: {
    marginTop: 8,
  },
  cardField: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
  },
  cardBrandBadge: {
    position: 'absolute',
    left: 10,
    top: 14,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBrandText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  currencyModalContent: {
    paddingHorizontal: 20,
  },
  currencyModalItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  currencyModalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currencyModalFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  currencyModalInfo: {
    flex: 1,
  },
  currencyModalCode: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  currencyModalCountry: {
    fontSize: 14,
  },
  revolutDoneButton: {
    borderRadius: 25,
    height: 50,
  },
  revolutDoneText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Mobile Money Styles
  providerButton: {
    minWidth: '22%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  providerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mobilePhoneInput: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    fontSize: 16,
  },
  
  // Glassmorphism Payment Method Styles
  glassmorphismMethodItem: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  glassmorphismMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'flex-start',
    width: '100%',
  },
  glassmorphismMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  glassmorphismMethodInfo: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  glassmorphismMethodTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
    textAlign: 'left',
    fontFamily: 'Montserrat',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  glassmorphismMethodSubtitle: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'left',
    fontFamily: 'Montserrat',
    fontWeight: '400',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  rightSideContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 60,
  },
  processingTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  processingTimeText: {
    fontSize: 11,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    fontWeight: '500',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  feeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 2,
  },
  feeText: {
    fontSize: 9,
    color: '#ff6b6b',
    fontFamily: 'Montserrat',
    fontWeight: '600',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  
  // Full Screen Modal Styles
  fullScreenModalOverlay: {
    backgroundColor: 'transparent',
  },
  fullScreenModalCard: {
    flex: 1,
    margin: 0,
    borderRadius: 0,
  },
  fullScreenModalContent: {
    flex: 1,
    paddingTop: 60,
  },
  fullScreenMethodsContent: {
    paddingBottom: 40,
  },
  
  // iOS-Style Slide-Up Sheet Styles
  iosSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  iosSheetBackdrop: {
    flex: 1,
  },
  iosSheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  iosSheetHandle: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  iosSheetHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  iosSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  iosSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: 'Montserrat',
  },
  iosSheetCloseButton: {
    padding: 8,
  },
  iosSheetContent: {
    flex: 1,
  },
  iosSheetScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  iosSheetMethodItem: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iosSheetMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  iosSheetMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iosSheetMethodInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  iosSheetMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    fontFamily: 'Montserrat',
  },
  iosSheetMethodSubtitle: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat',
  },
  iosSheetRightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 60,
  },
  iosSheetProcessingTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  iosSheetProcessingText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Montserrat',
    fontWeight: '500',
  },
  iosSheetFeeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 2,
  },
  iosSheetFeeText: {
    fontSize: 10,
    color: '#ff6b6b',
    fontFamily: 'Montserrat',
    fontWeight: '600',
  },
});

export default DepositScreen; 
