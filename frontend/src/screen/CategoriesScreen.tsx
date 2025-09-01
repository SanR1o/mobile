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
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { apiService } from '../services/api';
import { Category } from '../types'; 
import { globalStyles, componentStyles, colors, spacing } from "../styles";

const CategoriesScreen: React.FC = () => {
    const { canEdit, canDelete } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    //estado del formulario
    const [formData, setFormData] = useState({ 
        name: '', 
        description: '' 
    });

    useEffect(() => {
        loadCategories();
    }, []);

    //funcion para cargar las categorias
    const loadCategories = async () => {
        try {
            setIsLoading(true);
            const response = await apiService.get('/categories');
            if(response.success && response.data && Array.isArray(response.data)) {
                setCategories(response.data as Category[]);
            }
        } catch (error) {
            console.warn("Error en categorias:", error);
            Alert.alert("Error", "No se pudieron cargar las categorías.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadCategories();
    }

    const openCreateModal = () => {
        setEditingCategory(null);
        setFormData({ 
            name: '', 
            description: '' 
        });
        setIsModalVisible(true);
    }

    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        setFormData({ 
            name: category.name, 
            description: category.description
        });
        setIsModalVisible(true);
    }

    const closeModal = () => {
        setIsModalVisible(false);
        setEditingCategory(null);
        setFormData({ 
            name: '', 
            description: '' 
        });
    }

    const handleSave = async () => {
        if (!formData.name.trim()) {
            Alert.alert("Error", "El nombre es obligatorio.");
            return;
        }

        try {
            setIsLoading(true);
            if (editingCategory) {
                // Actualizar categoría existente
                const response = await apiService.put(`/categories/${editingCategory.id}`, formData);
                if (response.success) {
                    Alert.alert("Éxito", "Categoría actualizada.");
                    loadCategories();
                    closeModal();
                } else {
                    Alert.alert("Error", "No se pudo actualizar la categoría.");
                }
            } else {
                // Crear nueva categoría
                const response = await apiService.post('/categories', formData);
                if (response.success) {
                    Alert.alert("Éxito", "Categoría creada.");
                    loadCategories();
                    closeModal();
                } else {
                    Alert.alert("Error", "No se pudo crear la categoría.");
                }
            }
        } catch (error) {
            Alert.alert("Error", "Ocurrió un error al guardar la categoría.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (category: Category) => {
        Alert.alert(
            "Confirmar",
            `¿Estás seguro de que deseas eliminar ${category.name}?`,
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            const response = await apiService.delete(`/categories/${category.id}`);
                            if (response.success) {
                                Alert.alert("Éxito", "Categoría eliminada.");
                                loadCategories();
                            } else {
                                Alert.alert("Error", "No se pudo eliminar la categoría.");
                            }
                        } catch (error: any) {
                            Alert.alert("Error", error.message);
                            //manejo de errores
                            const errorMessage = error.message || '';
                            if (errorMessage.includes('subcategories associated') ||
                                errorMessage.toLowerCase().includes('subcategorías asociadas')) {
                                Alert.alert(
                                    "Error", "No se puede eliminar una categoría con subcategorías asociadas. Elimine o reasigne las subcategorías asociadas a esta categoría.",
                                    [{ text: "Entendido", style: "default" }]
                                );
                            } else {
                                Alert.alert("Error", errorMessage || "Ocurrió un error al eliminar la categoría.");
                            }
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleToggleStatus = async (category: Category) => {
        const action = category.isActive ? 'desactivar' : 'activar';
        const warningMessage = category.isActive
            ? 'Desactivar una categoría también desactivará todas sus subcategorías y productos asociados.'
            : 'Activar una categoría también activará todas sus subcategorías y productos asociados.';

        Alert.alert(
            `${action.charAt(0).toUpperCase() + action.slice(1)} Categoría`,
            `¿Estás seguro de que deseas ${action} la categoría "${category.name}"?\n\n${warningMessage}`,
            [
                {text: "Cancelar", style: "cancel"},
                {
                    text: action.charAt(0).toUpperCase() + action.slice(1),
                    style: category.isActive ? "destructive" : "default",
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            const response = await apiService.patch(`/categories/${category.id}/toggle-status`, {});
                            if (response.success) {
                                Alert.alert("Éxito", "Estado de la categoría actualizado.");
                                loadCategories();
                            } else {
                                Alert.alert("Error", "No se pudo actualizar el estado de la categoría.");
                            }
                        } catch (error: any) {
                            Alert.alert("Error", error.message);
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const CategoryCard: React.FC<{ category: Category }> = ({ category }) => {
        console.log('category data:', {
            name: category.name,
            isActive: category.isActive,
            canEdit: canEdit(),
        });
        return (
        <View style={[
            componentStyles.baseCard,
            !category.isActive && componentStyles.cardInactive
            ]}>
            <View style={componentStyles.cardHeader}>
                <View style={componentStyles.cardInfo}>
                    <View style={componentStyles.titleRow}>
                        <Text style={[
                            componentStyles.cardTitle,
                            !category.isActive && componentStyles.cardInactive
                        ]}>
                            {category.name}
                        </Text>
                        <Text style={[
                            componentStyles.cardTitle, !category.isActive && componentStyles.cardInactive
                        ]}>
                            {category.name}
                        </Text>
                        <Text style={[
                            componentStyles.statusBadge, category.isActive ? 
                            componentStyles.statusBadgeActive : 
                            componentStyles.statusBadgeInactive
                        ]}>
                            {category.isActive ? 'Activo' : 'Inactivo'}
                        </Text>
                    </View>
                </View>
                {category.description && (
                    <Text style={[
                        componentStyles.cardDescription,
                        !category.isActive && componentStyles.cardDescriptionInactive
                    ]}>
                        {category.description}
                    </Text>
                )}
                <Text style={componentStyles.cardDate}>
                    Creado: {new Date(category.createdAt).toLocaleDateString()}
                </Text>
                <Text style={[componentStyles.cardActions]}>
                    <TouchableOpacity
                        style={componentStyles.actionButton}
                    >
                        <Text style={[componentStyles.toggleButton, !category.isActive ?componentStyles.toggleButtonActive : componentStyles.toggleButtonInactive 
                        ]}
                        onPress={() => handleToggleStatus(category)}
                        >
                            <Text style={componentStyles.toggleButtonText}>
                                {category.isActive ? 'Desactivar' : 'Activar'}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                    {canEdit() && (
                        <TouchableOpacity
                            style={[componentStyles.actionButton, componentStyles.editButton]}
                            onPress={() => openEditModal(category)}
                        >
                            <Ionicons name="create" size={18} color="white" />
                        </TouchableOpacity>
                    )}
                    {canDelete() && (
                        <TouchableOpacity
                            style={[componentStyles.actionButton, componentStyles.deleteButton]}
                            onPress={() => handleDelete(category)}
                        >
                            <Ionicons name="trash" size={18} color="white" />
                        </TouchableOpacity>
                    )}
                </Text>
            </View>
        </View>
        );
    };

    if (isLoading || isRefreshing) {
        return (
            <View style={globalStyles.loadingContainer}>
                <ActivityIndicator size="large" color="#4ECDC4" />
                <Text style={globalStyles.loadingText}>Cargando categorías...</Text>
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
                        <Text style={globalStyles.titleText}>Categorias</Text>
                        <Text style={globalStyles.emptyTitleText}>No hay categorías disponibles.</Text>
                        <Text style={globalStyles.emptySubtitleText}>
                            {canEdit() ? 'Toca "Agregar" para crear una categoría.' : 'No se han creado categorías aún.'}
                        </Text>
                    </View>
                ) : (
                    categories.map((category) => (
                        <CategoryCard key={category.id} category={category} />
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
                                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
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
                            placeholder="Nombre de la categoría"
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
                            placeholder="Descripcion de la categoría"
                            placeholderTextColor={'#999'}
                            multiline={true}
                            numberOfLines={3}
                            />
                        </View>

                        <View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 16}}>
                            <TouchableOpacity
                            style={globalStyles.secondaryButtonText}
                            onPress={closeModal}
                            >
                                <Text style={globalStyles.secondaryButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                            style={globalStyles.secondaryButtonText}
                            onPress={handleSave}
                            disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="fffff" size="small"/>
                                ) : (
                                    <Text
                                    style={globalStyles.primaryButtonText}
                                    >
                                        {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
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

export default CategoriesScreen;
