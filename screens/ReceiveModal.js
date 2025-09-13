import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TextInput,
  Animated,
  Keyboard,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

// Loading State Component
const LoadingOverlay = React.memo(({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Processing request...</Text>
      </View>
    </View>
  );
});

const ReceiveModal = ({ visible, onClose, currentCurrency, currentBalance, onCurrencyChange }) => {
  // State for amount input
  const [amount, setAmount] = useState('');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [currencySearchQuery, setCurrencySearchQuery] = useState('');
  const [amountError, setAmountError] = useState('');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Refs
  const amountInputRef = useRef(null);
  
  // Animated values
  const chevronRotation = useRef(new Animated.Value(0)).current;
  
  // Currency options
  const currencyOptions = [
    { code: 'USD', symbol: '$', flag: '🇺🇸', country: 'United States' },
    { code: 'EUR', symbol: '€', flag: '🇪🇺', country: 'European Union' },
    { code: 'GHS', symbol: '₵', flag: '🇬🇭', country: 'Ghana' },
    { code: 'AED', symbol: 'د.إ', flag: '🇦🇪', country: 'United Arab Emirates' },
    { code: 'NGN', symbol: '₦', flag: '🇳🇬', country: 'Nigeria' },
  ];
  
  // Receive method options
  const receiveOptions = [
    {
      id: 'mobile_money',
      title: 'Mobile Money',
      description: 'Airtel, M-Pesa, MTN or Vodafone Cash',
      icon: 'phone-portrait-outline',
      gradient: ['#10b981', '#059669'],
      processingTime: 'Instant',
      fee: '0%',
    },
    {
      id: 'bank_transfer',
      title: 'Bank Transfer',
      description: 'Global banks',
      icon: 'business-outline',
      gradient: ['#6366f1', '#4f46e5'],
      processingTime: 'Instant',
      fee: '0%',
    },
    {
      id: 'paypal',
      title: 'PayPal',
      description: 'Receive on PayPal',
      icon: 'logo-paypal',
      gradient: ['#003087', '#1e40af'],
      processingTime: 'Instant',
      fee: '0%',
    },
    {
      id: 'crypto',
      title: 'Cryptocurrency',
      description: 'Receive in stable coins',
      icon: 'logo-bitcoin',
      gradient: ['#f7931a', '#ff9500'],
      processingTime: 'Instant',
      fee: '0%',
    },
    {
      id: 'cash_pickup',
      title: 'Cash Pickup',
      description: 'Pick up cash at local locations',
      icon: 'location-outline',
      gradient: ['#ef4444', '#dc2626'],
      processingTime: 'Same day',
      fee: '0%',
    },
  ];

  // Get selected currency object
  const selectedCurrencyObj = currencyOptions.find(opt => opt.code === currentCurrency) || currencyOptions[0];

  // Filtered currencies for search
  const filteredCurrencies = currencyOptions.filter(opt =>
    opt.code.toLowerCase().includes(currencySearchQuery.toLowerCase()) ||
    opt.country.toLowerCase().includes(currencySearchQuery.toLowerCase()) ||
    opt.symbol.toLowerCase().includes(currencySearchQuery.toLowerCase())
  );

  // Amount validation
  const validateAmount = (text) => {
    const numValue = parseFloat(text);
    if (text === '') {
      setAmountError('');
      return;
    }
    if (isNaN(numValue) || numValue <= 0) {
      setAmountError('Please enter a valid amount');
      return;
    }
    if (numValue > 10000) {
      setAmountError('Maximum amount is $10,000');
      return;
    }
    setAmountError('');
  };

  // Handle currency change
  const handleCurrencyChange = (currencyCode) => {
    if (typeof onCurrencyChange === 'function') {
      onCurrencyChange(currencyCode);
    }
    setShowCurrencyDropdown(false);
  };

  // Handle option selection
  const handleOptionSelect = (option) => {
    console.log('Selected option:', option);
    // In a real app, you'd navigate to a new screen or update state
    // For now, just close the modal
    onClose();
  };

  // Animate chevron rotation
  useEffect(() => {
    Animated.timing(chevronRotation, {
      toValue: showCurrencyDropdown ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showCurrencyDropdown]);

  // Helper functions for exchange rates (placeholder)
  const getCurrentRate = (currencyCode) => {
    // Placeholder for live rates
    const rates = {
      'EUR': '1 USD = 0.92 EUR',
      'GHS': '1 USD = 12.50 GHS',
      'AED': '1 USD = 3.67 AED',
      'NGN': '1 USD = 1,200 NGN',
    };
    return rates[currencyCode];
  };

  const getFallbackRate = (currencyCode) => {
    // Fallback rates when live rates are unavailable
    return getCurrentRate(currencyCode);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
      >
        <View style={{ flex: 1 }}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={onClose} 
          />
          
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={onClose}
              accessibilityLabel="Close receive money modal"
              accessibilityHint="Double tap to close the receive money screen"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text 
              style={styles.modalTitle}
              accessibilityRole="header"
            >
              Receive Money
            </Text>
            <View style={styles.modalSpacer} />
          </View>

          {/* Balance Subtitle */}
          <View style={[styles.balanceSubtitleContainer, { marginTop: 20 }]}>
            <Text style={styles.balanceSubtitleText}>
              Available Balance: {currentCurrency === 'USD' ? '$' : 
                                 currentCurrency === 'EUR' ? '€' : 
                                 currentCurrency === 'GHS' ? '₵' : 
                                 currentCurrency === 'AED' ? 'د.إ' : 
                                 currentCurrency === 'NGN' ? '₦' : '$'}{currentBalance || '0.00'}
            </Text>
          </View>

          {/* Card Stack Container */}
          <View style={[
            styles.cardStackModalContainer,
            {
              paddingTop: Platform.OS === 'ios' ? 200 : 180,
              paddingBottom: Platform.OS === 'ios' ? 20 : 15,
              justifyContent: 'flex-start',
            }
          ]}>
            <TouchableOpacity 
              style={{ 
                width: '100%',
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingTop: 30
              }}
              activeOpacity={1}
              onPress={() => {
                setShowCurrencyDropdown(false);
                Keyboard.dismiss();
              }}
            >
              {/* Amount Input Section */}
              <View style={[styles.paymentAmountSection, { marginTop: 40 }]}>
                
                {/* Integrated Currency Selector + Amount Input */}
                <View style={styles.paymentCurrencyContainer}>
                  <View style={styles.integratedAmountInputContainer}>
                    {/* Currency Selector on the Left */}
                    <TouchableOpacity
                      style={styles.integratedCurrencySelector}
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
                      <Text style={styles.integratedCurrencyFlag}>{selectedCurrencyObj?.flag || '🇺🇸'}</Text>
                      <Text style={styles.integratedCurrencyCode}>{selectedCurrencyObj?.code || 'USD'}</Text>
                      <Animated.View style={{
                        transform: [{
                          rotate: chevronRotation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '180deg']
                          })
                        }]
                      }}>
                        <Ionicons 
                          name="chevron-down" 
                          size={16} 
                          color="rgba(255,255,255,0.8)" 
                        />
                      </Animated.View>
                    </TouchableOpacity>
                    
                    {/* Amount Input on the Right */}
                    <TouchableOpacity 
                      style={styles.integratedAmountInput}
                      activeOpacity={1}
                      onPress={Keyboard.dismiss}
                    >
                      <Text style={styles.integratedAmountCurrency}>{selectedCurrencyObj?.symbol || '$'}</Text>
                      <TextInput
                        ref={amountInputRef}
                        style={styles.integratedAmountInputField}
                        placeholder="0.00"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={(text) => {
                          setAmount(text);
                          validateAmount(text);
                        }}
                        maxLength={10}
                      />
                    </TouchableOpacity>
                  </View>
                  
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
                          <Ionicons name="checkmark-circle-outline" size={12} color="#10b981" />
                          <Text style={styles.liveRateText}>Live rates</Text>
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
                              opt.code === currentCurrency && styles.paymentCurrencyOptionActive
                            ]}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              if (typeof onCurrencyChange === 'function') {
                                onCurrencyChange(opt.code);
                              }
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
                              {opt.code === currentCurrency && (
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
                {receiveOptions.map((option, index) => {
                  const isTopCard = index === currentCardIndex;
                  const stackIndex = index - currentCardIndex;
                  
                  if (stackIndex < 0 || stackIndex > 2) return null; // Show 3 cards in stack
                  
                  return (
                    <Animated.View
                      key={option.id}
                      style={[
                        styles.cardStackCard,
                        { 
                          zIndex: 6 - stackIndex,
                          transform: [
                            { translateY: stackIndex * 8 },
                            { scale: 1 - (stackIndex * 0.05) },
                          ],
                          opacity: isTopCard ? 1 : 0.8
                        }
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => handleOptionSelect(option)}
                        activeOpacity={0.9}
                        style={{ flex: 1 }}
                      >
                        <LinearGradient
                          colors={option.gradient}
                          style={styles.cardStackCardGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <View style={styles.cardStackCardContent}>
                            {/* Left arrow for previous card */}
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setCurrentCardIndex(prev => prev === 0 ? receiveOptions.length - 1 : prev - 1);
                              }}
                              activeOpacity={0.7}
                              style={styles.cardLeftArrow}
                            >
                              <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.8)" />
                            </TouchableOpacity>
                            
                            {/* Center content area */}
                            <View style={styles.cardCenterContent}>
                              <View style={styles.cardStackCardIcon}>
                                <Ionicons 
                                  name={option.icon} 
                                  size={32} 
                                  color={isTopCard ? "#ffffff" : "rgba(255,255,255,0.8)"} 
                                />
                              </View>
                              <View style={styles.cardStackCardInfo}>
                                <Text style={styles.cardStackCardTitle}>{option.title}</Text>
                                <Text style={styles.cardStackCardDescription}>
                                  {option.description}
                                </Text>
                                <View style={styles.cardStackCardDetails}>
                                  <View style={styles.cardStackCardTime}>
                                    <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.cardStackCardTimeText}>
                                      {option.processingTime}
                                    </Text>
                                  </View>
                                  <View style={styles.cardStackCardFee}>
                                    <Ionicons name="alert-circle-outline" size={12} color="rgba(255,255,255,0.9)" />
                                    <Text style={styles.cardStackCardFeeText}>
                                      {option.fee} fee
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            </View>
                            
                            {/* Right arrow for next card */}
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setCurrentCardIndex(prev => prev === receiveOptions.length - 1 ? 0 : prev + 1);
                              }}
                              activeOpacity={0.7}
                              style={styles.cardRightArrow}
                            >
                              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
                            </TouchableOpacity>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    </Animated.View>
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
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCurrentCardIndex(prev => prev === 0 ? receiveOptions.length - 1 : prev - 1);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              
              <View style={styles.cardStackDots}>
                {receiveOptions.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.cardStackDot,
                      index === currentCardIndex && styles.cardStackDotActive
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      // Direct card selection - go to specific card
                      setCurrentCardIndex(index);
                    }}
                  >
                    <Ionicons 
                      name={receiveOptions[index].icon} 
                      size={16} 
                      color={index === currentCardIndex ? "#ffffff" : "rgba(255,255,255,0.6)"} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity
                style={[styles.cardStackNavButton]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCurrentCardIndex(prev => prev === receiveOptions.length - 1 ? 0 : prev + 1);
                }}
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
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 1)', // Fully opaque black background
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalHeader: {
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
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Montserrat',
  },
  modalSpacer: {
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
  amountInputContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 300 : 250,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  paymentAmountSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  paymentCurrencyContainer: {
    position: 'relative',
    zIndex: 10,
    marginBottom: 30,
  },
  integratedAmountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    minWidth: 320,
  },
  integratedCurrencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.3)',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  integratedAmountCurrency: {
    fontSize: 20,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    fontWeight: '700',
    marginRight: 12,
  },
  integratedAmountInputField: {
    flex: 1,
    fontSize: 20,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    fontWeight: '700',
    textAlign: 'left',
    minWidth: 120,
  },
  amountErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  amountErrorText: {
    fontSize: 12,
    color: '#ef4444',
    marginLeft: 5,
    fontFamily: 'Montserrat',
    fontWeight: '500',
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
    maxHeight: 320,
  },
  liveRateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  liveRateStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveRateText: {
    fontSize: 12,
    color: '#10b981',
    fontFamily: 'Montserrat',
    fontWeight: '500',
    marginLeft: 6,
  },
  currencySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  currencySearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    fontWeight: '500',
    marginLeft: 8,
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  paymentCurrencyDropdownScroll: {
    maxHeight: 180,
  },
  paymentCurrencyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  paymentCurrencyOptionActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  currencyOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentCurrencyOptionFlag: {
    fontSize: 16,
    marginRight: 8,
  },
  currencyOptionInfo: {
    marginLeft: 8,
  },
  paymentCurrencyOptionCode: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'Montserrat',
    fontWeight: '600',
  },
  paymentCurrencyOptionSymbol: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Montserrat',
    fontWeight: '500',
  },
  currencyOptionRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  currencyOptionRate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Montserrat',
    fontWeight: '500',
    textAlign: 'right',
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
  cardRightArrow: {
    padding: 4,
  },
  cardLeftArrow: {
    width: 40,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  cardCenterContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardStackModalContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 15,
    alignItems: 'center',
    justifyContent: 'flex-start',
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
});

export default ReceiveModal;






