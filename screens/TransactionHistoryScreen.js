import React, { useState, useEffect, useRef } from 'react'; // Added useEffect, useRef
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, SafeAreaView, LayoutAnimation, Platform, ScrollView, Animated } from 'react-native'; // Added LayoutAnimation, Platform, ScrollView, Animated
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import GlobeBackground from '../components/GlobeBackground';
import TransactionItem from '../components/TransactionItem';

// mockTransactions array definition (moved outside for clarity)
const mockTransactions = [
  { id: '1', type: 'received', amount: '50.00', currency: 'USD', from: 'John D.', date: '2023-10-20', status: 'Completed', details: 'Payment for freelance work' },
  { id: '2', type: 'sent', amount: '100.00', currency: 'USD', to: 'Jane S.', date: '2023-10-19', status: 'Completed', details: 'Birthday gift' },
  { id: '3', type: 'deposit', amount: '200.00', currency: 'USD', method: 'Credit Card', date: '2023-10-18', status: 'Completed', details: 'Account funding' },
  { id: '4', type: 'withdrawal', amount: '75.00', currency: 'USD', method: 'Bank Transfer', date: '2023-10-17', status: 'Pending', details: 'Withdrawal to savings' },
  { id: '5', type: 'received', amount: '120.50', currency: 'EUR', from: 'Alex G.', date: '2023-10-16', status: 'Completed', details: 'Project payment' },
  { id: '6', type: 'sent', amount: '30.00', currency: 'KES', to: 'Local Shop', date: '2023-10-15', status: 'Completed', details: 'Groceries' },
  { id: '7', type: 'pay_in_store', amount: '15.00', currency: 'USD', merchant: 'Coffee Place', date: '2023-10-14', status: 'Completed', details: 'Morning coffee' },
];

const TransactionHistoryScreen = ({ navigation }) => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [displayedTransactions, setDisplayedTransactions] = useState([]);
  const screenOpacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      screenOpacity.setValue(0);
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }, [screenOpacity])
  );

  useEffect(() => {
    // Simulate loading transactions with animation
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDisplayedTransactions(mockTransactions);
  }, []); // Empty dependency array means this runs once on mount

  const handleSelectTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <GlobeBackground />
        <Animated.View style={{ flex: 1, opacity: screenOpacity }}>
          <View style={{backgroundColor: '#fbbf24', padding: 8, borderRadius: 8, margin: 12, alignItems: 'center'}}>
            <Text style={{color: '#1e293b', fontWeight: 'bold', fontSize: 16}}>MOBILE MVP - ACTIVITY SCREEN</Text>
          </View>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={28} color={Colors.cardBackground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction History</Text>
          <TouchableOpacity onPress={() => Alert.alert("Filter", "Filter options not implemented.")} style={styles.filterButton}>
            <Ionicons name="filter-outline" size={24} color={Colors.cardBackground} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={displayedTransactions}
            renderItem={({ item }) => (
              <TransactionItem item={item} onPress={handleSelectTransaction} />
            )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No transactions yet.</Text>}
        />

        {selectedTransaction && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Transaction Details</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
                      <Ionicons name="close" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                <ScrollView>
                    <Text style={styles.detailRow}><Text style={styles.detailLabel}>Type:</Text> {selectedTransaction.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                    <Text style={styles.detailRow}><Text style={styles.detailLabel}>Amount:</Text> {selectedTransaction.currency} {selectedTransaction.amount}</Text>
                    <Text style={styles.detailRow}><Text style={styles.detailLabel}>Date:</Text> {selectedTransaction.date}</Text>
                    <Text style={styles.detailRow}><Text style={styles.detailLabel}>Status:</Text> {selectedTransaction.status}</Text>
                    {selectedTransaction.from && <Text style={styles.detailRow}><Text style={styles.detailLabel}>From:</Text> {selectedTransaction.from}</Text>}
                    {selectedTransaction.to && <Text style={styles.detailRow}><Text style={styles.detailLabel}>To:</Text> {selectedTransaction.to}</Text>}
                    {selectedTransaction.method && <Text style={styles.detailRow}><Text style={styles.detailLabel}>Method:</Text> {selectedTransaction.method}</Text>}
                    {selectedTransaction.merchant && <Text style={styles.detailRow}><Text style={styles.detailLabel}>Merchant:</Text> {selectedTransaction.merchant}</Text>}
                    <Text style={styles.detailRow}><Text style={styles.detailLabel}>Details:</Text> {selectedTransaction.details}</Text>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    ...Typography.subHeader,
    color: Colors.cardBackground,
    fontSize: 20,
    textAlign: 'center',
    flex: 1,
  },
  filterButton: {
    padding: 8,
  },
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  transactionItem: {
    backgroundColor: Colors.cardBackground,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  transactionIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
    marginRight: 8,
  },
  transactionTitle: {
    ...Typography.bodyText,
    color: Colors.text,
    marginBottom: 1,
  },
  transactionDate: {
    ...Typography.smallText,
    color: Colors.textMuted,
  },
  transactionAmount: {
    ...Typography.bodyText,
    fontWeight: 'bold',
  },
  emptyText: {
    ...Typography.bodyText,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    ...Typography.header,
    color: Colors.primary,
    marginBottom: 16,
  },
  detailRow: {
    ...Typography.bodyText,
    marginBottom: 8,
  },
  detailLabel: {
    ...Typography.smallText,
    color: Colors.textMuted,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    ...Typography.buttonText,
    color: Colors.cardBackground,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalCloseButton: {
    padding: 4,
    marginLeft: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(30,64,175,0.08)', // subtle brand blue tint
  },
});

export default TransactionHistoryScreen;
