export interface Product {
  sku: string;
  name: string;
  costPrice: number;
  quantity: number;
  brand: string;
  unitsPerBox?: number;
  color: string;
  repurchaseRule: number; 
  history?: {
    lastEditDate: string;
    previousPrice: number;
    bestPrice: number;
  }
}

export interface ProductLocation {
  id: string;
  sku: string;
  name: string;
  location: string;
  unitsPerBox: number;
  volume: number;
  date: string;
}

export interface ProductExit {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  date: string;
  exitType: 'Expedição' | 'Full';
  store?: Store; 
  observation?: string;
}

export type Role = 'ADMIN' | 'USUARIO';

export type Store = 'Shein' | 'Amazon' | 'Mercado Livre' | 'Shopee' | 'Magazine Luiza';