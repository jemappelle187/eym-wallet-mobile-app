// PaymentExample.js - Example integration of PaymentIntegration component
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import PaymentIntegration from './PaymentIntegration';

const PaymentExample = () => {
  const [showDepositPayment, setShowDepositPayment] = useState(false);
  const [showSendPayment, setShowSendPayment] = useState(false);
  const [showWithdrawPayment, setShowWithdrawPayment] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);

  const handlePaymentSuccess = (result) => {
    console.log('Payment successful:', result);
    
    // Add transaction to recent transactions
    const newTransaction = {
      id: result.transactionId || `txn_${Date.now()}`,
      type: result.paymentType || 'deposit',
      amount: result.amount,
      currency: result.currency,
      method: result.provider,
      status: 'completed',
      timestamp: new Date().toISOString(),
      description: `${result.paymentType || 'Payment'} via ${result.provider}`
    };
    
    setRecentTransactions(prev => [newTransaction, ...prev.slice(0, 4)]);
    
    Alert.alert(
      'Payment Successful!',
      `Your ${result.paymentType || 'payment'} of ${result.currency}${result.amount} has been processed successfully.`,
      [{ text: 'OK' }]
    );
  };

  const handlePaymentError = (error) => {
    console.log('Payment failed:', error);
    
    Alert.alert(
      'Payment Failed',
      error.message || 'There was an error processing your payment. Please try again.',
      [{ text: 'OK' }]
    );
  };

  const renderPaymentCard = (title, subtitle, icon, onPress, gradient) => (
    <TouchableOpacity style={styles.paymentCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={gradient}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardIcon}>
            <Ionicons name={icon} size={32} color="white" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSubtitle}>{subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="white" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderTransactionItem = (transaction) => (
    <View key={transaction.id} style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Ionicons 
          name={transaction.type === 'deposit' ? 'arrow-down-circle' : 'arrow-up-circle'} 
          size={24} 
          color={transaction.type === 'deposit' ? Colors.success : Colors.primary} 
        />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionTitle}>{transaction.description}</Text>
        <Text style={styles.transactionMethod}>{transaction.method}</Text>
      </View>
      <View style={styles.transactionAmount}>
        <Text style={styles.transactionAmountText}>
          {transaction.type === 'deposit' ? '+' : '-'}{transaction.currency}{transaction.amount}
        </Text>
        <Text style={styles.transactionStatus}>{transaction.status}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <Text style={styles.headerSubtitle}>Test different payment integrations</Text>
      </View>

      {/* Payment Options */}
      <View style={styles.paymentSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        {renderPaymentCard(
          'Add Money',
          'Deposit funds to your wallet',
          'add-circle',
          () => setShowDepositPayment(true),
          [Colors.success, '#10b981']
        )}
        
        {renderPaymentCard(
          'Send Money',
          'Transfer to contacts or bank',
          'arrow-up-circle',
          () => setShowSendPayment(true),
          [Colors.primary, '#3b82f6']
        )}
        
        {renderPaymentCard(
          'Withdraw',
          'Cash out to bank or mobile',
          'remove-circle',
          () => setShowWithdrawPayment(true),
          [Colors.warning, '#f59e0b']
        )}
      </View>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {recentTransactions.map(renderTransactionItem)}
        </View>
      )}

      {/* Payment Integration Components */}
      <PaymentIntegration
        isVisible={showDepositPayment}
        onClose={() => setShowDepositPayment(false)}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        paymentType="deposit"
        defaultAmount="100"
        defaultCurrency="USD"
      />

      <PaymentIntegration
        isVisible={showSendPayment}
        onClose={() => setShowSendPayment(false)}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        paymentType="send"
        defaultAmount="50"
        defaultCurrency="USD"
      />

      <PaymentIntegration
        isVisible={showWithdrawPayment}
        onClose={() => setShowWithdrawPayment(false)}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        paymentType="withdraw"
        defaultAmount="75"
        defaultCurrency="USD"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    lineHeight: 24,
  },
  paymentSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  paymentCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 20,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  transactionsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  transactionMethod: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  transactionStatus: {
    fontSize: 12,
    color: Colors.success,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
});

export default PaymentExample;
