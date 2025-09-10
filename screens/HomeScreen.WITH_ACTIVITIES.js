// sendnreceive-app/screens/HomeScreen.js
import React, { useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
  UIManager,
  LayoutAnimation,
  TextInput,
  Image,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { AuthContext } from '../contexts/AuthContext';
import { TransactionContext } from '../contexts/TransactionContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { Picker } from '@react-native-picker/picker';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

// Import Premium Components
import BalanceCard from '../components/BalanceCard';
import QuickActionsGrid from '../components/QuickActionsGrid';
import TransactionHistory from '../components/TransactionHistory';
import DepositScreen from './DepositScreen';
import WithdrawScreen from './WithdrawScreen';
import GlobeBackground from '../components/GlobeBackground';
import TransactionModal from '../components/TransactionModal';

const { width } = Dimensions.get('window');

const formatCurrency = (amount, currencyCode = 'USD') => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: currencyCode, 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(amount);
};

// Add this function at the top of the file or above its first usage
const groupTransactionsByDate = (transactions) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Assuming Sunday is start of week
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const groups = {
    Today: [],
    Yesterday: [],
    'This Week': [], // Transactions from Sunday to today, excluding today and yesterday
    'This Month': [], // Transactions this month, excluding this week
    'Older': [] // Transactions older than this month
  };

  transactions.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort newest first

  transactions.forEach(tx => {
    const txDate = new Date(tx.date);
    if (txDate.toDateString() === today.toDateString()) {
      groups.Today.push(tx);
    } else if (txDate.toDateString() === yesterday.toDateString()) {
      groups.Yesterday.push(tx);
    } else if (txDate >= startOfWeek) {
      groups['This Week'].push(tx);
    } else if (txDate >= startOfMonth) {
      groups['This Month'].push(tx);
    } else {
      groups.Older.push(tx);
    }
  });
  return groups;
};

const HomeScreen = () => {
  const { user, updateUserKycStatus } = useContext(AuthContext);
  const { transactions, fetchTransactionHistory, isLoadingTransactions } = useContext(TransactionContext);
  const navigation = useNavigation();
  const { colors = Colors } = useTheme();
  console.log('colors in HomeScreen.WITH_ACTIVITIES:', colors);
  const [localCurrency, setLocalCurrency] = useState('GHS');
  const [localAmount, setLocalAmount] = useState('');
  
  // Custom alert states
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');
  const [alertTitle, setAlertTitle] = useState('');
  
  // Transaction details modal
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const transactionModalOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(0)).current;
  
  // Remove selectedCurrency state, use selectedCurrencyObj instead
  const currencyOptions = [
    { code: 'GHS', symbol: '₵', rateToUSDC: 0.083, rateToEURC: 0.071, country: 'Ghana', flag: '🇬🇭' },
    { code: 'USD', symbol: '$', rateToUSDC: 1, rateToEURC: 0.92, country: 'United States', flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', rateToUSDC: 1.08, rateToEURC: 1, country: 'European Union', flag: '🇪🇺' },
    { code: 'AED', symbol: 'د.إ', rateToUSDC: 0.27, rateToEURC: 0.25, country: 'United Arab Emirates', flag: '🇦🇪' },
    { code: 'NGN', symbol: '₦', rateToUSDC: 0.0012, rateToEURC: 0.0011, country: 'Nigeria', flag: '🇳🇬' },
  ];
  const selectedCurrencyObj = currencyOptions.find(c => c.code === localCurrency);
  const usdcValue = localAmount && !isNaN(Number(localAmount)) && selectedCurrencyObj ? (Number(localAmount) * selectedCurrencyObj.rateToUSDC).toFixed(2) : '';
  const eurcValue = localAmount && !isNaN(Number(localAmount)) && selectedCurrencyObj ? (Number(localAmount) * selectedCurrencyObj.rateToEURC).toFixed(2) : '';

  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchTransactionHistory();
    if (Platform.OS === 'android') {
      if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    }
  }, [fetchTransactionHistory]);

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

  // Clear input when currency changes for better UX
  useEffect(() => {
    setLocalAmount('');
  }, [localCurrency]);

  const showAlert = (title, message, type = 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setShowCustomAlert(true);
  };

  const handleTransactionPress = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
    // Fade in animation
    Animated.timing(transactionModalOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCloseTransactionDetails = () => {
    // Fade out animation
    Animated.timing(transactionModalOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowTransactionDetails(false);
      setSelectedTransaction(null);
    });
  };

  const mockBalance = {
    main: 1250.75,
    mainCurrency: 'USD',
    secondaryBalances: [
      { amount: 980.50, currency: 'EUR' },
      { amount: 150000.00, currency: 'GHS' }
    ]
  };

  const kycAlertNeeded = user?.kycStatus !== 'verified';

  const handleActionPress = (action) => {
    Haptics.selectionAsync();
    switch (action.id) {
      case 'send':
        setShowSendOptions(true);
        break;
      case 'receive':
        setShowReceiveOptions(true);
        break;
      case 'deposit':
        setShowDepositConfirmation(false);
        setShowDepositModal(true);
        break;
      case 'withdraw':
        setShowWithdrawModal(true);
        break;
      default:
        break;
    }
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
      default:
        break;
    }
  };

  // Add state and logic for fade-in send options modal
  const [showSendOptions, setShowSendOptions] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const convertModalOpacity = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const amountInputRef = useRef(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  // 1. Add showReceiveOptions state:
  const [showReceiveOptions, setShowReceiveOptions] = useState(false);
  // 1. Add state for activity section expansion:
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [showDepositConfirmation, setShowDepositConfirmation] = useState(false); // NEW

  const openConvertModal = () => {
    setShowConvertModal(true);
    Animated.timing(convertModalOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };
  const closeConvertModal = () => {
    Animated.timing(convertModalOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowConvertModal(false));
  };

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

  // Confirmation popup/modal for deposit
  const handleDepositConfirmed = () => {
    setShowDepositConfirmation(true);
  };

  // Add state for filter, filterMenuVisible, tempFilter, etc. (copy from TransactionHistoryScreen)
  const [filter, setFilter] = useState({ 
    types: ['all'], 
    dateRange: 'all',
    amountRange: 'all',
    status: 'all',
    search: ''
  });
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [tempFilter, setTempFilter] = useState({ 
    types: ['all'], 
    dateRange: 'all',
    amountRange: 'all',
    status: 'all',
    search: ''
  });

  // Add groupedTransactions logic (copy from TransactionHistoryScreen, but use real transactions if available)
  const groupedTransactions = useMemo(() => {
    let transactionsToDisplay = transactions;
    // ... apply filters as in TransactionHistoryScreen ...
    return groupTransactionsByDate(transactionsToDisplay);
  }, [transactions, filter]);

  // Add filter menu handlers (handleFilterPress, handleFilterSelect, etc.)
  const handleFilterPress = (filterType) => {
    setFilterMenuVisible(!filterMenuVisible);
    setTempFilter(prevFilter => ({ ...prevFilter, [filterType]: !prevFilter[filterType] }));
  };

  const handleFilterSelect = (filterType, value) => {
    setFilter(prevFilter => ({ ...prevFilter, [filterType]: value }));
    setFilterMenuVisible(false);
  };

  const renderTransactionItem = ({ item }) => {
    let statusColor = Colors.textMuted;
    if (item.status === 'Pending') statusColor = Colors.warning;
    else if (item.status === 'Completed') statusColor = Colors.success;
    else if (item.status === 'Failed') statusColor = Colors.error;

    return (
      <TouchableOpacity
        style={styles.transactionCard}
        onPress={() => handleTransactionPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.transactionItemIcon}>
          {item.type === 'received' && <MaterialIcons name="arrow-downward" size={20} color={Colors.success} />}
          {item.type === 'sent' && <MaterialIcons name="arrow-upward" size={20} color={Colors.error} />}
          {item.type === 'deposit' && <MaterialCommunityIcons name="wallet-plus-outline" size={20} color={Colors.primary} />}
          {item.type === 'withdrawal' && <MaterialCommunityIcons name="wallet-minus-outline" size={20} color={Colors.warning} />}
          {item.type === 'pay_in_store' && <MaterialCommunityIcons name="storefront-outline" size={20} color={Colors.accent} />}
        </View>
        <View style={styles.transactionItemDetails}>
          <Text style={styles.transactionItemTitle} numberOfLines={1}>
            {item.type === 'received' ? `Received from ${item.recipientName || 'Unknown'}` :
             item.type === 'sent' ? `Sent to ${item.recipientName || 'Unknown'}` :
             item.type === 'deposit' ? 'Deposit to Wallet' :
             item.type === 'withdrawal' ? 'Withdrawal from Wallet' :
             item.type === 'pay_in_store' ? `Paid at ${item.recipientName || 'Merchant'}` : 'Transaction'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Text style={styles.transactionItemDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            {item.status && (
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}> 
                <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
              </View>
            )}
          </View>
        </View>
        <Text
          style={[
            styles.transactionItemAmount,
            { color:
                item.type === 'received' ? Colors.success :
                item.type === 'sent' ? Colors.error :
                item.type === 'deposit' ? Colors.primary :
                item.type === 'withdrawal' ? Colors.warning :
                item.type === 'pay_in_store' ? Colors.accent :
                Colors.textPrimary
            }
          ]}
        >
          {(item.type === 'received' || item.type === 'deposit') ? '+' : '-'}
          {formatCurrency(item.sourceAmount, item.sourceCurrency)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <Animated.View style={{ flex: 1, opacity: screenOpacity }}>
        {/* Subtle background pattern */}
        <View style={[styles.backgroundPattern, { backgroundColor: '#f8fafc' }]} pointerEvents="none" />
      {/* Globe background image */}
        <GlobeBackground />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContentContainer,
            { paddingBottom: Platform.OS === 'ios' ? 110 : 100 }, // Account for premium tab bar
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <View style={{opacity: 0.88}}>
          {/* Premium Header */}
          <View style={styles.headerContainer}>
            <View>
              <Text style={[Typography.bodySmall, styles.welcomeText, { color: colors.text } ]}>Welcome Back,</Text>
              <Text style={[Typography.h1, styles.userName, { color: colors.text } ]}>{user?.fullName ?? 'User'}!</Text>
            </View>
            <View style={styles.headerIconsContainer}>
              <TouchableOpacity 
                style={styles.headerIcon} 
                onPress={() => handleHeaderIconPress('credit-cards')}
                activeOpacity={0.7}
              >
                <Ionicons name="card-outline" size={24} color={colors.icon || colors.text} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerIcon} 
                onPress={() => handleHeaderIconPress('education')}
                activeOpacity={0.7}
              >
                <Ionicons name="school-outline" size={24} color={colors.icon || colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Balance Card - now at the very top */}
          <BalanceCard 
            balances={[
              { currency: 'USD', amount: 1250.75, symbol: '$', color: Colors.primary },
              { currency: 'EUR', amount: 980.50, symbol: '€', color: Colors.accent },
              { currency: 'GHS', amount: 150000.00, symbol: '₵', color: Colors.success },
              { currency: 'AED', amount: 3200.00, symbol: 'د.إ', color: Colors.info }, // Dirham
              { currency: 'NGN', amount: 250000.00, symbol: '₦', color: Colors.success }, // Naira
            ]}
            onCurrencyChange={(currencyObj) => setLocalCurrency(currencyObj.currency)}
            onActionPress={handleActionPress}
             usdcBalance={"$1,250.75"}
             eurcBalance={"€980.50"}
          />
          {/* Add extra spacing to separate dots from calculator */}
          <View style={{ height: 32 }} />
          {/* Currency Calculator - Compact Premium Card */}
          <View style={[styles.calculatorCard, { backgroundColor: '#f8fafc' }]}>
            {/* {console.log('Calculator card rendered')} */}
            <Text style={[styles.calculatorTitle, { color: '#1e293b' }]}>Currency Calculator</Text>
            <View style={styles.calculatorRow}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.calculatorLabel, { color: '#64748b', textAlign: 'center' }]}>Currency</Text>
                  <TouchableOpacity
                    style={[styles.currencySelectorRow, { width: '100%', backgroundColor: '#ffffff', borderColor: '#e5e7eb' }]}
                    onPress={() => { 
                      // console.log('Currency selector pressed - opening modal');
                      setShowCurrencyModal(true); 
                    }}
                    activeOpacity={0.8}
                    accessibilityLabel="Select currency"
                  >
                    <Text style={styles.currencySelectorFlag}>{selectedCurrencyObj?.flag || ''}</Text>
                    <Text style={[styles.currencySelectorText, { color: '#1e293b' }]}>{localCurrency}</Text>
                    <Text style={[styles.currencySelectorSymbol, { color: '#64748b' }]}>{selectedCurrencyObj?.symbol || ''}</Text>
                    <Ionicons name="chevron-down" size={18} color="#64748b" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.calculatorLabel, { color: '#64748b', textAlign: 'center' }]}>Amount</Text>
                  <TextInput
                    ref={amountInputRef}
                    style={[styles.calculatorInput, { width: '100%', backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#1e293b' }]}
                    placeholder={`0.00 ${selectedCurrencyObj?.symbol || ''}`}
                    placeholderTextColor="#64748b"
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
            <View style={styles.calculatorRow}>
              <View style={styles.calculationItem}>
                <Text style={[styles.calculatorLabel, { color: '#64748b' }]}>USDC</Text>
                <Text style={[styles.calculatorValue, { color: '#1e293b' }]}>{usdcValue ? `$${usdcValue}` : '--'}</Text>
              </View>
              <View style={styles.calculationDivider} />
              <View style={styles.calculationItem}>
                <Text style={[styles.calculatorLabel, { color: '#64748b' }]}>EURC</Text>
                <Text style={[styles.calculatorValue, { color: '#1e293b' }]}>{eurcValue ? `€${eurcValue}` : '--'}</Text>
              </View>
            </View>
            {/* Centered Convert button in the middle of the calculator card */}
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 12 }}>
              <TouchableOpacity
                style={[styles.exchangeButton, { backgroundColor: '#ffffff', borderColor: '#e5e7eb' }]}
                onPress={openConvertModal}
                activeOpacity={0.8}
              >
                <View style={styles.exchangeButtonContent}>
                  <Ionicons name="swap-horizontal" size={20} color="#1e40af" />
                  <Text style={[styles.exchangeButtonText, { color: '#1e40af' }]}>Convert</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ height: 16 }} />
          {/* Activity Section */}
          <View style={[styles.activityHeader, { justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }]}>
            <TouchableOpacity onPress={() => setActivityExpanded((prev) => !prev)} activeOpacity={0.7}>
              <Text style={styles.viewAllText}>{activityExpanded ? 'Hide Recent Activities' : 'Show Recent Activities'}</Text>
            </TouchableOpacity>
          </View>
          {activityExpanded && (
            <FlatList
              data={transactions}
              renderItem={renderTransactionItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.activityList}
              ListEmptyComponent={
                <View style={styles.noActivityContainer}>
                  <Text style={styles.noActivityText}>No recent activity</Text>
                  <Text style={styles.noActivitySubtext}>You haven't made any transactions yet.</Text>
                </View>
              }
              ListFooterComponent={<View style={styles.activitySeparator} />}
              ListHeaderComponent={<View style={styles.activitySeparator} />}
              ItemSeparatorComponent={() => <View style={styles.activitySeparator} />}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
        </Animated.View>
      
      
      {/* Premium Currency Selector Dropdown */}
      {showCurrencyModal && (
        <BlurView
          intensity={20}
          tint="light"
          style={styles.currencyDropdownContainer}
        >
          <TouchableOpacity
            style={styles.currencyDropdownBackdrop}
            activeOpacity={1}
            onPress={() => {
              // console.log('Currency dropdown backdrop pressed - closing');
              setShowCurrencyModal(false);
            }}
          />
          <View style={[styles.currencyDropdownContent, { backgroundColor: colors.cardBackground }]} pointerEvents="box-none">
            <View style={[styles.currencyDropdownHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.currencyDropdownTitle, { color: colors.text }]}>Select Currency</Text>
              <TouchableOpacity
                onPress={() => {
                  // console.log('Currency dropdown close button pressed');
                  setShowCurrencyModal(false);
                }}
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
                    opt.code === localCurrency && { backgroundColor: colors.lightBlue },
                  ]}
                  onPress={() => {
                    // console.log('Currency option selected:', opt.code);
                    setLocalCurrency(opt.code);
                    setShowCurrencyModal(false);
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
                  {opt.code === localCurrency && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </BlurView>
      )}
      {showSendOptions && (
        <View style={styles.sendOptionsOverlay}>
          <TouchableOpacity
            style={styles.sendOptionsBackdrop}
            activeOpacity={1}
            onPress={() => setShowSendOptions(false)}
          />
          {/* Semi-transparent overlay for bottom navigation */}
          <View style={styles.bottomNavOverlay} />
          <View style={[styles.sendOptionsModal, { backgroundColor: colors.cardBackground }]}>
            {/* Enhanced Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <View style={styles.modalHeaderLeft}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Send Money</Text>
                  {/* Compact limits info in header */}
                  <View style={styles.headerLimitsInfo}>
                    <View style={styles.headerLimitItem}>
                      <Ionicons name="information-circle-outline" size={12} color={colors.textMuted} />
                      <Text style={[styles.headerLimitText, { color: colors.textMuted }]}>Daily: ₵10,000</Text>
                    </View>
                    <View style={styles.headerLimitItem}>
                      <Ionicons name="shield-checkmark-outline" size={12} color={colors.success} />
                      <Text style={[styles.headerLimitText, { color: colors.textMuted }]}>Secure</Text>
                    </View>
                  </View>
                </View>
              <TouchableOpacity
                onPress={() => setShowSendOptions(false)}
                  style={styles.closeButton}
                accessibilityLabel="Close send options"
              >
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
                </View>
            </View>

            {/* Quick Actions Section */}
            <View style={styles.quickActionsSection}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity 
                  style={[styles.quickActionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => { navigation.navigate('QuickSendModal'); }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="star" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.quickActionText, { color: colors.text }]}>Quick Send</Text>
              </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.quickActionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => { navigation.navigate('SendFlowModal'); }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.accent + '20' }]}>
                    <Ionicons name="time" size={20} color={colors.accent} />
                </View>
                  <Text style={[styles.quickActionText, { color: colors.text }]}>Recent</Text>
              </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.quickActionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => { showAlert('Add Contact', 'Add new contact feature coming soon!', 'info'); }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.success + '20' }]}>
                    <Ionicons name="add" size={20} color={colors.success} />
                </View>
                  <Text style={[styles.quickActionText, { color: colors.text }]}>New Contact</Text>
              </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.quickActionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => { navigation.navigate('PayInStore'); }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.warning + '20' }]}>
                    <Ionicons name="qr-code" size={20} color={colors.warning} />
                </View>
                  <Text style={[styles.quickActionText, { color: colors.text }]}>Scan QR</Text>
              </TouchableOpacity>
              </View>
            </View>



            {/* Main Send Options */}
            <View style={styles.optionsSection}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Send Options</Text>
              
              {/* Primary Options */}
              <TouchableOpacity 
                style={[styles.sendOptionBtn, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => { navigation.navigate('SendFlowModal'); }}
              >
                <View style={styles.sendOptionContent}>
                  <View style={[styles.sendOptionIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="person-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.sendOptionTextContainer}>
                    <Text style={[styles.sendOptionText, { color: colors.text }]}>Send to User</Text>
                    <Text style={[styles.sendOptionSubtext, { color: colors.textMuted }]}>Send to any user or contact</Text>
                  </View>
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.sendOptionBtn, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => { showAlert('Mobile Money', 'Mobile money transfer feature coming soon!', 'info'); }}
              >
                <View style={styles.sendOptionContent}>
                  <View style={[styles.sendOptionIcon, { backgroundColor: colors.success + '20' }]}>
                    <Ionicons name="phone-portrait-outline" size={22} color={colors.success} />
                  </View>
                  <View style={styles.sendOptionTextContainer}>
                    <Text style={[styles.sendOptionText, { color: colors.text }]}>Mobile Money</Text>
                    <Text style={[styles.sendOptionSubtext, { color: colors.textMuted }]}>Send to mobile money wallets</Text>
                  </View>
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.sendOptionBtn, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => { navigation.navigate('PayInStore'); }}
              >
                <View style={styles.sendOptionContent}>
                  <View style={[styles.sendOptionIcon, { backgroundColor: colors.accent + '20' }]}>
                    <Ionicons name="qr-code-outline" size={22} color={colors.accent} />
                  </View>
                  <View style={styles.sendOptionTextContainer}>
                  <Text style={[styles.sendOptionText, { color: colors.text }]}>Pay in Store</Text>
                    <Text style={[styles.sendOptionSubtext, { color: colors.textMuted }]}>Scan QR code to pay</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Secondary Options */}
              <TouchableOpacity 
                style={[styles.sendOptionBtn, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => { showAlert('Bank Transfer', 'Bank transfer feature coming soon!', 'info'); }}
              >
                <View style={styles.sendOptionContent}>
                  <View style={[styles.sendOptionIcon, { backgroundColor: colors.info + '20' }]}>
                    <Ionicons name="business-outline" size={22} color={colors.info} />
          </View>
                  <View style={styles.sendOptionTextContainer}>
                    <Text style={[styles.sendOptionText, { color: colors.text }]}>Bank Transfer</Text>
                    <Text style={[styles.sendOptionSubtext, { color: colors.textMuted }]}>Send to bank accounts</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.sendOptionBtn, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => { showAlert('Crypto Transfer', 'Crypto transfer feature coming soon!', 'info'); }}
              >
                <View style={styles.sendOptionContent}>
                  <View style={[styles.sendOptionIcon, { backgroundColor: colors.warning + '20' }]}>
                    <Ionicons name="wallet-outline" size={22} color={colors.warning} />
                  </View>
                  <View style={styles.sendOptionTextContainer}>
                    <Text style={[styles.sendOptionText, { color: colors.text }]}>Crypto Transfer</Text>
                    <Text style={[styles.sendOptionSubtext, { color: colors.textMuted }]}>Send USDC, EURC, or SOL</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.sendOptionBtn, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => { showAlert('Bill Payment', 'Bill payment feature coming soon!', 'info'); }}
              >
                <View style={styles.sendOptionContent}>
                  <View style={[styles.sendOptionIcon, { backgroundColor: colors.error + '20' }]}>
                    <Ionicons name="receipt-outline" size={22} color={colors.error} />
                  </View>
                  <View style={styles.sendOptionTextContainer}>
                    <Text style={[styles.sendOptionText, { color: colors.text }]}>Pay Bills</Text>
                    <Text style={[styles.sendOptionSubtext, { color: colors.textMuted }]}>Pay utilities and services</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {/* Convert Modal */}
      {showConvertModal && (
        <Animated.View style={[styles.convertModalOverlay, { opacity: convertModalOpacity }]}
          pointerEvents={showConvertModal ? 'auto' : 'none'}
        >
          <TouchableOpacity style={styles.convertModalBackdrop} activeOpacity={1} onPress={closeConvertModal} />
          <View style={[styles.convertModalContent, { backgroundColor: colors.cardBackground }]}>
            <TouchableOpacity
              style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}
              onPress={closeConvertModal}
              accessibilityLabel="Close convert modal"
            >
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
            <Text style={[styles.convertModalTitle, { color: colors.text }]}>Convert To</Text>
            <TouchableOpacity style={[styles.convertModalOption, { backgroundColor: colors.background }]} activeOpacity={0.7}>
              <Ionicons name="logo-usd" size={22} color={colors.primary} style={{ marginRight: 10 }} />
              <Text style={[styles.convertModalOptionText, { color: colors.text }]}>USDC</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.convertModalOption, { backgroundColor: colors.background }]} activeOpacity={0.7}>
              <Ionicons name="logo-euro" size={22} color={colors.primary} style={{ marginRight: 10 }} />
              <Text style={[styles.convertModalOptionText, { color: colors.text }]}>EURC</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.convertModalOption, { backgroundColor: colors.background }]} activeOpacity={0.7}>
              <Ionicons name="logo-bitcoin" size={22} color={colors.primary} style={{ marginRight: 10 }} />
              <Text style={[styles.convertModalOptionText, { color: colors.text }]}>$SOL</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
      {/* Deposit Modal Popup - ensure this is rendered last for correct stacking */}
      {showDepositModal && (
        <BlurView intensity={20} tint="light" style={styles.depositModalOverlay}>
          <TouchableOpacity style={styles.depositModalBackdrop} activeOpacity={1} onPress={() => setShowDepositModal(false)} />
          <View style={styles.depositModalContent} pointerEvents="box-none">
            <DepositScreen 
              navigation={{...navigation, goBack: () => setShowDepositModal(false)}} 
              isModal 
              onClose={() => setShowDepositModal(false)}
              onDepositConfirmed={handleDepositConfirmed}
            />
          </View>
        </BlurView>
      )}
      {/* Deposit Confirmation Popup */}
      {showDepositConfirmation && (
        <BlurView intensity={20} tint="light" style={styles.depositModalOverlay}>
          <View style={styles.confirmationMessageBox}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} style={{ marginBottom: 12 }} />
            <Text style={[styles.confirmationMessageTitle, { color: colors.success }]}>Deposit Confirmed!</Text>
            <Text style={[styles.confirmationMessageText, { color: colors.textSecondary, textAlign: 'center', marginTop: 4 }]}>Your deposit was successful.</Text>
            <TouchableOpacity style={[styles.confirmationMessageButton, { backgroundColor: colors.primary }]} onPress={() => setShowDepositConfirmation(false)}>
              <Text style={{ color: colors.textInverse, fontWeight: '600', fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      )}
      {/* Withdraw Options Modal */}
      {showWithdrawModal && (
        <View style={styles.sendOptionsOverlay}>
          <TouchableOpacity
            style={styles.sendOptionsBackdrop}
            activeOpacity={1}
            onPress={() => setShowWithdrawModal(false)}
          />
          {/* Semi-transparent overlay for bottom navigation */}
          <View style={styles.bottomNavOverlay} />
          <View style={[styles.sendOptionsModal, { backgroundColor: colors.cardBackground }]}>
            {/* Enhanced Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <View style={styles.modalHeaderLeft}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Withdraw Funds</Text>
                  {/* Compact limits info in header */}
                  <View style={styles.headerLimitsInfo}>
                    <View style={styles.headerLimitItem}>
                      <Ionicons name="information-circle-outline" size={12} color={colors.textMuted} />
                      <Text style={[styles.headerLimitText, { color: colors.textMuted }]}>Daily: ₵50,000</Text>
          </View>
                    <View style={styles.headerLimitItem}>
                      <Ionicons name="shield-checkmark-outline" size={12} color={colors.success} />
                      <Text style={[styles.headerLimitText, { color: colors.textMuted }]}>Secure</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setShowWithdrawModal(false)}
                  style={styles.closeButton}
                  accessibilityLabel="Close withdraw options"
                >
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Actions Section */}
            <View style={styles.quickActionsSection}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity 
                  style={[styles.quickActionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => { navigation.navigate('WithdrawScreen'); }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="business-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.quickActionText, { color: colors.text }]}>Bank</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.quickActionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => { navigation.navigate('WithdrawScreen'); }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.accent + '20' }]}>
                    <Ionicons name="phone-portrait-outline" size={20} color={colors.accent} />
                  </View>
                  <Text style={[styles.quickActionText, { color: colors.text }]}>MoMo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.quickActionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => { navigation.navigate('WithdrawScreen'); }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.success + '20' }]}>
                    <Ionicons name="wallet-outline" size={20} color={colors.success} />
                  </View>
                  <Text style={[styles.quickActionText, { color: colors.text }]}>Crypto</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.quickActionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => { showAlert('ATM Withdrawal', 'ATM withdrawal feature coming soon!', 'info'); }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.warning + '20' }]}>
                    <Ionicons name="card-outline" size={20} color={colors.warning} />
                  </View>
                  <Text style={[styles.quickActionText, { color: colors.text }]}>ATM</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Main Withdraw Options */}
            <View style={styles.optionsSection}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Withdraw Options</Text>
              
              {/* Primary Options */}
              <TouchableOpacity 
                style={[styles.sendOptionBtn, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => { navigation.navigate('WithdrawScreen'); }}
              >
                <View style={styles.sendOptionContent}>
                  <View style={[styles.sendOptionIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="business-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.sendOptionTextContainer}>
                    <Text style={[styles.sendOptionText, { color: colors.text }]}>Bank Account</Text>
                    <Text style={[styles.sendOptionSubtext, { color: colors.textMuted }]}>Withdraw to bank account</Text>
                  </View>
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.sendOptionBtn, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => { navigation.navigate('WithdrawScreen'); }}
              >
                <View style={styles.sendOptionContent}>
                  <View style={[styles.sendOptionIcon, { backgroundColor: colors.success + '20' }]}>
                    <Ionicons name="phone-portrait-outline" size={22} color={colors.success} />
                  </View>
                  <View style={styles.sendOptionTextContainer}>
                    <Text style={[styles.sendOptionText, { color: colors.text }]}>Mobile Money</Text>
                    <Text style={[styles.sendOptionSubtext, { color: colors.textMuted }]}>Withdraw to mobile wallet</Text>
                  </View>
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.sendOptionBtn, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => { navigation.navigate('WithdrawScreen'); }}
              >
                <View style={styles.sendOptionContent}>
                  <View style={[styles.sendOptionIcon, { backgroundColor: colors.accent + '20' }]}>
                    <Ionicons name="wallet-outline" size={22} color={colors.accent} />
                  </View>
                  <View style={styles.sendOptionTextContainer}>
                    <Text style={[styles.sendOptionText, { color: colors.text }]}>Crypto Wallet</Text>
                    <Text style={[styles.sendOptionSubtext, { color: colors.textMuted }]}>Withdraw USDC, EURC, SOL</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Secondary Options */}
              <TouchableOpacity 
                style={[styles.sendOptionBtn, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => { showAlert('ATM Withdrawal', 'ATM withdrawal feature coming soon!', 'info'); }}
              >
                <View style={styles.sendOptionContent}>
                  <View style={[styles.sendOptionIcon, { backgroundColor: colors.info + '20' }]}>
                    <Ionicons name="card-outline" size={22} color={colors.info} />
                  </View>
                  <View style={styles.sendOptionTextContainer}>
                    <Text style={[styles.sendOptionText, { color: colors.text }]}>ATM Withdrawal</Text>
                    <Text style={[styles.sendOptionSubtext, { color: colors.textMuted }]}>Withdraw from ATM</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.sendOptionBtn, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => { showAlert('International Transfer', 'International transfer feature coming soon!', 'info'); }}
              >
                <View style={styles.sendOptionContent}>
                  <View style={[styles.sendOptionIcon, { backgroundColor: colors.warning + '20' }]}>
                    <Ionicons name="globe-outline" size={22} color={colors.warning} />
                  </View>
                  <View style={styles.sendOptionTextContainer}>
                    <Text style={[styles.sendOptionText, { color: colors.text }]}>International</Text>
                    <Text style={[styles.sendOptionSubtext, { color: colors.textMuted }]}>International bank transfer</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.sendOptionBtn, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => { showAlert('Check Withdrawal', 'Check withdrawal feature coming soon!', 'info'); }}
              >
                <View style={styles.sendOptionContent}>
                  <View style={[styles.sendOptionIcon, { backgroundColor: colors.error + '20' }]}>
                    <Ionicons name="document-text-outline" size={22} color={colors.error} />
                  </View>
                  <View style={styles.sendOptionTextContainer}>
                    <Text style={[styles.sendOptionText, { color: colors.text }]}>Check</Text>
                    <Text style={[styles.sendOptionSubtext, { color: colors.textMuted }]}>Withdraw via check</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {/* Receive Options Modal */}
      {showReceiveOptions && (
        <View style={styles.sendOptionsOverlay}>
          <TouchableOpacity
            style={styles.sendOptionsBackdrop}
            activeOpacity={1}
            onPress={() => setShowReceiveOptions(false)}
          />
          {/* Semi-transparent overlay for bottom navigation */}
          <View style={styles.bottomNavOverlay} />
          <View style={[styles.sendOptionsModal, { backgroundColor: colors.cardBackground }]}>
            {/* Enhanced Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <View style={styles.modalHeaderLeft}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Receive Money</Text>
                  {/* Compact limits info in header */}
                  <View style={styles.headerLimitsInfo}>
                    <View style={styles.headerLimitItem}>
                      <Ionicons name="information-circle-outline" size={12} color={colors.textMuted} />
                      <Text style={[styles.headerLimitText, { color: colors.textMuted }]}>No fees</Text>
                    </View>
                    <View style={styles.headerLimitItem}>
                      <Ionicons name="shield-checkmark-outline" size={12} color={colors.success} />
                      <Text style={[styles.headerLimitText, { color: colors.textMuted }]}>Secure</Text>
                    </View>
                  </View>
                </View>
            <TouchableOpacity
              onPress={() => setShowReceiveOptions(false)}
                  style={styles.closeButton}
              accessibilityLabel="Close receive options"
            >
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
              </View>
            </View>

            {/* Quick Actions Section */}
            <View style={styles.quickActionsSection}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity 
                  style={[styles.quickActionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => { navigation.navigate('ReceiveMoney'); }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="qr-code" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.quickActionText, { color: colors.text }]}>Show QR</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.quickActionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => { showAlert('Share Link', 'Share your receive link feature coming soon!', 'info'); }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.accent + '20' }]}>
                    <Ionicons name="share-outline" size={20} color={colors.accent} />
                  </View>
                  <Text style={[styles.quickActionText, { color: colors.text }]}>Share Link</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.quickActionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => { showAlert('Request Money', 'Request money feature coming soon!', 'info'); }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.success + '20' }]}>
                    <Ionicons name="mail-outline" size={20} color={colors.success} />
                  </View>
                  <Text style={[styles.quickActionText, { color: colors.text }]}>Request</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.quickActionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => { showAlert('Generate Invoice', 'Generate invoice feature coming soon!', 'info'); }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.warning + '20' }]}>
                    <Ionicons name="receipt-outline" size={20} color={colors.warning} />
                  </View>
                  <Text style={[styles.quickActionText, { color: colors.text }]}>Invoice</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Main Receive Options */}
            <View style={styles.optionsSection}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Receive Options</Text>
              
              {/* Primary Options */}
              <TouchableOpacity 
                style={[styles.sendOptionBtn, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => { navigation.navigate('ReceiveMoney'); }}
              >
                <View style={styles.sendOptionContent}>
                  <View style={[styles.sendOptionIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="qr-code-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.sendOptionTextContainer}>
                    <Text style={[styles.sendOptionText, { color: colors.text }]}>QR Code</Text>
                    <Text style={[styles.sendOptionSubtext, { color: colors.textMuted }]}>Show QR code to receive</Text>
                  </View>
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.sendOptionBtn, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => { showAlert('Wallet Address', 'Wallet address receive feature coming soon!', 'info'); }}
              >
                <View style={styles.sendOptionContent}>
                  <View style={[styles.sendOptionIcon, { backgroundColor: colors.success + '20' }]}>
                    <Ionicons name="wallet-outline" size={22} color={colors.success} />
                  </View>
                  <View style={styles.sendOptionTextContainer}>
                    <Text style={[styles.sendOptionText, { color: colors.text }]}>Wallet Address</Text>
                    <Text style={[styles.sendOptionSubtext, { color: colors.textMuted }]}>Share your wallet address</Text>
                  </View>
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.sendOptionBtn, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => { showAlert('Bank Account', 'Bank account receive feature coming soon!', 'info'); }}
              >
                <View style={styles.sendOptionContent}>
                  <View style={[styles.sendOptionIcon, { backgroundColor: colors.accent + '20' }]}>
                    <Ionicons name="business-outline" size={22} color={colors.accent} />
                  </View>
                  <View style={styles.sendOptionTextContainer}>
                <Text style={[styles.sendOptionText, { color: colors.text }]}>Bank Account</Text>
                    <Text style={[styles.sendOptionSubtext, { color: colors.textMuted }]}>Share bank account details</Text>
                  </View>
              </View>
            </TouchableOpacity>

              {/* Secondary Options */}
              <TouchableOpacity 
                style={[styles.sendOptionBtn, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => { showAlert('Mobile Money', 'Mobile money receive feature coming soon!', 'info'); }}
              >
                <View style={styles.sendOptionContent}>
                  <View style={[styles.sendOptionIcon, { backgroundColor: colors.info + '20' }]}>
                    <Ionicons name="phone-portrait-outline" size={22} color={colors.info} />
                  </View>
                  <View style={styles.sendOptionTextContainer}>
                <Text style={[styles.sendOptionText, { color: colors.text }]}>Mobile Money</Text>
                    <Text style={[styles.sendOptionSubtext, { color: colors.textMuted }]}>Share mobile money number</Text>
                  </View>
              </View>
            </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.sendOptionBtn, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => { showAlert('Payment Link', 'Payment link receive feature coming soon!', 'info'); }}
              >
                <View style={styles.sendOptionContent}>
                  <View style={[styles.sendOptionIcon, { backgroundColor: colors.warning + '20' }]}>
                    <Ionicons name="link-outline" size={22} color={colors.warning} />
                  </View>
                  <View style={styles.sendOptionTextContainer}>
                    <Text style={[styles.sendOptionText, { color: colors.text }]}>Payment Link</Text>
                    <Text style={[styles.sendOptionSubtext, { color: colors.textMuted }]}>Generate payment link</Text>
                  </View>
              </View>
            </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.sendOptionBtn, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => { showAlert('Request Payment', 'Request payment feature coming soon!', 'info'); }}
              >
                <View style={styles.sendOptionContent}>
                  <View style={[styles.sendOptionIcon, { backgroundColor: colors.error + '20' }]}>
                    <Ionicons name="mail-outline" size={22} color={colors.error} />
                  </View>
                  <View style={styles.sendOptionTextContainer}>
                    <Text style={[styles.sendOptionText, { color: colors.text }]}>Request Payment</Text>
                    <Text style={[styles.sendOptionSubtext, { color: colors.textMuted }]}>Send payment request</Text>
                  </View>
              </View>
            </TouchableOpacity>
          </View>
          </View>
        </View>
      )}

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
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  activityTitle: {
    color: Colors.textPrimary,
  },
  viewAllText: {
    fontFamily: 'Montserrat',
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#1e40af',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  activityList: {
    marginTop: 8,
  },
  
  // Premium Transaction Items
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 4,
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  transactionItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginRight: 12,
  },
  transactionItemDetails: {
    flex: 1,
  },
  transactionItemTitle: {
    fontFamily: 'Montserrat',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
    color: '#1e293b',
  },
  transactionItemDate: {
    fontFamily: 'Montserrat',
    fontSize: 12,
    color: '#64748b',
    fontWeight: '400',
  },
  transactionItemAmount: {
    fontFamily: 'Montserrat',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  activitySeparator: {
    height: 0,
  },
  
  // Loading and Empty States
  loadingIndicator: {
    marginTop: 30,
  },
  noActivityContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  noActivityText: {
    fontFamily: 'Montserrat',
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 4,
  },
  noActivitySubtext: {
    fontFamily: 'Montserrat',
    fontSize: 14,
    color: '#64748b',
    fontWeight: '400',
  },
  // Currency Calculator Styles
  calculatorCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  calculatorTitle: {
    fontFamily: 'Montserrat',
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
    alignSelf: 'center',
  },
  calculatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    width: '100%',
  },
  calculationItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  calculationDivider: {
    width: 16,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
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
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 8, // Reduced top padding
    minWidth: 300,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 15,
    position: 'relative',
    width: '90%',
    maxWidth: 380,
    maxHeight: '95%', // Increased to show more content
    marginBottom: Platform.OS === 'ios' ? 20 : 16, // Reduced margin to allow content to extend over menu bar
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
    paddingVertical: 10,
    paddingHorizontal: 8,
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
    marginBottom: 4,
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
  exchangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    minWidth: 120,
  },
  exchangeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exchangeButtonText: {
    fontFamily: 'Montserrat',
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
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
  convertModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center horizontally
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: Colors.backgroundSecondary,
    width: 180,
  },
  convertModalOptionText: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
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
    justifyContent: 'flex-start',
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
  // Transaction Details Modal Styles
  transactionDetailsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  transactionDetailsBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  transactionDetailsContainer: {
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
    marginTop: 100,
    marginBottom: 100,
  },
  transactionDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  transactionDetailsTitle: {
    flex: 1,
    textAlign: 'center',
  },
  transactionDetailsCloseButton: {
    padding: 4,
    borderRadius: 12,
  },
  transactionDetailsContent: {
    width: '100%',
    marginBottom: 20,
  },
  transactionDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  transactionDetailsLabel: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  transactionDetailsValue: {
    ...Typography.bodyRegular,
    fontWeight: '600',
  },
  transactionDetailsButton: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
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
});

export default HomeScreen;

