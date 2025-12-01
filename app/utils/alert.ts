import { Alert, Platform } from 'react-native';

export const showAlert = (title: string, message?: string) => {
  if (Platform.OS === 'web') {
    // Use browser alert on web for better compatibility
    try {
      window.alert(title + (message ? '\n\n' + message : ''));
    } catch (e) {
      // fallback to console
      // eslint-disable-next-line no-console
      console.log(title, message);
    }
    return;
  }

  Alert.alert(title, message);
};

export const showConfirm = async (title: string, message?: string): Promise<boolean> => {
  if (Platform.OS === 'web') {
    try {
      return Promise.resolve(window.confirm(title + (message ? '\n\n' + message : '')));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('confirm', title, message);
      return Promise.resolve(false);
    }
  }

  return new Promise<boolean>((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'No', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Sí', onPress: () => resolve(true) },
      ],
      { cancelable: true }
    );
  });
};
