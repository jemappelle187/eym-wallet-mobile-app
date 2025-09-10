import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Colors } from '../constants/Colors';

const WithdrawScreen = ({ navigation, isModal, onClose }) => {
  const { colors = Colors } = useTheme();
  console.log('colors in WithdrawScreen:', colors);
  const [amount, setAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState(null); // e.g., 'bank_account', 'mobile_wallet'
  const currencyOptions = [
    { code: 'GHS', symbol: '₵', country: 'Ghana', flag: '🇬🇭' },
    { code: 'USD', symbol: '$', country: 'United States', flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', country: 'European Union', flag: '🇪🇺' },
    { code: 'AED', symbol: 'د.إ', country: 'United Arab Emirates', flag: '🇦🇪' },
    { code: 'NGN', symbol: '₦', country: 'Nigeria', flag: '🇳🇬' },
  ];
  const [selectedCurrency, setSelectedCurrency] = useState(currencyOptions[0]);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  const handleWithdraw = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }
    if (!withdrawalMethod) {
      Alert.alert('Validation Error', 'Please select a withdrawal method.');
      return;
    }
    // Mock withdrawal action
    Alert.alert('Success', `Withdrawal of $${amount} to ${withdrawalMethod} initiated successfully.`);
    setAmount('');
    setWithdrawalMethod(null);
    // navigation.goBack();
  };

  // Mock withdrawal methods
  const withdrawalOptions = [
    { id: 'bank_account', label: 'Bank Account', icon: 'business-outline' },
    { id: 'usdc_wallet', label: 'USDC/EURC/SOL', icon: 'wallet-outline' },
    { id: 'mobile_wallet', label: 'MoMo Wallet', icon: 'phone-portrait-outline' },
    // Add other methods as needed
  ];

  if (isModal) {
    return (
      <View style={[styles.modalCardContent, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <ScrollView
          style={styles.modalScrollView}
          contentContainerStyle={[styles.modalScrollContent, {paddingBottom: 32}]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
        {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        )}
          <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>Withdraw Funds</Text>
          
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
              style={[styles.modalAmountInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                              placeholder={`${selectedCurrency?.symbol || '$'} 0.00`}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          {/* Withdrawal Methods */}
          <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Withdrawal Method</Text>
          {withdrawalOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.modalPaymentOption,
                { backgroundColor: colors.background, borderColor: colors.border },
                withdrawalMethod === option.id && { backgroundColor: colors.lightBlue, borderColor: colors.primary },
              ]}
              onPress={() => setWithdrawalMethod(option.id)}
              activeOpacity={0.85}
            >
              <View style={styles.paymentMethodContent}>
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={withdrawalMethod === option.id ? colors.primary : colors.text}
                />
                <View style={styles.paymentMethodInfo}>
                  <Text style={[styles.paymentMethodLabel, { color: colors.text }]}>{option.label}</Text>
                  <Text style={[styles.paymentMethodDescription, { color: colors.textMuted }]}>
                    {option.id === 'bank_account' ? 'Withdraw to bank account' :
                     option.id === 'usdc_wallet' ? 'Withdraw cryptocurrency' :
                     option.id === 'mobile_wallet' ? 'Withdraw to mobile money' : 'Withdraw funds'}
                  </Text>
                  <Text style={[styles.paymentMethodFees, { color: colors.textMuted }]}>
                    {option.id === 'bank_account' ? 'Free • 1-2 business days' :
                     option.id === 'usdc_wallet' ? 'Low fees • Instant' :
                     option.id === 'mobile_wallet' ? 'Free • Instant' : 'Free • Instant'}
                  </Text>
                </View>
              </View>
              {withdrawalMethod === option.id && (
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity 
            style={[styles.modalActionButton, { backgroundColor: colors.primary }]} 
            onPress={handleWithdraw}
            activeOpacity={0.8}
          >
            <Text style={[styles.modalActionButtonText, { color: colors.textInverse }]}>Confirm Withdrawal</Text>
        </TouchableOpacity>
        </ScrollView>

        {/* Currency Selection Modal */}
        <Modal
          visible={showCurrencyModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCurrencyModal(false)}
        >
          <TouchableOpacity style={styles.currencyModalOverlay} activeOpacity={1} onPress={() => setShowCurrencyModal(false)}>
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
                  onPress={() => {
                    setSelectedCurrency(opt);
                    setShowCurrencyModal(false);
                  }}
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
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw Funds</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Enter Amount (USD)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 50"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Select Withdrawal Method</Text>
        {withdrawalOptions.map(option => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.paymentOption, // Reusing paymentOption style
              withdrawalMethod === option.id && styles.selectedPaymentOption // Reusing selected style
            ]}
            onPress={() => setWithdrawalMethod(option.id)}
          >
            <Ionicons
              name={option.icon}
              size={24}
              color={withdrawalMethod === option.id ? '#fff' : '#004AAD'}
              style={styles.paymentIcon} // Reusing icon style
            />
            <Text
              style={[
                styles.paymentOptionText, // Reusing text style
                withdrawalMethod === option.id && styles.selectedPaymentOptionText // Reusing selected text style
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw}>
          <Text style={styles.withdrawButtonText}>Confirm Withdrawal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  header: {
    backgroundColor: '#004AAD',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    width: '100%',
    height: 44,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingHorizontal: 12,
    marginBottom: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  paymentOption: { // Reused from DepositScreen styles for consistency
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    marginBottom: 6,
    shadowColor: '#1e40af10',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedPaymentOption: { // Reused
    backgroundColor: '#dbeafe',
    borderColor: '#1e40af',
  },
  paymentIcon: { // Reused
    marginRight: 10,
  },
  paymentOptionText: { // Reused
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedPaymentOptionText: { // Reused
    color: '#1e293b',
  },
  withdrawButton: {
    backgroundColor: '#FF3B30', // A warning/action red
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardContent: {
    backgroundColor: '#f8fafc',
    borderRadius: 22,
    padding: 10,
    shadowColor: '#1e40af22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedIcon: {
    position: 'absolute',
    right: 10,
  },
  currencySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 4,
    marginTop: 0,
    shadowColor: '#1e40af10',
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
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'center',
    alignSelf: 'center',
  },
  currencySelectorSymbol: {
    color: '#64748b',
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
  currencyModalContent: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 24,
    width: 280,
    alignItems: 'center',
    shadowColor: '#1e40af22',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 15,
  },
  currencyModalTitle: {
    fontSize: 18,
    color: '#1e293b',
    fontWeight: '700',
    marginBottom: 16,
  },
  // Modal styles (matching DepositScreen)
  modalCardContent: {
    width: 320,
    maxWidth: '90%',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#1e40af22',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 15,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingTop: 8,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    padding: 4,
  },
  modalHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalCurrencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  currencyFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  currencyCountry: {
    fontSize: 12,
    fontWeight: '400',
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAmountInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  modalPaymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodInfo: {
    marginLeft: 12,
    flex: 1,
  },
  paymentMethodLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  paymentMethodDescription: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 2,
  },
  paymentMethodFees: {
    fontSize: 11,
    fontWeight: '500',
  },
  modalActionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  modalActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  currencyModalInfo: {
    flex: 1,
    marginLeft: 12,
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
  currencyModalOptionActive: {
    backgroundColor: '#dbeafe',
  },
});

export default WithdrawScreen; 