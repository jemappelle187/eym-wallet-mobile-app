// sendnreceive-app/screens/InviteFriendsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Share,
  Linking,
  Image,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard'; // Using expo-clipboard
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useNavigation } from '@react-navigation/native';

const INVITE_LINK = "https://sendnreceive.app/join?ref=USER123"; // Mock invite link
const INVITE_MESSAGE_WHATSAPP = `Join me on SendNReceive! Send money to Ghana for free — no fees, no delay. Use my link: ${INVITE_LINK}`;

const InviteFriendsScreen = () => {
  const navigation = useNavigation();

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(INVITE_LINK);
    Alert.alert("Link Copied!", "Your invite link has been copied to the clipboard.");
  };

  const shareViaWhatsApp = async () => {
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(INVITE_MESSAGE_WHATSAPP)}`;
    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert("WhatsApp Not Installed", "Please install WhatsApp to share the invite.");
      }
    } catch (error) {
      Alert.alert("Error", "Could not open WhatsApp.");
    }
  };

  // Alternative share using React Native's Share API for more options
  const onShareGeneric = async () => {
    try {
      const result = await Share.share({
        message: `Join me on SendNReceive! Send money to Ghana for free — no fees, no delay. Use my link: ${INVITE_LINK}`,
        url: INVITE_LINK, // for iOS
        title: 'Invite friends to SendNReceive' // for Android share dialog title
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      Alert.alert("Error", "Unable to share your invite link. Please try again.");
    }
  };


  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={Typography.h2}>Invite Friends</Text>
        <View style={{width: 40}} /> {/* Spacer */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.content}>
          {/* Human-centered visual placeholder */}
          <View style={styles.visualPlaceholder}>
            {/* Option 1: Icon (simple) */}
            <Ionicons name="people-circle-outline" size={100} color={Colors.brandPurple} />
            {/* Option 2: Image (if you have one) */}
            {/* <Image source={require('../assets/images/invite_friends_visual.png')} style={styles.imageVisual} /> */}
          </View>

          <Text style={styles.title}>Invite & Earn (or just share the love!)</Text>
          <Text style={styles.description}>
            Invite friends to join SendNReceive and send money to Ghana for free — no fees, no delay.
          </Text>

          <View style={styles.inviteCodeContainer}>
            <Text style={styles.inviteCodeLabel}>Your Invite Link:</Text>
            <View style={styles.linkBox}>
                <Text style={styles.inviteLinkText} numberOfLines={1}>{INVITE_LINK}</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.button, styles.copyButton]} onPress={copyToClipboard}>
            <Ionicons name="copy-outline" size={20} color={Colors.textOnPrimaryCTA} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Copy Link</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.whatsappButton]} onPress={shareViaWhatsApp}>
            <Ionicons name="logo-whatsapp" size={22} color={Colors.textOnPrimaryCTA} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Share via WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.moreOptionsButton]} onPress={onShareGeneric}>
            <Ionicons name="share-social-outline" size={20} color={Colors.brandPurple} style={styles.buttonIcon} />
            <Text style={[styles.buttonText, {color: Colors.brandPurple}]}>More Share Options</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'android' ? 15 : 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 5,
  },
  scrollContentContainer: {
    flexGrow: 1, // Ensure content can fill screen and also scroll if needed
    justifyContent: 'center', // Center content vertically if it's short
    paddingHorizontal: 25,
    paddingBottom: 20,
  },
  content: {
    alignItems: 'center', // Center content horizontally
  },
  visualPlaceholder: {
    marginBottom: 30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.softAccent1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageVisual: { // If using an image
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  inviteCodeContainer: {
    width: '100%',
    marginBottom: 25,
    alignItems: 'center',
  },
  inviteCodeLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  linkBox: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    alignItems: 'center',
  },
  inviteLinkText: {
    ...Typography.bodyRegular,
    color: Colors.brandPurple,
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    marginBottom: 15,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    ...Typography.button,
    fontSize: 16,
  },
  copyButton: {
    backgroundColor: Colors.brandPurple,
  },
  whatsappButton: {
    backgroundColor: '#25D366', // WhatsApp green
  },
  moreOptionsButton: {
      backgroundColor: Colors.cardBackground,
      borderWidth: 1,
      borderColor: Colors.brandPurple,
  }
});

export default InviteFriendsScreen;
