import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';
import { User, LoginCredentials, LoginResponse, ChangePasswordData, ApiResponse } from '../types';

class AuthService {
    private readonly TOKEN_KEY = 'token';
    private readonly USER_KEY = 'user';
    
    //autentica al usuario y guarda el token y los datos del usuario
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        try {
            const response = await apiService.post<LoginResponse['data']>('/auth/login', credentials);
            // Retorna la respuesta tal cual la envía el backend
            if (response.success && response.data) {
                const { token, user } = response.data;
                await AsyncStorage.setItem(this.TOKEN_KEY, token);
                await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));
                return {
                    success: true,
                    message: response.message || 'Login exitoso',
                    data: response.data
                };
            } else {
                return {
                    success: false,
                    message: response.message || 'Error de autenticación',
                    data: { user: undefined as any, token: '', expiresIn: '' }
                };
            }
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Error de conexión con el servidor',
                data: { user: undefined as any, token: '', expiresIn: '' }
            };
        }
    }

    //logout
    async logout(): Promise<void> {
        try {
            await apiService.post('/auth/logout');
        } catch (error) {
            console.warn('Error durante el logout', error);
        } finally {
            await AsyncStorage.multiRemove([this.TOKEN_KEY, this.USER_KEY]);
        }
    }

    //obtener token
    async getToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(this.TOKEN_KEY);
        } catch (error) {
            console.warn('Error al obtener el token', error);
            return null;
        }
    }

    //obtener usuario almacenado
    async getUser(): Promise<User | null> {
        try {
            const userData = await AsyncStorage.getItem(this.USER_KEY);
            return userData ? JSON.parse(userData) as User : null;
        } catch (error) {
            console.warn('Error al obtener los datos del usuario', error);
            return null;
        }
    }

    //verificar si el usuario está autenticado
    async isAuthenticated(): Promise<boolean> {
        const token = await this.getToken();
        const user = await this.getUser();
        return !!(token && !!user);
    }

    //obtener informacion del usuario actual
    async getCurrentUserInfo(): Promise<User | null> {
        try {
            const response = await apiService.get<User>('/auth/me');
            if (response.success && response.data) {
                await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(response.data));
                return response.data
            } else {
                throw new Error(response.message || 'Error obteniendo usuario')
            }
        } catch (error:any) {
            throw new Error(error.message || 'Error obteniendo usuario')
        }
    }

    //cambiar contraseña
    async changePassword(data: ChangePasswordData): Promise<ApiResponse<null>> {
        try {
            const response = await apiService.post<null>('/auth/change-password', data);
            return response;
        } catch (error: any) {
            throw new Error(error.message || 'Error tratando de cambiar la contraseña')
        }
    }

    //verificar token en el servidor
    async verifyToken(): Promise<boolean> {
            try {
                const response = await apiService.get<null>('/auth/verify-token');
                return !!response.success;
            } catch(error) {
                return false;
            }
        }

    //limpiar datos de autenticacion
    async clearAuthData(): Promise<void> {
        await AsyncStorage.multiRemove([this.TOKEN_KEY, this.USER_KEY]);
    }

    //verificar si tiene un rol
    async hasRole(role: 'admin' | 'coordinador'): Promise<boolean> {
        const user = await this.getUser();
        return user?.role === role
    }

    // verificar si el usuario puede eliminar
    async canDelete(): Promise<boolean> {
        return this.hasRole('admin');
    }

    // verificar si el usuario puede eliminar
    async canEdit(): Promise<boolean> {
        const user = await this.getUser(); 
        return user?.role === 'admin' || user?.role === 'coordinador'
    }
}


export const authService = new AuthService();
export default AuthService;