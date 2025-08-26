//contexto global de autenticacion

//imports
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

export const AuthProvider: React.FC<AuthProviderProps> = {{ children }} => {
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
        } catch (error) {}
    }
};