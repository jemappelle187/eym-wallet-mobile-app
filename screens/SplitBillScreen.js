import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Share,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import * as Haptics from 'expo-haptics';

const SplitBillScreen = ({ navigation, route }) => {
  const [totalAmount, setTotalAmount] = useState('150');
  const [numberOfPeople, setNumberOfPeople] = useState(3);
  const [amountPerPerson, setAmountPerPerson] = useState('50');
  const [billDescription, setBillDescription] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [splitId, setSplitId] = useState(null);

  // Mock contacts data
  const mockContacts = [
    { id: '1', name: 'John Doe', phone: '+233 20 123 4567', avatar: '👤' },
    { id: '2', name: 'Jane Smith', phone: '+233 24 987 6543', avatar: '👤' },
    { id: '3', name: 'Mike Johnson', phone: '+233 26 555 1234', avatar: '👤' },
    { id: '4', name: 'Sarah Wilson', phone: '+233 27 777 8888', avatar: '👤' },
    { id: '5', name: 'David Brown', phone: '+233 28 999 0000', avatar: '👤' },
  ];

  useEffect(() => {
    // Calculate amount per person when total or number of people changes
    if (totalAmount && numberOfPeople > 0) {
      const amount = parseFloat(totalAmount) / numberOfPeople;
      setAmountPerPerson(amount.toFixed(2));
    }
  }, [totalAmount, numberOfPeople]);

  const handleCreateSplitBill = () => {
    Haptics.selectionAsync();
    
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid total amount');
      return;
    }

    if (numberOfPeople < 2) {
      Alert.alert('Invalid Split', 'Please select at least 2 people to split the bill');
      return;
    }

    // Generate a unique split ID
    const newSplitId = 'split_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    setSplitId(newSplitId);

    Alert.alert(
      'Split Bill Created!',
      `Your split bill has been created successfully!\n\n• Total: GHS ${totalAmount}\n• Split between: ${numberOfPeople} people\n• Amount per person: GHS ${amountPerPerson}\n• Split ID: ${newSplitId}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share Link', onPress: handleShareSplitBill },
        { text: 'View Details', onPress: () => navigation.navigate('SplitBillDetails', { splitId: newSplitId }) }
      ]
    );
  };

  const handleShareSplitBill = async () => {
    try {
      const shareMessage = `Hey! I created a split bill for GHS ${totalAmount}.\n\n• Your share: GHS ${amountPerPerson}\n• Total people: ${numberOfPeople}\n• Description: ${billDescription || 'No description'}\n\nClick here to pay: https://eymwallet.com/split/${splitId}`;
      
      await Share.share({
        message: shareMessage,
        title: 'Split Bill Invitation',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share split bill link');
    }
  };

  const handleContactToggle = (contact) => {
    Haptics.selectionAsync();
    setSelectedContacts(prev => {
      const isSelected = prev.find(c => c.id === contact.id);
      if (isSelected) {
        return prev.filter(c => c.id !== contact.id);
      } else {
        return [...prev, contact];
      }
    });
  };

  const handleNumberChange = (increment) => {
    Haptics.selectionAsync();
    const newNumber = numberOfPeople + increment;
    if (newNumber >= 2 && newNumber <= 10) {
      setNumberOfPeople(newNumber);
    }
  };

  const renderContactItem = (contact) => {
    const isSelected = selectedContacts.find(c => c.id === contact.id);
    
    return (
      <TouchableOpacity
        key={contact.id}
        style={[
          styles.contactItem,
          {
            backgroundColor: isSelected ? Colors.primary : Colors.cardBackground,
            borderColor: isSelected ? Colors.primary : Colors.border,
          }
        ]}
        onPress={() => handleContactToggle(contact)}
        activeOpacity={0.7}
      >
        <View style={styles.contactInfo}>
          <Text style={styles.contactAvatar}>{contact.avatar}</Text>
          <View style={styles.contactDetails}>
            <Text style={[
              styles.contactName,
              { color: isSelected ? Colors.white : Colors.textPrimary }
            ]}>
              {contact.name}
            </Text>
            <Text style={[
              styles.contactPhone,
              { color: isSelected ? Colors.white : Colors.textMuted }
            ]}>
              {contact.phone}
            </Text>
          </View>
        </View>
        <Ionicons
          name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={isSelected ? Colors.white : Colors.textMuted}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Split Bill</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Total Amount Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Total Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>GHS</Text>
              <TextInput
                style={styles.amountInput}
                value={totalAmount}
                onChangeText={setTotalAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          {/* Number of People Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Number of People</Text>
            <View style={styles.peopleSelector}>
              <TouchableOpacity
                style={styles.peopleButton}
                onPress={() => handleNumberChange(-1)}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              
              <View style={styles.peopleCount}>
                <Text style={styles.peopleNumber}>{numberOfPeople}</Text>
                <Text style={styles.peopleLabel}>people</Text>
              </View>
              
              <TouchableOpacity
                style={styles.peopleButton}
                onPress={() => handleNumberChange(1)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.amountPerPerson}>
              <Text style={styles.amountPerPersonLabel}>Amount per person:</Text>
              <Text style={styles.amountPerPersonValue}>GHS {amountPerPerson}</Text>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description (Optional)</Text>
            <TextInput
              style={styles.descriptionInput}
              value={billDescription}
              onChangeText={setBillDescription}
              placeholder="e.g., Dinner at Restaurant, Movie tickets, etc."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Contacts Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Contacts to Invite</Text>
            <Text style={styles.sectionSubtitle}>
              Choose who to invite to this split bill
            </Text>
            
            <View style={styles.contactsList}>
              {mockContacts.map(renderContactItem)}
            </View>
            
            {selectedContacts.length > 0 && (
              <View style={styles.selectedContactsInfo}>
                <Text style={styles.selectedContactsText}>
                  {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
                </Text>
              </View>
            )}
          </View>

          {/* Create Split Bill Button */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateSplitBill}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>Create Split Bill</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: Colors.textMuted,
    marginBottom: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currencySymbol: {
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
    color: Colors.textPrimary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  peopleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  peopleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  peopleCount: {
    alignItems: 'center',
  },
  peopleNumber: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: Colors.textPrimary,
  },
  peopleLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: Colors.textMuted,
    marginTop: 2,
  },
  amountPerPerson: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  amountPerPersonLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: Colors.textMuted,
  },
  amountPerPersonValue: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: Colors.primary,
  },
  descriptionInput: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: Colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  contactsList: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
  },
  selectedContactsInfo: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  selectedContactsText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: Colors.primary,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: Colors.white,
  },
};

export default SplitBillScreen; 