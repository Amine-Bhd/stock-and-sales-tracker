import React, { useState } from 'react';
import { Product, Category } from '../types';
import { PlusCircleIcon, PlusIcon, MinusIcon, TrashIcon, TagIcon } from './icons';
import AddProductModal from './AddProductModal';
import AddCategoryModal from './AddCategoryModal';

interface StockViewProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: Omit<Product, 'id'> & { barcode: string }) => Promise<void>;
  onAddCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  onUpdateStock: (productId: string, amount: number) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
}

const StockView: React.FC<StockViewProps> = ({ products, categories, onAddProduct, onAddCategory, onUpdateStock, onDeleteProduct }) => {
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  const handleStockChange = (product: Product, amount: number) => {
    onUpdateStock(product.id, amount);
  };

  return (
    <div className="p-4 h-full flex flex-col">
      {categories.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
            <p className="text-lg">Your stock is empty.</p>
            <p>Add a category, then add your first item.</p>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto pr-2 space-y-6">
          {categories.map((category) => (
            <div key={category.id}>
              <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">{category.emoji} {category.name}</h2>
              <div className="space-y-3">
                {products.filter(p => p.categoryId === category.id).map((product) => (
                  <div key={product.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{product.emoji}</span>
                      <div>
                        <p className="font-bold text-lg">{product.name}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Price: ${product.price.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => handleStockChange(product, -1)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50" disabled={product.stock <= 0}>
                        <MinusIcon className="w-5 h-5" />
                      </button>
                      <span className="text-xl font-bold w-10 text-center">{product.stock}</span>
                      <button onClick={() => handleStockChange(product, 1)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300">
                        <PlusIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => onDeleteProduct(product.id)} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 text-red-500 ml-2">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button 
          onClick={() => setIsCategoryModalOpen(true)}
          className="w-full bg-indigo-500 text-white font-bold py-4 rounded-xl text-lg hover:bg-indigo-600 transition-colors duration-300 flex items-center justify-center gap-2"
        >
          <TagIcon className="w-6 h-6" />
          Add Category
        </button>
        <button 
          onClick={() => setIsProductModalOpen(true)}
          disabled={categories.length === 0}
          className="w-full bg-sky-500 text-white font-bold py-4 rounded-xl text-lg hover:bg-sky-600 transition-colors duration-300 flex items-center justify-center gap-2 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          <PlusCircleIcon className="w-6 h-6" />
          Add New Item
        </button>
      </div>

      {isProductModalOpen && <AddProductModal categories={categories} onClose={() => setIsProductModalOpen(false)} onAddProduct={onAddProduct} />}
      {isCategoryModalOpen && <AddCategoryModal onClose={() => setIsCategoryModalOpen(false)} onAddCategory={onAddCategory} />}
    </div>
  );
};

export default StockView;