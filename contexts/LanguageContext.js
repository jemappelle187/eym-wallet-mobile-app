import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create Context
export const LanguageContext = createContext();

// Available languages
export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
  },
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
  },
};

// Translation strings
const TRANSLATIONS = {
  en: {
    // Common
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    done: 'Done',
    back: 'Back',
    next: 'Next',
    skip: 'Skip',
    continue: 'Continue',
    retry: 'Retry',
    close: 'Close',
    ok: 'OK',
    yes: 'Yes',
    no: 'No',
    
    // Navigation
    home: 'Home',
    profile: 'Profile',
    settings: 'Settings',
    transactions: 'Transactions',
    send: 'Send',
    receive: 'Receive',
    withdraw: 'Withdraw',
    deposit: 'Deposit',
    
    // Home Screen
    balance: 'Balance',
    quickActions: 'Quick Actions',
    recentTransactions: 'Recent Transactions',
    viewAll: 'View All',
    sendMoney: 'Send Money',
    receiveMoney: 'Receive Money',
    withdrawFunds: 'Withdraw Funds',
    depositFunds: 'Deposit Funds',
    
    // Send Modal
    sendToUser: 'Send to User',
    addContact: 'Add Contact',
    mobileMoney: 'Mobile Money',
    payInStore: 'Pay in Store',
    bankTransfer: 'Bank Transfer',
    cryptoTransfer: 'Crypto Transfer',
    payBills: 'Pay Bills',
    
    // Receive Modal
    generateInvoice: 'Generate Invoice',
    paymentLink: 'Payment Link',
    qrCode: 'QR Code',
    
    // Profile Settings
    accountSecurity: 'Account & Security',
    paymentCards: 'Payment & Cards',
    servicesUtilities: 'Services & Utilities',
    preferences: 'Preferences',
    supportLegal: 'Support & Legal',
    editProfile: 'Edit Profile',
    twoFactorAuth: 'Two-Factor Authentication',
    faceIdBiometric: 'FaceID / Biometric Login',
    testBiometric: 'Test Biometric',
    virtualCards: 'Virtual Cards',
    transactionLimits: 'Transaction Limits',
    notifications: 'Notifications',
    language: 'Language',
    darkMode: 'Dark Mode',
    buyAirtimeData: 'Buy Airtime & Data',
    billPayments: 'Bill Payments',
    giftCards: 'Gift Cards',
    cryptoServices: 'Crypto Services',
    helpSupport: 'Help & Support',
    contactUs: 'Contact Us',
    inviteFriends: 'Invite Friends',
    learningHub: 'Learning Hub',
    termsOfService: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
    
    // Biometric
    enableFaceId: 'Enable Face ID',
    enableTouchId: 'Enable Touch ID',
    enableBiometric: 'Enable Biometric',
    biometricEnabled: 'Biometric Enabled',
    biometricDisabled: 'Biometric Disabled',
    securityCode: 'Security Code',
    setSecurityCode: 'Set Security Code',
    enterSecurityCode: 'Enter Security Code',
    createSecurityCode: 'Create Security Code',
    confirmSecurityCode: 'Confirm Security Code',
    securityCodeSetup: 'Security Code Setup',
    biometricSetup: 'Biometric Setup',
    biometricTest: 'Biometric Test',
    
    // Airtime & Data
    buyAirtimeDataTitle: 'Buy Airtime & Data',
    serviceType: 'Service Type',
    airtime: 'Airtime',
    dataBundle: 'Data Bundle',
    phoneNumber: 'Phone Number',
    selectNetwork: 'Select Network',
    amount: 'Amount',
    selectDataBundle: 'Select Data Bundle',
    quickAmounts: 'Quick Amounts',
    purchase: 'Purchase',
    purchaseAirtime: 'Purchase Airtime',
    purchaseDataBundle: 'Purchase Data Bundle',
    
    // Transaction History
    transactionHistory: 'Transaction History',
    transactionDetails: 'Transaction Details',
    transactionId: 'Transaction ID',
    date: 'Date',
    time: 'Time',
    status: 'Status',
    amount: 'Amount',
    fee: 'Fee',
    total: 'Total',
    reference: 'Reference',
    description: 'Description',
    recipient: 'Recipient',
    sender: 'Sender',
    
    // Actions
    share: 'Share',
    copy: 'Copy',
    split: 'Split',
    report: 'Report',
    support: 'Support',
    
    // Status
    completed: 'Completed',
    pending: 'Pending',
    failed: 'Failed',
    cancelled: 'Cancelled',
    
    // Messages
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    loading: 'Loading...',
    noData: 'No data available',
    tryAgain: 'Please try again',
    networkError: 'Network error',
    authenticationFailed: 'Authentication failed',
    biometricNotAvailable: 'Biometric not available',
    biometricSetupRequired: 'Biometric setup required',
    
    // Language Selector
    selectLanguage: 'Select Language',
    currentLanguage: 'Current Language',
    languageChanged: 'Language changed successfully',
    restartRequired: 'App restart required for full language change',
  },
  
  es: {
    // Common
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    done: 'Hecho',
    back: 'Atrás',
    next: 'Siguiente',
    skip: 'Omitir',
    continue: 'Continuar',
    retry: 'Reintentar',
    close: 'Cerrar',
    ok: 'OK',
    yes: 'Sí',
    no: 'No',
    
    // Navigation
    home: 'Inicio',
    profile: 'Perfil',
    settings: 'Configuración',
    transactions: 'Transacciones',
    send: 'Enviar',
    receive: 'Recibir',
    withdraw: 'Retirar',
    deposit: 'Depositar',
    
    // Home Screen
    balance: 'Saldo',
    quickActions: 'Acciones Rápidas',
    recentTransactions: 'Transacciones Recientes',
    viewAll: 'Ver Todo',
    sendMoney: 'Enviar Dinero',
    receiveMoney: 'Recibir Dinero',
    withdrawFunds: 'Retirar Fondos',
    depositFunds: 'Depositar Fondos',
    
    // Send Modal
    sendToUser: 'Enviar a Usuario',
    addContact: 'Agregar Contacto',
    mobileMoney: 'Dinero Móvil',
    payInStore: 'Pagar en Tienda',
    bankTransfer: 'Transferencia Bancaria',
    cryptoTransfer: 'Transferencia Crypto',
    payBills: 'Pagar Facturas',
    
    // Receive Modal
    generateInvoice: 'Generar Factura',
    paymentLink: 'Enlace de Pago',
    qrCode: 'Código QR',
    
    // Profile Settings
    accountSecurity: 'Cuenta y Seguridad',
    paymentCards: 'Pagos y Tarjetas',
    servicesUtilities: 'Servicios y Utilidades',
    preferences: 'Preferencias',
    supportLegal: 'Soporte y Legal',
    editProfile: 'Editar Perfil',
    twoFactorAuth: 'Autenticación de Dos Factores',
    faceIdBiometric: 'FaceID / Inicio de Sesión Biométrico',
    testBiometric: 'Probar Biométrico',
    virtualCards: 'Tarjetas Virtuales',
    transactionLimits: 'Límites de Transacción',
    notifications: 'Notificaciones',
    language: 'Idioma',
    darkMode: 'Modo Oscuro',
    buyAirtimeData: 'Comprar Airtime y Datos',
    billPayments: 'Pago de Facturas',
    giftCards: 'Tarjetas de Regalo',
    cryptoServices: 'Servicios Crypto',
    helpSupport: 'Ayuda y Soporte',
    contactUs: 'Contáctanos',
    inviteFriends: 'Invitar Amigos',
    learningHub: 'Centro de Aprendizaje',
    termsOfService: 'Términos de Servicio',
    privacyPolicy: 'Política de Privacidad',
    
    // Biometric
    enableFaceId: 'Habilitar Face ID',
    enableTouchId: 'Habilitar Touch ID',
    enableBiometric: 'Habilitar Biométrico',
    biometricEnabled: 'Biométrico Habilitado',
    biometricDisabled: 'Biométrico Deshabilitado',
    securityCode: 'Código de Seguridad',
    setSecurityCode: 'Establecer Código de Seguridad',
    enterSecurityCode: 'Ingresar Código de Seguridad',
    createSecurityCode: 'Crear Código de Seguridad',
    confirmSecurityCode: 'Confirmar Código de Seguridad',
    securityCodeSetup: 'Configuración de Código de Seguridad',
    biometricSetup: 'Configuración Biométrica',
    biometricTest: 'Prueba Biométrica',
    
    // Airtime & Data
    buyAirtimeDataTitle: 'Comprar Airtime y Datos',
    serviceType: 'Tipo de Servicio',
    airtime: 'Airtime',
    dataBundle: 'Paquete de Datos',
    phoneNumber: 'Número de Teléfono',
    selectNetwork: 'Seleccionar Red',
    amount: 'Cantidad',
    selectDataBundle: 'Seleccionar Paquete de Datos',
    quickAmounts: 'Cantidades Rápidas',
    purchase: 'Comprar',
    purchaseAirtime: 'Comprar Airtime',
    purchaseDataBundle: 'Comprar Paquete de Datos',
    
    // Transaction History
    transactionHistory: 'Historial de Transacciones',
    transactionDetails: 'Detalles de Transacción',
    transactionId: 'ID de Transacción',
    date: 'Fecha',
    time: 'Hora',
    status: 'Estado',
    amount: 'Cantidad',
    fee: 'Tarifa',
    total: 'Total',
    reference: 'Referencia',
    description: 'Descripción',
    recipient: 'Destinatario',
    sender: 'Remitente',
    
    // Actions
    share: 'Compartir',
    copy: 'Copiar',
    split: 'Dividir',
    report: 'Reportar',
    support: 'Soporte',
    
    // Status
    completed: 'Completado',
    pending: 'Pendiente',
    failed: 'Fallido',
    cancelled: 'Cancelado',
    
    // Messages
    success: 'Éxito',
    error: 'Error',
    warning: 'Advertencia',
    info: 'Información',
    loading: 'Cargando...',
    noData: 'No hay datos disponibles',
    tryAgain: 'Por favor inténtalo de nuevo',
    networkError: 'Error de red',
    authenticationFailed: 'Autenticación fallida',
    biometricNotAvailable: 'Biométrico no disponible',
    biometricSetupRequired: 'Configuración biométrica requerida',
    
    // Language Selector
    selectLanguage: 'Seleccionar Idioma',
    currentLanguage: 'Idioma Actual',
    languageChanged: 'Idioma cambiado exitosamente',
    restartRequired: 'Reinicio de la aplicación requerido para el cambio completo de idioma',
  },
  
  fr: {
    // Common
    cancel: 'Annuler',
    confirm: 'Confirmer',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    done: 'Terminé',
    back: 'Retour',
    next: 'Suivant',
    skip: 'Passer',
    continue: 'Continuer',
    retry: 'Réessayer',
    close: 'Fermer',
    ok: 'OK',
    yes: 'Oui',
    no: 'Non',
    
    // Navigation
    home: 'Accueil',
    profile: 'Profil',
    settings: 'Paramètres',
    transactions: 'Transactions',
    send: 'Envoyer',
    receive: 'Recevoir',
    withdraw: 'Retirer',
    deposit: 'Déposer',
    
    // Home Screen
    balance: 'Solde',
    quickActions: 'Actions Rapides',
    recentTransactions: 'Transactions Récentes',
    viewAll: 'Voir Tout',
    sendMoney: 'Envoyer de l\'Argent',
    receiveMoney: 'Recevoir de l\'Argent',
    withdrawFunds: 'Retirer des Fonds',
    depositFunds: 'Déposer des Fonds',
    
    // Send Modal
    sendToUser: 'Envoyer à l\'Utilisateur',
    addContact: 'Ajouter un Contact',
    mobileMoney: 'Argent Mobile',
    payInStore: 'Payer en Magasin',
    bankTransfer: 'Virement Bancaire',
    cryptoTransfer: 'Transfert Crypto',
    payBills: 'Payer les Factures',
    
    // Receive Modal
    generateInvoice: 'Générer une Facture',
    paymentLink: 'Lien de Paiement',
    qrCode: 'Code QR',
    
    // Profile Settings
    accountSecurity: 'Compte et Sécurité',
    paymentCards: 'Paiements et Cartes',
    servicesUtilities: 'Services et Utilitaires',
    preferences: 'Préférences',
    supportLegal: 'Support et Légal',
    editProfile: 'Modifier le Profil',
    twoFactorAuth: 'Authentification à Deux Facteurs',
    faceIdBiometric: 'FaceID / Connexion Biométrique',
    testBiometric: 'Tester Biométrique',
    virtualCards: 'Cartes Virtuelles',
    transactionLimits: 'Limites de Transaction',
    notifications: 'Notifications',
    language: 'Langue',
    darkMode: 'Mode Sombre',
    buyAirtimeData: 'Acheter Crédit et Données',
    billPayments: 'Paiement de Factures',
    giftCards: 'Cartes Cadeaux',
    cryptoServices: 'Services Crypto',
    helpSupport: 'Aide et Support',
    contactUs: 'Nous Contacter',
    inviteFriends: 'Inviter des Amis',
    learningHub: 'Centre d\'Apprentissage',
    termsOfService: 'Conditions de Service',
    privacyPolicy: 'Politique de Confidentialité',
    
    // Biometric
    enableFaceId: 'Activer Face ID',
    enableTouchId: 'Activer Touch ID',
    enableBiometric: 'Activer Biométrique',
    biometricEnabled: 'Biométrique Activé',
    biometricDisabled: 'Biométrique Désactivé',
    securityCode: 'Code de Sécurité',
    setSecurityCode: 'Définir le Code de Sécurité',
    enterSecurityCode: 'Entrer le Code de Sécurité',
    createSecurityCode: 'Créer le Code de Sécurité',
    confirmSecurityCode: 'Confirmer le Code de Sécurité',
    securityCodeSetup: 'Configuration du Code de Sécurité',
    biometricSetup: 'Configuration Biométrique',
    biometricTest: 'Test Biométrique',
    
    // Airtime & Data
    buyAirtimeDataTitle: 'Acheter Crédit et Données',
    serviceType: 'Type de Service',
    airtime: 'Crédit',
    dataBundle: 'Forfait Données',
    phoneNumber: 'Numéro de Téléphone',
    selectNetwork: 'Sélectionner le Réseau',
    amount: 'Montant',
    selectDataBundle: 'Sélectionner le Forfait Données',
    quickAmounts: 'Montants Rapides',
    purchase: 'Acheter',
    purchaseAirtime: 'Acheter du Crédit',
    purchaseDataBundle: 'Acheter un Forfait Données',
    
    // Transaction History
    transactionHistory: 'Historique des Transactions',
    transactionDetails: 'Détails de la Transaction',
    transactionId: 'ID de Transaction',
    date: 'Date',
    time: 'Heure',
    status: 'Statut',
    amount: 'Montant',
    fee: 'Frais',
    total: 'Total',
    reference: 'Référence',
    description: 'Description',
    recipient: 'Destinataire',
    sender: 'Expéditeur',
    
    // Actions
    share: 'Partager',
    copy: 'Copier',
    split: 'Diviser',
    report: 'Signaler',
    support: 'Support',
    
    // Status
    completed: 'Terminé',
    pending: 'En Attente',
    failed: 'Échoué',
    cancelled: 'Annulé',
    
    // Messages
    success: 'Succès',
    error: 'Erreur',
    warning: 'Avertissement',
    info: 'Information',
    loading: 'Chargement...',
    noData: 'Aucune donnée disponible',
    tryAgain: 'Veuillez réessayer',
    networkError: 'Erreur réseau',
    authenticationFailed: 'Échec de l\'authentification',
    biometricNotAvailable: 'Biométrique non disponible',
    biometricSetupRequired: 'Configuration biométrique requise',
    
    // Language Selector
    selectLanguage: 'Sélectionner la Langue',
    currentLanguage: 'Langue Actuelle',
    languageChanged: 'Langue changée avec succès',
    restartRequired: 'Redémarrage de l\'application requis pour le changement complet de langue',
  },
};

// Create Provider Component
export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language preference
  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage && SUPPORTED_LANGUAGES[savedLanguage]) {
        setCurrentLanguage(savedLanguage);
      }
    } catch (error) {
      console.log('Error loading language preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (languageCode) => {
    if (SUPPORTED_LANGUAGES[languageCode]) {
      try {
        await AsyncStorage.setItem('app_language', languageCode);
        setCurrentLanguage(languageCode);
        return true;
      } catch (error) {
        console.log('Error saving language preference:', error);
        return false;
      }
    }
    return false;
  };

  const t = (key) => {
    const translations = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
    return translations[key] || key;
  };

  const getCurrentLanguageInfo = () => {
    return SUPPORTED_LANGUAGES[currentLanguage] || SUPPORTED_LANGUAGES.en;
  };

  const getSupportedLanguages = () => {
    return Object.values(SUPPORTED_LANGUAGES);
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        t,
        getCurrentLanguageInfo,
        getSupportedLanguages,
        isLoading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};


