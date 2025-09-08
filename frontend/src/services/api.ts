import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import  { ApiResponse } from '../types';


class ApiService {
    private axiosInstance: AxiosInstance;
    private baseURL: string = 'http://192.168.95.1:5000/api';

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }
    private setupInterceptors() {
        this.axiosInstance.interceptors.request.use(
            async (config) => {
                if (__DEV__) {
                    console.log('Enviando peticion a: ', (config.baseURL || '') + (config.url || ''));
                    console.log('datos enviados: ', config.data);
                }
                
                try {
                    const token = await AsyncStorage.getItem('token');
                    if (token && config.headers) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                } catch (error) {
                    if (__DEV__) {
                        console.error('Error obtener el token: ', error);
                    }
                }
                return config;
            },
            (error) => {
                if (__DEV__) {
                    console.error('Error en la petición: ', error);
                }
                return Promise.reject(error);
            }
        );

        this.axiosInstance.interceptors.response.use(
            (response: AxiosResponse) => {
                if (__DEV__) {
                    console.log('Respuesta de la API: ', response.status, response.data);
                }
                return response;
            },
            async (error) => {
                if (__DEV__) {
                    console.error('Error en la respuesta: ', error.response?.status, error.response?.data || error.message);
                }
                if (error.response && error.response.status === 401) {
                    await AsyncStorage.multiRemove(['token', 'user']);
                }
                return Promise.reject(error);
            }
        );
    }

    //manejo de errores
    handleError(error: any) {
        let errorInfo;
        if (error.response) {
            const { status, data } = error.response;
            errorInfo = {
                success: false,
                message: data.message || `Error ${status}`,
                error: data.error || [],
                status
            }
        } else if (error.request) {
            errorInfo = {
                success: false,
                message: 'No response received from server.',
                error: [],
                status: 0
            };
        } else {
            errorInfo = {
                success: false,
                message: 'Sin conexión al servidor. Verifica tu conexión a internet.',
                errors: ['NETWORK_ERROR'],
                status: 0
            };
        }
        //Crea error personalizado segun la informacion obtenida
        const customError = new Error(errorInfo.message);
        (customError as any).success = errorInfo.success;
        (customError as any).errors = errorInfo.errors;
        (customError as any).status = errorInfo.status;
        return customError;
    }

    //metodo para cambiar la baseURL dinamicamente
    setInstance(url: string) {
        this.baseURL = url;
        this.axiosInstance.defaults.baseURL = url;
    }

    //metodo para obtener la instancia de axios
    getInstance(): AxiosInstance {
        return this.axiosInstance;
    }


    //metodo generico GET
    async get<T>(endpoint: string, config?: AxiosRequestConfig): 
    Promise<ApiResponse<T>> {
        try {
            const response = await this.axiosInstance.get<T>(endpoint, config);
            return {
                data: response.data,
                status: response.status,
            };
        } catch (error: any) {
            throw this.handleError(error);
        }
    }

    //metodo generico POST
    async post<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): 
    Promise<any> {
        try {
            const response = await this.axiosInstance.post<T>(endpoint, data, config);
            // Retorna la respuesta del backend tal cual
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    }

    //metodo generico PUT
    async put<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.axiosInstance.put<T>(endpoint, data, config);
            return {
                data: response.data,
                status: response.status,
            };
        } catch (error: any) {
            throw this.handleError(error);
        }
    }

    //metodo generico PATCH
    async patch<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.axiosInstance.patch<T>(endpoint, data, config);
            return {
                data: response.data,
                status: response.status,
            };
        } catch (error: any) {
            throw this.handleError(error);
        }
    }

    //metodo generico DELETE
    async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.axiosInstance.delete<T>(endpoint, config);
            return {
                data: response.data,
                status: response.status,
            };
        } catch (error: any) {
            throw this.handleError(error);
        }
    }
};

export const apiService = new ApiService();
export default apiService;