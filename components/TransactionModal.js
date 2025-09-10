import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';

const TransactionModal = ({
  visible,
  onClose,
  transaction,
  colors = Colors,
  onShare,
  onCopyReference,
  onQRCodePress,
  onLocationPress,
  onContactSupport,
  onReport,
}) => {
  if (!transaction) return null;

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'received':
        return { name: 'arrow-down-circle', color: colors.success };
      case 'sent':
        return { name: 'arrow-up-circle', color: colors.error };
      case 'deposit':
        return { name: 'wallet', color: colors.info };
      case 'withdrawal':
        return { name: 'cash', color: colors.warning };
      case 'pay_in_store':
        return { name: 'card', color: colors.brandPurple || colors.primary };
      default:
        return { name: 'help-circle', color: colors.textMuted };
    }
  };

     const isDebit = transaction.type === 'sent' || transaction.type === 'withdrawal' || transaction.type === 'pay_in_store';
   const amountColor = isDebit ? colors.error : colors.success;
   const amountPrefix = isDebit ? '-' : '+';

   const getStatusInfo = (status) => {
     switch (status?.toLowerCase()) {
       case 'completed':
       case 'success':
         return { text: 'Transaction Completed', color: colors.success };
       case 'pending':
         return { text: 'Transaction Pending', color: colors.warning };
       case 'failed':
       case 'error':
         return { text: 'Transaction Failed', color: colors.error };
       case 'cancelled':
         return { text: 'Transaction Cancelled', color: colors.error };
       default:
         return { text: 'Transaction Completed', color: colors.success };
     }
   };

   const statusInfo = getStatusInfo(transaction.status);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.enhancedModalOverlay}>
        <BlurView 
          intensity={20}
          tint={colors.isDark ? "dark" : "light"}
          style={styles.enhancedModalBackdrop}
        >
          <TouchableOpacity 
            style={styles.enhancedModalBackdropTouchable} 
            activeOpacity={1} 
            onPress={onClose}
          />
        </BlurView>
        
                <View style={[styles.enhancedModalContent, { backgroundColor: 'white', borderColor: colors.border, maxHeight: '100%' }]}>
          <ScrollView style={styles.enhancedModalScroll} showsVerticalScrollIndicator={false}>
            {/* Close Button */}
            <TouchableOpacity onPress={onClose} style={styles.enhancedModalCloseButton}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
            
                         {/* Amount Section */}
             <View style={styles.enhancedModalAmountSection}>
               {/* Transaction Icon */}
               <View style={[styles.enhancedModalIcon, { backgroundColor: getTransactionIcon(transaction.type).color + '15' }]}>
                 <Ionicons 
                   name={getTransactionIcon(transaction.type).name} 
                   size={24} 
                   color={getTransactionIcon(transaction.type).color} 
                 />
               </View>
                               <Text style={[styles.enhancedModalAmount, { color: amountColor }]}>
                  {amountPrefix}{transaction.currency} {transaction.amount}
                </Text>
                <Text style={[styles.enhancedModalDate, { color: colors.textMuted }]}>
                  {new Date(transaction.date).toLocaleDateString()} at {new Date(transaction.date).toLocaleTimeString()}
                </Text>
                                 {/* Status Timeline moved here */}
                 <View style={[styles.enhancedModalTimeline, { alignSelf: 'center', width: 'auto' }]}>
                   <View style={[styles.enhancedModalTimelineItem, styles.enhancedModalTimelineItemActive]}>
                     <View style={[styles.enhancedModalTimelineDot, { backgroundColor: statusInfo.color }]} />
                     <View style={[styles.enhancedModalTimelineContent, { flex: 0 }]}>
                       <Text style={[styles.enhancedModalTimelineTitle, { color: '#000000', fontSize: 16, fontWeight: '600' }]}>{statusInfo.text}</Text>
                     </View>
                   </View>
                 </View>
             </View>

                         {/* Transaction Details */}
             <View style={styles.enhancedModalDetailsSection}>
              
              <View style={styles.enhancedModalDetailRow}>
                <Text style={[styles.enhancedModalDetailLabel, { color: colors.textMuted }]}>Reference</Text>
                <Text style={[styles.enhancedModalDetailValue, { color: colors.textPrimary }]}>{transaction.reference}</Text>
              </View>
              
              {transaction.details && (
                <View style={styles.enhancedModalDetailRow}>
                  <Text style={[styles.enhancedModalDetailLabel, { color: colors.textMuted }]}>Description</Text>
                  <Text style={[styles.enhancedModalDetailValue, { color: colors.textPrimary }]}>{transaction.details}</Text>
                </View>
              )}
              
              {transaction.from && (
                <View style={styles.enhancedModalDetailRow}>
                  <Text style={[styles.enhancedModalDetailLabel, { color: colors.textMuted }]}>From</Text>
                  <Text style={[styles.enhancedModalDetailValue, { color: colors.textPrimary }]}>{transaction.from}</Text>
                </View>
              )}
              
              {transaction.to && (
                <View style={styles.enhancedModalDetailRow}>
                  <Text style={[styles.enhancedModalDetailLabel, { color: colors.textMuted }]}>To</Text>
                  <Text style={[styles.enhancedModalDetailValue, { color: colors.textPrimary }]}>{transaction.to}</Text>
                </View>
              )}
              
              {transaction.merchant && (
                <View style={styles.enhancedModalDetailRow}>
                  <Text style={[styles.enhancedModalDetailLabel, { color: colors.textMuted }]}>Merchant</Text>
                  <Text style={[styles.enhancedModalDetailValue, { color: colors.textPrimary }]}>{transaction.merchant}</Text>
                </View>
              )}
              
              {transaction.method && (
                <View style={styles.enhancedModalDetailRow}>
                  <Text style={[styles.enhancedModalDetailLabel, { color: colors.textMuted }]}>Method</Text>
                  <Text style={[styles.enhancedModalDetailValue, { color: colors.textPrimary }]}>{transaction.method}</Text>
                </View>
              )}
              
              {transaction.fee && transaction.fee !== '0.00' && (
                <View style={styles.enhancedModalDetailRow}>
                  <Text style={[styles.enhancedModalDetailLabel, { color: colors.textMuted }]}>Fee</Text>
                  <Text style={[styles.enhancedModalDetailValue, { color: colors.textPrimary }]}>{transaction.currency} {transaction.fee}</Text>
                </View>
              )}
            </View>

            

                         {/* Action Buttons */}
             <View style={styles.enhancedModalActionsSection}>
               
               <View style={styles.enhancedModalActionButtons}>
                 <TouchableOpacity 
                   style={[styles.enhancedModalActionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                   onPress={onShare}
                 >
                   <Ionicons name="share-outline" size={20} color={colors.textPrimary} />
                   <Text style={[styles.enhancedModalActionText, { color: colors.textPrimary }]}>Share</Text>
                 </TouchableOpacity>
                 
                                   <TouchableOpacity 
                    style={[styles.enhancedModalActionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                    onPress={onCopyReference}
                  >
                    <Ionicons name="copy-outline" size={20} color={colors.textPrimary} />
                    <Text style={[styles.enhancedModalActionText, { color: colors.textPrimary }]}>Copy</Text>
                  </TouchableOpacity>
                 
                 <TouchableOpacity 
                   style={[styles.enhancedModalActionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                   onPress={() => onQRCodePress(transaction)}
                 >
                   <Ionicons name="qr-code-outline" size={20} color={colors.textPrimary} />
                   <Text style={[styles.enhancedModalActionText, { color: colors.textPrimary }]}>QR Code</Text>
                 </TouchableOpacity>
               </View>
               
               <View style={styles.enhancedModalActionButtons}>
                 <TouchableOpacity 
                   style={[styles.enhancedModalActionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                   onPress={() => onLocationPress(transaction)}
                 >
                   <Ionicons name="location-outline" size={20} color={colors.textPrimary} />
                   <Text style={[styles.enhancedModalActionText, { color: colors.textPrimary }]}>Location</Text>
                 </TouchableOpacity>
                 
                 <TouchableOpacity 
                   style={[styles.enhancedModalActionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                   onPress={onContactSupport}
                 >
                   <Ionicons name="chatbubble-outline" size={20} color={colors.textPrimary} />
                   <Text style={[styles.enhancedModalActionText, { color: colors.textPrimary }]}>Support</Text>
                 </TouchableOpacity>
                 
                 <TouchableOpacity 
                   style={[styles.enhancedModalActionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                   onPress={onReport}
                 >
                   <Ionicons name="flag-outline" size={20} color={colors.textPrimary} />
                   <Text style={[styles.enhancedModalActionText, { color: colors.textPrimary }]}>Report</Text>
                 </TouchableOpacity>
               </View>
             </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  enhancedModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  enhancedModalBackdropTouchable: {
    flex: 1,
  },
  enhancedModalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  enhancedModalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  enhancedModalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  enhancedModalScroll: {
    maxHeight: 590,
  },
  enhancedModalAmountSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  enhancedModalAmount: {
    ...Typography.heading,
    fontSize: 32,
    marginBottom: 8,
  },
  enhancedModalDate: {
    ...Typography.body,
    fontSize: 14,
  },
  enhancedModalDetailsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  enhancedModalSectionTitle: {
    ...Typography.heading,
    fontSize: 16,
    marginBottom: 16,
  },
  enhancedModalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  enhancedModalDetailLabel: {
    ...Typography.body,
    fontSize: 14,
    flex: 1,
  },
  enhancedModalDetailValue: {
    ...Typography.body,
    fontSize: 14,
    flex: 2,
    textAlign: 'right',
    fontWeight: '600',
  },
  enhancedModalTimelineSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  enhancedModalTimeline: {
    marginTop: 8,
  },
  enhancedModalTimelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  enhancedModalTimelineItemActive: {
    opacity: 1,
  },
  enhancedModalTimelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  enhancedModalTimelineContent: {
    flex: 1,
  },
  enhancedModalTimelineTitle: {
    ...Typography.body,
    fontSize: 14,
    marginBottom: 2,
    fontWeight: '600',
  },
  enhancedModalTimelineTime: {
    ...Typography.caption,
    fontSize: 12,
  },
  enhancedModalActionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  enhancedModalActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
     enhancedModalActionButton: {
     flex: 1,
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 12,
     paddingHorizontal: 8,
     borderRadius: 12,
     borderWidth: 1,
     gap: 6,
   },
  enhancedModalActionText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '500',
  },
};

export default TransactionModal; 