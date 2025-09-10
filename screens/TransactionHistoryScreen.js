// sendnreceive-app/screens/TransactionHistoryScreen.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { mockTransactions } from '../data/mockTransactions';
import TransactionListItem from '../components/TransactionListItem';
import FilterMenu from '../components/FilterMenu';

import RefreshToast from '../components/RefreshToast';
import EnhancedAnalyticsDashboard from '../components/EnhancedAnalyticsDashboard';
import { exportToCSV, exportToPDF, exportToJSON, exportSummary } from '../utils/exportHelpers';
import StandardizedContainer from '../components/StandardizedContainer';
import { Typography } from '../constants/Typography';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

export default function TransactionHistoryScreen({ navigation, route }) {
  const { colors = {} } = useTheme();
  const nav = useNavigation();

  // Animation refs for Export modal
  const exportSlideAnim = useRef(new Animated.Value(0)).current;
  const exportScaleAnim = useRef(new Animated.Value(0.8)).current;
  const exportFadeAnim = useRef(new Animated.Value(0)).current;

  // Listen for custom navigation events from PremiumTabBar
  useEffect(() => {
    const unsubscribe = nav.addListener('custom', (event) => {
      if (event.target === 'Activity') {
        const { action } = event.data || {};
        switch (action) {
          case 'showAnalytics':
            setAnalyticsVisible(true);
            break;
          case 'showExport':
            setExportMenuVisible(true);
            break;
          case 'showFilter':
            setFilterMenuVisible(true);
            break;
          default:
            break;
        }
      }
    });

    return unsubscribe;
  }, [nav]);

  // Listen for navigation parameters as backup method
  useEffect(() => {
    if (route.params) {
      if (route.params.showAnalytics) {
        setAnalyticsVisible(true);
        // Clear the parameter
        navigation.setParams({ showAnalytics: undefined });
      }
      if (route.params.showExport) {
        setExportMenuVisible(true);
        navigation.setParams({ showExport: undefined });
      }
      if (route.params.showFilter) {
        setFilterMenuVisible(true);
        navigation.setParams({ showFilter: undefined });
      }

    }
  }, [route.params, navigation]);

  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const handleFilterMenuClose = () => setFilterMenuVisible(false);

  const [expandedTransactionId, setExpandedTransactionId] = useState(null);
  const handleTransactionPress = (tx) => {
    Haptics.selectionAsync();
    if (expandedTransactionId === tx.id) {
      setExpandedTransactionId(null); // Collapse if already expanded
    } else {
      setExpandedTransactionId(tx.id); // Expand this transaction
    }
  };
  const handleTransactionCollapse = () => setExpandedTransactionId(null);

  const [refreshToast, setRefreshToast] = useState({
    visible: false,
    type: 'success',
    message: '',
  });

  const showRefreshToast = (type, message) => {
    setRefreshToast({ visible: true, type, message });
  };

  const hideRefreshToast = () => {
    setRefreshToast({ visible: false, type: 'success', message: '' });
  };

  const [tempFilter, setTempFilter] = useState({
      types: ['all'], 
      dateRange: 'all',
      amountRange: 'all',
      status: 'all',
  });

  const [analyticsVisible, setAnalyticsVisible] = useState(false);
  const [exportMenuVisible, setExportMenuVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  


  // Filter transactions based on current filter settings
  const filteredTransactions = useMemo(() => {
    let filtered = [...mockTransactions];

    // Filter by transaction type
    if (tempFilter.types.length > 0 && !tempFilter.types.includes('all')) {
      filtered = filtered.filter(tx => tx && tx.type && tempFilter.types.includes(tx.type));
    }

    // Filter by date range
    if (tempFilter.dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (tempFilter.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
        break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        filtered = filtered.filter(tx => tx && tx.date && new Date(tx.date) >= startDate);
      }
    }

    // Filter by amount range
    if (tempFilter.amountRange !== 'all') {
      const [min, max] = tempFilter.amountRange.split('-').map(Number);
      filtered = filtered.filter(tx => {
        if (!tx || !tx.amount) return false;
        const amount = parseFloat(tx.amount);
        if (isNaN(amount)) return false;
        if (max) {
          return amount >= min && amount <= max;
        } else {
          return amount >= min;
        }
      });
    }

    // Filter by status
    if (tempFilter.status !== 'all') {
      filtered = filtered.filter(tx => tx && tx.status && tx.status === tempFilter.status);
    }

    // Filter by search query
    if (tempFilter.search && tempFilter.search.trim()) {
      const searchTerm = tempFilter.search.toLowerCase();
      filtered = filtered.filter(tx => {
        if (!tx) return false;
        return (
          (tx.from && tx.from.toLowerCase().includes(searchTerm)) ||
          (tx.to && tx.to.toLowerCase().includes(searchTerm)) ||
          (tx.reference && tx.reference.toLowerCase().includes(searchTerm)) ||
          (tx.amount && tx.amount.toString().includes(searchTerm))
        );
      });
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      if (!a || !b || !a.date || !b.date) return 0;
      return new Date(b.date) - new Date(a.date);
    });

    return filtered;
  }, [tempFilter]);

  // Group transactions by date for better UI
  const groupedTransactions = useMemo(() => {
    const groups = {};
    
    filteredTransactions.forEach(transaction => {
      if (!transaction || !transaction.date) return;
      
      const date = new Date(transaction.date);
      const dateKey = date.toDateString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: date,
          dateKey: dateKey,
          transactions: []
        };
      }
      
      groups[dateKey].transactions.push(transaction);
    });
    
    // Sort groups by date (newest first)
    return Object.values(groups).sort((a, b) => b.date - a.date);
  }, [filteredTransactions]);

  // Format date for display
  const formatDateHeader = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Export modal animation effects
  useEffect(() => {
    if (exportMenuVisible) {
      // Trigger haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Animate in
      Animated.parallel([
        Animated.spring(exportSlideAnim, {
          toValue: 1,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(exportScaleAnim, {
          toValue: 1,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(exportFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.spring(exportSlideAnim, {
          toValue: 0,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(exportScaleAnim, {
          toValue: 0.8,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(exportFadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [exportMenuVisible]);



  const handleAnalyticsClose = () => setAnalyticsVisible(false);

  // Export functions
  const handleExportPress = () => {
    setFilterMenuVisible(false);
    setExportMenuVisible(true);
  };

  const handleExportMenuClose = () => {
    setExportMenuVisible(false);
  };

  const handleExportToCSV = async () => {
    setIsExporting(true);
    try {
      await exportToCSV(mockTransactions);
      showRefreshToast('success', 'Transactions exported to CSV');
    } catch (error) {
      showRefreshToast('error', 'Failed to export CSV');
    } finally {
      setIsExporting(false);
      setExportMenuVisible(false);
    }
  };

  const handleExportToPDF = async () => {
    setIsExporting(true);
    try {
      await exportToPDF(mockTransactions);
      showRefreshToast('success', 'Transactions exported to PDF');
    } catch (error) {
      showRefreshToast('error', 'Failed to export PDF');
    } finally {
      setIsExporting(false);
      setExportMenuVisible(false);
    }
  };

  const handleExportToJSON = async () => {
    setIsExporting(true);
    try {
      await exportToJSON(mockTransactions);
      showRefreshToast('success', 'Transactions exported to JSON');
    } catch (error) {
      showRefreshToast('error', 'Failed to export JSON');
    } finally {
      setIsExporting(false);
      setExportMenuVisible(false);
    }
  };

  const handleExportSummary = async () => {
    setIsExporting(true);
    try {
      await exportSummary(mockTransactions);
      showRefreshToast('success', 'Summary report exported');
    } catch (error) {
      showRefreshToast('error', 'Failed to export summary');
    } finally {
      setIsExporting(false);
      setExportMenuVisible(false);
    }
  };



    return (
    <>
    <StandardizedContainer 
      backgroundColor={colors.background}
      showGlobeBackground={true}
      globeOpacity={0.13}
      statusBarStyle="dark-content"
    >
        <View style={{ flex: 1 }}>
          {/* Subtle background pattern */}
          <View style={[styles.backgroundPattern, { backgroundColor: colors.lightBlue + '10' }]} pointerEvents="none" />

          {/* Transaction List */}
          <ScrollView 
            style={styles.transactionList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.transactionListContent}
          >
            {groupedTransactions.length > 0 ? (
              groupedTransactions.map((group, groupIndex) => (
                <View key={group.dateKey}>
                  {/* Date Header */}
                  <View style={[styles.dateHeader, { backgroundColor: colors.cardBackground, borderColor: colors.border, opacity: 0.7 }]}>
                    <Text style={[styles.dateHeaderText, { color: colors.textPrimary }]}>
                      {formatDateHeader(group.date)}
              </Text>
              </View>
              
                  {/* Transactions for this date */}
                  {group.transactions.map((transaction, index) => (
                    <TransactionListItem
                      key={transaction.id}
                      item={transaction}
                      onPress={() => handleTransactionPress(transaction)}
                      index={index}
                      colors={colors}
                      expanded={expandedTransactionId === transaction.id}
                      collapse={handleTransactionCollapse}
                    />
                  ))}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
                  No transactions found
                        </Text>
                <Text style={[styles.emptyStateSubtitle, { color: colors.textMuted }]}>
                  Try adjusting your filters or search criteria
                        </Text>
                      </View>
            )}
              </ScrollView>
                </View>
      </StandardizedContainer>

      {/* Modals - Rendered outside StandardizedContainer for proper overlay */}
      <FilterMenu
        visible={filterMenuVisible}
        onClose={handleFilterMenuClose}
        colors={colors}
        tempFilter={tempFilter}
        onFilterSelect={(type) => {
          setTempFilter(prev => ({
            ...prev,
            types: prev.types.includes(type) 
              ? prev.types.filter(t => t !== type)
              : [...prev.types.filter(t => t !== 'all'), type]
          }));
        }}
        onDateRangeSelect={(range) => setTempFilter(prev => ({ ...prev, dateRange: range }))}
        onAmountRangeSelect={(range) => setTempFilter(prev => ({ ...prev, amountRange: range }))}
        onStatusSelect={(status) => setTempFilter(prev => ({ ...prev, status }))}
        onSearchChange={(text) => setTempFilter(prev => ({ ...prev, search: text }))}
        onReset={() => {
          setTempFilter({
            types: ['all'],
            dateRange: 'all',
            amountRange: 'all',
            status: 'all',
            search: ''
          });
          setFilterMenuVisible(false);
        }}
        onApply={() => {
          setFilterMenuVisible(false);
          showRefreshToast('success', 'Filters applied successfully');
        }}
        isLoadingReset={false}
        isLoadingApply={false}
        getTransactionCount={(type) => mockTransactions.filter(t => t.type === type).length}
        getStatusCount={(status) => mockTransactions.filter(t => t.status === status).length}
        sortBy="date"
        sortOrder="desc"
        onSortChange={(sortBy, sortOrder) => {
          // Handle sort change
        }}
      />



        <EnhancedAnalyticsDashboard
          visible={analyticsVisible}
          onClose={handleAnalyticsClose}
        transactions={mockTransactions}
          colors={colors}
        />

        {/* Export Menu Modal */}
      {exportMenuVisible && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <Animated.View style={[{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          }, { opacity: exportFadeAnim }]}>
            <BlurView 
              intensity={20}
              tint="light"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.1)', // More transparent to let blur show through
              }}
            >
              <TouchableOpacity style={{ flex: 1 }} onPress={handleExportMenuClose} />
            </BlurView>
          </Animated.View>
          
          <Animated.View 
            style={[
              {
                width: '90%',
                maxWidth: 400,
                borderRadius: 24,
                backgroundColor: 'white',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 20,
                overflow: 'hidden',
              },
              {
                transform: [
                  { translateY: exportSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })},
                  { scale: exportScaleAnim }
                ],
                opacity: exportFadeAnim
              }
            ]}
          >
              {/* Export Header */}
            <View style={[styles.modalHeader, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalHeaderIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="download-outline" size={24} color={colors.primary} />
                  </View>
                <View style={styles.modalHeaderText}>
                  <Text style={[styles.modalHeaderTitle, { color: colors.textPrimary }]}>
                      Export Transactions
                    </Text>
                  <Text style={[styles.modalHeaderSubtitle, { color: colors.textMuted }]}>
                      Choose export format
                    </Text>
                  </View>
                </View>
              <TouchableOpacity onPress={handleExportMenuClose} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.exportContent}>
                <View style={styles.exportOptions}>
                  <TouchableOpacity 
                  style={[styles.exportOption, { backgroundColor: colors.background || '#f8fafc', borderColor: colors.border || '#e5e7eb' }]}
                    onPress={handleExportToCSV}
                    disabled={isExporting}
                  >
                  <Ionicons name="document-text-outline" size={24} color={colors.primary || '#1e40af'} />
                  <Text style={[styles.exportOptionTitle, { color: colors.textPrimary || '#1f2937' }]}>CSV Format</Text>
                  <Text style={[styles.exportOptionSubtitle, { color: colors.textMuted || '#6b7280' }]}>Spreadsheet compatible</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                  style={[styles.exportOption, { backgroundColor: colors.background || '#f8fafc', borderColor: colors.border || '#e5e7eb' }]}
                    onPress={handleExportToPDF}
                    disabled={isExporting}
                  >
                  <Ionicons name="document-outline" size={24} color={colors.warning || '#f59e0b'} />
                  <Text style={[styles.exportOptionTitle, { color: colors.textPrimary || '#1f2937' }]}>PDF Format</Text>
                  <Text style={[styles.exportOptionSubtitle, { color: colors.textMuted || '#6b7280' }]}>Printable document</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                  style={[styles.exportOption, { backgroundColor: colors.background || '#f8fafc', borderColor: colors.border || '#e5e7eb' }]}
                    onPress={handleExportToJSON}
                    disabled={isExporting}
                  >
                  <Ionicons name="code-outline" size={24} color={colors.info || '#3b82f6'} />
                  <Text style={[styles.exportOptionTitle, { color: colors.textPrimary || '#1f2937' }]}>JSON Format</Text>
                  <Text style={[styles.exportOptionSubtitle, { color: colors.textMuted || '#6b7280' }]}>Developer friendly</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                  style={[styles.exportOption, { backgroundColor: colors.background || '#f8fafc', borderColor: colors.border || '#e5e7eb' }]}
                    onPress={handleExportSummary}
                    disabled={isExporting}
                  >
                  <Ionicons name="stats-chart-outline" size={24} color={colors.success || '#10b981'} />
                  <Text style={[styles.exportOptionTitle, { color: colors.textPrimary || '#1f2937' }]}>Summary Report</Text>
                  <Text style={[styles.exportOptionSubtitle, { color: colors.textMuted || '#6b7280' }]}>Overview & statistics</Text>
                  </TouchableOpacity>
                </View>
                
                {isExporting && (
                  <View style={styles.exportLoading}>
                  <ActivityIndicator size="small" color={colors.primary || '#1e40af'} />
                  <Text style={[styles.exportLoadingText, { color: colors.textMuted || '#6b7280' }]}>Preparing export...</Text>
                  </View>
                )}
              </View>
          </Animated.View>
            </View>
      )}
      




        <RefreshToast
          visible={refreshToast.visible}
          type={refreshToast.type}
          message={refreshToast.message}
        onClose={hideRefreshToast}
        colors={colors}
        />
    </>
  );
}

const styles = StyleSheet.create({

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
    marginLeft: 12,
  },
  exportOptionSubtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    marginLeft: 12,
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
    marginLeft: 12,
  },


  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalHeaderTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    marginBottom: 2,
  },
  modalHeaderSubtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Date Header Styles
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateHeaderText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
  },
  dateHeaderCount: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
  },


});


