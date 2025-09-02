export interface Category {
  id: number;
  emoji: string;
  name: string;
}

export interface Product {
  id: string; // barcode
  categoryId: number;
  emoji: string;
  name: string;
  stock: number;
  price: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface SaleItem {
    productId: string;
    emoji: string;
    name: string;
    quantity: number; 
    priceAtSale: number;
}

export interface Sale {
  id: number; // transaction_id
  date: string; // ISO string for simplicity
  items: SaleItem[];
  total: number;
}
