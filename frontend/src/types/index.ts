// Tipos globales para productos, categorías y subcategorías

export interface Category {
  id: string;
  name: string;
  description?: string;
  // Puedes agregar más campos según tu backend
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  description?: string;
  // Puedes agregar más campos según tu backend
}

export interface Product {
  id: string;
  name: string;
  shortDescription?: string;
  description?: string;
  categoryId: string;
  subcategoryId: string;
  slug?: string;
  sku: string;
  price: number;
  comparePrice?: number;
  cost?: number;
  stockQuantity: number;
  minStock: number;
  stock: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  // Puedes agregar más campos según tu backend
}
