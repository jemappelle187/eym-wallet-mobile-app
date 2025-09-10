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

const OverlayCards = ({ 
  isVisible, 
  onClose, 
  navigation,
  onDepositConfirmed 
}) => {
  const [selectedAction, setSelectedAction] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const actions = [
    {
      id: 'deposit',
      title: 'Add Money',
      icon: 'add-circle',
      color: Colors.success,
      gradient: [Colors.success, '#10b981'],
      methods: [
        { id: 'card', title: 'Credit/Debit Card', icon: 'card-outline', subtitle: 'Instant deposit', fee: '2.5% fee' },
        { id: 'bank', title: 'Bank Transfer', icon: 'business-outline', subtitle: 'Free transfer', fee: 'Free' },
        { id: 'mobile', title: 'Mobile Money', icon: 'phone-portrait-outline', subtitle: 'Quick & easy', fee: '1% fee' },
        { id: 'crypto', title: 'Cryptocurrency', icon: 'logo-bitcoin', subtitle: 'USDC, EURC, SOL', fee: '0.5% fee' },
      ],
    },
    {
      id: 'send',
      title: 'Send Money',
      icon: 'arrow-up-circle',
      color: Colors.primary,
      gradient: [Colors.primary, '#3b82f6'],
      methods: [
        { id: 'user', title: 'Send to User', icon: 'person-outline', subtitle: 'Send to contacts', fee: 'Free' },
        { id: 'bank', title: 'Bank Account', icon: 'business-outline', subtitle: 'Send to bank', fee: '€2.50' },
        { id: 'wallet', title: 'Digital Wallet', icon: 'wallet-outline', subtitle: 'Send to wallet', fee: '€1.00' },
        { id: 'mobile', title: 'Mobile Money', icon: 'phone-portrait-outline', subtitle: 'Send to mobile', fee: '€0.50' },
      ],
    },
    {
      id: 'receive',
      title: 'Receive Money',
      icon: 'arrow-down-circle',
      color: Colors.accent,
      gradient: [Colors.accent, '#8b5cf6'],
      methods: [
        { id: 'qr', title: 'QR Code', icon: 'qr-code-outline', subtitle: 'Show QR to receive', fee: 'Free' },
        { id: 'link', title: 'Payment Link', icon: 'link-outline', subtitle: 'Share payment link', fee: 'Free' },
        { id: 'account', title: 'Account Details', icon: 'card-outline', subtitle: 'Share account info', fee: 'Free' },
        { id: 'invoice', title: 'Generate Invoice', icon: 'receipt-outline', subtitle: 'Create invoice', fee: 'Free' },
      ],
    },
    {
      id: 'withdraw',
      title: 'Withdraw',
      icon: 'remove-circle',
      color: Colors.warning,
      gradient: [Colors.warning, '#f59e0b'],
      methods: [
        { id: 'bank', title: 'Bank Account', icon: 'business-outline', subtitle: 'Withdraw to bank', fee: '€3.00' },
        { id: 'mobile', title: 'Mobile Money', icon: 'phone-portrait-outline', subtitle: 'Withdraw to mobile', fee: '€1.50' },
        { id: 'atm', title: 'ATM Withdrawal', icon: 'card-outline', subtitle: 'Withdraw at ATM', fee: '€2.00' },
        { id: 'crypto', title: 'Cryptocurrency', icon: 'logo-bitcoin', subtitle: 'Withdraw to crypto', fee: '€1.00' },
      ],
    },
  ];

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setSelectedAction(null);
    }
  }, [isVisible]);

  const handleActionPress = (action) => {
    Haptics.selectionAsync();
    setSelectedAction(action);
  };

  const handleMethodPress = (action, method) => {
    Haptics.selectionAsync();
    
    switch (action.id) {
      case 'deposit':
        navigation.navigate('DepositScreen', { 
          isModal: true, 
          onDepositConfirmed,
          method: method.id 
        });
        break;
      case 'send':
        navigation.navigate('SendMoney', { method: method.id });
        break;
      case 'receive':
        navigation.navigate('ReceiveMoney', { method: method.id });
        break;
      case 'withdraw':
        navigation.navigate('WithdrawScreen', { method: method.id });
        break;
      default:
        break;
    }
    
    onClose();
  };

  const handleBackPress = () => {
    Haptics.selectionAsync();
    setSelectedAction(null);
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
        
        <Animated.View 
          style={[
            styles.container, 
            { 
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            {selectedAction ? (
              <View style={styles.headerWithBack}>
                <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{selectedAction.title}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.headerDefault}>
                <Text style={styles.headerTitle}>Choose Action</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentScroll}
          >
            {selectedAction ? (
              // Show payment methods for selected action
              <View style={styles.methodsContainer}>
                <View style={styles.methodsHeader}>
                  <LinearGradient
                    colors={selectedAction.gradient}
                    style={styles.methodsIcon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={selectedAction.icon} size={32} color="white" />
                  </LinearGradient>
                  <View style={styles.methodsText}>
                    <Text style={styles.methodsTitle}>Select Method</Text>
                    <Text style={styles.methodsSubtitle}>Choose your preferred option</Text>
                  </View>
                </View>

                <View style={styles.methodsGrid}>
                  {selectedAction.methods.map((method) => (
                    <TouchableOpacity
                      key={method.id}
                      style={styles.methodCard}
                      onPress={() => handleMethodPress(selectedAction, method)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.methodIcon, { backgroundColor: selectedAction.color + '15' }]}>
                        <Ionicons name={method.icon} size={28} color={selectedAction.color} />
                      </View>
                      <Text style={styles.methodTitle}>{method.title}</Text>
                      <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
                      <View style={styles.methodFee}>
                        <Text style={[styles.methodFeeText, { color: method.fee === 'Free' ? Colors.success : Colors.textSecondary }]}>
                          {method.fee}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              // Show action cards
              <View style={styles.actionsContainer}>
                <Text style={styles.actionsSubtitle}>Tap an action to see available methods</Text>
                <View style={styles.actionsGrid}>
                  {actions.map((action) => (
                    <TouchableOpacity
                      key={action.id}
                      style={styles.actionCard}
                      onPress={() => handleActionPress(action)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={action.gradient}
                        style={styles.actionGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Ionicons name={action.icon} size={32} color="white" />
                      </LinearGradient>
                      <Text style={styles.actionTitle}>{action.title}</Text>
                      <Text style={styles.actionSubtitle}>{action.methods.length} methods available</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>
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
    width: screenWidth * 0.92,
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
  header: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerDefault: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerWithBack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
  },
  contentContainer: {
    flex: 1,
  },
  contentScroll: {
    padding: 20,
  },
  actionsContainer: {
    alignItems: 'center',
  },
  actionsSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionCard: {
    width: (screenWidth * 0.92 - 60) / 2,
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 140,
  },
  actionGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  methodsContainer: {
    width: '100%',
  },
  methodsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  methodsIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodsText: {
    flex: 1,
  },
  methodsTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },
  methodsSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  methodCard: {
    width: (screenWidth * 0.92 - 60) / 2,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 120,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  methodTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  methodSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  methodFee: {
    marginTop: 'auto',
  },
  methodFeeText: {
    ...Typography.caption,
    fontWeight: '500',
  },
});

export default OverlayCards;
