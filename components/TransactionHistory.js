import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

const TransactionHistory = ({ transactions = [], onTransactionPress }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filters = [
    { id: 'all', label: 'All', icon: 'list' },
    { id: 'sent', label: 'Sent', icon: 'arrow-up' },
    { id: 'received', label: 'Received', icon: 'arrow-down' },
    { id: 'pending', label: 'Pending', icon: 'time' },
  ];

  const mockTransactions = transactions.length > 0 ? transactions : [
    {
      id: '1',
      type: 'sent',
      amount: 150.00,
      currency: 'USD',
      recipient: 'John Doe',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: 'completed',
      description: 'Payment for services',
    },
    {
      id: '2',
      type: 'received',
      amount: 500.00,
      currency: 'EUR',
      sender: 'Sarah Smith',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      status: 'completed',
      description: 'Freelance payment',
    },
    {
      id: '3',
      type: 'sent',
      amount: 75.50,
      currency: 'GHS',
      recipient: 'Mike Johnson',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      status: 'pending',
      description: 'Lunch payment',
    },
    {
      id: '4',
      type: 'received',
      amount: 1200.00,
      currency: 'USD',
      sender: 'Emma Wilson',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      status: 'completed',
      description: 'Project payment',
    },
  ];

  const filteredTransactions = useMemo(() => {
    let filtered = mockTransactions;

    // Apply type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === selectedFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.description?.toLowerCase().includes(query) ||
        tx.recipient?.toLowerCase().includes(query) ||
        tx.sender?.toLowerCase().includes(query) ||
        tx.amount.toString().includes(query)
      );
    }

    return filtered.sort((a, b) => b.date - a.date);
  }, [mockTransactions, selectedFilter, searchQuery]);

  const formatDate = (date) => {
    if (!date) return '';
    const d = (date instanceof Date) ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffInHours = (now - d) / (1000 * 60 * 60);
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return d.toLocaleDateString();
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'sent': return 'arrow-up-circle';
      case 'received': return 'arrow-down-circle';
      case 'pending': return 'time-circle';
      default: return 'swap-horizontal-circle';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'sent': return Colors.error;
      case 'received': return Colors.success;
      case 'pending': return Colors.warning;
      default: return Colors.textMuted;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return Colors.success;
      case 'pending': return Colors.warning;
      case 'failed': return Colors.error;
      default: return Colors.textMuted;
    }
  };

  const renderTransaction = ({ item }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => onTransactionPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.transactionIcon}>
        <Ionicons
          name={getTransactionIcon(item.type)}
          size={24}
          color={getTransactionColor(item.type)}
        />
      </View>
      <View style={styles.transactionDetails}>
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionTitle}>
            {item.type === 'sent' ? `To ${item.recipient}` : `From ${item.sender}`}
          </Text>
          <Text style={[
            styles.transactionAmount,
            { color: getTransactionColor(item.type) }
          ]}>
            {item.type === 'sent' ? '-' : '+'}{item.currency} {typeof item.amount === 'number' && !isNaN(item.amount) ? item.amount.toFixed(2) : '0.00'}
          </Text>
        </View>
        <View style={styles.transactionFooter}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <View style={styles.transactionMeta}>
            <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  const renderFilterButton = (filter) => (
    <TouchableOpacity
      key={filter.id}
      style={[
        styles.filterButton,
        selectedFilter === filter.id && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter.id)}
    >
      <Ionicons
        name={filter.icon}
        size={16}
        color={selectedFilter === filter.id ? Colors.textInverse : Colors.textMuted}
      />
      <Text style={[
        styles.filterText,
        selectedFilter === filter.id && styles.filterTextActive
      ]}>
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, isSearchFocused && styles.searchBarFocused]}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {filters.map(renderFilterButton)}
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item, index) => (item.id ? String(item.id) : String(index))}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search' : 'Your transaction history will appear here'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchBarFocused: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    ...Typography.bodyRegular,
    color: Colors.textPrimary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.textInverse,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionTitle: {
    ...Typography.bodyRegular,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  transactionAmount: {
    ...Typography.bodyRegular,
    fontWeight: 'bold',
    fontSize: 16,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionDescription: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    flex: 1,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionDate: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    ...Typography.bodySmall,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.textMuted,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...Typography.bodyRegular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

export default TransactionHistory; 