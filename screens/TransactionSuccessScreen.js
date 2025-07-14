import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useNavigation, useRoute } from '@react-navigation/native';

const TransactionSuccessScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { transactionData } = route.params || {};
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [checkmarkAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate in the success screen
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate checkmark after a delay
    setTimeout(() => {
      Animated.spring(checkmarkAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 300);
  }, []);

  const handleDone = () => {
    navigation.navigate('HomeDashboard');
  };

  const handleViewTransaction = () => {
    navigation.navigate('Activity');
  };

  const handleSendAgain = () => {
    navigation.navigate('SendFlowModal');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Animated.View
              style={{
                transform: [{ scale: checkmarkAnim }]
              }}
            >
              <Ionicons name="checkmark" size={48} color={Colors.textInverse} />
            </Animated.View>
          </View>
        </View>

        {/* Success Message */}
        <Text style={styles.successTitle}>Money Sent Successfully!</Text>
        <Text style={styles.successSubtitle}>
          Your transaction has been processed and the recipient will receive the funds shortly.
        </Text>

        {/* Transaction Details */}
        {transactionData && (
          <View style={styles.transactionCard}>
            <Text style={styles.cardTitle}>Transaction Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount Sent</Text>
              <Text style={styles.detailValue}>
                {transactionData.sendAmount} {transactionData.sendCurrency}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Recipient Gets</Text>
              <Text style={[styles.detailValue, { color: Colors.success }]}>
                {transactionData.receiveAmount} {transactionData.receiveCurrency}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Recipient</Text>
              <Text style={styles.detailValue}>{transactionData.recipientName}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction ID</Text>
              <Text style={styles.detailValue}>#{Math.random().toString(36).substr(2, 9).toUpperCase()}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Delivery Time</Text>
              <Text style={[styles.detailValue, { color: Colors.success }]}>
                {transactionData.deliveryTime || '2-5 minutes'}
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]} 
            onPress={handleDone}
          >
            <Ionicons name="home-outline" size={20} color={Colors.textInverse} />
            <Text style={styles.primaryButtonText}>Done</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]} 
            onPress={handleViewTransaction}
          >
            <Ionicons name="list-outline" size={20} color={Colors.primary} />
            <Text style={styles.secondaryButtonText}>View Transaction</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]} 
            onPress={handleSendAgain}
          >
            <Ionicons name="send-outline" size={20} color={Colors.primary} />
            <Text style={styles.secondaryButtonText}>Send Again</Text>
          </TouchableOpacity>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
          <Text style={styles.securityText}>
            Your transaction is secure and protected by our encryption.
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    ...Typography.bodyLarge,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  transactionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 32,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: 16,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    ...Typography.bodyRegular,
    color: Colors.textMuted,
  },
  detailValue: {
    ...Typography.bodyRegular,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  actionButtons: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    ...Typography.button,
    color: Colors.textInverse,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    ...Typography.button,
    color: Colors.primary,
    fontWeight: '600',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '10',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.success + '30',
    gap: 8,
  },
  securityText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
  },
});

export default TransactionSuccessScreen; 