// Servicio de API básico
export const apiService = {
    get: async (endpoint: string) => {
        // Simulación de respuesta
        return {
            success: true,
            data: []
        };
    },
    post: async (endpoint: string, data: any) => {
        return {
            success: true,
            data: null
        };
    },
    put: async (endpoint: string, data: any) => {
        return {
            success: true,
            data: null
        };
    },
    patch: async (endpoint: string, data: any) => {
        return {
            success: true,
            data: null
        };
    },
    delete: async (endpoint: string) => {
        return {
            success: true,
            data: null
        };
    }
};
