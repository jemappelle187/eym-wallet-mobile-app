import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Vibration,
  Platform,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const BalanceCard = ({ balances = [], onCurrencyChange, onActionPress, usdcBalance, eurcBalance }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBalance, setShowBalance] = useState(true);
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const mockBalances = balances.length > 0 ? balances : [
    { currency: 'USD', amount: 1250.50, symbol: '$', color: Colors.primary },
    { currency: 'EUR', amount: 980.25, symbol: '€', color: Colors.accent },
    { currency: 'GHS', amount: 14500.00, symbol: '₵', color: Colors.success },
  ];

  const currentBalance = mockBalances[currentIndex];

  const handleSwipe = (direction) => {
    Haptics.selectionAsync();
    const newIndex = direction === 'left' 
      ? (currentIndex + 1) % mockBalances.length
      : (currentIndex - 1 + mockBalances.length) % mockBalances.length;

    // Animate card transition
    Animated.sequence([
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: direction === 'left' ? -width : width,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    setCurrentIndex(newIndex);
    if (onCurrencyChange) {
      // Pass the full currency object for HomeScreen to extract .currency
      onCurrencyChange(mockBalances[newIndex]);
    }
  };

  const handleAction = (action) => {
    Haptics.selectionAsync();
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Vibration.vibrate(50);
    } else {
      Vibration.vibrate(30);
    }
    if (onActionPress) onActionPress(action);
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      const threshold = width * 0.3;

      if (translationX > threshold) {
        handleSwipe('right');
      } else if (translationX < -threshold) {
        handleSwipe('left');
      } else {
        // Reset position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Balance Card */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: [
                { translateX },
                { scale },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[currentBalance.color, currentBalance.color + 'CC']}
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.currencyInfo}>
                <Text style={styles.currencyCode}>{currentBalance.currency}</Text>
                <Text style={styles.currencyName}>
                  {currentBalance.currency === 'USD' ? 'US Dollar' :
                   currentBalance.currency === 'EUR' ? 'Euro' :
                   currentBalance.currency === 'GHS' ? 'Ghanaian Cedi' :
                   currentBalance.currency === 'AED' ? 'UAE Dirham' :
                   'Currency'}
                </Text>
              </View>
              <TouchableOpacity style={[styles.eyeButton, {minWidth: 44, minHeight: 44}]} onPress={() => { Haptics.selectionAsync(); setShowBalance(v => !v); }} accessibilityLabel={showBalance ? 'Hide balance' : 'Show balance'}>
                <Ionicons name={showBalance ? 'eye-outline' : 'eye-off-outline'} size={20} color={Colors.textInverse} />
              </TouchableOpacity>
            </View>

            {/* Balance Amount */}
            <View style={[styles.balanceContainer, { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }]}>
              <View>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceAmount}>
                  {showBalance ? `${currentBalance.symbol}${currentBalance.amount.toLocaleString()}` : '••••••'}
                </Text>
              </View>
              {(usdcBalance !== undefined || eurcBalance !== undefined) && (
                <View style={[styles.stackedStableCol, { alignItems: 'flex-end', marginTop: 12 }]}>
                  {usdcBalance !== undefined && (
                    <Text style={styles.stackedStableText}>
                      {showBalance ? `USDC: ${usdcBalance}` : '••••••'}
                    </Text>
                  )}
                  {eurcBalance !== undefined && (
                    <Text style={styles.stackedStableText}>
                      {showBalance ? `EURC: ${eurcBalance}` : '••••••'}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity style={[styles.actionButton, {minWidth: 44, minHeight: 44}]} onPress={() => handleAction({ id: 'deposit', title: 'Add' })} accessibilityLabel="Add Money">
                <Ionicons name="add-circle" size={24} color={Colors.textInverse} />
                <Text style={styles.actionText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, {minWidth: 44, minHeight: 44}]} onPress={() => handleAction({ id: 'send', title: 'Send' })} accessibilityLabel="Send Money">
                <Ionicons name="arrow-up-circle" size={24} color={Colors.textInverse} />
                <Text style={styles.actionText}>Send</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, {minWidth: 44, minHeight: 44}]} onPress={() => handleAction({ id: 'receive', title: 'Receive' })} accessibilityLabel="Receive Money">
                <Ionicons name="arrow-down-circle" size={24} color={Colors.textInverse} />
                <Text style={styles.actionText}>Receive</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, {minWidth: 44, minHeight: 44}]} onPress={() => handleAction({ id: 'withdraw', title: 'Withdraw' })} accessibilityLabel="Withdraw Money">
                <Ionicons name="cash-outline" size={24} color={Colors.textInverse} />
                <Text style={styles.actionText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </PanGestureHandler>

      {/* Carousel Dots: restore to below the card, not inside */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4, marginBottom: 0 }}>
        {mockBalances.map((balance, index) => (
          <View
            key={balance.currency}
            style={{
              width: index === currentIndex ? 18 : 8,
              height: 8,
              borderRadius: 4,
              marginHorizontal: 3,
              backgroundColor: index === currentIndex ? Colors.primary : Colors.border,
              opacity: index === currentIndex ? 1 : 0.5,
            }}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginVertical: 16, // reduced from 24
    alignItems: 'center',
  },
  currencyIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  indicatorDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
    backgroundColor: Colors.border,
    transition: 'width 0.2s',
  },
  cardContainer: {
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
    borderRadius: 24,
    overflow: 'visible',
  },
  card: {
    borderRadius: 24,
    padding: 24, // reduced from 28
    minWidth: width * 0.88,
    backgroundColor: Colors.cardBackground,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currencyInfo: {},
  currencyCode: {
    fontWeight: '700',
    fontSize: 16,
    marginRight: 4,
    color: Colors.textInverse,
  },
  currencyName: {
    fontSize: 12,
    color: Colors.textInverse,
    opacity: 0.8,
  },
  currencyFlag: {
    fontSize: 20,
    marginRight: 6,
  },
  eyeButton: {
    padding: 6,
    // Removed borderRadius and backgroundColor for premium look
  },
  balanceContainer: {
    marginBottom: 14, // reduced from 18
  },
  balanceLabel: {
    fontSize: 13,
    color: Colors.textInverse,
    opacity: 0.7,
    marginBottom: 2,
  },
  balanceAmount: {
    fontWeight: '700',
    fontSize: 28,
    color: Colors.textInverse,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: 8, // reduced from 12
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    marginHorizontal: 0,
    // Removed backgroundColor, borderRadius, shadow for premium look
  },
  actionText: {
    ...Typography.bodySmall,
    color: Colors.textInverse,
    marginTop: 4,
    fontWeight: '600',
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    padding: 6,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  leftArrow: {
    left: 0,
  },
  rightArrow: {
    right: 0,
  },
  stackedStableCol: {
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  stackedStableText: {
    ...Typography.bodySmall,
    color: Colors.textInverse,
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.10)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
    textAlign: 'right',
  },
});

export default BalanceCard; 