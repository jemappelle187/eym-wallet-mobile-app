// AlertUtils.js - Custom alert utility to replace native Alert.alert
// This ensures alerts appear at the top of the screen instead of the bottom

let showCustomAlert = null;

export const setAlertHandler = (handler) => {
  showCustomAlert = handler;
};

export const customAlert = (title, message, buttons = [], options = {}) => {
  if (showCustomAlert) {
    showCustomAlert({
      visible: true,
      isAlert: true,
      alertTitle: title,
      message: message,
      alertButtons: buttons.map(button => ({
        text: button.text,
        style: button.style,
        onPress: button.onPress,
      })),
      type: options.type || 'info',
    });
  } else {
    // Fallback to native alert if custom handler is not set
    const { Alert } = require('react-native');
    Alert.alert(title, message, buttons, options);
  }
};

// Convenience methods for common alert types
export const showSuccessAlert = (title, message, buttons = []) => {
  customAlert(title, message, buttons, { type: 'success' });
};

export const showErrorAlert = (title, message, buttons = []) => {
  customAlert(title, message, buttons, { type: 'error' });
};

export const showWarningAlert = (title, message, buttons = []) => {
  customAlert(title, message, buttons, { type: 'warning' });
};

export const showInfoAlert = (title, message, buttons = []) => {
  customAlert(title, message, buttons, { type: 'info' });
};

// Common alert patterns
export const showConfirmationAlert = (title, message, onConfirm, onCancel) => {
  customAlert(title, message, [
    {
      text: 'Cancel',
      style: 'cancel',
      onPress: onCancel,
    },
    {
      text: 'Confirm',
      style: 'default',
      onPress: onConfirm,
    },
  ]);
};

export const showDeleteConfirmationAlert = (title, message, onDelete, onCancel) => {
  customAlert(title, message, [
    {
      text: 'Cancel',
      style: 'cancel',
      onPress: onCancel,
    },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: onDelete,
    },
  ], { type: 'warning' });
}; 