import React, { useState, useRef, useEffect } from 'react';
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
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Add a utility to convert hex to rgba
function hexToRgba(hex, alpha) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255},${(num >> 8) & 255},${num & 255},${alpha})`;
}

const BalanceCard = ({ balances = [], onCurrencyChange, onActionPress, usdcBalance, eurcBalance, scrollViewRef }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBalance, setShowBalance] = useState(true);
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  // Debug: Log when balances prop changes
  useEffect(() => {
    console.log('🔄 BalanceCard: Balances prop updated:', balances);
  }, [balances]);
  
  // Add visual feedback during swipe
  const cardOpacity = translateX.interpolate({
    inputRange: [-width * 0.3, 0, width * 0.3],
    outputRange: [0.7, 1, 0.7],
    extrapolate: 'clamp',
  });

  const mockBalances = balances.length > 0 ? balances : [
    { currency: 'USD', amount: 1250.50, symbol: '$', color: Colors.primary },
    { currency: 'EUR', amount: 980.25, symbol: '€', color: Colors.accent },
    { currency: 'GHS', amount: 14500.00, symbol: '₵', color: Colors.success },
  ];

  const currentBalance = mockBalances[currentIndex];

  // Call onCurrencyChange when component mounts to sync with HomeScreen
  useEffect(() => {
    if (onCurrencyChange && mockBalances.length > 0) {
      onCurrencyChange(mockBalances[currentIndex]);
    }
  }, []);

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

  // Simplified gesture handling for swipe navigation
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      const threshold = width * 0.2; // Reduced threshold for easier swiping

      if (translationX > threshold) {
        handleSwipe('right');
      } else if (translationX < -threshold) {
        handleSwipe('left');
      } else {
        // Reset position if no swipe was triggered
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
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
        simultaneousHandlers={scrollViewRef}
        shouldCancelWhenOutside={true}
      >
        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: [
                { translateX },
                { scale },
              ],
              opacity: cardOpacity,
            },
          ]}
        >
                      <LinearGradient
              colors={[
                hexToRgba(currentBalance.color, 0.8),
                hexToRgba(currentBalance.color, 0.8)
              ]}
              style={styles.premiumCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
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
              <TouchableOpacity style={[styles.eyeButton, {minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center'}]} onPress={() => { Haptics.selectionAsync(); setShowBalance(v => !v); }} accessibilityLabel={showBalance ? 'Hide balance' : 'Show balance'}>
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

      {/* Navigation Controls */}
      <View style={styles.navigationContainer}>
        {/* Left Arrow */}
        <TouchableOpacity 
          style={styles.navArrow} 
          onPress={() => handleSwipe('right')}
          accessibilityLabel="Previous currency"
        >
          <Ionicons name="chevron-back" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Carousel Dots */}
        <View style={styles.dotsContainer}>
          {mockBalances.map((balance, index) => (
            <TouchableOpacity
              key={balance.currency}
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot
              ]}
              onPress={() => {
                if (index !== currentIndex) {
                  const direction = index > currentIndex ? 'left' : 'right';
                  const steps = Math.abs(index - currentIndex);
                  for (let i = 0; i < steps; i++) {
                    setTimeout(() => handleSwipe(direction), i * 100);
                  }
                }
              }}
              accessibilityLabel={`Switch to ${balance.currency}`}
            />
          ))}
        </View>

        {/* Right Arrow */}
        <TouchableOpacity 
          style={styles.navArrow} 
          onPress={() => handleSwipe('left')}
          accessibilityLabel="Next currency"
        >
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
      
      {/* Swipe Hint */}
      <View style={styles.swipeHint}>
        <Ionicons name="swap-horizontal" size={12} color={Colors.textMuted} />
        <Text style={styles.swipeHintText}>Swipe to switch currencies</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginVertical: 0, // move card even more upwards
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
    // backgroundColor removed to allow gradient transparency
  },
  premiumCard: {
    borderRadius: 28,
    padding: 28,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
    overflow: 'hidden',
    minWidth: width * 0.88, // Card-like width
    maxWidth: 420, // Prevents card from being too wide on large screens
    alignSelf: 'center', // Center the card
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
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  navArrow: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    padding: 8,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
  activeDot: {
    width: 18,
    backgroundColor: Colors.primary,
    opacity: 1,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  swipeHintText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'Montserrat',
    fontWeight: '500',
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