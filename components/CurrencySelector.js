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

const CurrencySelector = ({ onCurrencySelect, selectedCurrency }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);

  const currencies = [
    {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      flag: '🇺🇸',
      rate: 1.00,
      isFavorite: true,
      isPopular: true,
    },
    {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      flag: '🇪🇺',
      rate: 0.85,
      isFavorite: true,
      isPopular: true,
    },
    {
      code: 'GHS',
      name: 'Ghanaian Cedi',
      symbol: '₵',
      flag: '🇬🇭',
      rate: 12.50,
      isFavorite: true,
      isPopular: true,
    },
    {
      code: 'GBP',
      name: 'British Pound',
      symbol: '£',
      flag: '🇬🇧',
      rate: 0.73,
      isFavorite: false,
      isPopular: true,
    },
    {
      code: 'NGN',
      name: 'Nigerian Naira',
      symbol: '₦',
      flag: '🇳🇬',
      rate: 460.00,
      isFavorite: false,
      isPopular: false,
    },
    {
      code: 'KES',
      name: 'Kenyan Shilling',
      symbol: 'KSh',
      flag: '🇰🇪',
      rate: 150.00,
      isFavorite: false,
      isPopular: false,
    },
    {
      code: 'ZAR',
      name: 'South African Rand',
      symbol: 'R',
      flag: '🇿🇦',
      rate: 18.50,
      isFavorite: false,
      isPopular: false,
    },
    {
      code: 'EGP',
      name: 'Egyptian Pound',
      symbol: 'E£',
      flag: '🇪🇬',
      rate: 31.00,
      isFavorite: false,
      isPopular: false,
    },
  ];

  const filteredCurrencies = useMemo(() => {
    let filtered = currencies;

    if (showFavorites) {
      filtered = filtered.filter(currency => currency.isFavorite);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(currency =>
        currency.code.toLowerCase().includes(query) ||
        currency.name.toLowerCase().includes(query) ||
        currency.symbol.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => {
      // Popular currencies first
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      // Then favorites
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      // Then alphabetically
      return a.code.localeCompare(b.code);
    });
  }, [currencies, searchQuery, showFavorites]);

  const renderCurrency = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.currencyItem,
        selectedCurrency?.code === item.code && styles.currencyItemSelected
      ]}
      onPress={() => onCurrencySelect?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.currencyInfo}>
        <View style={styles.currencyHeader}>
          <Text style={styles.currencyFlag}>{item.flag}</Text>
          <View style={styles.currencyDetails}>
            <Text style={styles.currencyCode}>{item.code}</Text>
            <Text style={styles.currencyName}>{item.name}</Text>
          </View>
        </View>
        
        <View style={styles.currencyRate}>
          <Text style={styles.rateText}>
            {item.symbol} {item.rate.toFixed(2)}
          </Text>
          <Text style={styles.rateLabel}>per USD</Text>
        </View>
      </View>

      <View style={styles.currencyActions}>
        {item.isFavorite && (
          <Ionicons name="star" size={16} color={Colors.warning} />
        )}
        {selectedCurrency?.code === item.code && (
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderPopularCurrencies = () => {
    const popularCurrencies = currencies.filter(c => c.isPopular);
    
    return (
      <View style={styles.popularSection}>
        <Text style={styles.sectionTitle}>Popular Currencies</Text>
        <View style={styles.popularGrid}>
          {popularCurrencies.map(currency => (
            <TouchableOpacity
              key={currency.code}
              style={[
                styles.popularCurrency,
                selectedCurrency?.code === currency.code && styles.popularCurrencySelected
              ]}
              onPress={() => onCurrencySelect?.(currency)}
            >
              <Text style={styles.popularFlag}>{currency.flag}</Text>
              <Text style={styles.popularCode}>{currency.code}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search currencies..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Toggle */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, !showFavorites && styles.filterButtonActive]}
          onPress={() => setShowFavorites(false)}
        >
          <Text style={[styles.filterText, !showFavorites && styles.filterTextActive]}>
            All Currencies
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, showFavorites && styles.filterButtonActive]}
          onPress={() => setShowFavorites(true)}
        >
          <Ionicons name="star" size={16} color={showFavorites ? Colors.textInverse : Colors.textMuted} />
          <Text style={[styles.filterText, showFavorites && styles.filterTextActive]}>
            Favorites
          </Text>
        </TouchableOpacity>
      </View>

      {/* Popular Currencies */}
      {!searchQuery && !showFavorites && renderPopularCurrencies()}

      {/* Currency List */}
      <FlatList
        data={filteredCurrencies}
        renderItem={renderCurrency}
        keyExtractor={(item) => item.code}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="currency-exchange-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No currencies found' : 'No favorite currencies'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? 'Try a different search term' 
                : 'Add currencies to your favorites for quick access'
              }
            </Text>
          </View>
        }
      />

      {/* Exchange Rate Info */}
      <View style={styles.rateInfo}>
        <Ionicons name="information-circle" size={16} color={Colors.textMuted} />
        <Text style={styles.rateInfoText}>
          Exchange rates are updated every 5 minutes
        </Text>
      </View>
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
  popularSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  popularGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  popularCurrency: {
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  popularCurrencySelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  popularFlag: {
    fontSize: 24,
    marginBottom: 8,
  },
  popularCode: {
    ...Typography.bodyRegular,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  currencyItem: {
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
  currencyItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  currencyInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  currencyDetails: {
    flex: 1,
  },
  currencyCode: {
    ...Typography.bodyRegular,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  currencyName: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  currencyRate: {
    alignItems: 'flex-end',
  },
  rateText: {
    ...Typography.bodyRegular,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  rateLabel: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    fontSize: 10,
  },
  currencyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
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
  rateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rateInfoText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginLeft: 8,
  },
});

export default CurrencySelector; 