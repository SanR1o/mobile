import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { globalStyles } from '../styles';
import api from '../services/api';
import { ApiResponse } from '../types';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const EditProfileScreen: React.FC = () => {
  const { user, token } = useAuth();
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!firstName || !lastName || !email || !phone) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Todos los campos son obligatorios' });
      return false;
    }
    // Validación de email simple
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'El email no es válido' });
      return false;
    }
    setLoading(true);
    try {
      const res = await api.put<ApiResponse<any>>(`/users/${user?._id}`, {
        firstName,
        lastName,
        email,
        phone,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        Toast.show({ type: 'success', text1: 'Éxito', text2: 'Perfil actualizado correctamente' });
        setLoading(false);
        navigation.navigate('Profile' as never);
        return true;
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: res.data.message || 'No se pudo actualizar el perfil' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.message || 'Error al actualizar el perfil' });
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
      <Text style={[globalStyles.headerTitle, { textAlign: 'center', marginBottom: 24 }]}>Editar Perfil</Text>
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
        <Text style={{ marginBottom: 8 }}>Nombre</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 10,
            marginBottom: 16,
            backgroundColor: '#f7f7f7'
          }}
          value={firstName}
          onChangeText={setFirstName}
        />
        <Text style={{ marginBottom: 8 }}>Apellido</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 10,
            marginBottom: 16,
            backgroundColor: '#f7f7f7'
          }}
          value={lastName}
          onChangeText={setLastName}
        />
        <Text style={{ marginBottom: 8 }}>Email</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 10,
            marginBottom: 16,
            backgroundColor: '#f7f7f7'
          }}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <Text style={{ marginBottom: 8 }}>Teléfono</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 10,
            marginBottom: 16,
            backgroundColor: '#f7f7f7'
          }}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
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
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Guardar Cambios</Text>}
      </TouchableOpacity>
    </View>
  );
};

export default EditProfileScreen;
