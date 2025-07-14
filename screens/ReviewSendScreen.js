// sendnreceive-app/screens/ReviewSendScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useNavigation, useRoute } from '@react-navigation/native';

const formatCurrencyForReview = (amount, currencyCode) => {
  return `${amount.toFixed(2)} ${currencyCode}`;
};

const ReviewSendScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false);
  const {
    selectedRecipient,
    sendAmount,
    receiveAmount,
    sendCurrency,
    receiveCurrency,
    exchangeRate,
  } = route.params;

  // Enhanced fee calculation with different rates for different recipient types
  const calculateFees = (amount, recipientType) => {
    const baseFee = 0.01; // 1%
    const mobileMoneyFee = 0.005; // 0.5% for mobile money
    const bankFee = 0.015; // 1.5% for bank transfers
    
    const feeRate = recipientType === 'mobile_money' ? mobileMoneyFee : bankFee;
    const fee = amount * feeRate;
    const savings = recipientType === 'mobile_money' ? (amount * (baseFee - mobileMoneyFee)) : 0;
    
    return {
      fee,
      feeRate: feeRate * 100,
      total: amount + fee,
      savings
    };
  };

  const feeDetails = calculateFees(sendAmount, selectedRecipient.isMobileMoney ? 'mobile_money' : 'bank');
  const calculatedFee = feeDetails.fee;
  const totalToSend = feeDetails.total;

  const handleConfirmAndSend = () => {
    // Logic to initiate the actual transaction
    // For now, show an alert and navigate back to home or a success screen
    Alert.alert(
      "Confirm & Send",
      `Sending ${formatCurrencyForReview(sendAmount, sendCurrency.code)} to ${selectedRecipient.name}.\nTotal including fees: ${formatCurrencyForReview(totalToSend, sendCurrency.code)}.\n\nThis is a mock action. No real transaction will occur.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: () => {
            navigation.navigate('TransactionSuccess', {
              transactionData: {
                sendAmount: formatCurrencyForReview(sendAmount, sendCurrency.code),
                receiveAmount: formatCurrencyForReview(receiveAmount, receiveCurrency.code),
                sendCurrency: sendCurrency.code,
                receiveCurrency: receiveCurrency.code,
                recipientName: selectedRecipient.name,
                deliveryTime: getDeliveryTime(selectedRecipient.isMobileMoney ? 'mobile_money' : 'bank', sendAmount),
              }
            });
          }
        }
      ]
    );
  };

  const getDeliveryTime = (recipientType, amount) => {
    if (recipientType === 'mobile_money') {
      return amount > 1000 ? '2-5 minutes' : 'Instant';
    }
    return '1-3 business days';
  };

  const DetailRow = ({ label, value, isEmphasized = false, valueColor, icon }) => (
    <View style={styles.detailRow}>
      <View style={styles.detailLabelContainer}>
        {icon && <Ionicons name={icon} size={16} color={Colors.textMuted} style={styles.detailIcon} />}
      <Text style={isEmphasized ? styles.detailLabelEmphasized : styles.detailLabel}>{label}</Text>
      </View>
      <Text style={[isEmphasized ? styles.detailValueEmphasized : styles.detailValue, valueColor && {color: valueColor}]}>
        {value}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={Typography.h2}>Review & Send</Text>
        <View style={{width: 40}} /> {/* Spacer */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Transaction Summary</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recipient</Text>
            <DetailRow label="Name" value={selectedRecipient.name} icon="person" />
            <DetailRow
              label={selectedRecipient.isMobileMoney ? "Mobile Number" : "Bank Details"}
              value={selectedRecipient.isMobileMoney ? selectedRecipient.mobileNumber : `${selectedRecipient.bankName} - ${selectedRecipient.accountNumber}`}
              icon={selectedRecipient.isMobileMoney ? "phone-portrait" : "business"}
            />
            <DetailRow 
              label="Delivery Time" 
              value={getDeliveryTime(selectedRecipient.isMobileMoney ? 'mobile_money' : 'bank', sendAmount)}
              valueColor={Colors.success}
              icon="time"
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amounts</Text>
            <DetailRow label="You Send" value={formatCurrencyForReview(sendAmount, sendCurrency.code)} icon="arrow-up" />
            <DetailRow label="Exchange Rate" value={`1 ${sendCurrency.code} ≈ ${exchangeRate.toFixed(4)} ${receiveCurrency.code}`} icon="swap-horizontal" />
            <DetailRow label={`${selectedRecipient.name} Gets`} value={formatCurrencyForReview(receiveAmount, receiveCurrency.code)} isEmphasized valueColor={Colors.success} icon="arrow-down" />
          </View>

          <View style={styles.separator} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fees & Total</Text>
            <TouchableOpacity 
              style={styles.feeBreakdownHeader}
              onPress={() => setShowFeeBreakdown(!showFeeBreakdown)}
            >
              <DetailRow label="Transaction Fee" value={formatCurrencyForReview(calculatedFee, sendCurrency.code)} icon="card" />
              <Ionicons 
                name={showFeeBreakdown ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={Colors.textMuted} 
              />
            </TouchableOpacity>
            
            {showFeeBreakdown && (
              <View style={styles.feeBreakdownDetails}>
                <DetailRow label="Base Fee" value={`${feeDetails.feeRate}%`} icon="calculator" />
                <DetailRow label="Processing Fee" value={formatCurrencyForReview(calculatedFee * 0.3, sendCurrency.code)} icon="card-outline" />
                <DetailRow label="Network Fee" value={formatCurrencyForReview(calculatedFee * 0.7, sendCurrency.code)} icon="wifi" />
                {feeDetails.savings > 0 && (
                  <DetailRow 
                    label="Mobile Money Savings" 
                    value={`-${formatCurrencyForReview(feeDetails.savings, sendCurrency.code)}`} 
                    valueColor={Colors.success}
                    icon="checkmark-circle"
                  />
                )}
              </View>
            )}
            
            <DetailRow label="Total You Pay" value={formatCurrencyForReview(totalToSend, sendCurrency.code)} isEmphasized icon="wallet" />
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.securitySection}>
          <View style={styles.securityHeader}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
            <Text style={styles.securityTitle}>Secure Transaction</Text>
          </View>
          <Text style={styles.securityText}>
            This transaction is protected with end-to-end encryption and secure authentication.
          </Text>
        </View>

        <Text style={styles.termsText}>
          By tapping "Confirm & Send", you agree to our Terms of Service and Privacy Policy.
          Ensure all details are correct before sending.
        </Text>

      </ScrollView>

      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmAndSend}>
        <MaterialCommunityIcons name="check-circle-outline" size={22} color={Colors.textOnPrimaryCTA} style={{marginRight: 8}}/>
        <Text style={Typography.button}>Confirm & Send</Text>
      </TouchableOpacity>
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
  summaryCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    ...Typography.h3,
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.textPrimary,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textSecondary,
    marginBottom: 10,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    marginRight: 6,
  },
  feeBreakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feeBreakdownDetails: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  detailLabel: {
    ...Typography.bodyRegular,
    color: Colors.textSecondary,
  },
  detailValue: {
    ...Typography.bodyRegular,
    color: Colors.textPrimary,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  detailLabelEmphasized: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  detailValueEmphasized: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  securitySection: {
    backgroundColor: Colors.success + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  securityTitle: {
    ...Typography.bodySmall,
    color: Colors.success,
    fontWeight: '600',
    marginLeft: 8,
  },
  securityText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  termsText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    marginHorizontal: 10,
    marginBottom: 20,
    lineHeight: 18,
  },
  confirmButton: {
    backgroundColor: Colors.brandPurple,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: Platform.OS === 'ios' ? 0 : 20,
    marginTop: 10,
  },
});

export default ReviewSendScreen;
