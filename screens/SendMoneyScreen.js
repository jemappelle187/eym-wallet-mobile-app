import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useTheme } from '../contexts/ThemeContext';

// Import Premium Components
import RecipientSelector from '../components/RecipientSelector';
import CurrencySelector from '../components/CurrencySelector';
import AmountInput from '../components/AmountInput';

const { width, height } = Dimensions.get('window');
const MOCK_CONVERSION_RATE_USD_TO_KES = 130.50;

const SendMoneyScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState({ code: 'USD', symbol: '$', name: 'US Dollar' });
  const [amountData, setAmountData] = useState({ amount: 0, fee: 0, total: 0 });
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('recipient'); // recipient, currency, amount, review

  useEffect(() => {
    if (amountUSD && !isNaN(parseFloat(amountUSD))) {
      const converted = parseFloat(amountUSD) * MOCK_CONVERSION_RATE_USD_TO_KES;
      setAmountKES(converted.toFixed(2));
    } else {
      setAmountKES('');
    }
  }, [amountUSD]);

  const handleSendMoney = async () => {
    if (!selectedRecipient) {
      Alert.alert('Validation Error', 'Please select a recipient to continue.');
      return;
    }
    if (amountData.amount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    Alert.alert(
      'Send Money (Mock)',
      `Successfully sent ${selectedCurrency.symbol}${amountData.amount.toFixed(2)} to ${selectedRecipient.name}. Note: ${note || 'N/A'}`
    );
    setIsLoading(false);
    setSelectedRecipient(null);
    setAmountData({ amount: 0, fee: 0, total: 0 });
    setNote('');
    setCurrentStep('recipient');
  };

  const steps = [
    { key: 'recipient', label: 'Recipient', icon: 'person' },
    { key: 'currency', label: 'Currency', icon: 'card' },
    { key: 'amount', label: 'Amount', icon: 'calculator' },
    { key: 'review', label: 'Review', icon: 'checkmark-circle' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Premium Header */}
        <LinearGradient
          colors={Colors.gradientPrimary}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back-outline" size={24} color={Colors.textInverse} />
            </TouchableOpacity>
            <Text style={[Typography.h2, styles.headerTitle]}>Send Money</Text>
            <TouchableOpacity style={styles.helpButton} activeOpacity={0.7}>
              <Ionicons name="help-circle-outline" size={24} color={Colors.textInverse} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Enhanced Step Indicator */}
          <View style={styles.stepIndicator}>
            {steps.map((step, index) => {
              const isActive = currentStep === step.key;
              const isCompleted = steps.findIndex(s => s.key === currentStep) > index;
              const isNext = steps.findIndex(s => s.key === currentStep) === index;
              
              return (
                <View key={step.key} style={styles.stepContainer}>
                  <View style={styles.stepLineContainer}>
                    {index > 0 && (
                      <View style={[
                        styles.stepLine,
                        { backgroundColor: isCompleted ? Colors.primary : Colors.border }
                      ]} />
                    )}
                <View style={[
                  styles.stepDot,
                      isActive && styles.stepDotActive,
                      isCompleted && styles.stepDotCompleted,
                      { backgroundColor: isCompleted ? Colors.primary : Colors.border }
                    ]}>
                      {isCompleted ? (
                        <Ionicons name="checkmark" size={16} color={Colors.textInverse} />
                  ) : (
                        <Ionicons 
                          name={step.icon} 
                          size={16} 
                          color={isActive ? Colors.textInverse : colors.textMuted} 
                        />
                      )}
                    </View>
                    {index < steps.length - 1 && (
                      <View style={[
                        styles.stepLine,
                        { backgroundColor: isCompleted ? Colors.primary : Colors.border }
                      ]} />
                  )}
                </View>
                  <Text style={[
                    Typography.bodySmall,
                    styles.stepLabel,
                    { color: isActive ? Colors.primary : colors.textMuted },
                    isActive && styles.stepLabelActive
                  ]}>
                    {step.label}
                </Text>
              </View>
              );
            })}
          </View>

          {/* Dynamic Content Based on Step */}
          {currentStep === 'recipient' && (
            <View style={styles.stepContent}>
              <Text style={[Typography.h3, styles.stepTitle, { color: colors.textPrimary }]}>Select Recipient</Text>
              <Text style={[Typography.bodyRegular, styles.stepSubtitle, { color: colors.textMuted }]}>
                Choose who you want to send money to
              </Text>
              
              <RecipientSelector
                onRecipientSelect={(recipient) => {
                  setSelectedRecipient(recipient);
                  setCurrentStep('currency');
                }}
              />
            </View>
          )}

          {currentStep === 'currency' && (
            <View style={styles.stepContent}>
              <Text style={[Typography.h3, styles.stepTitle, { color: colors.textPrimary }]}>Choose Currency</Text>
              <Text style={[Typography.bodyRegular, styles.stepSubtitle, { color: colors.textMuted }]}>
                Select the currency for your transfer
              </Text>
              
              <CurrencySelector
                onCurrencySelect={(currency) => {
                  setSelectedCurrency(currency);
                  setCurrentStep('amount');
                }}
                selectedCurrency={selectedCurrency}
              />
            </View>
          )}

          {currentStep === 'amount' && (
            <View style={styles.stepContent}>
              <Text style={[Typography.h3, styles.stepTitle, { color: colors.textPrimary }]}>Enter Amount</Text>
              <Text style={[Typography.bodyRegular, styles.stepSubtitle, { color: colors.textMuted }]}>
                How much would you like to send?
              </Text>
              
              <AmountInput
                currency={selectedCurrency}
                onAmountChange={setAmountData}
                maxAmount={10000}
              />

              {/* Note Input with Floating Label */}
              <View style={styles.noteSection}>
                <View style={[styles.noteInputContainer, { backgroundColor: Colors.background, borderColor: Colors.border }]}>
                  <Text style={[styles.noteFloatingLabel, { color: Colors.textMuted }]}>
                    Note (Optional)
                  </Text>
                <TextInput
                    style={[styles.noteInput, { color: Colors.textPrimary }]}
                  placeholder="e.g., For school fees, birthday gift..."
                  placeholderTextColor={Colors.textMuted}
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={3}
                />
                </View>
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={[
                  styles.continueButton, 
                  { backgroundColor: colors.cardBackground, borderColor: colors.border },
                  amountData.amount > 0 && styles.continueButtonActive
                ]}
                onPress={() => setCurrentStep('review')}
                disabled={amountData.amount <= 0}
                activeOpacity={0.8}
              >
                <Text style={[
                  Typography.button,
                  styles.continueButtonText,
                  { color: colors.textMuted },
                  amountData.amount > 0 && styles.continueButtonTextActive
                ]}>
                  Continue to Review
                </Text>
                {amountData.amount > 0 && (
                  <Ionicons name="arrow-forward" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          )}

          {currentStep === 'review' && (
            <View style={styles.stepContent}>
              <Text style={[Typography.h3, styles.stepTitle, { color: colors.textPrimary }]}>Review Transfer</Text>
              <Text style={[Typography.bodyRegular, styles.stepSubtitle, { color: colors.textMuted }]}>
                Please confirm your transfer details
              </Text>
              
              {/* Review Card */}
              <View style={[styles.reviewCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.reviewSection}>
                  <Text style={[Typography.label, styles.reviewLabel, { color: colors.textMuted }]}>Recipient</Text>
                  <Text style={[Typography.bodyLarge, styles.reviewValue, { color: colors.textPrimary }]}>
                    {selectedRecipient?.name || 'Not selected'}
                  </Text>
                </View>
                
                <View style={[styles.reviewDivider, { backgroundColor: colors.border }]} />
                
                <View style={styles.reviewSection}>
                  <Text style={[Typography.label, styles.reviewLabel, { color: colors.textMuted }]}>Amount</Text>
                  <Text style={[Typography.h2, styles.reviewValue, { color: colors.textPrimary }]}>
                    {selectedCurrency.symbol}{amountData.amount.toFixed(2)}
                  </Text>
                </View>
                
                <View style={[styles.reviewDivider, { backgroundColor: colors.border }]} />
                
                <View style={styles.reviewSection}>
                  <Text style={[Typography.label, styles.reviewLabel, { color: colors.textMuted }]}>Transfer Fee</Text>
                  <Text style={[Typography.bodyLarge, styles.reviewValue, { color: colors.textPrimary }]}>
                    {selectedCurrency.symbol}{amountData.fee.toFixed(2)}
                  </Text>
                </View>
                
                <View style={[styles.reviewDivider, { backgroundColor: colors.border }]} />
                
                <View style={styles.reviewSection}>
                  <Text style={[Typography.label, styles.reviewLabel, { color: colors.textMuted }]}>Total</Text>
                  <Text style={[Typography.h2, styles.reviewValue, { color: colors.primary }]}>
                    {selectedCurrency.symbol}{amountData.total.toFixed(2)}
                  </Text>
                </View>
                
                {note && (
                  <>
                    <View style={[styles.reviewDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.reviewSection}>
                      <Text style={[Typography.label, styles.reviewLabel, { color: colors.textMuted }]}>Note</Text>
                      <Text style={[Typography.bodyRegular, styles.reviewValue, { color: colors.textPrimary }]}>
                        {note}
                      </Text>
                  </View>
                  </>
                )}
              </View>

              {/* Send Button */}
              <TouchableOpacity
                style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
                onPress={handleSendMoney}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isLoading ? [Colors.textMuted, Colors.textMuted] : Colors.gradientPrimary}
                  style={styles.sendButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                    <ActivityIndicator color={Colors.textInverse} size="small" />
                ) : (
                  <>
                      <Ionicons name="send" size={20} color={Colors.textInverse} />
                      <Text style={[Typography.button, styles.sendButtonText]}>Send Money</Text>
                  </>
                )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.textInverse + '20',
  },
  headerTitle: {
    color: Colors.textInverse,
    fontWeight: '600',
  },
  helpButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.textInverse + '20',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  stepLine: {
    flex: 1,
    height: 2,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  stepDotActive: {
    shadowColor: Colors.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  stepDotCompleted: {
    shadowColor: Colors.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  stepLabelActive: {
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  noteSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  noteInputContainer: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 80,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  noteFloatingLabel: {
    position: 'absolute',
    top: 12,
    left: 16,
    fontWeight: '500',
  },
  noteInput: {
    fontSize: 16,
    fontWeight: '400',
    paddingTop: 20,
    paddingBottom: 8,
    textAlignVertical: 'top',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  continueButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundSecondary,
  },
  continueButtonText: {
    fontWeight: '600',
  },
  continueButtonTextActive: {
    color: Colors.primary,
  },
  reviewCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  reviewSection: {
    marginBottom: 16,
  },
  reviewLabel: {
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reviewValue: {
    fontWeight: '600',
  },
  reviewDivider: {
    height: 1,
    marginVertical: 16,
  },
  sendButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  sendButtonText: {
    color: Colors.textInverse,
    fontWeight: '600',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
});

export default SendMoneyScreen; 