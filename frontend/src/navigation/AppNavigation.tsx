import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList, MainTabParamList } from "../types";
import { colors, spacing, typography } from "../styles";
import LoginScreen from "../screen/LoginScreen";
import LoadingScreen from "../screen/LoadingScreen";
import HomeScreen from "../screen/HomeScreen";  
import UserScreen from "../screen/UserScreen";
import CategoryScreen from "../screen/CategoriesScreen";
import SubcategoryScreen from "../screen/SubcategoriesScreen";
import ProductScreen from "../screen/ProductScreen";
import ProfileScreen from "../screen/ProfileScreen";
import EditProfileScreen from "../screen/EditProfileScreen";
import ChangePasswordScreen from "../screen/ChangePasswordScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator: React.FC = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    height: 60,
                    paddingBottom: spacing.sm,
                    paddingTop: spacing.sm
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: typography.fontWeight.medium
                }
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons
                            name={focused ? "home" : "home-outline"}
                            size={size}
                            color={color}
                        />
                    )
                }}
            />
            <Tab.Screen
                name="Users"
                component={UserScreen}
                options={{
                    title: 'Usuarios',
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons
                            name={focused ? "people" : "people-outline"}
                            size={size}
                            color={color}
                        />
                    )
                }}
            />
            <Tab.Screen
                name="Category"
                component={CategoryScreen}
                options={{
                    title: 'Categorías',
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons
                            name={focused ? "albums" : "albums-outline"}
                            size={size}
                            color={color}
                        />
                    )
                }}
            />
            <Tab.Screen
                name="Subcategory"
                component={SubcategoryScreen}
                options={{
                    title: 'Subcategorias',
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons
                            name={focused ? "albums" : "albums-outline"}
                            size={size}
                            color={color}
                        />
                    )
                }}
            />
            <Tab.Screen
                name="Products"
                component={ProductScreen}
                options={{
                    title: 'Productos',
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons
                            name={focused ? "cube" : "cube-outline"}
                            size={size}
                            color={color}
                        />
                    )
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons
                            name={focused ? "person" : "person-outline"}
                            size={size}
                            color={color}
                        />
                    )
                }}
            />
        </Tab.Navigator>
    );
};

const AppNavigation: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator 
            screenOptions={{ 
                headerShown: false,
                animation: 'slide_from_bottom'
            }}>
                {isAuthenticated ? (
                    <>
                        <Stack.Screen 
                            name="Main" 
                            component={MainTabNavigator} 
                            options={{
                                animationTypeForReplace: 'push'
                            }}
                        />
                        <Stack.Screen 
                            name="EditProfile" 
                            component={EditProfileScreen} 
                        />
                        <Stack.Screen 
                            name="ChangePassword" 
                            component={ChangePasswordScreen} 
                        />
                    </>
                ) : (
                    <Stack.Screen 
                        name="Login" 
                        component={LoginScreen} options={{
                            animationTypeForReplace: 'pop'
                        }}
                    />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigation;