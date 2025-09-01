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
import { Picker } from '@react-native-picker/picker'
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
                            const errorMessage = error.message || '';
                            if (errorMessage.includes('products associated') || 
                                errorMessage.toLowerCase().includes('productos asociados') ||
                                errorMessage.toLowerCase().includes('tiene productos asociados')) {
                                Alert.alert(
                                    "Error", "No se puede eliminar una subcategoría con productos asociados. Elimine o reasigne los productos asociados a esta subcategoría.",
                                    [{ text: "Entendido", style: "default" }]
                                );
                            } else {
                                Alert.alert("Error", errorMessage || "Ocurrió un error al eliminar la subcategoría.");
                            }
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

    const getCategoryName = (categoryId: string) => {
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.name : 'Sin categoría';
    }

    // Renderizar cada subcategoría
    const SubcategoryCard: React.FC<{ subcategory: Subcategory }> = ({ subcategory }) => {
        const categoryName = getCategoryName(subcategory.categoryId);
        return (
                    <View style={[
                        componentStyles.baseCard,
                        !subcategory.isActive && componentStyles.cardInactive
                    ]}>
                        <View style={componentStyles.cardHeader}>
                            <View style={componentStyles.cardInfo}>
                                <View style={componentStyles.titleRow}>
                                    <Text style={[
                                        componentStyles.cardTitle,
                                        !subcategory.isActive && componentStyles.cardInactive
                                    ]}>
                                        {subcategory.name}
                                    </Text>
                                    <Text style={[
                                        componentStyles.statusBadge, subcategory.isActive ? 
                                        componentStyles.statusBadgeActive : 
                                        componentStyles.statusBadgeInactive
                                    ]}>
                                        {subcategory.isActive ? 'Activo' : 'Inactivo'}
                                    </Text>
                                </View>
                            </View>
                            {subcategory.description && (
                                <Text style={[
                                    componentStyles.cardDescription,
                                    !subcategory.isActive && componentStyles.cardDescriptionInactive
                                ]}>
                                    {subcategory.description}
                                </Text>
                            )}
                            <Text style={componentStyles.cardDate}>
                                Creado: {new Date(subcategory.createdAt).toLocaleDateString()}
                            </Text>
                            <View style={componentStyles.cardActions}>
                                <TouchableOpacity
                                    style={componentStyles.actionButton}
                                    onPress={() => handleToggleStatus(subcategory)}
                                    accessibilityLabel={subcategory.isActive ? 'Desactivar subcategoría' : 'Activar subcategoría'}
                                >
                                    <Text style={[
                                        componentStyles.toggleButton,
                                        !subcategory.isActive ? componentStyles.toggleButtonActive : componentStyles.toggleButtonInactive
                                    ]}>
                                        {subcategory.isActive ? 'Desactivar' : 'Activar'}
                                    </Text>
                                </TouchableOpacity>
                                {canEdit() && (
                                    <TouchableOpacity
                                        style={[componentStyles.actionButton, componentStyles.editButton, { marginLeft: 8 }]}
                                        onPress={() => openEditModal(subcategory)}
                                        accessibilityLabel="Editar subcategoría"
                                    >
                                        <Ionicons name="create" size={18} color="white" />
                                    </TouchableOpacity>
                                )}
                                {canDelete() && (
                                    <TouchableOpacity
                                        style={[componentStyles.actionButton, componentStyles.deleteButton, { marginLeft: 8 }]}
                                        onPress={() => handleDelete(subcategory)}
                                        accessibilityLabel="Eliminar subcategoría"
                                    >
                                        <Ionicons name="trash" size={18} color="white" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                );
            };
        
            if (isLoading || isRefreshing) {
                return (
                    <View style={globalStyles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4ECDC4" />
                        <Text style={globalStyles.loadingText}>Cargando subcategorías...</Text>
                    </View>
                );
            }
        
            return (
                <View style={globalStyles.screenContainer}>
                    <View style={globalStyles.screenHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="folder" size={24} color="white" style={{ marginRight: 8 }} />
                            <Text style={globalStyles.headerTitle}>Categorías</Text>
                        </View>
                        {canEdit() && (
                            <TouchableOpacity
                                style={globalStyles.primaryButton}
                                onPress={openCreateModal}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="add" size={24} color="white" style={{ marginRight: 8 }} />
                                    <Text style={globalStyles.headerTitle}>Agregar</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                    <ScrollView
                        style={globalStyles.screenContainer}
                        refreshControl={
                            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={["#4ECDC4"]} />
                        }
                    >
                        {categories.length === 0 ? (
                            <View style={globalStyles.emptyStateContainer}>
                                <Text style={globalStyles.titleText}>Subcategorias</Text>
                                <Text style={globalStyles.emptyTitleText}>No hay subcategorías disponibles.</Text>
                                <Text style={globalStyles.emptySubtitleText}>
                                    {canEdit() ? 'Toca "Agregar" para crear una subcategoría.' : 'No se han creado subcategorías aún.'}
                                </Text>
                            </View>
                        ) : (
                            categories.map((category) => (
                                <SubcategoryCard key={category.id} subcategory={category} />
                            ))
                        )}
                    </ScrollView>
        
                    <Modal
                        visible={isModalVisible}
                        animationType="slide"
                        transparent={false}
                        onRequestClose={closeModal}
                    >
                        <View style={{
                            flex: 1,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: spacing.md
                        }}>
                            <View style={[globalStyles.card, { width: '100%', maxWidth: 400 }]}>
                                <View style={globalStyles.cardHeader}>
                                    <Text style={globalStyles.textTitle}>
                                        {editingSubcategory ? 'Editar Categoría' : 'Nueva Categoría'}
                                    </Text>
                                    <TouchableOpacity 
                                    style={globalStyles.dangerButton}
                                    onPress={closeModal}>
                                        <Text style={globalStyles.dangerButtonText}>X</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={globalStyles.inputContainer}>
                                    <Text style={globalStyles.inputLabel}>
                                        Nombre*
                                    </Text>
                                    <TextInput
                                    style={globalStyles.input}
                                    value={formData.name}
                                    onChangeText={(value) => setFormData({ ...formData, name: value })}
                                    placeholder="Nombre de la subcategoría"
                                    placeholderTextColor={'#999'}
                                    />
                                </View>
                                    <View style={globalStyles.inputContainer}>
                                    <Text style={globalStyles.inputLabel}>
                                        Descripción
                                    </Text>
                                    <TextInput
                                    style={[globalStyles.textInput, {height: 80, textAlignVertical: 'top'}]}
                                    value={formData.description}
                                    onChangeText={(value) => setFormData({ ...formData, description: value })}
                                    placeholder="Descripcion de la subcategoría"
                                    placeholderTextColor={'#999'}
                                    multiline={true}
                                    numberOfLines={3}
                                    />
                                </View>
                                </View>
                                    <View style={globalStyles.inputContainer}>
                                    <Text style={globalStyles.inputLabel}>
                                        Categoría
                                    </Text>
                                    <TextInput
                                    style={[globalStyles.textInput, {height: 80, textAlignVertical: 'top'}]}
                                    value={formData.categoryId}
                                    onChangeText={(value) => setFormData({ ...formData, categoryId: value })}
                                    placeholder="Categoría"
                                    placeholderTextColor={'#999'}
                                    multiline={true}
                                    numberOfLines={3}
                                    />
                                </View>
                                <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16}}>
                                    <TouchableOpacity
                                        style={globalStyles.secondaryButtonText}
                                        onPress={closeModal}
                                        accessibilityLabel="Cancelar"
                                    >
                                        <Text style={globalStyles.secondaryButtonText}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[globalStyles.secondaryButtonText, { marginLeft: 8 }]}
                                        onPress={handleSave}
                                        disabled={isLoading || !formData.name.trim()}
                                        accessibilityLabel={editingSubcategory ? 'Editar categoría' : 'Crear categoría'}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <Text style={globalStyles.primaryButtonText}>
                                                {editingSubcategory ? 'Editar Categoría' : 'Nueva Categoría'}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </View>
            );
};

export default SubcategoriesScreen;