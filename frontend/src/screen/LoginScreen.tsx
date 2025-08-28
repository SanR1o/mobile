import React, { useEffect, useState } from "react";
import { 
    View,
    Text,
    TextInput,
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
import { User, LoginCredentials, LoginResponse } from '../types';
import { globalStyles, componentStyles, colors, spacing } from "../styles"

const LoginScreen: React.FC = () => {
    const { login, isLoading } = useAuth();
    const [credentials, setCredentials] = useState<LoginCredentials>({ email: '', password: '' });

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleInputChange = (field: keyof LoginCredentials, value: string) => {
        setCredentials(prev => ({
                ...prev, 
                [field]: value.trim()
            }));
        };

    //validar formulario
    const validateForm = (): boolean => {
        if (!credentials.email || !credentials.password) {
            Alert.alert('Error', 'Por favor, complete todos los campos.');
            return false;
        }
        return true;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmail = emailRegex.test(credentials.email) && credentials.email.includes('@');
        const isUsername = credentials.email && !emailRegex.test(credentials.email);
        if (!isEmail && !isUsername) {
            Alert.alert('Error', 'Por favor, ingrese un correo electrónico válido.');
            return false;
        }
        return true;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;
        try {
            const response = await login(credentials);
            if (response) {
                Alert.alert('Éxito', 'Inicio de sesión exitoso');
            } else {
                Alert.alert('Error', response.message || 'Error de Login');
            }
        } catch (error: any) {
            Alert.alert('Error de conexion', error.message || 'No se pudo establecer conexión con el servidor.');
        }
    };
};
export default LoginScreen;