import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Animated, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const TransactionSuccessScreen = ({ navigation, route }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const checkmarkAnim = useRef(new Animated.Value(0)).current;

  const transaction = route.params?.transaction || {
    id: 'TXN123456789',
    amount: '150.00',
    currency: 'USD',
    type: 'credit',
    method: 'Credit Card',
    status: 'completed',
    timestamp: new Date().toISOString(),
    recipient: 'John Doe',
    description: 'Payment processed successfully'
  };

  // Determine transaction type and styling
  const isDeposit = transaction.type === 'deposit';
  const isTransfer = transaction.type === 'transfer';
  const isMTN = transaction.provider === 'mtn';
  const isPlaid = transaction.method?.includes('Bank') || transaction.method?.includes('Plaid');
  const isStripe = transaction.method?.includes('Card') || transaction.method?.includes('Stripe');

  useEffect(() => {
    // Main content animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Checkmark animation
    Animated.sequence([
      Animated.delay(400),
      Animated.spring(checkmarkAnim, {
        toValue: 1,
        tension: 200,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

  }, []);

  const handleDone = () => {
    navigation.navigate('Home');
  };

  const handleViewTransaction = () => {
    navigation.navigate('TransactionHistory');
  };

  const getStatusColor = () => {
    if (transaction.status === 'SUCCESSFUL' || transaction.status === 'completed') {
      return '#10B981'; // Green
    } else if (transaction.status === 'PENDING') {
      return '#F59E0B'; // Yellow
    } else {
      return '#EF4444'; // Red
    }
  };

  const getMethodIcon = () => {
    if (isMTN) return '📱';
    if (isPlaid) return '🏦';
    if (isStripe) return '💳';
    return '💰';
  };

  const getMethodColor = () => {
    if (isMTN) return '#FF6B35'; // MTN Orange
    if (isPlaid) return '#1E40AF'; // Plaid Blue
    if (isStripe) return '#6772E5'; // Stripe Purple
    return '#6366F1'; // Default Blue
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {/* Overlay Layer */}
      <View style={styles.overlay} />
      {/* Backdrop Layer */}
      <View style={styles.backdrop} />

      {/* Main Content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        {/* Success Header */}
        <View style={styles.successHeader}>
          <Animated.View 
            style={[
              styles.checkmarkContainer,
              {
                transform: [{ scale: checkmarkAnim }],
                opacity: checkmarkAnim
              }
            ]}
          >
            <View style={[styles.checkmark, { backgroundColor: getStatusColor() }]}>
              <Ionicons name="checkmark" size={32} color="#ffffff" />
            </View>
          </Animated.View>
          
          <Text style={styles.successTitle}>
            {isDeposit ? 'Deposit Successful!' : 'Payment Successful!'}
          </Text>
          <Text style={styles.successSubtitle}>
            {isDeposit 
              ? 'Your money has been added to your wallet' 
              : 'Your transaction has been completed'
            }
          </Text>
        </View>

        {/* Amount Display */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>
            {isDeposit ? 'Amount Added' : 'Amount Paid'}
          </Text>
          <Text style={styles.amountValue}>
            {transaction.currency === 'GHS' ? '₵' : '$'}{transaction.amount}
          </Text>
          {transaction.currency && (
            <Text style={styles.currencyText}>{transaction.currency}</Text>
          )}
        </View>

        {/* Transaction Details */}
        <View style={styles.transactionDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>{getMethodIcon()}</Text>
              <Text style={styles.detailText}>{transaction.method}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color="rgba(255,255,255,0.7)" />
              <Text style={styles.detailText}>
                {isMTN ? 'Instant' : 'Real-time'}
              </Text>
            </View>
          </View>
          
          {transaction.recipient && (
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.7)" />
                <Text style={styles.detailText}>To: {transaction.recipient}</Text>
              </View>
            </View>
          )}
          
          {transaction.transactionId && (
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="receipt-outline" size={20} color="rgba(255,255,255,0.7)" />
                <Text style={styles.detailText}>ID: {transaction.transactionId}</Text>
              </View>
            </View>
          )}
          
          {transaction.status && (
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                <Text style={styles.detailText}>Status: {transaction.status}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleDone}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={20} color="#ffffff" />
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleViewTransaction}
            activeOpacity={0.8}
          >
            <Ionicons name="list-outline" size={20} color="#ffffff" />
            <Text style={styles.secondaryButtonText}>View Transaction</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  amountLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Montserrat',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Montserrat',
    marginBottom: 4,
  },
  currencyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Montserrat',
  },
  transactionDetails: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIcon: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.8)',
  },
  detailText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Montserrat',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: -50, // Adjust as needed for positioning
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    gap: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Montserrat',
  },
};

export default TransactionSuccessScreen; 