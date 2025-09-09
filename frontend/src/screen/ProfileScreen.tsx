import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { globalStyles } from '../styles';
import { MainTabParamList } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<StackNavigationProp<MainTabParamList & { EditProfile: undefined; ChangePassword: undefined }, any>>();

  // Muestra confirmación antes de cerrar sesión
  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: logout
        },
      ]
    );
  };

  // Navega a la pantalla de cambiar contraseña
  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  // Navega a la pantalla de editar perfil
  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.screenHeader}>
        <Text style={globalStyles.headerTitle}>Mi Perfil</Text>
      </View>
      <View style={globalStyles.profileCard}>
        {/* AVATAR DEL USUARIO */}
        <View style={globalStyles.profileAvatarContainer}>
          <Text style={globalStyles.profileAvatar}>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</Text>
        </View>
        {/* INFORMACIÓN DEL USUARIO */}
        <View style={globalStyles.profileUserInfo}>
          <Text style={globalStyles.profileUserName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={globalStyles.profileUserEmail}>{user?.email}</Text>
          {/* Teléfono y último acceso usando el mismo estilo que el nombre */}
          <Text style={globalStyles.profileUserName}>{user?.phone}</Text>
          <Text style={globalStyles.profileUserName}>Último acceso: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : '-'}</Text>
          {/* ETIQUETA DE ROL DEL USUARIO */}
          <View style={globalStyles.profileRoleContainer}>
            <Text style={globalStyles.profileRoleLabel}>
              {user?.role === 'admin' ? 'Administrador' : 'Coordinador'}
            </Text>
          </View>
        </View>
      </View>
      {/* SECCIÓN DE ACCIONES */}
      <View style={globalStyles.profileActionsSection}>
        <Text style={globalStyles.profileSectionTitle}>Configuración</Text>
        <TouchableOpacity
          style={globalStyles.profileActionItem}
          onPress={handleEditProfile}
        >
          <Text style={globalStyles.profileActionIcon}>✏️</Text>
          <Text style={globalStyles.profileActionText}>Editar Perfil</Text>
          <Text style={globalStyles.profileActionArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={globalStyles.profileActionItem}
          onPress={handleChangePassword}
        >
          <Text style={globalStyles.profileActionIcon}>🔑</Text>
          <Text style={globalStyles.profileActionText}>Cambiar Contraseña</Text>
          <Text style={globalStyles.profileActionArrow}>›</Text>
        </TouchableOpacity>
        <View style={globalStyles.separator} />
        <TouchableOpacity
          style={globalStyles.profileLogoutButton}
          onPress={handleLogout}
        >
          <Text style={globalStyles.profileLogoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
      <View style={globalStyles.profileActionsSection}>
        <Text style={globalStyles.profileSectionTitle}>Información</Text>
        <View style={globalStyles.homeInfoCard}>
          <Text style={globalStyles.homeInfoText}>
            Esta aplicación te permite gestionar el sistema de inventario
            con diferentes niveles de acceso según tu rol.
          </Text>
          <Text style={globalStyles.captionText}>Versión 1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;

