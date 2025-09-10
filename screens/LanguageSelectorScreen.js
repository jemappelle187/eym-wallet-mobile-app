import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import * as Haptics from 'expo-haptics';

const LanguageSelectorScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { currentLanguage, changeLanguage, getCurrentLanguageInfo, getSupportedLanguages, t } = useLanguage();
  const [isChanging, setIsChanging] = useState(false);

  const currentLanguageInfo = getCurrentLanguageInfo();
  const supportedLanguages = getSupportedLanguages();

  const handleLanguageSelect = async (languageCode) => {
    if (languageCode === currentLanguage) {
      return; // Already selected
    }

    setIsChanging(true);
    Haptics.selectionAsync();

    try {
      const success = await changeLanguage(languageCode);
      
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        Alert.alert(
          t('success'),
          t('languageChanged'),
          [
            {
              text: t('ok'),
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          t('error'),
          'Failed to change language. Please try again.',
          [{ text: t('ok') }]
        );
      }
    } catch (error) {
      console.log('Error changing language:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        t('error'),
        'An error occurred while changing the language.',
        [{ text: t('ok') }]
      );
    } finally {
      setIsChanging(false);
    }
  };

  const renderLanguageItem = (language) => {
    const isSelected = language.code === currentLanguage;
    
    return (
      <TouchableOpacity
        key={language.code}
        style={[
          styles.languageItem,
          {
            backgroundColor: isSelected ? colors.primary + '20' : colors.cardBackground,
            borderColor: isSelected ? colors.primary : colors.border,
          }
        ]}
        onPress={() => handleLanguageSelect(language.code)}
        disabled={isChanging}
        activeOpacity={0.7}
      >
        <View style={styles.languageInfo}>
          <Text style={styles.languageFlag}>{language.flag}</Text>
          <View style={styles.languageTextContainer}>
            <Text style={[styles.languageName, { color: colors.textPrimary }]}>
              {language.name}
            </Text>
            <Text style={[styles.languageNativeName, { color: colors.textSecondary }]}>
              {language.nativeName}
            </Text>
          </View>
        </View>
        
        {isSelected && (
          <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={16} color={colors.white} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {t('selectLanguage')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Language Card */}
        <View style={[styles.currentLanguageCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.currentLanguageHeader}>
            <Ionicons name="language" size={24} color={colors.primary} />
            <Text style={[styles.currentLanguageTitle, { color: colors.textPrimary }]}>
              {t('currentLanguage')}
            </Text>
          </View>
          
          <View style={styles.currentLanguageInfo}>
            <Text style={styles.currentLanguageFlag}>{currentLanguageInfo.flag}</Text>
            <View style={styles.currentLanguageTextContainer}>
              <Text style={[styles.currentLanguageName, { color: colors.textPrimary }]}>
                {currentLanguageInfo.name}
              </Text>
              <Text style={[styles.currentLanguageNativeName, { color: colors.textSecondary }]}>
                {currentLanguageInfo.nativeName}
              </Text>
            </View>
          </View>
        </View>

        {/* Language Options */}
        <View style={styles.languagesSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Available Languages
          </Text>
          
          <View style={styles.languagesList}>
            {supportedLanguages.map(renderLanguageItem)}
          </View>
        </View>

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {t('restartRequired')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  currentLanguageCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  currentLanguageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentLanguageTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    marginLeft: 12,
  },
  currentLanguageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentLanguageFlag: {
    fontSize: 32,
    marginRight: 16,
  },
  currentLanguageTextContainer: {
    flex: 1,
  },
  currentLanguageName: {
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    marginBottom: 4,
  },
  currentLanguageNativeName: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
  },
  languagesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    marginBottom: 16,
  },
  languagesList: {
    gap: 12,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    marginBottom: 2,
  },
  languageNativeName: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    flex: 1,
  },
});

export default LanguageSelectorScreen;


