import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

const PrimaryButton = ({
  title,
  onPress,
  iconLeft,
  iconRight,
  disabled,
  loading,
  style,
  textStyle,
  ...props
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, disabled && styles.buttonDisabled, style]}
      {...props}
    >
      <LinearGradient
        colors={disabled ? [Colors.border, Colors.border] : Colors.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
        {loading ? (
          <ActivityIndicator color={Colors.textInverse} />
        ) : (
          <Text style={[styles.text, textStyle]}>{title}</Text>
        )}
        {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    marginVertical: 8,
    shadowColor: Colors.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  text: {
    ...Typography.button,
    color: Colors.textInverse,
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default PrimaryButton; 