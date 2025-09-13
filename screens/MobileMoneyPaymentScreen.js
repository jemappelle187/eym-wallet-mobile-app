import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar, Keyboard, Animated } from 'react-native';
// Removed expo-network import - using basic fetch test instead
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { mobileMoneyManager, MOBILE_MONEY_CONFIG, MTNCollectionsAPI } from '../utils/MobileMoneyAPIs';
import { getFxQuote } from '../app/config/api';
import { mtnApiService } from '../services/mtnApi';
import PrimaryButton from '../components/PrimaryButton';
import EnhancedPrimaryButton from '../components/EnhancedPrimaryButton';
import RescueCard from '../components/RescueCard';
import SuccessActions from '../components/SuccessActions';
import { useRtpPoller } from '../hooks/useRtpPoller';
import { formatMoney, formatFeeAdjacency } from '../utils/moneyFormatting';
import StepBar from '../components/progress/StepBar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MobileMoneyPaymentScreen = ({ navigation, route, onClose, onDepositSuccess }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  
  // Debug: Log props on component mount (only once)
  useEffect(() => {
    console.log('📱 MobileMoneyPaymentScreen mounted');
  }, []);

  // State for tracking hydration and preventing race conditions
  const [hydrated, setHydrated] = useState(false);
  const processingConsumedRef = useRef(false);
  const lastParamsRef = useRef('');

  // 1) Hydrate from params (runs before paint) - with guard to prevent re-firing
  useLayoutEffect(() => {
    const serialized = JSON.stringify(route?.params ?? {});
    if (serialized === lastParamsRef.current) return;
    lastParamsRef.current = serialized;

    const p = route.params ?? {};
    processingConsumedRef.current = false; // reset per new params
    setHydrated(false);

    console.log('🔄 Hydrating state from route params:', p);

    if (p.selectedCurrency || p.initialCurrency) {
      const currency = p.selectedCurrency || p.initialCurrency;
      console.log('🎯 Setting currency from params:', currency);
      setSelectedCurrency(currency);
    } else {
      // Load saved currency preference if no param provided
      (async () => {
        try {
          const saved = await AsyncStorage.getItem('preferredCurrency');
          if (saved) setSelectedCurrency(saved);
        } catch {}
      })();
    }
    if (p.selectedProvider || p.initialProvider) {
      setSelectedProvider(p.selectedProvider || p.initialProvider);
    }
    if (p.selectedVerifiedPhone) setSelectedVerifiedPhone(p.selectedVerifiedPhone);
    if (p.recipientName) setRecipientName(p.recipientName);

    if (p.initialAmount != null) {
      const amt = String(p.initialAmount);
      console.log('📊 Setting amount from initialAmount:', amt);
      setAmount(amt);
      setLocalAmount(amt);
    }
    setHydrated(true);
  }, [route.params]);

  // 2) Trigger once conditions are met
  useEffect(() => {
    const shouldStart =
      route.params?.startProcessing &&
      hydrated &&
      !!amount?.trim() &&
      !processingConsumedRef.current;

    if (!shouldStart) return;

    console.log('🚀 Starting processing - all conditions met');
    processingConsumedRef.current = true;         // guard re-fire
    handleMobileMoneyAction({ amount });          // pass value explicitly
    navigation.setParams({ startProcessing: false }); // consume param
  }, [route.params?.startProcessing, hydrated, amount]);
  
  // Determine if this is for deposit (Add Money) or send (Send Money)
  const isDeposit = route.params?.isDeposit || false;
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [amount, setAmount] = useState('');
  const [usdcValue, setUsdcValue] = useState('0.00');
  const [localValue, setLocalValue] = useState('0.00');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedVerifiedPhone, setSelectedVerifiedPhone] = useState(null);
  const [showPhoneSelector, setShowPhoneSelector] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const dropdownOpacity = useRef(new Animated.Value(0)).current;
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [currencySearchQuery, setCurrencySearchQuery] = useState('');
  const chevronRotation = useRef(new Animated.Value(0)).current;
  
  // Currency state
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  
  // Currency options
  const currencyOptions = [
    { code: 'USD', country: 'United States', flag: '🇺🇸', symbol: '$', rateToUSDC: 1, rateToEURC: 0.93 },
    { code: 'EUR', country: 'Eurozone', flag: '🇪🇺', symbol: '€', rateToUSDC: 1.08, rateToEURC: 1 },
    { code: 'GHS', country: 'Ghana', flag: '🇬🇭', symbol: '₵', rateToUSDC: 0.08, rateToEURC: 0.074 },
    { code: 'AED', country: 'UAE', flag: '🇦🇪', symbol: 'د.إ', rateToUSDC: 0.27, rateToEURC: 0.25 },
    { code: 'NGN', country: 'Nigeria', flag: '🇳🇬', symbol: '₦', rateToUSDC: 0.0007, rateToEURC: 0.0006 },
  ];
  
  const selectedCurrencyObj = currencyOptions.find(c => c.code === selectedCurrency);
  
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [fees, setFees] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [testAccountStatus, setTestAccountStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  // P0.1: Enhanced state management to kill processing after success race
  const [phase, setPhase] = useState('IDLE'); // IDLE | SUBMIT | PROCESS | COMPLETE | FAILED
  const [processingStep, setProcessingStep] = useState(0); // 0: idle, 1: submitting, 2: polling, 3: complete
  const [processingMessage, setProcessingMessage] = useState('');
  const [transactionId, setTransactionId] = useState(null);
  const [stepProgress, setStepProgress] = useState([0, 0, 0]); // Individual step progress 0-100
  const stepAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;
  
  // Animation for processing UI fade-in
  const processingFadeAnim = useRef(new Animated.Value(0)).current;
  
  // P0.1: Kill processing when phase changes to COMPLETE or FAILED
  useEffect(() => {
    if (phase === 'COMPLETE' || phase === 'FAILED') {
      setIsProcessing(false);
    }
  }, [phase]);

  // Fade-in animation for processing UI
  useEffect(() => {
    if (isProcessing) {
      // Fade in processing UI smoothly
      Animated.timing(processingFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset animation when processing stops
      processingFadeAnim.setValue(0);
    }
  }, [isProcessing, processingFadeAnim]);

  // Enhanced amount input states
  const [localAmount, setLocalAmount] = useState('');
  const [quotePreview, setQuotePreview] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteErr, setQuoteErr] = useState('');
  const amountInputRef = useRef(null);

  // Get initial data from route params
  const { initialAmount, initialCurrency, initialProvider } = route.params || {};

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
    initializeMobileMoney();
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // Debug useEffect to track state changes
  useEffect(() => {
    console.log('🔄 State changed:', { 
      amount, 
      selectedVerifiedPhone: !!selectedVerifiedPhone, 
      selectedProvider: !!selectedProvider,
      selectedProviderId: selectedProvider?.id,
      isProcessing 
    });
  }, [amount, selectedVerifiedPhone, selectedProvider, isProcessing]);

  // Removed old initialAmount useEffect - now handled in useLayoutEffect above

  // FX Helper functions
  const computeTargetSymbol = (code) => {
    if (code === 'EUR') return 'EUR';
    if (code === 'USD') return 'USD';
    return 'USD';
  };
  const computeStablecoin = (code) => (code === 'EUR' ? 'EURC' : 'USDC');

  const getFxPreviewAmount = (quote, baseCurrency, amount) => {
    if (baseCurrency === 'EUR') {
      return Number(amount || 0).toFixed(2);
    }
    if (baseCurrency === 'USD') {
      return Number(amount || 0).toFixed(2);
    }
    return Number(quote?.targetAmount || 0).toFixed(2);
  };


  // Mock verified phone numbers
  const verifiedPhoneNumbers = [
    { id: '1', number: '+233 24 123 4567', name: 'John Doe', provider: 'MTN', verified: true },
    { id: '2', number: '+233 20 987 6543', name: 'Sarah Wilson', provider: 'Vodafone', verified: true },
    { id: '3', number: '+233 26 555 1234', name: 'Mike Johnson', provider: 'AirtelTigo', verified: true },
    { id: '4', number: '+233 24 777 8888', name: 'Emma Brown', provider: 'MTN', verified: true },
  ];

  useEffect(() => {
    calculateFees();
  }, [amount, selectedProvider]);

  // Debounced FX preview effect
  useEffect(() => {
    setQuoteErr('');
    setQuotePreview(null);
    const amt = Number(localAmount);
    if (!localAmount || Number.isNaN(amt) || amt <= 0) return;
    
    const base = selectedCurrencyObj?.code || selectedCurrency || 'USD';
    console.log(`🔍 Currency detected: "${base}" (selectedCurrencyObj:`, selectedCurrencyObj, ', selectedCurrency:', selectedCurrency, ')');
    
    // EUR and USD convert 1:1, no API call needed
    if (base === 'EUR' || base === 'USD') {
      setQuotePreview({ targetAmount: amt });
      return;
    }
    
    const t = setTimeout(async () => {
      try {
        setQuoteLoading(true);
        setQuoteErr('');
        const target = computeTargetSymbol(base);
        const quote = await getFxQuote(base, target, amt);
        setQuotePreview(quote);
      } catch (e) {
        console.error('❌ FX quote error:', e);
        setQuoteErr(e.message || 'FX unavailable');
      } finally {
        setQuoteLoading(false);
      }
    }, 500);
    
    return () => clearTimeout(t);
  }, [localAmount, selectedCurrencyObj?.code, selectedCurrency]);

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

  const initializeMobileMoney = async () => {
    try {
      setIsLoading(true);
      
      // Initialize mobile money manager (with fallback if not available)
      let initResult;
      try {
        initResult = await mobileMoneyManager.initialize();
      } catch (error) {
        console.log('Mobile money manager not available, using fallback');
        initResult = { success: true };
      }
      
      if (!initResult.success) {
        console.log('Mobile money initialization failed, using fallback');
        // Continue with fallback instead of showing error
      }

      // Get available providers for Ghana (default)
      let providers;
      try {
        providers = mobileMoneyManager.getAvailableProviders('GH', 'GHS');
      } catch (error) {
        console.log('Using fallback providers');
        providers = [
          { id: 'mtn', name: 'MTN Mobile Money', country: 'GH', currency: 'GHS', logo: '📱' }
        ];
      }
      setAvailableProviders(providers);

      // Set default provider if available
      if (providers.length > 0 && !selectedProvider) {
        const defaultProvider = providers.find(p => p.id === 'mtn') || providers[0];
        console.log('🎯 Setting default provider:', defaultProvider);
        setSelectedProvider(defaultProvider);
        try {
        mobileMoneyManager.setActiveProvider(defaultProvider.id);
        } catch (error) {
          console.log('Provider setting failed, continuing with fallback');
        }
      } else {
        console.log('⚠️ No providers available or provider already set:', { providersLength: providers.length, selectedProvider });
      }

      // Force set provider if still not set (fallback)
      if (!selectedProvider) {
        console.log('🔧 Force setting MTN provider as fallback');
        const fallbackProvider = {
          id: 'mtn',
          name: 'MTN Mobile Money',
          country: 'GH',
          currency: 'GHS',
          logo: '📱',
          limits: {
            minAmount: 1,
            maxAmount: 10000
          }
        };
        setSelectedProvider(fallbackProvider);
      }

      // For deposits, set a default phone number if none selected
      if (isDeposit && !selectedVerifiedPhone) {
        console.log('🔧 Setting default phone for deposit');
        setSelectedVerifiedPhone({
          phoneNumber: '+233 24 123 4567', // This will be formatted to 233241234567
          name: 'John Doe',
          verified: true
        });
      }

      // Check test account status
      let status;
      try {
        status = mobileMoneyManager.getTestAccountStatus();
      } catch (error) {
        console.log('Using fallback test account status');
        status = { isTestAccount: true, message: 'Test mode' };
      }
      setTestAccountStatus(status);

    } catch (error) {
      console.error('Mobile money initialization error:', error);
      Alert.alert('Error', 'Failed to initialize mobile money services');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFees = () => {
    if (!amount) {
      setFees(0);
      setTotalAmount(0);
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      setFees(0);
      setTotalAmount(0);
      return;
    }

    // Set fees to 0 for all transactions
      setFees(0);
      setTotalAmount(numAmount);
  };

  const validateForm = (amountToValidate = amount) => {
    console.log('🔍 Validating form:', { amount: amountToValidate, selectedVerifiedPhone, selectedProvider, isDeposit });
    
    if (!amountToValidate || parseFloat(amountToValidate) <= 0) {
      console.log('❌ Amount validation failed:', amountToValidate);
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }

    if (!isDeposit && !selectedVerifiedPhone) {
      console.log('❌ Phone validation failed for send money');
      Alert.alert('Error', 'Please select a verified recipient phone number');
      return false;
    }

    if (!isDeposit && (!recipientName || recipientName.trim().length === 0)) {
      console.log('❌ Recipient name validation failed');
      Alert.alert('Error', 'Please enter recipient name');
      return false;
    }

    if (!selectedProvider) {
      console.log('❌ Provider validation failed:', selectedProvider);
      Alert.alert('Error', 'Please select a mobile money provider');
      return false;
    }

    // Validate amount against provider limits
    const numAmount = parseFloat(amount);
    const limits = selectedProvider.limits;
    
    if (numAmount < limits.minAmount) {
      Alert.alert('Error', `Minimum amount is ${limits.minAmount}`);
      return false;
    }

    if (numAmount > limits.maxAmount) {
      Alert.alert('Error', `Maximum amount is ${limits.maxAmount}`);
      return false;
    }

    console.log('✅ Form validation passed');
    return true;
  };

  const validatePhoneNumber = async (phoneNumber) => {
    try {
      if (!mtnApiService.isValidGhanaPhoneNumber(phoneNumber)) {
        return {
          isValid: false,
          error: 'Invalid Ghana phone number format'
        };
      }

      const result = await mtnApiService.validateAccount(phoneNumber);
      return {
        isValid: result.success && result.data.isValid,
        accountHolderName: result.data.accountHolderName,
        error: result.success ? null : result.error
      };
    } catch (error) {
      console.error('Phone validation error:', error);
      return {
        isValid: false,
        error: 'Failed to validate phone number'
      };
    }
  };

  const handleMobileMoneyAction = async ({ amount: override } = {}) => {
    console.log('🚀 handleMobileMoneyAction called');
    const value = override ?? amount;
    if (!validateForm(value)) {
      console.log('❌ Form validation failed');
      return;
    }

    try {
      console.log('✅ Form validation passed, starting processing...');
      setIsProcessing(true);
      setProcessingStep(1);

      // 1. Basic connectivity test (using fetch instead of native modules)
      // Basic connectivity check (DEV only)
      if (__DEV__) {
        console.log('🌐 Testing HTTPS connectivity...');
        try {
          await fetch('https://www.google.com', { method: 'HEAD' });
          console.log('✅ HTTPS connectivity OK');
        } catch (e) {
          console.log('❌ HTTPS connectivity failed:', e.message);
          throw new Error('HTTPS connectivity failed - check network/TLS config');
        }
      }

      // 2. Enhanced diagnostics with preflight test
      const { API_BASE } = await import('../app/config/api');
      const MTN_BASE_URL = `${API_BASE}/v1/momo`;
      const base = API_BASE.replace(/\/+$/, '');
      console.log('🌐 Base URL:', base);
      console.log('🌐 MTN API Base URL:', MTN_BASE_URL);

      // Preflight test to the base host (DEV only)
      if (__DEV__) {
        try {
          const preflight = await fetch(`${base}/health`, { method: 'GET' });
          console.log('🧪 Preflight to base host:', preflight.status);
          if (!preflight.ok) {
            throw new Error(`Preflight HTTP ${preflight.status}`);
          }
        } catch (e) {
          console.log('💥 Preflight transport error:', e?.message || e);
          throw new Error(`Preflight failed to ${base}/health: ${e?.message || 'Unknown error'}`);
        }
      }

      const endpoint = `${MTN_BASE_URL}/request-to-pay`;
      console.log('➡️ About to call MTN API:', endpoint);
      console.log('📊 Request payload:', { amount: value, provider: selectedProvider?.id });
      setProcessingMessage('Submitting payment request...');
      // updateStepProgress(0, 100); // Complete step 1 - commented out for simplified UI

      // Test the actual endpoint before making the real call (DEV only)
      if (__DEV__) {
        console.log('🧪 Testing actual endpoint before API call...');
        try {
          const endpointTest = await fetch(endpoint, { method: 'GET' });
          console.log('🧪 Endpoint test result:', endpointTest.status);
          // Note: 404/405 is expected for GET on POST endpoint, but proves connectivity
          if (endpointTest.status >= 500) {
            throw new Error(`Endpoint server error: ${endpointTest.status}`);
          }
        } catch (e) {
          console.log('💥 Endpoint test failed:', e?.message || e);
          throw new Error(`Endpoint test failed: ${e?.message || 'Unknown error'}`);
        }
      }

      // Use real MTN API service
      if (isDeposit) {
        // Handle deposit (Add Money) - Use real MTN API
        const phoneNumber = '+233 24 123 4567'; // User's verified phone number

        // Send money using real MTN API
        const result = await mtnApiService.sendMoney({
          amount: parseFloat(amount).toFixed(2),
          currency: selectedCurrency,
          phoneNumber: mtnApiService.formatGhanaPhoneNumber(phoneNumber),
          payerMessage: description.trim() || 'Mobile money deposit',
          payeeNote: 'Deposit to wallet'
        });

        if (result.success) {
          const refId = result?.referenceId ?? result?.data?.referenceId ?? result?.data?.externalId;
          setTransactionId(refId);
          setProcessingStep(2);
          setProcessingMessage('Payment accepted. Typically completes in ~3s...');
          updateStepProgress(1, 100); // Complete step 2
          
          const transactionDetails = {
            transactionId: refId,
            externalId: refId,
            amount: result.data.amount,
            currency: result.data.currency,
            status: result.data.status,
            payee: result.data.payee,
            reason: result.data.reason
          };
          
          setTransactionDetails(transactionDetails);
          
          // Poll for status updates
          const pollStatus = async () => {
            const deadline = Date.now() + 30000; // 30 second timeout
            let lastStatus = '';
            let pollCount = 0;
            const maxPolls = 30; // Max number of polls
            
            while (Date.now() < deadline) {
              try {
                const statusResult = await mtnApiService.getTransactionStatus(refId);

                // Normalize & log once for visibility
                const http = statusResult?.httpStatus ?? statusResult?.statusCode;
                const rawStatus =
                  statusResult?.data?.status ??
                  statusResult?.status ??
                  statusResult?.data?.current_status ??
                  '';

                const currentStatus = String(rawStatus || '').toUpperCase();

                // Progress: advance slowly while pending
                pollCount++;
                // const progress = Math.min((pollCount / maxPolls) * 100, 90); // Cap at 90% until success
                // updateStepProgress(2, progress); // commented out for simplified UI

                // Handle transport/shape problems without blowing up
                if (!statusResult || statusResult.success === false) {
                  console.log('ℹ️ Status probe not ready:', { http, raw: statusResult });
                  const delay = pollCount < 10 ? 500 : Math.min(1000 + (pollCount - 10) * 250, 2500);
                await new Promise(r => setTimeout(r, delay));
                  continue; // keep polling
                }

                // Common backend semantics:
                //  - 404: not materialized yet
                //  - 202/200 + status:PENDING|PROCESSING: still running
                if (http === 404 || currentStatus === '' || currentStatus === 'PENDING' || currentStatus === 'PROCESSING') {
                  const delay = pollCount < 10 ? 500 : Math.min(1000 + (pollCount - 10) * 250, 2500);
                await new Promise(r => setTimeout(r, delay));
                  continue;
                }

            if (statusResult.success) {
                  
                  if (currentStatus && currentStatus !== lastStatus) {
                    console.log(`📊 Status: ${currentStatus}`);
                    lastStatus = currentStatus;
                  }
                  
                  if (currentStatus === 'SUCCESS' || currentStatus === 'SUCCESSFUL') {
                    console.log('🎉 Deposit successful!');
                    
                    // P0.1: Set phase to COMPLETE to kill processing immediately
                    setPhase('COMPLETE');
                    // updateStepProgress(2, 100); // Complete step 3 - commented out for simplified UI
              setTransactionDetails(prev => ({
                ...prev,
                      status: currentStatus,
                      finalStatus: currentStatus
                    }));
                    
                    // Show success after a brief delay
                    setTimeout(() => {
                      // Complete processing just before navigation
                      completeProcessing();
                      // Trigger balance refresh if callback provided
                      if (onDepositSuccess) {
                        onDepositSuccess({
                          amount: parseFloat(amount),
                          currency: selectedCurrency,
                          transactionId: refId
                        });
                      }
                      
                      // Navigate back to home since processing is now handled inline in confirm screen
                      console.log('🚀 Transaction successful, navigating back to home');
                      navigation.popToTop();
                    }, 1000);
                    return;
                  }
                  
                  if (currentStatus === 'FAILED' || currentStatus === 'REJECTED' || currentStatus === 'CANCELLED') {
                    setProcessingStep(3);
                    setProcessingMessage('Payment failed');
                    setPhase('FAILED');
                    // Keep stepper visible to show failed state
                    Alert.alert('Error', 'Payment failed. Please try again.');
                    
                    // Reset processing state after failure to allow retry
                    setTimeout(() => {
                      setIsProcessing(false);
                    }, 2000);
                    return;
                  }
                }
                
                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, 1200));
              } catch (error) {
                console.error('Error checking payment status:', error);
                await new Promise(resolve => setTimeout(resolve, 2000)); // backoff on transient errors
              }
            }
            
            // Timeout
            setProcessingStep(3);
            setProcessingMessage('Timeout waiting for payment confirmation');
            setPhase('FAILED');
            // Keep stepper visible to show timeout state
            Alert.alert('Timeout', 'Payment is taking longer than expected. Please check your transaction history.');
            
            // Reset processing state after timeout to allow retry
            setTimeout(() => {
              setIsProcessing(false);
            }, 3000);
          };
          
          pollStatus();
        } else {
          setProcessingStep(3);
          setProcessingMessage('Payment failed');
          // Keep stepper visible to show failed state
          Alert.alert('Error', result.error || 'Deposit failed. Please try again.');
        }
      } else {
        // Handle send (Send Money) - Use real MTN API
        const phoneNumber = selectedVerifiedPhone.number;

        // Send money using real MTN API
        const result = await mtnApiService.sendMoney({
          amount: parseFloat(amount).toFixed(2),
          currency: selectedCurrency,
          phoneNumber: mtnApiService.formatGhanaPhoneNumber(phoneNumber),
          payerMessage: description.trim() || `Payment to ${recipientName}`,
          payeeNote: `Payment from ${recipientName}`
        });

        if (result.success) {
          const refId = result?.referenceId ?? result?.data?.referenceId ?? result?.data?.externalId;
          setTransactionId(refId);
          setProcessingStep(2);
          setProcessingMessage('Payment accepted. Typically completes in ~3s...');
          updateStepProgress(1, 100); // Complete step 2
          
          const transactionDetails = {
            transactionId: refId,
            externalId: refId,
            amount: result.data.amount,
            currency: result.data.currency,
            status: result.data.status,
            payee: result.data.payee,
            reason: result.data.reason
          };
          
          setTransactionDetails(transactionDetails);
          
          // Poll for status updates
          const pollStatus = async () => {
            const deadline = Date.now() + 30000; // 30 second timeout
            let lastStatus = '';
            let pollCount = 0;
            const maxPolls = 30; // Max number of polls
            
            while (Date.now() < deadline) {
              try {
                const statusResult = await mtnApiService.getTransactionStatus(refId);
            console.log('Payment status:', statusResult);
            
                // Update progress based on polling
                pollCount++;
                // const progress = Math.min((pollCount / maxPolls) * 100, 90); // Cap at 90% until success
                // updateStepProgress(2, progress); // commented out for simplified UI
                
            if (statusResult.success) {
                  const currentStatus = statusResult.data.status?.toUpperCase() || '';
                  
                  if (currentStatus && currentStatus !== lastStatus) {
                    console.log(`STATUS ${currentStatus}`);
                    lastStatus = currentStatus;
                  }
                  
                  if (currentStatus === 'SUCCESS' || currentStatus === 'SUCCESSFUL') {
                    // updateStepProgress(2, 100); // Complete step 3 - commented out for simplified UI
              setTransactionDetails(prev => ({
                ...prev,
                      status: currentStatus,
                      finalStatus: currentStatus
                    }));
                    
                    // Show success after a brief delay
                    setTimeout(() => {
                      // Complete processing just before navigation
                      completeProcessing();
                      // Navigate back to home since processing is now handled inline in confirm screen
                      navigation.popToTop();
                    }, 1000);
                    return;
                  }
                  
                  if (currentStatus === 'FAILED' || currentStatus === 'REJECTED' || currentStatus === 'CANCELLED') {
                    setProcessingStep(3);
                    setProcessingMessage('Payment failed');
                    setPhase('FAILED');
                    // Keep stepper visible to show failed state
                    Alert.alert('Error', 'Payment failed. Please try again.');
                    
                    // Reset processing state after failure to allow retry
                    setTimeout(() => {
                      setIsProcessing(false);
                    }, 2000);
                    return;
                  }
                }
                
                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, 1200));
              } catch (error) {
                console.error('Error checking payment status:', error);
                await new Promise(resolve => setTimeout(resolve, 2000)); // backoff on transient errors
              }
            }
            
            // Timeout
            setProcessingStep(3);
            setProcessingMessage('Timeout waiting for payment confirmation');
            setPhase('FAILED');
            // Keep stepper visible to show timeout state
            Alert.alert('Timeout', 'Payment is taking longer than expected. Please check your transaction history.');
            
            // Reset processing state after timeout to allow retry
            setTimeout(() => {
              setIsProcessing(false);
            }, 3000);
          };
          
          pollStatus();
        } else {
          setProcessingStep(3);
          setProcessingMessage('Payment failed');
          setPhase('FAILED');
          // Keep stepper visible to show failed state
          Alert.alert('Error', result.error || 'Payment failed. Please try again.');
          
          // Reset processing state after failure to allow retry
          setTimeout(() => {
            setIsProcessing(false);
          }, 2000);
        }
      }

    } catch (error) {
      console.error('💥 Mobile money action error:', error);
      
      // Enhanced error categorization
      const hint = [
        `baseURL=${MTN_BASE_URL || 'undefined'}`,
        `platform=${Platform.OS}`,
        `message=${error?.message || 'Unknown error'}`
      ].join(' | ');
      console.log('ERROR Mobile money action:', hint);

      // User-friendly error categorization
      let userMessage = 'Payment failed. Please try again.';
      if (error?.message?.includes('Network request failed')) {
        userMessage = 'Connection failed. Check network/URL/TLS config.';
      } else if (error?.message?.includes('No internet connection')) {
        userMessage = 'No internet connection. Please check your network.';
      } else if (error?.message?.includes('HTTPS connectivity failed')) {
        userMessage = 'Network configuration issue. Please try again.';
      }

      setProcessingStep(3);
      setProcessingMessage('Payment failed');
      setPhase('FAILED');
      Alert.alert('Error', userMessage);
      
      handleError(error, 'in mobile money action');
    } finally {
      // Reset processing state on error to allow retry
      if (error) {
        setTimeout(() => {
          setIsProcessing(false);
        }, 2000); // Give user time to see the error message
      }
    }
  };

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
    mobileMoneyManager.setActiveProvider(provider.id);
    setShowProviderDropdown(false);
  };

  const resetProcessingState = () => {
    setProcessingStep(0);
    setProcessingMessage('');
    setTransactionId(null);
    setIsProcessing(false);
    setStepProgress([0, 0, 0]);
    setErrorMessage(null);
    setShowErrorModal(false);
    setPhase('IDLE');
    // Reset animations
    stepAnimations.forEach(anim => anim.setValue(0));
  };

  const handleError = (error, context = '') => {
    console.error(`Mobile money error ${context}:`, error);
    
    let userFriendlyMessage = 'Something went wrong. Please try again.';
    
    if (error.message) {
      if (error.message.includes('Network request failed')) {
        userFriendlyMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (error.message.includes('timeout')) {
        userFriendlyMessage = 'Request timed out. Please try again.';
      } else if (error.message.includes('unauthorized')) {
        userFriendlyMessage = 'Authentication failed. Please try again.';
      } else {
        userFriendlyMessage = error.message;
      }
    }
    
    setErrorMessage(userFriendlyMessage);
    setShowErrorModal(true);
    setProcessingStep(3);
    setProcessingMessage('Payment failed');
    setPhase('FAILED');
  };

  const completeProcessing = () => {
    // Keep the stepper visible but mark as completed
    setProcessingStep(3);
    setProcessingMessage('Transaction completed successfully!');
    // Don't set isProcessing to false - keep stepper visible
  };

  const animateStepProgress = (stepIndex, progress) => {
    Animated.timing(stepAnimations[stepIndex], {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  const updateStepProgress = (step, progress) => {
    setStepProgress(prev => {
      const newProgress = [...prev];
      newProgress[step] = progress;
      return newProgress;
    });
    animateStepProgress(step, progress);
  };

  // Animate dropdown when it appears/disappears
  useEffect(() => {
    if (showProviderDropdown) {
      Animated.timing(dropdownOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(dropdownOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [showProviderDropdown]);

  // Animate chevron rotation for currency dropdown
  useEffect(() => {
    Animated.timing(chevronRotation, {
      toValue: showCurrencyDropdown ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showCurrencyDropdown]);

  const ProviderCard = ({ provider, isSelected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.providerCard,
        isSelected && styles.providerCardSelected
      ]}
      onPress={onPress}
    >
      <View style={styles.providerInfo}>
        <Text style={styles.providerLogo}>{provider.logo}</Text>
        <View style={styles.providerDetails}>
          <Text style={styles.providerName}>
            {provider.name}
          </Text>
          <Text style={styles.providerLimits}>
            Min: {provider.limits.minAmount} | Max: {provider.limits.maxAmount}
          </Text>
        </View>
      </View>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={24} color="#1e40af" />
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.darkContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={['#000000', '#1a1a1a', '#2d2d2d']}
          style={styles.darkBackground}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>
              Initializing mobile money services...
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

    return (
    <View style={styles.darkContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
              <SafeAreaView style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => onClose ? onClose() : navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
          {isDeposit ? 'Add via Mobile Money' : 'Send Money via Mobile Money'}
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
            {/* Test Account Status Banner */}
            {testAccountStatus && !testAccountStatus.configured && (
              <View style={styles.testAccountBanner}>
                <Ionicons name="warning" size={20} color="#f59e0b" />
                <Text style={styles.testAccountText}>
                  {testAccountStatus.message}
                </Text>
                <TouchableOpacity
                  style={styles.setupButton}
                  onPress={() => {
                    Alert.alert(
                      'Setup Test Accounts',
                      'To test with real mobile money providers, you need to create developer accounts:\n\n' +
                      '• MTN Mobile Money: https://developers.mtn.com/\n' +
                      '• Vodafone Cash: https://developers.vodafone.com/\n' +
                      '• M-Pesa: https://developer.safaricom.co.ke/\n' +
                      '• Airtel Money: https://developers.airtel.com/\n\n' +
                      'Currently using mock data for demonstration.',
                      [{ text: 'OK', style: 'default' }]
                    );
                  }}
                >
                  <Text style={styles.setupButtonText}>Setup Guide</Text>
                </TouchableOpacity>
              </View>
            )}


            {/* Provider Selection */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.providerSelector}
                onPress={() => setShowProviderDropdown(!showProviderDropdown)}
              >
                              {selectedProvider ? (
                  <View style={styles.selectedProvider}>
                    <Text style={styles.providerLogo}>{selectedProvider.logo}</Text>
                    <Text style={styles.selectedProviderName}>
                      {selectedProvider.name}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.placeholderText}>
                    Select mobile money provider
                  </Text>
                )}
                <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

                      {/* Enhanced Amount Input */}
            <View style={styles.section}>
              {/* Integrated Currency Selector + Amount Input */}
              <View style={styles.paymentCurrencyContainer}>
                <View style={styles.integratedAmountInputContainer}>
                  {/* Amount Input */}
                  <TouchableOpacity 
                    style={styles.integratedAmountInput}
                    activeOpacity={1}
                    onPress={Keyboard.dismiss}
                  >
                    {/* Currency Symbol Selector */}
                    <TouchableOpacity
                      style={styles.currencySymbolSelector}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowCurrencyDropdown(!showCurrencyDropdown);
                        if (!showCurrencyDropdown) {
                          setCurrencySearchQuery('');
                        }
                      }}
                      activeOpacity={0.8}
                      accessibilityLabel={`Select currency, currently ${selectedCurrencyObj?.code || 'USD'}`}
                      accessibilityHint="Double tap to open currency selection"
                      accessibilityRole="button"
                    >
                      <Text style={styles.currencySymbolFlag}>{selectedCurrencyObj?.flag || '🇺🇸'}</Text>
                      <Text style={styles.integratedAmountCurrency}>{selectedCurrencyObj?.symbol || '$'}</Text>
                    </TouchableOpacity>
                <TextInput
                      ref={amountInputRef}
                      style={styles.integratedAmountInputField}
                  placeholder="0.00"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  keyboardType="numeric"
                      value={localAmount}
                      onChangeText={(text) => {
                        setLocalAmount(text);
                        setAmount(text); // Keep the original amount state in sync
                      }}
                      maxLength={10}
                    />
                  </TouchableOpacity>
              </View>

                {/* Live FX Preview */}
                <Text style={{
                  color: quoteErr ? '#ff6b6b' : '#ffffff',
                  marginTop: 8,
                  textAlign: 'center',
                  fontSize: 18,
                  fontWeight: 'bold'
                }}>
                  {quoteLoading
                    ? 'Calculating…'
                    : quoteErr
                    ? 'FX unavailable'
                    : quotePreview || (selectedCurrencyObj?.code || selectedCurrency) === 'EUR' || (selectedCurrencyObj?.code || selectedCurrency) === 'USD'
                    ? `= ${getFxPreviewAmount(quotePreview, selectedCurrencyObj?.code || selectedCurrency, localAmount)} ${computeStablecoin(selectedCurrencyObj?.code || selectedCurrency || 'USD')}`
                    : ''}
                </Text>
                
                {/* Currency Dropdown */}
                {showCurrencyDropdown && (
                  <View style={styles.paymentCurrencyDropdown}>
                    {/* Live Rate Indicator */}
                    <View style={styles.liveRateIndicator}>
                      <View style={styles.liveRateDot} />
                      <Text style={styles.liveRateText}>Live rates</Text>
                  </View>
                    
                    {/* Search Bar */}
                    <View style={styles.currencySearchContainer}>
                      <Ionicons name="search" size={16} color="rgba(255,255,255,0.6)" style={styles.searchIcon} />
                      <TextInput
                        style={styles.currencySearchInput}
                        placeholder="Search currencies..."
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={currencySearchQuery}
                        onChangeText={setCurrencySearchQuery}
                        autoFocus={false}
                        accessibilityLabel="Search currencies"
                        accessibilityHint="Type to search for currencies"
                      />
                      {currencySearchQuery.length > 0 && (
                        <TouchableOpacity
                          onPress={() => setCurrencySearchQuery('')}
                          style={styles.clearSearchButton}
                        >
                          <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.6)" />
                        </TouchableOpacity>
                      )}
                  </View>
                    
                    {/* Currency Options */}
                    <ScrollView style={styles.currencyOptionsList} showsVerticalScrollIndicator={false}>
                      {currencyOptions
                        .filter(opt => 
                          !currencySearchQuery.trim() || 
                          opt.code.toLowerCase().includes(currencySearchQuery.toLowerCase()) ||
                          opt.country.toLowerCase().includes(currencySearchQuery.toLowerCase())
                        )
                        .map((opt) => (
                        <TouchableOpacity
                          key={opt.code}
                          style={[
                            styles.currencyOption,
                            selectedCurrency === opt.code && styles.currencyOptionSelected
                          ]}
                          onPress={() => {
                            setSelectedCurrency(opt.code);
                            setShowCurrencyDropdown(false);
                            setCurrencySearchQuery('');
                            // Persist currency preference
                            try { 
                              AsyncStorage.setItem('preferredCurrency', opt.code); 
                            } catch {}
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.currencyOptionContent}>
                            <Text style={styles.currencyOptionFlag}>{opt.flag}</Text>
                            <View style={styles.currencyOptionTextContainer}>
                              <Text style={styles.currencyOptionCode}>{opt.code}</Text>
                              <Text style={styles.currencyOptionCountry}>{opt.country}</Text>
                </View>
                            <Text style={styles.currencyOptionSymbol}>{opt.symbol}</Text>
                          </View>
                          {selectedCurrency === opt.code && (
                            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

                      {/* Recipient Details - Only for Send */}
                      {!isDeposit && (
                        <View style={styles.section}>
                          <Text style={styles.sectionTitle}>
                            Recipient Details
                          </Text>
                          
                          {/* Verified Phone Number Selector */}
                          <TouchableOpacity
                            style={styles.phoneSelector}
                            onPress={() => setShowPhoneSelector(true)}
                          >
                            {selectedVerifiedPhone ? (
                              <View style={styles.selectedPhoneContainer}>
                                <View style={styles.phoneInfo}>
                                  <Text style={styles.phoneName}>{selectedVerifiedPhone.name}</Text>
                                  <Text style={styles.phoneNumber}>{selectedVerifiedPhone.number}</Text>
                                  <Text style={styles.phoneProvider}>{selectedVerifiedPhone.provider}</Text>
                          </View>
                                <View style={styles.verifiedBadge}>
                                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                                  <Text style={styles.verifiedText}>Verified</Text>
                          </View>
                          </View>
                            ) : (
                              <View style={styles.phoneSelectorPlaceholder}>
                                <Ionicons name="call-outline" size={20} color="rgba(255,255,255,0.6)" />
                                <Text style={styles.phoneSelectorPlaceholderText}>
                                  Select verified phone number
                                </Text>
                        </View>
                      )}
                            <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.6)" />
                          </TouchableOpacity>

                          <View style={styles.inputContainer}>
                            <Ionicons name="document-text-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                            <TextInput
                              style={styles.textInput}
                              value={description}
                              onChangeText={setDescription}
                              placeholder="Description (optional)"
                              placeholderTextColor="rgba(255,255,255,0.6)"
                              fontFamily={Typography.fontFamily}
                            />
                          </View>
                        </View>
                      )}


                      {/* Fee Breakdown */}
            {amount && parseFloat(amount) > 0 && (
              <View style={styles.feeSection}>
                
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Send from</Text>
                  <Text style={styles.feeValue}>+233 24 123 4567</Text>
                </View>
                
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Amount</Text>
                  <Text style={styles.feeValue}>
                    {selectedCurrency === 'USD' ? '$' : 
                     selectedCurrency === 'EUR' ? '€' : 
                     selectedCurrency === 'GHS' ? '₵' : 
                     selectedCurrency === 'AED' ? 'د.إ' : 
                     selectedCurrency === 'NGN' ? '₦' : '₵'}{parseFloat(amount).toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Processing time</Text>
                  <Text style={styles.feeValue}>Instant</Text>
                </View>
                
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Fees</Text>
                  <Text style={styles.feeValue}>
                    {selectedCurrency === 'USD' ? '$' : 
                     selectedCurrency === 'EUR' ? '€' : 
                     selectedCurrency === 'GHS' ? '₵' : 
                     selectedCurrency === 'AED' ? 'د.إ' : 
                     selectedCurrency === 'NGN' ? '₦' : '₵'}{fees.toFixed(2)}
                  </Text>
                </View>
                
                <View style={[styles.feeRow, styles.totalRow]}>
                  <Text style={[styles.feeLabel, styles.totalLabel]}>Total</Text>
                  <Text style={[styles.feeValue, styles.totalValue]}>
                    {selectedCurrency === 'USD' ? '$' : 
                     selectedCurrency === 'EUR' ? '€' : 
                     selectedCurrency === 'GHS' ? '₵' : 
                     selectedCurrency === 'AED' ? 'د.إ' : 
                     selectedCurrency === 'NGN' ? '₦' : '₵'}{totalAmount.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

                      {/* Processing Stepper */}
            {isProcessing && (
              <Animated.View style={[styles.processingContainer, { opacity: processingFadeAnim }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <ActivityIndicator size="small" />
                  <Text style={styles.processingMessage}>{processingMessage || 'Processing…'}</Text>
                </View>
                
                {/* Progress Step Bar */}
                <View style={styles.stepBarContainer}>
                  <StepBar currentStep={Math.max(0, processingStep - 1)} />
                </View>
                
                {transactionId && (
                  <Text style={styles.transactionIdText}>Transaction ID: {transactionId}</Text>
                )}
                {processingStep === 3 && (
                  <View style={styles.completionIndicator}>
                    {(() => {
                      const pm = (processingMessage || '').toLowerCase();
                      const isBad = pm.includes('failed') || pm.includes('timeout');
                      return (
                        <>
                          <Ionicons name={isBad ? 'close-circle' : 'checkmark-circle'} size={20} color={isBad ? '#ef4444' : '#10b981'} />
                          <Text style={[styles.completionText, { color: isBad ? '#ef4444' : '#10b981' }]}>
                            {isBad ? 'Failed' : 'Completed'}
                          </Text>
                          {isBad && (
                            <TouchableOpacity
                              style={styles.retryButton}
                              onPress={() => {
                                setIsProcessing(false);
                                setPhase('IDLE');
                                setProcessingStep(0);
                                setProcessingMessage('');
                              }}
                            >
                              <Text style={styles.retryButtonText}>Try Again</Text>
                            </TouchableOpacity>
                          )}
                        </>
                      );
                    })()}
                  </View>
                )}
              </Animated.View>
            )}

                      {/* Send Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!amount || !selectedVerifiedPhone || !selectedProvider || isProcessing) && styles.sendButtonDisabled
                ]}
                onPress={() => {
                  // Check if button should be disabled
                  if (isProcessing || !amount || !selectedVerifiedPhone || !selectedProvider) {
                    return;
                  }
                  
                  try {
                    // Navigate to confirmation screen
                    navigation.replace('MobileMoneyConfirm', {
                      amount,
                      selectedCurrency,
                      selectedProvider,
                      selectedVerifiedPhone,
                      recipientName,
                      isDeposit,
                      fees,
                      totalAmount
                    });
                  } catch (error) {
                    console.error('Navigation error:', error);
                  }
                }}
                disabled={isProcessing || !amount || !selectedVerifiedPhone || !selectedProvider}
              >
                {isProcessing ? (
                  <View style={styles.processingButtonContent}>
                  <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.sendButtonText}>Processing...</Text>
                  </View>
                ) : (
                  <Text style={styles.sendButtonText}>
                    {isDeposit ? 'Continue' : 'Send Money'}
                  </Text>
                )}
              </TouchableOpacity>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Provider Dropdown - Outside ScrollView to appear under selector */}
        {showProviderDropdown && (
          <Animated.View style={[styles.providerDropdown, { opacity: dropdownOpacity }]}>
            {availableProviders.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={[
                  styles.providerDropdownItem,
                  selectedProvider?.id === provider.id && styles.providerDropdownItemSelected
                ]}
                onPress={() => handleProviderSelect(provider)}
              >
                <Text style={styles.providerDropdownLogo}>{provider.logo}</Text>
                <Text style={styles.providerDropdownName}>{provider.name}</Text>
                {selectedProvider?.id === provider.id && (
                  <Ionicons name="checkmark" size={20} color="#10b981" />
                )}
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Phone Selector Modal */}
        <Modal
          visible={showPhoneSelector}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPhoneSelector(false)}
        >
          <View style={styles.modalOverlay}>
            <BlurView intensity={20} style={styles.modalBlur}>
              <View style={styles.phoneSelectorModal}>
                <View style={styles.phoneSelectorHeader}>
                  <Text style={styles.phoneSelectorTitle}>Select Phone Number</Text>
                <TouchableOpacity
                    onPress={() => setShowPhoneSelector(false)}
                    style={styles.phoneSelectorCloseButton}
                >
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
                <ScrollView style={styles.phoneSelectorList}>
                  {verifiedPhoneNumbers.map((phone, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.phoneSelectorItem,
                        selectedVerifiedPhone?.number === phone.number && styles.phoneSelectorItemSelected
                      ]}
                      onPress={() => {
                        setSelectedVerifiedPhone(phone);
                        setShowPhoneSelector(false);
                      }}
                    >
                      <View style={styles.phoneSelectorItemContent}>
                        <View style={styles.phoneSelectorItemInfo}>
                          <Text style={styles.phoneSelectorItemName}>{phone.name}</Text>
                          <Text style={styles.phoneSelectorItemNumber}>{phone.number}</Text>
                          <Text style={styles.phoneSelectorItemProvider}>{phone.provider}</Text>
                        </View>
                        <View style={styles.phoneSelectorItemBadge}>
                          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                          <Text style={styles.phoneSelectorItemVerified}>Verified</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                ))}
              </ScrollView>
              </View>
            </BlurView>
          </View>
        </Modal>

        {/* Error Modal */}
        <Modal
          visible={showErrorModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowErrorModal(false)}
        >
          <View style={styles.modalOverlay}>
            <BlurView intensity={20} tint="dark" style={styles.modalContent}>
              <View style={styles.errorHeader}>
                <Ionicons name="alert-circle" size={64} color="#ef4444" />
                <Text style={styles.errorTitle}>Payment Failed</Text>
                <Text style={styles.errorMessage}>
                  {errorMessage || 'Something went wrong. Please try again.'}
              </Text>
            </View>
              
              <View style={styles.errorButtons}>
                <TouchableOpacity
                  style={[styles.errorButton, styles.retryButton]}
                  onPress={() => {
                    setShowErrorModal(false);
                    resetProcessingState();
                  }}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.errorButton, styles.cancelErrorButton]}
                  onPress={() => {
                    setShowErrorModal(false);
                    resetProcessingState();
                    navigation.goBack();
                  }}
                >
                  <Text style={styles.cancelErrorButtonText}>Go Back</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  darkContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  darkBackground: {
    flex: 1,
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
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  testAccountBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testAccountText: {
    flex: 1,
    color: '#f59e0b',
    fontSize: 14,
    fontFamily: Typography.fontFamily,
    marginLeft: 12,
  },
  setupButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  setupButtonText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  providerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  selectedProvider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerLogo: {
    fontSize: 24,
    marginRight: 12,
  },
  selectedProviderName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  placeholderText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: Typography.fontFamily,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    marginRight: 8,
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  feeSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 24,
  },
  feeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: Typography.fontFamily,
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  totalRow: {
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontWeight: '600',
    color: '#ffffff',
  },
  totalValue: {
    fontWeight: '700',
    color: '#10b981',
  },
  buttonContainer: {
    marginTop: 24,
  },
  sendButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  closeButton: {
    padding: 4,
  },
  providerList: {
    padding: 20,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
  },
  providerCardSelected: {
    borderColor: '#1e40af',
    backgroundColor: 'rgba(30, 64, 175, 0.2)',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  providerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  providerLimits: {
    fontSize: 12,
    marginTop: 2,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: Typography.fontFamily,
  },
  confirmationHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  confirmationDetails: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmationLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: Typography.fontFamily,
  },
  confirmationValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  confirmationButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  confirmButton: {
    backgroundColor: '#1e40af',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    fontFamily: Typography.fontFamily,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  
  // Enhanced amount input styles
  paymentCurrencyContainer: {
    position: 'relative',
    zIndex: 10,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  integratedAmountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    overflow: 'visible',
    minWidth: 320,
  },
  integratedAmountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  currencySymbolSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 12,
  },
  currencySymbolFlag: {
    fontSize: 16,
    marginRight: 4,
  },
  integratedAmountCurrency: {
    fontSize: 20,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    fontWeight: '700',
  },
  integratedAmountInputField: {
    fontSize: 48,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 120,
    alignSelf: 'center',
  },

  // Phone Selector Modal Styles
  phoneSelectorModal: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    minHeight: 400,
  },
  phoneSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  phoneSelectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  phoneSelectorCloseButton: {
    padding: 5,
  },
  phoneSelectorList: {
    flex: 1,
  },
  phoneSelectorItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  phoneSelectorItemSelected: {
    backgroundColor: 'rgba(30, 64, 175, 0.2)',
    borderColor: '#1e40af',
  },
  phoneSelectorItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phoneSelectorItemInfo: {
    flex: 1,
  },
  phoneSelectorItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
    marginBottom: 4,
  },
  phoneSelectorItemNumber: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Typography.fontFamily,
    marginBottom: 2,
  },
  phoneSelectorItemProvider: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: Typography.fontFamily,
  },
  phoneSelectorItemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  phoneSelectorItemVerified: {
    fontSize: 12,
    color: '#10b981',
    fontFamily: Typography.fontFamily,
    marginLeft: 4,
    fontWeight: '500',
  },

  // User Phone Container Styles (for "Your Details" section)
  userPhoneContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userPhoneInfo: {
    flex: 1,
  },
  userPhoneName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
    marginBottom: 4,
  },
  userPhoneNumber: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Typography.fontFamily,
    marginBottom: 2,
  },
  userPhoneProvider: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: Typography.fontFamily,
  },

  // Send From Container Styles
  sendFromContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendFromLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Typography.fontFamily,
    marginRight: 8,
  },
  sendFromNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },

  // Provider Dropdown Styles
  providerDropdown: {
    position: 'absolute',
    top: 200, // Position below the provider selector
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  providerDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  providerDropdownItemSelected: {
    backgroundColor: 'rgba(30, 64, 175, 0.2)',
  },
  providerDropdownLogo: {
    fontSize: 24,
    marginRight: 16,
  },
  providerDropdownName: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
    fontWeight: '500',
  },

  // Currency Dropdown Styles
  paymentCurrencyDropdown: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  liveRateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  liveRateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  liveRateText: {
    fontSize: 12,
    color: '#10b981',
    fontFamily: Typography.fontFamily,
    fontWeight: '600',
  },
  currencySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  currencySearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  clearSearchButton: {
    padding: 4,
  },
  currencyOptionsList: {
    maxHeight: 200,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  currencyOptionSelected: {
    backgroundColor: 'rgba(30, 64, 175, 0.2)',
  },
  currencyOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyOptionFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  currencyOptionTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  currencyOptionCode: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
    fontWeight: '600',
  },
  currencyOptionCountry: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Typography.fontFamily,
  },
  currencyOptionSymbol: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Typography.fontFamily,
    fontWeight: '500',
  },

  // Processing Stepper Styles
  processingContainer: {
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.3)',
  },
  stepBarContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  step: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 6,
  },
  stepActive: {
    borderColor: '#1e40af',
  },
  stepBar: {
    height: '100%',
    backgroundColor: '#1e40af',
    borderRadius: 999,
  },
  stepLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: Typography.fontFamily,
    fontWeight: '500',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#1e40af',
    fontWeight: '600',
  },
  processingMessage: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  transactionIdText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
  },
  processingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  completionText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  // Error Modal Styles
  errorHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 12,
    fontFamily: Typography.fontFamily,
  },
  errorMessage: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: Typography.fontFamily,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  errorButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#1e40af',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  cancelErrorButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cancelErrorButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
});

export default MobileMoneyPaymentScreen;
