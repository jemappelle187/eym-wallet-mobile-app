import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

const RecipientSelector = ({ onRecipientSelect, onAddNewContact }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('recent');

  const mockContacts = [
    {
      id: '1',
      name: 'John Doe',
      phone: '+233 24 123 4567',
      email: 'john.doe@email.com',
      avatar: null,
      isRecent: true,
      lastTransaction: '2 hours ago',
    },
    {
      id: '2',
      name: 'Sarah Smith',
      phone: '+233 20 987 6543',
      email: 'sarah.smith@email.com',
      avatar: null,
      isRecent: true,
      lastTransaction: '1 day ago',
    },
    {
      id: '3',
      name: 'Mike Johnson',
      phone: '+233 26 555 1234',
      email: 'mike.johnson@email.com',
      avatar: null,
      isRecent: false,
    },
    {
      id: '4',
      name: 'Emma Wilson',
      phone: '+233 27 777 8888',
      email: 'emma.wilson@email.com',
      avatar: null,
      isRecent: false,
    },
  ];

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) {
      return selectedTab === 'recent' 
        ? mockContacts.filter(contact => contact.isRecent)
        : mockContacts;
    }

    const query = searchQuery.toLowerCase();
    return mockContacts.filter(contact =>
      contact.name.toLowerCase().includes(query) ||
      contact.phone.includes(query) ||
      contact.email.toLowerCase().includes(query)
    );
  }, [mockContacts, searchQuery, selectedTab]);

  const renderContact = ({ item }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => onRecipientSelect?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phone}</Text>
        {item.lastTransaction && (
          <Text style={styles.lastTransaction}>
            Last sent: {item.lastTransaction}
          </Text>
        )}
      </View>

      <View style={styles.contactActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="call" size={16} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="mail" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <TouchableOpacity style={styles.quickActionButton}>
        <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary + '20' }]}>
          <Ionicons name="person-add" size={24} color={Colors.primary} />
        </View>
        <Text style={styles.quickActionText}>Add Contact</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.quickActionButton}>
        <View style={[styles.quickActionIcon, { backgroundColor: Colors.success + '20' }]}>
          <Ionicons name="qr-code" size={24} color={Colors.success} />
        </View>
        <Text style={styles.quickActionText}>Scan QR</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.quickActionButton}>
        <View style={[styles.quickActionIcon, { backgroundColor: Colors.accent + '20' }]}>
          <Ionicons name="phone-portrait" size={24} color={Colors.accent} />
        </View>
        <Text style={styles.quickActionText}>Phone Number</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts, phone, or email..."
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

      {/* Quick Actions */}
      {!searchQuery && renderQuickActions()}

      {/* Tab Navigation */}
      {!searchQuery && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'recent' && styles.tabActive]}
            onPress={() => setSelectedTab('recent')}
          >
            <Text style={[styles.tabText, selectedTab === 'recent' && styles.tabTextActive]}>
              Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
            onPress={() => setSelectedTab('all')}
          >
            <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
              All Contacts
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Contact List */}
      <FlatList
        data={filteredContacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No contacts found' : 'No contacts yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? 'Try a different search term' 
                : 'Add your first contact to start sending money'
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={styles.addContactButton}>
                <Text style={styles.addContactText}>Add Contact</Text>
              </TouchableOpacity>
            )}
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
  searchInput: {
    flex: 1,
    marginLeft: 12,
    ...Typography.bodyRegular,
    color: Colors.textPrimary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickActionButton: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    ...Typography.bodyRegular,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  contactItem: {
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
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.bodyRegular,
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    ...Typography.bodyRegular,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactPhone: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  lastTransaction: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontSize: 12,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 24,
  },
  addContactButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addContactText: {
    ...Typography.bodyRegular,
    color: Colors.textInverse,
    fontWeight: '600',
  },
});

export default RecipientSelector; 