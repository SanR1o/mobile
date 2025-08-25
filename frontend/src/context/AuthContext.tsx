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
}