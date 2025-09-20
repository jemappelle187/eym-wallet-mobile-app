// sendnreceive-app/constants/Typography.js
import { StyleSheet } from 'react-native';
import { Colors } from './Colors';

// All text styles use Montserrat font family for consistency
export const Typography = StyleSheet.create({
  // Headings
  header: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subHeader: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  // Body
  bodyText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    color: Colors.text,
  },
  // Small text, captions, sublabels
  smallText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 13,
    color: Colors.textMuted,
  },
  caption: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: Colors.textMuted,
  },
  // Balances
  mainBalance: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.text,
  },
  secondaryBalance: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    color: Colors.textMuted,
  },
  // Button text
  buttonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 18,
    fontWeight: '600',
    color: Colors.cardBackground,
  },
  // Link text
  link: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  // Promo/special
  promoTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.indigo,
  },
  promoDescription: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },
});
