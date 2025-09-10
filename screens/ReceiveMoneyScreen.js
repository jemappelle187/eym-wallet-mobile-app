import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard'; // For copying to clipboard
import { copyWithAutoClear } from '../utils/ClipboardUtils';

const ReceiveMoneyScreen = ({ navigation }) => {
  // Mock user account details
  const userAccountDetails = {
    username: 'User123',
    email: 'user123@sendnreceive.africa',
    uniqueTag: '#SR123XYZ',
    qrCodeData: 'sendnreceive://user/User123/tag/SR123XYZ', // Mock data for QR code
  };

  const copyToClipboard = async (text) => {
    await copyWithAutoClear(text, 30000, () => {
      Alert.alert('Clipboard Cleared', 'Sensitive data has been removed from your clipboard for your security.');
    });
    Alert.alert('Copied!', `${text} has been copied to your clipboard.`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receive Money</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.infoText}>
          Share your details below for others to send you money.
        </Text>

        <View style={styles.detailItem}>
          <Ionicons name="person-circle-outline" size={24} color="#004AAD" style={styles.icon} />
          <View style={styles.textContainer}>
            <Text style={styles.detailLabel}>Username</Text>
            <Text style={styles.detailValue}>{userAccountDetails.username}</Text>
          </View>
          <TouchableOpacity onPress={() => copyToClipboard(userAccountDetails.username)}>
            <Ionicons name="copy-outline" size={24} color="#555" />
          </TouchableOpacity>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="mail-outline" size={24} color="#004AAD" style={styles.icon} />
          <View style={styles.textContainer}>
            <Text style={styles.detailLabel}>Registered Email</Text>
            <Text style={styles.detailValue}>{userAccountDetails.email}</Text>
          </View>
          <TouchableOpacity onPress={() => copyToClipboard(userAccountDetails.email)}>
            <Ionicons name="copy-outline" size={24} color="#555" />
          </TouchableOpacity>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="pricetag-outline" size={24} color="#004AAD" style={styles.icon} />
          <View style={styles.textContainer}>
            <Text style={styles.detailLabel}>Unique Tag</Text>
            <Text style={styles.detailValue}>{userAccountDetails.uniqueTag}</Text>
          </View>
          <TouchableOpacity onPress={() => copyToClipboard(userAccountDetails.uniqueTag)}>
            <Ionicons name="copy-outline" size={24} color="#555" />
          </TouchableOpacity>
        </View>

        {/* Placeholder for QR Code */}
        <View style={styles.qrCodeContainer}>
            <Ionicons name="qr-code-outline" size={150} color="#004AAD" />
            <Text style={styles.qrInfoText}>Share this QR code to receive payments instantly.</Text>
            {/* In a real app, you'd use a library like react-native-qrcode-svg to generate the QR code */}
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  header: {
    backgroundColor: '#004AAD',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 25,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#777',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginTop: 30,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  qrInfoText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginTop: 10,
  }
});

export default ReceiveMoneyScreen; 