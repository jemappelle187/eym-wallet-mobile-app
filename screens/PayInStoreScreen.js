import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

const { width, height } = Dimensions.get('window');

const PayInStoreScreen = ({ navigation }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);

  const handleScanQrCode = () => {
    setIsScanning(true);
    // Simulate QR code scan and payment
    // In a real app, you would use a library like expo-camera and expo-barcode-scanner
    setTimeout(() => {
      setIsScanning(false);
      setScannedData('merchant://pay?amount=25.50&merchant=MockMerchantXYZ&id=12345');
      Alert.alert(
        'QR Code Detected',
        'Merchant: Mock Merchant XYZ\nAmount: $25.50\n\nWould you like to proceed with payment?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Pay Now',
            onPress: () => {
              Alert.alert(
                'Payment Successful',
                'Paid $25.50 to Mock Merchant XYZ.\n\nTransaction ID: TXN123456789',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  }
                ]
              );
            },
          },
        ]
      );
    }, 2000);
  };

  const resetScan = () => {
    setScannedData(null);
    setIsScanning(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay in Store</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.instructionCard}>
          <Ionicons name="qr-code-outline" size={32} color={Colors.primary} style={styles.instructionIcon} />
          <Text style={styles.instructions}>
            Center the merchant's QR code in the frame below to make a payment
          </Text>
        </View>

        {/* Camera Viewfinder */}
        <View style={styles.cameraContainer}>
          <View style={styles.cameraPlaceholder}>
            {isScanning ? (
              <View style={styles.scanningOverlay}>
                <Ionicons name="scan-outline" size={80} color={Colors.primary} />
                <Text style={styles.scanningText}>Scanning...</Text>
                <View style={styles.scanningIndicator}>
                  <View style={styles.scanningLine} />
                </View>
              </View>
            ) : scannedData ? (
              <View style={styles.scannedOverlay}>
                <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
                <Text style={styles.scannedText}>QR Code Detected!</Text>
                <Text style={styles.scannedDataText} numberOfLines={2}>
                  {scannedData}
                </Text>
              </View>
            ) : (
              <View style={styles.cameraPlaceholder}>
                <Ionicons name="camera-outline" size={80} color={Colors.primary} />
                <Text style={styles.cameraPlaceholderText}>Camera Ready</Text>
              </View>
            )}
            
            {/* Corner Brackets */}
            <View style={styles.cornerBrackets}>
              <View style={[styles.bracket, styles.topLeft]} />
              <View style={[styles.bracket, styles.topRight]} />
              <View style={[styles.bracket, styles.bottomLeft]} />
              <View style={[styles.bracket, styles.bottomRight]} />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!isScanning && !scannedData && (
            <TouchableOpacity style={styles.scanButton} onPress={handleScanQrCode}>
              <Ionicons name="camera" size={24} color={Colors.textInverse} style={styles.scanButtonIcon} />
              <Text style={styles.scanButtonText}>Scan QR Code</Text>
            </TouchableOpacity>
          )}
          
          {scannedData && (
            <View style={styles.scannedActions}>
              <TouchableOpacity style={styles.rescanButton} onPress={resetScan}>
                <Ionicons name="refresh" size={20} color={Colors.primary} />
                <Text style={styles.rescanButtonText}>Scan Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Help Text */}
        <View style={styles.helpCard}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.textMuted} />
          <Text style={styles.helpText}>
            Ensure you have sufficient balance before scanning. Keep the QR code steady for best results.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textInverse,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  instructionIcon: {
    marginBottom: 12,
  },
  instructions: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontWeight: '500',
  },
  cameraContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  cameraPlaceholder: {
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    position: 'relative',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cameraPlaceholderText: {
    ...Typography.bodyLarge,
    color: Colors.primary,
    marginTop: 12,
    fontWeight: '600',
  },
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderRadius: 18,
  },
  scanningText: {
    ...Typography.bodyLarge,
    color: Colors.primary,
    marginTop: 12,
    fontWeight: '600',
  },
  scanningIndicator: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
  },
  scanningLine: {
    height: 2,
    backgroundColor: Colors.primary,
    width: '100%',
    opacity: 0.8,
  },
  scannedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 18,
  },
  scannedText: {
    ...Typography.bodyLarge,
    color: Colors.success,
    marginTop: 12,
    fontWeight: '600',
  },
  scannedDataText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  cornerBrackets: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  bracket: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Colors.primary,
  },
  topLeft: {
    top: 20,
    left: 20,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 20,
    right: 20,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  actionButtons: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  scanButtonIcon: {
    marginRight: 12,
  },
  scanButtonText: {
    ...Typography.bodyLarge,
    color: Colors.textInverse,
    fontWeight: '700',
  },
  scannedActions: {
    flexDirection: 'row',
    gap: 16,
  },
  rescanButton: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  rescanButtonText: {
    ...Typography.bodyRegular,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  helpCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  helpText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

export default PayInStoreScreen; 