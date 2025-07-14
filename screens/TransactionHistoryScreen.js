// sendnreceive-app/screens/TransactionHistoryScreen.js
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  SafeAreaView,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
  Alert,
  Image,
  Share,
  TextInput,
  ActivityIndicator,
  PanResponder,
  Dimensions,
  Animated,
  RefreshControl,
  Easing,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
// Add import for GlobeBackground if not present
import GlobeBackground from '../components/GlobeBackground';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}



// Replace mockTransactions with a new array where every transaction includes all fields
const mockTransactions = [
  {
    id: '1',
    type: 'received',
    amount: '50.00',
    currency: 'USD',
    from: 'John D.',
    to: '',
    method: '',
    merchant: '',
    date: new Date().toISOString(),
    status: 'Completed',
    details: 'Payment for freelance work',
    reference: 'TX-2024-001',
    fee: '0.00',
  },
  {
    id: '2',
    type: 'sent',
    amount: '100.00',
    currency: 'USD',
    from: '',
    to: 'Jane S.',
    method: '',
    merchant: '',
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: 'Completed',
    details: 'Birthday gift',
    reference: 'TX-2024-002',
    fee: '1.50',
  },
  {
    id: '3',
    type: 'deposit',
    amount: '200.00',
    currency: 'USD',
    from: '',
    to: '',
    method: 'Credit Card',
    merchant: '',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'Completed',
    details: 'Account funding',
    reference: 'TX-2024-003',
    fee: '0.00',
  },
  {
    id: '4',
    type: 'withdrawal',
    amount: '75.00',
    currency: 'USD',
    from: '',
    to: '',
    method: 'Bank Transfer',
    merchant: '',
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: 'Pending',
    details: 'Withdrawal to savings',
    reference: 'TX-2024-004',
    fee: '2.00',
  },
  {
    id: '5',
    type: 'received',
    amount: '120.50',
    currency: 'EUR',
    from: 'Alex G.',
    to: '',
    method: '',
    merchant: '',
    date: new Date(Date.now() - 86400000 * 4).toISOString(),
    status: 'Completed',
    details: 'Project payment',
    reference: 'TX-2024-005',
    fee: '0.00',
  },
  {
    id: '6',
    type: 'sent',
    amount: '30.00',
    currency: 'GHS',
    from: '',
    to: 'Local Shop',
    method: '',
    merchant: '',
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'Completed',
    details: 'Groceries',
    reference: 'TX-2024-006',
    fee: '0.50',
  },
  {
    id: '7',
    type: 'pay_in_store',
    amount: '15.00',
    currency: 'USD',
    from: '',
    to: '',
    method: '',
    merchant: 'Coffee Place',
    date: new Date(Date.now() - 86400000 * 6).toISOString(),
    status: 'Completed',
    details: 'Morning coffee',
    reference: 'TX-2024-007',
    fee: '0.00',
  },
  // Add more transactions with all fields filled for variety
  ...Array.from({ length: 20 }, (_, i) => {
    const types = ['received', 'sent', 'deposit', 'withdrawal', 'pay_in_store'];
    const type = types[i % types.length];
    return {
      id: `${8 + i}`,
      type,
      amount: (Math.random() * 500 + 10).toFixed(2),
      currency: ['USD', 'EUR', 'GHS', 'NGN'][i % 4],
      from: type === 'received' ? `User ${i}` : '',
      to: type === 'sent' ? `User ${i}` : '',
      method: type === 'deposit' ? 'Bank' : type === 'withdrawal' ? 'Card' : '',
      merchant: type === 'pay_in_store' ? `Merchant ${i}` : '',
      date: new Date(Date.now() - 86400000 * (i + 7)).toISOString(),
      status: ['Completed', 'Pending', 'Failed'][i % 3],
      details: `Mock transaction ${i + 8}`,
      reference: `TX-2024-${(8 + i).toString().padStart(3, '0')}`,
      fee: (Math.random() * 3).toFixed(2),
    };
  }),
];

// Group transactions by exact date (YYYY-MM-DD)
const groupTransactionsByDate = (transactions) => {
  const groups = {};
  transactions.forEach(tx => {
    const dateKey = new Date(tx.date).toISOString().slice(0, 10); // YYYY-MM-DD
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(tx);
  });
  // Sort each group by time descending
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => new Date(b.date) - new Date(a.date));
  });
  // Return groups sorted by date descending
  return Object.fromEntries(
    Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]))
  );
};

const screen = Dimensions.get('window');

const TransactionListItem = React.memo(({ item, onPress, colors, index, expanded, collapse }) => {
  const isDebit = item.type === 'sent' || item.type === 'withdrawal' || item.type === 'pay_in_store';
  const amountColor = isDebit ? colors.error : colors.success;
  const amountPrefix = isDebit ? '-' : '+';

  let iconName = 'help-circle-outline';
  let iconColor = '#fff';
  let iconBg = '#e5e7eb';

  if (item.type === 'received') { iconName = 'arrow-down-outline'; iconColor = '#fff'; iconBg = '#10b981'; }
  else if (item.type === 'sent') { iconName = 'arrow-up-outline'; iconColor = '#fff'; iconBg = '#1e40af'; }
  else if (item.type === 'deposit') { iconName = 'wallet-outline'; iconColor = '#fff'; iconBg = '#6366f1'; }
  else if (item.type === 'withdrawal') { iconName = 'cash-outline'; iconColor = '#fff'; iconBg = '#f59e42'; }
  else if (item.type === 'pay_in_store') { iconName = 'cart-outline'; iconColor = '#fff'; iconBg = '#a21caf'; }

  // Build main label (just the name/label, no prefix)
  let mainLabel = '';
  if (item.type === 'received' && item.from) mainLabel = item.from;
  else if (item.type === 'sent' && item.to) mainLabel = item.to;
  else if (item.type === 'deposit' && item.method) mainLabel = item.method;
  else if (item.type === 'withdrawal' && item.method) mainLabel = item.method;
  else if (item.type === 'pay_in_store' && item.merchant) mainLabel = item.merchant;
  // fallback: blank or generic

  let title = '';
  if (item.type === 'received') title = `Received from ${mainLabel}`;
  else if (item.type === 'sent') title = `Sent to ${mainLabel}`;
  else if (item.type === 'deposit') title = `Deposit via ${mainLabel}`;
  else if (item.type === 'withdrawal') title = `Withdrawal to ${mainLabel}`;
  else if (item.type === 'pay_in_store') title = `Paid at ${mainLabel}`;

  if (item.details && item.details !== title) {
    title += ` - ${item.details}`;
  }

  // Microinteraction: scale on press
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: false,
      speed: 30,
      bounciness: 6,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: false,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  // Microinteraction: animate status tag on change
  const statusAnim = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    statusAnim.setValue(0.7);
    Animated.spring(statusAnim, {
      toValue: 1,
      useNativeDriver: false,
      speed: 20,
      bounciness: 8,
    }).start();
  }, [item.status]);

  // Fade in animation on mount
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      delay: index * 100,
      useNativeDriver: false,
    }).start();
  }, []);

  // Animated expansion logic
  const animatedHeight = React.useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const animatedShadow = React.useRef(new Animated.Value(expanded ? 1 : 0)).current;
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: expanded ? 1 : 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(animatedShadow, {
        toValue: expanded ? 1 : 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      })
    ]).start();
  }, [expanded]);

  // Interpolate height, opacity, and shadow for expansion
  const detailsMaxHeight = animatedHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 300] });
  const detailsOpacity = animatedHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const cardShadow = {
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: animatedShadow.interpolate({ inputRange: [0, 1], outputRange: [6, 16] }) },
    shadowOpacity: animatedShadow.interpolate({ inputRange: [0, 1], outputRange: [0.13, 0.22] }),
    shadowRadius: animatedShadow.interpolate({ inputRange: [0, 1], outputRange: [16, 28] }),
    elevation: animatedShadow.interpolate({ inputRange: [0, 1], outputRange: [8, 18] }),
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], marginBottom: expanded ? 24 : 12, ...cardShadow }}>
      <TouchableOpacity
        style={[
          styles.transactionItem,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            minHeight: expanded ? 220 : 60,
            borderRadius: 18,
            paddingBottom: expanded ? 0 : 0,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            flexWrap: 'wrap',
          },
        ]}
        onPress={onPress}
        activeOpacity={0.92}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Transaction: ${mainLabel}, amount ${amountPrefix}${item.currency} ${item.amount}, status ${item.status}`}
        accessibilityHint={expanded ? 'Tap to collapse details' : 'Tap to expand for details'}
      >
        <View style={[styles.transactionIconContainer, { backgroundColor: iconBg }]}> 
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>{mainLabel}</Text>
          <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', justifyContent: 'center', minWidth: 72 }}>
          <Text style={[styles.transactionAmount, { color: amountColor }]}>{amountPrefix}{item.currency} {item.amount}</Text>
          <Animated.View style={{ transform: [{ scale: statusAnim }] }}>
            <Text style={[styles.statusTag, { backgroundColor: item.status === 'Completed' ? '#10b981' : item.status === 'Pending' ? '#f59e42' : '#ef4444', color: '#fff' }]}>{item.status}</Text>
          </Animated.View>
        </View>
        <View style={{ justifyContent: 'center', alignItems: 'center', marginLeft: 8 }}>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-forward'} size={22} color={colors.textSecondary} />
        </View>
        {/* Expanded details inline in the same card */}
        {expanded && (
          <View style={{ width: '100%', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
            <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 17, color: colors.textPrimary, marginBottom: 6 }}>{item.details || 'Transaction'}</Text>
            <Text style={{ fontFamily: 'Montserrat-Regular', fontSize: 13, color: colors.textMuted, marginBottom: 10 }}>{item.date ? (new Date(item.date).toLocaleDateString() + ' at ' + new Date(item.date).toLocaleTimeString()) : '—'}</Text>
            <Text style={{ fontFamily: 'Montserrat-Bold', fontSize: 20, color: amountColor, marginBottom: 6 }}>{amountPrefix}{item.currency} {item.amount}</Text>
            <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 13, color: item.status === 'Completed' ? '#10b981' : item.status === 'Pending' ? '#f59e42' : '#ef4444', backgroundColor: '#f1f5f9', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3, overflow: 'hidden', marginBottom: 10, alignSelf: 'flex-start' }}>{item.status}</Text>
            {item.reference ? (
              <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Reference: <Text style={{ fontFamily: 'Montserrat-SemiBold', color: colors.brandBlue || colors.primary }}>{item.reference}</Text></Text>
            ) : null}
            {item.fee && item.fee !== '0.00' ? (
              <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Fee: <Text style={{ fontFamily: 'Montserrat-SemiBold', color: colors.textPrimary }}>{item.currency} {item.fee}</Text></Text>
            ) : null}
            {item.method ? (
              <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Method: <Text style={{ fontFamily: 'Montserrat-SemiBold', color: colors.textPrimary }}>{item.method}</Text></Text>
            ) : null}
            {item.from ? (
              <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>From: <Text style={{ fontFamily: 'Montserrat-SemiBold', color: colors.textPrimary }}>{item.from}</Text></Text>
            ) : null}
            {item.to ? (
              <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>To: <Text style={{ fontFamily: 'Montserrat-SemiBold', color: colors.textPrimary }}>{item.to}</Text></Text>
            ) : null}
            {item.merchant ? (
              <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Merchant: <Text style={{ fontFamily: 'Montserrat-SemiBold', color: colors.textPrimary }}>{item.merchant}</Text></Text>
            ) : null}
            {/* Divider */}
            <View style={{ height: 1, backgroundColor: colors.border, opacity: 0.7, marginVertical: 16, alignSelf: 'stretch' }} />
            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 4 }}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border, flex: 1, marginRight: 6 }]} onPress={() => {/* TODO: implement share */}}>
                <Ionicons name="share-outline" size={16} color={colors.textPrimary} style={{ marginRight: 6 }} />
                <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border, flex: 1, marginRight: 6 }]} onPress={() => {/* TODO: implement support */}}>
                <Ionicons name="chatbubble-outline" size={16} color={colors.textPrimary} style={{ marginRight: 6 }} />
                <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Support</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border, flex: 1 }]} onPress={() => {/* TODO: implement report */}}>
                <Ionicons name="flag-outline" size={16} color={colors.error} style={{ marginRight: 6 }} />
                <Text style={[styles.actionButtonText, { color: colors.error }]}>Report</Text>
              </TouchableOpacity>
            </View>
            {/* Collapse button */}
            <TouchableOpacity onPress={collapse} style={{ alignSelf: 'center', marginTop: 4, marginBottom: 2 }}>
              <Ionicons name="chevron-up" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

const TransactionHistoryScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState({ 
    types: ['all'], 
    dateRange: 'all',
    amountRange: 'all',
    status: 'all',
    search: ''
  });
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [isLoadingReset, setIsLoadingReset] = useState(false);
  const [isLoadingApply, setIsLoadingApply] = useState(false);
  const [tempFilter, setTempFilter] = useState({ 
    types: ['all'], 
    dateRange: 'all',
    amountRange: 'all',
    status: 'all',
    search: ''
  });
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [loadError, setLoadError] = useState(false);
    // Add refreshing state
  const [refreshing, setRefreshing] = useState(false);
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const [expandedTransactionId, setExpandedTransactionId] = useState(null);
  
  // Fade in animation when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reset opacity to 0 when screen loses focus
      screenOpacity.setValue(0);
      
      // Fade in when screen comes into focus
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }, [])
  );

  // Grouped transactions for display
  const groupedTransactions = useMemo(() => {
    let transactionsToDisplay = mockTransactions;
    
    // Filter by type
    if (!filter.types.includes('all')) {
      transactionsToDisplay = transactionsToDisplay.filter(tx => filter.types.includes(tx.type));
    }
    
    // Filter by search
    if (filter.search.trim()) {
      const searchTerm = filter.search.toLowerCase();
      transactionsToDisplay = transactionsToDisplay.filter(tx => 
        tx.details.toLowerCase().includes(searchTerm) ||
        (tx.from && tx.from.toLowerCase().includes(searchTerm)) ||
        (tx.to && tx.to.toLowerCase().includes(searchTerm)) ||
        (tx.merchant && tx.merchant.toLowerCase().includes(searchTerm)) ||
        tx.reference.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filter by status
    if (filter.status !== 'all') {
      transactionsToDisplay = transactionsToDisplay.filter(tx => tx.status === filter.status);
    }
    
    // Filter by date range
    if (filter.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      
      transactionsToDisplay = transactionsToDisplay.filter(tx => {
        const txDate = new Date(tx.date);
        switch (filter.dateRange) {
          case 'today':
            return txDate >= today;
          case 'yesterday':
            return txDate >= yesterday && txDate < today;
          case 'week':
            return txDate >= weekAgo;
          case 'month':
            return txDate >= monthAgo;
          default:
            return true;
        }
      });
    }
    
    // Filter by amount range
    if (filter.amountRange !== 'all') {
      transactionsToDisplay = transactionsToDisplay.filter(tx => {
        const amount = parseFloat(tx.amount);
        switch (filter.amountRange) {
          case 'small':
            return amount <= 50;
          case 'medium':
            return amount > 50 && amount <= 200;
          case 'large':
            return amount > 200;
          default:
            return true;
        }
      });
    }
    
    return groupTransactionsByDate(transactionsToDisplay);
  }, [filter]);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [groupedTransactions]);

  const handleSelectTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedTransaction(null);
  };

  const handleShareTransaction = async () => {
    if (!selectedTransaction) return;
    
    try {
      const shareMessage = `Transaction Details:\n` +
        `Type: ${selectedTransaction.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}\n` +
        `Amount: ${selectedTransaction.currency} ${selectedTransaction.amount}\n` +
        `Date: ${new Date(selectedTransaction.date).toLocaleDateString()}\n` +
        `Status: ${selectedTransaction.status}\n` +
        `Reference: ${selectedTransaction.reference}\n` +
        `Details: ${selectedTransaction.details}`;

      await Share.share({
        message: shareMessage,
        title: 'Transaction Details',
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to share transaction details. Please try again.');
    }
  };

  const handleCopyReference = async () => {
    if (!selectedTransaction) return;
    
    try {
      await Clipboard.setStringAsync(selectedTransaction.reference);
      Alert.alert('Success', 'Transaction reference copied to clipboard!');
    } catch (error) {
      Alert.alert('Error', 'Unable to copy reference. Please try again.');
    }
  };

  const handleReportTransaction = () => {
    Alert.alert(
      'Report Transaction',
      'Are you sure you want to report this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Info', 'Transaction reported. Our team will review it within 24 hours.');
            handleCloseModal();
          }
        }
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Would you like to contact support about this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Contact', 
          onPress: () => {
            // In a real app, this would open chat or email
            Alert.alert('Info', 'Our support team will contact you shortly.');
            handleCloseModal();
          }
        }
      ]
    );
  };

  const handleFilterPress = () => {
    setTempFilter({ ...filter });
    setFilterMenuVisible(!filterMenuVisible);
  };

  const handleFilterSelect = (type) => {
    setTempFilter(prev => {
      let newTypes;
      if (type === 'all') {
        // If "All" is selected, clear other selections
        newTypes = ['all'];
      } else {
        // Remove 'all' if it exists and toggle the selected type
        newTypes = prev.types.filter(t => t !== 'all');
        if (prev.types.includes(type)) {
          // Remove the type if already selected
          newTypes = newTypes.filter(t => t !== type);
        } else {
          // Add the type if not selected
          newTypes.push(type);
        }
        // If no types selected, default to 'all'
        if (newTypes.length === 0) {
          newTypes = ['all'];
        }
      }
      return { ...prev, types: newTypes };
    });
  };

  const handleFilterMenuClose = () => {
    setFilterMenuVisible(false);
  };

  const handleResetFilters = () => {
    setIsLoadingReset(true);
    
    // Reset filters immediately without async operations
    setTempFilter({ 
      types: ['all'], 
      dateRange: 'all',
      amountRange: 'all',
      status: 'all',
      search: ''
    });
    setFilter({ 
      types: ['all'], 
      dateRange: 'all',
      amountRange: 'all',
      status: 'all',
      search: ''
    });
    setShowResetConfirmation(false);
    setIsLoadingReset(false);
  };

  const handleApplyFilters = () => {
    setIsLoadingApply(true);
    
    // Apply filters immediately without async operations
    setFilter({ ...tempFilter });
    setFilterMenuVisible(false);
    setIsLoadingApply(false);
  };

  const handleShowResetConfirmation = () => {
    setShowResetConfirmation(true);
  };

  const handleCancelReset = () => {
    setShowResetConfirmation(false);
  };

  const handleDateRangeSelect = (range) => {
    setTempFilter(prev => ({ ...prev, dateRange: range }));
  };

  const handleAmountRangeSelect = (range) => {
    setTempFilter(prev => ({ ...prev, amountRange: range }));
  };

  const handleStatusSelect = (status) => {
    setTempFilter(prev => ({ ...prev, status }));
  };

  const handleSearchChange = (text) => {
    setTempFilter(prev => ({ ...prev, search: text }));
  };

  const getActiveFilterLabel = () => {
    if (tempFilter.types.includes('all') || tempFilter.types.length === 0) {
      return 'All';
    }
    if (tempFilter.types.length === 1) {
      const activeFilter = filterButtons.find(btn => btn.type === tempFilter.types[0]);
      return activeFilter ? activeFilter.label : 'All';
    }
    return `${tempFilter.types.length} Types`;
  };

  const getTotalFilteredCount = () => {
    if (tempFilter.types.includes('all')) {
      return mockTransactions.length;
    }
    return mockTransactions.filter(tx => tempFilter.types.includes(tx.type)).length;
  };

  const getActualFilteredCount = () => {
    if (filter.types.includes('all')) {
      return mockTransactions.length;
    }
    return mockTransactions.filter(tx => filter.types.includes(tx.type)).length;
  };

  const getFilterPreviewText = () => {
    const activeFilters = [];
    
    if (!tempFilter.types.includes('all')) {
      const typeLabels = tempFilter.types.map(type => {
        const filter = filterButtons.find(btn => btn.type === type);
        return filter ? filter.label : type;
      });
      activeFilters.push(`Types: ${typeLabels.join(', ')}`);
    }
    
    if (tempFilter.dateRange !== 'all') {
      const dateLabels = {
        today: 'Today',
        yesterday: 'Yesterday', 
        week: 'This Week',
        month: 'This Month'
      };
      activeFilters.push(`Date: ${dateLabels[tempFilter.dateRange]}`);
    }
    
    if (tempFilter.amountRange !== 'all') {
      const amountLabels = {
        small: '≤ $50',
        medium: '$51-$200',
        large: '> $200'
      };
      activeFilters.push(`Amount: ${amountLabels[tempFilter.amountRange]}`);
    }
    
    if (tempFilter.status !== 'all') {
      activeFilters.push(`Status: ${tempFilter.status}`);
    }
    
    if (tempFilter.search.trim()) {
      activeFilters.push(`Search: "${tempFilter.search}"`);
    }
    
    return activeFilters.length > 0 ? activeFilters.join(' • ') : 'All transactions';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return { name: 'checkmark-circle', color: colors.success };
      case 'Pending':
        return { name: 'time', color: colors.warning };
      case 'Failed':
        return { name: 'close-circle', color: colors.error };
      default:
        return { name: 'help-circle', color: colors.textMuted };
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'received':
        return { name: 'arrow-down-circle', color: colors.success };
      case 'sent':
        return { name: 'arrow-up-circle', color: colors.error };
      case 'deposit':
        return { name: 'wallet', color: colors.info };
      case 'withdrawal':
        return { name: 'cash', color: colors.warning };
      case 'pay_in_store':
        return { name: 'card', color: colors.brandPurple || colors.primary };
      default:
        return { name: 'help-circle', color: colors.textMuted };
    }
  };

  const handleExpandTransaction = (transactionId) => {
    setExpandedTransactionId(prev => (prev === transactionId ? null : transactionId));
  };

  const renderTransactionItem = React.useCallback(
    ({ item, index }) => (
      <TransactionListItem
        item={item}
        onPress={() => handleExpandTransaction(item.id)}
        colors={colors}
        index={index}
        expanded={expandedTransactionId === item.id}
        collapse={() => setExpandedTransactionId(null)}
      />
    ),
    [colors, expandedTransactionId]
  );

  const renderSectionHeader = (title) => {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    React.useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }, []);
    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={[styles.sectionHeaderContainer, { backgroundColor: colors.background }]}> 
          <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>{title}</Text>
          <View style={{ height: 1, backgroundColor: '#e5e7eb', marginTop: 8, marginHorizontal: -16, opacity: 0.7 }} />
        </View>
      </Animated.View>
    );
  };

  const filterButtons = [
    { label: 'All', type: 'all', icon: 'list-outline' },
    { label: 'Sent', type: 'sent', icon: 'arrow-up-outline' },
    { label: 'Received', type: 'received', icon: 'arrow-down-outline' },
    { label: 'Deposits', type: 'deposit', icon: 'wallet-outline' },
    { label: 'Withdrawals', type: 'withdrawal', icon: 'cash-outline' },
    { label: 'In-Store', type: 'pay_in_store', icon: 'card-outline' },
  ];

  const getTransactionCount = (type) => {
    if (type === 'all') return mockTransactions.length;
    return mockTransactions.filter(tx => tx.type === type).length;
  };

  const getStatusCount = (status) => {
    if (status === 'all') return mockTransactions.length;
    return mockTransactions.filter(tx => tx.status === status).length;
  };

  // Draggable filter icon state
  const [dragging, setDragging] = useState(false);
  const [didWiggle, setDidWiggle] = useState(false);
  const wiggleAnim = useRef(new Animated.Value(0)).current;
  const initialPan = useRef({
    x: screen.width - 68, // 20 right margin + 48 button width
    y: 100, // Start lower to avoid overlapping first card
  }).current;
  const pan = useRef(new Animated.ValueXY(initialPan)).current;
  // const pulseAnim = useRef(new Animated.Value(1)).current; // Commented out for wiggle demo
  const dragState = useRef({ isTap: true, startX: 0, startY: 0 });
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragState.current.isTap = true;
        setDragging(true);
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (e, gestureState) => {
        if (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5) {
          dragState.current.isTap = false;
        }
        Animated.event([
          null,
          { dx: pan.x, dy: pan.y },
        ], { useNativeDriver: false })(e, gestureState);
      },
      onPanResponderRelease: (e, gestureState) => {
        setDragging(false);
        pan.flattenOffset();
        // Clamp within screen bounds
        let newX = pan.x._value;
        let newY = pan.y._value;
        newX = Math.max(0, Math.min(newX, screen.width - 48));
        newY = Math.max(80, Math.min(newY, screen.height - 48)); // Don't allow above 80px
        pan.setValue({ x: newX, y: newY });
        pan.setOffset({ x: 0, y: 0 });
        // If it was a tap (not a drag), open the filter menu
        if (dragState.current.isTap) {
          handleFilterPress();
        }
      },
    })
  ).current;

  // Wiggle animation on first load
  useEffect(() => {
    if (!didWiggle) {
      Animated.sequence([
        Animated.timing(wiggleAnim, { toValue: 1, duration: 160, useNativeDriver: false }),
        Animated.timing(wiggleAnim, { toValue: -1, duration: 160, useNativeDriver: false }),
        Animated.timing(wiggleAnim, { toValue: 1, duration: 160, useNativeDriver: false }),
        Animated.timing(wiggleAnim, { toValue: 0, duration: 160, useNativeDriver: false }),
      ]).start(() => setDidWiggle(true));
    }
  }, [didWiggle, wiggleAnim]);

  const renderEmptyComponent = () => (
    <View style={styles.emptyOuterContainer}>
      <View style={styles.emptyCard}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="wallet-outline" size={48} color="#1e40af" />
        </View>
        <Text style={styles.emptyTitle}>No transactions yet</Text>
        <Text style={styles.emptySubtitle}>Your recent activity will show up here.</Text>
        <TouchableOpacity style={styles.emptyCtaButton} activeOpacity={0.92}>
          <LinearGradient colors={["#1e40af", "#6366f1"]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.emptyCtaGradient}>
            <Text style={styles.emptyCtaText}>Send Money</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Update visibleTransactions when filter or page changes
  useEffect(() => {
    // Flatten grouped transactions for lazy loading
    const allTx = Object.values(groupedTransactions).flat();
    // setVisibleTransactions(allTx.slice(0, page * PAGE_SIZE)); // Removed lazy loading
  }, [groupedTransactions]);

  // Update fetchMore to simulate error randomly
  const fetchMore = () => {
    // if (isLoadingMore || loadError) return; // Removed lazy loading
    // setIsLoadingMore(true);
    // setTimeout(() => {
    //   if (Math.random() < 0.15) { // 15% chance to simulate error
    //     setLoadError(true);
    //     setIsLoadingMore(false);
    //     return;
    //   }
    //   setPage(prev => prev + 1);
    //   setIsLoadingMore(false);
    // }, 800);
  };

  const handleRetry = () => {
    // setLoadError(false); // Removed lazy loading
    // fetchMore();
  };

  const allLoaded = true; // Removed lazy loading

  // Skeleton loader component
  // const SkeletonCard = () => { // Removed skeleton loader
  //   const fadeAnim = React.useRef(new Animated.Value(0)).current;
  //   React.useEffect(() => {
  //     Animated.timing(fadeAnim, {
  //       toValue: 1,
  //       duration: 400,
  //       useNativeDriver: false,
  //     }).start();
  //   }, []);
  //   return (
  //     <Animated.View style={{ opacity: fadeAnim }}>
  //       <View style={[styles.transactionItem, { backgroundColor: '#f1f5f9', borderColor: '#e5e7eb' }]}> 
  //         <View style={[styles.transactionIconContainer, { backgroundColor: '#e0e7ef' }]}/>
  //         <View style={{ flex: 1, marginRight: 8 }}>
  //           <LinearGradient colors={["#e5e7eb", "#f1f5f9", "#e5e7eb"]} start={{x:0,y:0}} end={{x:1,y:0}} style={{ height: 16, width: '60%', borderRadius: 4, marginBottom: 8 }}/>
  //           <LinearGradient colors={["#e5e7eb", "#f1f5f9", "#e5e7eb"]} start={{x:0,y:0}} end={{x:1,y:0}} style={{ height: 12, width: '40%', borderRadius: 4 }}/>
  //         </View>
  //         <LinearGradient colors={["#e5e7eb", "#f1f5f9", "#e5e7eb"]} start={{x:0,y:0}} end={{x:1,y:0}} style={{ height: 16, width: 48, borderRadius: 4, marginLeft: 8 }}/>
  //       </View>
  //     </Animated.View>
  //   );
  // };

  // const ListFooter = () => { // Removed ListFooter
  //   if (isLoadingMore) {
  //     return (
  //       <View>
  //         {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
  //       </View>
  //     );
  //   }
  //   if (loadError) {
  //     return (
  //       <View style={{ alignItems: 'center', marginVertical: 16 }}>
  //         <Text style={{ color: '#b91c1c', marginBottom: 8 }}>Failed to load more transactions.</Text>
  //         <TouchableOpacity onPress={handleRetry} style={{ backgroundColor: '#1e40af', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 8 }}>
  //           <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
  //         </TouchableOpacity>
  //       </View>
  //     );
  //   }
  //   if (allLoaded && visibleTransactions.length > 0) {
  //     return (
  //       <View style={{ alignItems: 'center', marginVertical: 16 }}>
  //         <Text style={{ color: '#64748b' }}>No more transactions</Text>
  //       </View>
  //     );
  //   }
  //   return null;
  // };

  // Add refresh function
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refreshing transactions
    setTimeout(() => {
      setRefreshing(false);
      // In a real app, you would fetch fresh data here
    }, 1500);
  }, []);

  // Render the transaction list grouped by date with visible date headers
  const renderTransactionList = () => {
    const sections = Object.entries(groupedTransactions);
    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {sections.map(([dateKey, transactions]) => (
          <View key={dateKey} style={{ marginBottom: 8 }}>
            {/* Date header */}
            <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 }}>
              <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 15, color: '#334155', letterSpacing: 0.2 }}>
                {new Date(dateKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            {transactions.map((item, idx) => (
              <React.Fragment key={item.id}>
                {renderTransactionItem({ item, index: idx })}
              </React.Fragment>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  };

  if (isLoadingApply) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background, flex: 1, justifyContent: 'center', alignItems: 'center' }]} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color="#1e40af" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Globe background image */}
      <GlobeBackground />
      <View style={[styles.container, { paddingBottom: 0 }]}> 
        {/* Draggable Floating Filter FAB (absolutely positioned, does not affect layout) */}
        <Animated.View
          style={{
            position: 'absolute',
            zIndex: 10,
            width: 48,
            height: 48,
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale: dragging ? 1.12 : 1 },
              { rotate: wiggleAnim.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: ['-12deg', '0deg', '12deg'],
                }) },
            ],
          }}
          {...panResponder.panHandlers}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: Colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#1e40af',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Ionicons name="filter" size={24} color="#fff" />
            {/* Active filter badge */}
            {(!filter.types.includes('all') || filter.search.trim() || filter.status !== 'all' || filter.dateRange !== 'all' || filter.amountRange !== 'all') && (
              <View
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#10b981',
                  borderWidth: 2,
                  borderColor: '#fff',
                }}
              />
              )}
            </View>
        </Animated.View>
        {/* Filter Menu */}
        {filterMenuVisible && (
          <>
            <TouchableOpacity 
              style={styles.filterMenuBackdrop} 
              activeOpacity={1} 
              onPress={handleFilterMenuClose}
            />
            <View style={[styles.filterMenu, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.filterMenuHeader}>
                <View style={styles.filterMenuHeaderContent}>
                  <Ionicons name="filter" size={20} color={colors.textPrimary} />
                  <Text style={[styles.filterMenuTitle, { color: colors.textPrimary }]}>Filter Transactions</Text>
                </View>
                <TouchableOpacity onPress={handleFilterMenuClose} style={styles.filterMenuClose}>
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Filter Preview */}
              <View style={[styles.filterPreviewContainer, { backgroundColor: colors.background }]}>
                <Text style={[styles.filterPreviewLabel, { color: colors.textMuted }]}>Preview:</Text>
                <Text style={[styles.filterPreviewText, { color: colors.textPrimary }]} numberOfLines={2}>
                  {getFilterPreviewText()}
                </Text>
              </View>
              
              <ScrollView style={styles.filterMenuScroll} showsVerticalScrollIndicator={false}>
                {/* Search Section */}
                <View style={styles.filterMenuSection}>
                  <Text style={[styles.filterMenuSectionTitle, { color: colors.textMuted }]}>Search</Text>
                  <View style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.searchInput, { color: colors.textPrimary }]}
                      placeholder="Search transactions..."
                      placeholderTextColor={colors.textMuted}
                      value={tempFilter.search}
                      onChangeText={handleSearchChange}
                    />
                    {tempFilter.search.length > 0 && (
                      <TouchableOpacity onPress={() => handleSearchChange('')} style={{ padding: 4 }}>
                        <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Transaction Type Section */}
                <View style={styles.filterMenuSection}>
                  <Text style={[styles.filterMenuSectionTitle, { color: colors.textMuted }]}>Transaction Type</Text>
                  {filterButtons.map(btn => (
                    <TouchableOpacity
                      key={btn.type}
                      style={[
                        styles.filterMenuItem,
                        tempFilter.types.includes(btn.type) && styles.filterMenuItemActive,
                        { 
                          backgroundColor: tempFilter.types.includes(btn.type) ? (colors.brandPurple || colors.primary) : 'transparent',
                          borderColor: tempFilter.types.includes(btn.type) ? (colors.brandPurple || colors.primary) : colors.border,
                        }
                      ]}
                      onPress={() => handleFilterSelect(btn.type)}
                    >
                      <View style={styles.filterMenuItemContent}>
                        <Ionicons 
                          name={btn.icon} 
                          size={20} 
                          color={tempFilter.types.includes(btn.type) ? (colors.textOnPrimaryCTA || colors.textInverse) : colors.textSecondary} 
                        />
                        <Text style={[
                          styles.filterMenuItemText,
                          { color: tempFilter.types.includes(btn.type) ? (colors.textOnPrimaryCTA || colors.textInverse) : colors.textPrimary }
                        ]}>
                          {btn.label}
                        </Text>
                        <View style={[
                          styles.filterMenuItemBadge,
                          { backgroundColor: tempFilter.types.includes(btn.type) ? 'rgba(255,255,255,0.9)' : colors.textMuted }
                        ]}>
                          <Text style={[
                            styles.filterMenuItemBadgeText,
                            { color: tempFilter.types.includes(btn.type) ? (colors.brandPurple || colors.primary) : colors.textInverse }
                          ]}>
                            {getTransactionCount(btn.type)}
                          </Text>
                        </View>
                      </View>
                      {tempFilter.types.includes(btn.type) && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.textOnPrimaryCTA || colors.textInverse} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Date Range Section */}
                <View style={styles.filterMenuSection}>
                  <Text style={[styles.filterMenuSectionTitle, { color: colors.textMuted }]}>Date Range</Text>
                  {[
                    { value: 'all', label: 'All Time', icon: 'calendar-outline' },
                    { value: 'today', label: 'Today', icon: 'today-outline' },
                    { value: 'yesterday', label: 'Yesterday', icon: 'time-outline' },
                    { value: 'week', label: 'This Week', icon: 'calendar-outline' },
                    { value: 'month', label: 'This Month', icon: 'calendar-outline' },
                  ].map(item => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.filterMenuItem,
                        tempFilter.dateRange === item.value && styles.filterMenuItemActive,
                        { 
                          backgroundColor: tempFilter.dateRange === item.value ? (colors.brandPurple || colors.primary) : 'transparent',
                          borderColor: tempFilter.dateRange === item.value ? (colors.brandPurple || colors.primary) : colors.border,
                        }
                      ]}
                      onPress={() => handleDateRangeSelect(item.value)}
                    >
                      <View style={styles.filterMenuItemContent}>
                        <Ionicons 
                          name={item.icon} 
                          size={20} 
                          color={tempFilter.dateRange === item.value ? (colors.textOnPrimaryCTA || colors.textInverse) : colors.textSecondary} 
                        />
                        <Text style={[
                          styles.filterMenuItemText,
                          { color: tempFilter.dateRange === item.value ? (colors.textOnPrimaryCTA || colors.textInverse) : colors.textPrimary }
                        ]}>
                          {item.label}
                        </Text>
                      </View>
                      {tempFilter.dateRange === item.value && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.textOnPrimaryCTA || colors.textInverse} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Amount Range Section */}
                <View style={styles.filterMenuSection}>
                  <Text style={[styles.filterMenuSectionTitle, { color: colors.textMuted }]}>Amount Range</Text>
                  {[
                    { value: 'all', label: 'All Amounts', icon: 'cash-outline' },
                    { value: 'small', label: '≤ $50', icon: 'trending-down-outline' },
                    { value: 'medium', label: '$51 - $200', icon: 'trending-up-outline' },
                    { value: 'large', label: '> $200', icon: 'trending-up-outline' },
                  ].map(item => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.filterMenuItem,
                        tempFilter.amountRange === item.value && styles.filterMenuItemActive,
                        { 
                          backgroundColor: tempFilter.amountRange === item.value ? (colors.brandPurple || colors.primary) : 'transparent',
                          borderColor: tempFilter.amountRange === item.value ? (colors.brandPurple || colors.primary) : colors.border,
                        }
                      ]}
                      onPress={() => handleAmountRangeSelect(item.value)}
                    >
                      <View style={styles.filterMenuItemContent}>
                        <Ionicons 
                          name={item.icon} 
                          size={20} 
                          color={tempFilter.amountRange === item.value ? (colors.textOnPrimaryCTA || colors.textInverse) : colors.textSecondary} 
                        />
                        <Text style={[
                          styles.filterMenuItemText,
                          { color: tempFilter.amountRange === item.value ? (colors.textOnPrimaryCTA || colors.textInverse) : colors.textPrimary }
                        ]}>
                          {item.label}
                        </Text>
                      </View>
                      {tempFilter.amountRange === item.value && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.textOnPrimaryCTA || colors.textInverse} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Status Section */}
                <View style={styles.filterMenuSection}>
                  <Text style={[styles.filterMenuSectionTitle, { color: colors.textMuted }]}>Status</Text>
                  {[
                    { value: 'all', label: 'All Status', icon: 'list-outline' },
                    { value: 'Completed', label: 'Completed', icon: 'checkmark-circle-outline' },
                    { value: 'Pending', label: 'Pending', icon: 'time-outline' },
                    { value: 'Failed', label: 'Failed', icon: 'close-circle-outline' },
                  ].map(item => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.filterMenuItem,
                        tempFilter.status === item.value && styles.filterMenuItemActive,
                        { 
                          backgroundColor: tempFilter.status === item.value ? (colors.brandPurple || colors.primary) : 'transparent',
                          borderColor: tempFilter.status === item.value ? (colors.brandPurple || colors.primary) : colors.border,
                        }
                      ]}
                      onPress={() => handleStatusSelect(item.value)}
                    >
                      <View style={styles.filterMenuItemContent}>
                        <Ionicons 
                          name={item.icon} 
                          size={20} 
                          color={tempFilter.status === item.value ? (colors.textOnPrimaryCTA || colors.textInverse) : colors.textSecondary} 
                        />
                        <Text style={[
                          styles.filterMenuItemText,
                          { color: tempFilter.status === item.value ? (colors.textOnPrimaryCTA || colors.textInverse) : colors.textPrimary }
                        ]}>
                          {item.label}
                        </Text>
                        <View style={[
                          styles.filterMenuItemBadge,
                          { backgroundColor: tempFilter.status === item.value ? 'rgba(255,255,255,0.9)' : colors.textMuted }
                        ]}>
                          <Text style={[
                            styles.filterMenuItemBadgeText,
                            { color: tempFilter.status === item.value ? (colors.brandPurple || colors.primary) : colors.textInverse }
                          ]}>
                            {getStatusCount(item.value)}
                          </Text>
                        </View>
                      </View>
                      {tempFilter.status === item.value && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.textOnPrimaryCTA || colors.textInverse} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={[styles.filterMenuFooter, { borderTopColor: colors.border }]}>
                <View style={styles.filterMenuFooterContent}>
                  <TouchableOpacity 
                    style={[styles.filterMenuResetButton, { borderColor: colors.border }]}
                    onPress={handleShowResetConfirmation}
                    disabled={isLoadingReset}
                  >
                    {isLoadingReset ? (
                      <ActivityIndicator size="small" color={colors.textSecondary} />
                    ) : (
                      <>
                        <Ionicons name="refresh" size={16} color={colors.textSecondary} />
                        <Text style={[styles.filterMenuResetText, { color: colors.textSecondary }]}>Reset</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.filterMenuApplyButton, { backgroundColor: colors.brandPurple || colors.primary }]}
                    onPress={handleApplyFilters}
                    disabled={isLoadingApply}
                  >
                    {isLoadingApply ? (
                      <ActivityIndicator size="small" color={colors.textOnPrimaryCTA || colors.textInverse} />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={16} color={colors.textOnPrimaryCTA || colors.textInverse} />
                        <Text style={[styles.filterMenuApplyText, { color: colors.textOnPrimaryCTA || colors.textInverse }]}>Apply</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Reset Confirmation Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showResetConfirmation}
          onRequestClose={handleCancelReset}
        >
          <View style={styles.confirmationModalOverlay}>
            <TouchableOpacity 
              style={styles.confirmationModalBackdrop} 
              activeOpacity={1} 
              onPress={handleCancelReset}
            />
            <View style={[styles.confirmationModalContent, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.confirmationModalHeader}>
                <Ionicons name="warning" size={24} color={colors.warning} />
                <Text style={[styles.confirmationModalTitle, { color: colors.textPrimary }]}>Reset Filters</Text>
              </View>
              <Text style={[styles.confirmationModalText, { color: colors.textSecondary }]}>
                Are you sure you want to reset all filters? This will clear all your current filter selections.
              </Text>
              <View style={styles.confirmationModalButtons}>
                <TouchableOpacity 
                  style={[styles.confirmationModalButton, styles.confirmationModalButtonCancel, { borderColor: colors.border }]}
                  onPress={handleCancelReset}
                >
                  <Text style={[styles.confirmationModalButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.confirmationModalButton, styles.confirmationModalButtonConfirm, { backgroundColor: colors.error }]}
                  onPress={handleResetFilters}
                >
                  <Text style={[styles.confirmationModalButtonText, { color: colors.textInverse }]}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Transaction List (no extra wrapper, no extra margin/padding above) */}
        {renderTransactionList()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  globeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.13,
    zIndex: 0,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'android' ? 15 : 10,
    borderBottomWidth: 1,
  },
  backButton: { padding: 5 },
  filterButton: { padding: 5 },
  filterButtonContent: {
    position: 'relative',
  },
  filterIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIndicatorText: {
    ...Typography.bodySmall,
    fontSize: 10,
    fontWeight: '600',
  },
  filterContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterScroll: {
    paddingHorizontal: 15,
  },
  filterChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    transform: [{ scale: 1.02 }],
  },
  filterChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    ...Typography.label,
    marginLeft: 6,
    marginRight: 8,
    fontWeight: '500',
  },
  filterChipTextActive: {
    fontWeight: '600',
  },
  filterChipBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterChipBadgeText: {
    ...Typography.bodySmall,
    fontSize: 10,
    fontWeight: '600',
  },
  filterMenuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 999,
  },
  filterMenu: {
    position: 'absolute',
    top: 80,
    right: 15,
    width: 320,
    maxHeight: 500,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 25,
    zIndex: 1000,
  },
  filterMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  filterMenuHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterMenuTitle: {
    ...Typography.h4,
    fontWeight: '600',
    marginLeft: 8,
  },
  filterMenuClose: {
    padding: 6,
    borderRadius: 8,
  },
  filterMenuSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterMenuSectionTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterMenuScroll: {
    maxHeight: 300,
  },
  filterMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 4,
    borderRadius: 8,
  },
  filterMenuItemActive: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  filterMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterMenuItemText: {
    ...Typography.bodyLarge,
    marginLeft: 12,
    flex: 1,
  },
  filterMenuItemBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  filterMenuItemBadgeText: {
    ...Typography.bodySmall,
    fontSize: 11,
    fontWeight: '600',
  },
  filterMenuFooter: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  filterMenuFooterContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  filterMenuResetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    minHeight: 36,
  },
  filterMenuResetText: {
    ...Typography.bodyRegular,
    marginLeft: 6,
    fontWeight: '500',
  },
  filterMenuApplyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 36,
  },
  filterMenuApplyText: {
    ...Typography.bodyRegular,
    fontWeight: '600',
    marginLeft: 6,
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeaderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'rgba(248,250,252,0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, // 8px multiple
    marginHorizontal: 16, // 8px multiple
    borderRadius: 16, // increased for premium look
    marginBottom: 12, // 8px multiple, slightly more space between cards
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'rgba(248,250,252,0.92)', // #f8fafc with higher opacity
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 16,
    elevation: 8,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    backgroundColor: 'rgba(30,64,175,0.08)', // subtle brand blue tint
  },
  transactionInfo: {
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  transactionTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 17,
    flexShrink: 1,
  },
  transactionDate: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 11,
    color: '#334155',
    marginBottom: 2,
  },
  transactionAmount: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    marginLeft: 8,
  },
  statusTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 0,
    marginBottom: 0,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  emptyContainer:{
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    ...Typography.bodyRegular,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 16,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    minWidth: 300,
    maxWidth: '92%',
    maxHeight: '90%', // Increased to ensure all content is visible
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
    alignSelf: 'center',
    marginTop: 100,
    marginBottom: 100,
  },
  modalSafeArea: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  transactionIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTextContainer: {
    flex: 1,
  },
  transactionTypeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  transactionTypeText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 13,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  statusBadgeText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 10,
    fontWeight: '600',
  },
  modalTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  closeIconButton: {
    padding: 5,
  },
  modalScroll: {
    width: '100%',
    flex: 1,
    paddingBottom: 16,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  transactionDate: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  detailsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionHeader: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  transactionIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionAmountLarge: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  statusText: {
    ...Typography.bodySmall,
    marginLeft: 5,
  },
  detailsContainer: {
    width: '100%',
    marginBottom: 8, // Reduced from 16
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  detailRowColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    width: '100%',
  },
  detailLabel: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    flex: 1,
  },
  detailValue: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
    color: '#1e293b',
  },
  detailValueDetails: {
    ...Typography.bodyRegular,
    marginTop: 8,
    textAlign: 'left',
    fontFamily: 'Montserrat',
    width: '100%',
    lineHeight: 20,
  },
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 12,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    backgroundColor: Colors.cardBackground,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 70,
    maxWidth: 90,
    backgroundColor: 'rgba(248,250,252,0.6)',
  },
  actionButtonText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 11,
    textAlign: 'center',
  },
  filterPreviewContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  filterPreviewLabel: {
    ...Typography.bodySmall,
    marginBottom: 4,
  },
  filterPreviewText: {
    ...Typography.bodyRegular,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(248,250,252,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    paddingVertical: 0,
  },
  confirmationModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 20,
  },
  confirmationModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  confirmationModalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 15,
  },
  confirmationModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  confirmationModalTitle: {
    ...Typography.h3,
    marginLeft: 10,
  },
  confirmationModalText: {
    ...Typography.bodyRegular,
    textAlign: 'center',
    marginBottom: 25,
  },
  confirmationModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  confirmationModalButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  confirmationModalButtonCancel: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  confirmationModalButtonConfirm: {
    backgroundColor: Colors.error,
  },
  confirmationModalButtonText: {
    ...Typography.bodyRegular,
    fontWeight: '600',
  },
  premiumHeader: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  premiumHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 18 : 8,
    paddingBottom: 10,
  },
  premiumHeaderTitleBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumHeaderTitle: {
    ...Typography.h1,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 0.2,
    fontSize: 22,
  },
  premiumHeaderSubtitle: {
    ...Typography.bodySmall,
    color: '#e0e7ef',
    marginTop: 0,
    fontWeight: '500',
    fontSize: 13,
  },
  premiumHeaderIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 0,
  },
  premiumHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 2,
    borderColor: '#e0e7ef',
  },
  premiumFilterChipsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 6,
    gap: 4,
    marginTop: -4,
  },
  premiumFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#fff',
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 0,
  },
  premiumFilterChipActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  premiumFilterChipText: {
    ...Typography.bodySmall,
    color: '#1e40af',
    fontWeight: '600',
    fontSize: 12,
  },
  premiumFilterChipTextActive: {
    color: '#fff',
  },
  emptyOuterContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyCard: {
    backgroundColor: 'rgba(248,250,252,0.98)', // light blue tint
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
    minWidth: 280,
    maxWidth: 340,
  },
  emptyIconContainer: {
    backgroundColor: 'rgba(30,64,175,0.08)',
    borderRadius: 32,
    padding: 16,
    marginBottom: 18,
  },
  emptyTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 20,
    color: '#1e293b',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 15,
    color: '#64748b',
    marginBottom: 22,
    textAlign: 'center',
  },
  emptyCtaButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: 180,
    alignSelf: 'center',
  },
  emptyCtaGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
    width: '100%',
  },
  emptyCtaText: {
    color: '#fff',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

export default TransactionHistoryScreen;


