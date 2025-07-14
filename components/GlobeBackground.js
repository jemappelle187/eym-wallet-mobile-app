import React from 'react';
import { Image, StyleSheet } from 'react-native';

const GlobeBackground = () => (
  <Image
    source={require('../assets/images/globe.jpg')}
    style={styles.globeBackground}
    resizeMode="contain"
    pointerEvents="none"
  />
);

const styles = StyleSheet.create({
  globeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.13,
    zIndex: 0,
  },
});

export default GlobeBackground; 