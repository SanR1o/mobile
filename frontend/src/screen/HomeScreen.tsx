import React, { useEffect, useState } from "react";
import { 
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    StyleSheet
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { apiService } from '../services/api';
import { globalStyles, componentStyles, colors, spacing } from "../styles"

interface DashboardStats {
    totalUsers: number;
    totalCategories: number;
    totalSubcategories: number;
    totalProducts: number;
}

const HomeScreen: React.FC = () => {
    const { user, logout, hasRole } = useAuth();
    const navigation = useNavigation();

    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalCategories: 0,
        totalSubcategories: 0,
        totalProducts: 0,
    });

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const promises: Promise<any>[] = [];

            if (hasRole('admin')) {
                promises.push(apiService.get('/users'));
            }

            promises.push(
                apiService.get('/categories'),
                apiService.get('/subcategories'),
                apiService.get('/products')
            );

            const results: any[] = await Promise.all(promises);
            let userCount = 0;
            let resultsIndex = 0;

            if (hasRole('admin')) {
                const usersResponse = results[resultsIndex];
                userCount = usersResponse.success && usersResponse.data && Array.isArray(usersResponse.data) ? usersResponse.data.length : 0;
                resultsIndex++;
            }

            const categoriesResponse = results[resultsIndex];
            resultsIndex++;
            const subcategoriesResponse = results[resultsIndex];
            resultsIndex++;
            const productsResponse = results[resultsIndex];

            setStats({
                totalUsers: userCount,
                totalCategories: categoriesResponse.success && categoriesResponse.data && Array.isArray(categoriesResponse.data) ? categoriesResponse.data.length : 0,
                totalSubcategories: subcategoriesResponse.success && subcategoriesResponse.data && Array.isArray(subcategoriesResponse.data) ? subcategoriesResponse.data.length : 0,
                totalProducts: productsResponse.success && productsResponse.data && Array.isArray(productsResponse.data) ? productsResponse.data.length : 0,
            });
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadDashboardData();
    };

    const handleLogout = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro que deseas cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Cerrar Sesión', style: 'destructive', onPress: logout }
            ]
        );
    };

    const StatCard: React.FC<{
        title: string;
        value: number;
        color: string;
        iconName: string;
    }> = ({ title, value, color, iconName }) => {
        return (
            <View style={[styles.statCard, { borderLeftColor: color }]}>
                <View style={styles.statCardHeader}>
                    <Ionicons name={iconName as any} size={24} color={color} />
                    <Text style={[styles.statCardTitle, { color }]}>{title}</Text>
                </View>
                <Text style={[styles.statCardValue, { color }]}>{value}</Text>
            </View>
        );
    };

    const QuickAction: React.FC<{
        title: string;
        iconName: string;
        onPress: () => void;
        color: string;
    }> = ({ title, iconName, onPress, color }) => {
        return (
            <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
                <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
                    <Ionicons name={iconName as any} size={28} color={color} />
                </View>
                <Text style={[styles.quickActionTitle, { color }]}>{title}</Text>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <View style={[globalStyles.container, globalStyles.loadingContainer]}>
                <Text style={globalStyles.loadingText}>Cargando datos...</Text>
            </View>
        );
    }

    return (
        <ScrollView 
            style={globalStyles.container}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                    colors={[colors.primary]}
                />
            }
            showsVerticalScrollIndicator={false}
        >
            {/* Header de Usuario */}
            <View style={styles.userHeader}>
                <View style={styles.userInfo}>
                    <Text style={styles.welcomeText}>Bienvenido de nuevo</Text>
                    <Text style={styles.userName}>{user?.email || 'Usuario'}</Text>
                    <Text style={styles.userRole}>
                        {user?.role === 'admin' ? 'Administrador' : 'Coordinador'}
                    </Text>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={colors.textLight} />
                </TouchableOpacity>
            </View>

            {/* Sección de Estadísticas */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="stats-chart" size={24} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Estadísticas</Text>
                </View>
                
                <View style={styles.statsGrid}>
                    {hasRole('admin') && (
                        <StatCard 
                            title="Usuarios"
                            value={stats.totalUsers}
                            color={colors.admin}
                            iconName="people"
                        />
                    )}
                    <StatCard
                        title="Categorías"
                        value={stats.totalCategories}
                        color={colors.secondary}
                        iconName="folder"
                    />
                    <StatCard
                        title="Subcategorías"
                        value={stats.totalSubcategories}
                        color={colors.coordinator}
                        iconName="albums"
                    />
                    <StatCard
                        title="Productos"
                        value={stats.totalProducts}
                        color={colors.accent}
                        iconName="cube"
                    />
                </View>
            </View>

            {/* Sección de Acciones Rápidas */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="flash" size={24} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
                </View>
                
                <View style={styles.actionsGrid}>
                    {hasRole('admin') && (
                        <QuickAction
                            iconName="people"
                            onPress={() => navigation.navigate('UserManagement' as never)}
                            title="Usuarios"
                            color={colors.admin}
                        />
                    )}
                    <QuickAction
                        iconName="folder"
                        onPress={() => navigation.navigate('CategoryManagement' as never)}
                        title="Categorías"
                        color={colors.secondary}
                    />
                    <QuickAction
                        iconName="albums"
                        onPress={() => navigation.navigate('SubcategoryManagement' as never)}
                        title="Subcategorías"
                        color={colors.coordinator}
                    />
                    <QuickAction
                        iconName="cube"
                        onPress={() => navigation.navigate('ProductManagement' as never)}
                        title="Productos"
                        color={colors.accent}
                    />
                </View>
            </View>

            {/* Información del Sistema */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="information-circle" size={24} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Información del Sistema</Text>
                </View>
                
                <View style={styles.infoCard}>
                    <Text style={styles.infoText}>Versión de la App: 1.0.0</Text>
                    <Text style={styles.infoSubtext}>Sistema de gestión de inventario</Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    // Header de Usuario
    userHeader: {
        backgroundColor: colors.surface,
        padding: spacing.xl,
        marginBottom: spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    userInfo: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    userRole: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
    },
    logoutButton: {
        backgroundColor: colors.error,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },

    // Secciones
    section: {
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginLeft: spacing.sm,
    },

    // Tarjetas de Estadísticas
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    statCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: spacing.lg,
        minHeight: 100,
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    statCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    statCardTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: spacing.xs,
    },
    statCardValue: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
    },

    // Acciones Rápidas
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    quickActionButton: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: spacing.lg,
        alignItems: 'center',
        width: '48%',
        minHeight: 120,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    quickActionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    quickActionTitle: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },

    // Información del Sistema
    infoCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: spacing.lg,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.18,
        shadowRadius: 1.00,
    },
    infoText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    infoSubtext: {
        fontSize: 14,
        color: colors.textSecondary,
    },
});

export default HomeScreen;