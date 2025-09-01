import React, { useEffect, useState } from "react";
import { 
    View,
    Text,
    Modal,
    TextInput,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from 'react-native-picker/picker'
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { apiService } from '../services/api';
import { Subcategory, Category } from '../types'; 
import { globalStyles, componentStyles, colors, spacing } from "../styles";

const SubcategoriesScreen: React.FC = () => {
    const { canEdit, canDelete } = useAuth();
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
    const [formData, setFormData] = useState({ 
        name: '', 
        description: '',
        categoryId: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    // Cargar subcategorías y categorías
    const loadData = async () => {
        try {
            setIsLoading(true);
            const [subcatRes, catRes] = await Promise.all([
                apiService.get('/subcategories'),
                apiService.get('/categories')
            ]);
            if (subcatRes.success && Array.isArray(subcatRes.data)) {
                setSubcategories(subcatRes.data as Subcategory[]);
            }
            if (catRes.success && Array.isArray(catRes.data)) {
                setCategories(catRes.data as Category[]);
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudieron cargar los datos.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadData();
    };

    const openCreateModal = () => {
        setEditingSubcategory(null);
        setFormData({ name: '', description: '', categoryId: '' });
        setIsModalVisible(true);
    };

    const openEditModal = (subcategory: Subcategory) => {
        setEditingSubcategory(subcategory);
        setFormData({
            name: subcategory.name,
            description: subcategory.description,
            categoryId: subcategory.categoryId
        });
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setEditingSubcategory(null);
        setFormData({ name: '', description: '', categoryId: '' });
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.categoryId) {
            Alert.alert('Error', 'El nombre y la categoría son obligatorios.');
            return;
        }
        try {
            setIsLoading(true);
            let response;
            if (editingSubcategory) {
                response = await apiService.put(`/subcategories/${editingSubcategory.id}`, formData);
            } else {
                response = await apiService.post('/subcategories', formData);
            }
            if (response.success) {
                Alert.alert('Éxito', editingSubcategory ? 'Subcategoría actualizada.' : 'Subcategoría creada.');
                loadData();
                closeModal();
            } else {
                Alert.alert('Error', 'No se pudo guardar la subcategoría.');
            }
        } catch (error) {
            Alert.alert('Error', 'Ocurrió un error al guardar la subcategoría.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (subcategory: Subcategory) => {
        Alert.alert(
            'Confirmar',
            `¿Estás seguro de que deseas eliminar ${subcategory.name}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar', style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            const response = await apiService.delete(`/subcategories/${subcategory.id}`);
                            if (response.success) {
                                Alert.alert('Éxito', 'Subcategoría eliminada.');
                                loadData();
                            } else {
                                Alert.alert('Error', 'No se pudo eliminar la subcategoría.');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleToggleStatus = async (subcategory: Subcategory) => {
        const action = subcategory.isActive ? 'desactivar' : 'activar';
        const warningMessage = subcategory.isActive
            ? 'Desactivar una subcategoría también desactivará todos sus productos asociados.'
            : 'Activar una subcategoría también activará todos sus productos asociados.';

        Alert.alert(
            `${action.charAt(0).toUpperCase() + action.slice(1)} Subcategoría`,
            `¿Estás seguro de que deseas ${action} la subcategoría "${subcategory.name}"?\n\n${warningMessage}`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: action.charAt(0).toUpperCase() + action.slice(1),
                    style: subcategory.isActive ? 'destructive' : 'default',
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            const response = await apiService.patch(`/subcategories/${subcategory.id}/toggle-status`, {});
                            if (response.success) {
                                Alert.alert('Éxito', 'Estado de la subcategoría actualizado.');
                                loadData();
                            } else {
                                Alert.alert('Error', 'No se pudo actualizar el estado de la subcategoría.');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // Renderizar cada subcategoría
    const SubcategoryCard: React.FC<{ subcategory: Subcategory }> = ({ subcategory }) => {
        const category = categories.find(cat => cat.id === subcategory.categoryId);
        return (
            <View style={componentStyles.baseCard}>
                <Text style={componentStyles.cardTitle}>{subcategory.name}</Text>
                <Text style={componentStyles.cardDescription}>{subcategory.description}</Text>
                <Text style={componentStyles.cardMeta}>Categoría: {category ? category.name : 'Sin categoría'}</Text>
                <Text style={componentStyles.statusBadge}>{subcategory.isActive ? 'Activo' : 'Inactivo'}</Text>
                <View style={componentStyles.cardActions}>
                    <TouchableOpacity style={componentStyles.actionButton} onPress={() => handleToggleStatus(subcategory)}>
                        <Text style={componentStyles.toggleButtonText}>
                            {subcategory.isActive ? 'Desactivar' : 'Activar'}
                        </Text>
                    </TouchableOpacity>
                    {canEdit() && (
                        <TouchableOpacity style={componentStyles.actionButton} onPress={() => openEditModal(subcategory)}>
                            <Ionicons name="create" size={18} color="white" />
                        </TouchableOpacity>
                    )}
                    {canDelete() && (
                        <TouchableOpacity style={componentStyles.actionButton} onPress={() => handleDelete(subcategory)}>
                            <Ionicons name="trash" size={18} color="white" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    // Modal para crear/editar subcategoría
    const renderModal = () => (
        <Modal visible={isModalVisible} animationType="slide" transparent>
            <View style={globalStyles.modalContainer}>
                <View style={globalStyles.modalContent}>
                    <Text style={globalStyles.modalTitle}>{editingSubcategory ? 'Editar' : 'Nueva'} Subcategoría</Text>
                    <TextInput
                        style={globalStyles.textInput}
                        placeholder="Nombre"
                        value={formData.name}
                        onChangeText={text => setFormData({ ...formData, name: text })}
                    />
                    <TextInput
                        style={globalStyles.textInput}
                        placeholder="Descripción"
                        value={formData.description}
                        onChangeText={text => setFormData({ ...formData, description: text })}
                    />
                    <Text style={globalStyles.inputLabel}>Categoría</Text>
                    <Picker
                        selectedValue={formData.categoryId}
                        onValueChange={value => setFormData({ ...formData, categoryId: value })}
                        style={globalStyles.picker}
                    >
                        <Picker.Item label="Selecciona una categoría" value="" />
                        {categories.map(cat => (
                            <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                        ))}
                    </Picker>
                    <View style={globalStyles.modalActions}>
                        <TouchableOpacity style={globalStyles.primaryButton} onPress={handleSave}>
                            <Text style={globalStyles.primaryButtonText}>Guardar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={globalStyles.secondaryButton} onPress={closeModal}>
                            <Text style={globalStyles.secondaryButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    if (isLoading) {
        return (
            <View style={globalStyles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={globalStyles.loadingText}>Cargando subcategorías...</Text>
            </View>
        );
    }

    return (
        <View style={globalStyles.screenContainer}>
            <View style={globalStyles.screenHeader}>
                <Text style={globalStyles.headerTitle}>Subcategorías</Text>
                {canEdit() && (
                    <TouchableOpacity style={globalStyles.primaryButton} onPress={openCreateModal}>
                        <Ionicons name="add" size={20} color="white" />
                        <Text style={globalStyles.primaryButtonText}>Agregar</Text>
                    </TouchableOpacity>
                )}
            </View>
            <ScrollView
                style={globalStyles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
                }
            >
                {subcategories.length === 0 ? (
                    <View style={globalStyles.emptyStateContainer}>
                        <Text style={globalStyles.titleText}>No hay subcategorías disponibles.</Text>
                    </View>
                ) : (
                    subcategories.map(subcat => (
                        <SubcategoryCard key={subcat.id} subcategory={subcat} />
                    ))
                )}
            </ScrollView>
            {renderModal()}
        </View>
    );
};

export default SubcategoriesScreen;