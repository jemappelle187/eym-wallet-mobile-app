// Locale-smart money formatting utilities
// P0.3: Locale-smart money everywhere

export const getUserLocale = () => {
  // In a real app, this would come from user preferences or device locale
  // For now, default to 'en-US' but could be 'de-DE', 'fr-FR', etc.
  return 'en-US';
};

export const formatMoney = (value, currency, locale = getUserLocale()) => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch (error) {
    console.error('Money formatting error:', error);
    // Fallback to simple formatting
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${value.toFixed(2)}`;
  }
};

export const parseMoney = (str) => {
  if (!str) return 0;
  
  // Remove all spaces and handle both comma and dot decimal separators
  const cleaned = str.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  return Number(cleaned) || 0;
};

export const getCurrencySymbol = (currency) => {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'GHS': '₵',
    'AED': 'د.إ',
    'NGN': '₦',
    'GBP': '£',
    'JPY': '¥'
  };
  return symbols[currency] || '$';
};

export const formatAmount = (amount, currency, showSymbol = true) => {
  const formatted = formatMoney(amount, currency);
  return showSymbol ? formatted : formatted.replace(getCurrencySymbol(currency), '').trim();
};

// For display in transaction summaries
export const formatTransactionAmount = (amount, currency) => {
  return formatMoney(amount, currency);
};

// For display in fee breakdowns
export const formatFee = (fee, currency) => {
  if (fee === 0) return 'No fees';
  return formatMoney(fee, currency);
};

// For display in totals
export const formatTotal = (total, currency) => {
  return formatMoney(total, currency);
};

// For CTA sub-labels (fee adjacency)
export const formatFeeAdjacency = (fee, total, currency) => {
  if (fee === 0) {
    return `No fees • Total ${formatMoney(total, currency)}`;
  }
  return `Fee ${formatMoney(fee, currency)} • Total ${formatMoney(total, currency)}`;
};

