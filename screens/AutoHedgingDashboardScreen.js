import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const AutoHedgingDashboardScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
     const [hedgingData, setHedgingData] = useState({
     originalDeposit: 15000, // Original amount in local currency (GHS)
     originalCurrency: 'GHS',
     currentValue: 1847.50, // Current value in USD (15000 GHS / 8.33 = ~1800 USD + profit)
     protectionRate: 98.5,
     totalProfit: 47.50, // Profit in USD (realistic 2.6% return)
     monthlyProfit: 12.50,
     weeklyProfit: 2.90,
     dailyProfit: 0.42,
     nextUpdate: new Date(Date.now() + 3600000), // 1 hour from now
     hedgedPortfolio: 85.2,
     riskLevel: 'Low',
     status: 'Active',
     hedgedCurrency: 'USD',
     exchangeRate: 8.33, // GHS to USD rate
   });

  // Mock data for charts
  const [profitHistory] = useState([
    { date: 'Jan', profit: 1200 },
    { date: 'Feb', profit: 1450 },
    { date: 'Mar', profit: 1320 },
    { date: 'Apr', profit: 1680 },
    { date: 'May', profit: 1890 },
    { date: 'Jun', profit: 2847 },
  ]);

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Slide up animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Pulse animation for live indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Simulate API call
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1500);
  };

     const formatCurrency = (amount, currency = hedgingData.hedgedCurrency) => {
     return new Intl.NumberFormat('en-US', {
       style: 'currency',
       currency: currency,
       minimumFractionDigits: 2,
       maximumFractionDigits: 2,
     }).format(amount);
   };

  const formatTimeRemaining = () => {
    const now = new Date();
    const diff = hedgingData.nextUpdate - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return colors.success;
      case 'Pending': return colors.warning;
      case 'Inactive': return colors.error;
      default: return colors.primary;
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'Low': return colors.success;
      case 'Medium': return colors.warning;
      case 'High': return colors.error;
      default: return colors.primary;
    }
  };

     const MetricCard = ({ title, value, subtitle, icon, color, gradient = false }) => (
     <TouchableOpacity
       style={[styles.metricCard, { backgroundColor: colors.cardBackground }]}
       activeOpacity={0.8}
       onPress={() => Haptics.selectionAsync()}
     >
       {gradient ? (
         <LinearGradient
           colors={[color, color + 'DD']}
           style={styles.metricCardGradient}
         >
           <View style={styles.metricHeader}>
             <Ionicons name={icon} size={20} color={colors.white} />
             <Text style={styles.metricTitle}>{title}</Text>
           </View>
           <Text style={styles.metricValue}>{value}</Text>
           {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
         </LinearGradient>
       ) : (
         <>
           <View style={styles.metricHeader}>
             <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
               <Ionicons name={icon} size={20} color={color} />
             </View>
             <Text style={[styles.metricTitle, { color: colors.textPrimary }]}>{title}</Text>
           </View>
           <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{value}</Text>
           {subtitle && (
             <View style={styles.metricSubtitleContainer}>
               <Text style={[styles.metricSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
             </View>
           )}
         </>
       )}
     </TouchableOpacity>
   );

  const ProfitChart = () => (
    <View style={[styles.chartContainer, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.chartHeader}>
        <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Profit History</Text>
        <View style={styles.chartLegend}>
          <View style={[styles.legendItem, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Monthly Profit</Text>
        </View>
      </View>
      
      <View style={styles.chartBars}>
        {profitHistory.map((item, index) => (
          <View key={index} style={styles.chartBarContainer}>
            <View style={styles.chartBarWrapper}>
              <View
                style={[
                  styles.chartBar,
                  {
                    height: (item.profit / 3000) * 120, // Normalize to max height
                    backgroundColor: colors.primary,
                  }
                ]}
              />
            </View>
            <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>{item.date}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Auto-Hedging Dashboard
        </Text>
                 <View style={styles.headerButtons}>
           <TouchableOpacity
             style={styles.headerButton}
             onPress={() => {
               Haptics.selectionAsync();
               // Navigate to hedging settings
             }}
             activeOpacity={0.7}
           >
             <Ionicons name="settings" size={20} color={colors.primary} />
           </TouchableOpacity>
           <TouchableOpacity
             style={styles.headerButton}
             onPress={handleRefresh}
             activeOpacity={0.7}
           >
             <Ionicons name="refresh" size={20} color={colors.primary} />
           </TouchableOpacity>
         </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
                     {/* Status Banner */}
           <View style={[styles.statusBanner, { backgroundColor: colors.backgroundSecondary }]}>
             <View style={styles.statusLeft}>
               <Animated.View
                 style={[
                   styles.liveIndicator,
                   {
                     backgroundColor: getStatusColor(hedgingData.status),
                     transform: [{ scale: pulseAnim }],
                   }
                 ]}
               />
               <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                 Auto-Hedging {hedgingData.status}
               </Text>
             </View>
                            <View style={styles.statusRight}>
                 <View style={[styles.currencyBadge, { backgroundColor: colors.primary + '20' }]}>
                   <Ionicons name="swap-horizontal" size={14} color={colors.primary} />
                   <Text style={[styles.currencyText, { color: colors.primary }]}>
                     {hedgingData.originalCurrency} → {hedgingData.hedgedCurrency}
                   </Text>
                 </View>
                 <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>
                   Last updated: {lastUpdated.toLocaleTimeString()}
                 </Text>
               </View>
           </View>

                     {/* Your Money Story - Easy to Understand */}
           <View style={styles.storySection}>
             <Text style={[styles.storyTitle, { color: colors.textPrimary }]}>
               Your Money Journey
             </Text>
             
             {/* Original Deposit */}
             <View style={[styles.storyCard, { backgroundColor: colors.cardBackground }]}>
               <View style={styles.storyHeader}>
                 <View style={[styles.storyIcon, { backgroundColor: colors.primary + '20' }]}>
                   <Ionicons name="wallet" size={20} color={colors.primary} />
                 </View>
                 <View style={styles.storyText}>
                   <Text style={[styles.storyLabel, { color: colors.textSecondary }]}>
                     You deposited
                   </Text>
                   <Text style={[styles.storyAmount, { color: colors.textPrimary }]}>
                     {formatCurrency(hedgingData.originalDeposit, hedgingData.originalCurrency)}
                   </Text>
                 </View>
               </View>
             </View>

             {/* Arrow showing conversion */}
             <View style={styles.storyArrow}>
               <Ionicons name="arrow-down" size={24} color={colors.primary} />
               <Text style={[styles.storyArrowText, { color: colors.textSecondary }]}>
                 Auto-converted to {hedgingData.hedgedCurrency}
               </Text>
             </View>

             {/* Current Value */}
             <View style={[styles.storyCard, { backgroundColor: colors.cardBackground }]}>
               <View style={styles.storyHeader}>
                 <View style={[styles.storyIcon, { backgroundColor: colors.success + '20' }]}>
                   <Ionicons name="shield-checkmark" size={20} color={colors.success} />
                 </View>
                 <View style={styles.storyText}>
                   <Text style={[styles.storyLabel, { color: colors.textSecondary }]}>
                     Now worth (protected)
                   </Text>
                   <Text style={[styles.storyAmount, { color: colors.textPrimary }]}>
                     {formatCurrency(hedgingData.currentValue, hedgingData.hedgedCurrency)}
                   </Text>
                 </View>
               </View>
             </View>

             {/* Profit */}
             <View style={[styles.storyCard, { backgroundColor: colors.success + '10' }]}>
               <View style={styles.storyHeader}>
                 <View style={[styles.storyIcon, { backgroundColor: colors.success + '20' }]}>
                   <Ionicons name="trending-up" size={20} color={colors.success} />
                 </View>
                 <View style={styles.storyText}>
                   <Text style={[styles.storyLabel, { color: colors.textSecondary }]}>
                     Extra money earned
                   </Text>
                   <Text style={[styles.storyAmount, { color: colors.success }]}>
                     +{formatCurrency(hedgingData.totalProfit, hedgingData.hedgedCurrency)}
                   </Text>
                 </View>
               </View>
             </View>
           </View>

                     {/* Extra Money Earned */}
           <View style={styles.profitBreakdown}>
             <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
               Extra Money You've Earned
             </Text>
             <View style={styles.profitGrid}>
                              <MetricCard
                  title="Month"
                  value={formatCurrency(hedgingData.monthlyProfit)}
                  subtitle={`in ${hedgingData.hedgedCurrency}`}
                  icon="calendar"
                  color={colors.primary}
                />
                <MetricCard
                  title="Week"
                  value={formatCurrency(hedgingData.weeklyProfit)}
                  subtitle={`in ${hedgingData.hedgedCurrency}`}
                  icon="time"
                  color={colors.info}
                />
                <MetricCard
                  title="Today"
                  value={formatCurrency(hedgingData.dailyProfit)}
                  subtitle={`in ${hedgingData.hedgedCurrency}`}
                  icon="today"
                  color={colors.warning}
                />
             </View>
           </View>

          {/* Portfolio & Risk Metrics */}
          <View style={styles.portfolioSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Portfolio & Risk
            </Text>
            <View style={styles.portfolioGrid}>
              <View style={[styles.portfolioCard, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.portfolioHeader}>
                  <Ionicons name="pie-chart" size={20} color={colors.primary} />
                  <Text style={[styles.portfolioTitle, { color: colors.textPrimary }]}>
                    Hedged Portfolio
                  </Text>
                </View>
                <Text style={[styles.portfolioValue, { color: colors.textPrimary }]}>
                  {hedgingData.hedgedPortfolio}%
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${hedgingData.hedgedPortfolio}%`,
                        backgroundColor: colors.primary,
                      }
                    ]}
                  />
                </View>
              </View>

              <View style={[styles.portfolioCard, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.portfolioHeader}>
                  <Ionicons name="warning" size={20} color={getRiskLevelColor(hedgingData.riskLevel)} />
                  <Text style={[styles.portfolioTitle, { color: colors.textPrimary }]}>
                    Risk Level
                  </Text>
                </View>
                <Text style={[styles.portfolioValue, { color: getRiskLevelColor(hedgingData.riskLevel) }]}>
                  {hedgingData.riskLevel}
                </Text>
                <Text style={[styles.portfolioSubtitle, { color: colors.textSecondary }]}>
                  Optimal protection
                </Text>
              </View>
            </View>
          </View>

          {/* Next Update */}
          <View style={[styles.nextUpdateCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.nextUpdateHeader}>
              <Ionicons name="time-outline" size={24} color={colors.primary} />
              <Text style={[styles.nextUpdateTitle, { color: colors.textPrimary }]}>
                Next Update
              </Text>
            </View>
            <Text style={[styles.nextUpdateTime, { color: colors.textPrimary }]}>
              {formatTimeRemaining()}
            </Text>
            <Text style={[styles.nextUpdateSubtitle, { color: colors.textSecondary }]}>
              Automatic portfolio rebalancing
            </Text>
          </View>

          {/* Profit Chart */}
          <ProfitChart />

                     {/* Action Buttons */}
           <View style={styles.actionButtons}>
             <TouchableOpacity
               style={[styles.actionButton, { backgroundColor: colors.primary }]}
               activeOpacity={0.8}
               onPress={() => {
                 Haptics.selectionAsync();
                 // Navigate to detailed analytics
               }}
             >
               <LinearGradient
                 colors={[colors.primary, colors.primary + 'DD']}
                 style={styles.actionButtonGradient}
               >
                 <Ionicons name="analytics" size={20} color={colors.white} />
                 <Text style={styles.actionButtonText}>View Analytics</Text>
               </LinearGradient>
             </TouchableOpacity>
           </View>
                 </Animated.View>
       </ScrollView>

       {/* Floating Action Button for Hedging Settings */}
       <TouchableOpacity
         style={[styles.floatingActionButton, { backgroundColor: colors.primary }]}
         activeOpacity={0.8}
         onPress={() => {
           Haptics.selectionAsync();
           // Navigate to hedging settings
         }}
       >
         <LinearGradient
           colors={[colors.primary, colors.primary + 'DD']}
           style={styles.floatingActionButtonGradient}
         >
           <Ionicons name="settings" size={24} color={colors.white} />
         </LinearGradient>
       </TouchableOpacity>
     </SafeAreaView>
   );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
  },
     headerButtons: {
     flexDirection: 'row',
     gap: 8,
   },
   headerButton: {
     padding: 8,
     borderRadius: 8,
   },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
     animatedContainer: {
     paddingBottom: 100, // Increased to avoid menubar overlap
   },
     statusBanner: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     paddingHorizontal: 16,
     paddingVertical: 12,
     borderRadius: 12,
     marginBottom: 20,
   },
   statusLeft: {
     flexDirection: 'row',
     alignItems: 'center',
     flex: 1,
   },
   statusRight: {
     alignItems: 'flex-end',
   },
   liveIndicator: {
     width: 8,
     height: 8,
     borderRadius: 4,
     marginRight: 8,
   },
   statusText: {
     fontSize: 14,
     fontFamily: 'Montserrat-Medium',
   },
   currencyBadge: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 12,
     marginBottom: 4,
   },
   currencyText: {
     fontSize: 12,
     fontFamily: 'Montserrat-SemiBold',
     fontWeight: '600',
     marginLeft: 4,
   },
   lastUpdated: {
     fontSize: 12,
     fontFamily: 'Montserrat-Regular',
   },
     storySection: {
     marginBottom: 24,
   },
   storyTitle: {
     fontSize: 18,
     fontFamily: 'Montserrat-SemiBold',
     fontWeight: '600',
     marginBottom: 16,
   },
   storyCard: {
     padding: 16,
     borderRadius: 16,
     marginBottom: 12,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 8,
     elevation: 3,
   },
   storyHeader: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   storyIcon: {
     width: 40,
     height: 40,
     borderRadius: 20,
     alignItems: 'center',
     justifyContent: 'center',
     marginRight: 12,
   },
   storyText: {
     flex: 1,
   },
   storyLabel: {
     fontSize: 14,
     fontFamily: 'Montserrat-Regular',
     marginBottom: 4,
   },
   storyAmount: {
     fontSize: 20,
     fontFamily: 'Montserrat-Bold',
     fontWeight: '700',
   },
   storyArrow: {
     alignItems: 'center',
     marginVertical: 8,
   },
   storyArrowText: {
     fontSize: 12,
     fontFamily: 'Montserrat-Regular',
     marginTop: 4,
   },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  metricCardGradient: {
    padding: 16,
    borderRadius: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#FFFFFF',
  },
  metricValue: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
     metricSubtitle: {
     fontSize: 12,
     fontFamily: 'Montserrat-Regular',
     color: '#FFFFFF',
     opacity: 0.8,
   },
   metricSubtitleContainer: {
     marginTop: 4,
     alignItems: 'center',
   },
  profitBreakdown: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    marginBottom: 16,
  },
  profitGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  portfolioSection: {
    marginBottom: 24,
  },
  portfolioGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  portfolioCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  portfolioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  portfolioTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    marginLeft: 8,
  },
  portfolioValue: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    fontWeight: '700',
    marginBottom: 8,
  },
  portfolioSubtitle: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  nextUpdateCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  nextUpdateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nextUpdateTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    marginLeft: 12,
  },
  nextUpdateTime: {
    fontSize: 28,
    fontFamily: 'Montserrat-Bold',
    fontWeight: '700',
    marginBottom: 4,
  },
  nextUpdateSubtitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
  },
  chartContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendItem: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarWrapper: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  chartBar: {
    width: 20,
    borderRadius: 10,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
     actionButtonText: {
     fontSize: 16,
     fontFamily: 'Montserrat-SemiBold',
     fontWeight: '600',
     color: '#FFFFFF',
     marginLeft: 8,
   },
   floatingActionButton: {
     position: 'absolute',
     bottom: 30,
     right: 20,
     width: 56,
     height: 56,
     borderRadius: 28,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.3,
     shadowRadius: 8,
     elevation: 8,
     zIndex: 1000,
   },
   floatingActionButtonGradient: {
     width: '100%',
     height: '100%',
     borderRadius: 28,
     alignItems: 'center',
     justifyContent: 'center',
   },
});

export default AutoHedgingDashboardScreen;
