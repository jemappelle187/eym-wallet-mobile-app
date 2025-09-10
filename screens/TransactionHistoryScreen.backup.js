// sendnreceive-app/screens/TransactionHistoryScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
  Alert,
  Share,
  ActivityIndicator,
  PanResponder,
  Dimensions,
  Animated,
  RefreshControl,
  Easing,
  StatusBar,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import QRCode from 'react-native-qrcode-svg';
import { Svg, Circle, Path, Text as SvgText, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

// Import extracted components and utilities
import GlobeBackground from '../components/GlobeBackground';
import { copyWithAutoClear } from '../utils/ClipboardUtils';
import StandardizedContainer from '../components/StandardizedContainer';
import RefreshToast from '../components/RefreshToast';
import EnhancedAnalyticsDashboard from '../components/EnhancedAnalyticsDashboard';
import TransactionListItem from '../components/TransactionListItem';
import FilterMenu from '../components/FilterMenu';
import TransactionModal from '../components/TransactionModal';
import useTransactionFilters from '../hooks/useTransactionFilters';
import { exportToCSV, exportToPDF, exportToJSON, exportSummary } from '../utils/exportHelpers';
import { mockTransactions } from '../data/mockTransactions';



if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const screen = Dimensions.get('window');





const TransactionHistoryScreen = () => {
  const navigation = useNavigation();
  const { colors = Colors } = useTheme();
  console.log('colors in TransactionHistoryScreen:', colors);
  
  // Use the extracted hook for filter logic
  const {
    filter,
    setFilter,
    sortBy,
    sortOrder,
    filteredTransactions,
    groupedTransactions,
    handleFilterSelect,
    handleDateRangeSelect,
    handleAmountRangeSelect,
    handleStatusSelect,
    handleSearchChange,
    handleSortChange,
    resetFilters,
    getTransactionCount,
    getStatusCount,
    getFilterPreviewText,
  } = useTransactionFilters(mockTransactions);

  // Local state
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
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
  const [refreshing, setRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState({ visible: false, type: 'success', message: '' });
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const [expandedTransactionId, setExpandedTransactionId] = useState(null);
  const [exportMenuVisible, setExportMenuVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);
  const [qrCodeVisible, setQrCodeVisible] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [locationData, setLocationData] = useState(null);
  const [locationVisible, setLocationVisible] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [pan] = useState(new Animated.ValueXY({ x: screen.width - 80, y: screen.height - 200 }));
  const [dragging, setDragging] = useState(false);
  const [wiggleAnim] = useState(new Animated.Value(0));
  const qrCodeRef = useRef(null);

  // Pan responder for draggable FAB
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setDragging(true);
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        setDragging(false);
        pan.flattenOffset();
        
        // Snap to edges if dragged too far
        const { width, height } = screen;
        const fabSize = 48;
        const margin = 20;
        
        let newX = pan.x._value;
        let newY = pan.y._value;
        
        // Snap to left or right edge
        if (newX < margin) newX = margin;
        if (newX > width - fabSize - margin) newX = width - fabSize - margin;
        
        // Snap to top or bottom edge
        if (newY < 100) newY = 100; // Keep below header
        if (newY > height - fabSize - margin) newY = height - fabSize - margin;
        
        Animated.spring(pan, {
          toValue: { x: newX, y: newY },
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;
  
  // Listen for custom navigation events from popup menu
  useEffect(() => {
    const unsubscribe = navigation.addListener('custom', (e) => {
      if (e.target === 'Activity') {
        switch (e.data?.action) {
          case 'showAnalytics':
            setAnalyticsVisible(true);
            break;
          case 'showExport':
            handleExportPress();
            break;
          case 'showSearch':
            // Open filter menu and focus on search
            setFilterMenuVisible(true);
            // Auto-focus search input after a short delay
            setTimeout(() => {
              // This will be handled by the filter menu component
              setTempFilter(prev => ({ ...prev, search: '' }));
            }, 300);
            break;
          case 'showFilter':
            // Open filter menu with advanced options
            setFilterMenuVisible(true);
            // Pre-select some common filters for quick access
            setTimeout(() => {
              setTempFilter(prev => ({
                ...prev,
                types: ['all'],
                dateRange: 'all',
                amountRange: 'all',
                status: 'all',
                search: ''
              }));
            }, 100);
            break;
        }
      }
    });

    return unsubscribe;
  }, [navigation]);
  
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
      // Handle error if sharing fails
    }
  };

  const handleCopyReference = async () => {
    if (!selectedTransaction) return;
    
    try {
      await copyWithAutoClear(selectedTransaction.reference, 30000, () => {
        Alert.alert('Clipboard Cleared', 'Sensitive data has been removed from your clipboard for your security.');
      });
    } catch (error) {
      // Handle error if copying fails
    }
  };

  const handleReportTransaction = () => {
    // Implement report functionality
  };

  const handleContactSupport = () => {
    // Implement contact support functionality
  };

  const handleFilterPress = () => {
    console.log('Filter button pressed! Current filterMenuVisible:', filterMenuVisible);
    setTempFilter({ ...filter });
    setFilterMenuVisible(!filterMenuVisible);
    console.log('Setting filterMenuVisible to:', !filterMenuVisible);
  };

  const handleTempFilterSelect = (type) => {
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
    resetFilters();
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

  const handleTempDateRangeSelect = (range) => {
    setTempFilter(prev => ({ ...prev, dateRange: range }));
  };

  const handleTempAmountRangeSelect = (range) => {
    setTempFilter(prev => ({ ...prev, amountRange: range }));
  };

  const handleTempStatusSelect = (status) => {
    setTempFilter(prev => ({ ...prev, status }));
  };

  const handleTempSearchChange = (text) => {
    setTempFilter(prev => ({ ...prev, search: text }));
    
    // Generate search suggestions
    if (text.length > 0) {
      const suggestions = generateSearchSuggestions(text);
      setSearchSuggestions(suggestions);
      setShowSearchSuggestions(true);
    } else {
      setShowSearchSuggestions(false);
    }
  };

  const handleQuickSearch = (query) => {
    // Direct search without opening filter menu
    setFilter(prev => ({ ...prev, search: query }));
    setTempFilter(prev => ({ ...prev, search: query }));
    
    // Add to search history
    if (!searchHistory.includes(query)) {
      setSearchHistory(prev => [query, ...prev.slice(0, 9)]);
    }
    
    // Show success toast
    setRefreshToast({ 
      visible: true, 
      type: 'success', 
      message: `Searching for "${query}"` 
    });
  };

  const handleQuickFilter = (filterType, value) => {
    // Quick filter without opening filter menu
    const newFilter = { ...filter };
    
    switch (filterType) {
      case 'type':
        newFilter.types = [value];
        break;
      case 'status':
        newFilter.status = value;
        break;
      case 'dateRange':
        newFilter.dateRange = value;
        break;
      case 'amountRange':
        newFilter.amountRange = value;
        break;
    }
    
    setFilter(newFilter);
    setTempFilter(newFilter);
    
    // Show success toast
    const filterLabels = {
      type: { received: 'Received', sent: 'Sent', deposit: 'Deposits', withdrawal: 'Withdrawals' },
      status: { Completed: 'Completed', Pending: 'Pending', Failed: 'Failed' },
      dateRange: { today: 'Today', week: 'This Week', month: 'This Month' },
      amountRange: { small: 'Small Amounts', medium: 'Medium Amounts', large: 'Large Amounts' }
    };
    
    const label = filterLabels[filterType]?.[value] || value;
    setRefreshToast({ 
      visible: true, 
      type: 'success', 
      message: `Filtered by ${label}` 
    });
  };

  const generateSearchSuggestions = (query) => {
    const suggestions = [];
    const queryLower = query.toLowerCase();
    
    // Search in transaction data
    mockTransactions.forEach(tx => {
      // Search by recipient/sender names
      if (tx.from && tx.from.toLowerCase().includes(queryLower)) {
        suggestions.push({ type: 'person', value: tx.from, icon: 'person', category: 'Contact' });
      }
      if (tx.to && tx.to.toLowerCase().includes(queryLower)) {
        suggestions.push({ type: 'person', value: tx.to, icon: 'person', category: 'Contact' });
      }
      
      // Search by merchant names
      if (tx.merchant && tx.merchant.toLowerCase().includes(queryLower)) {
        suggestions.push({ type: 'merchant', value: tx.merchant, icon: 'business', category: 'Merchant' });
      }
      
      // Search by reference numbers
      if (tx.reference && tx.reference.toLowerCase().includes(queryLower)) {
        suggestions.push({ type: 'reference', value: tx.reference, icon: 'document-text', category: 'Reference' });
      }
      
      // Search by amounts
      if (tx.amount && tx.amount.includes(query)) {
        suggestions.push({ type: 'amount', value: `${tx.currency} ${tx.amount}`, icon: 'cash', category: 'Amount' });
      }
      
      // Search by transaction types
      if (tx.type && tx.type.toLowerCase().includes(queryLower)) {
        suggestions.push({ type: 'type', value: tx.type, icon: 'list', category: 'Type' });
      }
      
      // Search by transaction details/notes
      if (tx.details && tx.details.toLowerCase().includes(queryLower)) {
        suggestions.push({ type: 'details', value: tx.details, icon: 'document', category: 'Details' });
      }
      
      // Search by date patterns
      const txDate = new Date(tx.date);
      const dateStr = txDate.toLocaleDateString();
      if (dateStr.includes(query)) {
        suggestions.push({ type: 'date', value: dateStr, icon: 'calendar', category: 'Date' });
      }
    });
    
    // Add smart suggestions based on query patterns
    if (query.match(/^\d+$/)) {
      // If query is just numbers, suggest amount searches
      suggestions.push({ type: 'smart', value: `Amount: ${query}`, icon: 'cash', category: 'Smart' });
    }
    
    if (query.match(/^[A-Z]{3}$/)) {
      // If query is 3 uppercase letters, suggest currency searches
      suggestions.push({ type: 'smart', value: `Currency: ${query}`, icon: 'globe', category: 'Smart' });
    }
    
    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.value === suggestion.value)
    );
    
    return uniqueSuggestions.slice(0, 10);
  };

  const handleSearchSuggestionPress = (suggestion) => {
    setTempFilter(prev => ({ ...prev, search: suggestion.value }));
    setShowSearchSuggestions(false);
    
    // Add to search history
    if (!searchHistory.includes(suggestion.value)) {
      setSearchHistory(prev => [suggestion.value, ...prev.slice(0, 9)]);
    }
  };

  const handleSearchHistoryPress = (historyItem) => {
    setTempFilter(prev => ({ ...prev, search: historyItem }));
    setShowSearchSuggestions(false);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  // Analytics Functions
  const generateAnalytics = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyTransactions = mockTransactions.filter(tx => 
      new Date(tx.date) >= thisMonth
    );
    
    const totalSpent = monthlyTransactions
      .filter(tx => tx.type === 'sent' || tx.type === 'withdrawal' || tx.type === 'pay_in_store')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    
    const totalReceived = monthlyTransactions
      .filter(tx => tx.type === 'received' || tx.type === 'deposit')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    
    const transactionCounts = {
      sent: monthlyTransactions.filter(tx => tx.type === 'sent').length,
      received: monthlyTransactions.filter(tx => tx.type === 'received').length,
      deposit: monthlyTransactions.filter(tx => tx.type === 'deposit').length,
      withdrawal: monthlyTransactions.filter(tx => tx.type === 'withdrawal').length,
      pay_in_store: monthlyTransactions.filter(tx => tx.type === 'pay_in_store').length,
    };
    
    const topMerchants = monthlyTransactions
      .filter(tx => tx.merchant)
      .reduce((acc, tx) => {
        acc[tx.merchant] = (acc[tx.merchant] || 0) + parseFloat(tx.amount);
        return acc;
      }, {});
    
    const topMerchantsList = Object.entries(topMerchants)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([merchant, amount]) => ({ merchant, amount }));
    
    return {
      totalSpent,
      totalReceived,
      netAmount: totalReceived - totalSpent,
      transactionCounts,
      topMerchants: topMerchantsList,
      totalTransactions: monthlyTransactions.length,
    };
  };

  const handleAnalyticsPress = () => {
    setAnalyticsVisible(true);
  };

  const handleAnalyticsClose = () => {
    setAnalyticsVisible(false);
  };

  // QR Code Functions
  const generateQRCodeData = (transaction) => {
    const qrData = {
      type: 'transaction',
      id: transaction.id,
      amount: transaction.amount,
      currency: transaction.currency,
      reference: transaction.reference,
      date: transaction.date,
      from: transaction.from || '',
      to: transaction.to || '',
      merchant: transaction.merchant || '',
      details: transaction.details || '',
    };
    return JSON.stringify(qrData);
  };

  const handleQRCodePress = (transaction) => {
    const qrData = generateQRCodeData(transaction);
    setQrCodeData(qrData);
    setQrCodeVisible(true);
  };

  const handleQRCodeClose = () => {
    setQrCodeVisible(false);
    setQrCodeData('');
  };

  const handleShareQRCode = async () => {
    try {
      const shareMessage = `Transaction QR Code:\n${qrCodeData}`;
      await Share.share({
        message: shareMessage,
        title: 'Transaction QR Code',
      });
    } catch (error) {
      console.warn('QR code sharing failed:', error);
    }
  };

  const handleSaveQRCode = async () => {
    try {
      if (qrCodeRef.current) {
        const result = await qrCodeRef.current.toDataURL();
        // In a real app, you would save this to the device gallery
        Alert.alert('QR Code Saved', 'QR code has been saved to your device');
      }
    } catch (error) {
      console.warn('QR code saving failed:', error);
      Alert.alert('Error', 'Failed to save QR code');
    }
  };

  // Location Tracking Functions
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.warn('Location permission request failed:', error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('Location Permission', 'Location permission is required to track transaction locations.');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.warn('Location retrieval failed:', error);
      return null;
    }
  };

  const handleLocationPress = async (transaction) => {
    const location = await getCurrentLocation();
    if (location) {
      setLocationData({ ...location, transaction });
      setShowLocationModal(true);
    }
  };

  const handleLocationModalClose = () => {
    setShowLocationModal(false);
    setLocationData(null);
  };

  const handleOpenInMaps = async () => {
    if (locationData) {
      const { latitude, longitude } = locationData;
      const url = `https://maps.google.com/?q=${latitude},${longitude}`;
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Cannot open maps application');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to open maps');
      }
    }
  };



  const handleExportPress = () => {
    // Close any other menus first
    setFilterMenuVisible(false);
    setExportMenuVisible(true);
  };

  const handleExportMenuClose = () => {
    setExportMenuVisible(false);
  };

  const handleExportToCSV = async () => {
    setIsExporting(true);
    try {
      await exportToCSV(filteredTransactions, getFilterPreviewText());
      setRefreshToast({ visible: true, type: 'success', message: 'Transactions exported to CSV' });
    } catch (error) {
      setRefreshToast({ visible: true, type: 'error', message: 'Export failed' });
    } finally {
      setIsExporting(false);
      setExportMenuVisible(false);
    }
  };

  const handleExportToPDF = async () => {
    setIsExporting(true);
    try {
      await exportToPDF(filteredTransactions, getFilterPreviewText());
      setRefreshToast({ visible: true, type: 'success', message: 'Transactions exported to PDF' });
    } catch (error) {
      setRefreshToast({ visible: true, type: 'error', message: 'Export failed' });
    } finally {
      setIsExporting(false);
      setExportMenuVisible(false);
    }
  };

  const handleExportToJSON = async () => {
    setIsExporting(true);
    try {
      await exportToJSON(filteredTransactions, getFilterPreviewText());
      setRefreshToast({ visible: true, type: 'success', message: 'Transactions exported to JSON' });
    } catch (error) {
      setRefreshToast({ visible: true, type: 'error', message: 'Export failed' });
    } finally {
      setIsExporting(false);
      setExportMenuVisible(false);
    }
  };

  const handleExportSummary = async () => {
    setIsExporting(true);
    try {
      await exportSummary(filteredTransactions, getFilterPreviewText());
      setRefreshToast({ visible: true, type: 'success', message: 'Summary exported' });
    } catch (error) {
      setRefreshToast({ visible: true, type: 'error', message: 'Export failed' });
    } finally {
      setIsExporting(false);
      setExportMenuVisible(false);
    }
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

  const getTempFilterPreviewText = () => {
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







  const renderEmptyComponent = () => {
    const isFiltered = !filter.types.includes('all') || filter.search.trim() || filter.status !== 'all' || filter.dateRange !== 'all' || filter.amountRange !== 'all';
    
    if (isFiltered) {
      return (
        <View style={styles.emptyOuterContainer}>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="search-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No matching transactions</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your filters or search terms to find what you're looking for.
            </Text>
            <View style={styles.emptyActionButtons}>
              <TouchableOpacity 
                style={[styles.emptySecondaryButton, { borderColor: colors.border }]} 
                onPress={handleResetFilters}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
                <Text style={[styles.emptySecondaryButtonText, { color: colors.textMuted }]}>Clear Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.emptyCtaButton} 
                onPress={() => navigation.navigate('Home')}
                activeOpacity={0.92}
              >
                <LinearGradient colors={[colors.primary, colors.indigo]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.emptyCtaGradient}>
                  <Ionicons name="add-circle-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.emptyCtaText}>Make First Transaction</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.emptyOuterContainer}>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="wallet-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Welcome to your wallet!</Text>
          <Text style={styles.emptySubtitle}>
            Start your financial journey by making your first transaction. It's quick, secure, and easy.
          </Text>
          
          {/* Quick Action Cards */}
          <View style={styles.quickActionCards}>
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="arrow-up-circle" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.quickActionTitle, { color: colors.textPrimary }]}>Send Money</Text>
              <Text style={[styles.quickActionSubtitle, { color: colors.textMuted }]}>Transfer to friends & family</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="arrow-down-circle" size={24} color={colors.success} />
              </View>
              <Text style={[styles.quickActionTitle, { color: colors.textPrimary }]}>Receive Money</Text>
              <Text style={[styles.quickActionSubtitle, { color: colors.textMuted }]}>Get paid instantly</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.emptyActionButtons}>
            <TouchableOpacity 
              style={[styles.emptySecondaryButton, { borderColor: colors.border }]} 
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.8}
            >
              <Ionicons name="card-outline" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
              <Text style={[styles.emptySecondaryButtonText, { color: colors.textMuted }]}>Add Money</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.emptyCtaButton} 
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.92}
            >
              <LinearGradient colors={[colors.primary, colors.indigo]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.emptyCtaGradient}>
                <Ionicons name="rocket-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.emptyCtaText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };



  // Simple screen entrance animation
  useEffect(() => {
    Animated.timing(screenOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, []);

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

  // Enhanced refresh function with better feedback
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    
    try {
      // Simulate API call with better error handling
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate 90% success rate
          if (Math.random() > 0.1) {
            resolve();
          } else {
            reject(new Error('Network error'));
          }
        }, 1200);
      });
      
      // In a real app, you would fetch fresh data here
      // await fetchTransactionHistory();
      
      // Show success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRefreshToast({ visible: true, type: 'success', message: 'Transactions refreshed successfully!' });
    } catch (error) {
      // Show error feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setRefreshToast({ visible: true, type: 'error', message: 'Failed to refresh transactions. Please try again.' });
      console.warn('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const hideRefreshToast = () => {
    setRefreshToast({ visible: false, type: 'success', message: '' });
  };

  // Render the transaction list grouped by date with visible date headers
  const renderTransactionList = () => {
    const sections = Object.entries(groupedTransactions);
    return (
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.background}
            progressViewOffset={10}
            title="Pull to refresh"
            titleColor={colors.textMuted}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {sections.map(([dateKey, transactions], sectionIndex) => (
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
    <StandardizedContainer 
      backgroundColor={colors.background}
      showGlobeBackground={true}
      globeOpacity={0.13}
      statusBarStyle="dark-content"
    >
      <Animated.View style={[styles.container, { paddingBottom: 0, opacity: screenOpacity }]}> 
        {/* Analytics FAB */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 120,
            right: 20,
            zIndex: 10,
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#10b981',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#10b981',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
          onPress={handleAnalyticsPress}
        >
          <Ionicons name="analytics" size={24} color="#fff" />
        </TouchableOpacity>

        {/* DEBUG: Test Filter Button */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 180,
            right: 20,
            zIndex: 10,
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'red',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: 'red',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
          onPress={() => {
            console.log('DEBUG: Test filter button pressed!');
            console.log('Current filterMenuVisible:', filterMenuVisible);
            setFilterMenuVisible(!filterMenuVisible);
            console.log('Setting filterMenuVisible to:', !filterMenuVisible);
          }}
        >
          <Ionicons name="bug" size={24} color="#fff" />
        </TouchableOpacity>

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
          <TouchableOpacity
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#1e40af',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 8,
              elevation: 6,
            }}
            onPress={handleFilterPress}
            onLongPress={() => {
              // Quick filter menu on long press
              Alert.alert(
                'Quick Filters',
                'Select a quick filter:',
                [
                  { text: 'Today', onPress: () => handleQuickFilter('dateRange', 'today') },
                  { text: 'This Week', onPress: () => handleQuickFilter('dateRange', 'week') },
                  { text: 'Large Amounts', onPress: () => handleQuickFilter('amountRange', 'large') },
                  { text: 'Sent Only', onPress: () => handleQuickFilter('type', 'sent') },
                  { text: 'Received Only', onPress: () => handleQuickFilter('type', 'received') },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            }}
            activeOpacity={0.8}
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
            {/* Sort indicator */}
            {sortBy !== 'date' && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 2,
                  left: 2,
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#f59e0b',
                  borderWidth: 2,
                  borderColor: '#fff',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons 
                  name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
                  size={8} 
                  color="#fff" 
                />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
        {/* Filter Menu */}
        {filterMenuVisible && (
          <View style={styles.filterMenuOverlay}>
            {/* DEBUG: Filter Menu Visibility */}
            <View style={{
              position: 'absolute',
              top: 50,
              left: 50,
              backgroundColor: 'red',
              padding: 10,
              zIndex: 1001,
            }}>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                DEBUG: Filter Menu is VISIBLE!
              </Text>
            </View>
            <BlurView 
              intensity={20}
              tint={colors.isDark ? "dark" : "light"}
              style={styles.filterMenuBackdrop}
            >
              <TouchableOpacity 
                style={styles.filterMenuBackdropTouchable} 
                activeOpacity={1} 
                onPress={handleFilterMenuClose}
              />
            </BlurView>
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
              
              <ScrollView style={styles.filterMenuScroll} showsVerticalScrollIndicator={false}>
                {/* Quick Filters Section */}
                <View style={styles.filterMenuSection}>
                  <Text style={[styles.filterMenuSectionTitle, { color: colors.textMuted }]}>Quick Filters</Text>
                  <View style={styles.quickFilterChipsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFilterScroll}>
                      <TouchableOpacity
                        style={[styles.quickFilterChip, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => handleQuickFilter('dateRange', 'today')}
                      >
                        <Ionicons name="today-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.quickFilterChipText, { color: colors.textPrimary }]}>Today</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.quickFilterChip, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => handleQuickFilter('dateRange', 'week')}
                      >
                        <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.quickFilterChipText, { color: colors.textPrimary }]}>This Week</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.quickFilterChip, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => handleQuickFilter('type', 'sent')}
                      >
                        <Ionicons name="arrow-up-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.quickFilterChipText, { color: colors.textPrimary }]}>Sent</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.quickFilterChip, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => handleQuickFilter('type', 'received')}
                      >
                        <Ionicons name="arrow-down-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.quickFilterChipText, { color: colors.textPrimary }]}>Received</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                </View>

                {/* Transaction Type Section */}
                <View style={styles.filterMenuSection}>
                  <Text style={[styles.filterMenuSectionTitle, { color: colors.textMuted }]}>Transaction Type</Text>
                  {[
                    { type: 'all', label: 'All Types', icon: 'list-outline' },
                    { type: 'sent', label: 'Sent', icon: 'arrow-up-outline' },
                    { type: 'received', label: 'Received', icon: 'arrow-down-outline' },
                    { type: 'withdrawal', label: 'Withdrawal', icon: 'card-outline' },
                    { type: 'deposit', label: 'Deposit', icon: 'wallet-outline' },
                  ].map(item => (
                    <TouchableOpacity
                      key={item.type}
                      style={[
                        styles.filterMenuItem,
                        tempFilter.types.includes(item.type) && styles.filterMenuItemActive,
                        { 
                          backgroundColor: tempFilter.types.includes(item.type) ? (colors.brandPurple || colors.primary) : 'transparent',
                          borderColor: tempFilter.types.includes(item.type) ? (colors.brandPurple || colors.primary) : colors.border,
                        }
                      ]}
                      onPress={() => handleTempFilterSelect(item.type)}
                    >
                      <View style={styles.filterMenuItemContent}>
                        <Ionicons 
                          name={item.icon} 
                          size={20} 
                          color={tempFilter.types.includes(item.type) ? (colors.textOnPrimaryCTA || colors.textInverse) : colors.textSecondary} 
                        />
                        <Text style={[
                          styles.filterMenuItemText,
                          { color: tempFilter.types.includes(item.type) ? (colors.textOnPrimaryCTA || colors.textInverse) : colors.textPrimary }
                        ]}>
                          {item.label}
                        </Text>
                      </View>
                      <View style={styles.filterMenuItemBadge}>
                        <Text style={[
                          styles.filterMenuItemBadgeText,
                          { color: tempFilter.types.includes(item.type) ? (colors.textOnPrimaryCTA || colors.textInverse) : colors.textSecondary }
                        ]}>
                          {getTransactionCount(item.type)}
                        </Text>
                      </View>
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
                      onPress={() => handleTempDateRangeSelect(item.value)}
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
                      onPress={() => handleTempAmountRangeSelect(item.value)}
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
                      onPress={() => handleTempStatusSelect(item.value)}
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
                      </View>
                      <View style={styles.filterMenuItemBadge}>
                        <Text style={[
                          styles.filterMenuItemBadgeText,
                          { color: tempFilter.status === item.value ? (colors.textOnPrimaryCTA || colors.textInverse) : colors.textSecondary }
                        ]}>
                          {getStatusCount(item.value)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Sort Section */}
                <View style={styles.filterMenuSection}>
                  <Text style={[styles.filterMenuSectionTitle, { color: colors.textMuted }]}>Sort By</Text>
                  <View style={styles.sortOptionsContainer}>
                    <TouchableOpacity
                      style={[
                        styles.sortOption,
                        sortBy === 'date' && { backgroundColor: colors.primary + '15', borderColor: colors.primary }
                      ]}
                      onPress={() => handleSortChange('date')}
                    >
                      <Ionicons 
                        name="calendar" 
                        size={16} 
                        color={sortBy === 'date' ? colors.primary : colors.textSecondary} 
                      />
                      <Text style={[
                        styles.sortOptionText,
                        { color: sortBy === 'date' ? colors.primary : colors.textPrimary }
                      ]}>
                        Date
                      </Text>
                      {sortBy === 'date' && (
                        <Ionicons 
                          name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
                          size={12} 
                          color={colors.primary} 
                        />
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.sortOption,
                        sortBy === 'amount' && { backgroundColor: colors.primary + '15', borderColor: colors.primary }
                      ]}
                      onPress={() => handleSortChange('amount')}
                    >
                      <Ionicons 
                        name="cash" 
                        size={16} 
                        color={sortBy === 'amount' ? colors.primary : colors.textSecondary} 
                      />
                      <Text style={[
                        styles.sortOptionText,
                        { color: sortBy === 'amount' ? colors.primary : colors.textPrimary }
                      ]}>
                        Amount
                      </Text>
                      {sortBy === 'amount' && (
                        <Ionicons 
                          name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
                          size={12} 
                          color={colors.primary} 
                        />
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.sortOption,
                        sortBy === 'type' && { backgroundColor: colors.primary + '15', borderColor: colors.primary }
                      ]}
                      onPress={() => handleSortChange('type')}
                    >
                      <Ionicons 
                        name="list" 
                        size={16} 
                        color={sortBy === 'type' ? colors.primary : colors.textSecondary} 
                      />
                      <Text style={[
                        styles.sortOptionText,
                        { color: sortBy === 'type' ? colors.primary : colors.textPrimary }
                      ]}>
                        Type
                      </Text>
                      {sortBy === 'type' && (
                        <Ionicons 
                          name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
                          size={12} 
                          color={colors.primary} 
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
              
              <View style={[styles.filterMenuFooter, { borderTopColor: colors.border }]}>
                <View style={styles.filterMenuFooterContent}>
                  <TouchableOpacity 
                    style={[styles.filterMenuResetButton, { borderColor: colors.border }]}
                    onPress={handleShowResetConfirmation}
                  >
                    <Ionicons name="refresh" size={16} color={colors.textSecondary} />
                    <Text style={[styles.filterMenuResetText, { color: colors.textSecondary }]}>Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.filterMenuApplyButton, { backgroundColor: colors.brandPurple || colors.primary }]}
                    onPress={handleApplyFilters}
                  >
                    <Ionicons name="checkmark" size={16} color={colors.textOnPrimaryCTA || colors.textInverse} />
                    <Text style={[styles.filterMenuApplyText, { color: colors.textOnPrimaryCTA || colors.textInverse }]}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
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

        {/* Enhanced Analytics Dashboard */}
        <EnhancedAnalyticsDashboard
          transactions={mockTransactions}
          visible={analyticsVisible}
          onClose={handleAnalyticsClose}
          colors={colors}
        />

        {/* QR Code Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={qrCodeVisible}
          onRequestClose={handleQRCodeClose}
        >
          <View style={styles.enhancedModalOverlay}>
            <BlurView 
              intensity={20}
              tint={colors.isDark ? "dark" : "light"}
              style={styles.enhancedModalBackdrop}
            >
              <TouchableOpacity 
                style={styles.enhancedModalBackdropTouchable} 
                activeOpacity={1} 
                onPress={handleQRCodeClose}
              />
            </BlurView>
            
            <View style={[styles.enhancedModalContent, { backgroundColor: colors.cardBackground, borderColor: colors.border, maxWidth: 350 }]}>
              {/* QR Code Header */}
              <View style={[styles.enhancedModalHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.enhancedModalHeaderLeft}>
                  <View style={[styles.enhancedModalIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="qr-code-outline" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.enhancedModalHeaderText}>
                    <Text style={[styles.enhancedModalTitle, { color: colors.textPrimary }]}>
                      Transaction QR Code
                    </Text>
                    <Text style={[styles.enhancedModalSubtitle, { color: colors.textMuted }]}>
                      Scan to view details
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleQRCodeClose} style={styles.enhancedModalClose}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.qrCodeContent}>
                <View style={[styles.qrCodeContainer, { backgroundColor: '#fff', borderColor: colors.border }]}>
                  <QRCode
                    value={qrCodeData}
                    size={200}
                    color="#000"
                    backgroundColor="#fff"
                    getRef={(c) => (qrCodeRef.current = c)}
                  />
                </View>
                <Text style={[styles.qrCodeDescription, { color: colors.textMuted }]}>
                  Scan this QR code to view transaction details
                </Text>
                <View style={styles.qrCodeButtons}>
                  <TouchableOpacity 
                    style={[styles.qrCodeShareButton, { backgroundColor: colors.primary }]}
                    onPress={handleShareQRCode}
                  >
                    <Ionicons name="share-outline" size={20} color="#fff" />
                    <Text style={[styles.qrCodeShareText, { color: '#fff' }]}>Share</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.qrCodeShareButton, { backgroundColor: colors.success }]}
                    onPress={handleSaveQRCode}
                  >
                    <Ionicons name="download-outline" size={20} color="#fff" />
                    <Text style={[styles.qrCodeShareText, { color: '#fff' }]}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Location Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showLocationModal}
          onRequestClose={handleLocationModalClose}
        >
          <View style={styles.enhancedModalOverlay}>
            <BlurView 
              intensity={20}
              tint={colors.isDark ? "dark" : "light"}
              style={styles.enhancedModalBackdrop}
            >
              <TouchableOpacity 
                style={styles.enhancedModalBackdropTouchable} 
                activeOpacity={1} 
                onPress={handleLocationModalClose}
              />
            </BlurView>
            
            <View style={[styles.enhancedModalContent, { backgroundColor: colors.cardBackground, borderColor: colors.border, maxWidth: 350 }]}>
              {/* Location Header */}
              <View style={[styles.enhancedModalHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.enhancedModalHeaderLeft}>
                  <View style={[styles.enhancedModalIcon, { backgroundColor: colors.warning + '15' }]}>
                    <Ionicons name="location-outline" size={24} color={colors.warning} />
                  </View>
                  <View style={styles.enhancedModalHeaderText}>
                    <Text style={[styles.enhancedModalTitle, { color: colors.textPrimary }]}>
                      Transaction Location
                    </Text>
                    <Text style={[styles.enhancedModalSubtitle, { color: colors.textMuted }]}>
                      Current location captured
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleLocationModalClose} style={styles.enhancedModalClose}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.locationContent}>
                <View style={[styles.locationMap, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Svg width="100%" height="200" viewBox="0 0 300 200">
                    {/* Simple map representation */}
                    <Rect x="0" y="0" width="300" height="200" fill={colors.background} stroke={colors.border} strokeWidth="1" />
                    <Circle cx="150" cy="100" r="8" fill={colors.warning} />
                    <SvgText x="150" y="120" textAnchor="middle" fontSize="12" fill={colors.textMuted} fontFamily="Montserrat-Regular">
                      Your Location
                    </SvgText>
                  </Svg>
                </View>
                <View style={styles.locationDetails}>
                  <Text style={[styles.locationCoordinate, { color: colors.textPrimary }]}>
                    Latitude: {locationData?.latitude?.toFixed(6)}
                  </Text>
                  <Text style={[styles.locationCoordinate, { color: colors.textPrimary }]}>
                    Longitude: {locationData?.longitude?.toFixed(6)}
                  </Text>
                  <Text style={[styles.locationTime, { color: colors.textMuted }]}>
                    Captured: {locationData?.timestamp ? new Date(locationData.timestamp).toLocaleString() : 'Now'}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.locationOpenButton, { backgroundColor: colors.primary }]}
                  onPress={handleOpenInMaps}
                >
                  <Ionicons name="map-outline" size={20} color="#fff" />
                  <Text style={[styles.locationOpenText, { color: '#fff' }]}>Open in Maps</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Enhanced Transaction Details Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={handleCloseModal}
        >
          <View style={styles.enhancedModalOverlay}>
            <BlurView 
              intensity={20}
              tint={colors.isDark ? "dark" : "light"}
              style={styles.enhancedModalBackdrop}
            >
              <TouchableOpacity 
                style={styles.enhancedModalBackdropTouchable} 
                activeOpacity={1} 
                onPress={handleCloseModal}
              />
            </BlurView>
            
            <View style={[styles.enhancedModalContent, { backgroundColor: colors.cardBackground, borderColor: colors.border, maxHeight: '90%' }]}>
              {selectedTransaction && (
                <>
                  {/* Modal Header */}
                  <View style={[styles.enhancedModalHeader, { borderBottomColor: colors.border }]}>
                    <View style={styles.enhancedModalHeaderLeft}>
                      <View style={[styles.enhancedModalIcon, { backgroundColor: getTransactionIcon(selectedTransaction.type).color + '15' }]}>
                        <Ionicons 
                          name={getTransactionIcon(selectedTransaction.type).name} 
                          size={24} 
                          color={getTransactionIcon(selectedTransaction.type).color} 
                        />
                      </View>
                      <View style={styles.enhancedModalHeaderText}>
                        <Text style={[styles.enhancedModalTitle, { color: colors.textPrimary }]}>
                          {selectedTransaction.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Text>
                        <Text style={[styles.enhancedModalSubtitle, { color: colors.textMuted }]}>
                          {selectedTransaction.status}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={handleCloseModal} style={styles.enhancedModalClose}>
                      <Ionicons name="close" size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.enhancedModalScroll} showsVerticalScrollIndicator={false}>
                    {/* Amount Section */}
                    <View style={styles.enhancedModalAmountSection}>
                      <Text style={[styles.enhancedModalAmount, { color: (selectedTransaction.type === 'sent' || selectedTransaction.type === 'withdrawal' || selectedTransaction.type === 'pay_in_store') ? colors.error : colors.success }]}>
                        {(selectedTransaction.type === 'sent' || selectedTransaction.type === 'withdrawal' || selectedTransaction.type === 'pay_in_store') ? '-' : '+'}
                        {selectedTransaction.currency} {selectedTransaction.amount}
                      </Text>
                      <Text style={[styles.enhancedModalDate, { color: colors.textMuted }]}>
                        {new Date(selectedTransaction.date).toLocaleDateString()} at {new Date(selectedTransaction.date).toLocaleTimeString()}
                      </Text>
                    </View>

                    {/* Transaction Details */}
                    <View style={styles.enhancedModalDetailsSection}>
                      <Text style={[styles.enhancedModalSectionTitle, { color: colors.textPrimary }]}>Transaction Details</Text>
                      
                      <View style={styles.enhancedModalDetailRow}>
                        <Text style={[styles.enhancedModalDetailLabel, { color: colors.textMuted }]}>Reference</Text>
                        <Text style={[styles.enhancedModalDetailValue, { color: colors.textPrimary }]}>{selectedTransaction.reference}</Text>
                      </View>
                      
                      {selectedTransaction.details && (
                        <View style={styles.enhancedModalDetailRow}>
                          <Text style={[styles.enhancedModalDetailLabel, { color: colors.textMuted }]}>Description</Text>
                          <Text style={[styles.enhancedModalDetailValue, { color: colors.textPrimary }]}>{selectedTransaction.details}</Text>
                        </View>
                      )}
                      
                      {selectedTransaction.from && (
                        <View style={styles.enhancedModalDetailRow}>
                          <Text style={[styles.enhancedModalDetailLabel, { color: colors.textMuted }]}>From</Text>
                          <Text style={[styles.enhancedModalDetailValue, { color: colors.textPrimary }]}>{selectedTransaction.from}</Text>
                        </View>
                      )}
                      
                      {selectedTransaction.to && (
                        <View style={styles.enhancedModalDetailRow}>
                          <Text style={[styles.enhancedModalDetailLabel, { color: colors.textMuted }]}>To</Text>
                          <Text style={[styles.enhancedModalDetailValue, { color: colors.textPrimary }]}>{selectedTransaction.to}</Text>
                        </View>
                      )}
                      
                      {selectedTransaction.merchant && (
                        <View style={styles.enhancedModalDetailRow}>
                          <Text style={[styles.enhancedModalDetailLabel, { color: colors.textMuted }]}>Merchant</Text>
                          <Text style={[styles.enhancedModalDetailValue, { color: colors.textPrimary }]}>{selectedTransaction.merchant}</Text>
                        </View>
                      )}
                      
                      {selectedTransaction.method && (
                        <View style={styles.enhancedModalDetailRow}>
                          <Text style={[styles.enhancedModalDetailLabel, { color: colors.textMuted }]}>Method</Text>
                          <Text style={[styles.enhancedModalDetailValue, { color: colors.textPrimary }]}>{selectedTransaction.method}</Text>
                        </View>
                      )}
                      
                      {selectedTransaction.fee && selectedTransaction.fee !== '0.00' && (
                        <View style={styles.enhancedModalDetailRow}>
                          <Text style={[styles.enhancedModalDetailLabel, { color: colors.textMuted }]}>Fee</Text>
                          <Text style={[styles.enhancedModalDetailValue, { color: colors.textPrimary }]}>{selectedTransaction.currency} {selectedTransaction.fee}</Text>
                        </View>
                      )}
                    </View>

                    {/* Status Timeline */}
                    <View style={styles.enhancedModalTimelineSection}>
                      <Text style={[styles.enhancedModalSectionTitle, { color: colors.textPrimary }]}>Status Timeline</Text>
                      <View style={styles.enhancedModalTimeline}>
                        <View style={[styles.enhancedModalTimelineItem, styles.enhancedModalTimelineItemActive]}>
                          <View style={[styles.enhancedModalTimelineDot, { backgroundColor: colors.success }]} />
                          <View style={styles.enhancedModalTimelineContent}>
                            <Text style={[styles.enhancedModalTimelineTitle, { color: colors.textPrimary }]}>Transaction Completed</Text>
                            <Text style={[styles.enhancedModalTimelineTime, { color: colors.textMuted }]}>
                              {new Date(selectedTransaction.date).toLocaleString()}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.enhancedModalActionsSection}>
                      <Text style={[styles.enhancedModalSectionTitle, { color: colors.textPrimary }]}>Actions</Text>
                      
                      <View style={styles.enhancedModalActionButtons}>
                        <TouchableOpacity 
                          style={[styles.enhancedModalActionButton, { backgroundColor: colors.primary }]}
                          onPress={handleShareTransaction}
                        >
                          <Ionicons name="share-outline" size={20} color="#fff" />
                          <Text style={[styles.enhancedModalActionText, { color: '#fff' }]}>Share</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.enhancedModalActionButton, { backgroundColor: colors.success }]}
                          onPress={handleCopyReference}
                        >
                          <Ionicons name="copy-outline" size={20} color="#fff" />
                          <Text style={[styles.enhancedModalActionText, { color: '#fff' }]}>Copy Reference</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.enhancedModalActionButton, { backgroundColor: colors.info }]}
                          onPress={() => handleQRCodePress(selectedTransaction)}
                        >
                          <Ionicons name="qr-code-outline" size={20} color="#fff" />
                          <Text style={[styles.enhancedModalActionText, { color: '#fff' }]}>QR Code</Text>
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.enhancedModalActionButtons}>
                        <TouchableOpacity 
                          style={[styles.enhancedModalActionButton, { backgroundColor: colors.warning }]}
                          onPress={() => handleLocationPress(selectedTransaction)}
                        >
                          <Ionicons name="location-outline" size={20} color="#fff" />
                          <Text style={[styles.enhancedModalActionText, { color: '#fff' }]}>Location</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.enhancedModalActionButton, { backgroundColor: colors.info }]}
                          onPress={handleContactSupport}
                        >
                          <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                          <Text style={[styles.enhancedModalActionText, { color: '#fff' }]}>Support</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.enhancedModalActionButton, { backgroundColor: colors.error }]}
                          onPress={handleReportTransaction}
                        >
                          <Ionicons name="flag-outline" size={20} color="#fff" />
                          <Text style={[styles.enhancedModalActionText, { color: '#fff' }]}>Report</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Export Menu Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={exportMenuVisible}
          onRequestClose={handleExportMenuClose}
        >
          <View style={styles.enhancedModalOverlay}>
            <BlurView 
              intensity={20}
              tint={colors.isDark ? "dark" : "light"}
              style={styles.enhancedModalBackdrop}
            >
              <TouchableOpacity 
                style={styles.enhancedModalBackdropTouchable} 
                activeOpacity={1} 
                onPress={handleExportMenuClose}
              />
            </BlurView>
            
            <View style={[styles.enhancedModalContent, { backgroundColor: colors.cardBackground, borderColor: colors.border, maxWidth: 350 }]}>
              {/* Export Header */}
              <View style={[styles.enhancedModalHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.enhancedModalHeaderLeft}>
                  <View style={[styles.enhancedModalIcon, { backgroundColor: colors.success + '15' }]}>
                    <Ionicons name="download-outline" size={24} color={colors.success} />
                  </View>
                  <View style={styles.enhancedModalHeaderText}>
                    <Text style={[styles.enhancedModalTitle, { color: colors.textPrimary }]}>
                      Export Transactions
                    </Text>
                    <Text style={[styles.enhancedModalSubtitle, { color: colors.textMuted }]}>
                      Choose export format
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleExportMenuClose} style={styles.enhancedModalClose}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.exportContent}>
                <View style={styles.exportOptions}>
                  <TouchableOpacity 
                    style={[styles.exportOption, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={handleExportToCSV}
                    disabled={isExporting}
                  >
                    <Ionicons name="document-text-outline" size={24} color={colors.primary} />
                    <Text style={[styles.exportOptionTitle, { color: colors.textPrimary }]}>CSV Format</Text>
                    <Text style={[styles.exportOptionSubtitle, { color: colors.textMuted }]}>Spreadsheet compatible</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.exportOption, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={handleExportToPDF}
                    disabled={isExporting}
                  >
                    <Ionicons name="document-outline" size={24} color={colors.warning} />
                    <Text style={[styles.exportOptionTitle, { color: colors.textPrimary }]}>PDF Format</Text>
                    <Text style={[styles.exportOptionSubtitle, { color: colors.textMuted }]}>Printable document</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.exportOption, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={handleExportToJSON}
                    disabled={isExporting}
                  >
                    <Ionicons name="code-outline" size={24} color={colors.info} />
                    <Text style={[styles.exportOptionTitle, { color: colors.textPrimary }]}>JSON Format</Text>
                    <Text style={[styles.exportOptionSubtitle, { color: colors.textMuted }]}>Developer friendly</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.exportOption, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={handleExportSummary}
                    disabled={isExporting}
                  >
                    <Ionicons name="stats-chart-outline" size={24} color={colors.success} />
                    <Text style={[styles.exportOptionTitle, { color: colors.textPrimary }]}>Summary Report</Text>
                    <Text style={[styles.exportOptionSubtitle, { color: colors.textMuted }]}>Overview & statistics</Text>
                  </TouchableOpacity>
                </View>
                
                {isExporting && (
                  <View style={styles.exportLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.exportLoadingText, { color: colors.textMuted }]}>Preparing export...</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Modal>

        {/* Refresh Toast */}
        <RefreshToast
          visible={refreshToast.visible}
          type={refreshToast.type}
          message={refreshToast.message}
          onHide={hideRefreshToast}
        />

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Header */}
          <View style={styles.mainHeader}>
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Transaction History</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {Object.values(groupedTransactions).flat().length} transactions
              </Text>
            </View>
          </View>

          {/* Transaction List */}
          {Object.keys(groupedTransactions).length > 0 ? (
            renderTransactionList()
          ) : (
            renderEmptyComponent()
          )}
        </View>

        {/* Enhanced Transaction Details Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={handleCloseModal}
        >
          <View style={styles.enhancedModalOverlay}>
            <BlurView 
              intensity={20}
              tint={colors.isDark ? "dark" : "light"}
              style={styles.enhancedModalBackdrop}
            >
              <TouchableOpacity 
                style={styles.enhancedModalBackdropTouchable} 
                activeOpacity={1} 
                onPress={handleCloseModal}
              />
            </BlurView>
            
            <View style={[styles.enhancedModalContent, { backgroundColor: colors.cardBackground, borderColor: colors.border, maxHeight: '90%' }]}>
              {selectedTransaction && (
                <>
                  {/* Modal Header */}
                  <View style={[styles.enhancedModalHeader, { borderBottomColor: colors.border }]}>
                    <View style={styles.enhancedModalHeaderLeft}>
                      <View style={[styles.enhancedModalIcon, { backgroundColor: getTransactionIcon(selectedTransaction.type).color + '15' }]}>
                        <Ionicons 
                          name={getTransactionIcon(selectedTransaction.type).name} 
                          size={24} 
                          color={getTransactionIcon(selectedTransaction.type).color} 
                        />
                      </View>
                      <View style={styles.enhancedModalHeaderText}>
                        <Text style={[styles.enhancedModalTitle, { color: colors.textPrimary }]}>
                          {selectedTransaction.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Text>
                        <Text style={[styles.enhancedModalSubtitle, { color: colors.textMuted }]}>
                          {selectedTransaction.status}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={handleCloseModal} style={styles.enhancedModalClose}>
                      <Ionicons name="close" size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.enhancedModalScroll} showsVerticalScrollIndicator={false}>
                    {/* Amount Section */}
                    <View style={styles.enhancedModalAmountSection}>
                      <Text style={[styles.enhancedModalAmount, { color: (selectedTransaction.type === 'sent' || selectedTransaction.type === 'withdrawal' || selectedTransaction.type === 'pay_in_store') ? colors.error : colors.success }]}>
                        {(selectedTransaction.type === 'sent' || selectedTransaction.type === 'withdrawal' || selectedTransaction.type === 'pay_in_store') ? '-' : '+'}
                        {selectedTransaction.currency} {selectedTransaction.amount}
                      </Text>
                      <Text style={[styles.enhancedModalDate, { color: colors.textMuted }]}>
                        {new Date(selectedTransaction.date).toLocaleDateString()} at {new Date(selectedTransaction.date).toLocaleTimeString()}
                      </Text>
                    </View>

                    {/* Transaction Details */}
                    <View style={styles.enhancedModalDetailsSection}>
                      <Text style={[styles.enhancedModalSectionTitle, { color: colors.textPrimary }]}>Transaction Details</Text>
                      
                      <View style={styles.enhancedModalDetailRow}>
                        <Text style={[styles.enhancedModalDetailLabel, { color: colors.textMuted }]}>Reference</Text>
                        <Text style={[styles.enhancedModalDetailValue, { color: colors.textPrimary }]}>{selectedTransaction.reference}</Text>
                      </View>
                      
                      {selectedTransaction.details && (
                        <View style={styles.enhancedModalDetailRow}>
                          <Text style={[styles.enhancedModalDetailLabel, { color: colors.textMuted }]}>Description</Text>
                          <Text style={[styles.enhancedModalDetailValue, { color: colors.textPrimary }]}>{selectedTransaction.details}</Text>
                        </View>
                      )}
                      
                      {selectedTransaction.from && (
                        <View style={styles.enhancedModalDetailRow}>
                          <Text style={[styles.enhancedModalDetailLabel, { color: colors.textMuted }]}>From</Text>
                          <Text style={[styles.enhancedModalDetailValue, { color: colors.textPrimary }]}>{selectedTransaction.from}</Text>
                        </View>
                      )}
                      
                      {selectedTransaction.to && (
                        <View style={styles.enhancedModalDetailRow}>
                          <Text style={[styles.enhancedModalDetailLabel, { color: colors.textMuted }]}>To</Text>
                          <Text style={[styles.enhancedModalDetailValue, { color: colors.textPrimary }]}>{selectedTransaction.to}</Text>
                        </View>
                      )}
                      
                      {selectedTransaction.merchant && (
                        <View style={styles.enhancedModalDetailRow}>
                          <Text style={[styles.enhancedModalDetailLabel, { color: colors.textMuted }]}>Merchant</Text>
                          <Text style={[styles.enhancedModalDetailValue, { color: colors.textPrimary }]}>{selectedTransaction.merchant}</Text>
                        </View>
                      )}
                      
                      {selectedTransaction.method && (
                        <View style={styles.enhancedModalDetailRow}>
                          <Text style={[styles.enhancedModalDetailLabel, { color: colors.textMuted }]}>Method</Text>
                          <Text style={[styles.enhancedModalDetailValue, { color: colors.textPrimary }]}>{selectedTransaction.method}</Text>
                        </View>
                      )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.enhancedModalActionsContainer}>
                      <View style={[styles.enhancedModalActions, { borderTopColor: colors.border }]}>
                        <TouchableOpacity 
                          style={[styles.enhancedModalActionButton, { borderColor: colors.border }]}
                          onPress={handleShareTransaction}
                        >
                          <Ionicons name="share-outline" size={20} color={colors.primary} />
                          <Text style={[styles.enhancedModalActionText, { color: colors.primary }]}>Share</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.enhancedModalActionButton, { borderColor: colors.border }]}
                          onPress={() => handleQRCodePress(selectedTransaction)}
                        >
                          <Ionicons name="qr-code-outline" size={20} color={colors.primary} />
                          <Text style={[styles.enhancedModalActionText, { color: colors.primary }]}>QR Code</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.enhancedModalActionButton, { borderColor: colors.border }]}
                          onPress={() => handleLocationPress(selectedTransaction)}
                        >
                          <Ionicons name="location-outline" size={20} color={colors.primary} />
                          <Text style={[styles.enhancedModalActionText, { color: colors.primary }]}>Location</Text>
                        </TouchableOpacity>
                      </View>
                      
                      <View style={[styles.enhancedModalActions, { borderTopColor: colors.border, paddingTop: 8 }]}>
                        <TouchableOpacity 
                          style={[styles.enhancedModalActionButton, { borderColor: colors.border }]}
                          onPress={handleCopyReference}
                        >
                          <Ionicons name="copy-outline" size={20} color={colors.primary} />
                          <Text style={[styles.enhancedModalActionText, { color: colors.primary }]}>Copy Ref</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.enhancedModalActionButton, { borderColor: colors.border }]}
                          onPress={handleContactSupport}
                        >
                          <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
                          <Text style={[styles.enhancedModalActionText, { color: colors.primary }]}>Support</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.enhancedModalActionButton, { borderColor: colors.border }]}
                          onPress={handleReportTransaction}
                        >
                          <Ionicons name="flag-outline" size={20} color={colors.primary} />
                          <Text style={[styles.enhancedModalActionText, { color: colors.primary }]}>Report</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Filter Menu Modal */}
        <FilterMenu
          visible={filterMenuVisible}
          onClose={handleFilterMenuClose}
          tempFilter={tempFilter}
          onFilterSelect={handleTempFilterSelect}
          onDateRangeSelect={handleTempDateRangeSelect}
          onAmountRangeSelect={handleTempAmountRangeSelect}
          onStatusSelect={handleTempStatusSelect}
          onSearchChange={handleTempSearchChange}
          onApply={handleApplyFilters}
          onReset={handleShowResetConfirmation}
          colors={colors}
        />

        {/* Analytics Dashboard Modal */}
        <EnhancedAnalyticsDashboard
          visible={analyticsVisible}
          onClose={handleAnalyticsClose}
          analytics={analytics}
          colors={colors}
        />

        {/* QR Code Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={qrCodeVisible}
          onRequestClose={handleQRCodeClose}
        >
          <View style={styles.enhancedModalOverlay}>
            <BlurView 
              intensity={20}
              tint={colors.isDark ? "dark" : "light"}
              style={styles.enhancedModalBackdrop}
            >
              <TouchableOpacity 
                style={styles.enhancedModalBackdropTouchable} 
                activeOpacity={1} 
                onPress={handleQRCodeClose}
              />
            </BlurView>
            
            <View style={[styles.enhancedModalContent, { backgroundColor: colors.cardBackground, borderColor: colors.border, maxWidth: 350 }]}>
              <View style={[styles.enhancedModalHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.enhancedModalHeaderLeft}>
                  <View style={[styles.enhancedModalIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="qr-code-outline" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.enhancedModalHeaderText}>
                    <Text style={[styles.enhancedModalTitle, { color: colors.textPrimary }]}>QR Code</Text>
                    <Text style={[styles.enhancedModalSubtitle, { color: colors.textMuted }]}>Scan to view details</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleQRCodeClose} style={styles.enhancedModalClose}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.qrCodeContent}>
                <View style={styles.qrCodeContainer}>
                  <QRCode
                    value={qrCodeData}
                    size={200}
                    color={colors.textPrimary}
                    backgroundColor={colors.cardBackground}
                  />
                </View>
                
                <View style={styles.qrCodeActions}>
                  <TouchableOpacity 
                    style={[styles.qrCodeActionButton, { backgroundColor: colors.primary }]}
                    onPress={handleShareQRCode}
                  >
                    <Ionicons name="share-outline" size={20} color="white" />
                    <Text style={[styles.qrCodeActionText, { color: 'white' }]}>Share</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.qrCodeActionButton, { backgroundColor: colors.success }]}
                    onPress={handleSaveQRCode}
                  >
                    <Ionicons name="download-outline" size={20} color="white" />
                    <Text style={[styles.qrCodeActionText, { color: 'white' }]}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Location Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={locationVisible}
          onRequestClose={handleLocationModalClose}
        >
          <View style={styles.enhancedModalOverlay}>
            <BlurView 
              intensity={20}
              tint={colors.isDark ? "dark" : "light"}
              style={styles.enhancedModalBackdrop}
            >
              <TouchableOpacity 
                style={styles.enhancedModalBackdropTouchable} 
                activeOpacity={1} 
                onPress={handleLocationModalClose}
              />
            </BlurView>
            
            <View style={[styles.enhancedModalContent, { backgroundColor: colors.cardBackground, borderColor: colors.border, maxWidth: 350 }]}>
              <View style={[styles.enhancedModalHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.enhancedModalHeaderLeft}>
                  <View style={[styles.enhancedModalIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="location-outline" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.enhancedModalHeaderText}>
                    <Text style={[styles.enhancedModalTitle, { color: colors.textPrimary }]}>Location</Text>
                    <Text style={[styles.enhancedModalSubtitle, { color: colors.textMuted }]}>Transaction location</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleLocationModalClose} style={styles.enhancedModalClose}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.locationContent}>
                <View style={[styles.locationMap, { borderColor: colors.border }]}>
                  <View style={{ width: '100%', height: 200, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="map-outline" size={48} color={colors.textMuted} />
                    <Text style={[styles.locationCoordinate, { color: colors.textMuted }]}>Map placeholder</Text>
                  </View>
                </View>
                
                <View style={styles.locationDetails}>
                  <Text style={[styles.locationCoordinate, { color: colors.textPrimary }]}>
                    Latitude: {locationData?.latitude || 'N/A'}
                  </Text>
                  <Text style={[styles.locationCoordinate, { color: colors.textPrimary }]}>
                    Longitude: {locationData?.longitude || 'N/A'}
                  </Text>
                  <Text style={[styles.locationTime, { color: colors.textMuted }]}>
                    {locationData?.timestamp ? new Date(locationData.timestamp).toLocaleString() : 'N/A'}
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={[styles.locationOpenButton, { backgroundColor: colors.primary }]}
                  onPress={handleOpenInMaps}
                >
                  <Ionicons name="open-outline" size={20} color="white" />
                  <Text style={[styles.locationOpenText, { color: 'white' }]}>Open in Maps</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Export Menu Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={exportMenuVisible}
          onRequestClose={handleExportMenuClose}
        >
          <View style={styles.enhancedModalOverlay}>
            <BlurView 
              intensity={20}
              tint={colors.isDark ? "dark" : "light"}
              style={styles.enhancedModalBackdrop}
            >
              <TouchableOpacity 
                style={styles.enhancedModalBackdropTouchable} 
                activeOpacity={1} 
                onPress={handleExportMenuClose}
              />
            </BlurView>
            
            <View style={[styles.enhancedModalContent, { backgroundColor: colors.cardBackground, borderColor: colors.border, maxWidth: 350 }]}>
              <View style={[styles.enhancedModalHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.enhancedModalHeaderLeft}>
                  <View style={[styles.enhancedModalIcon, { backgroundColor: colors.success + '15' }]}>
                    <Ionicons name="download-outline" size={24} color={colors.success} />
                  </View>
                  <View style={styles.enhancedModalHeaderText}>
                    <Text style={[styles.enhancedModalTitle, { color: colors.textPrimary }]}>Export Transactions</Text>
                    <Text style={[styles.enhancedModalSubtitle, { color: colors.textMuted }]}>Choose export format</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleExportMenuClose} style={styles.enhancedModalClose}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.exportContent}>
                <View style={styles.exportOptions}>
                  <TouchableOpacity 
                    style={[styles.exportOption, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={handleExportToCSV}
                    disabled={isExporting}
                  >
                    <Ionicons name="document-text-outline" size={24} color={colors.primary} />
                    <Text style={[styles.exportOptionTitle, { color: colors.textPrimary }]}>CSV Format</Text>
                    <Text style={[styles.exportOptionSubtitle, { color: colors.textMuted }]}>Spreadsheet compatible</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.exportOption, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={handleExportToPDF}
                    disabled={isExporting}
                  >
                    <Ionicons name="document-outline" size={24} color={colors.warning} />
                    <Text style={[styles.exportOptionTitle, { color: colors.textPrimary }]}>PDF Format</Text>
                    <Text style={[styles.exportOptionSubtitle, { color: colors.textMuted }]}>Printable document</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.exportOption, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={handleExportToJSON}
                    disabled={isExporting}
                  >
                    <Ionicons name="code-outline" size={24} color={colors.info} />
                    <Text style={[styles.exportOptionTitle, { color: colors.textPrimary }]}>JSON Format</Text>
                    <Text style={[styles.exportOptionSubtitle, { color: colors.textMuted }]}>Developer friendly</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.exportOption, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={handleExportSummary}
                    disabled={isExporting}
                  >
                    <Ionicons name="stats-chart-outline" size={24} color={colors.success} />
                    <Text style={[styles.exportOptionTitle, { color: colors.textPrimary }]}>Summary Report</Text>
                    <Text style={[styles.exportOptionSubtitle, { color: colors.textMuted }]}>Overview & statistics</Text>
                  </TouchableOpacity>
                </View>
                
                {isExporting && (
                  <View style={styles.exportLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.exportLoadingText, { color: colors.textMuted }]}>Preparing export...</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Modal>

        {/* Refresh Toast */}
        <RefreshToast
          visible={refreshToast.visible}
          type={refreshToast.type}
          message={refreshToast.message}
          onHide={hideRefreshToast}
        />
      </Animated.View>
    </StandardizedContainer>
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
  filterMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  filterMenuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  filterMenuBackdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  filterMenuBackdropSafeArea: {
    position: 'absolute',
    top: -100,
    left: 0,
    right: 0,
    bottom: -100,
    zIndex: 998,
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
    backgroundColor: 'transparent',
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
  sortOrderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchSuggestionsContainer: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 200,
    overflow: 'hidden',
  },
  searchSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  searchSuggestionText: {
    flex: 1,
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    marginRight: 8,
  },
  searchSuggestionType: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchHistoryContainer: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 150,
    overflow: 'hidden',
  },
  searchHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  searchHistoryTitle: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  searchHistoryText: {
    flex: 1,
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
  },
  // Enhanced Modal Styles
  enhancedModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  enhancedModalBackdropTouchable: {
    flex: 1,
  },
  enhancedModalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },
  enhancedModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  enhancedModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  enhancedModalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  enhancedModalHeaderText: {
    flex: 1,
  },
  enhancedModalTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  enhancedModalSubtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
  },
  enhancedModalClose: {
    padding: 4,
  },
  enhancedModalScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  enhancedModalAmountSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    marginBottom: 20,
  },
  enhancedModalAmount: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  enhancedModalDate: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
  },
  enhancedModalDetailsSection: {
    marginBottom: 24,
  },
  enhancedModalSectionTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  enhancedModalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  enhancedModalDetailLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    flex: 1,
  },
  enhancedModalDetailValue: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    flex: 2,
    textAlign: 'right',
  },
  enhancedModalTimelineSection: {
    marginBottom: 24,
  },
  enhancedModalTimeline: {
    marginTop: 8,
  },
  enhancedModalTimelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  enhancedModalTimelineItemActive: {
    opacity: 1,
  },
  enhancedModalTimelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  enhancedModalTimelineContent: {
    flex: 1,
  },
  enhancedModalTimelineTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    marginBottom: 2,
  },
  enhancedModalTimelineTime: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
  },
  enhancedModalActionsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  enhancedModalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  enhancedModalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  enhancedModalActionText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    marginLeft: 4,
  },
  // Analytics Styles
  analyticsSummarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  analyticsCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  analyticsCardLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  analyticsCardAmount: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    fontWeight: '700',
  },
  analyticsChartSection: {
    marginBottom: 24,
  },
  analyticsChartContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  analyticsLegend: {
    marginTop: 16,
  },
  analyticsLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  analyticsLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  analyticsLegendText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
  },
  analyticsMerchantsSection: {
    marginBottom: 24,
  },
  analyticsMerchantItem: {
    marginBottom: 16,
  },
  analyticsMerchantInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  analyticsMerchantName: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
  },
  analyticsMerchantAmount: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
  },
  analyticsMerchantBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  analyticsMerchantBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  // QR Code Styles
  qrCodeContent: {
    alignItems: 'center',
    padding: 20,
  },
  qrCodeContainer: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  qrCodeDescription: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  qrCodeShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  qrCodeShareText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    marginLeft: 8,
  },
  qrCodeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  // Location Styles
  locationContent: {
    padding: 20,
  },
  locationMap: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  locationDetails: {
    marginBottom: 20,
  },
  locationCoordinate: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    marginBottom: 4,
  },
  locationTime: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    marginTop: 8,
  },
  locationOpenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  locationOpenText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    marginLeft: 8,
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
    backgroundColor: colors.primary,
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
    paddingTop: 18,
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
  // Enhanced empty state styles
  quickActionCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  emptyActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  emptySecondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  // Quick Filter Chips Styles
  quickFilterChipsContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  quickFilterTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    marginBottom: 12,
  },
  quickFilterScroll: {
    flexGrow: 0,
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    minWidth: 80,
  },
  quickFilterChipText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    marginLeft: 4,
  },
  // Sort Options Styles
  sortOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  sortOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    gap: 6,
  },
  sortOptionText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 13,
  },
  emptySecondaryButtonText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
  },
  // Enhanced Modal Styles
  enhancedModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  enhancedModalBackdropTouchable: {
    flex: 1,
  },
  enhancedModalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  enhancedModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  enhancedModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  enhancedModalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  enhancedModalHeaderText: {
    flex: 1,
  },
  enhancedModalTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    marginBottom: 2,
  },
  enhancedModalSubtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
  },
  enhancedModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enhancedModalScroll: {
    maxHeight: 500,
  },
  enhancedModalAmountSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  enhancedModalAmount: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 32,
    marginBottom: 8,
  },
  enhancedModalDate: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
  },
  enhancedModalDetailsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  enhancedModalSectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    marginBottom: 16,
  },
  enhancedModalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  enhancedModalDetailLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    flex: 1,
  },
  enhancedModalDetailValue: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    flex: 2,
    textAlign: 'right',
  },
  enhancedModalTimelineSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  enhancedModalTimeline: {
    marginTop: 8,
  },
  enhancedModalTimelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  enhancedModalTimelineItemActive: {
    opacity: 1,
  },
  enhancedModalTimelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  enhancedModalTimelineContent: {
    flex: 1,
  },
  enhancedModalTimelineTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    marginBottom: 2,
  },
  enhancedModalTimelineTime: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
  },
  enhancedModalActionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  enhancedModalActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  enhancedModalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  enhancedModalActionText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
  },
  // QR Code Modal Styles
  qrCodeContent: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  qrCodeContainer: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  qrCodeDescription: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  qrCodeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  qrCodeShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  qrCodeShareText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
  },
  // Location Modal Styles
  locationContent: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  locationMap: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  locationDetails: {
    marginBottom: 20,
  },
  locationCoordinate: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    marginBottom: 4,
  },
  locationTime: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
  },
  locationOpenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
  },
  locationOpenText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
  },
  // Export Modal Styles
  exportContent: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  exportOptions: {
    gap: 12,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  exportOptionTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    marginBottom: 2,
  },
  exportOptionSubtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
  },
  exportLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  exportLoadingText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
  },
  // Main Content Styles
  mainContent: {
    flex: 1,
    paddingTop: 20,
  },
  mainHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
  },
});

export default TransactionHistoryScreen;


