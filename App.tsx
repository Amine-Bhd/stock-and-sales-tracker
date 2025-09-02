import React, { useState, useEffect } from 'react';
import { Product, Sale, CartItem, Category } from './types';
import PosView from './components/PosView';
import StockView from './components/StockView';
import SalesHistoryView from './components/SalesHistoryView';
import { ShoppingCartIcon, CubeIcon, ArchiveBoxIcon, SunIcon, MoonIcon } from './components/icons';

type View = 'pos' | 'stock' | 'history';
type Theme = 'light' | 'dark';

// Base URL for the API
const API_URL = 'http://localhost:3001/api';

const App: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [currentView, setCurrentView] = useState<View>('pos');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [theme, setTheme] = useState<Theme>(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            return 'dark';
        }
        return 'light';
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const [productsRes, categoriesRes, salesRes] = await Promise.all([
                    fetch(`${API_URL}/products`),
                    fetch(`${API_URL}/categories`),
                    fetch(`${API_URL}/sales`),
                ]);

                if (!productsRes.ok || !categoriesRes.ok || !salesRes.ok) {
                    throw new Error('Network response was not ok');
                }

                const productsData = await productsRes.json();
                const categoriesData = await categoriesRes.json();
                const salesData = await salesRes.json();

                setProducts(productsData);
                setCategories(categoriesData);
                setSales(salesData);

            } catch (e) {
                setError(e instanceof Error ? e.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleAddProduct = async (newProductData: Omit<Product, 'id'> & { barcode?: string }) => {
        const res = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProductData),
        });
        const createdProduct = await res.json();
        setProducts(prev => [...prev, createdProduct]);
    };

    const handleAddCategory = async (newCategoryData: Omit<Category, 'id'>) => {
        const res = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCategoryData),
        });
        const createdCategory = await res.json();
        setCategories(prev => [...prev, createdCategory]);
    };

    const handleUpdateStock = async (productId: string, amount: number) => {
        const res = await fetch(`${API_URL}/products/${productId}/stock`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount }),
        });
        const updatedProduct = await res.json();
        setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
    };

    const handleDeleteProduct = async (productId: string) => {
        await fetch(`${API_URL}/products/${productId}`, { method: 'DELETE' });
        setProducts(prev => prev.filter(p => p.id !== productId));
    }

    const handleCheckout = async (cart: CartItem[]) => {
        const res = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity
                })) 
            }),
        });
        if (!res.ok) {
            const err = await res.json();
            alert(`Checkout failed: ${err.message}`);
            // Don't clear cart on failure, allow user to correct it
            throw new Error(err.message);
        }

        const { newSale, updatedProducts } = await res.json();
        setSales(prev => [newSale, ...prev]);
        
        const updatedProductMap = new Map<string, Product>(updatedProducts.map((p: Product) => [p.id, p]));
        setProducts(prev => prev.map(p => updatedProductMap.get(p.id) || p));
    };

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    }

    const viewTitles: Record<View, string> = {
        pos: 'Sell',
        stock: 'Stock Management',
        history: 'Sales History'
    }

    const renderView = () => {
        if (loading) return <div className="flex h-full items-center justify-center text-slate-500">Loading...</div>;
        if (error) return <div className="flex h-full items-center justify-center text-red-500">Error: {error}</div>;

        switch (currentView) {
            case 'pos':
                return <PosView products={products} categories={categories} onCheckout={handleCheckout} />;
            case 'stock':
                return <StockView products={products} categories={categories} onAddProduct={handleAddProduct} onAddCategory={handleAddCategory} onUpdateStock={handleUpdateStock} onDeleteProduct={handleDeleteProduct} />;
            case 'history':
                return <SalesHistoryView sales={sales} />;
            default:
                return <PosView products={products} categories={categories} onCheckout={handleCheckout} />;
        }
    };

    const NavButton = ({ view, label, icon }: { view: View; label: string; icon: JSX.Element }) => (
        <button
            onClick={() => setCurrentView(view)}
            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${currentView === view ? 'text-sky-500' : 'text-slate-500 hover:text-sky-500 dark:text-slate-400 dark:hover:text-sky-500'}`}
        >
            {icon}
            <span className="text-xs font-medium">{label}</span>
        </button>
    );

    return (
        <div className="h-screen w-screen flex flex-col font-sans">
            <header className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{viewTitles[currentView]}</h1>
                <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                </button>
            </header>
            <main className="flex-grow overflow-hidden">
                {renderView()}
            </main>
            <nav className="flex justify-around bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-t-lg">
                <NavButton view="pos" label="Sell" icon={<ShoppingCartIcon className="w-7 h-7" />} />
                <NavButton view="stock" label="Stock" icon={<CubeIcon className="w-7 h-7" />} />
                <NavButton view="history" label="History" icon={<ArchiveBoxIcon className="w-7 h-7" />} />
            </nav>
        </div>
    );
};

export default App;