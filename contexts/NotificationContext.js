import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [badgeCounts, setBadgeCounts] = useState({
    Activity: 3, // New transactions
    Account: 1,  // New notifications
  });

  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'transaction',
      title: 'Payment Received',
      message: 'You received $50.00 from John Doe',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      read: false,
      screen: 'Activity',
    },
    {
      id: '2',
      type: 'security',
      title: 'Security Alert',
      message: 'New login detected from unknown device',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      read: false,
      screen: 'Account',
    },
    {
      id: '3',
      type: 'transaction',
      title: 'Payment Sent',
      message: 'Payment of $25.00 sent to Jane Smith',
      timestamp: new Date(Date.now() - 10800000), // 3 hours ago
      read: false,
      screen: 'Activity',
    },
  ]);

  // Update badge counts based on unread notifications
  useEffect(() => {
    const newBadgeCounts = {
      Activity: notifications.filter(n => n.screen === 'Activity' && !n.read).length,
      Account: notifications.filter(n => n.screen === 'Account' && !n.read).length,
    };
    setBadgeCounts(newBadgeCounts);
  }, [notifications]);

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllNotificationsAsRead = (screen) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.screen === screen 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
      ...notification,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const clearBadge = (screen) => {
    setBadgeCounts(prev => ({
      ...prev,
      [screen]: 0,
    }));
  };

  const getUnreadNotifications = (screen) => {
    return notifications.filter(n => n.screen === screen && !n.read);
  };

  const getBadgeCount = (screen) => {
    return badgeCounts[screen] || 0;
  };

  const value = {
    notifications,
    badgeCounts,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    addNotification,
    clearBadge,
    getUnreadNotifications,
    getBadgeCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 