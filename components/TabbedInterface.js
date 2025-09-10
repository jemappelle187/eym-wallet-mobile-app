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

const TabbedInterface = ({ 
  isVisible, 
  onClose, 
  navigation,
  onDepositConfirmed 
}) => {
  const [activeTab, setActiveTab] = useState('deposit');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const tabs = [
    {
      id: 'deposit',
      title: 'Add Money',
      icon: 'add-circle',
      color: Colors.success,
      gradient: [Colors.success, '#10b981'],
      options: [
        { id: 'card', title: 'Credit/Debit Card', icon: 'card-outline', subtitle: 'Instant deposit', description: 'Add money instantly using your card' },
        { id: 'bank', title: 'Bank Transfer', icon: 'business-outline', subtitle: 'Free transfer', description: 'Transfer from your bank account' },
        { id: 'mobile', title: 'Mobile Money', icon: 'phone-portrait-outline', subtitle: 'Quick & easy', description: 'Use mobile money services' },
        { id: 'crypto', title: 'Cryptocurrency', icon: 'logo-bitcoin', subtitle: 'USDC, EURC, SOL', description: 'Deposit using crypto' },
      ],
    },
    {
      id: 'send',
      title: 'Send Money',
      icon: 'arrow-up-circle',
      color: Colors.primary,
      gradient: [Colors.primary, '#3b82f6'],
      options: [
        { id: 'user', title: 'Send to User', icon: 'person-outline', subtitle: 'Send to contacts', description: 'Send money to app users' },
        { id: 'bank', title: 'Bank Account', icon: 'business-outline', subtitle: 'Send to bank', description: 'Transfer to bank accounts' },
        { id: 'wallet', title: 'Digital Wallet', icon: 'wallet-outline', subtitle: 'Send to wallet', description: 'Send to digital wallets' },
        { id: 'mobile', title: 'Mobile Money', icon: 'phone-portrait-outline', subtitle: 'Send to mobile', description: 'Send to mobile numbers' },
      ],
    },
    {
      id: 'receive',
      title: 'Receive Money',
      icon: 'arrow-down-circle',
      color: Colors.accent,
      gradient: [Colors.accent, '#8b5cf6'],
      options: [
        { id: 'qr', title: 'QR Code', icon: 'qr-code-outline', subtitle: 'Show QR to receive', description: 'Generate QR code for payments' },
        { id: 'link', title: 'Payment Link', icon: 'link-outline', subtitle: 'Share payment link', description: 'Create shareable payment links' },
        { id: 'account', title: 'Account Details', icon: 'card-outline', subtitle: 'Share account info', description: 'Share your account details' },
        { id: 'invoice', title: 'Generate Invoice', icon: 'receipt-outline', subtitle: 'Create invoice', description: 'Create professional invoices' },
      ],
    },
    {
      id: 'withdraw',
      title: 'Withdraw',
      icon: 'remove-circle',
      color: Colors.warning,
      gradient: [Colors.warning, '#f59e0b'],
      options: [
        { id: 'bank', title: 'Bank Account', icon: 'business-outline', subtitle: 'Withdraw to bank', description: 'Withdraw to your bank account' },
        { id: 'mobile', title: 'Mobile Money', icon: 'phone-portrait-outline', subtitle: 'Withdraw to mobile', description: 'Withdraw to mobile money' },
        { id: 'atm', title: 'ATM Withdrawal', icon: 'card-outline', subtitle: 'Withdraw at ATM', description: 'Withdraw cash at ATMs' },
        { id: 'crypto', title: 'Cryptocurrency', icon: 'logo-bitcoin', subtitle: 'Withdraw to crypto', description: 'Withdraw to crypto wallet' },
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
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 400,
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
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const handleTabPress = (tabId) => {
    Haptics.selectionAsync();
    setActiveTab(tabId);
  };

  const handleOptionPress = (tab, option) => {
    Haptics.selectionAsync();
    
    switch (tab.id) {
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

  const activeTabData = tabs.find(tab => tab.id === activeTab);

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
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                })
              }]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Choose Action</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, isActive && styles.activeTab]}
                  onPress={() => handleTabPress(tab.id)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={isActive ? tab.gradient : ['transparent', 'transparent']}
                    style={[styles.tabGradient, isActive && styles.activeTabGradient]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons 
                      name={tab.icon} 
                      size={20} 
                      color={isActive ? 'white' : Colors.textSecondary} 
                    />
                  </LinearGradient>
                  <Text style={[styles.tabTitle, isActive && styles.activeTabTitle]}>
                    {tab.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tab Content */}
          <ScrollView 
            style={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentScroll}
          >
            <View style={styles.contentHeader}>
              <LinearGradient
                colors={activeTabData.gradient}
                style={styles.contentIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={activeTabData.icon} size={32} color="white" />
              </LinearGradient>
              <View style={styles.contentText}>
                <Text style={styles.contentTitle}>{activeTabData.title}</Text>
                <Text style={styles.contentSubtitle}>Select your preferred method</Text>
              </View>
            </View>

            {/* Options Grid */}
            <View style={styles.optionsGrid}>
              {activeTabData.options.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.optionCard}
                  onPress={() => handleOptionPress(activeTabData, option)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.optionIcon, { backgroundColor: activeTabData.color + '15' }]}>
                    <Ionicons name={option.icon} size={24} color={activeTabData.color} />
                  </View>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
    width: screenWidth * 0.95,
    maxHeight: screenHeight * 0.85,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: Colors.background,
  },
  tabGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  activeTabGradient: {
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tabTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabTitle: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  contentScroll: {
    padding: 20,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  contentIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contentText: {
    flex: 1,
  },
  contentTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },
  contentSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionCard: {
    width: (screenWidth * 0.95 - 60) / 2,
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
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  optionDescription: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 14,
  },
});

export default TabbedInterface;
