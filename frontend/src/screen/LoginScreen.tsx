import React, { useEffect, useState } from "react";
import { 
    View,
    Text,
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
import { User, LoginCredentials, LoginResponse } from '../types';
import { globalStyles, componentStyles, colors, spacing } from "../styles"
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

const LoginScreen: React.FC = () => {
    const { login, isLoading, isAuthenticated } = useAuth();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [credentials, setCredentials] = useState<LoginCredentials>({ email: '', password: '' });
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const handleInputChange = (field: keyof LoginCredentials, value: string) => {
        setCredentials(prev => ({
            ...prev,
            [field]: value.trim()
        }));
        setFormError(null);
    };

    //validar formulario
    const validateForm = (): boolean => {
        if (!credentials.email || !credentials.password) {
            setFormError('Por favor, complete todos los campos.');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmail = credentials.email && emailRegex.test(credentials.email);
        if (!isEmail) {
            setFormError('Por favor, ingrese un correo electrónico válido.');
            return false;
        }
        setFormError(null);
        return true;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;
        try {
            const response = await login(credentials);
            if (response && typeof response === 'object' && 'message' in response) {
                setFormError(null);
                // Eliminado Alert para evitar bloqueo de render
            } else if (response && typeof response === 'object') {
                setFormError((response as any).message || 'Error de Login');
            } else {
                setFormError('Error de Login');
            }
        } catch (error: any) {
            setFormError(error.message || 'No se pudo establecer conexión con el servidor.');
        }
    };

    const isFormValid = credentials.email && credentials.password && !formError;

    return (
        <KeyboardAvoidingView style={globalStyles.loginContainer} behavior={Platform.OS === "ios" ? "padding" : 'height'}>
            <ScrollView contentContainerStyle={globalStyles.loginScrollContainer} keyboardShouldPersistTaps="handled">
                <View style={globalStyles.loginLogoContainer}>
                    <Text style={globalStyles.loginLogoText}>Logo</Text>
                    <Text style={globalStyles.loginAppTitle}>Mi App</Text>
                    <Text style={globalStyles.loginSubtitle}>Login</Text>
                </View>
                <View style={globalStyles.inputContainer}>
                    <View style={globalStyles.inputContainer}>
                        <Text style={globalStyles.inputLabel}>Email</Text>
                        <TextInput
                            style={globalStyles.textInput}
                            value={credentials.email}
                            onChangeText={(value: string) => handleInputChange('email', value)}
                            keyboardType="email-address"
                            placeholderTextColor='#999'
                            autoCorrect={false}
                            editable={!isLoading}
                            autoFocus
                            accessibilityLabel="Campo de email"
                        />
                        <Text style={globalStyles.inputLabel}>Contraseña</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TextInput
                                style={[globalStyles.textInput, { flex: 1 }]}
                                value={credentials.password}
                                onChangeText={(value: string) => handleInputChange('password', value)}
                                placeholderTextColor='#999'
                                placeholder='tu contraseña'
                                secureTextEntry={!isPasswordVisible}
                                editable={!isLoading}
                                autoCapitalize="none"
                                accessibilityLabel="Campo de contraseña"
                            />
                            <TouchableOpacity
                                style={globalStyles.loginEyeButton}
                                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                                disabled={isLoading}
                                accessibilityLabel={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                <Ionicons
                                    name={isPasswordVisible ? 'eye-off' : 'eye'}
                                    size={20}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>
                        {formError && credentials.email && !credentials.password && (
                            <Text style={{ color: 'red', marginTop: 2 }}>{formError}</Text>
                        )}
                    </View>
                    {formError && credentials.email && credentials.password && (
                        <Text style={{ color: 'red', marginTop: 2 }}>{formError}</Text>
                    )}
                </View>
                <TouchableOpacity
                    style={[globalStyles.loginButton, (!isFormValid || isLoading) && globalStyles.loginButtonDisabled]}
                    onPress={handleLogin}
                    disabled={!isFormValid || isLoading}
                    accessibilityLabel="Botón de iniciar sesión"
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={globalStyles.loginButtonText}>Iniciar Sesión</Text>
                    )}
                </TouchableOpacity>
                <View style={globalStyles.loginInfoContainer}>
                    <Text style={globalStyles.loginDemoText}>
                        Admin: admin / admin123 {'\n'}
                        Coordinador: coordinador / coord123 {'\n'}
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default LoginScreen;