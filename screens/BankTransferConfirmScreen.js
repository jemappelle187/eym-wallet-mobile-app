import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useLanguage } from '../contexts/LanguageContext';
import { Typography } from '../constants/Typography';
import { ROUTES } from '../navigation/routes';
import * as Haptics from 'expo-haptics';

const currencyOptions = [
  { code: 'EUR', symbol: '€', flag: '🇪🇺' },
  { code: 'USD', symbol: '$', flag: '🇺🇸' },
  { code: 'GBP', symbol: '£', flag: '🇬🇧' },
];

const BankTransferConfirmScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { t, language } = useLanguage();

  const amount = parseFloat(route.params?.amount) || 0;
  const currency = route.params?.currency ?? 'EUR';
  const bank = route.params?.bank ?? { name: 'Bank Account', accountMask: '1234' };
  
  const selectedCurrency = currencyOptions.find(c => c.code === currency) || currencyOptions[0];
  
  const fee = 0.0; // No fees for now
  const eta = '≈30s';

  const getStablecoinSymbol = (currencyCode) => {
    return currencyCode === 'EUR' ? 'EURC' : 'USDC';
  };

  const handleConfirm = () => {
    // Haptic feedback on confirm
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(ROUTES.BANK_PROCESSING, { 
      amount,
      currency,
      bank
    });
  };

  const Row = ({ label, value, bold = false }) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowValueBold]}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <SafeAreaView style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review</Text>
        <View style={styles.placeholder} />
      </SafeAreaView>

      <View style={styles.content}>
        {/* Amount Display */}
        <View style={styles.amountSection}>
          <Text style={styles.amountText}>{selectedCurrency.symbol}{amount.toFixed(2)}</Text>
          <Text style={styles.amountSubtext}>{amount.toFixed(2)} {getStablecoinSymbol(selectedCurrency.code)}</Text>
        </View>


        {/* Transaction Details */}
        <View style={styles.detailsSection}>
          <Row label="Send from" value={`${bank.name} · •••• ${bank.accountMask}`} />
          <Row label="Average time" value={eta} />
          <Row label="Fees" value={`€ ${fee.toFixed(2)}`} />
          <Row label={`Rate ${currency} → ${currency === 'EUR' ? 'EURC' : 'USDC'}`} value="1.0000" />
          <Row label="Total" value={`€ ${amount.toFixed(2)}`} bold />
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>Confirm & Add Money</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
    backgroundColor: 'transparent',
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  amountSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  amountText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
  },
  amountSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: Typography.fontFamily,
    marginTop: 8,
  },
  detailsSection: {
    flex: 1,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: Typography.fontFamily,
  },
  rowValue: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  rowValueBold: {
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
});

export default BankTransferConfirmScreen;
