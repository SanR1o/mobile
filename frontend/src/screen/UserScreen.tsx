import React, { useState, useEffect } from 'react';
import {
  View,           
  Text,           
  ScrollView,     
  TouchableOpacity, 
  Alert,          
  RefreshControl, 
  ActivityIndicator, 
  TextInput,      
  Modal,          
} from 'react-native';
import { useAuth } from '../context/AuthContext';    
import { apiService } from '../services/api';         
import { User } from '../types';                      
import { globalStyles, colors } from '../styles';   


// Define la estructura de datos para crear/editar usuarios
interface UserForm {
  username: string;              
  email: string;                 
  firstName: string;             
  lastName: string;              
  password: string;              
  role: 'admin' | 'coordinador'; 
  phone: string;                 
}

// 👥 COMPONENTE PRINCIPAL DE LA PANTALLA DE USUARIOS
const UsersScreen: React.FC = () => {

  const { hasRole } = useAuth(); 


  const [users, setUsers] = useState<User[]>([]);               
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');           

  const [isLoading, setIsLoading] = useState(true);          
  const [refreshing, setRefreshing] = useState(false);          
  const [modalVisible, setModalVisible] = useState(false); 
  const [editingUser, setEditingUser] = useState<User | null>(null); 


  const [formData, setFormData] = useState<UserForm>({
    username: '',           
    email: '',              
    firstName: '',          
    lastName: '',           
    password: '',           
    role: 'coordinador',    
    phone: '',              
  });

  
  useEffect(() => {
    loadUsers(); 
  }, []);

  
  useEffect(() => {
    filterUsers(); 
  }, [users, searchQuery]);

  

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users); 
      return;
    }

    const filtered = users.filter(user => 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get('/users');
      if (response.success && response.data) {
        setUsers(response.data as User[]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      role: 'coordinador',
      phone: '',
    });
    setEditingUser(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: '', 
      role: user.role,
      phone: user.phone || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      // Validaciones básicas
      if (!formData.username.trim() || !formData.email.trim() || 
          !formData.firstName.trim() || !formData.lastName.trim()) {
        Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
        return;
      }

      if (!editingUser && !formData.password.trim()) {
        Alert.alert('Error', 'La contraseña es obligatoria para nuevos usuarios');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        Alert.alert('Error', 'Por favor ingresa un email válido');
        return;
      }

      setIsLoading(true);

      if (editingUser) {
        // Actualizar usuario existente
        const updateData: any = {
          username: formData.username.trim(),
          email: formData.email.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          role: formData.role,
          phone: formData.phone.trim(),
        };
        if (formData.password.trim()) {
          updateData.password = formData.password;
        }
        const response = await apiService.put(`/users/${editingUser._id}`, updateData);
        if (response.success) {
          setModalVisible(false);
          await loadUsers();
          Alert.alert('Éxito', 'Usuario actualizado correctamente');
        }
      } else {
        // Crear nuevo usuario
        const response = await apiService.post('/users', formData);
        if (response.success) {
          setModalVisible(false);
          await loadUsers();
          Alert.alert('Éxito', 'Usuario creado correctamente');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al guardar usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const action = user.isActive ? 'desactivar' : 'activar';
    Alert.alert(
      'Confirmar acción',
      `¿Estás seguro de que quieres ${action} al usuario ${user.username}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const response = await apiService.put(`/users/${user._id}`, {
                isActive: !user.isActive
              });
              if ((response.data as any).success) {
                Alert.alert('Éxito', `Usuario ${action}do correctamente`);
                await loadUsers();
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || `Error al ${action} usuario`);
            }
          }
        }
      ]
    );
  };

  const handleDelete = async (user: User) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar al usuario ${user.username}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.delete(`/users/${user._id}`);
              if (response.success) {
                Alert.alert('Éxito', 'Usuario eliminado correctamente');
                await loadUsers();
              }
            } catch (error: any) {
              // Solo hacer logging en desarrollo
              if (__DEV__) {
                console.log('Error en eliminación:', error);
              }
              Alert.alert('Error', error.message || 'Error al eliminar usuario');
            }
          }
        }
      ]
    );
  };

  if (!hasRole('admin')) {
    return (
      <View style={globalStyles.usersErrorContainer}>
        <Text style={globalStyles.usersErrorText}>
          ⚠️ Acceso Denegado
        </Text>
        <Text style={globalStyles.usersErrorSubtext}>
          No tienes permisos para gestionar usuarios
        </Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <View style={globalStyles.usersHeader}>
        <Text style={globalStyles.usersTitle}> Gestión de Usuarios</Text>
        <TouchableOpacity 
          style={globalStyles.usersAddButton} 
          onPress={openCreateModal}
        >
          <Text style={globalStyles.usersAddButtonText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={globalStyles.usersSearchContainer}>
        <TextInput
          style={globalStyles.usersSearchInput}
          placeholder="Buscar usuarios..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#6c757d"
        />
      </View>

      {/* Content */}
      <ScrollView 
        style={globalStyles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {isLoading ? (
          <View style={globalStyles.usersLoadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={globalStyles.usersEmptyText}>Cargando usuarios...</Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={globalStyles.usersEmptyContainer}>
            <Text style={globalStyles.usersEmptyText}>
              {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios'}
            </Text>
            <Text style={globalStyles.usersEmptySubtext}>
              {searchQuery 
                ? 'Intenta con diferentes términos de búsqueda'
                : 'Agrega el primer usuario al sistema'
              }
            </Text>
          </View>
        ) : (
          filteredUsers.map((user) => (
            <View key={user._id} style={globalStyles.userCard}>
              <View style={globalStyles.userCardHeader}>
                <Text style={globalStyles.userCardName}>
                  {user.firstName} {user.lastName}
                </Text>
                <View 
                  style={[
                    globalStyles.userCardRole,
                    user.role === 'admin' && globalStyles.userRoleAdmin
                  ]}
                >
                  <Text 
                    style={[
                      globalStyles.userCardRole,
                      user.role === 'admin' && globalStyles.userRoleAdmin
                    ]}
                  >
                    {user.role}
                  </Text>
                </View>
              </View>

              <View style={globalStyles.userCardInfo}>
                <Text style={globalStyles.userCardEmail}>Email: {user.email}</Text>
                <Text style={globalStyles.userCardEmail}> @{user.username}</Text>
                {user.phone && (
                  <Text style={globalStyles.userCardPhone}>Telefono: {user.phone}</Text>
                )}
                <Text 
                  style={[
                    user.isActive ? globalStyles.userStatusActive : globalStyles.userStatusInactive
                  ]}
                >
                  {user.isActive ? 'Activo' : ' Inactivo'}
                </Text>
              </View>

              <View style={globalStyles.userCardActions}>
                <TouchableOpacity 
                  style={[globalStyles.userActionButton, globalStyles.userEditButton]}
                  onPress={() => openEditModal(user)}
                >
                  <Text style={globalStyles.userActionButtonText}>Editar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[globalStyles.userActionButton, globalStyles.userToggleButton]}
                  onPress={() => handleToggleStatus(user)}
                >
                  <Text style={globalStyles.userActionButtonText}>
                    {user.isActive ? 'Desactivar' : 'Activar'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[globalStyles.userActionButton, globalStyles.userDeleteButton]}
                  onPress={() => handleDelete(user)}
                >
                  <Text style={globalStyles.userActionButtonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal para crear/editar usuario */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={globalStyles.usersModalOverlay}>
          <View style={globalStyles.usersModalContent}>
            <Text style={globalStyles.usersModalTitle}>
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={globalStyles.usersFormGroup}>
                <Text style={globalStyles.usersFormLabel}>Nombre de usuario *</Text>
                <TextInput
                  style={globalStyles.usersFormInput}
                  value={formData.username}
                  onChangeText={(text) => setFormData(prev => ({...prev, username: text}))}
                  placeholder="Ej: johndoe"
                  autoCapitalize="none"
                />
              </View>

              <View style={globalStyles.usersFormGroup}>
                <Text style={globalStyles.usersFormLabel}>Email *</Text>
                <TextInput
                  style={globalStyles.usersFormInput}
                  value={formData.email}
                  onChangeText={(text) => setFormData(prev => ({...prev, email: text}))}
                  placeholder="Ej: john@ejemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={globalStyles.usersFormGroup}>
                <Text style={globalStyles.usersFormLabel}>Nombre *</Text>
                <TextInput
                  style={globalStyles.usersFormInput}
                  value={formData.firstName}
                  onChangeText={(text) => setFormData(prev => ({...prev, firstName: text}))}
                  placeholder="Ej: John"
                />
              </View>

              <View style={globalStyles.usersFormGroup}>
                <Text style={globalStyles.usersFormLabel}>Apellido *</Text>
                <TextInput
                  style={globalStyles.usersFormInput}
                  value={formData.lastName}
                  onChangeText={(text) => setFormData(prev => ({...prev, lastName: text}))}
                  placeholder="Ej: Doe"
                />
              </View>

              <View style={globalStyles.usersFormGroup}>
                <Text style={globalStyles.usersFormLabel}>Teléfono</Text>
                <TextInput
                  style={globalStyles.usersFormInput}
                  value={formData.phone}
                  onChangeText={(text) => setFormData(prev => ({...prev, phone: text}))}
                  placeholder="Ej: 3001234567"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={globalStyles.usersFormGroup}>
                <Text style={globalStyles.usersFormLabel}>Rol *</Text>
                <View style={globalStyles.usersFormPickerContainer}>
                  <TouchableOpacity
                    style={globalStyles.usersFormInput}
                    onPress={() => {
                      Alert.alert(
                        'Seleccionar Rol',
                        'Elige el rol para este usuario',
                        [
                          { text: 'Coordinador', onPress: () => setFormData(prev => ({...prev, role: 'coordinador'})) },
                          { text: 'Administrador', onPress: () => setFormData(prev => ({...prev, role: 'admin'})) },
                          { text: 'Cancelar', style: 'cancel' }
                        ]
                      );
                    }}
                  >
                    <Text style={{ color: formData.role ? '#000' : '#6c757d' }}>
                      {formData.role === 'admin' ? 'Administrador' : 'Coordinador'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={globalStyles.usersFormGroup}>
                <Text style={globalStyles.usersFormLabel}>
                  {editingUser ? 'Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
                </Text>
                <TextInput
                  style={globalStyles.usersFormInput}
                  value={formData.password}
                  onChangeText={(text) => setFormData(prev => ({...prev, password: text}))}
                  placeholder="Mínimo 6 caracteres"
                  secureTextEntry
                />
              </View>
            </ScrollView>

            <View style={globalStyles.usersModalActions}>
              <TouchableOpacity 
                style={globalStyles.usersCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={globalStyles.usersCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={globalStyles.usersSaveButton}
                onPress={handleSave}
              >
                <Text style={globalStyles.usersSaveButtonText}>
                  {editingUser ? 'Actualizar' : 'Crear'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default UsersScreen;