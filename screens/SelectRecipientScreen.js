// sendnreceive-app/screens/SelectRecipientScreen.js
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useNavigation } from '@react-navigation/native';

// Enhanced Mock Data - Replace with actual data source/API calls
const MOCK_RECIPIENTS = [
  { 
    id: '1', 
    name: 'Ama Serwaa', 
    avatarInitials: 'AS', 
    lastSent: '2 days ago',
    lastAmount: '₵500.00',
    isFavorite: true,
    isMobileMoney: true, 
    mobileNumber: '+233 24 123 4567',
    transactionCount: 15,
    avatarColor: '#4F46E5'
  },
  { 
    id: '2', 
    name: 'Kwame Mensah', 
    avatarInitials: 'KM', 
    lastSent: '1 week ago',
    lastAmount: '₵1,200.00',
    isFavorite: false,
    isMobileMoney: true, 
    mobileNumber: '+233 55 765 4321',
    transactionCount: 8,
    avatarColor: '#059669'
  },
  { 
    id: '3', 
    name: 'John Doe (Bank)', 
    avatarInitials: 'JD', 
    lastSent: '3 weeks ago',
    lastAmount: '₵2,500.00',
    isFavorite: true,
    isMobileMoney: false, 
    bankName: 'Equity Bank', 
    accountNumber: '**** 1234',
    transactionCount: 3,
    avatarColor: '#DC2626'
  },
  { 
    id: '4', 
    name: 'Fatimah Ali', 
    avatarInitials: 'FA', 
    lastSent: '1 month ago',
    lastAmount: '₵750.00',
    isFavorite: false,
    isMobileMoney: true, 
    mobileNumber: '+233 20 987 6543',
    transactionCount: 12,
    avatarColor: '#7C3AED'
  },
];

const SelectRecipientScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [recipients, setRecipients] = useState(MOCK_RECIPIENTS);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'favorites', 'recent'

  const filteredRecipients = useMemo(() => {
    let filtered = recipients;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
      (recipient) =>
        recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (recipient.isMobileMoney && recipient.mobileNumber.includes(searchQuery)) ||
          (recipient.bankName && recipient.bankName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Filter by type
    if (filterType === 'favorites') {
      filtered = filtered.filter(recipient => recipient.isFavorite);
    } else if (filterType === 'recent') {
      // Show recipients with recent transactions (last 30 days)
      filtered = filtered.filter(recipient => {
        const lastSentDate = new Date(recipient.lastSent);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return lastSentDate > thirtyDaysAgo;
      });
    }
    
    // Sort by favorites first, then by last sent date, then by name
    return filtered.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      
      const aDate = new Date(a.lastSent);
      const bDate = new Date(b.lastSent);
      if (aDate > bDate) return -1;
      if (aDate < bDate) return 1;
      
      return a.name.localeCompare(b.name);
    });
  }, [recipients, searchQuery, filterType]);

  const toggleFavorite = (recipientId) => {
    setRecipients(prev => 
      prev.map(recipient => 
        recipient.id === recipientId 
          ? { ...recipient, isFavorite: !recipient.isFavorite }
          : recipient
      )
    );
  };

  const handleSelectRecipient = (recipient) => {
    // Navigate to Choose Currency / Enter Amount screen
    navigation.navigate('ChooseCurrencyScreen', { selectedRecipient: recipient });
    // Alert.alert("Recipient Selected", `${recipient.name}\nNext: Choose Currency/Amount`);
  };

  const renderRecipientItem = ({ item }) => (
    <TouchableOpacity style={styles.recipientItem} onPress={() => handleSelectRecipient(item)}>
      <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
        <Text style={styles.avatarText}>{item.avatarInitials}</Text>
        {item.isFavorite && (
          <View style={styles.favoriteBadge}>
            <Ionicons name="star" size={12} color={Colors.warning} />
          </View>
        )}
      </View>
      <View style={styles.recipientInfo}>
        <View style={styles.recipientHeader}>
        <Text style={styles.recipientName}>{item.name}</Text>
          <TouchableOpacity 
            onPress={() => toggleFavorite(item.id)}
            style={styles.favoriteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={item.isFavorite ? "star" : "star-outline"} 
              size={20} 
              color={item.isFavorite ? Colors.warning : Colors.textMuted} 
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.recipientDetail}>
          {item.isMobileMoney ? `Mobile: ${item.mobileNumber}` : `Bank: ${item.bankName} ${item.accountNumber}`}
        </Text>
        <View style={styles.recipientStats}>
          <Text style={styles.recipientLastSent}>
            Last sent: {item.lastAmount} {item.lastSent}
          </Text>
          <Text style={styles.transactionCount}>
            {item.transactionCount} transfers
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={22} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Custom Header for this screen */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={Typography.h2}>Send To</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              onPress={() => setShowFavoritesOnly(!showFavoritesOnly)} 
              style={[styles.filterButton, showFavoritesOnly && styles.filterButtonActive]}
            >
              <Ionicons 
                name="star" 
                size={20} 
                color={showFavoritesOnly ? Colors.warning : Colors.textMuted} 
              />
            </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert("Add New Recipient", "New recipient flow coming soon!")} style={styles.addButton}>
            <Ionicons name="add-circle-outline" size={28} color={Colors.brandPurple} />
          </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, number, or bank"
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabsContainer}>
          <TouchableOpacity
            style={[styles.filterTab, filterType === 'all' && styles.filterTabActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterTabText, filterType === 'all' && styles.filterTabTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterType === 'favorites' && styles.filterTabActive]}
            onPress={() => setFilterType('favorites')}
          >
            <Ionicons name="star" size={16} color={filterType === 'favorites' ? Colors.warning : Colors.textMuted} />
            <Text style={[styles.filterTabText, filterType === 'favorites' && styles.filterTabTextActive]}>Favorites</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterType === 'recent' && styles.filterTabActive]}
            onPress={() => setFilterType('recent')}
          >
            <Ionicons name="time" size={16} color={filterType === 'recent' ? Colors.accent : Colors.textMuted} />
            <Text style={[styles.filterTabText, filterType === 'recent' && styles.filterTabTextActive]}>Recent</Text>
          </TouchableOpacity>
        </View>

        {filteredRecipients.length > 0 ? (
          <FlatList
            data={filteredRecipients}
            renderItem={renderRecipientItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContentContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.noResultsContainer}>
            <MaterialCommunityIcons name="account-search-outline" size={48} color={Colors.textMuted} />
            <Text style={Typography.bodyLarge}>No recipients found</Text>
            <Text style={Typography.bodyRegular}>Try a different search or add a new recipient.</Text>
          </View>
        )}

        {/* Optionally, a button to explicitly add a new recipient if not using the header one */}
        {/* <TouchableOpacity style={styles.addNewButton} onPress={() => Alert.alert("Add New", "Navigate to Add New Recipient Screen")}>
            <Ionicons name="add-outline" size={22} color={Colors.textOnPrimaryCTA} />
            <Text style={styles.addNewButtonText}>Add New Recipient</Text>
        </TouchableOpacity> */}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'android' ? 15 : 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 5,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  filterButtonActive: {
    backgroundColor: Colors.warning + '20',
  },
  addButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground, // Or Colors.inputBackground if defined
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    ...Typography.bodyLarge,
    flex: 1,
    height: 50, // Good touch target
    color: Colors.textPrimary,
  },
  filterTabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  filterTabActive: {
    backgroundColor: Colors.background,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterTabText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  listContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recipientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    // shadow for items if desired
    // shadowColor: Colors.darkCharcoal,
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.05,
    // shadowRadius: 3,
    // elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.softAccent1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    position: 'relative',
  },
  avatarText: {
    ...Typography.h4,
    color: Colors.textInverse,
    fontWeight: 'bold',
  },
  favoriteBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 1,
  },
  recipientInfo: {
    flex: 1,
  },
  recipientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recipientName: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  recipientDetail: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  recipientStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  recipientLastSent: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  transactionCount: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    fontSize: 11,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
//   addNewButton: { // If using a bottom button instead of header
//     backgroundColor: Colors.brandPurple,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 16,
//     marginHorizontal: 20,
//     borderRadius: 12,
//     marginBottom: Platform.OS === 'ios' ? 0 : 20, // Adjust for safe area on Android if edges not used
//     marginTop: 10,
//   },
//   addNewButtonText: {
//     ...Typography.button,
//     marginLeft: 8,
//   }
});

export default SelectRecipientScreen;
