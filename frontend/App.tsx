import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext'
import AppNavigator from './src/navigation/AppNavigation'
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/config/toastConfig';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="auto" />
        <Toast config={toastConfig} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}