import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar, Keyboard, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ROUTES } from '../navigation/routes';
import BankSelector from '../components/deposits/BankSelector';
import usePlaidLink from '../hooks/usePlaidLink';

const BankTransferAmountScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  
  // Debug: Log props on component mount (only once)
  useEffect(() => {
    console.log('🏦 BankTransferAmountScreen mounted');
  }, []);
  
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [currencySearchQuery, setCurrencySearchQuery] = useState('');
  const chevronRotation = useRef(new Animated.Value(0)).current;
  
  // Currency state
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  
  // Currency options
  const currencyOptions = [
    { code: 'USD', country: 'United States', flag: '🇺🇸', symbol: '$', rateToUSDC: 1, rateToEURC: 0.93 },
    { code: 'EUR', country: 'Eurozone', flag: '🇪🇺', symbol: '€', rateToUSDC: 1.08, rateToEURC: 1 },
    { code: 'GBP', country: 'United Kingdom', flag: '🇬🇧', symbol: '£', rateToUSDC: 1.27, rateToEURC: 1.17 },
  ];
  
  const selectedCurrencyObj = currencyOptions.find(c => c.code === selectedCurrency);
  
  const [fees, setFees] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Balance state (mock data for now)
  const [balances] = useState([
    { currency: 'USD', amount: 1250.75, symbol: '$' },
    { currency: 'EUR', amount: 980.50, symbol: '€' },
    { currency: 'GHS', amount: 150000.00, symbol: '₵' },
    { currency: 'AED', amount: 3200.00, symbol: 'د.إ' },
    { currency: 'NGN', amount: 250000.00, symbol: '₦' },
  ]);
  
  // Function to get balance for a specific currency
  const getBalanceForCurrency = (currency) => {
    const balance = balances.find(b => b.currency === currency);
    return balance ? balance.amount.toLocaleString() : '0.00';
  };
  
  // Plaid bank selection using hook
  const { linking, open } = usePlaidLink();
  
  const handlePlaidLink = async () => {
    const result = await open();
    if (result.ok) {
      setSelectedBank(result.bank);
    } else {
      console.log('Plaid link error:', result.error);
    }
  };

  useEffect(() => {
    calculateFees();
  }, [amount]);

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

    // Set fees to 0 for bank transfers
    setFees(0);
    setTotalAmount(numAmount);
  };

  const validateForm = () => {
    console.log('🔍 Validating form:', { amount, selectedBank });
    
    if (!amount || parseFloat(amount) <= 0) {
      console.log('❌ Amount validation failed:', amount);
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }

    if (!selectedBank) {
      console.log('❌ Bank validation failed:', selectedBank);
      Alert.alert('Error', 'Please select a bank account');
      return false;
    }

    console.log('✅ Form validation passed');
    return true;
  };

  const handleNext = () => {
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    // Haptic feedback on valid selection
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    navigation.navigate(ROUTES.BANK_CONFIRM, { 
      amount: parseFloat(amount) || 0,
      currency: selectedCurrency,
      bank: selectedBank
    });
  };

  // Animate chevron rotation for currency dropdown
  useEffect(() => {
    Animated.timing(chevronRotation, {
      toValue: showCurrencyDropdown ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showCurrencyDropdown]);

  return (
    <View style={styles.darkContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add via Bank Transfer</Text>
        <View style={styles.placeholder} />
      </SafeAreaView>

      {/* Balance Display */}
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceText}>
          Available Balance: {selectedCurrencyObj?.symbol || '€'}{getBalanceForCurrency(selectedCurrency)}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Bank Selection */}
          <View style={styles.section}>
            <BankSelector
              selectedBank={selectedBank}
              onSelectBank={handlePlaidLink}
              placeholder="Select bank account"
              loading={linking}
            />
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
                    accessibilityLabel={`Select currency, currently ${selectedCurrencyObj?.code || 'EUR'}`}
                    accessibilityHint="Double tap to open currency selection"
                    accessibilityRole="button"
                  >
                    <Text style={styles.currencySymbolFlag}>{selectedCurrencyObj?.flag || '🇪🇺'}</Text>
                    <Text style={styles.integratedAmountCurrency}>{selectedCurrencyObj?.symbol || '€'}</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.integratedAmountInputField}
                    placeholder="0.00"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    maxLength={10}
                  />
                </TouchableOpacity>
              </View>

              {/* Live Conversion Preview */}
              <Text style={styles.conversionPreview}>
                = {amount ? parseFloat(amount).toFixed(2) : '0.00'} {selectedCurrency === 'EUR' ? 'EURC' : 'USDC'}
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

          {/* Fee Breakdown */}
          {amount && parseFloat(amount) > 0 && (
            <View style={styles.feeSection}>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Send from</Text>
                <Text style={styles.feeValue}>
                  {selectedBank ? `${selectedBank.name} ••••${selectedBank.mask}` : 'Select bank'}
                </Text>
              </View>
              
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Amount</Text>
                <Text style={styles.feeValue}>
                  {selectedCurrencyObj?.symbol || '€'}{parseFloat(amount).toFixed(2)} {selectedCurrency}
                </Text>
              </View>
              
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Processing time</Text>
                <Text style={styles.feeValue}>≈30s</Text>
              </View>
              
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Fees</Text>
                <Text style={styles.feeValue}>
                  {selectedCurrencyObj?.symbol || '€'}{fees.toFixed(2)}
                </Text>
              </View>
              
              <View style={[styles.feeRow, styles.totalRow]}>
                <Text style={[styles.feeLabel, styles.totalLabel]}>Total</Text>
                <Text style={[styles.feeValue, styles.totalValue]}>
                  {selectedCurrencyObj?.symbol || '€'}{totalAmount.toFixed(2)}
                </Text>
              </View>
            </View>
          )}

          {/* Next Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!amount || !selectedBank) && styles.sendButtonDisabled
              ]}
              onPress={handleNext}
              disabled={!amount || !selectedBank}
            >
              <Text style={styles.sendButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  darkContainer: {
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
  balanceContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  balanceText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
    fontWeight: '500',
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
  conversionPreview: {
    color: '#ffffff',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold'
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
});

export default BankTransferAmountScreen;