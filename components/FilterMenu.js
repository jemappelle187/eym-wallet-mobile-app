import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Typography } from '../constants/Typography';
import * as Haptics from 'expo-haptics';

const FilterMenu = ({
  visible,
  onClose,
  colors,
  tempFilter,
  onFilterSelect,
  onDateRangeSelect,
  onAmountRangeSelect,
  onStatusSelect,
  onSearchChange,
  onReset,
  onApply,
  isLoadingReset,
  isLoadingApply,
  getTransactionCount,
  getStatusCount,
  sortBy,
  sortOrder,
  onSortChange,
}) => {
  // Animation refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState({
    transactionType: true,
    dateRange: true,
    amountRange: true,
    status: true,
    sortBy: true,
  });
  
  // Animation refs for collapsible sections
  const sectionAnimations = useRef({
    transactionType: new Animated.Value(0),
    dateRange: new Animated.Value(0),
    amountRange: new Animated.Value(0),
    status: new Animated.Value(0),
    sortBy: new Animated.Value(0),
  }).current;

  // Animation effects
  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Animate in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.8,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible]);

  const toggleSection = (sectionName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isCollapsed = collapsedSections[sectionName];
    
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !isCollapsed
    }));
    
    // Animate the section
    Animated.timing(sectionAnimations[sectionName], {
      toValue: isCollapsed ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  if (!visible) return null;

  return (
    <View style={styles.filterMenuContainer}>
      <Animated.View style={[{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      }, { opacity: fadeAnim }]}>
        <BlurView 
          intensity={20}
          tint="light"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
        </BlurView>
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.filterMenu, 
          { 
            backgroundColor: colors.cardBackground, 
            borderColor: colors.border,
            transform: [
              { translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })},
              { scale: scaleAnim }
            ],
            opacity: fadeAnim
          }
        ]}
      >
        <View style={styles.filterMenuHeader}>
          <View style={styles.filterMenuHeaderContent}>
            <Ionicons name="filter" size={20} color={colors.textPrimary} />
            <Text style={[styles.filterMenuTitle, { color: colors.textPrimary }]}>Filter Transactions</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.filterMenuClose}>
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
                  onPress={() => onDateRangeSelect('today')}
                >
                  <Ionicons name="today-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.quickFilterChipText, { color: colors.textPrimary }]}>Today</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.quickFilterChip, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => onDateRangeSelect('week')}
                >
                  <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.quickFilterChipText, { color: colors.textPrimary }]}>This Week</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.quickFilterChip, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => onFilterSelect('sent')}
                >
                  <Ionicons name="arrow-up-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.quickFilterChipText, { color: colors.textPrimary }]}>Sent</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.quickFilterChip, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => onFilterSelect('received')}
                >
                  <Ionicons name="arrow-down-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.quickFilterChipText, { color: colors.textPrimary }]}>Received</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>

          {/* Transaction Type Section */}
          <View style={[styles.filterMenuSection, { marginTop: 8 }]}>
            <TouchableOpacity 
              style={styles.collapsibleHeader}
              onPress={() => toggleSection('transactionType')}
            >
              <Text style={[styles.filterMenuSectionTitle, { color: colors.textMuted }]}>Transaction Type</Text>
              <Animated.View style={{
                transform: [{
                  rotate: sectionAnimations.transactionType.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg']
                  })
                }]
              }}>
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
              </Animated.View>
                          </TouchableOpacity>
              <Animated.View style={{
                opacity: sectionAnimations.transactionType,
                maxHeight: sectionAnimations.transactionType.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 500]
                }),
                overflow: 'hidden',
              }}>
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
                onPress={() => onFilterSelect(item.type)}
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
              </Animated.View>
          </View>

          {/* Date Range Section */}
          <View style={styles.filterMenuSection}>
            <TouchableOpacity 
              style={styles.collapsibleHeader}
              onPress={() => toggleSection('dateRange')}
            >
              <Text style={[styles.filterMenuSectionTitle, { color: colors.textMuted }]}>Date Range</Text>
              <Animated.View style={{
                transform: [{
                  rotate: sectionAnimations.dateRange.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg']
                  })
                }]
              }}>
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
              </Animated.View>
                          </TouchableOpacity>
              <Animated.View style={{
                opacity: sectionAnimations.dateRange,
                maxHeight: sectionAnimations.dateRange.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 500]
                }),
                overflow: 'hidden',
              }}>
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
                onPress={() => onDateRangeSelect(item.value)}
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
              </Animated.View>
          </View>

          {/* Amount Range Section */}
          <View style={styles.filterMenuSection}>
            <TouchableOpacity 
              style={styles.collapsibleHeader}
              onPress={() => toggleSection('amountRange')}
            >
              <Text style={[styles.filterMenuSectionTitle, { color: colors.textMuted }]}>Amount Range</Text>
              <Animated.View style={{
                transform: [{
                  rotate: sectionAnimations.amountRange.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg']
                  })
                }]
              }}>
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
              </Animated.View>
                          </TouchableOpacity>
              <Animated.View style={{
                opacity: sectionAnimations.amountRange,
                maxHeight: sectionAnimations.amountRange.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 500]
                }),
                overflow: 'hidden',
              }}>
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
                onPress={() => onAmountRangeSelect(item.value)}
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
              </Animated.View>
          </View>

          {/* Status Section */}
          <View style={styles.filterMenuSection}>
            <TouchableOpacity 
              style={styles.collapsibleHeader}
              onPress={() => toggleSection('status')}
            >
              <Text style={[styles.filterMenuSectionTitle, { color: colors.textMuted }]}>Status</Text>
              <Animated.View style={{
                transform: [{
                  rotate: sectionAnimations.status.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg']
                  })
                }]
              }}>
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
              </Animated.View>
                          </TouchableOpacity>
              <Animated.View style={{
                opacity: sectionAnimations.status,
                maxHeight: sectionAnimations.status.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 500]
                }),
                overflow: 'hidden',
              }}>
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
                onPress={() => onStatusSelect(item.value)}
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
              </Animated.View>
          </View>

          {/* Sort Section */}
          <View style={styles.filterMenuSection}>
            <TouchableOpacity 
              style={styles.collapsibleHeader}
              onPress={() => toggleSection('sortBy')}
            >
              <Text style={[styles.filterMenuSectionTitle, { color: colors.textMuted }]}>Sort By</Text>
              <Animated.View style={{
                transform: [{
                  rotate: sectionAnimations.sortBy.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg']
                  })
                }]
              }}>
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
              </Animated.View>
                          </TouchableOpacity>
              <Animated.View style={{
                opacity: sectionAnimations.sortBy,
                maxHeight: sectionAnimations.sortBy.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 500]
                }),
                overflow: 'hidden',
              }}>
                <View style={styles.sortOptionsContainer}>
              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === 'date' && { backgroundColor: colors.primary + '15', borderColor: colors.primary }
                ]}
                onPress={() => onSortChange('date')}
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
                onPress={() => onSortChange('amount')}
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
                onPress={() => onSortChange('type')}
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
              </Animated.View>
          </View>
        </ScrollView>
        
        <View style={[styles.filterMenuFooter, { borderTopColor: colors.border }]}>
          <View style={styles.filterMenuFooterContent}>
            <TouchableOpacity 
              style={[styles.filterMenuResetButton, { borderColor: colors.border }]}
              onPress={onReset}
              disabled={isLoadingReset}
            >
              <Ionicons name="refresh" size={16} color={colors.textSecondary} />
              <Text style={[styles.filterMenuResetText, { color: colors.textSecondary }]}>
                {isLoadingReset ? 'Resetting...' : 'Reset'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterMenuApplyButton, { backgroundColor: colors.brandPurple || colors.primary }]}
              onPress={onApply}
              disabled={isLoadingApply}
            >
              <Ionicons name="checkmark" size={16} color={colors.textOnPrimaryCTA || colors.textInverse} />
              <Text style={[styles.filterMenuApplyText, { color: colors.textOnPrimaryCTA || colors.textInverse }]}>
                {isLoadingApply ? 'Applying...' : 'Apply'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = {
  filterMenuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  filterMenuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  filterMenuBackdropTouchable: {
    flex: 1,
  },
  filterMenu: {
    width: '95%',
    height: '70%',
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: 'white',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  filterMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  filterMenuHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterMenuTitle: {
    ...Typography.heading,
    fontSize: 18,
  },
  filterMenuClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterMenuScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterMenuSection: {
    marginVertical: 16,
  },
  filterMenuSectionTitle: {
    ...Typography.label,
    fontSize: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  quickFilterChipsContainer: {
    marginTop: 8,
    marginBottom: 4,
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
    ...Typography.caption,
    marginLeft: 4,
  },
  filterMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  filterMenuItemActive: {
    // Active state styles
  },
  filterMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterMenuItemText: {
    ...Typography.body,
    fontWeight: '500',
  },
  filterMenuItemBadge: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  filterMenuItemBadgeText: {
    ...Typography.caption,
    fontWeight: '600',
  },
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
    ...Typography.caption,
    fontWeight: '500',
  },
  filterMenuFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginRight: 8,
  },
  filterMenuResetText: {
    ...Typography.label,
    marginLeft: 6,
    fontWeight: '500',
  },
  filterMenuApplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    marginLeft: 8,
  },
  filterMenuApplyText: {
    ...Typography.label,
    marginLeft: 6,
    fontWeight: '600',
  },
};

export default FilterMenu; 