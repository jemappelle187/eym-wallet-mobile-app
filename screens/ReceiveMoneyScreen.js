import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard'; // For copying to clipboard
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

const ReceiveMoneyScreen = ({ navigation }) => {
  // Mock user account details
  const userAccountDetails = {
    username: 'User123',
    email: 'user123@sendnreceive.africa',
    uniqueTag: '#SR123XYZ',
    qrCodeData: 'sendnreceive://user/User123/tag/SR123XYZ', // Mock data for QR code
  };

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied!', `${text} has been copied to your clipboard.`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={28} color={Colors.cardBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receive Money</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.infoText}>
          Share your details below for others to send you money.
        </Text>

        <View style={styles.detailItem}>
          <Ionicons name="person-circle-outline" size={24} color={Colors.primary} style={styles.icon} />
          <View style={styles.textContainer}>
            <Text style={styles.detailLabel}>Username</Text>
            <Text style={styles.detailValue}>{userAccountDetails.username}</Text>
          </View>
          <TouchableOpacity onPress={() => copyToClipboard(userAccountDetails.username)}>
            <Ionicons name="copy-outline" size={24} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="mail-outline" size={24} color={Colors.primary} style={styles.icon} />
          <View style={styles.textContainer}>
            <Text style={styles.detailLabel}>Registered Email</Text>
            <Text style={styles.detailValue}>{userAccountDetails.email}</Text>
          </View>
          <TouchableOpacity onPress={() => copyToClipboard(userAccountDetails.email)}>
            <Ionicons name="copy-outline" size={24} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="pricetag-outline" size={24} color={Colors.primary} style={styles.icon} />
          <View style={styles.textContainer}>
            <Text style={styles.detailLabel}>Unique Tag</Text>
            <Text style={styles.detailValue}>{userAccountDetails.uniqueTag}</Text>
          </View>
          <TouchableOpacity onPress={() => copyToClipboard(userAccountDetails.uniqueTag)}>
            <Ionicons name="copy-outline" size={24} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Placeholder for QR Code */}
        <View style={styles.qrCodeContainer}>
            <Ionicons name="qr-code-outline" size={150} color={Colors.primary} />
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
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    ...Typography.subHeader,
    color: Colors.cardBackground,
    fontSize: 20,
  },
  content: {
    padding: 16,
  },
  infoText: {
    ...Typography.bodyText,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    marginRight: 12,
    color: Colors.primary,
  },
  textContainer: {
    flex: 1,
  },
  detailLabel: {
    ...Typography.smallText,
    color: Colors.textMuted,
  },
  detailValue: {
    ...Typography.bodyText,
    color: Colors.text,
    fontWeight: '600',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginTop: 32,
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
  },
  qrInfoText: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  }
});

export default ReceiveMoneyScreen;
