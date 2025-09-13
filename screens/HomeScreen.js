// sendnreceive-app/screens/HomeScreen.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  AccessibilityInfo,
  Keyboard,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../contexts/TransactionContext';
import BalanceCard from '../components/BalanceCard';
import GlobeBackground from '../components/GlobeBackground';
import FloatingValutas from '../components/FloatingValutas';
import PrimaryButton from '../components/PrimaryButton';
import DepositScreen from './DepositScreen';
import ActionBottomSheet from '../components/ActionBottomSheet';
import TransactionModal from '../components/TransactionModal';
import { PAYMENT_CONFIG, paymentManager, TEST_DATA } from '../utils/PaymentAPIs';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import MobileMoneyPaymentScreen from './MobileMoneyPaymentScreen';
import PayPalPaymentScreen from './PayPalPaymentScreen';
import SendModal from './SendModal';
import ReceiveModal from './ReceiveModal';
import WithdrawModal from './WithdrawModal';
import { API_BASE, WEBHOOK_SECRET, getFxQuote, DEMO_MODE, circleRequest, CIRCLE_API_KEY } from '../app/config/api';
import { ROUTES } from '../navigation/routes';

const { width, height } = Dimensions.get('window');

const formatCurrency = (amount, currencyCode = 'USD') => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: currencyCode, 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(amount);
};

// FX Helper functions
const computeTargetSymbol = (code) => {
  if (code === 'EUR') return 'EUR';  // EUR stays EUR (1:1 to EURC)
  if (code === 'USD') return 'USD';  // USD stays USD (1:1 to USDC)
  return 'USD';  // All other currencies convert to USD first
};
const computeStablecoin = (code) => (code === 'EUR' ? 'EURC' : 'USDC');

// Special handling for 1:1 conversions
const getFxPreviewAmount = (quote, baseCurrency, amount) => {
  if (baseCurrency === 'EUR') {
    // EUR converts 1:1 to EURC
    return Number(amount || 0).toFixed(2);
  }
  if (baseCurrency === 'USD') {
    // USD converts 1:1 to USDC
    return Number(amount || 0).toFixed(2);
  }
  // Other currencies convert to USD/USDC via FX
  return Number(quote?.targetAmount || 0).toFixed(2);
};

// Constants for better maintainability
const MODAL_CONSTANTS = {
  KEYBOARD_OFFSET: Platform.OS === 'ios' ? 120 : 0,
  HEADER_TOP: Platform.OS === 'ios' ? 60 : 20,
  BALANCE_TOP: Platform.OS === 'ios' ? 108 : 82,
  CONTAINER_PADDING_TOP: Platform.OS === 'ios' ? 200 : 180,
  CONTAINER_PADDING_BOTTOM: Platform.OS === 'ios' ? 20 : 15,
  NAVIGATION_BOTTOM: Platform.OS === 'ios' ? 22 : 18,
};

const VALIDATION_CONSTANTS = {
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 10000,
  MAX_DECIMALS: 2,
};

// Auto-conversion constants
const AUTO_CONVERSION_CONFIG = {
  FX_SPREAD_BPS: 40, // 40 basis points spread
  SUPPORTED_CURRENCIES: ['USD', 'EUR', 'GHS', 'AED', 'NGN'],
  STABLECOINS: {
    USD: 'USDC',
    EUR: 'EURC',
    GHS: 'USDC',
    AED: 'USDC', 
    NGN: 'USDC'
  }
};

// Custom hook for card navigation
const useCardNavigation = (totalCards) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const handlePreviousCard = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentCardIndex(prev => prev === 0 ? totalCards - 1 : prev - 1);
  }, [totalCards]);

  const handleNextCard = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentCardIndex(prev => prev === totalCards - 1 ? 0 : prev + 1);
  }, [totalCards]);

  const goToCard = useCallback((index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentCardIndex(index);
  }, []);

  return {
    currentCardIndex,
    handlePreviousCard,
    handleNextCard,
    goToCard,
  };
};

// Custom hook for amount input validation
const useAmountValidation = () => {
  const [amountError, setAmountError] = useState('');
  const [isValidAmount, setIsValidAmount] = useState(false);

  const validateAmount = useCallback((amount) => {
    if (!amount || amount.trim() === '') {
      setAmountError('');
      setIsValidAmount(false);
      return false;
    }

    const num = parseFloat(amount);
    
    if (isNaN(num)) {
      setAmountError('Please enter a valid amount');
      setIsValidAmount(false);
      return false;
    }

    if (num < VALIDATION_CONSTANTS.MIN_AMOUNT) {
      setAmountError(`Minimum amount is ${VALIDATION_CONSTANTS.MIN_AMOUNT}`);
      setIsValidAmount(false);
      return false;
    }

    if (num > VALIDATION_CONSTANTS.MAX_AMOUNT) {
      setAmountError(`Maximum amount is ${VALIDATION_CONSTANTS.MAX_AMOUNT.toLocaleString()}`);
      setIsValidAmount(false);
      return false;
    }

    // Check decimal places
    const decimalPlaces = amount.split('.')[1]?.length || 0;
    if (decimalPlaces > VALIDATION_CONSTANTS.MAX_DECIMALS) {
      setAmountError(`Maximum ${VALIDATION_CONSTANTS.MAX_DECIMALS} decimal places allowed`);
      setIsValidAmount(false);
      return false;
    }

    setAmountError('');
    setIsValidAmount(true);
    return true;
  }, []);

  return {
    amountError,
    isValidAmount,
    validateAmount,
  };
};

// Auto-conversion hook
const useAutoConversion = () => {
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [eurcBalance, setEurcBalance] = useState(0);
  const [conversionLogs, setConversionLogs] = useState([]);
  const [isConverting, setIsConverting] = useState(false);

  // Get FX rates for local currencies
  const getFXRate = useCallback((fromCurrency) => {
    const rates = {
      'GHS': 15.0,
      'AED': 3.67,
      'NGN': 750
    };
    return rates[fromCurrency] || 1;
  }, []);

  // Log conversion events
  const logConversion = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setConversionLogs(prev => [...prev, { message: logEntry, type }]);
  }, []);

  // Update balance display
  const updateBalance = useCallback((stablecoin, amount) => {
    if (stablecoin === 'USDC') {
      setUsdcBalance(prev => prev + amount);
    } else if (stablecoin === 'EURC') {
      setEurcBalance(prev => prev + amount);
    }
  }, []);

  // Test API connection function with detailed debugging
  const testApiConnection = useCallback(async () => {
    try {
      console.log('🧪 Testing API connection to:', API_BASE);
      console.log('🌐 Device info:', Platform.OS, Platform.Version);
      console.log('📱 Network test starting...');
      
      const startTime = Date.now();
      // Test Circle API configuration endpoint instead of health check
      const response = await fetch(`${API_BASE}/configuration`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CIRCLE_API_KEY}`,
          'Accept': 'application/json',
          'User-Agent': 'EYM-Wallet-App/1.0'
        }
      });
      const endTime = Date.now();
      
      console.log('⏱️ Response time:', endTime - startTime, 'ms');
      console.log('📊 Response status:', response.status);
      console.log('🔗 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        // Defensive JSON parsing - handle both JSON and text responses
        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
          const data = await response.json();
          console.log('✅ API connection successful (JSON):', data);
          return true;
        } else {
          // Handle plain text responses (like "ok")
          const text = await response.text();
          if (text.trim().toLowerCase() === 'ok') {
            console.log('✅ API connection successful (text):', text);
            return true;
          } else {
            console.log('⚠️ Unexpected text response:', text);
            return true; // Still consider it successful if server responds
          }
        }
      } else {
        const errorText = await response.text();
        console.error('❌ API connection failed:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ API connection error:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      return false;
    }
  }, []);

  // Main conversion function - Circle API when available, demo fallback otherwise
  const performAutoConversion = useCallback(async (currency, amount, paymentMethod) => {
    console.log('🔄 Starting auto-conversion:', currency, amount, paymentMethod);
    
    setIsConverting(true);
    logConversion(`Processing ${amount} ${currency} deposit via ${paymentMethod}`, 'info');

    try {
      // If in demo mode, simulate conversion using public FX and avoid backend
      if (DEMO_MODE) {
        const target = currency === 'EUR' ? 'EUR' : 'USD';
        const quote = await getFxQuote({ base: currency, target, amount: Number(amount) || 0 });
        const stablecoin = target === 'EUR' ? 'EURC' : 'USDC';
        const amountToMint = quote.success ? Number(quote.targetAmount || 0) : Number(amount) || 0;
        logConversion(`Demo conversion: ${amount} ${currency} -> ${amountToMint} ${stablecoin}`, 'success');
        updateBalance(stablecoin, amountToMint);
        return {
          success: true,
          currency,
          amount,
          stablecoin,
          amountToMint,
          fxInfo: quote,
          userId: `demo_${Date.now()}`,
          circleTransactionId: 'demo'
        };
      }

      // Test connection first (non-demo)
      const isConnected = await testApiConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to Circle API. Please check your network connection.');
      }

      // Generate unique user ID for this session if not exists
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      logConversion(`Calling Circle API for ${amount} ${currency} conversion...`, 'info');
      console.log('🌐 API URL:', `${API_BASE}/deposits/webhook`);
      
      // Call real Circle API using the circleRequest function
      const result = await circleRequest('/deposits/webhook', {
        method: 'POST',
        headers: {
          'x-webhook-secret': WEBHOOK_SECRET
        },
        body: JSON.stringify({
          userId: userId,
          currency: currency,
          amount: amount,
          reference: `${paymentMethod.toLowerCase()}-${Date.now()}`
        })
      });

      console.log('✅ Circle API response:', result);
      
      if (!result.data || result.data.status !== 'converted') {
        throw new Error('Circle API conversion failed');
      }

      const { to, fx } = result.data;
      const stablecoin = to.currency;
      const amountToMint = to.amount;
      
      logConversion(`Successfully converted ${amount} ${currency} to ${amountToMint} ${stablecoin}`, 'success');
      
      // Update local balance state
      updateBalance(stablecoin, amountToMint);
      
      logConversion(`Credited ${amountToMint} ${stablecoin} to user balance`, 'success');
      logConversion(`Auto-conversion completed successfully via Circle API!`, 'success');

      return {
        success: true,
        currency,
        amount,
        stablecoin,
        amountToMint,
        fxInfo: fx,
        userId: userId,
        circleTransactionId: result.data.id
      };

    } catch (error) {
      console.error('❌ Circle API conversion failed:', error);
      logConversion(`Conversion failed: ${error.message}`, 'error');
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsConverting(false);
    }
  }, [logConversion, updateBalance]);

  return {
    usdcBalance,
    eurcBalance,
    conversionLogs,
    isConverting,
    performAutoConversion,
    logConversion
  };
};

// Memoized Payment Method Card Component
const PaymentMethodCard = React.memo(({ 
  method, 
  index, 
  currentCardIndex, 
  isProcessingPayment, 
  onPreviousCard, 
  onNextCard,
  onCardSelect,
  stackIndex,
  isTopCard 
}) => {
  const handleCardPress = useCallback(() => {
    if (!isProcessingPayment && isTopCard && onCardSelect) {
      console.log('🃏 Card pressed:', method.id, method.label);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onCardSelect(method);
    }
  }, [isProcessingPayment, isTopCard, onCardSelect, method]);

  const handleLeftArrowPress = useCallback(() => {
    if (!isProcessingPayment && isTopCard) {
      onPreviousCard();
    }
  }, [isProcessingPayment, isTopCard, onPreviousCard]);

  const handleRightArrowPress = useCallback(() => {
    if (!isProcessingPayment && isTopCard) {
      onNextCard();
    }
  }, [isProcessingPayment, isTopCard, onNextCard]);

  return (
    <Animated.View
      style={[
        styles.cardStackCard,
        { 
          zIndex: 6 - stackIndex,
          transform: [
            { translateY: stackIndex * 8 },
            { scale: 1 - (stackIndex * 0.05) }
          ],
          opacity: isTopCard ? 1 : 1
        }
      ]}
    >
      <LinearGradient
        colors={method.gradient}
        style={styles.cardStackCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardStackCardContent}>
          {/* Left arrow for previous card */}
          <TouchableOpacity
            onPress={handleLeftArrowPress}
            activeOpacity={0.7}
            style={styles.cardLeftArrow}
            disabled={isProcessingPayment || !isTopCard}
            accessibilityLabel={`Previous payment method`}
            accessibilityHint={`Double tap to go to previous payment method`}
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
          
          {/* Center content area */}
          <TouchableOpacity
            onPress={handleCardPress}
            activeOpacity={0.9}
            style={styles.cardCenterContent}
            disabled={isProcessingPayment}
            accessibilityLabel={`${method.label} payment method`}
            accessibilityHint={`Double tap to select ${method.label}`}
            accessibilityRole="button"
          >
            <View 
              style={styles.cardStackCardIcon}
            >
              <Ionicons 
                name={method.icon} 
                size={32} 
                color={isTopCard ? "#ffffff" : "rgba(255,255,255,0.8)"} 
              />
            </View>
            <View style={styles.cardStackCardInfo}>
              <Text style={styles.cardStackCardTitle}>{method.label}</Text>
              <Text style={styles.cardStackCardDescription}>
                {method.description}
              </Text>
              <View style={styles.cardStackCardDetails}>
                <View style={styles.cardStackCardTime}>
                  <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.cardStackCardTimeText}>
                    {method.processingTime}
                  </Text>
                </View>
                {(method.id === 'card' || method.id === 'bank') && (
                  <View style={styles.cardStackCardFee}>
                    <Ionicons name="alert-circle-outline" size={12} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.cardStackCardFeeText}>
                      {method.id === 'card' ? '2.5% fee' : '1.5% fee'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
          
          {/* Right arrow for next card */}
          <TouchableOpacity
            onPress={handleRightArrowPress}
            activeOpacity={0.7}
            style={styles.cardStackCardArrow}
            disabled={isProcessingPayment || !isTopCard}
            accessibilityLabel={`Next payment method`}
            accessibilityHint={`Double tap to go to next payment method`}
            accessibilityRole="button"
          >
            {isProcessingPayment && isTopCard ? (
              <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
            ) : (
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
});

// Loading State Component
const LoadingOverlay = React.memo(({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Processing payment...</Text>
      </View>
    </View>
  );
});

// Memoized Navigation Dots Component
const NavigationDots = React.memo(({ 
  paymentMethods, 
  currentCardIndex, 
  onCardSelect 
}) => {
  return (
    <View style={styles.cardStackDots}>
      {paymentMethods.map((method, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.cardStackDot,
            index === currentCardIndex && styles.cardStackDotActive
          ]}
          onPress={() => onCardSelect(index)}
          activeOpacity={0.7}
          accessibilityLabel={`${method.label} payment method`}
          accessibilityHint={`Double tap to select ${method.label}`}
          accessibilityRole="button"
          accessibilityState={{ selected: index === currentCardIndex }}
        >
          <Ionicons 
            name={method.icon} 
            size={16} 
            color={index === currentCardIndex ? "#ffffff" : method.color} 
          />
        </TouchableOpacity>
      ))}
    </View>
  );
});

const HomeScreen = () => {
  const { user, updateUserKycStatus } = useAuth();
  const { transactions, fetchTransactionHistory, isLoadingTransactions } = useTransactions();
  const { colors = Colors, isDarkMode } = useTheme();
  const { t } = useLanguage();

  // Balance state management
  const [balances, setBalances] = useState([
    { currency: 'USD', amount: 1250.75, symbol: '$', color: Colors.primary },
    { currency: 'EUR', amount: 980.50, symbol: '€', color: Colors.accent },
    { currency: 'GHS', amount: 150000.00, symbol: '₵', color: Colors.success },
    { currency: 'AED', amount: 3200.00, symbol: 'د.إ', color: Colors.info },
    { currency: 'NGN', amount: 250000.00, symbol: '₦', color: Colors.success },
  ]);

  // Function to get balance for a specific currency
  const getBalanceForCurrency = (currency) => {
    const balance = balances.find(b => b.currency === currency);
    return balance ? balance.amount.toLocaleString() : '0.00';
  };

  // Function to update balance after successful deposit
  const handleDepositSuccess = useCallback((depositData) => {
    console.log('💰 Balance updated:', depositData.currency, '+', depositData.amount);
    
    setBalances(prevBalances => {
      return prevBalances.map(balance => {
        if (balance.currency === depositData.currency) {
          return { ...balance, amount: balance.amount + depositData.amount };
        }
        return balance;
      });
    });
    
    // Note: Stablecoin balances will be updated through the auto-conversion hook
    // when the deposit is processed through the normal flow
  }, []); // Remove balances from dependency array to prevent infinite re-renders


  // Function to process bank transfer after account linking
  const processBankTransfer = async (accountId) => {
    try {
      setIsProcessingPayment(true);
      
      const transferResult = await paymentManager.processPayment({
        method: 'bank',
        amount: parseFloat(localAmount),
        currency: localCurrency,
        accountId: accountId,
        description: `Bank transfer - ${localCurrency} ${localAmount}`
      });
      
      if (transferResult.success) {
        setAlertTitle('Bank Transfer Successful');
        setAlertMessage(`Successfully transferred ${localCurrency} ${localAmount} from your bank account.`);
        setAlertType('success');
        setShowCustomAlert(true);
        setShowDepositModal(false);
      } else {
        setAlertTitle('Bank Transfer Failed');
        setAlertMessage(transferResult.error || 'Bank transfer failed. Please try again.');
        setAlertType('error');
        setShowCustomAlert(true);
      }
    } catch (error) {
      console.error('Bank transfer error:', error);
      setAlertTitle('Transfer Error');
      setAlertMessage('An error occurred while processing your bank transfer.');
      setAlertType('error');
      setShowCustomAlert(true);
    } finally {
      setIsProcessingPayment(false);
    }
  };
  const navigation = useNavigation();
  const { confirmPayment } = useStripe();
  const [localCurrency, setLocalCurrency] = useState('USD');
  const [localAmount, setLocalAmount] = useState('100');
  
  // API Rate States
  const [rates, setRates] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState(null);
  
  // Custom alert states
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');
  const [alertTitle, setAlertTitle] = useState('');
  
  // Transaction details modal
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const screenOpacity = useRef(new Animated.Value(0)).current;
  
  const [showMobileMoneyScreen, setShowMobileMoneyScreen] = useState(false);
  const [showPayPalScreen, setShowPayPalScreen] = useState(false);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);
  const successAnimation = useRef(new Animated.Value(0)).current;
  
  // Enhanced functionality
  const [recentAmounts, setRecentAmounts] = useState(['50', '100', '250', '500']);
  const { amountError, isValidAmount, validateAmount } = useAmountValidation();
  
  // FX Preview states
  const [quotePreview, setQuotePreview] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteErr, setQuoteErr] = useState('');
  
  // FX Confirmation states
  const [fxInfo, setFxInfo] = useState(null);
  const [fxLoading, setFxLoading] = useState(false);
  const [fxError, setFxError] = useState('');
  
  // Auto-conversion functionality
  const {
    usdcBalance,
    eurcBalance,
    conversionLogs,
    isConverting,
    performAutoConversion,
    logConversion
  } = useAutoConversion();
  
  // Auto-conversion modal states
  const [showAutoConversionModal, setShowAutoConversionModal] = useState(false);
  const [autoConversionData, setAutoConversionData] = useState(null);
  
  // Animated chevron for currency selector
  const chevronRotation = useRef(new Animated.Value(0)).current;
  
  // Search functionality for currency dropdown
  const [currencySearchQuery, setCurrencySearchQuery] = useState('');
  
  // Dynamic currency options with real-time rates
  const getCurrencyOptions = () => {
    const baseOptions = [
      { code: 'GHS', symbol: '₵', country: 'Ghana', flag: '🇬🇭' },
      { code: 'USD', symbol: '$', country: 'United States', flag: '🇺🇸' },
      { code: 'EUR', symbol: '€', country: 'European Union', flag: '🇪🇺' },
      { code: 'AED', symbol: 'د.إ', country: 'United Arab Emirates', flag: '🇦🇪' },
      { code: 'NGN', symbol: '₦', country: 'Nigeria', flag: '🇳🇬' },
    ];

    if (!rates) {
      // Fallback to hardcoded rates if API rates not available
      return baseOptions.map(option => ({
        ...option,
        rateToUSDC: option.code === 'USD' ? 1 : (option.code === 'GHS' ? 0.083 : (option.code === 'EUR' ? 1.08 : 0.5)),
        rateToEURC: option.code === 'EUR' ? 1 : (option.code === 'USD' ? 0.92 : (option.code === 'GHS' ? 0.077 : 0.46)),
      }));
    }

    return baseOptions.map(option => {
      const usdRate = rates.traditional[option.code] || 1;
      const eurRate = rates.traditional['EUR'] || 0.92;
      
      return {
        ...option,
        rateToUSDC: 1 / usdRate, // Convert to USD rate
        rateToEURC: eurRate / usdRate, // Convert local currency to EUR rate
      };
    });
  };
  
  // Filter currencies based on search query
  const filteredCurrencies = useMemo(() => {
    const currencyOptions = getCurrencyOptions();
    if (!currencySearchQuery.trim()) {
      return currencyOptions;
    }
    
    const query = currencySearchQuery.toLowerCase();
    return currencyOptions.filter(opt => 
      opt.code.toLowerCase().includes(query) ||
      opt.country.toLowerCase().includes(query) ||
      opt.symbol.toLowerCase().includes(query)
    );
  }, [currencySearchQuery, rates]);

  // Format exchange rate for display
  const formatExchangeRate = (rate, fromCurrency, toCurrency) => {
    if (!rate || rate === 1) return null;
    
    const formattedRate = rate < 0.01 ? rate.toFixed(6) : rate.toFixed(4);
    return `1 ${fromCurrency} = ${formattedRate} ${toCurrency}`;
  };

  // Get current exchange rate for a currency
  const getCurrentRate = (currencyCode) => {
    if (!rates || !rates.traditional) return null;
    
    const rate = rates.traditional[currencyCode];
    if (!rate) return null;
    
    return formatExchangeRate(rate, 'USD', currencyCode);
  };

  // Get fallback rate for display when live rates are not available
  const getFallbackRate = (currencyCode) => {
    const fallbackRates = {
      'GHS': 12.5,
      'EUR': 0.92,
      'AED': 3.67,
      'NGN': 750,
    };
    
    const rate = fallbackRates[currencyCode];
    if (!rate) return null;
    
    return formatExchangeRate(rate, 'USD', currencyCode);
  };
  
  // Get currency options for use throughout component
  const currencyOptions = getCurrencyOptions();
  
  // Animate chevron when dropdown opens/closes
  useEffect(() => {
    Animated.timing(chevronRotation, {
      toValue: showCurrencyDropdown ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showCurrencyDropdown]);

  // Enhanced keyboard handling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);
  

  const selectedCurrencyObj = currencyOptions.find(c => c.code === localCurrency);

  const handlePaymentMethodSelection = async (method) => {
    try {
      console.log('🎯 Payment method selected:', method.id, method.label);
      
      // Add haptic feedback for selection
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      setIsProcessingPayment(true);
      // Dismiss keyboard when payment method is selected to prevent unwanted movement
      Keyboard.dismiss();
      
            if (method.id === 'card') {
        // Show Stripe payment modal for card input
        setShowDepositModal(false);
        setShowStripePaymentModal(true);
      } else if (method.id === 'bank') {
        // Navigate to new 3-step bank transfer flow
        setShowDepositModal(false);
        navigation.navigate(ROUTES.BANK_AMOUNT, { 
          amount: localAmount,
          currency: localCurrency
        });
      } else if (method.id === 'mobile_money') {
        // Show mobile money payment screen as modal
        setShowDepositModal(false);
        setShowMobileMoneyScreen(true);
      } else if (method.id === 'paypal') {
        // Show PayPal payment screen as modal
        setShowDepositModal(false);
        setShowPayPalScreen(true);
      } else {
        // For other payment methods, show selection message
        setAlertTitle('Payment Method Selected');
        setAlertMessage(`${method.label} selected successfully.`);
        setAlertType('success');
        setShowCustomAlert(true);
        setShowDepositModal(false);
      }
    } catch (error) {
      console.error('Payment method selection error:', error);
      setAlertTitle('Error');
      setAlertMessage('An error occurred while processing your payment.');
      setAlertType('error');
      setShowCustomAlert(true);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleActionPress = (action) => {
    Haptics.selectionAsync();
    console.log('Action pressed:', action.id); // Debug log
    
    if (action.id === 'deposit') {
      // Directly show payment method screen for deposit
      setShowDepositModal(true);
    } else if (action.id === 'send') {
      // Show send modal
      setShowSendModal(true);
    } else if (action.id === 'receive') {
      // Show receive modal
      setShowReceiveModal(true);
    } else if (action.id === 'withdraw') {
      // Show withdraw modal
      setShowWithdrawModal(true);
    } else {
      // Fallback to ActionBottomSheet for other actions
      setCurrentAction(action);
      setShowActionBottomSheet(true);
    }
  };

  // REMOVED: handleAmountConfirm and handleCloseAmountModal - no longer needed

  const handleStripePayment = async () => {
    console.log('🚀 handleStripePayment function started');
    try {
      console.log('🚀 Setting isProcessingPayment to true');
      setIsProcessingPayment(true);
      
      console.log('🚀 Starting validation checks...');
      
      // Validate all fields
      if (!cardNumber || !expiryDate || !cvv || !cardHolder) {
        console.log('❌ Validation failed: Missing fields');
        setAlertTitle('Validation Error');
        setAlertMessage('Please fill in all card details.');
        setAlertType('error');
        setShowCustomAlert(true);
        return;
      }

      // Validate card details
      if (!cardNumberValid || !expiryDateValid || !cvvValid || !cardholderNameValid) {
        console.log('❌ Validation failed: Invalid card details', {
          cardNumberValid,
          expiryDateValid,
          cvvValid,
          cardholderNameValid
        });
        setAlertTitle('Invalid Card Details');
        setAlertMessage('Please check your card information and try again.');
        setAlertType('error');
        setShowCustomAlert(true);
        return;
      }

      console.log('✅ Validation passed, proceeding with payment...');

      // Step 1: Create Payment Intent with Stripe
      console.log('🔄 Creating Stripe Payment Intent...');
      const paymentIntent = await paymentManager.createPaymentIntent({
        amount: parseFloat(localAmount),
        currency: localCurrency.toLowerCase(),
        description: `EYM Wallet - Add ${localCurrency} ${localAmount}`
      });

      if (!paymentIntent || !paymentIntent.client_secret) {
        throw new Error('Failed to create payment intent');
      }

      console.log('✅ Payment Intent created:', paymentIntent.id);

      // Step 2: Process the payment with card details
      console.log('💳 Processing card payment...');
      console.log('🔄 Processing payment with data:', {
        method: 'card',
        amount: parseFloat(localAmount),
        currency: localCurrency,
        paymentIntentId: paymentIntent.id,
        hasClientSecret: !!paymentIntent.client_secret,
        cardNumber: cardNumber.substring(0, 4) + '****',
        expMonth: parseInt(expiryDate.split('/')[0]),
        expYear: parseInt('20' + expiryDate.split('/')[1]),
        cvc: cvv,
        cardholderName: cardHolder
      });

      const result = await paymentManager.processPayment({
        method: 'card',
        amount: parseFloat(localAmount),
        currency: localCurrency,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        cardDetails: {
          cardNumber: cardNumber,
          expMonth: parseInt(expiryDate.split('/')[0]),
          expYear: parseInt('20' + expiryDate.split('/')[1]),
          cvc: cvv,
          cardholderName: cardHolder
        }
      });

      console.log('📊 Payment result:', result);

      // Close the modal
      setShowStripePaymentModal(false);

      if (result.success) {
        // Update user balance (in a real app, this would come from backend)
        console.log('💰 Payment successful, updating balance...');
        console.log('🎯 Result object:', result);
        console.log('🎯 Payment success data being set:', {
          amount: localAmount,
          currency: localCurrency,
          transactionId: result.transactionId,
          paymentMethod: 'Credit/Debit Card',
          timestamp: new Date().toISOString(),
          usdcValue: getUSDCValue(),
          eurcValue: getEURCValue()
        });
        
        // Set success data for the success modal
        setPaymentSuccessData({
          amount: localAmount,
          currency: localCurrency,
          transactionId: result.transactionId,
          paymentMethod: 'Credit/Debit Card',
          timestamp: new Date().toISOString(),
          usdcValue: getUSDCValue() || '',
          eurcValue: getEURCValue() || ''
        });
        
        // Clear form fields
        setCardNumber('');
        setExpiryDate('');
        setCvv('');
        setCardHolder('');
        
        // Start auto-conversion process if supported currency
        if (AUTO_CONVERSION_CONFIG.SUPPORTED_CURRENCIES.includes(localCurrency)) {
          console.log('🔄 Starting auto-conversion for card payment');
          
          // Show auto-conversion modal
          setShowAutoConversionModal(true);
          
          // Perform auto-conversion
          const conversionResult = await performAutoConversion(
            localCurrency,
            parseFloat(localAmount),
            'Credit/Debit Card'
          );
          
          // Set auto-conversion data
          setAutoConversionData(conversionResult);
          
          // Close auto-conversion modal after delay
          setTimeout(() => {
            setShowAutoConversionModal(false);
            
            // Show payment success modal
            setShowPaymentSuccessModal(true);
            successAnimation.setValue(0);
            Animated.spring(successAnimation, {
              toValue: 1,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }).start();
          }, 3000);
          
        } else {
          // Direct success for unsupported currencies
          setShowPaymentSuccessModal(true);
          successAnimation.setValue(0);
          Animated.spring(successAnimation, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
        }
        
        // Refresh transaction history
        if (fetchTransactionHistory) {
          fetchTransactionHistory();
        }
      } else {
        setAlertTitle('Payment Failed');
        setAlertMessage(result.error || 'Payment processing failed. Please try again.');
        setAlertType('error');
        setShowCustomAlert(true);
      }

    } catch (error) {
      console.error('❌ Stripe payment error:', error);
      setAlertTitle('Payment Error');
      setAlertMessage(`Payment failed: ${error.message}`);
      setAlertType('error');
      setShowCustomAlert(true);
    } finally {
      setIsProcessingPayment(false);
    }
  };


  // Calculate USDC and EURC values using real-time rates
  const getUSDCValue = () => {
    if (!localAmount || isNaN(Number(localAmount)) || !selectedCurrencyObj) return '';
    
    // Special case: If input currency is USD, USDC = USD (1:1)
    if (localCurrency === 'USD') {
      return Number(localAmount).toFixed(2);
    }
    
    if (rates?.stablecoin) {
      // Use real-time stablecoin rates for other currencies
      const localToUSD = selectedCurrencyObj.rateToUSDC;
      const usdcRate = rates.stablecoin['usd-coin']?.usd || 1;
      return (Number(localAmount) * localToUSD * usdcRate).toFixed(2);
    } else {
      // Fallback to hardcoded calculation
      return (Number(localAmount) * selectedCurrencyObj.rateToUSDC).toFixed(2);
    }
  };

  const getEURCValue = () => {
    if (!localAmount || isNaN(Number(localAmount)) || !selectedCurrencyObj) return '';
    
    // Special case: If input currency is EUR, EURC = EUR (1:1)
    if (localCurrency === 'EUR') {
      return Number(localAmount).toFixed(2);
    }
    
    if (rates?.stablecoin) {
      // Use real-time stablecoin rates for other currencies
      const localToEUR = selectedCurrencyObj.rateToEURC;
      const eurcRate = rates.stablecoin['euro-coin']?.eur || 1;
      return (Number(localAmount) * localToEUR * eurcRate).toFixed(2);
    } else {
      // Fallback to hardcoded calculation
      return (Number(localAmount) * selectedCurrencyObj.rateToEURC).toFixed(2);
    }
  };

  const usdcValue = getUSDCValue();
  const eurcValue = getEURCValue();

  // Add state for Calculator 2 below the other useState hooks:
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [fromAmount, setFromAmount] = useState('');
  const fromCurrencyObj = currencyOptions.find(c => c.code === fromCurrency);
  const toCurrencyObj = currencyOptions.find(c => c.code === toCurrency);
  
  // Helper function to pre-fill test card data
  const fillTestCardData = (testCardType = 'success') => {
    const testCard = TEST_DATA.cards[testCardType];
    if (testCard) {
      console.log('🧪 Filling test card data:', testCardType, testCard);
      
      const cardNumber = testCard.number;
      const expiryDate = `${testCard.expMonth.toString().padStart(2, '0')}/${testCard.expYear.toString().slice(-2)}`;
      const cvv = testCard.cvc;
      const cardholderName = testCard.cardholderName;
      
      // Set the values
      setCardNumber(cardNumber);
      setExpiryDate(expiryDate);
      setCvv(cvv);
      setCardHolder(cardholderName);
      
      // Validate the values
      setCardNumberValid(validateCardNumber(cardNumber));
      setExpiryDateValid(validateExpiryDate(expiryDate));
      setCvvValid(validateCVC(cvv));
      setCardholderNameValid(validateCardholderName(cardholderName));
      
      console.log('🧪 Test card data set and validated:', {
        number: cardNumber,
        expiry: expiryDate,
        cvc: cvv,
        holder: cardholderName,
        cardNumberValid: validateCardNumber(cardNumber),
        expiryDateValid: validateExpiryDate(expiryDate),
        cvvValid: validateCVC(cvv),
        cardholderNameValid: validateCardholderName(cardholderName)
      });
    }
  };

  // Calculate converted amount using real-time rates
  const getConvertedAmount = () => {
    if (!fromAmount || isNaN(Number(fromAmount)) || !fromCurrencyObj || !toCurrencyObj) return '';
    
    if (rates?.traditional) {
      // Use real-time rates for conversion
      const fromRate = rates.traditional[fromCurrency] || 1;
      const toRate = rates.traditional[toCurrency] || 1;
      return (Number(fromAmount) * (toRate / fromRate)).toFixed(2);
    } else {
      // Fallback to hardcoded calculation
      return (Number(fromAmount) * (fromCurrencyObj.rateToUSDC / toCurrencyObj.rateToUSDC)).toFixed(2);
    }
  };
  
  const convertedAmount = getConvertedAmount();

  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchTransactionHistory();
    if (Platform.OS === 'android') {
      if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    }
  }, [fetchTransactionHistory]);

  // Debounced FX preview effect
  useEffect(() => {
    setQuoteErr('');
    setQuotePreview(null);
    const amt = Number(localAmount);
    if (!localAmount || Number.isNaN(amt) || amt <= 0 || !showDepositModal) return;
    
    const base = selectedCurrencyObj?.code || localCurrency || 'USD';
    console.log(`🔍 Currency detected: "${base}" (selectedCurrencyObj:`, selectedCurrencyObj, ', localCurrency:', localCurrency, ')');
    
    // EUR and USD convert 1:1, no API call needed
    if (base === 'EUR' || base === 'USD') {
      console.log(`✅ ${base} detected, using 1:1 conversion to ${base === 'EUR' ? 'EURC' : 'USDC'}`);
      setQuoteLoading(false);
      setQuotePreview({
        base: base,
        target: base,
        rate: 1.0,
        effectiveRate: 1.0,
        targetAmount: amt,
        source: 'live',
        ts: Date.now()
      });
      return;
    }
    
    const target = computeTargetSymbol(base);
    console.log(`🔄 Non-1:1 currency: ${base} → ${target}, making API call`);
    
    const t = setTimeout(async () => {
      try {
        setQuoteLoading(true);
        console.log(`🔄 Fetching FX quote: ${base} → ${target}, amount: ${amt}`);
        const q = await getFxQuote(base, target, amt);
        console.log(`✅ FX quote received:`, q);
        setQuotePreview(q);
        setQuoteErr(''); // Clear any previous errors
      } catch (e) {
        console.error(`❌ FX quote error:`, e);
        setQuoteErr(e?.message || String(e));
      } finally {
        setQuoteLoading(false);
      }
    }, 500);
    
    return () => clearTimeout(t);
  }, [localAmount, selectedCurrencyObj?.code, showDepositModal]);

  // FX confirmation effect
  useEffect(() => {
    async function fetchFx() {
      try {
        setFxError(''); 
        setFxLoading(true);
        const base = selectedCurrencyObj?.code || localCurrency || 'USD';
        const amt = Number(localAmount) || 0;
        if (amt <= 0) { 
          setFxInfo(null); 
          return; 
        }
        
        // EUR and USD convert 1:1, create mock quote
        if (base === 'EUR' || base === 'USD') {
          setFxInfo({
            base: base,
            target: base,
            rate: 1.0,
            effectiveRate: 1.0,
            targetAmount: amt,
            source: 'live',
            ts: Date.now()
          });
          setFxLoading(false);
          return;
        }
        
        const target = computeTargetSymbol(base);
        const q = await getFxQuote(base, target, amt);
        setFxInfo(q);
      } catch (e) {
        setFxError(e?.message || String(e));
        setFxInfo(null);
      } finally {
        setFxLoading(false);
      }
    }
    if (showPaymentSuccessModal) fetchFx();
  }, [showPaymentSuccessModal, localAmount, selectedCurrencyObj?.currency]);

  // Fade in animation when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reset opacity to 0 when screen loses focus
      screenOpacity.setValue(0);
      
      // Fade in when screen comes into focus
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, [])
  );

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [transactions]);

  // Set default amount when currency changes for better UX
  useEffect(() => {
    setLocalAmount('100');
  }, [localCurrency]);
  
  // Reset amount when currency changes in payment modal
  useEffect(() => {
    if (showDepositModal) {
      setLocalAmount('100');
    }
  }, [localCurrency, showDepositModal]);

  // Ensure currency is synchronized with the first balance card on mount
  useEffect(() => {
    // The first balance card is USD, so ensure localCurrency matches
    if (localCurrency !== 'USD') {
      setLocalCurrency('USD');
    }
  }, []);

  // API Rate Functions
  const fetchTraditionalRates = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (!response.ok) throw new Error('Failed to fetch traditional rates');
      const data = await response.json();
      return data.rates;
    } catch (error) {
      console.log('Traditional rates API error:', error.message);
      return null;
    }
  };

  const fetchStablecoinRates = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=usd-coin,euro-coin,solana&vs_currencies=usd,eur,ghs,ngn,aed');
      if (!response.ok) throw new Error('Failed to fetch stablecoin rates');
      const data = await response.json();
      return data;
    } catch (error) {
      console.log('Stablecoin rates API error:', error.message);
      return null;
    }
  };

  const fetchAllRates = async () => {
    setIsLoadingRates(true);
    setRatesError(null);
    
    try {
      const [traditionalRates, stablecoinRates] = await Promise.all([
        fetchTraditionalRates(),
        fetchStablecoinRates()
      ]);
      
      if (traditionalRates && stablecoinRates) {
        setRates({ traditional: traditionalRates, stablecoin: stablecoinRates });
        setLastUpdated(Date.now());
        console.log('Rates updated successfully');
      } else {
        throw new Error('Failed to fetch rates from both APIs');
      }
    } catch (error) {
      setRatesError('Unable to fetch current rates. Using cached rates.');
      console.log('Rate fetching failed:', error.message);
    } finally {
      setIsLoadingRates(false);
    }
  };

  // Fetch rates on component mount and every 5 minutes
  useEffect(() => {
    fetchAllRates();
    
    const interval = setInterval(fetchAllRates, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  // Manual refresh function
  const handleRefreshRates = () => {
    fetchAllRates();
    // Add haptic feedback
    Haptics.selectionAsync();
  };

  // Format last updated time
  const getLastUpdatedText = () => {
    if (!lastUpdated) return 'Never updated';
    
    const now = Date.now();
    const diff = now - lastUpdated;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const showAlert = (title, message, type = 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setShowCustomAlert(true);
  };

  const handleTransactionPress = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  const handleCloseTransactionDetails = () => {
    setShowTransactionDetails(false);
    setSelectedTransaction(null);
  };




  const handleHeaderIconPress = (icon) => {
    Haptics.selectionAsync();
    switch (icon) {
      case 'credit-cards':
        showAlert('Credit Cards', 'Credit card management coming soon!', 'info');
        break;
      case 'education':
        showAlert('Education', 'Education and learning features coming soon!', 'info');
        break;
      case 'hedging':
        showAlert('Auto-conversion', 'This feature has been removed.', 'info');
        break;
      default:
        break;
    }
  };

  // Action Bottom Sheet state
  const [showActionBottomSheet, setShowActionBottomSheet] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showStripePaymentModal, setShowStripePaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  // REMOVED: showAmountInputModal and depositAmount - no longer needed
  const [cardNumber, setCardNumber] = useState('');
  const [cardType, setCardType] = useState(null);

  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Card type detection function
  const detectCardType = (number) => {
    const cleaned = number.replace(/\s/g, '');
    
    if (cleaned.startsWith('4')) {
      return { type: 'visa', color: '#1a1f71' };
    } else if (cleaned.startsWith('5')) {
      return { type: 'mastercard', color: '#eb001b' };
    } else if (cleaned.startsWith('34') || cleaned.startsWith('37')) {
      return { type: 'amex', color: '#006fcf' };
    } else if (cleaned.startsWith('6')) {
      return { type: 'discover', color: '#ff6000' };
    } else if (cleaned.startsWith('35')) {
      return { type: 'jcb', color: '#0b4ea2' };
    } else if (cleaned.startsWith('62')) {
      return { type: 'unionpay', color: '#e60012' };
    } else if (cleaned.startsWith('3')) {
      return { type: 'diners', color: '#0079be' };
    }
    
    return null;
  };

  // Credit card logo components
  const VisaLogo = () => (
    <View style={styles.cardLogoContainer}>
      <View style={styles.visaLogo}>
        <Text style={styles.visaText}>VISA</Text>
      </View>
    </View>
  );

  const MastercardLogo = () => (
    <View style={styles.cardLogoContainer}>
      <View style={styles.mastercardLogo}>
        <View style={styles.mastercardCircle1} />
        <View style={styles.mastercardCircle2} />
      </View>
    </View>
  );

  const AmexLogo = () => (
    <View style={styles.cardLogoContainer}>
      <View style={styles.amexLogo}>
        <Text style={styles.amexText}>AMEX</Text>
      </View>
    </View>
  );

  const DiscoverLogo = () => (
    <View style={styles.cardLogoContainer}>
      <View style={styles.discoverLogo}>
        <Text style={styles.discoverText}>DISCOVER</Text>
      </View>
    </View>
  );

  const JCBSLogo = () => (
    <View style={styles.cardLogoContainer}>
      <View style={styles.jcbLogo}>
        <Text style={styles.jcbText}>JCB</Text>
      </View>
    </View>
  );

  const UnionPayLogo = () => (
    <View style={styles.cardLogoContainer}>
      <View style={styles.unionPayLogo}>
        <Text style={styles.unionPayText}>银联</Text>
      </View>
    </View>
  );

  const DinersLogo = () => (
    <View style={styles.cardLogoContainer}>
      <View style={styles.dinersLogo}>
        <Text style={styles.dinersText}>DINERS</Text>
      </View>
    </View>
  );

  const renderCardLogo = (cardType) => {
    switch (cardType.type) {
      case 'visa':
        return <VisaLogo />;
      case 'mastercard':
        return <MastercardLogo />;
      case 'amex':
        return <AmexLogo />;
      case 'discover':
        return <DiscoverLogo />;
      case 'jcb':
        return <JCBSLogo />;
      case 'unionpay':
        return <UnionPayLogo />;
      case 'diners':
        return <DinersLogo />;
      default:
        return null;
    }
  };

  // Auto-formatting functions
  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };
  
  const formatExpiryDate = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  // Validation functions
  const validateCardNumber = (number) => {
    const cleaned = number.replace(/\s/g, '');
    return cleaned.length >= 13 && cleaned.length <= 19;
  };

  const validateExpiryDate = (date) => {
    if (!date || date.length !== 5) return false;
    const [month, year] = date.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const expMonth = parseInt(month);
    const expYear = parseInt(year);
    
    if (expMonth < 1 || expMonth > 12) return false;
    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;
    
    return true;
  };

  const validateCVC = (cvc) => {
    return cvc.length >= 3 && cvc.length <= 4;
  };

  const validateCardholderName = (name) => {
    return name.length >= 2 && /^[a-zA-Z\s]+$/.test(name);
  };

  // Validation states
  const [cardNumberValid, setCardNumberValid] = useState(null);
  const [expiryDateValid, setExpiryDateValid] = useState(null);
  const [cvvValid, setCvvValid] = useState(null);
  const [cardholderNameValid, setCardholderNameValid] = useState(null);

  // Security states
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Reset card index when modal opens
  useEffect(() => {
    if (showDepositModal) {
      setCurrentCardIndex(0);
    }
  }, [showDepositModal]);
  const [showCurrencyModal, setShowCurrencyModal] = useState(null); // null | 'main' | 'from' | 'to'
  const scrollViewRef = useRef(null);
  const amountInputRef = useRef(null);
  const currencyDropdownOpacity = useRef(new Animated.Value(0)).current;
  
  // Animate currency dropdown when it appears/disappears
  useEffect(() => {
    if (showCurrencyModal) {
      Animated.timing(currencyDropdownOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(currencyDropdownOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [showCurrencyModal]);
  
  // Add missing deposit confirmation state:




  const handleAmountInputFocus = () => {
    // Scroll to the amount input after a short delay to ensure keyboard is shown
    setTimeout(() => {
      if (scrollViewRef.current && amountInputRef.current) {
        amountInputRef.current.measureLayout(
          scrollViewRef.current,
          (x, y) => {
            scrollViewRef.current.scrollTo({
              y: y - 100, // Offset to show some space above the input
              animated: true,
            });
          },
          () => {
            // Fallback: scroll to a fixed position
            scrollViewRef.current.scrollTo({
              y: 400, // Approximate position of the calculator card
              animated: true,
            });
          }
        );
      }
    }, 300);
  };

  // Simplified Card Stack Functions - removed complex gesture handling
  const paymentMethods = [
    { id: 'mobile_money', label: 'Mobile Money', icon: 'phone-portrait-outline', description: 'Airtel, M-Pesa, MTN or Vodafone Cash', processingTime: 'Instant', color: '#10b981', gradient: ['#10b981', '#059669'] },
    { id: 'apple_pay', label: 'Apple Pay', icon: 'logo-apple', description: 'Pay with Apple Pay', processingTime: 'Instant', color: '#000000', gradient: ['#000000', '#374151'] },
    { id: 'google_pay', label: 'Google Pay', icon: 'logo-google', description: 'Pay with Google Pay', processingTime: 'Instant', color: '#4285f4', gradient: ['#4285f4', '#1e40af'] },
    { id: 'paypal', label: 'PayPal', icon: 'logo-paypal', description: 'Pay with PayPal', processingTime: 'Instant', color: '#003087', gradient: ['#003087', '#1e40af'] },
    { id: 'card', label: 'Credit/Debit Card', icon: 'card-outline', description: 'Visa, Mastercard', processingTime: 'Instant', color: '#6366f1', gradient: ['#6366f1', '#4f46e5'] },
    { id: 'bank', label: 'Bank Transfer', icon: 'business-outline', description: 'Direct bank transfer', processingTime: 'Instant', color: '#059669', gradient: ['#059669', '#047857'] },
  ];

  const handleNextCard = () => {
    Haptics.selectionAsync();
    const nextIndex = (currentCardIndex + 1) % paymentMethods.length;
    setCurrentCardIndex(nextIndex);
  };

  const handlePreviousCard = () => {
    Haptics.selectionAsync();
    const prevIndex = currentCardIndex === 0 ? paymentMethods.length - 1 : currentCardIndex - 1;
    setCurrentCardIndex(prevIndex);
  };

  const goToCard = (index) => {
    Haptics.selectionAsync();
    setCurrentCardIndex(index);
  };







  // Calculator state and competitor data

  // Add competitor data
  // (Remove lines 382-425 entirely)
  // ... existing code ...

  // Calculate competitor totals when localAmount changes
  // (Remove lines 382-425 entirely)
  // ... existing code ...

  // At the top of the HomeScreen component:
  const [activeCalculator, setActiveCalculator] = useState('main'); // 'main' or 'new'
  const sliderAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(sliderAnim, {
      toValue: activeCalculator === 'main' ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [activeCalculator]);

  // Add competitor data for Calculator 2 (below other state):
  const competitors = [
    {
      name: 'SendNReceive',
      rate: 0.083, // Best rate
      fee: 0.00,
      logo: '⭐',
    },
    {
      name: 'Western Union',
      rate: 0.075,
      fee: 12.50,
      logo: '🏦',
    },
    {
      name: 'MoneyGram',
      rate: 0.077,
      fee: 15.00,
      logo: '💳',
    },
    {
      name: 'WorldRemit',
      rate: 0.078,
      fee: 9.99,
      logo: '🌍',
    },
    {
      name: 'Remitly',
      rate: 0.079,
      fee: 7.99,
      logo: '🚀',
    },
    {
      name: 'TapTapSend',
      rate: 0.080,
      fee: 4.99,
      logo: '📱',
    },
  ];

  // Calculate competitor results for Calculator 2
  const competitorResults = competitors.map(comp => {
    if (!fromAmount || isNaN(Number(fromAmount)) || !fromCurrencyObj || !toCurrencyObj) {
      return { ...comp, youGet: '' };
    }
    // Step 1: Convert fromAmount to USD using fromCurrencyObj.rateToUSDC
    const usdAmount = Number(fromAmount) * fromCurrencyObj.rateToUSDC;
    // Step 2: Subtract competitor's fee (in USD)
    const usdAfterFee = usdAmount - comp.fee;
    // Step 3: Convert USD to 'To' currency using toCurrencyObj.rateToUSDC
    const toAmount = usdAfterFee / toCurrencyObj.rateToUSDC;
    return {
      ...comp,
      youGet: toAmount > 0 ? toAmount.toFixed(2) : '0.00',
    };
  });

  // Find the best provider (highest youGet):
  const bestYouGet = Math.max(...competitorResults.map(c => parseFloat(c.youGet || '0')));

  // At the top of the HomeScreen component, add:
  const pillOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    pillOpacity.setValue(0);
    Animated.timing(pillOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: false, // Fix: left is not supported by native driver
    }).start();
  }, [activeCalculator]);

  // At the top of the HomeScreen component, add:
  const calculatorContentOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    calculatorContentOpacity.setValue(0);
    Animated.timing(calculatorContentOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [activeCalculator]);

  // Define constants for segmented control dimensions
  const SEGMENTED_CONTAINER_WIDTH = 312;
  const SEGMENTED_CONTAINER_HEIGHT = 48;
  const SEGMENTED_PILL_WIDTH = SEGMENTED_CONTAINER_WIDTH / 2 - 8; // 8px total margin (4px each side)
  const SEGMENTED_PILL_HEIGHT = SEGMENTED_CONTAINER_HEIGHT - 8; // 4px top/bottom margin
  const SEGMENTED_PILL_RADIUS = SEGMENTED_PILL_HEIGHT / 2;
  const SEGMENTED_CONTAINER_RADIUS = SEGMENTED_CONTAINER_HEIGHT / 2;
  const SEGMENTED_PILL_SIDE_MARGIN = 4;
  const SEGMENTED_PILL_TOP = (SEGMENTED_CONTAINER_HEIGHT - SEGMENTED_PILL_HEIGHT) / 2;

  // Add state for send stablecoin modal
  const [showSendStablecoinModal, setShowSendStablecoinModal] = useState(false);
  const [selectedSendOption, setSelectedSendOption] = useState('native');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  

  

  useEffect(() => {
    if (showSendStablecoinModal) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }).start();
    }
  }, [showSendStablecoinModal]);

  // Removed auto-focus to prevent unwanted keyboard appearance and layout shifts



  // Keyboard state management
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  


  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <Animated.View style={{ flex: 1, opacity: screenOpacity }}>
              {/* Subtle background pattern */}
      <View style={[styles.backgroundPattern, { backgroundColor: colors.backgroundSecondary }]} pointerEvents="none" />
    {/* Globe background image */}
      <GlobeBackground pointerEvents="none" />
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContentContainer,
            { paddingBottom: Platform.OS === 'ios' ? 110 : 100 }, // Account for premium tab bar
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Remove the parent View's opacity wrapper */}
        {/* <View style={{opacity: 0.88}}> */}
          {/* Premium Header */}
          <View style={styles.headerContainer}>
            <View>
              <Text style={[Typography.bodySmall, styles.welcomeText, { color: colors.text } ]}>Welcome Back,</Text>
              <Text style={[Typography.h1, styles.userName, { color: colors.text } ]}>{user?.fullName ?? 'User'}!</Text>
            </View>
            <View style={styles.headerIconsContainer}>
              <TouchableOpacity 
                style={[styles.headerIcon, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]} 
                onPress={() => handleHeaderIconPress('credit-cards')}
                activeOpacity={0.7}
              >
                <Ionicons name="card-outline" size={24} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.headerIcon, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]} 
                onPress={() => handleHeaderIconPress('education')}
                activeOpacity={0.7}
              >
                <Ionicons name="school-outline" size={24} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.headerIcon, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]} 
                onPress={() => handleHeaderIconPress('hedging')}
                activeOpacity={0.7}
              >
                <Ionicons name="trending-up" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Balance Card - now at the very top */}
          <BalanceCard 
            balances={balances}
            onCurrencyChange={(currencyObj) => setLocalCurrency(currencyObj.currency)}
            onActionPress={handleActionPress}
             usdcBalance={`$${usdcBalance.toFixed(2)}`}
             eurcBalance={`€${eurcBalance.toFixed(2)}`}
            scrollViewRef={scrollViewRef}
          />

          {/* Add extra spacing to separate dots from calculator */}
          <View style={{ height: 6, width: '100%' }} />
          
          {/* Auto-Conversion Test Button (for development) */}
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.primary }]}
            onPress={async () => {
              console.log('🧪 Testing auto-conversion...');
              setShowAutoConversionModal(true);
              
              const testResult = await performAutoConversion('GHS', 100, 'Test');
              setAutoConversionData(testResult);
              
              setTimeout(() => {
                setShowAutoConversionModal(false);
              }, 4000);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.testButtonText}>🧪 Test Auto-Conversion</Text>
          </TouchableOpacity>

          
        {/* Swipeable Calculators */}
        {/* Unified Calculator with Rate Comparison */}
        <View style={[styles.calculatorCard, { backgroundColor: colors.glassBackground }]}> 
          {/* Premium Segmented Control (Slider) */}
          <View style={[styles.segmentedControlContainer, { width: SEGMENTED_CONTAINER_WIDTH, height: SEGMENTED_CONTAINER_HEIGHT, borderRadius: SEGMENTED_CONTAINER_RADIUS }]}>
            {/* Render both icons in the bar, muted */}
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              flexDirection: 'row',
              zIndex: 0,
            }} pointerEvents="none">
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="repeat" size={22} color={'#64748b'} />
              </View>
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="cash-fast" size={22} color={'#64748b'} />
              </View>
            </View>
            {/* Render the pill above the bar and icons */}
            <Animated.View
              style={[
                styles.segmentedControlPillWrapper,
                {
                  left: sliderAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [3, (312 - 148 - 6)], // increased right margin to 6px
                  }),
                  opacity: pillOpacity,
                },
              ]}
            >
              <View style={[styles.segmentedControlPill, { borderRadius: SEGMENTED_PILL_RADIUS }]}>
                <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
                <LinearGradient
                  colors={["rgba(30,64,175,0.3)", "rgba(99,102,241,0.3)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.segmentedControlGradient}
                />
                <View style={styles.segmentedControlIconContainer}>
                  {activeCalculator === 'main' ? (
                    <MaterialCommunityIcons name="repeat" size={22} color="#fff" />
                  ) : (
                    <MaterialCommunityIcons name="cash-fast" size={22} color="#fff" />
                  )}
                </View>
              </View>
            </Animated.View>
            <TouchableOpacity
              style={styles.segmentedControlButton}
              onPress={() => setActiveCalculator('main')}
              activeOpacity={0.85}
            >
              {/* No label, just icon in pill */}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.segmentedControlButton}
              onPress={() => setActiveCalculator('new')}
              activeOpacity={0.85}
            >
              {/* No label, just icon in pill */}
            </TouchableOpacity>
          </View>
          {/* Conditionally render calculators */}
          <Animated.View style={{ opacity: calculatorContentOpacity }}>
            {activeCalculator === 'main' && (
              <>
                {/* Input Section */}
            <View style={styles.calculatorRow}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                      <Text style={[styles.calculatorLabel, { color: colors.textMuted, textAlign: 'center' }]}>Currency</Text>
                    <TouchableOpacity
                        style={[styles.currencySelectorRow, { width: '100%', backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => setShowCurrencyModal('main')}
                      activeOpacity={0.8}
                      accessibilityLabel="Select currency"
                    >
                      <Text style={styles.currencySelectorFlag}>{selectedCurrencyObj?.flag || ''}</Text>
                        <Text style={[styles.currencySelectorText, { color: colors.textPrimary }]}>{localCurrency}</Text>
                        <Text style={[styles.currencySelectorSymbol, { color: colors.textMuted }]}>{selectedCurrencyObj?.symbol || ''}</Text>
                        <Ionicons name="chevron-down" size={18} color={colors.textMuted} style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                      <Text style={[styles.calculatorLabel, { color: colors.textMuted, textAlign: 'center' }]}>Amount</Text>
                    <TextInput
                      ref={amountInputRef}
                          style={[styles.calculatorInput, { width: '100%', backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary, textAlign: 'center' }]}
                       placeholder={`${selectedCurrencyObj?.symbol || ''} 0.00`}
                        placeholderTextColor={colors.textMuted}
                      value={localAmount}
                      onChangeText={setLocalAmount}
                      keyboardType="numeric"
                      maxLength={10}
                      onFocus={handleAmountInputFocus}
                      accessibilityLabel={`Enter amount in ${selectedCurrencyObj?.code || ''}`}
                    />
                  </View>
                </View>
              </View>
                {/* USDC/EURC Conversion */}
                            <View style={styles.calculatorRow}>
                  <View style={[styles.calculationItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.calculatorLabel, { color: colors.textMuted }]}>USDC</Text>
                    <Text style={[styles.calculatorValue, { color: colors.textPrimary }]}>{usdcValue ? `$${usdcValue}` : '--'}</Text>
                  </View>
                  <View style={styles.calculationDivider} />
                  <View style={[styles.calculationItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.calculatorLabel, { color: colors.textMuted }]}>EURC</Text>
                    <Text style={[styles.calculatorValue, { color: colors.textPrimary }]}>{eurcValue ? `€${eurcValue}` : '--'}</Text>
                  </View>
                </View>
                
                {/* Rate Status Indicator */}
                <View style={[styles.rateStatusContainer, { borderTopColor: colors.border }]}>
                  <View style={styles.rateStatusRow}>
                    <View style={styles.rateStatusCenter}>
                      {isLoadingRates ? (
                        <View style={styles.rateStatusLoading}>
                          <Ionicons name="refresh" size={14} color="#64748b" />
                          <Text style={styles.rateStatusText}>Updating rates...</Text>
                        </View>
                      ) : ratesError ? (
                        <View style={styles.rateStatusError}>
                          <Ionicons name="warning-outline" size={14} color="#ef4444" />
                          <Text style={[styles.rateStatusText, { color: '#ef4444' }]}>Using cached rates</Text>
                        </View>
                      ) : (
                        <View style={styles.rateStatusSuccess}>
                          <Ionicons name="checkmark-circle-outline" size={14} color="#10b981" />
                          <Text style={styles.rateStatusText}>Live rates</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity 
                      style={[styles.refreshButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                      onPress={handleRefreshRates}
                      disabled={isLoadingRates}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name="refresh" 
                        size={16} 
                        color={isLoadingRates ? colors.textMuted : colors.textSecondary} 
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.lastUpdatedText, { color: colors.textMuted, textAlign: 'center' }]}>{getLastUpdatedText()}</Text>
                </View>
              </>
            )}
            {activeCalculator === 'new' && (
              <>
                {/* Input Section */}
                <View style={styles.calculatorRow}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.calculatorLabel, { color: colors.textMuted, textAlign: 'center' }]}>From</Text>
                      <TouchableOpacity
                        style={[styles.currencySelectorRow, { width: '100%', backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => setShowCurrencyModal('from')}
                        activeOpacity={0.8}
                        accessibilityLabel="Select from currency"
                      >
                        <Text style={styles.currencySelectorFlag}>{fromCurrencyObj?.flag || ''}</Text>
                        <Text style={[styles.currencySelectorText, { color: colors.textPrimary }]}>{fromCurrency}</Text>
                        <Text style={[styles.currencySelectorSymbol, { color: colors.textMuted }]}>{fromCurrencyObj?.symbol || ''}</Text>
                        <Ionicons name="chevron-down" size={18} color={colors.textMuted} style={{ marginLeft: 6 }} />
                      </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.calculatorLabel, { color: colors.textMuted, textAlign: 'center' }]}>Amount</Text>
                      <TextInput
                        style={[styles.calculatorInput, { width: '100%', backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary, textAlign: 'center' }]}
                        placeholder={`${fromCurrencyObj?.symbol || ''} 0.00`}
                        placeholderTextColor={colors.textMuted}
                        value={fromAmount}
                        onChangeText={setFromAmount}
                        keyboardType="numeric"
                        maxLength={10}
                        accessibilityLabel={`Enter amount in ${fromCurrencyObj?.code || ''}`}
                      />
                    </View>
                  </View>
                </View>
                {/* To Currency and Result */}
                <View style={styles.calculatorRow}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.calculatorLabel, { color: colors.textMuted, textAlign: 'center' }]}>To</Text>
                      <TouchableOpacity
                        style={[styles.currencySelectorRow, { width: '100%', backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => setShowCurrencyModal('to')}
                        activeOpacity={0.8}
                        accessibilityLabel="Select to currency"
                      >
                        <Text style={styles.currencySelectorFlag}>{toCurrencyObj?.flag || ''}</Text>
                        <Text style={[styles.currencySelectorText, { color: colors.textPrimary }]}>{toCurrency}</Text>
                        <Text style={[styles.currencySelectorSymbol, { color: colors.textMuted }]}>{toCurrencyObj?.symbol || ''}</Text>
                        <Ionicons name="chevron-down" size={18} color={colors.textMuted} style={{ marginLeft: 6 }} />
                      </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.calculatorLabel, { color: colors.textMuted, textAlign: 'center' }]}>Result</Text>
                      <View style={[styles.calculationItem, { backgroundColor: colors.background, borderColor: colors.border, justifyContent: 'center' }]}>
                        <Text style={[styles.calculatorValue, { color: colors.primary }]}>
                          {convertedAmount ? `${toCurrencyObj?.symbol || ''}${convertedAmount}` : '--'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                                {/* Competitor Comparison */}
                {fromAmount && !isNaN(Number(fromAmount)) && (
                  <View style={{ width: '100%', marginTop: 8, pointerEvents: 'box-none' }}>
                    <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 16, color: '#1e293b', marginBottom: 8, textAlign: 'center' }}>Compare Fees</Text>
                    {competitorResults.map((comp, idx) => {
                      const isBest = parseFloat(comp.youGet) === bestYouGet && bestYouGet > 0;
                      return (
                        <View key={comp.name} style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: isBest ? '#f0fdf4' : '#fff',
                          borderRadius: 16,
                          padding: 14,
                          marginBottom: 10,
                          shadowColor: '#1e40af',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.06,
                          shadowRadius: 4,
                          elevation: 1,
                          borderWidth: isBest ? 2 : 0,
                          borderColor: isBest ? '#10b981' : 'transparent',
                        }} pointerEvents="auto">
                          <Text style={{ fontSize: 22, marginRight: 10 }}>{comp.logo}</Text>
                          <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
                            <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 15, color: '#1e293b', marginRight: 8 }}>{comp.name}</Text>
                            {isBest && (
                              <View style={{ backgroundColor: '#10b981', borderRadius: 8, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, marginTop: 4, marginBottom: 2 }}>
                                <Text style={{ color: '#fff', fontFamily: 'Montserrat-SemiBold', fontSize: 11 }}>Best Deal</Text>
                              </View>
                            )}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                              <Text style={{ fontFamily: 'Montserrat', fontSize: 13, color: '#64748b' }}>Rate: {comp.rate.toFixed(3)}</Text>
                              <Text style={{ fontFamily: 'Montserrat', fontSize: 13, color: '#64748b', marginLeft: 12 }}>Fee: {comp.fee === 0 ? 'FREE' : `$${comp.fee.toFixed(2)}`}</Text>
                            </View>
                          </View>
                          <View style={{ alignItems: 'flex-end', flexShrink: 1, minWidth: 0 }}>
                            <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 16, color: isBest ? '#10b981' : '#334155', textAlign: 'right' }} numberOfLines={1}>
                              {toCurrencyObj?.symbol || ''}{comp.youGet}
                            </Text>
                            <Text style={{ fontFamily: 'Montserrat', fontSize: 12, color: '#64748b', textAlign: 'right' }}>You Get</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
                </>
              )}
            </Animated.View>
        </View>
        {/* </View> */}
        </ScrollView>
      </View>
        </Animated.View>
      
      
      {/* Premium Currency Selector Dropdown */}
      {showCurrencyModal && (
        <BlurView
          intensity={20}
          tint="light"
          style={styles.currencyDropdownContainer}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={styles.currencyDropdownBackdrop}
            activeOpacity={1}
            onPress={() => setShowCurrencyModal(null)}
            pointerEvents="auto"
          />
          <Animated.View style={[styles.currencyDropdownContent, { backgroundColor: colors.cardBackground, opacity: currencyDropdownOpacity }]} pointerEvents="auto">
            <View style={[styles.currencyDropdownHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.currencyDropdownTitle, { color: colors.text }]}>Select Currency</Text>
              <TouchableOpacity
                onPress={() => setShowCurrencyModal(null)}
                style={[styles.currencyDropdownCloseButton, { backgroundColor: colors.background }]}
              >
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ width: '100%' }} contentContainerStyle={styles.currencyDropdownOptions}>
              {currencyOptions.map(opt => (
                <TouchableOpacity
                  key={opt.code}
                  style={[
                    styles.currencyDropdownOption,
                    { backgroundColor: colors.background },
                    (showCurrencyModal === 'main' && opt.code === localCurrency) ||
                    (showCurrencyModal === 'from' && opt.code === fromCurrency) ||
                    (showCurrencyModal === 'to' && opt.code === toCurrency) ||
                    (showCurrencyModal === 'payment' && opt.code === localCurrency)
                      ? { backgroundColor: colors.lightBlue }
                      : null,
                  ]}
                  onPress={() => {
                    if (showCurrencyModal === 'main') setLocalCurrency(opt.code);
                    if (showCurrencyModal === 'from') setFromCurrency(opt.code);
                    if (showCurrencyModal === 'to') setToCurrency(opt.code);
                    if (showCurrencyModal === 'payment') setLocalCurrency(opt.code);
                    setShowCurrencyModal(null);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.currencyDropdownOptionContent}>
                    <Text style={styles.currencyDropdownOptionFlag}>{opt.flag}</Text>
                    <View style={styles.currencyDropdownOptionTextContainer}>
                      <Text style={[styles.currencyDropdownOptionCode, { color: colors.text }]}>{opt.code}</Text>
                      <Text style={[styles.currencyDropdownOptionCountry, { color: colors.textMuted }]}>{opt.country}</Text>
                    </View>
                    <Text style={[styles.currencyDropdownOptionSymbol, { color: colors.textMuted }]}>{opt.symbol}</Text>
                  </View>
                  {((showCurrencyModal === 'main' && opt.code === localCurrency) ||
                    (showCurrencyModal === 'from' && opt.code === fromCurrency) ||
                    (showCurrencyModal === 'to' && opt.code === toCurrency) ||
                    (showCurrencyModal === 'payment' && opt.code === localCurrency)) && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </BlurView>
      )}

      
      {/* Old modals removed - now using ActionBottomSheet for all actions */}

      {/* Amount Input Modal - REMOVED: Redundant since amount input is now in payment method screen */}

      {/* Card Stack Modal */}
      <Modal
        visible={showDepositModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDepositModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.cardStackModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
        >
          <View style={{ flex: 1 }}>
          <TouchableOpacity 
            style={styles.cardStackModalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowDepositModal(false)} 
          />
          
          {/* Header */}
          <View style={styles.cardStackModalHeader}>
            <TouchableOpacity 
              style={styles.cardStackModalCloseButton}
              onPress={() => setShowDepositModal(false)}
              accessibilityLabel="Close add money modal"
              accessibilityHint="Double tap to close the add money screen"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text 
              style={styles.cardStackModalTitle}
              accessibilityRole="header"
            >
              Add Money
            </Text>
            <View style={styles.cardStackModalSpacer} />
          </View>

          {/* Balance Subtitle */}
          <View style={[styles.balanceSubtitleContainer, { marginTop: 20 }]}>
            <Text style={styles.balanceSubtitleText}>
              Available Balance: {selectedCurrencyObj?.symbol || '$'}{getBalanceForCurrency(localCurrency)}
            </Text>
          </View>

          {/* Card Stack Container */}
          <View style={[
            styles.cardStackModalContainer,
            {
              paddingTop: Platform.OS === 'ios' ? 200 : 180,
              // Keep a constant baseline so cards and icons return to the exact same position
              paddingBottom: Platform.OS === 'ios' ? 20 : 15,
              justifyContent: 'flex-start',
            }
          ]}>
            <TouchableOpacity 
              style={{ 
                flex: 1,
                width: '100%',
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingTop: 30
              }}
              activeOpacity={1}
              onPress={() => {
                setShowCurrencyDropdown(false);
                Keyboard.dismiss(); // Dismiss keyboard when tapping elsewhere
              }}
            >

            
            {/* Amount Input Section */}
            <View style={[styles.paymentAmountSection, { marginTop: 0 }]}>
              
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
                          setCurrencySearchQuery(''); // Clear search when opening dropdown
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
                        validateAmount(text);
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
                    : quotePreview || (selectedCurrencyObj?.code || localCurrency) === 'EUR' || (selectedCurrencyObj?.code || localCurrency) === 'USD'
                    ? `= ${getFxPreviewAmount(quotePreview, selectedCurrencyObj?.code || localCurrency, localAmount)} ${computeStablecoin(selectedCurrencyObj?.code || localCurrency || 'USD')}`
                    : ''}
                </Text>
                
                {/* Amount Error Display */}
                {amountError && (
                  <View style={styles.amountErrorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#ef4444" />
                    <Text style={styles.amountErrorText}>{amountError}</Text>
                  </View>
                )}
                
                {/* Currency Dropdown */}
                {showCurrencyDropdown && (
                  <View style={styles.paymentCurrencyDropdown}>
                    {/* Live Rate Indicator */}
                    <View style={styles.liveRateIndicator}>
                      <View style={styles.liveRateStatus}>
                        {isLoadingRates ? (
                          <>
                            <Ionicons name="refresh" size={12} color="#64748b" />
                            <Text style={styles.liveRateText}>Updating rates...</Text>
                          </>
                        ) : ratesError ? (
                          <>
                            <Ionicons name="warning-outline" size={12} color="#ef4444" />
                            <Text style={[styles.liveRateText, { color: '#ef4444' }]}>Using cached rates</Text>
                          </>
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle-outline" size={12} color="#10b981" />
                            <Text style={styles.liveRateText}>Live rates</Text>
                          </>
                        )}
                      </View>
                    </View>

                    {/* Search Input */}
                    <View style={styles.currencySearchContainer}>
                      <Ionicons name="search" size={16} color="rgba(255,255,255,0.6)" />
                                              <TextInput
                          style={styles.currencySearchInput}
                          placeholder="Search currencies..."
                          placeholderTextColor="rgba(255,255,255,0.6)"
                          value={currencySearchQuery}
                          onChangeText={setCurrencySearchQuery}
                          autoFocus={false}
                          accessibilityLabel="Search currencies"
                          accessibilityHint="Type to search for currencies by code, country, or symbol"
                          accessibilityRole="search"
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
                    
                    <ScrollView 
                      style={styles.paymentCurrencyDropdownScroll}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}
                    >
                      {filteredCurrencies.map(opt => (
                        <TouchableOpacity
                          key={opt.code}
                          style={[
                            styles.paymentCurrencyOption,
                            opt.code === localCurrency && styles.paymentCurrencyOptionActive
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setLocalCurrency(opt.code);
                            setShowCurrencyDropdown(false);
                            setCurrencySearchQuery(''); // Clear search when currency is selected
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.currencyOptionLeft}>
                            <Text style={styles.paymentCurrencyOptionFlag}>{opt.flag}</Text>
                            <View style={styles.currencyOptionInfo}>
                              <Text style={styles.paymentCurrencyOptionCode}>{opt.code}</Text>
                              <Text style={styles.paymentCurrencyOptionSymbol}>{opt.symbol}</Text>
                            </View>
                          </View>
                          
                          <View style={styles.currencyOptionRight}>
                            {(getCurrentRate(opt.code) || getFallbackRate(opt.code)) && (
                              <Text style={styles.currencyOptionRate}>
                                {getCurrentRate(opt.code) || getFallbackRate(opt.code)}
                              </Text>
                            )}
                            {opt.code === localCurrency && (
                              <Ionicons name="checkmark" size={16} color="#ffffff" />
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              

              

            </View>
            
                        {/* Payment Method Cards */}
            <View style={[
              styles.cardStackWrapper,
              {
                marginTop: 0,
                transform: [{ translateY: -24 }], // Always positioned at the lifted level for unified interface
              }
            ]}>
                {paymentMethods.map((method, index) => {
                  const isTopCard = index === currentCardIndex;
                  const stackIndex = index - currentCardIndex;
                  
                  if (stackIndex < 0 || stackIndex > 2) return null; // Show 3 cards in stack
                  
                  return (
                    <PaymentMethodCard
                      key={method.id}
                      method={method}
                      index={index}
                      currentCardIndex={currentCardIndex}
                      isProcessingPayment={isProcessingPayment}
                      onPreviousCard={handlePreviousCard}
                      onNextCard={handleNextCard}
                      onCardSelect={handlePaymentMethodSelection}
                      stackIndex={stackIndex}
                      isTopCard={isTopCard}
                    />
                  );
                })}
              </View>
            
            {/* Navigation Buttons */}
            <View style={[
              styles.cardStackNavigation,
              // Always positioned at the lifted level for unified interface
              { transform: [{ translateY: -56 }] }
            ]}>
              <TouchableOpacity
                style={[styles.cardStackNavButton]}
                onPress={handlePreviousCard}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              
              <NavigationDots
                paymentMethods={paymentMethods}
                currentCardIndex={currentCardIndex}
                onCardSelect={goToCard}
              />
              
              <TouchableOpacity
                style={[styles.cardStackNavButton]}
                onPress={handleNextCard}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            

            </TouchableOpacity>
          </View>
        </View>
        
        {/* Loading Overlay */}
        <LoadingOverlay isVisible={isProcessingPayment} />
        
        </KeyboardAvoidingView>
      </Modal>

      {/* Send Modal */}
      <SendModal
        visible={showSendModal}
        onClose={() => setShowSendModal(false)}
        currentCurrency={localCurrency}
        currentBalance={getBalanceForCurrency(localCurrency)}
      />

      {/* Receive Modal */}
      <ReceiveModal
        visible={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        currentCurrency={localCurrency}
        currentBalance={getBalanceForCurrency(localCurrency)}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        visible={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        currentCurrency={localCurrency}
        currentBalance={getBalanceForCurrency(localCurrency)}
      />

      {/* Stripe Payment Modal */}
      <Modal
        visible={showStripePaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStripePaymentModal(false)}
      >
        <View style={styles.stripeModalOverlay}>
          <TouchableOpacity 
            style={styles.stripeModalBackdrop} 
            activeOpacity={1} 
            onPress={() => {
              Keyboard.dismiss();
              setShowStripePaymentModal(false);
            }} 
          />
          
          {/* Clean Header */}
          <View style={styles.stripeModalHeader}>
            <TouchableOpacity 
              style={styles.stripeModalCloseButton}
              onPress={() => setShowStripePaymentModal(false)}
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.stripeModalTitleContainer}>
              <Text style={styles.stripeModalTitle}>Payment</Text>
              <Text style={styles.stripeModalSubtitle}>Secure payment powered by Stripe</Text>
            </View>
            <View style={styles.stripeModalSpacer} />
          </View>

          {/* Payment Form */}
          <TouchableOpacity 
            style={styles.stripeModalContent}
            activeOpacity={1}
            onPress={Keyboard.dismiss}
          >


                            {/* Final Premium Design */}
              <View style={styles.finalFieldsContainer}>
                <Text style={styles.fieldLabel}>Card information</Text>
                
                {/* Card Number Field */}
                <View style={styles.finalFieldContainer}>
                  <View style={styles.finalInputContainer}>
                    <TextInput 
                      placeholder={cardNumber || focusedField === 'cardNumber' ? "" : "•••• •••• •••• ••••"}
                      placeholderTextColor="#ffffff" 
                      style={[
                        styles.finalInput,
                        cardNumberValid === true && styles.finalInputValid,
                        cardNumberValid === false && styles.finalInputInvalid
                      ]}
                      value={showCardNumber ? cardNumber : cardNumber.replace(/\d/g, '•')}
                      onChangeText={(text) => {
                        const formatted = formatCardNumber(text);
                        setCardNumber(formatted);
                        setCardNumberValid(validateCardNumber(formatted));
                        setCardType(detectCardType(formatted));
                      }}
                      onFocus={() => setFocusedField('cardNumber')}
                      onBlur={() => setFocusedField(null)}
                      keyboardType="number-pad"
                      maxLength={19}
                      secureTextEntry={!showCardNumber}
                    />
                    {(cardNumber || focusedField === 'cardNumber') && (
                      <Animated.Text style={styles.finalFloatingLabel}>
                        Card Number
                      </Animated.Text>
                    )}
                    {cardType && (
                      <View style={styles.cardTypeIcon}>
                        {renderCardLogo(cardType)}
                      </View>
                    )}
                    <TouchableOpacity 
                      onPress={() => setShowCardNumber(!showCardNumber)}
                      style={styles.finalToggle}
                    >
                      <Ionicons 
                        name={showCardNumber ? "eye-off" : "eye"} 
                        size={20} 
                        color="#ffffff" 
                      />
                    </TouchableOpacity>
                  </View>
                  {cardNumberValid === false && (
                    <Text style={styles.finalErrorText}>
                      Please enter a valid card number (13-19 digits)
                    </Text>
                  )}
                </View>
                
                {/* Expiry and CVC Row */}
                <View style={styles.finalFieldRow}>
                  {/* Expiry Date Field */}
                  <View style={[styles.finalFieldContainer, styles.finalFieldHalf]}>
                    <View style={styles.finalInputContainer}>
                      <TextInput 
                        placeholder={expiryDate || focusedField === 'expiryDate' ? "" : "MM/YY"}
                        placeholderTextColor="#ffffff" 
                        style={[
                          styles.finalInput,
                          expiryDateValid === true && styles.finalInputValid,
                          expiryDateValid === false && styles.finalInputInvalid
                        ]}
                        value={expiryDate}
                        onChangeText={(text) => {
                          const formatted = formatExpiryDate(text);
                          setExpiryDate(formatted);
                          setExpiryDateValid(validateExpiryDate(formatted));
                        }}
                        onFocus={() => setFocusedField('expiryDate')}
                        onBlur={() => setFocusedField(null)}
                        keyboardType="number-pad"
                        maxLength={5}
                      />
                      {(expiryDate || focusedField === 'expiryDate') && (
                        <Animated.Text style={styles.finalFloatingLabel}>
                          Expiry Date
                        </Animated.Text>
                      )}
                    </View>
                    {expiryDateValid === false && (
                      <Text style={styles.finalErrorText}>
                        Please enter a valid expiry date
                      </Text>
                    )}
                  </View>
                  
                  {/* CVC Field */}
                  <View style={[styles.finalFieldContainer, styles.finalFieldHalf]}>
                    <View style={styles.finalInputContainer}>
                      <TextInput 
                        placeholder={cvv || focusedField === 'cvv' ? "" : "•••"}
                        placeholderTextColor="#ffffff" 
                        style={[
                          styles.finalInput,
                          cvvValid === true && styles.finalInputValid,
                          cvvValid === false && styles.finalInputInvalid
                        ]}
                        value={showCvv ? cvv : cvv.replace(/\d/g, '•')}
                        onChangeText={(text) => {
                          setCvv(text);
                          setCvvValid(validateCVC(text));
                        }}
                        onFocus={() => setFocusedField('cvv')}
                        onBlur={() => setFocusedField(null)}
                        keyboardType="number-pad"
                        maxLength={4}
                        secureTextEntry={!showCvv}
                      />
                      {(cvv || focusedField === 'cvv') && (
                        <Animated.Text style={styles.finalFloatingLabel}>
                          CVC
                        </Animated.Text>
                      )}
                      <TouchableOpacity 
                        onPress={() => setShowCvv(!showCvv)}
                        style={styles.finalToggle}
                      >
                        <Ionicons 
                          name={showCvv ? "eye-off" : "eye"} 
                          size={20} 
                          color="#6b7280" 
                        />
                      </TouchableOpacity>
                    </View>
                    {cvvValid === false && (
                      <Text style={styles.finalErrorText}>
                        Please enter a valid CVC
                      </Text>
                    )}
                  </View>
                </View>
                
                {/* Cardholder Name Field */}
                <View style={styles.finalFieldContainer}>
                  <View style={styles.finalInputContainer}>
                    <TextInput 
                      placeholder={cardHolder || focusedField === 'cardHolder' ? "" : "Full name as it appears on card"}
                      placeholderTextColor="#ffffff" 
                      style={[
                        styles.finalInput,
                        cardholderNameValid === true && styles.finalInputValid,
                        cardholderNameValid === false && styles.finalInputInvalid
                      ]}
                      value={cardHolder}
                      onChangeText={(text) => {
                        setCardHolder(text);
                        setCardholderNameValid(validateCardholderName(text));
                      }}
                      onFocus={() => setFocusedField('cardHolder')}
                      onBlur={() => setFocusedField(null)}
                      autoCapitalize="words"
                    />
                    {(cardHolder || focusedField === 'cardHolder') && (
                      <Animated.Text style={styles.finalFloatingLabel}>
                        Cardholder Name
                      </Animated.Text>
                    )}
                  </View>
                  {cardholderNameValid === false && (
                    <Text style={styles.finalErrorText}>
                      Please enter a valid name (letters only)
                    </Text>
                  )}
                </View>
                

              </View>

              {/* Test Card Buttons (Development Only) */}
              <View style={styles.testCardContainer}>
                <Text style={styles.testCardLabel}>Test Cards:</Text>
                <View style={styles.testCardButtons}>
                  <TouchableOpacity 
                    style={styles.testCardButton}
                    onPress={() => fillTestCardData('success')}
                  >
                    <Text style={styles.testCardButtonText}>Success</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.testCardButton}
                    onPress={() => fillTestCardData('declined')}
                  >
                    <Text style={styles.testCardButtonText}>Declined</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.testCardButton}
                    onPress={() => fillTestCardData('insufficient')}
                  >
                    <Text style={styles.testCardButtonText}>No Funds</Text>
                  </TouchableOpacity>
                </View>
              </View>
              

              {/* Enhanced Pay Button */}
              <TouchableOpacity 
                style={styles.enhancedPayButton}
                onPress={() => {
                  console.log('🔘 Pay button pressed!');
                  console.log('🔍 Card fields status:', {
                    cardNumber: !!cardNumber,
                    expiryDate: !!expiryDate,
                    cvv: !!cvv,
                    cardHolder: !!cardHolder,
                    cardNumberValue: cardNumber,
                    expiryDateValue: expiryDate,
                    cvvValue: cvv,
                    cardHolderValue: cardHolder
                  });
                  handleStripePayment();
                }}
                disabled={!cardNumber || !expiryDate || !cvv || !cardHolder}
              >
                <Text style={styles.enhancedPayButtonText}>Pay ${localAmount}</Text>
                <Ionicons name="lock-closed" size={16} color="#ffffff" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
              
              {/* Test Success Modal Button */}
              <TouchableOpacity
                style={[styles.enhancedPayButton, { backgroundColor: '#10b981', marginTop: 12 }]}
                onPress={() => {
                  console.log('🧪 Testing success modal...');
                  setPaymentSuccessData({
                    amount: '100',
                    currency: 'USD',
                    transactionId: 'test_123',
                    paymentMethod: 'Credit/Debit Card',
                    timestamp: new Date().toISOString(),
                    usdcValue: '100.00',
                    eurcValue: '92.00'
                  });
                  setShowStripePaymentModal(false);
                  setShowPaymentSuccessModal(true);
                  successAnimation.setValue(0);
                  Animated.spring(successAnimation, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 100,
                    friction: 8,
                  }).start();
                }}
              >
                <Text style={styles.enhancedPayButtonText}>Test Success Modal</Text>
              </TouchableOpacity>

              {/* Terms */}
              <Text style={styles.termsText}>
                By continuing, you agree to our Terms of Service and Privacy Policy
              </Text>
            </TouchableOpacity>
        </View>
      </Modal>


      {/* Mobile Money Payment Modal */}
      <Modal
        visible={showMobileMoneyScreen}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMobileMoneyScreen(false)}
      >
        <BlurView intensity={30} tint="dark" style={styles.stripeModalOverlay}>
          <View style={styles.stripeModalBackdrop} />
          <MobileMoneyPaymentScreen
            navigation={navigation}
            onClose={() => setShowMobileMoneyScreen(false)}
            onDepositSuccess={handleDepositSuccess}
            route={{
              params: {
                initialAmount: parseFloat(localAmount),
                initialCurrency: localCurrency,
                initialProvider: 'mtn',
                isDeposit: true
              }
            }}
          />
        </BlurView>
      </Modal>

      {/* PayPal Payment Modal */}
      <Modal
        visible={showPayPalScreen}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPayPalScreen(false)}
      >
        <BlurView intensity={30} tint="dark" style={styles.stripeModalOverlay}>
          <View style={styles.stripeModalBackdrop} />
          <PayPalPaymentScreen
            navigation={navigation}
            onClose={() => setShowPayPalScreen(false)}
            route={{
              params: {
                initialAmount: parseFloat(localAmount),
                initialCurrency: localCurrency,
                isDeposit: true
              }
            }}
          />
        </BlurView>
      </Modal>

      {/* Auto-Conversion Modal */}
      <Modal
        visible={showAutoConversionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAutoConversionModal(false)}
      >
        <View style={styles.autoConversionModalOverlay}>
          <View style={styles.autoConversionModalContainer}>
            {/* Auto-Conversion Animation */}
            <View style={styles.autoConversionAnimationContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.autoConversionTitle, { color: colors.textPrimary }]}>
                Auto-Converting to Stablecoins
              </Text>
              <Text style={[styles.autoConversionSubtitle, { color: colors.textSecondary }]}>
                Converting your deposit to stablecoins...
              </Text>
            </View>

            {/* Conversion Progress */}
            {autoConversionData && (
              <View style={styles.conversionProgressContainer}>
                <Text style={[styles.conversionProgressText, { color: colors.textSecondary }]}>
                  {autoConversionData.success ? 'Conversion Complete!' : 'Conversion Failed'}
                </Text>
                {autoConversionData.success && (
                  <View style={styles.conversionResultContainer}>
                    <Text style={[styles.conversionResultText, { color: colors.textPrimary }]}>
                      {Number(autoConversionData.amount || 0).toFixed(2)} {autoConversionData.currency} → {Number(autoConversionData.amountToMint || 0).toFixed(2)} {autoConversionData.stablecoin}
                    </Text>
                    {autoConversionData.fxInfo && Number.isFinite(autoConversionData.fxInfo.rate) && (
                      <Text style={[styles.conversionFxText, { color: colors.textSecondary }]}>
                        FX Rate: {Number(autoConversionData.fxInfo.rate).toFixed(4)}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Conversion Logs */}
            {conversionLogs.length > 0 && (
              <View style={styles.conversionLogsContainer}>
                <Text style={[styles.conversionLogsTitle, { color: colors.textPrimary }]}>
                  Conversion Process:
                </Text>
                <ScrollView style={styles.conversionLogsScroll} showsVerticalScrollIndicator={false}>
                  {conversionLogs.slice(-5).map((log, index) => (
                    <Text key={index} style={[
                      styles.conversionLogText,
                      { 
                        color: log.type === 'success' ? '#10b981' : 
                               log.type === 'error' ? '#ef4444' : 
                               colors.textSecondary 
                      }
                    ]}>
                      {log.message}
                    </Text>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Payment Success Modal */}
      <Modal
        visible={showPaymentSuccessModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentSuccessModal(false)}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContainer}>
            {/* Success Animation */}
            <View style={styles.successAnimationContainer}>
              <Animated.View style={styles.successCheckmarkContainer}>
                <Animated.View
                  style={{
                    transform: [
                      { scale: successAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1]
                      })}
                    ]
                  }}
                >
                  <Ionicons name="checkmark-circle" size={80} color="#10b981" />
                </Animated.View>
              </Animated.View>
              <Animated.View 
                style={[
                  styles.successRipple,
                  { 
                    transform: [{ 
                      scale: successAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1.2]
                      })
                    }],
                    opacity: successAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 0]
                    })
                  }
                ]}
              />
            </View>

            {/* Success Title */}
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successSubtitle}>Your funds have been converted to stable coins and added to your wallet.</Text>

            {/* Enhanced Amount Added Section */}
            {paymentSuccessData && (
              <View style={styles.enhancedAmountContainer}>
                <View style={styles.amountContent}>
                  <Text style={styles.amountLabel}>Amount Added</Text>
                  <Text style={styles.enhancedAmountValue}>
                    {paymentSuccessData.currency} {paymentSuccessData.amount}
                  </Text>
                </View>
              </View>
            )}

            {/* FX Details Box */}
            <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 12, marginHorizontal: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>FX Details</Text>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      setFxError(''); 
                      setFxLoading(true);
                      const base = selectedCurrencyObj?.code || localCurrency || 'USD';
                      const target = computeTargetSymbol(base);
                      const amt = Number(localAmount) || 0;
                      if (amt <= 0) return;
                      const q = await getFxQuote(base, target, amt);
                      setFxInfo(q);
                    } catch (e) {
                      setFxError(e?.message || String(e));
                    } finally {
                      setFxLoading(false);
                    }
                  }}
                  disabled={fxLoading}
                >
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
                    You will receive ≈ {getFxPreviewAmount(fxInfo, selectedCurrencyObj?.code || localCurrency, localAmount)} {computeStablecoin(selectedCurrencyObj?.code || localCurrency || 'USD')}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                    Updated {new Date(fxInfo.ts).toLocaleTimeString()}
                  </Text>
                </View>
              ) : (
                <Text style={{ color: colors.textMuted, marginTop: 6 }}>FX will be calculated using a live quote.</Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.successActionsContainer}>
              <TouchableOpacity
                style={styles.successPrimaryButton}
                onPress={() => {
                  setShowPaymentSuccessModal(false);
                  // Navigate to activity screen with transaction details
                  if (navigation) {
                    navigation.navigate('Activity', { 
                      showTransactionDetails: true,
                      transactionData: paymentSuccessData 
                    });
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.successPrimaryButtonText}>View Transaction</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.successSecondaryButton}
                onPress={() => {
                  setShowPaymentSuccessModal(false);
                  setShowDepositModal(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.successSecondaryButtonText}>Add More Funds</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.successCloseButton}
                onPress={() => setShowPaymentSuccessModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.successCloseButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Action Bottom Sheet */}
      <ActionBottomSheet
        isVisible={showActionBottomSheet}
        action={currentAction}
        onClose={() => setShowActionBottomSheet(false)}
        navigation={navigation}
        onDepositConfirmed={() => {
          // Handle deposit confirmation - could show a toast or update balance
        }}
        currentCurrency={localCurrency}
      />




      {/* Custom Alert */}
      {showCustomAlert && (
        <BlurView intensity={20} tint="light" style={styles.alertOverlay}>
          <View style={styles.alertBackdrop}>
            <View style={[styles.alertContainer, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.alertHeader}>
                <Ionicons 
                  name={alertType === 'error' ? 'close-circle' : 'information-circle'} 
                  size={24} 
                  color={alertType === 'error' ? colors.error : colors.primary} 
                />
                <Text style={[Typography.h4, styles.alertTitle, { color: colors.textPrimary }]}>
                  {alertTitle}
                </Text>
              </View>
              <Text style={[Typography.bodyRegular, styles.alertMessage, { color: colors.textSecondary }]}>
                {alertMessage}
              </Text>
              <TouchableOpacity 
                style={[styles.alertButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowCustomAlert(false)}
                activeOpacity={0.8}
              >
                <Text style={[Typography.button, { color: colors.textInverse }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      )}

      {/* Transaction Details Modal */}
      {showTransactionDetails && selectedTransaction && (
        <TransactionModal
          visible={showTransactionDetails}
          onClose={handleCloseTransactionDetails}
          transaction={selectedTransaction}
          colors={colors}
        />
      )}
      {/* Send Stablecoin Modal */}
      {showSendStablecoinModal && (
        <BlurView intensity={30} tint="light" style={styles.convertModalOverlay}>
          <TouchableOpacity style={styles.convertModalBackdrop} activeOpacity={1} onPress={() => setShowSendStablecoinModal(false)} />
          <Animated.View style={[styles.glassCardAligned, { opacity: fadeAnim }]}> 
            {/* Subtle gradient overlay for depth */}
            <LinearGradient
              colors={['rgba(255,255,255,0.18)', 'rgba(59,130,246,0.08)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              pointerEvents="none"
            />
            {/* Static diagonal highlight for a 'lit' look */}
            <LinearGradient
              colors={["rgba(255,255,255,0.18)", "rgba(255,255,255,0.04)", "rgba(255,255,255,0.00)"]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.litHighlight}
              pointerEvents="none"
            />
            <TouchableOpacity
              style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}
              onPress={() => setShowSendStablecoinModal(false)}
              accessibilityLabel="Close send modal"
            >
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
            <Text style={[styles.convertModalTitle, { color: '#1e293b', marginBottom: 8 }]}>Send Money</Text>
            <Text style={{ color: '#1e293b', fontSize: 16, textAlign: 'center', marginBottom: 24 }}>
              Do you want to use your available balance in <Text style={{ fontWeight: 'bold' }}>{fromCurrency}</Text> for this transfer, or would you like to auto-convert to stablecoin for a faster and cheaper transaction?
            </Text>
            {/* Premium Buttons */}
            <TouchableOpacity
              style={[
                styles.modalPaymentOption,
                selectedSendOption === 'native' && styles.selectedModalPaymentOption
              ]}
              activeOpacity={0.85}
              onPress={() => setSelectedSendOption('native')}
            >
              <Ionicons name="wallet-outline" size={24} color={selectedSendOption === 'native' ? Colors.primary : Colors.textPrimary} style={styles.paymentIcon} />
              <Text style={styles.modalPaymentOptionText}>Use {fromCurrency} balance</Text>
              {selectedSendOption === 'native' && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} style={styles.selectedIcon} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalPaymentOption,
                selectedSendOption === 'usdc' && styles.selectedModalPaymentOption
              ]}
              activeOpacity={0.85}
              onPress={() => setSelectedSendOption('usdc')}
            >
              <Ionicons name="logo-usd" size={24} color={selectedSendOption === 'usdc' ? Colors.primary : Colors.textPrimary} style={styles.paymentIcon} />
              <Text style={styles.modalPaymentOptionText}>Auto-convert to USDC</Text>
              {selectedSendOption === 'usdc' && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} style={styles.selectedIcon} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalPaymentOption,
                selectedSendOption === 'eurc' && styles.selectedModalPaymentOption
              ]}
              activeOpacity={0.85}
              onPress={() => setSelectedSendOption('eurc')}
            >
              <Ionicons name="logo-euro" size={24} color={selectedSendOption === 'eurc' ? Colors.primary : Colors.textPrimary} style={styles.paymentIcon} />
              <Text style={styles.modalPaymentOptionText}>Auto-convert to EURC</Text>
              {selectedSendOption === 'eurc' && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} style={styles.selectedIcon} />
              )}
            </TouchableOpacity>
            <PrimaryButton
              title="Confirm"
              onPress={() => {
                setShowSendStablecoinModal(false);
                // TODO: Handle confirm action based on selectedSendOption
              }}
              disabled={!selectedSendOption}
              style={[styles.modalActionButton, { backgroundColor: colors.primary }]}
              textStyle={styles.modalActionButtonText}
            />
          </Animated.View>
        </BlurView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  globeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.13,
    zIndex: 0,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    // Remove fixed paddingBottom here
  },
  
  // Premium Header
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  welcomeText: {
    color: Colors.textSecondary,
    marginBottom: 8,
    fontFamily: 'Montserrat',
    fontSize: 14,
    fontWeight: '500',
  },
  userName: {
    color: Colors.textPrimary,
    fontFamily: 'Montserrat',
    fontSize: 24,
    fontWeight: '700',
  },
  headerIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'transparent', // Will be set dynamically
    borderWidth: 1,
    borderColor: 'transparent', // Will be set dynamically
  },
  kycAlertBadge: {
    position: 'absolute',
    right: 4,
    top: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.warning,
    borderWidth: 1,
    borderColor: Colors.background,
  },
  
  // Premium KYC Banner
  kycBanner: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  kycBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  kycBannerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  kycBannerTitle: {
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  kycBannerSubtitle: {
    color: Colors.textSecondary,
  },
  
  // Premium Wallet Card
  walletCard: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  walletCardContent: {
    padding: 24,
  },
  balanceLabel: {
    color: Colors.textInverse,
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceAmount: {
    color: Colors.textInverse,
    marginBottom: 8,
  },
  balanceDetailsText: {
    color: Colors.textInverse,
    opacity: 0.8,
    marginBottom: 20,
  },
  walletCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  addMoneyButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: Colors.textInverse,
    marginLeft: 8,
  },
  withdrawMoneyButton: {
    flex: 1,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.glassBackground,
    borderWidth: 1,
    borderColor: Colors.textInverse,
  },
  outlineButtonText: {
    color: Colors.textInverse,
    marginLeft: 8,
  },
  
  // Premium Send CTA
  primarySendCTA: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  sendCTAGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  primarySendCTAText: {
    color: Colors.textInverse,
    marginLeft: 12,
  },
  
  // Premium Promo Banner
  promoCard: {
    marginBottom: 25,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  promoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  promoCardTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  promoCardTitle: {
    color: Colors.promotionText,
    marginBottom: 2,
  },
  promoCardSubtitle: {
    color: Colors.textSecondary,
  },
  
  // Activity Section
  // activityHeader: {
  //   flexDirection: 'row',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   marginBottom: 16,
  //   marginTop: 8,
  // },
  // activityTitle: {
  //   color: Colors.textPrimary,
  // },
  // viewAllText: {
  //   fontFamily: 'Montserrat',
  //   fontSize: 14,
  //   fontWeight: '600',
  //   color: '#1e40af',
  //   textAlign: 'center',
  //   paddingVertical: 8,
  //   paddingHorizontal: 16,
  //   borderWidth: 1,
  //   borderColor: '#1e40af',
  //   borderRadius: 12,
  //   backgroundColor: '#ffffff',
  //   shadowColor: '#6366f1',
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.06,
  //   shadowRadius: 8,
  //   elevation: 2,
  // },
  // activityList: {
  //   marginTop: 8,
  // },
  

  // activitySeparator: {
  //   height: 0,
  // },
  

  // Calculator Container
  calculatorContainer: {
    width: '100%',
  },
  
  // Currency Calculator Styles
  calculatorCard: {
    // backgroundColor removed to allow inline rgba background for translucency
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent', // Will be set dynamically
  },
  calculatorTitle: {
    fontFamily: 'Montserrat',
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
    alignSelf: 'center',
  },
  calculatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    width: '100%',
  },
  calculationItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'transparent', // Will be set dynamically
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent', // Will be set dynamically
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  calculationDivider: {
    width: 16,
  },
  
  // Rate Status Styles
  rateStatusContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'transparent', // Will be set dynamically
  },
  rateStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rateStatusCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  rateStatusLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rateStatusError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rateStatusSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rateStatusText: {
    fontFamily: 'Montserrat',
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  refreshButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'transparent', // Will be set dynamically
    borderWidth: 1,
    borderColor: 'transparent', // Will be set dynamically
  },
  lastUpdatedText: {
    fontFamily: 'Montserrat',
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'left',
  },
  
  // Competitor Comparison Styles
  competitorContainer: {
    marginTop: 16,
  },
  competitorItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  ourService: {
    borderColor: '#1e40af',
    borderWidth: 2,
    backgroundColor: '#f8fafc',
  },
  competitorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  competitorLogo: {
    fontSize: 20,
    marginRight: 8,
  },
  competitorName: {
    fontFamily: 'Montserrat',
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  ourServiceText: {
    color: '#1e40af',
    fontWeight: '700',
  },
  bestRateBadge: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestRateText: {
    fontFamily: 'Montserrat',
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  competitorDetails: {
    gap: 4,
  },
  competitorDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  competitorDetailLabel: {
    fontFamily: 'Montserrat',
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  competitorDetailValue: {
    fontFamily: 'Montserrat',
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  noFeeText: {
    color: '#059669',
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  

  calculatorLabel: {
    fontFamily: 'Montserrat',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'center',
  },
  calculatorInput: {
    fontFamily: 'Montserrat',
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minWidth: 70,
    height: 48,
    textAlign: 'right',
  },
  calculatorValue: {
    fontFamily: 'Montserrat',
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  calculatorPicker: {
    minWidth: 120,
    height: 36,
    marginRight: 8,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    borderRadius: 8,
    fontSize: 16,
    textAlign: 'left',
    textAlignVertical: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  // Add styles for sendOptionsOverlay, sendOptionsModal, sendOptionsTitle, sendOptionBtn, sendOptionText, sendOptionCancel, sendOptionCancelText
  sendOptionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Much lighter semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  bottomNavOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100, // Height of bottom navigation area
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent overlay for bottom nav
    zIndex: 9, // Below the modal but above other content
  },
  sendOptionsModal: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 16 : 12, // Further reduced to eliminate extra space
    paddingTop: 8,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 15,
    position: 'relative',
    width: '96%',
    maxWidth: 500,
    height: 'auto',
    maxHeight: '90%',
    marginTop: 0,
  },
  modalHeader: {
    width: '100%',
    marginBottom: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 4, // Minimal top padding
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalHeaderLeft: {
    flex: 1,
    marginRight: 16,
  },
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
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginLeft: 4,
    fontSize: 10,
    fontWeight: '500',
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
    marginRight: -8, // Compensate for padding to align with edge
  },

  quickActionsSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  quickActionText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 11,
  },
  optionsSection: {
    marginBottom: 8,
  },
  sendOptionBtn: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 4,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sendOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  sendOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sendOptionTextContainer: {
    flex: 1,
  },
  sendOptionText: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  sendOptionSubtext: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    fontSize: 12,
  },
  popularBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    ...Typography.bodySmall,
    color: Colors.textInverse,
    fontSize: 10,
    fontWeight: '600',
  },
  sendOptionCancel: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.textSecondaryLight,
    alignItems: 'center',
  },
  sendOptionCancelText: {
    ...Typography.bodyLarge,
    color: Colors.textInverse,
    fontWeight: '600',
  },
  limitsSection: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  limitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  limitText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginLeft: 6,
    fontSize: 11,
  },
  // Add styles for currency selector, modal, and exchange button
  currencySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 8,
    minWidth: 120,
    height: 48,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    zIndex: 10,
  },
  currencySelectorFlag: {
    fontSize: 18,
    marginRight: 8,
  },
  currencySelectorText: {
    fontFamily: 'Montserrat',
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  currencySelectorSymbol: {
    fontFamily: 'Montserrat',
    fontSize: 12,
    color: '#64748b',
    fontWeight: '400',
    marginLeft: 4,
  },
  // Premium Currency Dropdown Styles
  currencyDropdownContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    paddingTop: 0,
  },
  currencyDropdownContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 18, // Match sendOptionsModal
    padding: 28,
    minWidth: 260, // Match sendOptionsModal
    alignItems: 'center',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 15,
    position: 'relative',
    width: '85%',
    maxWidth: 320,
    alignSelf: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  currencyDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  currencyDropdownTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  currencyDropdownCloseButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
  },
  currencyDropdownOptions: {
    paddingVertical: 8,
  },
  currencyDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 12,
  },
  currencyDropdownOptionActive: {
    backgroundColor: Colors.primaryLight,
  },
  currencyDropdownOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyDropdownOptionFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  currencyDropdownOptionTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  currencyDropdownOptionCode: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  currencyDropdownOptionCountry: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    fontWeight: '400',
  },
  currencyDropdownOptionSymbol: {
    ...Typography.bodyRegular,
    color: Colors.textMuted,
    fontWeight: '500',
  },

  convertModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  convertModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  convertModalContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    padding: 28,
    minWidth: 260,
    alignItems: 'center', // Center options
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 15,
    position: 'relative',
  },
  convertModalTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 18,
    textAlign: 'center',
  },

  currencyDropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  sendOptionsBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  bottomNavOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 100 : 80,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  // Add styles for deposit modal overlay
  depositModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 2000,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingTop: 48,
    paddingBottom: 100,
  },
  depositModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  depositModalContent: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 15,
    position: 'relative',
    width: '96%',
    maxWidth: 500,
    height: '100%',
  },
  sendModalContent: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 15,
    position: 'relative',
    width: '96%',
    maxWidth: 500,
    height: '100%',
  },
  receiveModalContent: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 15,
    position: 'relative',
    width: '96%',
    maxWidth: 500,
    height: '100%',
  },
  withdrawModalContent: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 15,
    position: 'relative',
    width: '96%',
    maxWidth: 500,
    height: '100%',
  },
  sharedModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  // Custom Alert Styles
  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  alertBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '85%',
    maxWidth: 320,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertTitle: {
    marginLeft: 10,
    fontWeight: '700',
  },
  alertMessage: {
    textAlign: 'center',
    marginBottom: 20,
  },
  alertButton: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },


  balanceCardGradient: {
    borderRadius: 20,
    marginHorizontal: 0,
    marginBottom: 10,
    padding: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
  },
  balanceCardContent: {
    alignItems: 'flex-start',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  secondaryBalancesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryBalanceText: {
    color: '#fff',
    marginRight: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionLabel: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
    zIndex: 1,
  },
  segmentedControlContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(30,64,175,0.18)',
    borderRadius: 24,
    overflow: 'visible',
    alignSelf: 'center',
    marginBottom: 16,
    width: 312,
    height: 48,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  segmentedControlButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    height: 48,
  },
  segmentedControlPillWrapper: {
    position: 'absolute',
    top: 2.5,
    width: 148, // adjusted from 150
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(30,64,175,0.35)',
    zIndex: 1,
    overflow: 'visible',
  },
  segmentedControlPill: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  segmentedControlIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  segmentedControlGradient: {
    flex: 1,
    borderRadius: 20,
  },
  segmentedControlText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#64748b',
    zIndex: 2,
    transitionProperty: 'color, font-size, font-weight, transform',
    transitionDuration: '0.2s',
  },
  segmentedControlTextActive: {
    color: '#fff',
  },
  glassCardAligned: {
    borderRadius: 28,
    padding: 32,
    backgroundColor: 'rgba(255,255,255,0.90)', // More opaque for readability
    borderWidth: 1.5,
    borderColor: 'rgba(59,130,246,0.18)', // Subtle blue border for definition
    shadowColor: '#1e293b', // Darker shadow for separation
    shadowOpacity: 0.10,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 8 },
    elevation: 18,
    overflow: 'hidden',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  litHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    borderRadius: 28,
    opacity: 0.7,
  },
  premiumModalButton: {
    width: '100%',
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#64748b',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  premiumModalButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    width: '100%',
    gap: 8,
  },
  premiumModalButtonText: {
    color: '#1e293b',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.1,
  },
  modalPaymentOption: {
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
    width: '100%',
    justifyContent: 'flex-start',
  },
  paymentIcon: {
    marginRight: 15,
  },
  modalPaymentOptionText: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedModalPaymentOption: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  selectedIcon: {
    marginLeft: 'auto',
  },
  modalActionButton: {
    marginTop: 30,
    borderRadius: 16,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
  },
  modalActionButtonText: {
    ...Typography.button,
  },
  // Deposit Confirmation Modal Styles
  confirmationMessageBox: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 32,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmationMessageTitle: {
    ...Typography.h3,
    color: Colors.success,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationMessageText: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmationMessageButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Card Stack Modal Styles
  cardStackModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 1)', // Fully opaque black background
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardStackModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardStackModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20, // Higher on iOS to avoid status bar
    left: 0,
    right: 0,
    zIndex: 10,
  },
  cardStackModalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardStackModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Montserrat',
  },
  cardStackModalSpacer: {
    width: 40,
  },
  balanceSubtitleContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 108 : 82,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  balanceSubtitleText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Montserrat',
    fontWeight: '500',
  },
  cardStackModalContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 300 : 250, // Increased bottom padding to prevent keyboard overlap
    alignItems: 'center',
    justifyContent: 'flex-start', // Changed to flex-start for better spacing
    paddingTop: Platform.OS === 'ios' ? 160 : 140, // Increased top padding to account for balance subtitle
  },
  cardStackModalSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Montserrat',
    marginBottom: 20,
    textAlign: 'center',
  },
  paymentAmountSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  paymentAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 10,
    marginBottom: 8,
  },
  paymentCurrencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 14, // Better padding
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 120,
    marginBottom: 16, // Better spacing
  },
  paymentCurrencyFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  paymentCurrencyCode: {
    fontSize: 20,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    fontWeight: '700',
    marginRight: 8,
  },
  paymentCurrencyContainer: {
    position: 'relative',
    zIndex: 10,
    marginBottom: 30, // Space for the integrated input
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
    minWidth: 320, // Keep minimum width for amount visibility
  },
  integratedCurrencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    borderRightWidth: 0,
    borderRightColor: 'transparent',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    minWidth: 80, // Fixed width for currency selector
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  integratedCurrencyFlag: {
    fontSize: 18,
    marginRight: 6,
  },
  integratedCurrencyCode: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    fontWeight: '600',
    marginRight: 4,
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
    minWidth: 120, // Ensure minimum width for amount input
    alignSelf: 'center', // Center the amount input
  },
  
  // New centered row styles
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    minWidth: 40,
  },
  currencyFlag: {
    fontSize: 20,
    marginRight: 4,
  },
  currencySymbol: {
    fontSize: 20,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    fontWeight: '700',
    textAlign: 'center',
  },
  amountInput: {
    fontSize: 20,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 100,
    paddingHorizontal: 8,
  },
  
  paymentCurrencyDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 320, // Increased height to accommodate search and live rate indicator
  },
  currencySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  currencySearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    marginLeft: 8,
    paddingVertical: 4,
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  liveRateIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  liveRateStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  liveRateText: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Montserrat',
    fontWeight: '500',
  },
  paymentCurrencyDropdownScroll: {
    maxHeight: 180,
  },
  paymentCurrencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  currencyOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyOptionInfo: {
    marginLeft: 8,
  },
  currencyOptionRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  paymentCurrencyOptionActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  paymentCurrencyOptionFlag: {
    fontSize: 16,
    marginRight: 8,
  },
  paymentCurrencyOptionCode: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    fontWeight: '600',
    flex: 1,
  },
  paymentCurrencyOptionSymbol: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Montserrat',
  },
  currencyOptionRate: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Montserrat',
    fontWeight: '500',
    textAlign: 'right',
    marginBottom: 2,
  },
  paymentAmountLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Montserrat',
    fontWeight: '600',
    marginBottom: 12,
  },
  paymentAmountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16, // Better padding
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 250,
    marginBottom: 20, // Better spacing
  },
  paymentAmountCurrency: {
    fontSize: 18,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    fontWeight: '600',
    marginRight: 8,
  },
  paymentAmountInput: {
    flex: 1,
    fontSize: 32,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 100,
  },
  paymentAmountHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Montserrat',
    marginTop: 16,
    textAlign: 'center',
  },
  paymentAmountPresets: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12, // Better gap between buttons
    marginTop: 12, // Better margin
    marginBottom: 24, // Better spacing before payment cards
    flexWrap: 'wrap',
  },
  presetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  presetButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    fontWeight: '600',
  },
  cardStackWrapper: {
    position: 'relative',
    width: '100%',
    height: 120, // Reduced from 140
    alignItems: 'center',
    marginBottom: 20, // Add space between cards and navigation icons
    marginTop: 0, // No margin needed with centered layout
  },
  cardStackCard: {
    position: 'absolute',
    width: '90%',
    height: 100, // Reduced from 120
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  cardStackCardGradient: {
    flex: 1,
    borderRadius: 20,
    padding: 16, // Reduced from 20
  },
  cardStackCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLeftArrow: {
    width: 40,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardStackCardIcon: {
    width: 48, // Reduced from 56
    height: 48, // Reduced from 56
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16, // Reduced from 20
  },
  cardStackCardInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },

  // REMOVED: Amount Input Modal Styles - no longer needed
  cardStackCardTitle: {
    fontSize: 18, // Reduced from 20
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2, // Reduced from 4
    fontFamily: 'Montserrat',
  },
  cardStackCardDescription: {
    fontSize: 13, // Reduced from 14
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6, // Reduced from 8
    fontFamily: 'Montserrat',
  },
  cardStackCardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardStackCardTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardStackCardTimeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Montserrat',
    fontWeight: '500',
  },
  cardStackCardFee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardStackCardFeeText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Montserrat',
    fontWeight: '600',
  },
  cardStackCardArrow: {
    padding: 4,
  },
  amountErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  amountErrorText: {
    fontSize: 12,
    color: '#ef4444',
    fontFamily: 'Montserrat',
    fontWeight: '500',
    marginLeft: 6,
  },
  cardCenterContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    fontWeight: '600',
    marginTop: 12,
  },
  cardStackInstructions: {
    marginTop: 20,
    alignItems: 'center',
  },
  cardStackInstructionsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  cardStackNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6, // small gap above icons
    paddingHorizontal: 20,
    marginBottom: Platform.OS === 'ios' ? 22 : 18, // keep icons clear of keyboard
  },
  cardStackNavButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardStackNavButtonDisabled: {
    opacity: 0.3,
  },
  cardStackDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardStackDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardStackDotActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderColor: '#ffffff',
    borderWidth: 2,
  },
  
  // Enhanced Stripe Payment Modal Styles
  stripeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stripeModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  // Plaid Modal Styles - Full Screen Layout
  plaidModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  plaidModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  stripeModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '95%',
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  stripeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'transparent',
  },
  stripeModalCloseButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  stripeModalTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginLeft: 16,
  },
  stripeModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Montserrat',
  },
  stripeModalSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    marginTop: 2,
  },
  stripeModalSpacer: {
    width: 40,
  },
  stripeModalContent: {
    padding: 24,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginBottom: 24,
  },
  finalFieldsContainer: {
    marginBottom: 24,
  },
  finalFieldContainer: {
    marginBottom: 20,
  },
  finalFieldHalf: {
    flex: 1,
  },
  finalFloatingLabel: {
    position: 'absolute',
    left: 16,
    top: 10,
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
    fontFamily: 'Montserrat',
    zIndex: 1,
  },
  cardTypeIcon: {
    position: 'absolute',
    right: 60,
    top: '50%',
    transform: [{ translateY: -8 }],
    width: 32,
    height: 20,
    zIndex: 1,
  },
  cardLogoContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Visa Logo
  visaLogo: {
    backgroundColor: '#1a1f71',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  visaText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '700',
    fontFamily: 'Montserrat',
  },
  // Mastercard Logo
  mastercardLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mastercardCircle1: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#eb001b',
    marginRight: 1,
  },
  mastercardCircle2: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f79e1b',
  },
  // American Express Logo
  amexLogo: {
    backgroundColor: '#006fcf',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  amexText: {
    color: '#ffffff',
    fontSize: 6,
    fontWeight: '700',
    fontFamily: 'Montserrat',
  },
  // Discover Logo
  discoverLogo: {
    backgroundColor: '#ff6000',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  discoverText: {
    color: '#ffffff',
    fontSize: 5,
    fontWeight: '700',
    fontFamily: 'Montserrat',
  },
  // JCB Logo
  jcbLogo: {
    backgroundColor: '#0b4ea2',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  jcbText: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: '700',
    fontFamily: 'Montserrat',
  },
  // UnionPay Logo
  unionPayLogo: {
    backgroundColor: '#e60012',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  unionPayText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '700',
    fontFamily: 'Montserrat',
  },
  // Diners Club Logo
  dinersLogo: {
    backgroundColor: '#0079be',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  dinersText: {
    color: '#ffffff',
    fontSize: 5,
    fontWeight: '700',
    fontFamily: 'Montserrat',
  },
  finalToggle: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: 6,
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
  },
  finalInputContainer: {
    position: 'relative',
  },
  finalInput: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 16,
    padding: 20,
    paddingTop: 24,
    fontSize: 18,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    fontWeight: '500',
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  finalInputValid: {
    borderColor: 'rgba(34,197,94,0.8)',
    backgroundColor: 'rgba(34,197,94,0.2)',
    shadowColor: 'rgba(34,197,94,0.3)',
    shadowOpacity: 0.2,
  },
  finalInputInvalid: {
    borderColor: 'rgba(239,68,68,0.8)',
    backgroundColor: 'rgba(239,68,68,0.2)',
    shadowColor: 'rgba(239,68,68,0.3)',
    shadowOpacity: 0.2,
  },
  finalErrorText: {
    fontSize: 13,
    color: '#fca5a5',
    fontFamily: 'Montserrat',
    fontWeight: '500',
    marginTop: 6,
    marginLeft: 4,
  },
  finalFieldRow: {
    flexDirection: 'row',
    gap: 16,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    fontFamily: 'Montserrat',
  },
  enhancedCardField: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  enhancedTextInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 12,
    fontFamily: 'Montserrat',
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  securityText: {
    fontSize: 14,
    color: '#166534',
    marginLeft: 8,
    fontFamily: 'Montserrat',
  },
  enhancedPayButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  enhancedPayButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat',
  },
  testCardContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  testCardLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
    fontFamily: 'Montserrat',
    fontWeight: '500',
  },
  testCardButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  testCardButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  testCardButtonText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontFamily: 'Montserrat',
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'Montserrat',
    lineHeight: 16,
  },

  // Auto-Conversion Modal Styles
  autoConversionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  autoConversionModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    width: width - 40,
    maxHeight: height * 0.7,
    alignItems: 'center',
  },
  autoConversionAnimationContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  autoConversionTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Montserrat',
  },
  autoConversionSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  conversionProgressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  conversionProgressText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Montserrat',
  },
  conversionResultContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  conversionResultText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Montserrat',
  },
  conversionFxText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  conversionLogsContainer: {
    width: '100%',
    marginTop: 16,
  },
  conversionLogsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Montserrat',
  },
  conversionLogsScroll: {
    maxHeight: 120,
  },
  conversionLogText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  testButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat',
  },

  // Payment Success Modal Styles
  successModalOverlay: {
    flex: 1,
    backgroundColor: '#000000',
  },

  successModalContainer: {
    backgroundColor: '#000000',
    flex: 1,
    width: '100%',
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successAnimationContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  successCheckmarkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successRipple: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Montserrat',
  },
  successSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'Montserrat',
  },
  successDetailsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  successDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  successDetailLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Montserrat',
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  successDetailValue: {
    fontSize: 15,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    fontWeight: '700',
    textAlign: 'right',
  },
  successDetailAmount: {
    fontSize: 18,
    color: '#10b981',
    fontFamily: 'Montserrat',
    fontWeight: '800',
    textAlign: 'right',
  },
  enhancedAmountContainer: {
    width: '100%',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  amountIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  amountContent: {
    flex: 1,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Montserrat',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  enhancedAmountValue: {
    fontSize: 28,
    color: '#10b981',
    fontFamily: 'Montserrat',
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  successActionsContainer: {
    width: '100%',
    gap: 12,
  },
  successPrimaryButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  successPrimaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat',
  },
  successSecondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  successSecondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat',
  },
  successCloseButton: {
    padding: 16,
    alignItems: 'center',
  },
  successCloseButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Montserrat',
  },
  testButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat',
  },
});

export default HomeScreen;

