import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import StandardizedContainer from '../components/StandardizedContainer';

const ConnectedBankAccountsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for connected bank accounts
  const mockConnectedAccounts = [
    {
      id: '1',
      bankName: 'Chase Bank',
      accountType: 'Checking',
      accountNumber: '****1234',
      balance: 2547.89,
      status: 'active',
      lastSync: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      bankName: 'Bank of America',
      accountType: 'Savings',
      accountNumber: '****5678',
      balance: 12500.00,
      status: 'active',
      lastSync: '2024-01-15T09:15:00Z',
    },
    {
      id: '3',
      bankName: 'Wells Fargo',
      accountType: 'Checking',
      accountNumber: '****9012',
      balance: 892.45,
      status: 'error',
      lastSync: '2024-01-14T16:45:00Z',
    },
  ];

  useEffect(() => {
    loadConnectedAccounts();
  }, []);

  const loadConnectedAccounts = async () => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConnectedAccounts(mockConnectedAccounts);
    } catch (error) {
      console.error('Error loading connected accounts:', error);
      Alert.alert('Error', 'Failed to load connected bank accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConnectedAccounts();
    setRefreshing(false);
  };

  const handleDisconnectAccount = (accountId) => {
    Alert.alert(
      'Disconnect Account',
      'Are you sure you want to disconnect this bank account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            setConnectedAccounts(prev => prev.filter(account => account.id !== accountId));
            Alert.alert('Success', 'Bank account disconnected successfully');
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return Colors.success;
      case 'error':
        return Colors.error;
      default:
        return Colors.textMuted;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Connected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  const formatBalance = (balance) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(balance);
  };

  const BankAccountCard = ({ account }) => (
    <View style={[styles.accountCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.accountHeader}>
        <View style={styles.bankInfo}>
          <View style={[styles.bankIcon, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="business-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.bankDetails}>
            <Text style={[styles.bankName, { color: colors.textPrimary }]}>{account.bankName}</Text>
            <Text style={[styles.accountType, { color: colors.textSecondary }]}>
              {account.accountType} • {account.accountNumber}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(account.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(account.status) }]}>
            {getStatusText(account.status)}
          </Text>
        </View>
      </View>

      <View style={styles.accountBody}>
        <View style={styles.balanceSection}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Available Balance</Text>
          <Text style={[styles.balanceAmount, { color: colors.textPrimary }]}>
            {formatBalance(account.balance)}
          </Text>
        </View>
      </View>

      <View style={styles.accountActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.refreshButton, { borderColor: colors.border }]}
          onPress={() => Alert.alert('Refresh', 'Refreshing account data...')}
        >
          <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>Refresh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.disconnectButton, { borderColor: colors.error }]}
          onPress={() => handleDisconnectAccount(account.id)}
        >
          <Ionicons name="unlink-outline" size={16} color={colors.error} />
          <Text style={[styles.actionButtonText, { color: colors.error }]}>Disconnect</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <StandardizedContainer>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Connected Bank Accounts</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('PlaidBankLinking')}
          >
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="sync-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading connected accounts...
            </Text>
          </View>
        ) : connectedAccounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No Connected Accounts
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Connect your bank accounts to easily transfer funds and view balances
            </Text>
            <TouchableOpacity
              style={[styles.connectButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('PlaidBankLinking')}
            >
              <Ionicons name="add" size={20} color="#ffffff" />
              <Text style={styles.connectButtonText}>Connect Bank Account</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.summarySection}>
              <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>
                Account Summary
              </Text>
              <View style={styles.summaryStats}>
                <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
                  <Text style={[styles.statNumber, { color: colors.primary }]}>
                    {connectedAccounts.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Connected Accounts
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
                  <Text style={[styles.statNumber, { color: Colors.success }]}>
                    {connectedAccounts.filter(acc => acc.status === 'active').length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Active
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
                  <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
                    {formatBalance(connectedAccounts.reduce((sum, acc) => sum + acc.balance, 0))}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Total Balance
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.accountsSection}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Your Bank Accounts
              </Text>
              {connectedAccounts.map((account) => (
                <BankAccountCard key={account.id} account={account} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </StandardizedContainer>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  addButton: {
    padding: 8,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: Typography.fontFamily,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    fontFamily: Typography.fontFamily,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
    paddingHorizontal: 20,
    fontFamily: Typography.fontFamily,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: Typography.fontFamily,
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: Typography.fontFamily,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: Typography.fontFamily,
  },
  accountsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: Typography.fontFamily,
  },
  accountCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bankIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bankDetails: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  accountType: {
    fontSize: 14,
    marginTop: 2,
    fontFamily: Typography.fontFamily,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  accountBody: {
    marginBottom: 16,
  },
  balanceSection: {
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: Typography.fontFamily,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  accountActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  refreshButton: {
    backgroundColor: 'transparent',
  },
  disconnectButton: {
    backgroundColor: 'transparent',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: Typography.fontFamily,
  },
});

export default ConnectedBankAccountsScreen;
