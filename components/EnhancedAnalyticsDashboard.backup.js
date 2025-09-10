import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

const { width: screenWidth } = Dimensions.get('window');

const EnhancedAnalyticsDashboard = ({ 
  transactions, 
  visible, 
  onClose, 
  colors 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedChart, setSelectedChart] = useState('spending');
  const [isLoading, setIsLoading] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Animate in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: false, // changed from true
          tension: 100,
          friction: 8,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: false, // changed from true
          tension: 100,
          friction: 8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false, // changed from true
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: false, // changed from true
          tension: 100,
          friction: 8,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.8,
          useNativeDriver: false, // changed from true
          tension: 100,
          friction: 8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false, // changed from true
        }),
      ]).start();
    }
  }, [visible]);

  const handlePeriodChange = (period) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPeriod(period);
  };

  const handleChartChange = (chart) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedChart(chart);
  };

  const generateAnalytics = () => {
    const now = new Date();
    let startDate;
    
    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const periodTransactions = transactions.filter(tx => 
      new Date(tx.date) >= startDate
    );

    const totalSpent = periodTransactions
      .filter(tx => tx.type === 'sent' || tx.type === 'withdrawal' || tx.type === 'pay_in_store')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const totalReceived = periodTransactions
      .filter(tx => tx.type === 'received' || tx.type === 'deposit')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const netFlow = totalReceived - totalSpent;

    const byCategory = periodTransactions.reduce((acc, tx) => {
      const category = tx.type;
      if (!acc[category]) {
        acc[category] = { count: 0, amount: 0 };
      }
      acc[category].count++;
      acc[category].amount += parseFloat(tx.amount);
      return acc;
    }, {});

    const byStatus = periodTransactions.reduce((acc, tx) => {
      if (!acc[tx.status]) {
        acc[tx.status] = 0;
      }
      acc[tx.status]++;
      return acc;
    }, {});

    const byCurrency = periodTransactions.reduce((acc, tx) => {
      if (!acc[tx.currency]) {
        acc[tx.currency] = 0;
      }
      acc[tx.currency] += parseFloat(tx.amount);
      return acc;
    }, {});

    const averageTransaction = periodTransactions.length > 0 
      ? periodTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0) / periodTransactions.length
      : 0;

    const largestTransaction = periodTransactions.length > 0
      ? Math.max(...periodTransactions.map(tx => parseFloat(tx.amount)))
      : 0;

    // Calculate spending patterns
    const dailySpending = periodTransactions
      .filter(tx => tx.type === 'sent' || tx.type === 'withdrawal' || tx.type === 'pay_in_store')
      .reduce((acc, tx) => {
        const date = new Date(tx.date).toDateString();
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += parseFloat(tx.amount);
        return acc;
      }, {});

    // Calculate merchant spending
    const merchantSpending = periodTransactions
      .filter(tx => tx.merchant)
      .reduce((acc, tx) => {
        if (!acc[tx.merchant]) {
          acc[tx.merchant] = { amount: 0, count: 0 };
        }
        acc[tx.merchant].amount += parseFloat(tx.amount);
        acc[tx.merchant].count++;
        return acc;
      }, {});

    // Calculate spending velocity (daily average)
    const spendingVelocity = Object.keys(dailySpending).length > 0
      ? Object.values(dailySpending).reduce((sum, amount) => sum + amount, 0) / Object.keys(dailySpending).length
      : 0;

    // Calculate budget insights (assuming monthly budget of $2000)
    const monthlyBudget = 2000;
    const budgetUsed = totalSpent;
    const budgetRemaining = monthlyBudget - budgetUsed;
    const budgetPercentage = (budgetUsed / monthlyBudget) * 100;

    return {
      totalSpent,
      totalReceived,
      netFlow,
      byCategory,
      byStatus,
      byCurrency,
      averageTransaction,
      largestTransaction,
      transactionCount: periodTransactions.length,
      dailySpending,
      merchantSpending,
      spendingVelocity,
      budgetUsed,
      budgetRemaining,
      budgetPercentage,
    };
  };

  const analytics = generateAnalytics();

  const renderMetricCard = (title, value, subtitle, color, icon) => (
    <Animated.View
      style={[
        styles.metricCard,
        { backgroundColor: color + '10', borderColor: color + '30' }
      ]}
    >
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.metricTitle, { color: colors.textMuted }]}>{title}</Text>
      </View>
      <Text style={[styles.metricValue, { color: color }]}>
        ${value.toFixed(2)}
      </Text>
      {subtitle && (
        <Text style={[styles.metricSubtitle, { color: colors.textMuted }]}>
          {subtitle}
        </Text>
      )}
    </Animated.View>
  );

  const renderChartCard = (title, data, type) => (
    <View style={[styles.chartCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.chartHeader}>
        <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>{title}</Text>
        <TouchableOpacity style={styles.chartButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.chartContent}>
        {type === 'category' && (
          <View style={styles.categoryChart}>
            {Object.entries(data).map(([category, info], index) => (
              <View key={category} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(category) }]} />
                  <Text style={[styles.categoryName, { color: colors.textPrimary }]}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </View>
                <View style={styles.categoryStats}>
                  <Text style={[styles.categoryAmount, { color: colors.textPrimary }]}>
                    ${info.amount.toFixed(2)}
                  </Text>
                  <Text style={[styles.categoryCount, { color: colors.textMuted }]}>
                    {info.count} tx
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {type === 'status' && (
          <View style={styles.statusChart}>
            {Object.entries(data).map(([status, count], index) => (
              <View key={status} style={styles.statusItem}>
                <View style={styles.statusInfo}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                  <Text style={[styles.statusName, { color: colors.textPrimary }]}>
                    {status}
                  </Text>
                </View>
                <Text style={[styles.statusCount, { color: colors.textPrimary }]}>
                  {count}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  const getCategoryColor = (category) => {
    const colors = {
      received: '#10b981',
      sent: '#ef4444',
      deposit: '#3b82f6',
      withdrawal: '#f59e0b',
      pay_in_store: '#8b5cf6',
    };
    return colors[category] || '#6b7280';
  };

  const getStatusColor = (status) => {
    const colors = {
      Completed: '#10b981',
      Pending: '#f59e0b',
      Failed: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const periodOptions = [
    { key: 'week', label: 'Week', icon: 'calendar-outline' },
    { key: 'month', label: 'Month', icon: 'calendar' },
    { key: 'quarter', label: 'Quarter', icon: 'calendar-clear' },
    { key: 'year', label: 'Year', icon: 'calendar-number' },
  ];

  const chartOptions = [
    { key: 'spending', label: 'Spending', icon: 'trending-down' },
    { key: 'category', label: 'Categories', icon: 'pie-chart' },
    { key: 'status', label: 'Status', icon: 'checkmark-circle' },
  ];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            })},
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <BlurView
        intensity={20}
        tint={colors.isDark ? "dark" : "light"}
        style={styles.backdrop}
      >
        <TouchableOpacity 
          style={styles.backdropTouchable} 
          activeOpacity={1} 
          onPress={onClose}
        />
      </BlurView>
      
      <View style={[styles.content, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerIcon, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="analytics" size={24} color={colors.success} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                Enhanced Analytics
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Overview
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {periodOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.periodOption,
                  selectedPeriod === option.key && { backgroundColor: colors.primary + '15' }
                ]}
                onPress={() => handlePeriodChange(option.key)}
              >
                <Ionicons 
                  name={option.icon} 
                  size={16} 
                  color={selectedPeriod === option.key ? colors.primary : colors.textMuted} 
                />
                <Text style={[
                  styles.periodLabel,
                  { color: selectedPeriod === option.key ? colors.primary : colors.textMuted }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Key Metrics */}
          <View style={styles.metricsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Key Metrics</Text>
            <View style={styles.metricsGrid}>
              {renderMetricCard(
                'Total Spent',
                analytics.totalSpent,
                `${analytics.transactionCount} transactions`,
                colors.error,
                'trending-down'
              )}
              {renderMetricCard(
                'Total Received',
                analytics.totalReceived,
                'Income & deposits',
                colors.success,
                'trending-up'
              )}
              {renderMetricCard(
                'Net Flow',
                analytics.netFlow,
                analytics.netFlow >= 0 ? 'Positive' : 'Negative',
                analytics.netFlow >= 0 ? colors.success : colors.error,
                analytics.netFlow >= 0 ? 'arrow-up' : 'arrow-down'
              )}
              {renderMetricCard(
                'Average Transaction',
                analytics.averageTransaction,
                'Per transaction',
                colors.primary,
                'calculator'
              )}
            </View>
          </View>

          {/* Budget Tracking */}
          <View style={styles.budgetSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Budget Tracking</Text>
            <View style={[styles.budgetCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.budgetHeader}>
                <View style={styles.budgetInfo}>
                  <Text style={[styles.budgetTitle, { color: colors.textPrimary }]}>Monthly Budget</Text>
                  <Text style={[styles.budgetAmount, { color: colors.textPrimary }]}>$2,000</Text>
                </View>
                <View style={styles.budgetProgress}>
                  <View style={[styles.budgetProgressBar, { backgroundColor: colors.border }]}>
                    <View 
                      style={[
                        styles.budgetProgressFill, 
                        { 
                          width: `${Math.min(analytics.budgetPercentage, 100)}%`,
                          backgroundColor: analytics.budgetPercentage > 80 ? colors.error : 
                                         analytics.budgetPercentage > 60 ? colors.warning : colors.success
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.budgetPercentage, { color: colors.textMuted }]}>
                    {analytics.budgetPercentage.toFixed(1)}% used
                  </Text>
                </View>
              </View>
              <View style={styles.budgetDetails}>
                <View style={styles.budgetDetail}>
                  <Text style={[styles.budgetDetailLabel, { color: colors.textMuted }]}>Spent</Text>
                  <Text style={[styles.budgetDetailValue, { color: colors.error }]}>
                    ${analytics.budgetUsed.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.budgetDetail}>
                  <Text style={[styles.budgetDetailLabel, { color: colors.textMuted }]}>Remaining</Text>
                  <Text style={[styles.budgetDetailValue, { color: colors.success }]}>
                    ${analytics.budgetRemaining.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.budgetDetail}>
                  <Text style={[styles.budgetDetailLabel, { color: colors.textMuted }]}>Daily Avg</Text>
                  <Text style={[styles.budgetDetailValue, { color: colors.primary }]}>
                    ${analytics.spendingVelocity.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Chart Selector */}
          <View style={styles.chartSelector}>
            {chartOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.chartOption,
                  selectedChart === option.key && { backgroundColor: colors.primary + '15' }
                ]}
                onPress={() => handleChartChange(option.key)}
              >
                <Ionicons 
                  name={option.icon} 
                  size={16} 
                  color={selectedChart === option.key ? colors.primary : colors.textMuted} 
                />
                <Text style={[
                  styles.chartLabel,
                  { color: selectedChart === option.key ? colors.primary : colors.textMuted }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Charts */}
          <View style={styles.chartsSection}>
            {selectedChart === 'category' && renderChartCard(
              'Spending by Category',
              analytics.byCategory,
              'category'
            )}
            {selectedChart === 'status' && renderChartCard(
              'Transaction Status',
              analytics.byStatus,
              'status'
            )}
            {selectedChart === 'spending' && (
              <View style={[styles.chartCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.chartHeader}>
                  <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Spending Overview</Text>
                </View>
                <View style={styles.spendingOverview}>
                  <View style={styles.spendingBar}>
                    <View style={[styles.spendingBarFill, { 
                      width: `${(analytics.totalSpent / (analytics.totalSpent + analytics.totalReceived)) * 100}%`,
                      backgroundColor: colors.error 
                    }]} />
                  </View>
                  <View style={styles.spendingLabels}>
                    <Text style={[styles.spendingLabel, { color: colors.textMuted }]}>
                      Spent: ${analytics.totalSpent.toFixed(2)}
                    </Text>
                    <Text style={[styles.spendingLabel, { color: colors.textMuted }]}>
                      Received: ${analytics.totalReceived.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Merchant Spending Insights */}
          {Object.keys(analytics.merchantSpending).length > 0 && (
            <View style={styles.merchantSection}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Top Merchants</Text>
              <View style={[styles.merchantCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                {Object.entries(analytics.merchantSpending)
                  .sort(([,a], [,b]) => b.amount - a.amount)
                  .slice(0, 5)
                  .map(([merchant, data], index) => (
                    <View key={merchant} style={styles.merchantItem}>
                      <View style={styles.merchantInfo}>
                        <Text style={[styles.merchantName, { color: colors.textPrimary }]} numberOfLines={1}>
                          {merchant}
                        </Text>
                        <Text style={[styles.merchantCount, { color: colors.textMuted }]}>
                          {data.count} transactions
                        </Text>
                      </View>
                      <View style={styles.merchantAmount}>
                        <Text style={[styles.merchantAmountText, { color: colors.textPrimary }]}>
                          ${data.amount.toFixed(2)}
                        </Text>
                        <View style={[styles.merchantBar, { backgroundColor: colors.border }]}>
                          <View 
                            style={[
                              styles.merchantBarFill, 
                              { 
                                width: `${(data.amount / Math.max(...Object.values(analytics.merchantSpending).map(m => m.amount))) * 100}%`,
                                backgroundColor: colors.primary 
                              }
                            ]} 
                          />
                        </View>
                      </View>
                    </View>
                  ))}
              </View>
            </View>
          )}

          {/* Insights */}
          <View style={styles.insightsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Insights</Text>
            <View style={[styles.insightCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Ionicons name="bulb-outline" size={20} color={colors.warning} />
              <Text style={[styles.insightText, { color: colors.textPrimary }]}>
                {analytics.netFlow >= 0 
                  ? `You're ${analytics.netFlow >= 100 ? 'significantly' : 'slightly'} ahead this ${selectedPeriod}`
                  : `You've spent ${Math.abs(analytics.netFlow).toFixed(2)} more than received this ${selectedPeriod}`
                }
              </Text>
            </View>
            <View style={[styles.insightCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Ionicons name="trending-up-outline" size={20} color={colors.success} />
              <Text style={[styles.insightText, { color: colors.textPrimary }]}>
                Your average transaction is ${analytics.averageTransaction.toFixed(2)}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdropTouchable: {
    flex: 1,
  },
  content: {
    width: screenWidth * 0.95,
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  periodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  periodLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
  },
  metricsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  metricTitle: {
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 10,
    fontFamily: 'Montserrat-Regular',
  },
  chartSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  chartOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  chartLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
  },
  chartsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  chartCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
  chartButton: {
    padding: 4,
  },
  chartContent: {
    gap: 12,
  },
  categoryChart: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
  },
  categoryStats: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
  },
  categoryCount: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
  },
  statusChart: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusName: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
  },
  statusCount: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
  },
  spendingOverview: {
    gap: 12,
  },
  spendingBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  spendingBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  spendingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spendingLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
  },
  // Budget Tracking Styles
  budgetSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  budgetCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 12,
  },
  budgetHeader: {
    marginBottom: 16,
  },
  budgetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
  },
  budgetAmount: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
  },
  budgetProgress: {
    gap: 8,
  },
  budgetProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetPercentage: {
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    textAlign: 'right',
  },
  budgetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetDetail: {
    alignItems: 'center',
    flex: 1,
  },
  budgetDetailLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    marginBottom: 4,
  },
  budgetDetailValue: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
  },
  // Merchant Spending Styles
  merchantSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  merchantCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 12,
  },
  merchantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  merchantInfo: {
    flex: 1,
    marginRight: 12,
  },
  merchantName: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 2,
  },
  merchantCount: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
  },
  merchantAmount: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  merchantAmountText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    marginBottom: 4,
  },
  merchantBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    width: 60,
  },
  merchantBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  insightsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  insightText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    flex: 1,
  },
});

export default EnhancedAnalyticsDashboard; 