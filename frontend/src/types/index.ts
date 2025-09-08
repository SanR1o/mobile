    export interface User {
        _id: string;
        username: string;
        email: string;
        role: 'admin' | 'coordinador';
        firstName: string;
        lastName: string;
        phone?: string;
        isActive: boolean;
        createdAt?: string;
        updatedAt?: string;
    }

    export interface LoginCredentials {
        email: string;
        username: string;
        password: string;
    }

    export interface LoginResponse {
        success: boolean;
        message: string;
        data: {
        user: User;
        token: string;
        expiresIn: string;
        };
    }

    export interface ChangePasswordData {
        currentPassword: string;
        newPassword: string;
    }

    export interface ApiResponse<T> {
        success?: boolean;
        message?: string;
        data: T;
        pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        };
        errors?: string[];
        status?: number;
    }

    export interface Category{
        _id: string;
        name: string;
        description?: string;
        slug: string;
        isActive: boolean;
        color?: string;
        icon?: string;
        sortOrder?: string;
        createdBy?: string;
        updatedBy?: string;
        subcategoriesCount?: number;
        productsCount?: number;
    }

    export interface Subcategory{
        _id: string;
        name: string;
        description?: string;
        categoryId: Category | string;
        slug: string;
        isActive: boolean;
        color?: string;
        icon?: string;
        sortOrder?: string;
        createdBy?: string;
        updatedBy?: string;
        productsCount?: number;
    }

    //producto
    export interface Product{
        _id: string;
        name: string;
        shortDescription: string;
        description: string;
        categoryId: Category | string;
        subcategoryId: Subcategory | string;
        slug: string;
        sku: string;
        price: number;
        comparePrice?: number;
        cost?: number;
        isActive: boolean;
        createdAt?: string;
        updatedAt?: string;
        stock: ProductStock;
        tags?: string[];
        dimensions?: ProductDimensions;
        seoTitle?: string;
        seoDescription?: string;
        image: ProductImage[];
        isFeatured: string;
        isDigital: string;
        sortOrder: string;
        profitMargin?: boolean;
        isLowStock?: boolean;
        isOutOfStock?: boolean;
        primaryImage: ProductImage;
    }

    export interface ProductImage {
        url: string;
        alt?: string;
        isPrimary?: boolean;
    }

    export interface ProductStock {
        quantity: number;
        minStock: number;
        trackStock: boolean;
    }

    export interface ProductDimensions {
        weight?: number;
        length?: number;
        width?: number;
        height?: number;
    }

    export interface CreateUserData {
        username: string;
        email: string;
        role: 'admin' | 'coordinador';
        firstName: string;
        lastName: string;
        phone?: string;
        isActive: boolean;
    }

    export interface UpdateUserData {
        username: string;
        email: string;
        role: 'admin' | 'coordinador';
        firstName: string;
        lastName: string;
        phone?: string;
        isActive: boolean;
    }

    export interface CreateCategoryData{
        name: string;
        description?: string;
        slug: string;
        isActive: boolean;
        color?: string;
        icon?: string;
        sortOrder?: string;
    }

    export interface UpdateCategoryData{
        name: string;
        description?: string;
        slug: string;
        isActive: boolean;
        color?: string;
        icon?: string;
        sortOrder?: string;
    }

    export interface CreateSubcategoryData{
        name: string;
        description?: string;
        categoryId: Category | string;
        slug: string;
        isActive: boolean;
        color?: string;
        icon?: string;
        sortOrder?: string;
    }

    export interface UpdateSubcategoryData{
        name: string;
        description?: string;
        categoryId: Category | string;
        slug: string;
        isActive: boolean;
        color?: string;
        icon?: string;
        sortOrder?: string;
    }

    export interface CreateProductData{
        name: string;
        shortDescription: string;
        description: string;
        categoryId: Category | string;
        subcategoryId: Subcategory | string;
        slug: string;
        sku: string;
        price: number;
        cost?: number;
        isActive: boolean;
        stock: ProductStock;
        tags?: string[];
        dimensions?: ProductDimensions;
        seoTitle?: string;
        seoDescription?: string;
        image: ProductImage[];
        isFeatured: string;
        isDigital: string;
        sortOrder: string;
        primaryImage: ProductImage;
    }

    export interface UpdateProductData{
        name: string;
        shortDescription: string;
        description: string;
        categoryId: Category | string;
        subcategoryId: Subcategory | string;
        slug: string;
        sku: string;
        price: number;
        cost?: number;
        isActive: boolean;
        stock: ProductStock;
        tags?: string[];
        dimensions?: ProductDimensions;
        seoTitle?: string;
        seoDescription?: string;
        image: ProductImage[];
        isFeatured: string;
        isDigital: string;
        sortOrder: string;
        primaryImage: ProductImage;
    }

    export interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    hasRole: (role: 'admin' | 'coordinador') => boolean;
    canDelete: () => boolean;
    canEdit: () => boolean;
    }

    //tipos para la negacion
    export type RootStackParamList = {
        Login: undefined;
        Main: undefined;
    };

    export type MainTabParamList = {
    Home: undefined;
    Users: undefined;
    Category: undefined;
    Subcategory: undefined;
    Products: undefined;
    Profile: undefined;
    };

    export type UsersStackParamList = {
    UsersList: undefined;
    UserDetail: {userId: string};
    UserForm: {userId?: string}
    };

    export type CategoryStackParamList = {
    CategoryList: undefined;
    CategoryDetail: { categoryId: string };
    CategoryForm: { categoryId?: string };
    };

    export type SubcategoryStackParamList = {
    SubcategoryList: undefined;
    SubcategoryDetail: { subcategoryId: string };
    SubcategoryForm: { subcategoryId?: string };
    };

    export type ProductStackParamList = {
    ProductList: undefined;
    ProductDetail: { productId: string };
    ProductForm: { productId?: string };
    };