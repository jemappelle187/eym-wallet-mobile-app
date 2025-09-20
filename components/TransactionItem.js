import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

const TransactionItem = ({ item, onPress }) => {
  const isDebit = item.type === 'sent' || item.type === 'withdrawal' || item.type === 'pay_in_store';
  const amountColor = isDebit ? Colors.error : Colors.success;
  const amountPrefix = isDebit ? '-' : '+';

  let iconName = 'help-circle-outline';
  if (item.type === 'received') iconName = 'arrow-down-outline';
  else if (item.type === 'sent') iconName = 'arrow-up-outline';
  else if (item.type === 'deposit') iconName = 'wallet-outline';
  else if (item.type === 'withdrawal') iconName = 'cash-outline';
  else if (item.type === 'pay_in_store') iconName = 'cart-outline';

  let title = '';
  if (item.type === 'received') title = `Received from ${item.from}`;
  else if (item.type === 'sent') title = `Sent to ${item.to}`;
  else if (item.type === 'deposit') title = `Deposited via ${item.method}`;
  else if (item.type === 'withdrawal') title = `Withdrew to ${item.method}`;
  else if (item.type === 'pay_in_store') title = `Paid at ${item.merchant}`;

  return (
    <TouchableOpacity style={styles.transactionItem} onPress={() => onPress(item)}>
      <View style={[styles.transactionIconContainer, {backgroundColor: isDebit ? 'rgba(211, 47, 47, 0.1)' : 'rgba(0, 200, 83, 0.1)'}]}>
        <Ionicons name={iconName} size={24} color={amountColor} />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.transactionDate}>
          {item.date} -
          <Text style={{
            color: item.status === 'Pending' ? Colors.warning : (item.status === 'Completed' ? Colors.success : Colors.textMuted),
            fontWeight: item.status === 'Pending' ? 'bold' : 'normal'
          }}>
            {item.status}
          </Text>
        </Text>
      </View>
      <Text style={[styles.transactionAmount, { color: amountColor }]}> 
        {amountPrefix}{item.currency} {item.amount}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  transactionItem: {
    backgroundColor: Colors.cardBackground,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  transactionIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
    marginRight: 8,
  },
  transactionTitle: {
    ...Typography.bodyText,
    color: Colors.text,
    marginBottom: 1,
  },
  transactionDate: {
    ...Typography.smallText,
    color: Colors.textMuted,
  },
  transactionAmount: {
    ...Typography.bodyText,
    fontWeight: 'bold',
  },
});

export default TransactionItem; 