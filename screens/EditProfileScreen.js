import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import PrimaryButton from '../components/PrimaryButton';
import PremiumToast from '../components/PremiumToast';
import CountryPicker from 'react-native-country-picker-modal';

const TAX_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'DE', name: 'Germany' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  // ...add more as needed
];

const FloatingLabelInput = ({ label, value, onChangeText, style, inputStyle, multiline, keyboardType, editable = true, required, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const labelAnim = useState(new Animated.Value(value ? 1 : 0))[0];

  React.useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFocused || value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: 'absolute',
    left: 16,
    top: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 2],
    }),
    fontSize: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: isFocused ? Colors.primary : Colors.textMuted,
    fontFamily: 'Montserrat-Medium',
    backgroundColor: 'transparent',
    paddingHorizontal: 2,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  };

  return (
    <View style={[styles.inputWrapper, style]}>
      <Animated.Text style={labelStyle}>
        {label}
        {required ? <Text style={{ color: '#ef4444', fontSize: 14 }}> *</Text> : null}
      </Animated.Text>
      <TextInput
        style={[
          styles.input,
          inputStyle,
          {
            borderColor: isFocused ? Colors.primary : Colors.border,
            fontFamily: 'Montserrat-Medium',
            minHeight: multiline ? 64 : 48,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        multiline={multiline}
        keyboardType={keyboardType}
        editable={editable}
        {...props}
      />
    </View>
  );
};

// Utility to convert country code to emoji flag
function countryCodeToEmoji(cca2) {
  return cca2
    .toUpperCase()
    .replace(/./g, char =>
      String.fromCodePoint(127397 + char.charCodeAt())
    );
}

const sanitizeTag = name => {
  if (!name) return '';
  return (
    '@' + name
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, '')
  );
};

const EditProfileScreen = ({ navigation }) => {
  // Simulated user data (replace with context or props as needed)
  const [fullName, setFullName] = useState('');
  const [personalTag, setPersonalTag] = useState('');
  const [personalTagManuallyEdited, setPersonalTagManuallyEdited] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxCountry, setTaxCountry] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState('success');
  const [toastMsg, setToastMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [taxCountryName, setTaxCountryName] = useState('');
  const [taxCountryFlag, setTaxCountryFlag] = useState('');

  const handleSave = () => {
    // Validation
    if (!fullName || !personalTag || !phone || !email || !address || (taxCountry && !taxNumber)) {
      setToastType('error');
      setToastMsg('Please fill in all required fields.');
      setShowToast(true);
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setToastType('success');
      setToastMsg('Profile updated successfully!');
      setShowToast(true);
      // navigation.goBack(); // Uncomment to auto-return
    }, 1200);
  };

  // Auto-generate personal tag when full name changes, unless user has manually edited
  const handleFullNameChange = (name) => {
    setFullName(name);
    if (!personalTagManuallyEdited || !personalTag) {
      setPersonalTag(sanitizeTag(name));
    }
  };
  const handlePersonalTagChange = (tag) => {
    setPersonalTag(tag);
    setPersonalTagManuallyEdited(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back-outline" size={26} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={{ width: 26 }} />
          </View>

          {/* Profile Photo Placeholder */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={48} color={Colors.primary} />
            </View>
            <TouchableOpacity>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <FloatingLabelInput label="Full Name" value={fullName} onChangeText={handleFullNameChange} autoCapitalize="words" required />
          <FloatingLabelInput label="Personal Tag" value={personalTag} onChangeText={handlePersonalTagChange} autoCapitalize="none" />
          <FloatingLabelInput label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" required />
          <FloatingLabelInput label="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" required />
          <FloatingLabelInput label="Address" value={address} onChangeText={setAddress} multiline required />

          {/* Tax Residency Dropdown with Country Picker */}
          <View style={styles.inputWrapper}>
            <TouchableOpacity
              style={[styles.dropdown, { borderColor: taxCountry ? Colors.primary : Colors.border }]}
              onPress={() => setShowCountryPicker(true)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {taxCountryFlag ? <Text style={{ fontSize: 20, marginRight: 8 }}>{taxCountryFlag}</Text> : null}
                <Text style={{ color: taxCountry ? Colors.text : Colors.textMuted, fontFamily: 'Montserrat-Medium' }}>
                  {taxCountryName || 'Select Country'}
                </Text>
              </View>
              <Ionicons name="chevron-down-outline" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Tax Residency Number (conditional) */}
          {taxCountry ? (
            <FloatingLabelInput
              label="Tax Residency Number"
              value={taxNumber}
              onChangeText={setTaxNumber}
              autoCapitalize="characters"
              required
            />
          ) : null}

          {/* Save Button */}
          <PrimaryButton
            title={saving ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            disabled={saving}
            style={{ marginTop: 24 }}
          />
        </ScrollView>
        <PremiumToast
          visible={showToast}
          type={toastType}
          message={toastMsg}
          onHide={() => setShowToast(false)}
        />
      </KeyboardAvoidingView>
      
      {/* CountryPicker rendered at root level to prevent layout issues */}
      {showCountryPicker && (
        <CountryPicker
          visible={true}
          withFilter
          withFlag
          withAlphaFilter
          withCallingCode={false}
          withEmoji
          onSelect={country => {
            let name = typeof country.name === 'string'
              ? country.name
              : (country.name?.common || country.name?.en || Object.values(country.name)[0] || '');
            // Convert cca2 to emoji flag
            let flag = countryCodeToEmoji(country.cca2);
            setTaxCountry(country.cca2);
            setTaxCountryName(name);
            setTaxCountryFlag(flag);
            setShowCountryPicker(false);
          }}
          onClose={() => setShowCountryPicker(false)}
          countryCode={taxCountry || undefined}
          theme={{
            fontFamily: 'Montserrat-Medium',
            backgroundColor: Colors.cardBackground,
            onBackgroundTextColor: Colors.text,
            filterPlaceholderTextColor: Colors.textMuted,
            itemBackgroundColor: Colors.background,
            primaryColor: Colors.primary,
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: 'Montserrat-SemiBold',
    color: Colors.primary,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 8,
  },
  changePhotoText: {
    color: Colors.primary,
    fontFamily: 'Montserrat-Medium',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  inputWrapper: {
    marginBottom: 18,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.cardBackground,
  },
  dropdownLabel: {
    position: 'absolute',
    left: 16,
    top: 2,
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'Montserrat-Medium',
    zIndex: 2,
    backgroundColor: 'transparent',
    paddingHorizontal: 2,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.cardBackground,
    marginTop: 14,
    justifyContent: 'space-between',
  },
});

export default EditProfileScreen; 