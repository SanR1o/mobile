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

}
export default HomeScreen;