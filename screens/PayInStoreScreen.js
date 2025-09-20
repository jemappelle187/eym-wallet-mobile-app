import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

const PayInStoreScreen = ({ navigation }) => {

  const handleScanQrCode = () => {
    // Simulate QR code scan and payment
    // In a real app, you would use a library like expo-camera and expo-barcode-scanner
    Alert.alert(
      'Payment Successful (Mock)',
      'Paid $25.50 to Mock Merchant XYZ.'
    );
    // Optionally navigate back or to a confirmation screen
    // navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={28} color={Colors.cardBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay in Store</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.instructions}>
          Center the merchant's QR code in the frame below to make a payment.
        </Text>

        {/* Camera Viewfinder Placeholder */}
        <View style={styles.cameraPlaceholder}>
          <Ionicons name="scan-outline" size={100} color={Colors.primary} />
          <Text style={styles.cameraPlaceholderText}>Camera View</Text>
          <View style={styles.cornerBrackets}>
            <View style={[styles.bracket, styles.topLeft]} />
            <View style={[styles.bracket, styles.topRight]} />
            <View style={[styles.bracket, styles.bottomLeft]} />
            <View style={[styles.bracket, styles.bottomRight]} />
          </View>
        </View>

        <TouchableOpacity style={styles.scanButton} onPress={handleScanQrCode}>
          <Ionicons name="camera-outline" size={24} color={Colors.cardBackground} style={styles.scanButtonIcon} />
          <Text style={styles.scanButtonText}>Simulate QR Scan & Pay</Text>
        </TouchableOpacity>

        <Text style={styles.helpText}>
            Ensure you have sufficient balance before scanning.
        </Text>
      </View>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  instructions: {
    ...Typography.bodyText,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  cameraPlaceholder: {
    width: 280,
    height: 280,
    backgroundColor: Colors.lightBlue,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: Colors.primary,
    position: 'relative',
  },
  cameraPlaceholderText: {
    marginTop: 10,
    fontSize: 18,
    color: Colors.primary,
  },
  cornerBrackets: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  bracket: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.primary,
  },
  topLeft: {
    top: 8,
    left: 8,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 8,
    right: 8,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 8,
    left: 8,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '80%',
    marginTop: 8,
  },
  scanButtonIcon: {
    marginRight: 10,
  },
  scanButtonText: {
    ...Typography.buttonText,
    color: Colors.cardBackground,
  },
  helpText: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  }
});

export default PayInStoreScreen;
