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
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { apiService } from '../services/api';
import { globalStyles, componentStyles, colors, spacing } from "../styles"

interface DashboardStats {
    totalUsers: number;
    totalCategories: number;
    totalSubcategories: number;
    totalProducts: number;
};

const HomeScreen: React.FC = () => {
    const{ user, logout, hasRole }= useAuth();
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
        try{
            const promises: Promise<any>[] = [];

            if(hasRole('admin')){
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

            //procesar resultado
            if(hasRole('admin')) {
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
        } catch(error) {
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
            <View style={[componentStyles.homeCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
                <View style={globalStyles.homeCardHeader}>
                    <Ionicons name={iconName as any} size={24} color={color} 
                    style={globalStyles.homeCardIcon} />
                    <Text style={[globalStyles.homeCardTitle, { color }]}>{title}</Text>
                </View>
                <Text style={[globalStyles.homeCardValue, { color }]}>{value}</Text>
            </View>
        );
    };

    const QuickAction : React.FC<{
        title: string;
        iconName: string;
        onPress: () => void;
        color: string;
    }> = ({ title, iconName, onPress, color }) => {
        return (
            <TouchableOpacity style={globalStyles.quickActionButton} onPress={onPress}>
                <Ionicons name={iconName as any} size={20} color={color} style={globalStyles.homeActionButtonIcon} />
                <Text style={[globalStyles.homeActionButtonText, { color }]}>{title}</Text>
            </TouchableOpacity>
        );
    };
    if(isLoading){
        return (
            <View style={[globalStyles.container, globalStyles.loadingContainer]}>
                <Text style={globalStyles.loadingText}>Cargando datos...</Text>
            </View>
        );
    };
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
        >
            <View style={globalStyles.homeHeader}>
                <Text style={globalStyles.userWelcomeText}>Bienvenido de nuevo</Text>
                <Text style={globalStyles.userName}>{user?.email || 'Usuario'}</Text>
                <Text style={globalStyles.userRole}>{user?.role === 'admin' ? 'Administrador' : 'Coordinador'}</Text>
                <TouchableOpacity style={globalStyles.logoutButton} onPress={handleLogout}>
                    <Text style={globalStyles.logoutButtonText}>Cerrar Sesión</Text>
                </TouchableOpacity>
            </View>
            {/*Estadisticas*/}
            <View style={globalStyles.homeStatsContainer}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: spacing.md
                }}></View>
            </View>
            <Ionicons name="stats-chart" size={32} color={colors.primary} style={{ alignSelf: 'center', marginBottom: spacing.sm }} />
            <View style={globalStyles.homeGrid}>
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
                    color={colors.Coordinador}
                    iconName="albums"
                />
                <StatCard
                    title="Productos"
                    value={stats.totalProducts}
                    color={colors.accent}
                    iconName="cube"
                />
            </View>
            <View style={globalStyles.homeSection}>
                <View style={globalStyles.homeSectionHeader}>
                    <Ionicons name="flash" size={24} color={colors.primary} style={{ marginRight: spacing.md }} />
                    <Text style={globalStyles.homeSectionTitle}>Acciones Rápidas</Text>
                    <View style={globalStyles.homeGrid}>
                        {hasRole('admin') && (
                            <QuickAction
                                iconName="people"
                                onPress={() => navigation.navigate('UserManagement' as never)} 
                                title="Gestion de usuarios"
                                color={colors.admin}
                            />
                        )}
                        <QuickAction
                            iconName="folder"
                            onPress={() => navigation.navigate('CategoryManagement' as never)} 
                            title="Gestion de categorias"
                            color={colors.secondary}
                        />
                        <QuickAction
                            iconName="albums"
                            onPress={() => navigation.navigate('SubcategoryManagement' as never)} 
                            title="Gestion de subcategorias"
                            color={colors.Coordinador}
                        />
                        <QuickAction
                            iconName="cube"
                            onPress={() => navigation.navigate('ProductManagement' as never)} 
                            title="Gestion de productos"
                            color={colors.accent}
                        />
                    </View>
                    {/*informacion del sistema*/}
                    <View style={{flexDirection: 'row', alignItems: 'center', marginTop: spacing.md}}>
                        <Ionicons name="information-circle" size={24} color={colors.primary} style={{ marginRight: spacing.md }} />
                        <Text style={globalStyles.homeSectionTitle}>Información del Sistema</Text>
                    </View>
                    <View style={[StyleSheet.flatten([componentStyles.infoCard, {borderLeftColor: colors.primary, borderLeftWidth: 4}])]}>
                        <Text style={componentStyles.infoText}>Versión de la App: 1.0.0</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

export default HomeScreen;