
export enum Category {
  SMARTPHONES = 'Smartphones',
  LAPTOPS = 'Laptops',
  ACESSORIOS = 'Acessórios',
  TABLETS = 'Tablets',
  AUDIO = 'Áudio',
  OUTROS = 'Outros'
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  price: number;
  lastUpdated: number;
}

export type SortField = 'name' | 'quantity' | 'price' | 'category';
export type SortOrder = 'asc' | 'desc';

export interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  categoryDistribution: { name: string; value: number }[];
}
