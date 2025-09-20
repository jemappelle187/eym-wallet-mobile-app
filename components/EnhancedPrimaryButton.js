import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';
import { formatFeeAdjacency } from '../utils/moneyFormatting';

const EnhancedPrimaryButton = ({
  title,
  subLabel,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  showFeeAdjacency = false,
  fee = 0,
  total = 0,
  currency = 'USD',
  isMobileMoney = false
}) => {
  const { colors } = useTheme();

  const getButtonTitle = () => {
    if (isMobileMoney) {
      return 'Confirm and Send';
    }
    return 'Confirm Transfer';
  };

  const getSubLabel = () => {
    if (subLabel) return subLabel;
    if (showFeeAdjacency) {
      return formatFeeAdjacency(fee, total, currency);
    }
    return null;
  };

  const buttonContent = (
    <View style={[styles.container, style]}>
      <View style={styles.buttonContent}>
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={[styles.buttonText, textStyle]}>
            {title || getButtonTitle()}
          </Text>
        )}
      </View>
      
      {getSubLabel() && (
        <View style={styles.subLabelContainer}>
          <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
            {getSubLabel()}
          </Text>
        </View>
      )}
    </View>
  );

  if (disabled || loading) {
    return (
      <TouchableOpacity
        style={[styles.disabledButton, { backgroundColor: colors.border }]}
        disabled={true}
        activeOpacity={1}
      >
        {buttonContent}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.touchable}
    >
      <LinearGradient
        colors={[Colors.primary, Colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {buttonContent}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  container: {
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  subLabelContainer: {
    marginTop: 4,
  },
  subLabel: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
  },
  disabledButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
});

export default EnhancedPrimaryButton;









