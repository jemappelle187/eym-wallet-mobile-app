import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

const QuickActionsGrid = ({ onActionPress }) => {
  const buttonScale = new Animated.Value(1);

  const actions = [
    {
      id: 'send_money',
      title: 'Send Money',
      subtitle: 'Transfer to friends',
      icon: 'send',
      color: Colors.primary,
    },
    {
      id: 'request_money',
      title: 'Request',
      subtitle: 'Ask for payment',
      icon: 'download',
      color: Colors.success,
    },
    {
      id: 'pay_bills',
      title: 'Pay Bills',
      subtitle: 'Utilities & services',
      icon: 'receipt',
      color: Colors.accent,
    },
    {
      id: 'buy_airtime',
      title: 'Buy Airtime',
      subtitle: 'Mobile credit',
      icon: 'phone-portrait',
      color: Colors.info,
    },
    {
      id: 'pay_in_store',
      title: 'Pay in Store',
      subtitle: 'QR code payments',
      icon: 'qr-code',
      color: Colors.warning,
    },
    {
      id: 'investments',
      title: 'Invest',
      subtitle: 'Grow your money',
      icon: 'trending-up',
      color: Colors.success,
    },
  ];

  const handlePress = (action) => {
    // Enhanced haptic feedback
    if (Platform.OS === 'ios') {
      Vibration.vibrate(50);
    } else {
      Vibration.vibrate(30);
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (onActionPress) {
      onActionPress(action);
    }
  };

  const renderActionButton = (action) => (
    <TouchableOpacity
      key={action.id}
      style={styles.actionButton}
      onPress={() => handlePress(action)}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.buttonContent,
          {
            transform: [{ scale: buttonScale }],
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: action.color + '15' }]}>
          <Ionicons name={action.icon} size={24} color={action.color} />
        </View>
        <Text style={[Typography.bodyRegular, styles.actionTitle]}>{action.title}</Text>
        <Text style={[Typography.bodySmall, styles.actionSubtitle]}>{action.subtitle}</Text>
      </Animated.View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[Typography.h2, styles.sectionTitle]}>Quick Actions</Text>
        <TouchableOpacity style={styles.seeAllButton} activeOpacity={0.7}>
          <Text style={[Typography.bodyRegular, styles.seeAllText]}>See All</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.grid}>
        {actions.map(renderActionButton)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  seeAllText: {
    color: Colors.primary,
    fontWeight: '500',
    marginRight: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    width: '48%',
    marginBottom: 16,
  },
  buttonContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 120,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default QuickActionsGrid; 