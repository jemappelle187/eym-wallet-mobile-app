export const getUserLocale = (language: string) => {
  if (language === 'fr') return 'fr-FR';
  if (language === 'de') return 'de-DE';
  return 'en-US';
};

export const fmtMoney = (value: number, currency: string, locale = 'en-US') => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '';
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const parseMoney = (s: string) => {
  if (!s) return 0;
  const cleaned = s.replace(/\s/g, '').replace(/[^0-9.,]/g, '');
  const lastCommaIndex = cleaned.lastIndexOf(',');
  const lastDotIndex = cleaned.lastIndexOf('.');

  if (lastCommaIndex > lastDotIndex) {
    return Number(cleaned.replace(/\./g, '').replace(',', '.'));
  } else {
    return Number(cleaned.replace(/,/g, ''));
  }
};

export const formatFeeAdjacency = (fee: number, total: number, currency: string, locale = 'en-US') => {
  const formattedFee = fmtMoney(fee, currency, locale);
  const formattedTotal = fmtMoney(total, currency, locale);
  if (fee === 0) {
    return `No fees • Total ${formattedTotal}`;
  }
  return `Fee ${formattedFee} • Total ${formattedTotal}`;
};
