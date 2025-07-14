// sendnreceive-app/screens/ChooseCurrencyScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useNavigation, useRoute } from '@react-navigation/native';

const CURRENCIES = [
  { 
    code: 'USDC', 
    name: 'USD Coin', 
    icon: 'logo-usd', 
    flag: '🇺🇸',
    type: 'crypto',
    isPopular: true,
    color: '#4F46E5'
  },
  { 
    code: 'EURC', 
    name: 'EUR Coin', 
    icon: 'logo-euro', 
    flag: '🇪🇺',
    type: 'crypto',
    isPopular: true,
    color: '#059669'
  },
  { 
    code: 'GHS', 
    name: 'Ghanaian Cedi', 
    icon: 'cash-outline', 
    flag: '🇬🇭',
    type: 'fiat',
    isPopular: false,
    color: '#DC2626'
  },
];

// Mock exchange rates - replace with API call
const MOCK_EXCHANGE_RATES = {
  USDC: { GHS: 12.50, EURC: 0.92 },
  EURC: { GHS: 13.50, USDC: 1.08 },
  GHS: { USDC: 0.08, EURC: 0.074 },
};

const ChooseCurrencyScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedRecipient } = route.params;

  const [sendAmount, setSendAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [selectedSendCurrency, setSelectedSendCurrency] = useState(CURRENCIES[0]); // Default to USDC
  const [selectedReceiveCurrency, setSelectedReceiveCurrency] = useState(CURRENCIES[2]); // Default to GHS for recipient

  const [isSendingCrypto, setIsSendingCrypto] = useState(true); // To toggle if user is inputting send or receive amount
  const [showQuickAmounts, setShowQuickAmounts] = useState(true);

  const quickAmounts = [50, 100, 250, 500, 1000, 2000];

  useEffect(() => {
    // Highlight USDC and EURC initially as per requirement (though selection handles this)
    // For this example, we default to USDC. User can tap to change.
  }, []);

  const formatAmount = (value) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const handleAmountChange = (text, type) => {
    const numericValue = text.replace(/[^0-9.]/g, '');
    if (type === 'send') {
      setSendAmount(numericValue);
      setIsSendingCrypto(true);
      if (numericValue && selectedSendCurrency && selectedReceiveCurrency) {
        const rate = MOCK_EXCHANGE_RATES[selectedSendCurrency.code]?.[selectedReceiveCurrency.code] || 0;
        setReceiveAmount((parseFloat(numericValue) * rate).toFixed(2));
      } else {
        setReceiveAmount('');
      }
    } else { // type === 'receive'
      setReceiveAmount(numericValue);
      setIsSendingCrypto(false);
      if (numericValue && selectedSendCurrency && selectedReceiveCurrency) {
        const rate = MOCK_EXCHANGE_RATES[selectedReceiveCurrency.code]?.[selectedSendCurrency.code] || 0;
        const inverseRate = MOCK_EXCHANGE_RATES[selectedReceiveCurrency.code]?.[selectedSendCurrency.code] || 0;
         setSendAmount((parseFloat(numericValue) * inverseRate).toFixed(2));
      } else {
        setSendAmount('');
      }
    }
  };

  const handleQuickAmount = (amount, type) => {
    const amountStr = amount.toString();
    handleAmountChange(amountStr, type);
  };

  const handleCurrencySelection = (currency, type) => {
    if (type === 'send') {
      setSelectedSendCurrency(currency);
      // Recalculate if send amount exists
      if (sendAmount && MOCK_EXCHANGE_RATES[currency.code]?.[selectedReceiveCurrency.code]) {
        const rate = MOCK_EXCHANGE_RATES[currency.code][selectedReceiveCurrency.code];
        setReceiveAmount((parseFloat(sendAmount) * rate).toFixed(2));
      } else if (!isSendingCrypto && receiveAmount && MOCK_EXCHANGE_RATES[selectedReceiveCurrency.code]?.[currency.code]) {
        // if user was editing receive amount, and changes send currency, re-calc send amount
        const inverseRate = MOCK_EXCHANGE_RATES[selectedReceiveCurrency.code][currency.code];
        setSendAmount((parseFloat(receiveAmount) * inverseRate).toFixed(2));
      }
    } else { // type === 'receive' - typically fixed for recipient country but can be flexible
      setSelectedReceiveCurrency(currency);
      // Recalculate if receive amount exists
       if (receiveAmount && MOCK_EXCHANGE_RATES[selectedSendCurrency.code]?.[currency.code]) {
        const rate = MOCK_EXCHANGE_RATES[selectedSendCurrency.code][currency.code];
        setSendAmount((parseFloat(receiveAmount) / rate).toFixed(2)); // amount / rate
      } else if (isSendingCrypto && sendAmount && MOCK_EXCHANGE_RATES[selectedSendCurrency.code]?.[currency.code]) {
        // if user was editing send amount, and changes receive currency, re-calc receive amount
        const rate = MOCK_EXCHANGE_RATES[selectedSendCurrency.code][currency.code];
        setReceiveAmount((parseFloat(sendAmount) * rate).toFixed(2));
      }
    }
  };


  const goToReview = () => {
    if (!sendAmount || parseFloat(sendAmount) <= 0 || !receiveAmount || parseFloat(receiveAmount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount to send.");
      return;
    }
    navigation.navigate('ReviewSendScreen', {
      selectedRecipient,
      sendAmount: parseFloat(sendAmount),
      receiveAmount: parseFloat(receiveAmount),
      sendCurrency: selectedSendCurrency,
      receiveCurrency: selectedReceiveCurrency,
      exchangeRate: MOCK_EXCHANGE_RATES[selectedSendCurrency.code]?.[selectedReceiveCurrency.code] || 0,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={Typography.h2}>Amount & Currency</Text>
          <View style={{width: 40}} /> {/* Spacer to balance header */}
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.scrollContentContainer} 
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => {
              if (sendAmount || receiveAmount) {
                Keyboard.dismiss();
              }
            }}
          >
          <View style={styles.recipientSummaryCard}>
            <Text style={Typography.label}>Sending to:</Text>
            <Text style={Typography.h3}>{selectedRecipient.name}</Text>
            <Text style={Typography.bodyRegular}>
              {selectedRecipient.isMobileMoney ? selectedRecipient.mobileNumber : `${selectedRecipient.bankName} (${selectedRecipient.accountNumber})`}
            </Text>
          </View>

          {/* Currency Pills - Sender */}
          <Text style={[Typography.label, styles.sectionLabel]}>You Send:</Text>
          <View style={styles.currencyPillsContainer}>
            {CURRENCIES.filter(c => c.type === 'crypto' || c.code === 'GHS').map((currency) => (
              <TouchableOpacity
                key={currency.code}
                style={[
                  styles.currencyPill,
                  selectedSendCurrency.code === currency.code && styles.selectedPill,
                  currency.isPopular && styles.popularPill,
                ]}
                onPress={() => handleCurrencySelection(currency, 'send')}
              >
                <Text style={styles.currencyFlag}>{currency.flag}</Text>
                <View style={styles.currencyPillContent}>
                <Text style={[
                  styles.pillText,
                  selectedSendCurrency.code === currency.code && styles.selectedPillText,
                ]}>
                  {currency.code}
                </Text>
                  <Text style={[
                    styles.pillSubtext,
                    selectedSendCurrency.code === currency.code && styles.selectedPillSubtext,
                  ]}>
                    {currency.name}
                  </Text>
                </View>
                {currency.isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount Input - Sender */}
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={sendAmount}
              onChangeText={(text) => handleAmountChange(text, 'send')}
              onFocus={() => setIsSendingCrypto(true)}
            />
            <Text style={styles.currencyLabelInInput}>{selectedSendCurrency.code}</Text>
          </View>

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmountsContainer}>
            <Text style={styles.quickAmountsLabel}>Quick amounts:</Text>
            <View style={styles.quickAmountsGrid}>
              {quickAmounts.map(amount => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.quickAmountButton,
                    sendAmount === amount.toString() && styles.quickAmountButtonActive
                  ]}
                  onPress={() => handleQuickAmount(amount, 'send')}
                >
                  <Text style={[
                    styles.quickAmountText,
                    sendAmount === amount.toString() && styles.quickAmountTextActive
                  ]}>
                    {selectedSendCurrency.code === 'GHS' ? `₵${amount.toLocaleString()}` : `${amount.toLocaleString()}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Exchange Rate Info (Optional) */}
          { selectedSendCurrency && selectedReceiveCurrency && MOCK_EXCHANGE_RATES[selectedSendCurrency.code]?.[selectedReceiveCurrency.code] && (
            <Text style={styles.exchangeRateText}>
              1 {selectedSendCurrency.code} ≈ {MOCK_EXCHANGE_RATES[selectedSendCurrency.code][selectedReceiveCurrency.code].toFixed(4)} {selectedReceiveCurrency.code}
            </Text>
          )}


          {/* Currency Pills - Receiver (Often fixed based on recipient country, but can be selectable) */}
          <Text style={[Typography.label, styles.sectionLabel, {marginTop: 20}]}>Recipient Gets:</Text>
           <View style={styles.currencyPillsContainer}>
            {CURRENCIES.filter(c => c.code === 'GHS').map((currency) => ( // Example: Recipient always gets GHS
              <TouchableOpacity
                key={currency.code}
                style={[styles.currencyPill, selectedReceiveCurrency.code === currency.code && styles.selectedPill]}
                onPress={() => handleCurrencySelection(currency, 'receive')}
                disabled // If recipient currency is fixed
              >
                 <Ionicons
                    name={currency.icon}
                    size={18}
                    color={selectedReceiveCurrency.code === currency.code ? Colors.textOnPrimaryCTA : Colors.brandPurple}
                    style={{marginRight: 5}}
                />
                <Text style={[styles.pillText, selectedReceiveCurrency.code === currency.code && styles.selectedPillText]}>
                  {currency.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount Input - Receiver */}
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={receiveAmount}
              onChangeText={(text) => handleAmountChange(text, 'receive')}
              onFocus={() => setIsSendingCrypto(false)}
            />
            <Text style={styles.currencyLabelInInput}>{selectedReceiveCurrency.code}</Text>
          </View>

          <Text style={styles.feeInfoText}>Transaction fees may apply. Final amount will be shown on the review screen.</Text>

        </ScrollView>
        </TouchableWithoutFeedback>

        <TouchableOpacity style={styles.continueButton} onPress={goToReview}>
          <Text style={Typography.button}>Continue</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'android' ? 15 : 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 5,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recipientSummaryCard: {
    backgroundColor: Colors.cardBackground,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    marginTop: 20,
  },
  sectionLabel: {
    marginTop: 15,
    marginBottom: 8,
    color: Colors.textSecondary,
  },
  currencyPillsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    flexWrap: 'wrap', // Allow wrapping if many currencies
  },
  currencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginRight: 12,
    marginBottom: 12,
    minWidth: 120,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedPill: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  popularPill: {
    borderColor: Colors.warning,
    borderWidth: 2,
  },
  currencyFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  currencyPillContent: {
    flex: 1,
  },
  pillText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  selectedPillText: {
    color: Colors.textInverse,
  },
  pillSubtext: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  selectedPillSubtext: {
    color: Colors.textInverse + 'CC',
  },
  popularBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  popularText: {
    ...Typography.bodySmall,
    color: Colors.textInverse,
    fontSize: 9,
    fontWeight: '600',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 15,
    marginBottom: 5, // Reduced margin
  },
  amountInput: {
    ...Typography.h1, // Large text for amount
    fontSize: 30,
    flex: 1,
    height: 60,
    color: Colors.textPrimary,
  },
  currencyLabelInInput: {
    ...Typography.h3,
    color: Colors.textMuted,
    marginLeft: 10,
  },
  quickAmountsContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  quickAmountsLabel: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  quickAmountButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickAmountText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  quickAmountTextActive: {
    color: Colors.textInverse,
  },
  exchangeRateText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    marginVertical: 10,
  },
  feeInfoText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    marginVertical: 15,
    fontStyle: 'italic',
  },
  continueButton: {
    backgroundColor: Colors.brandPurple,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: Platform.OS === 'ios' ? 0 : 20, // Handle SafeArea for Android
    marginTop: 10,
  },
});

export default ChooseCurrencyScreen;
