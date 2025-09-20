import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const GlobeBackground = ({ style }) => (
  <View pointerEvents="none" style={[styles.container, style]}>
    <Image
      source={require('../assets/images/sendnreceive_logo.png')} // Use your globe or brand image
      style={styles.image}
      resizeMode="contain"
      blurRadius={1}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  image: {
    width: '80%',
    opacity: 0.08, // Subtle, premium look
  },
});

export default GlobeBackground; 