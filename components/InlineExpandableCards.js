import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const InlineExpandableCards = ({ 
  isVisible, 
  onClose, 
  navigation,
  onDepositConfirmed 
}) => {
  const [expandedCard, setExpandedCard] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const actions = [
    {
      id: 'deposit',
      title: 'Add Money',
      subtitle: 'Deposit funds to your wallet',
      icon: 'add-circle',
      color: Colors.success,
      gradient: [Colors.success, '#10b981'],
      options: [
        { id: 'card', title: 'Credit/Debit Card', icon: 'card-outline', subtitle: 'Instant deposit' },
        { id: 'bank', title: 'Bank Transfer', icon: 'business-outline', subtitle: 'Free transfer' },
        { id: 'mobile', title: 'Mobile Money', icon: 'phone-portrait-outline', subtitle: 'Quick & easy' },
        { id: 'crypto', title: 'Cryptocurrency', icon: 'logo-bitcoin', subtitle: 'USDC, EURC, SOL' },
      ],
    },
    {
      id: 'send',
      title: 'Send Money',
      subtitle: 'Transfer to contacts or bank',
      icon: 'arrow-up-circle',
      color: Colors.primary,
      gradient: [Colors.primary, '#3b82f6'],
      options: [
        { id: 'quick', title: 'Quick Send', icon: 'flash-outline', subtitle: 'Send to contacts' },
        { id: 'bank', title: 'Bank Transfer', icon: 'business-outline', subtitle: 'Send to bank' },
        { id: 'mobile', title: 'Mobile Money', icon: 'phone-portrait-outline', subtitle: 'Send to mobile' },
        { id: 'international', title: 'International', icon: 'globe-outline', subtitle: 'Global transfer' },
      ],
    },
    {
      id: 'receive',
      title: 'Receive Money',
      subtitle: 'Get paid via QR or link',
      icon: 'arrow-down-circle',
      color: Colors.accent,
      gradient: [Colors.accent, '#8b5cf6'],
      options: [
        { id: 'qr', title: 'QR Code', icon: 'qr-code-outline', subtitle: 'Show QR to receive' },
        { id: 'link', title: 'Payment Link', icon: 'link-outline', subtitle: 'Share payment link' },
        { id: 'account', title: 'Account Details', icon: 'card-outline', subtitle: 'Share account info' },
        { id: 'invoice', title: 'Generate Invoice', icon: 'receipt-outline', subtitle: 'Create invoice' },
      ],
    },
    {
      id: 'withdraw',
      title: 'Withdraw',
      subtitle: 'Cash out to bank or mobile',
      icon: 'remove-circle',
      color: Colors.warning,
      gradient: [Colors.warning, '#f59e0b'],
      options: [
        { id: 'bank', title: 'Bank Account', icon: 'business-outline', subtitle: 'Withdraw to bank' },
        { id: 'mobile', title: 'Mobile Money', icon: 'phone-portrait-outline', subtitle: 'Withdraw to mobile' },
        { id: 'atm', title: 'ATM Withdrawal', icon: 'card-outline', subtitle: 'Withdraw at ATM' },
        { id: 'crypto', title: 'Cryptocurrency', icon: 'logo-bitcoin', subtitle: 'Withdraw to crypto' },
      ],
    },
  ];

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setExpandedCard(null);
    }
  }, [isVisible]);

  const toggleCard = (cardId) => {
    Haptics.selectionAsync();
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const handleOptionPress = (action, option) => {
    Haptics.selectionAsync();
    
    switch (action.id) {
      case 'deposit':
        navigation.navigate('DepositScreen', { 
          isModal: true, 
          onDepositConfirmed,
          method: option.id 
        });
        break;
      case 'send':
        navigation.navigate('SendMoney', { method: option.id });
        break;
      case 'receive':
        navigation.navigate('ReceiveMoney', { method: option.id });
        break;
      case 'withdraw':
        navigation.navigate('WithdrawScreen', { method: option.id });
        break;
      default:
        break;
    }
    
    onClose();
  };

  if (!isVisible) return null;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.container}>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Choose Action</Text>
              <Text style={styles.headerSubtitle}>Tap a card to see options</Text>
            </View>

            {/* Action Cards */}
            {actions.map((action) => {
              const isExpanded = expandedCard === action.id;

              return (
                <View key={action.id} style={styles.card}>
                  <TouchableOpacity
                    style={styles.cardHeader}
                    onPress={() => toggleCard(action.id)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={action.gradient}
                      style={styles.cardGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.cardIconContainer}>
                        <Ionicons name={action.icon} size={32} color="white" />
                      </View>
                    </LinearGradient>
                    
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{action.title}</Text>
                      <Text style={styles.cardSubtitle}>{action.subtitle}</Text>
                    </View>
                    
                    <View style={styles.expandIcon}>
                      <Ionicons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={24} 
                        color={Colors.textSecondary} 
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Expandable Options */}
                  {isExpanded && (
                    <View style={styles.optionsContainer}>
                      {action.options.map((option, index) => (
                        <TouchableOpacity
                          key={option.id}
                          style={styles.optionItem}
                          onPress={() => handleOptionPress(action, option)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.optionIcon, { backgroundColor: action.color + '20' }]}>
                            <Ionicons name={option.icon} size={20} color={action.color} />
                          </View>
                          <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>{option.title}</Text>
                            <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 88,
  },
  cardGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  expandIcon: {
    padding: 8,
  },
  optionsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '30',
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '500',
    marginBottom: 2,
  },
  optionSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});

export default InlineExpandableCards;
