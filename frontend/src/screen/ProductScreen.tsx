// Utilidad para validar éxito en respuesta API
function isApiSuccess(response: any, status?: number): boolean {
    return (response && response.success === true) || (status && (status === 200 || status === 201));
}
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
import { Subcategory, Category, Product } from '../types'; 
import { globalStyles, componentStyles, colors, spacing } from "../styles";

const ProductsScreen: React.FC = () => {
    const { canEdit, canDelete } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        shortDescription: '',
        description: '',
        category: '', // Cambiado de categoryId
        subcategory: '', // Cambiado de subcategoryId
        slug: '',
        sku: '',
        price: '',
        comparePrice: '',
        cost: '',
        stockQuantity: '',
        minStock: '',
        stock: '',
        weight: '',
        length: '',
        width: '',
        height: '',
    });

    useEffect(() => {
        loadProducts();
        loadCategories();
        loadSubcategories();
    }, []);

    // Cargar productos
    const loadProducts = async () => {
        try {
            setIsLoading(true);
            const prodRes = await apiService.get('/products');
            if (prodRes.success && Array.isArray(prodRes.data)) {
                setProducts(prodRes.data as Product[]);
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudieron cargar los productos.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Cargar categorías
    const loadCategories = async () => {
        try {
            setIsLoading(true);
            const catRes = await apiService.get('/categories');
            if (catRes.success && Array.isArray(catRes.data)) {
                setCategories(catRes.data as Category[]);
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudieron cargar las categorías.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Cargar subcategorías
    const loadSubcategories = async () => {
        try {
            setIsLoading(true);
            const subcatRes = await apiService.get('/subcategories');
            if (subcatRes.success && Array.isArray(subcatRes.data)) {
                setSubcategories(subcatRes.data as Subcategory[]);
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudieron cargar las subcategorías.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CO', { 
            style: 'currency', 
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadProducts();
        loadCategories();
        loadSubcategories();
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        setFormData({ 
            name: '',
            shortDescription: '',
            description: '',
            category: '',
            subcategory: '',
            slug: '',
            sku: '',
            price: '',
            comparePrice: '',
            cost: '',
            stockQuantity: '',
            minStock: '',
            stock: '',
            weight: '',
            length: '',
            width: '',
            height: '',
        });
        setIsModalVisible(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            shortDescription: product.shortDescription || '',
            description: product.description || '',
            category: typeof product.categoryId === 'object' ? product.categoryId._id : product.categoryId,
            subcategory: typeof product.subcategoryId === 'object' ? product.subcategoryId._id : product.subcategoryId,
            slug: product.slug || '',
            sku: product.sku,
            price: product.price.toString(),
            comparePrice: product.comparePrice?.toString() || '',
            cost: product.cost?.toString() || '',
            stockQuantity: product.stock?.quantity?.toString() || '',
            minStock: product.stock?.minStock?.toString() || '',
            stock: product.stock?.trackStock?.toString() || '',
            weight: product.dimensions?.weight?.toString() || '',
            length: product.dimensions?.length?.toString() || '',
            width: product.dimensions?.width?.toString() || '',
            height: product.dimensions?.height?.toString() || '',
        });
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setEditingProduct(null);
        setFormData({ 
            name: '',
            shortDescription: '',
            description: '',
            category: '',
            subcategory: '',
            slug: '',
            sku: '',
            price: '',
            comparePrice: '',
            cost: '',
            stockQuantity: '',
            minStock: '',
            stock: '',
            weight: '',
            length: '',
            width: '',
            height: '',
        });
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio.');
            return false;
        }
        if (!formData.category) {
            Alert.alert('Error', 'La categoría es obligatoria.');
            return false;
        }
        if (!formData.subcategory) {
            Alert.alert('Error', 'La subcategoría es obligatoria.');
            return false;
        }
        if (!formData.price.trim() || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
            Alert.alert('Error', 'El precio debe ser un número válido y mayor que cero.');
            return false;
        }
        if (!formData.stockQuantity.trim() || isNaN(Number(formData.stockQuantity)) || Number(formData.stockQuantity) <= 0) {
            Alert.alert('Error', 'La cantidad en stock debe ser un número válido y mayor que cero.');
            return false;
        }
        return true;
    }

    const handleSave = async () => {
        if (!validateForm()) return;
        try {
            setIsLoading(true);
            const ProductData = {
                name: formData.name.trim(),
                shortDescription: formData.shortDescription.trim(),
                description: formData.description.trim(),
                category: formData.category,
                subcategory: formData.subcategory,
                slug: formData.slug.trim(),
                sku: formData.sku.trim(),
                price: Number(formData.price),
                comparePrice: formData.comparePrice ? Number(formData.comparePrice) : undefined,
                cost: formData.cost ? Number(formData.cost) : undefined,
                stock: {
                    quantity: Number(formData.stockQuantity),
                    minStock: Number(formData.minStock) || 0,
                    trackStock: true
                },
                dimensions: {
                    weight: formData.weight ? Number(formData.weight) : undefined,
                    length: formData.length ? Number(formData.length) : undefined,
                    width: formData.width ? Number(formData.width) : undefined,
                    height: formData.height ? Number(formData.height) : undefined,
                }
            };
            let response;
            if (editingProduct) {
                // Editar producto
                response = await apiService.put(`/products/${editingProduct._id}`, ProductData);
                if (isApiSuccess(response, response?.status)) {
                    Alert.alert('Éxito', 'Producto actualizado.');
                    closeModal();
                    loadProducts();
                } else {
                    Alert.alert('Error', response?.message || 'No se pudo actualizar el producto.');
                }
            } else {
                // Crear nuevo producto
                response = await apiService.post('/products', ProductData);
                if (isApiSuccess(response, response?.status)) {
                    Alert.alert('Éxito', 'Producto creado.');
                    closeModal();
                    loadProducts();
                } else {
                    Alert.alert('Error', response?.message || 'No se pudo crear el producto.');
                }
            }
        } catch(error) {
            Alert.alert('Error', 'No se pudo guardar el producto.');
        } finally {
            setIsLoading(false);
        }
};

    const handleDelete = async (product: Product) => {
        Alert.alert(
            'Confirmar',
            `¿Estás seguro de que deseas eliminar ${product.name}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar', style: 'destructive',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const response = await apiService.delete(`/products/${product._id}`);
                            if (isApiSuccess(response, response?.status)) {
                                Alert.alert('Éxito', 'Producto eliminado.');
                                loadProducts();
                            } else {
                                Alert.alert('Error', response?.message || 'No se pudo eliminar el producto.');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Ocurrió un error al eliminar el producto.');
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleToggleStatus = async (product: Product) => {
        const action = product.isActive ? 'desactivar' : 'activar';

        Alert.alert(
            `${action.charAt(0).toUpperCase() + action.slice(1)} Producto`,
            `¿Estás seguro de que deseas ${action} el producto "${product.name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: action.charAt(0).toUpperCase() + action.slice(1),
                    style: product.isActive ? 'destructive' : 'default',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const response = await apiService.patch(`/products/${product._id}/toggle-status`, {});
                            if (isApiSuccess(response, response?.status)) {
                                Alert.alert('Éxito', 'Estado del producto actualizado.');
                                loadProducts();
                            } else {
                                Alert.alert('Error', response?.message || 'No se pudo actualizar el estado del producto.');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'No se pudo actualizar el estado del producto.');
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // Obtiene el nombre de la categoría soportando ambos formatos y campos
    const getCategoryName = (product: Product) => {
        const catField = product.categoryId ?? (product as any).category;
        const id = typeof catField === 'object' ? catField._id : catField;
        const category = categories.find(cat => cat._id === id);
        return category ? category.name : 'Sin categoría';
    }

    // Obtiene el nombre de la subcategoría soportando ambos formatos y campos
    const getSubcategoryName = (product: Product) => {
        const subcatField = product.subcategoryId ?? (product as any).subcategory;
        const id = typeof subcatField === 'object' ? subcatField._id : subcatField;
        const subcategory = subcategories.find(sub => sub._id === id);
        return subcategory ? subcategory.name : 'Sin subcategoría';
    }

    // Renderizar cada producto
    const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    const categoryName = getCategoryName(product);
    const subcategoryName = getSubcategoryName(product);
        return (
            <View style={globalStyles.userCard}>
                <View style={globalStyles.userCardHeader}>
                    <Text style={globalStyles.userCardName}>{product.name}</Text>
                    <View style={[globalStyles.userCardRole, product.isActive ? globalStyles.userStatusActive : globalStyles.userStatusInactive]}>
                        <Text style={[globalStyles.userCardRole, product.isActive ? globalStyles.userStatusActive : globalStyles.userStatusInactive]}>
                            {product.isActive ? 'Activo' : 'Inactivo'}
                        </Text>
                    </View>
                </View>
                <View style={globalStyles.userCardInfo}>
                    <Text style={globalStyles.userCardEmail}>SKU: {product.sku}</Text>
                    <Text style={globalStyles.userCardEmail}>Precio: {formatPrice(Number(product.price))}</Text>
                    <Text style={globalStyles.userCardEmail}>Stock: {product.stock?.quantity}</Text>
                    {product.shortDescription ? (
                        <Text style={globalStyles.userCardEmail}>Resumen: {product.shortDescription}</Text>
                    ) : null}
                    <Text style={globalStyles.userCardEmail}>Categoría: {categoryName}</Text>
                    <Text style={globalStyles.userCardEmail}>Subcategoría: {subcategoryName}</Text>
                    {product.description && (
                        <Text style={globalStyles.userCardEmail}>Descripción: {product.description}</Text>
                    )}
                    <Text style={globalStyles.userCardEmail}>
                        Creado: {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : ''}
                    </Text>
                </View>
                <View style={globalStyles.userCardActions}>
                    <TouchableOpacity 
                        style={[globalStyles.userActionButton, globalStyles.userToggleButton]}
                        onPress={() => handleToggleStatus(product)}
                    >
                        <Text style={globalStyles.userActionButtonText}>
                            {product.isActive ? 'Desactivar' : 'Activar'}
                        </Text>
                    </TouchableOpacity>
                    {canEdit() && (
                        <TouchableOpacity 
                            style={[globalStyles.userActionButton, globalStyles.userEditButton]}
                            onPress={() => openEditModal(product)}
                        >
                            <Text style={globalStyles.userActionButtonText}>Editar</Text>
                        </TouchableOpacity>
                    )}
                    {canDelete() && (
                        <TouchableOpacity 
                            style={[globalStyles.userActionButton, globalStyles.userDeleteButton]}
                            onPress={() => handleDelete(product)}
                        >
                            <Text style={globalStyles.userActionButtonText}>Eliminar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };
    
        if (isLoading || isRefreshing) {
            return (
                <View style={globalStyles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4ECDC4" />
                    <Text style={globalStyles.loadingText}>Cargando productos...</Text>
                </View>
            );
        }
        
    return (
        <View style={globalStyles.screenContainer}>
            <View style={globalStyles.screenHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="folder" size={24} color="white" style={{ marginRight: 8 }} />
                    <Text style={globalStyles.headerTitle}>Productos</Text>
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
                        <Text style={globalStyles.emptyStateText}>No hay subcategorías disponibles.</Text>
                        <Text style={globalStyles.emptyStateText}>
                            {canEdit() ? 'Toca "Agregar" para crear una subcategoría.' : 'No se han creado subcategorías aún.'}
                        </Text>
                    </View>
                ) : (
                    products.map((product) => (
                        <ProductCard key={product._id} product={product} />
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
                    <View style={[globalStyles.card, { width: '100%', maxWidth: 400, maxHeight: '90%' }]}> 
                        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                            <View style={globalStyles.cardHeader}>
                                <Text style={globalStyles.headerTitle}>
                                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                                </Text>
                                <TouchableOpacity 
                                    style={globalStyles.dangerButton}
                                    onPress={closeModal}>
                                    <Text style={globalStyles.dangerButtonText}>X</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={globalStyles.inputContainer}>
                                <Text style={globalStyles.inputLabel}>Nombre*</Text>
                                <TextInput
                                    style={globalStyles.textInput}
                                    value={formData.name}
                                    onChangeText={(value) => setFormData({ ...formData, name: value })}
                                    placeholder="Nombre del producto"
                                    placeholderTextColor={'#999'}
                                />
                            </View>
                            <View style={globalStyles.inputContainer}>
                                <Text style={globalStyles.inputLabel}>Resumen</Text>
                                <TextInput
                                    style={globalStyles.textInput}
                                    value={formData.shortDescription}
                                    onChangeText={(value) => setFormData({ ...formData, shortDescription: value })}
                                    placeholder="Resumen del producto"
                                    placeholderTextColor={'#999'}
                                />
                            </View>
                            <View style={globalStyles.inputContainer}>
                                <Text style={globalStyles.inputLabel}>Descripción</Text>
                                <TextInput
                                    style={[globalStyles.textInput, {height: 80, textAlignVertical: 'top'}]}
                                    value={formData.description}
                                    onChangeText={(value) => setFormData({ ...formData, description: value })}
                                    placeholder="Descripción del producto"
                                    placeholderTextColor={'#999'}
                                    multiline={true}
                                    numberOfLines={3}
                                />
                            </View>
                            <View style={globalStyles.inputContainer}>
                                <Text style={globalStyles.inputLabel}>Precio*</Text>
                                <TextInput
                                    style={globalStyles.textInput}
                                    value={formData.price}
                                    onChangeText={(value) => setFormData({ ...formData, price: value })}
                                    placeholder="Precio"
                                    placeholderTextColor={'#999'}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={globalStyles.inputContainer}>
                                <Text style={globalStyles.inputLabel}>SKU*</Text>
                                <TextInput
                                    style={globalStyles.textInput}
                                    value={formData.sku}
                                    onChangeText={(value) => setFormData({ ...formData, sku: value })}
                                    placeholder="SKU"
                                    placeholderTextColor={'#999'}
                                />
                            </View>
                            <View style={globalStyles.inputContainer}>
                                <Text style={globalStyles.inputLabel}>Stock*</Text>
                                <TextInput
                                    style={globalStyles.textInput}
                                    value={formData.stockQuantity}
                                    onChangeText={(value) => setFormData({ ...formData, stockQuantity: value })}
                                    placeholder="Cantidad en stock"
                                    placeholderTextColor={'#999'}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={globalStyles.inputContainer}>
                                <Text style={globalStyles.inputLabel}>
                                    Categoría
                                </Text>
                                <Picker
                                    selectedValue={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value, subcategory: '' })}
                                    style={globalStyles.textInput}
                                >
                                    <Picker.Item label="Selecciona una categoría" value="" />
                                    {categories.map((cat) => (
                                        <Picker.Item key={cat._id} label={cat.name} value={cat._id} />
                                    ))}
                                </Picker>
                            </View>
                            <View style={globalStyles.inputContainer}>
                                <Text style={globalStyles.inputLabel}>
                                    Subcategoría
                                </Text>
                                <Picker
                                    selectedValue={formData.subcategory}
                                    onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
                                    style={globalStyles.textInput}
                                    enabled={!!formData.category}
                                >
                                    <Picker.Item label="Selecciona una subcategoría" value="" />
                                    {subcategories
                                        .filter(sub => {
                                            // Soporta ambos: categoryId y category
                                            const catField = sub.categoryId ?? (sub as any).category;
                                            const subCatId = typeof catField === 'object' ? catField._id : catField;
                                            return String(subCatId) === String(formData.category);
                                        })
                                        .map(sub => (
                                            <Picker.Item key={sub._id} label={sub.name} value={sub._id} />
                                        ))}
                                </Picker>
                            </View>
                            <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16}}>
                                <TouchableOpacity
                                    style={globalStyles.secondaryButton}
                                    onPress={closeModal}
                                    accessibilityLabel="Cancelar"
                                >
                                    <Text style={globalStyles.secondaryButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[globalStyles.secondaryButton, { marginLeft: 8 }]}
                                    onPress={handleSave}
                                    disabled={isLoading || !formData.name.trim() || !formData.category}
                                    accessibilityLabel={editingProduct ? 'Editar producto' : 'Crear producto'}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={globalStyles.primaryButtonText}>
                                            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default ProductsScreen;