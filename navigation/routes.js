// Route name constants to prevent typos and ensure consistency
export const ROUTES = {
  // Bank Transfer Flow
  BANK_AMOUNT: 'BankAmount',
  BANK_CONFIRM: 'BankConfirm',
  BANK_PROCESSING: 'BankProcessing',
  
  // Other common routes
  HOME: 'HomeDashboard',
  DEPOSIT: 'Deposit',
  WITHDRAW: 'Withdraw',
  PROFILE: 'ProfileSettings',
  ACTIVITY: 'Activity',
  
  // Auth routes
  WELCOME: 'Welcome',
  LOGIN: 'Login',
  SIGNUP: 'SignUp',
  PHONE_VERIFICATION: 'PhoneVerification',
  
  // Payment methods
  MOBILE_MONEY: 'MobileMoneyPayment',
  PAYPAL: 'PayPalPayment',
  
  // Modals
  QUICK_SEND: 'QuickSendModal',
  SEND_FLOW: 'SendFlowModal',
  TRANSACTION_SUCCESS: 'TransactionSuccess',
};

export default ROUTES;

