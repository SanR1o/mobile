//contexto global de autenticacion
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authService } from '../services/auth';
import { User, LoginCredentials, LoginResponse } from '../types';

//interfaz de contexto
interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

//funciones de autenticacion
    login: (credentials: LoginCredentials) => Promise <LoginResponse>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
    canDelete: () => boolean;
    canEdit: () => boolean;
    hasRole: (role: 'admin' | 'coordinador') => boolean;
};

const AuthContext = createContext <AuthContextType | undefined>(undefined);
interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState <User | null>(null);
    const [isLoading, setIsLoading] = useState <boolean>(true);

    useEffect(() => {
        checkAuthStatus();
        }, []);

    const checkAuthStatus = async () => {
        try {
            setIsLoading(true);

            const isAuth = await authService.isAuthenticated();

            if (isAuth) {
                const isValidToken = await authService.verifyToken();

                if (isValidToken) {
                    const userData = await authService.getCurrentUser();
                    setUser(userData);
                } else {
                    await authService.clearAuthData();
                    setUser(null);
                }

            } else {
                setUser(null)
            }
        } catch (error) {
            console.error('Error verificando autenticacion: ', error);
            await authService.clearAuthData();
            setUser(null);
        } finally {
            setIsLoading(false)
        }
    };

//proceso de inicio de sesion
    const login = async (credentials: LoginCredentials):
    Promise<LoginResponse> => {
        try{
            setIsLoading(true);
            const response = await authService.login(credentials);
            if (response.success && response.data) {
                setUser(response.data.user);
            }
            return response;
        } catch (error: any) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

//cierre de sesion
    const logout = async ():
    Promise<void> => {
        try {
            setIsLoading(true);
            await authService.logout();
            setUser(null);
        } catch (error) {
            console.warn('Error en logout: ', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

//refresca los datos del usuario actual sin hacer login
    const refresh = async (): 
    Promise<void> => {
        try {
            if (user) {
                const userData = await authService.getCurrentUser();
                setUser(userData);
            }
        } catch (error) {
            console.warn('Error refrescando el usuario', error);
            await logout();
        }
    };

//permisos de eliminar
    const canDelete = (): boolean => {
        return user?.role === 'admin';
    };

//permisos para editar
    const canEdit = (): boolean => {
        return user?.role === 'admin' || user?.role === 'coordinador';
    };

//verificar rol especifico
    const hasRole = (role: 'admin' | 'coordinador'): boolean => {
        return user?.role === role
    };


    const isAuthenticated = !!user;

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refresh,
        canDelete,
        canEdit,
        hasRole
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw  new Error('useAuth debe ser usado dentro de un AuthProvider')
    }
    return context;
};

export { AuthContext };
export default AuthProvider;
