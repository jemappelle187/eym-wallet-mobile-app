import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

// Mock recent recipients - replace with actual data
const MOCK_RECENT_RECIPIENTS = [
  { 
    id: '1', 
    name: 'Ama Serwaa', 
    avatarInitials: 'AS', 
    avatarColor: '#4F46E5',
    lastAmount: '₵500.00',
    isFavorite: true,
    mobileNumber: '+233 24 123 4567'
  },
  { 
    id: '2', 
    name: 'Kwame Mensah', 
    avatarInitials: 'KM', 
    avatarColor: '#059669',
    lastAmount: '₵1,200.00',
    isFavorite: false,
    mobileNumber: '+233 55 765 4321'
  },
  { 
    id: '3', 
    name: 'Fatimah Ali', 
    avatarInitials: 'FA', 
    avatarColor: '#7C3AED',
    lastAmount: '₵750.00',
    isFavorite: true,
    mobileNumber: '+233 20 987 6543'
  },
];

const QuickSendModal = () => {
  const navigation = useNavigation();
  const { colors = Colors } = useTheme();
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  // Available currencies
  const availableCurrencies = [
    { symbol: '₵', code: 'GHS', name: 'Ghanaian Cedi', country: 'Ghana' },
    { symbol: '$', code: 'USD', name: 'US Dollar', country: 'United States' },
    { symbol: '€', code: 'EUR', name: 'Euro', country: 'European Union' },
    { symbol: '£', code: 'GBP', name: 'British Pound', country: 'United Kingdom' },
    { symbol: '¥', code: 'JPY', name: 'Japanese Yen', country: 'Japan' },
    { symbol: '₹', code: 'INR', name: 'Indian Rupee', country: 'India' },
    { symbol: '₦', code: 'NGN', name: 'Nigerian Naira', country: 'Nigeria' },
    { symbol: '₩', code: 'KRW', name: 'South Korean Won', country: 'South Korea' },
  ];

  const [selectedCurrency, setSelectedCurrency] = useState(availableCurrencies[0]); // Default to GHS

  const quickAmounts = [100, 500, 1000, 2000];

  const handleQuickAmount = (quickAmount) => {
    setAmount(quickAmount.toString());
  };

  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency);
    setShowCurrencyModal(false);
  };

  const handleSend = async () => {
    if (!selectedRecipient) {
      Alert.alert('Recipient Required', 'Please select a recipient.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    navigation.navigate('TransactionSuccess', {
      transactionData: {
        sendAmount: `${selectedCurrency.symbol}${amount}`,
        receiveAmount: `${selectedCurrency.symbol}${amount}`,
        sendCurrency: selectedCurrency.code,
        receiveCurrency: selectedCurrency.code,
        recipientName: selectedRecipient.name,
        deliveryTime: '2-5 minutes',
      }
    });
    
    setIsLoading(false);
  };

  const renderRecipientItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.recipientItem,
        { backgroundColor: colors.background, borderColor: colors.border },
        selectedRecipient?.id === item.id && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
      ]}
      onPress={() => setSelectedRecipient(item)}
    >
      <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
        <Text style={styles.avatarText}>{item.avatarInitials}</Text>
        {item.isFavorite && (
          <View style={styles.favoriteBadge}>
            <Ionicons name="star" size={10} color={Colors.warning} />
          </View>
        )}
      </View>
      <View style={styles.recipientInfo}>
        <Text style={[styles.recipientName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.recipientPhone, { color: colors.textMuted }]}>{item.mobileNumber}</Text>
        <Text style={[styles.lastAmount, { color: colors.textMuted }]}>Last sent: {item.lastAmount}</Text>
      </View>
      {selectedRecipient?.id === item.id && (
        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Recipients Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Recent Recipients</Text>
            <FlatList
              data={MOCK_RECENT_RECIPIENTS}
              renderItem={renderRecipientItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Amount Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Amount</Text>
            
            {/* Currency Selector */}
            <TouchableOpacity
              style={[styles.currencySelector, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShowCurrencyModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.currencyInfo}>
                <Text style={[styles.currencyCode, { color: colors.text }]}>{selectedCurrency.code}</Text>
                <Text style={[styles.currencyCountry, { color: colors.textMuted }]}>{selectedCurrency.country}</Text>
              </View>
              <Text style={[styles.currencySymbol, { color: colors.text }]}>{selectedCurrency.symbol}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            
            {/* Amount Input */}
            <View style={[styles.amountInputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TextInput
                style={[styles.amountInput, { color: colors.text, textAlign: 'center' }]}
                placeholder={`${selectedCurrency?.symbol || '$'} 0.00`}
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={amount ? `${selectedCurrency?.symbol || '$'} ${amount}` : ''}
                onChangeText={text => {
                  // Remove symbol and spaces, allow only numbers and dot
                  const clean = text.replace(selectedCurrency?.symbol || '$', '').replace(/\s/g, '').replace(/[^0-9.]/g, '');
                  setAmount(clean);
                }}
                fontSize={24}
                fontWeight="600"
              />
            </View>

            {/* Quick Amount Buttons */}
            <View style={styles.quickAmountsContainer}>
              <Text style={[styles.quickAmountsLabel, { color: colors.textMuted }]}>Quick amounts:</Text>
              <View style={styles.quickAmounts}>
                {quickAmounts.map(quickAmount => (
                  <TouchableOpacity
                    key={quickAmount}
                    style={[styles.quickAmountButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => handleQuickAmount(quickAmount)}
                  >
                    <Text style={[styles.quickAmountText, { color: colors.text }]}>{selectedCurrency?.symbol || '$'}{quickAmount.toLocaleString()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Note Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Note (Optional)</Text>
            <TextInput
              style={[styles.noteInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="What's this for?"
              placeholderTextColor={colors.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Transaction Summary */}
          {selectedRecipient && amount && (
            <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>Transaction Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>To:</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{selectedRecipient.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Amount:</Text>
                <Text style={[styles.summaryValue, { color: colors.primary, fontWeight: '600' }]}>{selectedCurrency?.symbol || '$'}{parseFloat(amount).toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Fee:</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{selectedCurrency?.symbol || '$'}{(parseFloat(amount) * 0.005).toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.text, fontWeight: '600' }]}>Total:</Text>
                <Text style={[styles.summaryValue, { color: colors.primary, fontWeight: '700' }]}>
                  {selectedCurrency?.symbol || '$'}{(parseFloat(amount) * 1.005).toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: colors.primary },
            (!selectedRecipient || !amount || isLoading) && { opacity: 0.6 }
          ]}
          onPress={handleSend}
          disabled={!selectedRecipient || !amount || isLoading}
        >
          {isLoading ? (
            <Text style={[styles.sendButtonText, { color: colors.textInverse }]}>Sending...</Text>
          ) : (
            <>
              <Ionicons name="send" size={20} color={colors.textInverse} />
              <Text style={[styles.sendButtonText, { color: colors.textInverse }]}>Send Money</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Currency Selection Modal */}
        <Modal
          visible={showCurrencyModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCurrencyModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.currencyModal, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.currencyModalHeader}>
                <Text style={[styles.currencyModalTitle, { color: colors.text }]}>Select Currency</Text>
                <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.currencyList} showsVerticalScrollIndicator={false}>
                {availableCurrencies.map((currency) => (
                  <TouchableOpacity
                    key={currency.code}
                    style={[
                      styles.currencyOption,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      selectedCurrency.code === currency.code && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                    ]}
                    onPress={() => handleCurrencySelect(currency)}
                  >
                    <View style={styles.currencyOptionInfo}>
                      <Text style={[styles.currencyOptionCode, { color: colors.text }]}>{currency.code}</Text>
                      <Text style={[styles.currencyOptionName, { color: colors.textMuted }]}>{currency.name}</Text>
                    </View>
                    <Text style={[styles.currencyOptionSymbol, { color: colors.text }]}>{currency.symbol}</Text>
                    {selectedCurrency.code === currency.code && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  backButton: {
    marginRight: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.bodySmall,
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recipientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 4,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    position: 'relative',
  },
  avatarText: {
    ...Typography.h4,
    color: Colors.textInverse,
    fontWeight: 'bold',
  },
  favoriteBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 1,
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    marginBottom: 2,
  },
  recipientPhone: {
    ...Typography.bodySmall,
    marginBottom: 2,
  },
  lastAmount: {
    ...Typography.bodySmall,
    fontSize: 11,
    fontStyle: 'italic',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
  },
  quickAmountsContainer: {
    marginTop: 4,
  },
  quickAmountsLabel: {
    ...Typography.bodySmall,
    marginBottom: 4,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickAmountText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  noteInput: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  summaryCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  summaryTitle: {
    ...Typography.h4,
    marginBottom: 8,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    ...Typography.bodySmall,
  },
  summaryValue: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  summaryDivider: {
    height: 1,
    marginVertical: 8,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: -16,
    borderRadius: 16,
    gap: 8,
    shadowColor: Colors.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonText: {
    ...Typography.button,
    fontWeight: '600',
  },
  // Currency Selector Styles
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 10,
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
    marginTop: 2,
    textAlign: 'center',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  // Currency Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  currencyModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  currencyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  currencyModalTitle: {
    ...Typography.h4,
    fontWeight: '600',
  },
  currencyList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  currencyOptionInfo: {
    flex: 1,
  },
  currencyOptionCode: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  currencyOptionName: {
    ...Typography.bodySmall,
    marginTop: 2,
  },
  currencyOptionSymbol: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default QuickSendModal; 