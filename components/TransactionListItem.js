import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

const TransactionListItem = React.memo(({ item, onPress, colors = Colors, index, expanded, collapse }) => {
  const isDebit = item.type === 'sent' || item.type === 'withdrawal' || item.type === 'pay_in_store';
  const amountColor = isDebit ? colors.error : colors.success;
  const amountPrefix = isDebit ? '-' : '+';

  let iconName = 'help-circle-outline';
  let iconColor = '#fff';
  let iconBg = '#e5e7eb';

  if (item.type === 'received') { iconName = 'arrow-down-outline'; iconColor = '#fff'; iconBg = '#10b981'; }
  else if (item.type === 'sent') { iconName = 'arrow-up-outline'; iconColor = '#fff'; iconBg = '#1e40af'; }
  else if (item.type === 'deposit') { iconName = 'wallet-outline'; iconColor = '#fff'; iconBg = '#6366f1'; }
  else if (item.type === 'withdrawal') { iconName = 'cash-outline'; iconColor = '#fff'; iconBg = '#f59e42'; }
  else if (item.type === 'pay_in_store') { iconName = 'cart-outline'; iconColor = '#fff'; iconBg = '#a21caf'; }

  // Status configuration
  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return { 
          text: 'Completed', 
          color: '#10b981', 
          bgColor: '#d1fae5',
          icon: 'checkmark-circle'
        };
      case 'pending':
        return { 
          text: 'Pending', 
          color: '#f59e0b', 
          bgColor: '#fef3c7',
          icon: 'time'
        };
      case 'failed':
      case 'error':
        return { 
          text: 'Failed', 
          color: '#ef4444', 
          bgColor: '#fee2e2',
          icon: 'close-circle'
        };
      case 'cancelled':
        return { 
          text: 'Cancelled', 
          color: '#6b7280', 
          bgColor: '#f3f4f6',
          icon: 'close-circle'
        };
      default:
        return { 
          text: 'Completed', 
          color: '#10b981', 
          bgColor: '#d1fae5',
          icon: 'checkmark-circle'
        };
    }
  };

  const statusInfo = getStatusInfo(item.status);

  // Build main label (just the name/label, no prefix)
  let mainLabel = '';
  if (item.type === 'received' && item.from) mainLabel = item.from;
  else if (item.type === 'sent' && item.to) mainLabel = item.to;
  else if (item.type === 'deposit' && item.method) mainLabel = item.method;
  else if (item.type === 'withdrawal' && item.method) mainLabel = item.method;
  else if (item.type === 'pay_in_store' && item.merchant) mainLabel = item.merchant;

  let title = '';
  if (item.type === 'received') title = `Received from ${mainLabel}`;
  else if (item.type === 'sent') title = `Sent to ${mainLabel}`;
  else if (item.type === 'deposit') title = `Deposit via ${mainLabel}`;
  else if (item.type === 'withdrawal') title = `Withdrawal to ${mainLabel}`;
  else if (item.type === 'pay_in_store') title = `Paid at ${mainLabel}`;

  if (item.details && item.details !== title) {
    title += ` - ${item.details}`;
  }

  // Microinteraction: scale on press
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: false,
      speed: 30,
      bounciness: 6,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: false,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  // Microinteraction: animate status tag on change
  const statusAnim = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    statusAnim.setValue(0.7);
    Animated.spring(statusAnim, {
      toValue: 1,
      useNativeDriver: false,
      speed: 20,
      bounciness: 8,
    }).start();
  }, [item.status]);

  // Fade in animation on mount
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      delay: index * 100,
      useNativeDriver: false,
    }).start();
  }, []);

  // Animated expansion logic
  const animatedHeight = React.useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const animatedShadow = React.useRef(new Animated.Value(expanded ? 1 : 0)).current;
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: expanded ? 1 : 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(animatedShadow, {
        toValue: expanded ? 1 : 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      })
    ]).start();
  }, [expanded]);

  // Interpolate height, opacity, and shadow for expansion
  const detailsMaxHeight = animatedHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 300] });
  const detailsOpacity = animatedHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const cardShadow = {
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: animatedShadow.interpolate({ inputRange: [0, 1], outputRange: [6, 16] }) },
    shadowOpacity: animatedShadow.interpolate({ inputRange: [0, 1], outputRange: [0.13, 0.22] }),
    shadowRadius: animatedShadow.interpolate({ inputRange: [0, 1], outputRange: [16, 28] }),
    elevation: animatedShadow.interpolate({ inputRange: [0, 1], outputRange: [8, 18] }),
  };

  // Fade-in animation for each card on mount
  const cardFadeAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(cardFadeAnim, {
      toValue: 0.7,
      duration: 500,
      delay: index * 80,
      useNativeDriver: false,
    }).start();
  }, []);

  // Add fade-in animation for expanded details
  const expandedFadeAnim = React.useRef(new Animated.Value(0)).current;
  const [showExpanded, setShowExpanded] = React.useState(false);
  React.useEffect(() => {
    if (expanded) {
      setShowExpanded(true);
      Animated.timing(expandedFadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: false,
      }).start();
    } else if (showExpanded) {
      Animated.timing(expandedFadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start(() => setShowExpanded(false));
    }
  }, [expanded]);

  // Action Functions
  const handleShare = async () => {
    Haptics.selectionAsync();
    try {
      const shareMessage = `Transaction: ${item.type === 'received' ? 'Received' : 'Sent'} ${item.currency} ${item.amount}\nDate: ${new Date(item.date).toLocaleDateString()}\nStatus: ${item.status}\n${item.reference ? `Reference: ${item.reference}` : ''}`;
      
      await Share.share({
        message: shareMessage,
        title: 'Transaction Details',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share transaction details');
    }
  };

  const handleCopyReference = async () => {
    Haptics.selectionAsync();
    try {
      if (item.reference) {
        await Clipboard.setStringAsync(item.reference);
        Alert.alert('Copied!', 'Reference number copied to clipboard');
      } else {
        Alert.alert('No Reference', 'This transaction has no reference number');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to copy reference number');
    }
  };

  const handleQRCode = () => {
    Haptics.selectionAsync();
    // Navigate to SplitBillScreen
    // Note: This requires the screen to be registered in the navigation stack
    Alert.alert(
      'Split Bill',
      'Would you like to create a split bill for this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Create Split Bill', 
          onPress: () => {
            // In a real implementation, this would navigate to SplitBillScreen
            // navigation.navigate('SplitBillScreen', { 
            //   transactionId: item.id,
            //   amount: item.amount,
            //   currency: item.currency 
            // });
            
            // For now, show a comprehensive preview of the functionality
            Alert.alert(
              'Split Bill Feature',
              'This would open the Split Bill screen with:\n\n📱 Split Bill Creation:\n• Set total amount\n• Select number of people (2-10)\n• Auto-calculate amount per person\n• Add description\n• Choose contacts to invite\n\n📤 Sharing & Management:\n• Share payment links\n• Track payment status\n• Send reminders\n• View detailed analytics\n• Cancel or edit bills\n\n🎯 Perfect for:\n• Group dinners\n• Shared expenses\n• Event tickets\n• Rent splitting',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  const handleLocation = () => {
    Haptics.selectionAsync();
    if (item.location) {
      Alert.alert(
        'Location',
        `Transaction location: ${item.location}\n\nWould you like to open in maps?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Maps', 
            onPress: () => {
              const url = `https://maps.google.com/?q=${encodeURIComponent(item.location)}`;
              Linking.openURL(url);
            }
          }
        ]
      );
    } else {
      Alert.alert('No Location', 'This transaction has no location data');
    }
  };

  const handleSupport = () => {
    Haptics.selectionAsync();
    Alert.alert(
      'Contact Support',
      'Need help with this transaction?\n\n• Call: +233 20 123 4567\n• Email: support@eymwallet.com\n• Live Chat: Available 24/7',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call Support', 
          onPress: () => Linking.openURL('tel:+233201234567')
        },
        { 
          text: 'Email Support', 
          onPress: () => Linking.openURL('mailto:support@eymwallet.com')
        }
      ]
    );
  };

  const handleReport = () => {
    Haptics.selectionAsync();
    Alert.alert(
      'Report Transaction',
      'Report this transaction for:\n\n• Unauthorized activity\n• Incorrect amount\n• Missing funds\n• Other issues',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report Issue', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Report Submitted',
              'Your report has been submitted. Our team will review it within 24 hours and contact you if needed.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  return (
    <Animated.View style={{
      opacity: cardFadeAnim,
      transform: [{ scale: scaleAnim }],
      marginBottom: 8,
      backgroundColor: 'transparent',
      borderRadius: 18,
      shadowColor: 'rgba(30,64,175,0.06)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 1,
    }}>
      <TouchableOpacity
        style={[
          styles.transactionItem,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            minHeight: expanded ? 220 : 44,
            borderRadius: 18,
            paddingTop: expanded ? 0 : 8,
            paddingBottom: expanded ? 0 : 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            flexWrap: 'wrap',
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.92}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Transaction: ${mainLabel}, amount ${amountPrefix}${item.currency} ${item.amount}, status ${item.status}`}
        accessibilityHint={expanded ? 'Tap to collapse details' : 'Tap to expand for details'}
      >
        <View style={[styles.transactionIconContainer, { backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 }]}> 
          <Ionicons name={iconName} size={22} color={colors.primary} />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={[styles.transactionTitle, { color: colors.textPrimary }]}>{mainLabel}</Text>
        </View>
        <Animated.View style={{ 
          alignItems: 'flex-end', 
          justifyContent: 'center', 
          minWidth: 72,
          opacity: expanded ? 0 : 1,
          transform: [{ scale: expanded ? 0.8 : 1 }]
        }}>
          <Text style={[styles.transactionAmount, { color: amountColor }]}>{amountPrefix}{item.currency} {item.amount}</Text>
          {/* Status Badge */}
          <Animated.View style={[
            styles.statusBadge,
            {
              backgroundColor: statusInfo.bgColor,
              transform: [{ scale: statusAnim }],
            }
          ]}>
            <Ionicons name={statusInfo.icon} size={10} color={statusInfo.color} style={{ marginRight: 2 }} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
          </Animated.View>
        </Animated.View>
        <View style={{ justifyContent: 'center', alignItems: 'center', marginLeft: 8 }}>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-forward'} size={22} color={colors.primary} />
        </View>
        
        {/* Expanded details inline in the same card */}
        {showExpanded && (
          <Animated.View style={{
            width: '100%',
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 8,
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            opacity: expandedFadeAnim,
          }}>
            {/* Enhanced Header Section */}
            <View style={{ width: '100%', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontFamily: 'Montserrat-Bold', fontSize: 24, color: amountColor, marginBottom: 4 }}>{amountPrefix}{item.currency} {item.amount}</Text>
              <Text style={{ fontFamily: 'Montserrat-Regular', fontSize: 14, color: colors.textMuted, marginBottom: 8 }}>
                {item.date ? (new Date(item.date).toLocaleDateString() + ' at ' + new Date(item.date).toLocaleTimeString()) : '—'}
              </Text>
              <View style={[styles.expandedStatusBadge, { backgroundColor: statusInfo.bgColor }]}>
                <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} style={{ marginRight: 4 }} />
                <Text style={[styles.expandedStatusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
              </View>
            </View>

            {/* Transaction Details */}
            <View style={{ width: '100%', marginBottom: 16 }}>
              <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 16, color: colors.primary, marginBottom: 8 }}>Transaction Details</Text>
              
              {item.reference && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Reference</Text>
                  <Text style={[styles.detailValue, { color: colors.primary }]}>{item.reference}</Text>
                </View>
              )}
              
              {item.fee && item.fee !== '0.00' && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Fee</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{item.currency} {item.fee}</Text>
                </View>
              )}
              
              {item.method && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Method</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{item.method}</Text>
                </View>
              )}
              
              {item.from && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>From</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{item.from}</Text>
                </View>
              )}
              
              {item.to && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>To</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{item.to}</Text>
                </View>
              )}
              
              {item.merchant && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Merchant</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{item.merchant}</Text>
                </View>
              )}
            </View>
            
            {/* Divider */}
            <View style={{ height: 1, backgroundColor: colors.border, opacity: 0.7, marginVertical: 8, alignSelf: 'stretch' }} />
            
            {/* Enhanced Action Buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
              <TouchableOpacity style={[styles.enhancedActionButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]} onPress={handleShare} activeOpacity={0.7}>
                <Ionicons name="share-outline" size={18} color={colors.primary} style={{ marginBottom: 4 }} />
                <Text style={[styles.enhancedActionText, { color: colors.textSecondary }]}>Share</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.enhancedActionButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]} onPress={handleCopyReference} activeOpacity={0.7}>
                <Ionicons name="copy-outline" size={18} color={colors.primary} style={{ marginBottom: 4 }} />
                <Text style={[styles.enhancedActionText, { color: colors.textSecondary }]}>Copy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.enhancedActionButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]} onPress={handleQRCode} activeOpacity={0.7}>
                <Ionicons name="people-outline" size={18} color={colors.primary} style={{ marginBottom: 4 }} />
                <Text style={[styles.enhancedActionText, { color: colors.textSecondary }]}>Split</Text>
              </TouchableOpacity>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
              <TouchableOpacity style={[styles.enhancedActionButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]} onPress={handleLocation} activeOpacity={0.7}>
                <Ionicons name="location-outline" size={18} color={colors.primary} style={{ marginBottom: 4 }} />
                <Text style={[styles.enhancedActionText, { color: colors.textSecondary }]}>Location</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.enhancedActionButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]} onPress={handleSupport} activeOpacity={0.7}>
                <Ionicons name="chatbubble-outline" size={18} color={colors.primary} style={{ marginBottom: 4 }} />
                <Text style={[styles.enhancedActionText, { color: colors.textSecondary }]}>Support</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.enhancedActionButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]} onPress={handleReport} activeOpacity={0.7}>
                <Ionicons name="flag-outline" size={18} color={colors.error} style={{ marginBottom: 4 }} />
                <Text style={[styles.enhancedActionText, { color: colors.error }]}>Report</Text>
              </TouchableOpacity>
            </View>
            
            {/* Collapse button */}
            <TouchableOpacity onPress={collapse} style={{ alignSelf: 'center', marginTop: 4, padding: 8 }}>
              <Ionicons name="chevron-up" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = {
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: 20,
    marginBottom: 8,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
    marginRight: 8,
  },
  transactionTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionAmount: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  statusText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  expandedStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  expandedStatusText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    width: '100%',
  },
  detailLabel: {
    ...Typography.caption,
    fontSize: 13,
    fontWeight: '500',
  },
  detailValue: {
    ...Typography.caption,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  enhancedActionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 2,
  },
  enhancedActionText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
};

export default TransactionListItem; 