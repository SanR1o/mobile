import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { globalStyles } from '../styles';
import api from '../services/api';
import { ApiResponse } from '../types';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const ChangePasswordScreen: React.FC = () => {
  const { token } = useAuth();
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  React.useEffect(() => {
    setPasswordsMatch(newPassword === confirmPassword);
  }, [newPassword, confirmPassword]);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Todos los campos son obligatorios' });
      return false;
    }
    if (newPassword.length < 6) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return false;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Las contraseñas no coinciden' });
      return false;
    }
    setLoading(true);
    try {
      const res = await api.put<ApiResponse<any>>('/auth/change-password', {
        currentPassword,
        newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        Toast.show({ type: 'success', text1: 'Éxito', text2: 'Contraseña cambiada correctamente' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setLoading(false);
        navigation.navigate('Profile' as never);
        return true;
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: res.data.message || 'No se pudo cambiar la contraseña' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.message || 'Error al cambiar la contraseña' });
    }
    setLoading(false);
    return false;
  };

  return (
    <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <View style={{ width: '100%', alignItems: 'flex-start', marginBottom: 8 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
      </View>
      <Text style={[globalStyles.headerTitle, { textAlign: 'center', marginBottom: 24 }]}>Cambiar Contraseña</Text>
      <View style={{
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        width: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 24
      }}>
        <Text style={{ marginBottom: 8 }}>Contraseña Actual</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              padding: 10,
              backgroundColor: '#f7f7f7'
            }}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrent}
          />
          <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={{ marginLeft: 8 }}>
            <Ionicons name={showCurrent ? 'eye' : 'eye-off'} size={22} color="#888" />
          </TouchableOpacity>
        </View>
        <Text style={{ marginBottom: 8 }}>Nueva Contraseña</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              padding: 10,
              backgroundColor: '#f7f7f7'
            }}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNew}
          />
          <TouchableOpacity onPress={() => setShowNew(!showNew)} style={{ marginLeft: 8 }}>
            <Ionicons name={showNew ? 'eye' : 'eye-off'} size={22} color="#888" />
          </TouchableOpacity>
        </View>
        <Text style={{ marginBottom: 8 }}>Confirmar Nueva Contraseña</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: passwordsMatch ? '#ccc' : '#e53935',
              borderRadius: 8,
              padding: 10,
              backgroundColor: '#f7f7f7'
            }}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={{ marginLeft: 8 }}>
            <Ionicons name={showConfirm ? 'eye' : 'eye-off'} size={22} color="#888" />
          </TouchableOpacity>
        </View>
        {!passwordsMatch && (
          <Text style={{ color: '#e53935', marginBottom: 8 }}>Las contraseñas no coinciden</Text>
        )}
      </View>
      <TouchableOpacity
        style={{
          backgroundColor: '#e53935',
          paddingVertical: 14,
          borderRadius: 8,
          width: '90%',
          alignItems: 'center',
          marginBottom: 8
        }}
        onPress={handleChangePassword}
        disabled={loading || !passwordsMatch}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Cambiar Contraseña</Text>}
      </TouchableOpacity>
    </View>
  );
};

export default ChangePasswordScreen;
