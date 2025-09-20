import React, { useState, useEffect, useContext } from 'react'; // Added useContext
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform, SafeAreaView, ActivityIndicator, Animated, Modal } from 'react-native'; // Added SafeAreaView, ActivityIndicator, Animated, Modal
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
// Assuming TransactionContext might be used to add a transaction after sending
// import { TransactionContext } from '../contexts/TransactionContext';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
];
const MOCK_RATES = {
  'USD_KES': 130.5,
  'USD_NGN': 1500,
  'USD_GHS': 14.5,
  'EUR_KES': 140.0,
  'KES_USD': 0.0077,
  'KES_EUR': 0.0071,
  'NGN_USD': 0.00067,
  'GHS_USD': 0.069,
  // Add more as needed
};

// Remove FloatingLabelInput and use standard labeled inputs
const SendMoneyScreen = ({ navigation }) => {
  // const { addTransaction } = useContext(TransactionContext); // If adding transaction to context
  const [recipient, setRecipient] = useState('');
  const [amountUSD, setAmountUSD] = useState('');
  const [amountKES, setAmountKES] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false); // For send button
  const [fromCurrency, setFromCurrency] = useState(CURRENCIES[0]);
  const [toCurrency, setToCurrency] = useState(CURRENCIES[1]);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);

  useEffect(() => {
    if (amountUSD && !isNaN(parseFloat(amountUSD))) {
      const key = `${fromCurrency.code}_${toCurrency.code}`;
      const rate = MOCK_RATES[key] || 1;
      const converted = parseFloat(amountUSD) * rate;
      setAmountKES(converted.toFixed(2));
    } else {
      setAmountKES('');
    }
  }, [amountUSD, fromCurrency, toCurrency]);

  const handleSendMoney = async () => {
    if (!recipient.trim()) {
      Alert.alert('Recipient Required', 'Please enter recipient details.');
      return;
    }
    if (!amountUSD || parseFloat(amountUSD) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to send.');
      return;
    }
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    setLastTransaction({
      recipient,
      amount: amountUSD,
      converted: amountKES,
      fromCurrency,
      toCurrency,
      note,
    });
    setShowSuccessModal(true);
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} disabled={isLoading}>
          <Ionicons name="arrow-back-outline" size={28} color={Colors.cardBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Money</Text>
        <View style={{width:28}}/> {/* Spacer for centering title */}
      </View>

      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Recipient (Email, Phone, or Username)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., user@example.com"
          placeholderTextColor={Colors.textMuted}
          value={recipient}
          onChangeText={setRecipient}
          editable={!isLoading}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <TouchableOpacity style={[styles.currencySelector, { flex: 1, marginRight: 8 }]} onPress={() => setShowFromPicker(true)} disabled={isLoading}>
            <Text style={styles.currencySelectorText}>{fromCurrency.symbol} {fromCurrency.code}</Text>
            <Text style={styles.currencySelectorSub}>{fromCurrency.name}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.currencySelector, { flex: 1, marginLeft: 8 }]} onPress={() => setShowToPicker(true)} disabled={isLoading}>
            <Text style={styles.currencySelectorText}>{toCurrency.symbol} {toCurrency.code}</Text>
            <Text style={styles.currencySelectorSub}>{toCurrency.name}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>Amount to Send ({fromCurrency.code})</Text>
        <TextInput
          style={styles.input}
          placeholder={`e.g., 50`}
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          value={amountUSD}
          onChangeText={setAmountUSD}
          editable={!isLoading}
        />
        {amountKES ? (
          <View style={styles.conversionBox}>
            <Text style={styles.conversionText}>
              Recipient will receive approx:
              <Text style={styles.conversionAmount}> {toCurrency.code} {amountKES}</Text>
            </Text>
            <Text style={styles.conversionRateText}>
              (Mock rate: 1 {fromCurrency.code} = {MOCK_RATES[`${fromCurrency.code}_${toCurrency.code}`] || 1} {toCurrency.code})
            </Text>
          </View>
        ) : null}
        <Text style={styles.label}>Note (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g., For school fees"
          placeholderTextColor={Colors.textMuted}
          value={note}
          onChangeText={setNote}
          multiline
          editable={!isLoading}
        />
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.sendButton}
        >
        <TouchableOpacity
            style={{ width: '100%', alignItems: 'center', justifyContent: 'center', height: 56 }}
            onPress={handleSendMoney}
            disabled={isLoading}
            activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.cardBackground} />
          ) : (
            <Text style={styles.sendButtonText}>Confirm & Send</Text>
          )}
        </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
      {/* Currency Picker Modals - moved outside ScrollView */}
      <Modal
        visible={showFromPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFromPicker(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Select Sending Currency</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {CURRENCIES.map((cur) => (
                <TouchableOpacity key={cur.code} style={styles.pickerItem} onPress={() => { setFromCurrency(cur); setShowFromPicker(false); }}>
                  <Text style={styles.pickerItemText}>{cur.symbol} {cur.code} - {cur.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowFromPicker(false)} style={styles.pickerCancel}><Text style={styles.pickerCancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showToPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowToPicker(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Select Receiving Currency</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {CURRENCIES.map((cur) => (
                <TouchableOpacity key={cur.code} style={styles.pickerItem} onPress={() => { setToCurrency(cur); setShowToPicker(false); }}>
                  <Text style={styles.pickerItemText}>{cur.symbol} {cur.code} - {cur.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowToPicker(false)} style={styles.pickerCancel}><Text style={styles.pickerCancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Success Modal remains here */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.glassModal}>
            <Text style={styles.modalTitle}>Transfer Successful!</Text>
            {lastTransaction && (
              <View style={{marginVertical: 12}}>
                <Text style={styles.modalDetail}><Text style={styles.modalLabel}>To:</Text> {lastTransaction.recipient}</Text>
                <Text style={styles.modalDetail}><Text style={styles.modalLabel}>Amount:</Text> {lastTransaction.fromCurrency.symbol}{lastTransaction.amount} → {lastTransaction.toCurrency.symbol}{lastTransaction.converted}</Text>
                <Text style={styles.modalDetail}><Text style={styles.modalLabel}>Note:</Text> {lastTransaction.note || 'N/A'}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => {
              setShowSuccessModal(false);
              setRecipient('');
              setAmountUSD('');
              setNote('');
              setAmountKES('');
            }}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    ...Typography.subHeader,
    color: Colors.cardBackground,
    fontSize: 20,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  label: {
    ...Typography.bodyText,
    color: Colors.textMuted,
    marginBottom: 8,
    marginTop: 15,
    fontWeight: '600',
  },
  input: {
    ...Typography.bodyText,
    width: '100%',
    height: 50,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  conversionBox: {
    backgroundColor: Colors.promotionBackground,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  conversionText: {
    ...Typography.bodyText,
    color: Colors.primary,
    fontSize: 15,
  },
  conversionAmount: {
    fontWeight: 'bold',
  },
  conversionRateText: {
    ...Typography.smallText,
    marginTop: 5,
  },
  sendButton: {
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 24,
    width: '100%',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: Colors.textMuted,
  },
  sendButtonText: {
    ...Typography.buttonText,
    color: Colors.cardBackground,
  },
  floatingInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 56,
    position: 'relative',
  },
  inputIcon: {
    marginRight: 12,
  },
  currencySelector: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 5,
    alignItems: 'center',
  },
  currencySelectorText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.primary,
  },
  currencySelectorSub: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerModal: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 350,
    alignItems: 'center',
  },
  pickerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 16,
    color: Colors.primary,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    width: '100%',
  },
  pickerItemText: {
    fontSize: 16,
    color: Colors.primary,
  },
  pickerCancel: {
    marginTop: 12,
  },
  pickerCancelText: {
    color: Colors.red,
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  glassModal: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 24,
    padding: 28,
    width: '85%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backdropFilter: 'blur(12px)', // for web, ignored on native
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 10,
  },
  modalDetail: {
    fontSize: 16,
    color: Colors.primary,
    marginBottom: 4,
  },
  modalLabel: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
  modalCloseBtn: {
    marginTop: 18,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  modalCloseText: {
    color: Colors.cardBackground,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SendMoneyScreen;
