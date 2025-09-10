import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import * as Haptics from 'expo-haptics';

const SplitBillDetailsScreen = ({ navigation, route }) => {
  const { splitId } = route.params;
  
  // Mock split bill data
  const [splitBill, setSplitBill] = useState({
    id: splitId,
    totalAmount: '150.00',
    currency: 'GHS',
    numberOfPeople: 3,
    amountPerPerson: '50.00',
    description: 'Dinner at Restaurant',
    createdAt: new Date().toISOString(),
    status: 'active', // active, completed, cancelled
    participants: [
      {
        id: '1',
        name: 'John Doe',
        phone: '+233 20 123 4567',
        avatar: '👤',
        status: 'paid', // pending, paid, declined
        paidAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        amount: '50.00'
      },
      {
        id: '2',
        name: 'Jane Smith',
        phone: '+233 24 987 6543',
        avatar: '👤',
        status: 'pending',
        paidAt: null,
        amount: '50.00'
      },
      {
        id: '3',
        name: 'Mike Johnson',
        phone: '+233 26 555 1234',
        avatar: '👤',
        status: 'pending',
        paidAt: null,
        amount: '50.00'
      }
    ]
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return Colors.success;
      case 'pending': return Colors.warning;
      case 'declined': return Colors.error;
      default: return Colors.textMuted;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'declined': return 'close-circle';
      default: return 'ellipse-outline';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'pending': return 'Pending';
      case 'declined': return 'Declined';
      default: return 'Unknown';
    }
  };

  const handleShareSplitBill = async () => {
    try {
      const shareMessage = `Hey! I created a split bill for ${splitBill.currency} ${splitBill.totalAmount}.\n\n• Your share: ${splitBill.currency} ${splitBill.amountPerPerson}\n• Total people: ${splitBill.numberOfPeople}\n• Description: ${splitBill.description}\n\nClick here to pay: https://eymwallet.com/split/${splitBill.id}`;
      
      await Share.share({
        message: shareMessage,
        title: 'Split Bill Invitation',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share split bill link');
    }
  };

  const handleRemindParticipant = (participant) => {
    Haptics.selectionAsync();
    Alert.alert(
      'Send Reminder',
      `Send a reminder to ${participant.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Reminder', 
          onPress: () => {
            Alert.alert(
              'Reminder Sent',
              `A reminder has been sent to ${participant.name}`,
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  const handleCancelSplitBill = () => {
    Haptics.selectionAsync();
    Alert.alert(
      'Cancel Split Bill',
      'Are you sure you want to cancel this split bill? This action cannot be undone.',
      [
        { text: 'No, Keep It', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => {
            setSplitBill(prev => ({ ...prev, status: 'cancelled' }));
            Alert.alert(
              'Split Bill Cancelled',
              'The split bill has been cancelled successfully.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  const renderParticipantItem = (participant) => {
    const statusColor = getStatusColor(participant.status);
    const statusIcon = getStatusIcon(participant.status);
    const statusText = getStatusText(participant.status);
    
    return (
      <View key={participant.id} style={styles.participantItem}>
        <View style={styles.participantInfo}>
          <Text style={styles.participantAvatar}>{participant.avatar}</Text>
          <View style={styles.participantDetails}>
            <Text style={styles.participantName}>{participant.name}</Text>
            <Text style={styles.participantPhone}>{participant.phone}</Text>
            {participant.paidAt && (
              <Text style={styles.paidAt}>
                Paid {new Date(participant.paidAt).toLocaleTimeString()}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.participantStatus}>
          <Text style={[styles.participantAmount, { color: statusColor }]}>
            {splitBill.currency} {participant.amount}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Ionicons name={statusIcon} size={14} color={statusColor} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
          {participant.status === 'pending' && (
            <TouchableOpacity
              style={styles.remindButton}
              onPress={() => handleRemindParticipant(participant)}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={16} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const paidCount = splitBill.participants.filter(p => p.status === 'paid').length;
  const pendingCount = splitBill.participants.filter(p => p.status === 'pending').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Split Bill Details</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareSplitBill}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>{splitBill.description}</Text>
            <View style={[styles.statusBadge, { backgroundColor: Colors.primary + '20' }]}>
              <Text style={[styles.statusText, { color: Colors.primary }]}>
                {splitBill.status === 'active' ? 'Active' : splitBill.status === 'completed' ? 'Completed' : 'Cancelled'}
              </Text>
            </View>
          </View>
          
          <View style={styles.summaryAmount}>
            <Text style={styles.totalAmount}>{splitBill.currency} {splitBill.totalAmount}</Text>
            <Text style={styles.amountPerPerson}>
              {splitBill.currency} {splitBill.amountPerPerson} per person
            </Text>
          </View>
          
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{splitBill.numberOfPeople}</Text>
              <Text style={styles.statLabel}>Total People</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{paidCount}</Text>
              <Text style={styles.statLabel}>Paid</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Participants Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participants</Text>
          <View style={styles.participantsList}>
            {splitBill.participants.map(renderParticipantItem)}
          </View>
        </View>

        {/* Actions Section */}
        {splitBill.status === 'active' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.actionsList}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShareSplitBill}
                activeOpacity={0.7}
              >
                <Ionicons name="share-outline" size={20} color={Colors.primary} />
                <Text style={styles.actionButtonText}>Share Link</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => Alert.alert('Edit', 'Edit split bill functionality coming soon!')}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.actionButtonText}>Edit Bill</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancelSplitBill}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle-outline" size={20} color={Colors.error} />
                <Text style={[styles.actionButtonText, { color: Colors.error }]}>Cancel Bill</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Split Bill Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Split Bill Info</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Split ID</Text>
              <Text style={styles.infoValue}>{splitBill.id}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>
                {new Date(splitBill.createdAt).toLocaleDateString()} at {new Date(splitBill.createdAt).toLocaleTimeString()}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Payment Link</Text>
              <Text style={styles.infoValue}>https://eymwallet.com/split/{splitBill.id}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.textPrimary,
  },
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Montserrat-SemiBold',
  },
  summaryAmount: {
    alignItems: 'center',
    marginBottom: 20,
  },
  totalAmount: {
    fontSize: 32,
    fontFamily: 'Montserrat-Bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  amountPerPerson: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: Colors.textMuted,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: Colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  participantsList: {
    gap: 12,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  participantPhone: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: Colors.textMuted,
  },
  paidAt: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: Colors.success,
    marginTop: 2,
  },
  participantStatus: {
    alignItems: 'flex-end',
  },
  participantAmount: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 4,
  },
  remindButton: {
    padding: 8,
    marginTop: 4,
  },
  actionsList: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: Colors.textPrimary,
    marginLeft: 12,
  },
  cancelButton: {
    borderColor: Colors.error + '30',
  },
  infoList: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: Colors.textMuted,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    color: Colors.textPrimary,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
};

export default SplitBillDetailsScreen; 