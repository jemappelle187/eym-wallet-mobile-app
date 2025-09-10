import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

const { width } = Dimensions.get('window');

const NotificationCenter = ({ onNotificationPress, onMarkAllRead }) => {
  const [notifications, setNotifications] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const slideAnim = useRef(new Animated.Value(width)).current;

  const mockNotifications = [
    {
      id: '1',
      type: 'transaction',
      title: 'Payment Received',
      message: 'You received $150.00 from John Doe',
      amount: 150.00,
      currency: 'USD',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      isRead: false,
      isImportant: true,
      action: 'view_transaction',
    },
    {
      id: '2',
      type: 'security',
      title: 'Login Alert',
      message: 'New device logged into your account',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      isRead: false,
      isImportant: true,
      action: 'review_login',
    },
    {
      id: '3',
      type: 'promotion',
      title: 'Special Offer',
      message: 'Send money for free this week!',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isRead: true,
      isImportant: false,
      action: 'view_offer',
    },
    {
      id: '4',
      type: 'system',
      title: 'App Update',
      message: 'New features available in version 2.1',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      isRead: true,
      isImportant: false,
      action: 'update_app',
    },
    {
      id: '5',
      type: 'transaction',
      title: 'Payment Sent',
      message: 'You sent $75.50 to Sarah Smith',
      amount: 75.50,
      currency: 'USD',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      isRead: true,
      isImportant: false,
      action: 'view_transaction',
    },
  ];

  useEffect(() => {
    setNotifications(mockNotifications);
    // Animate in
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const filters = [
    { id: 'all', label: 'All', icon: 'notifications' },
    { id: 'unread', label: 'Unread', icon: 'mail-unread' },
    { id: 'important', label: 'Important', icon: 'star' },
    { id: 'transactions', label: 'Transactions', icon: 'card' },
  ];

  const filteredNotifications = notifications.filter(notification => {
    switch (selectedFilter) {
      case 'unread':
        return !notification.isRead;
      case 'important':
        return notification.isImportant;
      case 'transactions':
        return notification.type === 'transaction';
      default:
        return true;
    }
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'transaction': return 'card';
      case 'security': return 'shield';
      case 'promotion': return 'gift';
      case 'system': return 'settings';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'transaction': return Colors.success;
      case 'security': return Colors.warning;
      case 'promotion': return Colors.accent;
      case 'system': return Colors.info;
      default: return Colors.textMuted;
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diffInMinutes = (now - timestamp) / (1000 * 60);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleNotificationPress = (notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => 
        n.id === notification.id ? { ...n, isRead: true } : n
      )
    );
    
    onNotificationPress?.(notification);
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
    onMarkAllRead?.();
  };

  const renderNotification = ({ item }) => (
    <Animated.View
      style={[
        styles.notificationItem,
        !item.isRead && styles.notificationItemUnread,
      ]}
    >
      <TouchableOpacity
        style={styles.notificationContent}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.notificationIcon, { backgroundColor: getNotificationColor(item.type) + '20' }]}>
          <Ionicons 
            name={getNotificationIcon(item.type)} 
            size={20} 
            color={getNotificationColor(item.type)} 
          />
        </View>

        <View style={styles.notificationInfo}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationTime}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
          
          <Text style={styles.notificationMessage}>{item.message}</Text>
          
          {item.amount && (
            <View style={styles.amountContainer}>
              <Text style={[styles.amountText, { color: getNotificationColor(item.type) }]}>
                {item.currency} {item.amount.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.notificationActions}>
          {!item.isRead && (
            <View style={styles.unreadDot} />
          )}
          {item.isImportant && (
            <Ionicons name="star" size={16} color={Colors.warning} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: slideAnim }] }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {filters.map(renderFilterButton)}
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter === 'all' 
                ? 'You\'re all caught up!' 
                : `No ${selectedFilter} notifications`
              }
            </Text>
          </View>
        }
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadCount: {
    ...Typography.bodySmall,
    color: Colors.textInverse,
    fontWeight: '600',
  },
  markAllButton: {
    paddingVertical: 4,
  },
  markAllText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  notificationItem: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notificationItemUnread: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 16,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    ...Typography.bodyRegular,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  notificationTime: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginLeft: 8,
  },
  notificationMessage: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  amountContainer: {
    alignSelf: 'flex-start',
  },
  amountText: {
    ...Typography.bodyRegular,
    fontWeight: 'bold',
  },
  notificationActions: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginBottom: 4,
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

export default NotificationCenter; 