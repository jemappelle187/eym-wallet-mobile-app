import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';
import { formatMoney } from '../utils/moneyFormatting';

const SuccessActions = ({
  amount,
  currency,
  onSendNow,
  onViewBalance,
  onSetRecurring,
  transactionId
}) => {
  const { colors } = useTheme();

  const actions = [
    {
      id: 'send',
      icon: 'send-outline',
      label: `Send ${formatMoney(amount, currency)}`,
      subtitle: 'to a contact',
      onPress: onSendNow,
      color: Colors.primary
    },
    {
      id: 'balance',
      icon: 'wallet-outline',
      label: 'View balance',
      subtitle: 'See updated funds',
      onPress: onViewBalance,
      color: Colors.success
    },
    {
      id: 'recurring',
      icon: 'repeat-outline',
      label: 'Set recurring',
      subtitle: 'Auto-deposit weekly',
      onPress: onSetRecurring,
      color: Colors.accent
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        What's next?
      </Text>
      
      <View style={styles.actionsGrid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionCard, { borderColor: colors.border }]}
            onPress={action.onPress}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, { backgroundColor: action.color + '20' }]}>
              <Ionicons name={action.icon} size={20} color={action.color} />
            </View>
            
            <View style={styles.textContainer}>
              <Text style={[styles.actionLabel, { color: colors.text }]}>
                {action.label}
              </Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                {action.subtitle}
              </Text>
            </View>
            
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
      
      {transactionId && (
        <View style={styles.transactionIdContainer}>
          <Text style={[styles.transactionIdLabel, { color: colors.textSecondary }]}>
            Transaction ID:
          </Text>
          <Text style={[styles.transactionId, { color: colors.text }]}>
            {transactionId}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 20,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
  },
  transactionIdContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
  },
  transactionIdLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  transactionId: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default SuccessActions;

