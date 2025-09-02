import React, { useState } from 'react';
import { Product, Category } from '../types';
import { XMarkIcon } from './icons';

interface AddProductModalProps {
  categories: Category[];
  onClose: () => void;
  onAddProduct: (product: Omit<Product, 'id'> & { barcode: string }) => Promise<void>;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ categories, onClose, onAddProduct }) => {
  const [emoji, setEmoji] = useState('');
  const [name, setName] = useState('');
  const [stock, setStock] = useState('0');
  const [price, setPrice] = useState('0');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id.toString() || '');
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stockNum = parseInt(stock, 10);
    const priceNum = parseFloat(price);
    const catIdNum = parseInt(categoryId, 10);

    if (emoji && name && barcode && categoryId && !isNaN(stockNum) && !isNaN(priceNum) && stockNum >= 0 && priceNum >= 0) {
      setIsSubmitting(true);
      try {
        await onAddProduct({
          categoryId: catIdNum,
          emoji,
          name: name || emoji, // Default name to emoji if not provided
          stock: stockNum,
          price: priceNum,
          barcode,
        });
        onClose();
      } catch (error) {
        console.error("Failed to add product", error);
        alert("Failed to add product. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      alert('Please fill in all fields correctly.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
          <XMarkIcon className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-700 dark:text-slate-200">Add New Item</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-lg font-medium text-slate-600 dark:text-slate-300 mb-2 text-center">Item Symbol</label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-full text-center text-5xl p-2 bg-slate-100 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              placeholder="🍓"
              maxLength={2}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Barcode</label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none text-lg"
              placeholder="Scan or type barcode"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none text-lg"
              placeholder="e.g., Strawberry"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Category</label>
            <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none text-lg"
                required
            >
                <option value="" disabled>Select a category</option>
                {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
                ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Quantity</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none text-lg"
                placeholder="10"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Price</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none text-lg"
                placeholder="1.50"
                min="0"
                step="0.01"
              />
            </div>
          </div>
           <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-sky-500 text-white font-bold py-4 rounded-lg text-lg hover:bg-sky-600 transition-colors duration-300 flex items-center justify-center gap-2 disabled:bg-sky-400"
            >
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </button>
           </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
