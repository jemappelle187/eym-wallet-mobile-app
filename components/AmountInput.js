import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

const AmountInput = ({ 
  currency = { code: 'USD', symbol: '$', name: 'US Dollar' },
  onAmountChange,
  maxAmount = 10000,
  showFeeCalculation = true,
}) => {
  const [amount, setAmount] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showMaxButton, setShowMaxButton] = useState(false);
  
  const inputRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  // Fee calculation (mock data)
  const feeRate = 0.025; // 2.5%
  const fixedFee = 1.00; // $1 fixed fee
  const calculatedFee = amount ? (parseFloat(amount) * feeRate + fixedFee) : 0;
  const totalAmount = amount ? parseFloat(amount) + calculatedFee : 0;

  useEffect(() => {
    if (onAmountChange) {
      onAmountChange({
        amount: parseFloat(amount) || 0,
        fee: calculatedFee,
        total: totalAmount,
      });
    }
  }, [amount, calculatedFee, totalAmount]);

  const handleAmountChange = (text) => {
    // Only allow numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) return;
    
    // Limit total length
    if (cleaned.length > 10) return;
    
    setAmount(cleaned);
    
    // Show max button if amount is significant
    setShowMaxButton(parseFloat(cleaned) > 100);
  };

  const handleMaxAmount = () => {
    setAmount(maxAmount.toString());
    setShowMaxButton(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1.02,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(borderAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const formatAmount = (value) => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const getBorderColor = () => {
    return borderAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [Colors.border, Colors.primary],
    });
  };

  return (
    <View style={styles.container}>
      {/* Currency Display */}
      <View style={styles.currencyHeader}>
        <View style={styles.currencyInfo}>
          <Text style={styles.currencyCode}>{currency.code}</Text>
          <Text style={styles.currencyName}>{currency.name}</Text>
        </View>
        <View style={styles.maxAmountInfo}>
          <Text style={styles.maxAmountLabel}>Max:</Text>
          <Text style={styles.maxAmountValue}>
            {currency.symbol}{maxAmount.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Amount Input */}
      <Animated.View
        style={[
          styles.inputContainer,
          {
            transform: [{ scale: scaleAnim }],
            borderColor: getBorderColor(),
          },
        ]}
      >
        <View style={styles.currencySymbol}>
          <Text style={styles.symbolText}>{currency.symbol}</Text>
        </View>
        
        <TextInput
          ref={inputRef}
          style={styles.amountInput}
          value={formatAmount(amount)}
          onChangeText={handleAmountChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="0.00"
          placeholderTextColor={Colors.textMuted}
          keyboardType="decimal-pad"
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
          autoCorrect={false}
          autoCapitalize="none"
        />

        {showMaxButton && (
          <TouchableOpacity
            style={styles.maxButton}
            onPress={handleMaxAmount}
            activeOpacity={0.7}
          >
            <Text style={styles.maxButtonText}>MAX</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Fee Calculation */}
      {showFeeCalculation && amount && (
        <View style={styles.feeContainer}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Transfer Amount</Text>
            <Text style={styles.feeValue}>
              {currency.symbol}{formatAmount(amount)}
            </Text>
          </View>
          
          <View style={styles.feeRow}>
            <View style={styles.feeBreakdown}>
              <Text style={styles.feeLabel}>Fee</Text>
              <Text style={styles.feeBreakdownText}>
                {feeRate * 100}% + {currency.symbol}{fixedFee}
              </Text>
            </View>
            <Text style={styles.feeValue}>
              {currency.symbol}{calculatedFee.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.feeRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {currency.symbol}{totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      {/* Quick Amount Buttons */}
      <View style={styles.quickAmounts}>
        {[10, 25, 50, 100].map((quickAmount) => (
          <TouchableOpacity
            key={quickAmount}
            style={[
              styles.quickAmountButton,
              amount === quickAmount.toString() && styles.quickAmountButtonActive
            ]}
            onPress={() => setAmount(quickAmount.toString())}
          >
            <Text style={[
              styles.quickAmountText,
              amount === quickAmount.toString() && styles.quickAmountTextActive
            ]}>
              {currency.symbol}{quickAmount}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
        <Text style={styles.securityText}>
          All transactions are secured with bank-level encryption
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  currencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: 'bold',
  },
  currencyName: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: 2,
  },
  maxAmountInfo: {
    alignItems: 'flex-end',
  },
  maxAmountLabel: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  maxAmountValue: {
    ...Typography.bodyRegular,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  currencySymbol: {
    marginRight: 12,
  },
  symbolText: {
    ...Typography.h1,
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 24,
  },
  amountInput: {
    flex: 1,
    ...Typography.h1,
    color: Colors.textPrimary,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  maxButton: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 12,
  },
  maxButtonText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  feeContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feeBreakdown: {
    flex: 1,
  },
  feeLabel: {
    ...Typography.bodyRegular,
    color: Colors.textMuted,
  },
  feeBreakdownText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    fontSize: 12,
  },
  feeValue: {
    ...Typography.bodyRegular,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  totalLabel: {
    ...Typography.bodyRegular,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  totalValue: {
    ...Typography.h3,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickAmountButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickAmountText: {
    ...Typography.bodyRegular,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  quickAmountTextActive: {
    color: Colors.textInverse,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  securityText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginLeft: 8,
    textAlign: 'center',
  },
});

export default AmountInput; 