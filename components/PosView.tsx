import React, { useState } from 'react';
import { Product, CartItem, Category } from '../types';
import { PlusIcon, MinusIcon, ChevronLeftIcon, QrCodeIcon } from './icons';
import BarcodeScannerModal from './BarcodeScannerModal';

interface PosViewProps {
  products: Product[];
  categories: Category[];
  onCheckout: (cart: CartItem[]) => Promise<void>;
}

const PosView: React.FC<PosViewProps> = ({ products, categories, onCheckout }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.stock) {
            return prevCart.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return prevCart;
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const updateCartQuantity = (productId: string, amount: number) => {
    setCart((prevCart) => {
        const itemToUpdate = prevCart.find(item => item.id === productId);
        if(!itemToUpdate) return prevCart;

        const newQuantity = itemToUpdate.quantity + amount;
        
        if (newQuantity <= 0) {
            return prevCart.filter((item) => item.id !== productId);
        }
        
        if (newQuantity > itemToUpdate.stock) {
            return prevCart;
        }

        return prevCart.map(item => item.id === productId ? {...item, quantity: newQuantity} : item);
    });
  };

  const handleScanSuccess = (decodedText: string) => {
    setIsScannerOpen(false);
    const product = products.find(p => p.id === decodedText);
    if (product) {
        addToCart(product);
    } else {
        alert('Product not found for this barcode.');
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if(cart.length > 0) {
        setIsCheckingOut(true);
        await onCheckout(cart);
        setCart([]);
        setIsCheckingOut(false);
    }
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const visibleProducts = selectedCategoryId ? products.filter(p => p.categoryId === selectedCategoryId) : [];

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Product Grid */}
      <div className="lg:w-2/3 p-4 flex flex-col relative">
        {!selectedCategory ? (
          <>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Categories</h2>
                <button 
                  onClick={() => setIsScannerOpen(true)}
                  className="bg-sky-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-sky-600 transition-colors"
                >
                  <QrCodeIcon className="w-6 h-6" />
                  <span>Scan</span>
                </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 overflow-y-auto" style={{maxHeight: 'calc(100vh - 200px)'}}>
                {categories.map(category => (
                    <button
                        key={category.id}
                        onClick={() => setSelectedCategoryId(category.id)}
                        className="aspect-square bg-white dark:bg-slate-800 rounded-xl shadow-md flex flex-col items-center justify-center p-2 text-center transition-transform transform hover:scale-105 active:scale-95"
                    >
                         <span className="text-4xl md:text-5xl">{category.emoji}</span>
                         <span className="mt-2 font-semibold text-sm text-center">{category.name}</span>
                    </button>
                ))}
            </div>
          </>
        ) : (
            <>
                <div className="mb-4 flex items-center gap-4">
                     <button onClick={() => setSelectedCategoryId(null)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                        <ChevronLeftIcon className="w-6 h-6" />
                     </button>
                     <h2 className="text-2xl font-bold">{selectedCategory.emoji} {selectedCategory.name}</h2>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 overflow-y-auto" style={{maxHeight: 'calc(100vh - 250px)'}}>
                {visibleProducts.map((product) => (
                    <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                    className="relative aspect-square bg-white dark:bg-slate-800 rounded-xl shadow-md flex flex-col items-center justify-center p-2 text-center transition-transform transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                    >
                    <span className="text-4xl md:text-5xl">{product.emoji}</span>
                    <span className="absolute top-1 right-1 bg-sky-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {product.stock}
                    </span>
                    <span className="absolute bottom-1 text-xs font-semibold text-slate-600 dark:text-slate-300">${product.price.toFixed(2)}</span>
                    </button>
                ))}
                </div>
            </>
        )}
      </div>

      {/* Cart */}
      <div className="lg:w-1/3 bg-white dark:bg-slate-800/50 p-4 flex flex-col shadow-lg border-l border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-4">Current Sale</h2>
        <div className="flex-grow overflow-y-auto">
          {cart.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
              <p>Tap an item or scan a barcode.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {cart.map((item) => (
                <li key={item.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{item.emoji}</span>
                    <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateCartQuantity(item.id, -1)} className="p-1 rounded-full bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500">
                      <MinusIcon className="w-4 h-4" />
                    </button>
                    <span className="font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateCartQuantity(item.id, 1)} className="p-1 rounded-full bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500" disabled={item.quantity >= item.stock}>
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-4 pt-4 border-t-2 border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center text-2xl font-bold mb-4">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isCheckingOut}
            className="w-full bg-green-500 text-white font-bold py-4 rounded-xl text-lg hover:bg-green-600 transition-colors duration-300 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            {isCheckingOut ? 'Processing...' : 'Checkout'}
          </button>
        </div>
      </div>
      {isScannerOpen && <BarcodeScannerModal onScanSuccess={handleScanSuccess} onClose={() => setIsScannerOpen(false)} />}
    </div>
  );
};

export default PosView;
