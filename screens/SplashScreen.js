import React from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Platform } from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/SENDNRECEIVE_LOGO_3STAR.PNG')}
        style={styles.logo}
      />
      <Text style={styles.appName}>SendNReceive</Text>
      <ActivityIndicator
        size={Platform.OS === 'ios' ? 'large' : 40}
        color={Colors.cardBackground}
        style={styles.activityIndicator}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  appName: {
    ...Typography.header,
    color: Colors.cardBackground,
    fontSize: 32,
    marginBottom: 30,
  },
  activityIndicator: {
    marginTop: 20,
  }
});

export default SplashScreen;
