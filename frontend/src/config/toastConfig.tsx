import React from 'react';
import { StyleSheet } from 'react-native';
import { BaseToast, ErrorToast } from 'react-native-toast-message';
import type { ToastConfig, BaseToastProps } from 'react-native-toast-message';

const styles = StyleSheet.create({
  success: {
    borderLeftColor: '#4CAF50',
    borderLeftWidth: 5,
  },
  error: {
    borderLeftColor: '#F44336',
    borderLeftWidth: 5,
  },
  content: {
    paddingHorizontal: 15,
  },
  text1: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  text2: {
    fontSize: 14,
    color: '#333',
  },
});

// Toast configuration
export const toastConfig: ToastConfig = {
  success: (props: BaseToastProps) => (
    <BaseToast
      {...props}
      style={styles.success}
      contentContainerStyle={styles.content}
      text1Style={styles.text1}
      text2Style={styles.text2}
    />
  ),
  error: (props: BaseToastProps) => (
    <ErrorToast
      {...props}
      style={styles.error}
      contentContainerStyle={styles.content}
      text1Style={styles.text1}
      text2Style={styles.text2}
    />
  ),
};
