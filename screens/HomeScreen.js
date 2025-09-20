// sendnreceive-app/screens/HomeScreen.js
import React, { useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image, // Added Image for flags
  Platform, // Added Platform
  LayoutAnimation, // Added LayoutAnimation
  ActivityIndicator, // Added ActivityIndicator
  Alert, // Added Alert
  UIManager // Added UIManager for LayoutAnimation on Android
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import QuickActionCard from '../components/QuickActionCard';
import { AuthContext } from '../contexts/AuthContext';
import { TransactionContext } from '../contexts/TransactionContext';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient'; // Add for gradient button

const { width } = Dimensions.get('window');

// Helper to format currency - consider moving to a utils file if used elsewhere
const formatCurrency = (amount, currencyCode = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(amount);
};

const HomeScreen = () => {
  const { user, updateUserKycStatus } = useContext(AuthContext);
  const { transactions, fetchTransactionHistory, isLoadingTransactions } = useContext(TransactionContext);

  const navigation = useNavigation();

  useEffect(() => {
    fetchTransactionHistory();
    if (Platform.OS === 'android') {
        if (UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
    }
  }, []);

  // Apply layout animation when transactions data changes
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [transactions]);


  const renderTransactionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.transactionCard}
      onPress={() => Alert.alert('Transaction Detail', `Details for transaction ID: ${item._id}\n(Navigation to detail screen not implemented in this step)`)}
    >
      <View style={styles.transactionIconContainer}>
        {item.type === 'received' && <MaterialIcons name="call-received" size={22} color={Colors.success} />}
        {item.type === 'sent' && <MaterialIcons name="call-made" size={22} color={Colors.error} />}
        {item.type === 'deposit' && <MaterialCommunityIcons name="wallet-plus-outline" size={22} color={Colors.primary} />}
        {item.type === 'withdrawal' && <MaterialCommunityIcons name="wallet-minus-outline" size={22} color={Colors.warning} />}
        {item.type === 'pay_in_store' && <MaterialCommunityIcons name="storefront-outline" size={22} color={Colors.accent} />}
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionRecipient} numberOfLines={1}>
          {item.type === 'received' ? `Received from ${item.recipientName}` :
           item.type === 'sent' ? `Sent to ${item.recipientName}` :
           item.type === 'deposit' ? 'Deposit' :
           item.type === 'withdrawal' ? 'Withdrawal' :
           item.type === 'pay_in_store' ? `Paid at ${item.recipientName}` : 'Transaction'}
        </Text>
        <Text style={styles.transactionDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          { color: (item.type === 'received' || item.type === 'deposit') ? Colors.success : Colors.error },
        ]}
      >
        {(item.type === 'received' || item.type === 'deposit') ? '+' : '-'}
        {formatCurrency(item.sourceAmount, item.sourceCurrency)}
      </Text>
    </TouchableOpacity>
  );

  const mockBalance = {
      main: 1250.75,
      mainCurrency: 'USD',
      secondaryBalances: [
          {amount: 980.50, currency: 'EUR'},
          {amount: 150000.00, currency: 'KES'}
      ]
  };

  const mockRate = {
      fromCountry: 'Netherlands',
      fromFlag: require('../assets/images/sendnreceive_logo.png'),
      toCountry: 'Ghana',
      toFlag: require('../assets/images/sendnreceive_logo.png'),
      rate: '1.00 EUR = 11.9768 GHS'
  };


  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={Typography.smallText}>Welcome Back,</Text>
            <Text style={styles.headerWelcomeName}>{user?.fullName?.split(' ')[0] ?? 'User'}!</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => Alert.alert('Notifications', 'Notifications screen coming soon!')}>
              <Ionicons name="notifications-outline" size={26} color={Colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate('ProfileSettings')}
            >
              <Ionicons name="person-circle-outline" size={28} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {user?.kycStatus !== 'verified' && (
          <View style={styles.verificationCard}>
            <MaterialCommunityIcons name="shield-alert-outline" size={36} color={Colors.warning} />
            <View style={styles.verificationTextContainer}>
              <Text style={styles.verificationTitle}>Verify your identity</Text>
              <Text style={styles.verificationText}>
                Complete verification to unlock all features.
              </Text>
            </View>
            <TouchableOpacity onPress={() => {
                Alert.alert('KYC Verification', 'Navigate to KYC screen (not implemented). \nFor demo, we will mark KYC as verified.');
                if (updateUserKycStatus) updateUserKycStatus('verified');
            }}>
              <Text style={styles.verifyNowButton}>Verify Now</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.walletCard}>
          <Text style={[Typography.smallText, {marginBottom: 5}]}>Total Available Balance</Text>
          <Text style={Typography.mainBalance}>
            {formatCurrency(mockBalance.main, mockBalance.mainCurrency)}
          </Text>
          <Text style={[Typography.secondaryBalance, {marginTop: 5}]}>
            {mockBalance.secondaryBalances.map(b => formatCurrency(b.amount, b.currency)).join(' • ')}
          </Text>
          <View style={styles.walletActions}>
            <TouchableOpacity style={styles.walletActionButton} onPress={() => navigation.navigate('Deposit')}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} style={{marginRight: 5}}/>
              <Text style={styles.walletActionButtonText}>Add Money</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.walletActionButton} onPress={() => navigation.navigate('Withdraw')}>
              <Ionicons name="remove-circle-outline" size={20} color={Colors.primary} style={{marginRight: 5}}/>
              <Text style={styles.walletActionButtonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionHeader}>Current Rate</Text>
        <View style={styles.rateCard}>
            <View style={styles.rateDisplay}>
                <View style={styles.rateCountryContainer}>
                    <Image source={mockRate.fromFlag} style={styles.flag} />
                    <Text style={styles.rateCurrency}>{mockRate.fromCountry}</Text>
                </View>
                <Ionicons name="arrow-forward-outline" size={20} color={Colors.textMuted} style={styles.rateArrow} />
                <View style={styles.rateCountryContainer}>
                    <Image source={mockRate.toFlag} style={styles.flag} />
                    <Text style={styles.rateCurrency}>{mockRate.toCountry}</Text>
                </View>
            </View>
            <Text style={styles.rateValue}>{mockRate.rate}</Text>
            <TouchableOpacity
                style={styles.sendNowButton}
                onPress={() => navigation.navigate('SendMoneyFromHome')}
            >
                <Text style={styles.sendNowButtonText}>Send Money Now</Text>
            </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickActionCard iconName="people-outline" title="Recipients" onPress={() => Alert.alert("Recipients", "Recipients screen coming soon!")} />
          <QuickActionCard iconName="wallet-outline" title="My Wallet" onPress={() => Alert.alert("My Wallet", "Wallet details screen coming soon!")} />
          <QuickActionCard iconName="help-circle-outline" title="Help" onPress={() => Alert.alert("Help Center", "Help Center screen coming soon!")} />
          <QuickActionCard iconName="settings-outline" title="Settings" onPress={() => navigation.navigate('ProfileSettings')} />
        </View>

        {/* Main CTA Button with gradient */}
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.mainSendButton}
        >
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center' }}
          onPress={() => navigation.navigate('SendMoneyFromHome')}
            activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="send-circle-outline" size={28} color={Colors.cardBackground} />
          <Text style={styles.mainSendButtonText}>Send Money</Text>
        </TouchableOpacity>
        </LinearGradient>

        <View style={styles.promoBanner}>
          <Ionicons name="gift-outline" size={30} color={Colors.indigo} />
          <View style={styles.promoTextContainer}>
            <Text style={styles.promoTitle}>Special Promotion!</Text>
            <Text style={styles.promoDescription}>
              Send money to Ghana with 0 fees this month.
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={24} color={Colors.indigo} />
        </View>

        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeader}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TransactionHistoryFromHome')}>
            <Text style={styles.viewAllButton}>View All</Text>
          </TouchableOpacity>
        </View>

        {isLoadingTransactions && transactions.length === 0 ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{marginTop: 20}}/>
        ) : transactions.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Ionicons name="file-tray-stacked-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.noDataText}>No recent activity to show.</Text>
          </View>
        ) : (
          <FlatList
            data={transactions.slice(0, 3)}
            keyExtractor={(item) => item._id}
            renderItem={renderTransactionItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 15 : 10,
    paddingBottom: 10,
  },
  headerWelcomeName: {
    ...Typography.header,
    fontSize: 26,
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 18,
    padding: 5,
  },
  walletCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16, // 8px system
    marginHorizontal: 16,
    padding: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 24,
    marginTop: 8,
  },
  walletActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 20,
  },
  walletActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginRight: 15,
  },
  walletActionButtonText: {
    ...Typography.bodyText,
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  verificationCard: {
    backgroundColor: Colors.primary,
    borderRadius: 15,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 25,
  },
  verificationTextContainer: {
      flex: 1,
      marginLeft: 15,
      marginRight: 10,
  },
  verificationTitle: {
    ...Typography.subHeader,
    color: Colors.cardBackground,
    fontSize: 17,
    marginBottom: 3,
  },
  verificationText: {
    ...Typography.smallText,
    color: '#E0E0E0',
    fontSize: 13,
    lineHeight: 18,
  },
  verifyNowButton: {
    ...Typography.bodyText,
    color: Colors.cardBackground,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    fontSize: 14,
    paddingLeft: 5, // Ensure it's not too close to text
  },
  rateCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 15,
    marginHorizontal: 20,
    padding: 20,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 25,
  },
  rateDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
  },
  rateCountryContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1, // Allow shrinking/growing
  },
  flag: {
      width: 24,
      height: 16,
      resizeMode: 'cover',
      marginRight: 8,
      borderRadius: 3,
  },
  rateCurrency: {
      ...Typography.bodyText,
      fontWeight: '600',
      fontSize: 15,
      flexShrink: 1, // Allow text to shrink if needed
  },
  rateArrow: {
      marginHorizontal: 5, // Reduced margin
  },
  rateValue: {
    ...Typography.subHeader,
    fontSize: 18,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 15,
  },
  sendNowButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  sendNowButtonText: {
    ...Typography.buttonText,
    fontSize: 16,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    marginTop: 0, // Reduced from 10
  },
  sectionHeader: {
    ...Typography.subHeader,
    fontSize: 18,
    marginTop: 10, // Added back for spacing above header text itself
    marginBottom: 10, // Reduced
  },
  viewAllButton: {
    ...Typography.link,
    fontSize: 14,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  mainSendButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 25,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  mainSendButtonText: {
    ...Typography.buttonText,
    fontSize: 18,
    marginLeft: 10,
    color: Colors.text, // Text color on accent bg might need to be dark
  },
  promoBanner: {
    backgroundColor: Colors.lightBlue,
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  promoTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  promoTitle: {
    ...Typography.promoTitle,
  },
  promoDescription: {
    ...Typography.promoDescription,
    marginTop: 3,
  },
  transactionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1.5,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: Colors.lightBlue,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionRecipient: {
    ...Typography.bodyText,
    fontWeight: '600',
    fontSize: 15,
  },
  transactionDate: {
    ...Typography.smallText,
    fontSize: 12,
  },
  transactionAmount: {
    ...Typography.bodyText,
    fontWeight: 'bold',
    fontSize: 15,
  },
  separator: {
      height: 0,
  },
  noDataContainer: {
      alignItems: 'center',
      marginTop: 30, // Adjusted
      marginBottom: 20,
      marginHorizontal: 20,
      paddingVertical: 30, // More padding
      backgroundColor: Colors.cardBackground,
      borderRadius: 15,
      borderWidth: 1, // Subtle border
      borderColor: '#e0e0e0',
  },
  noDataText: {
    ...Typography.bodyText,
    textAlign: 'center',
    color: Colors.textMuted,
    marginTop: 10,
  },
});

export default HomeScreen;
