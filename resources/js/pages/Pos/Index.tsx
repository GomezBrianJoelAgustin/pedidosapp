import { useForm } from '@inertiajs/react';
import { 
    Search, 
    ShoppingBag, 
    Trash2, 
    Plus, 
    Minus, 
    X, 
    Banknote, 
    CreditCard, 
    QrCode, 
    ArrowRight 
} from 'lucide-react';
import React, { useState } from 'react';


interface Product {
    id: number;
    name: string;
    price: number;
    image?: string;
    category_id: number;
}

interface Category {
    id: number;
    name: string;
}

interface CartItem {
    product_id: number;
    name: string;
    price: number;
    quantity: number;
}

export default function PosIndex({ categories = [], products = [] }: { categories: Category[], products: Product[] }) {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [search, setSearch] = useState('');

    const { data, setData, post, processing } = useForm({
        payment_method: 'effective',
        delivery_type: 'takeaway',
        delivery_address: '',
        items: [] as CartItem[],
        total_price: 0,
    });

    const filteredProducts = products.filter((product) => {
        const matchesCategory = selectedCategory === null || product.category_id === selectedCategory;
        const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const addToCart = (product: Product) => {
        const existingIndex = data.items.findIndex(item => item.product_id === product.id);
        let updatedItems = [...data.items];

        if (existingIndex > -1) {
            updatedItems[existingIndex].quantity += 1;
        } else {
            updatedItems.push({
                product_id: product.id,
                name: product.name,
                price: Number(product.price),
                quantity: 1,
            });
        }

        updateCart(updatedItems);
    };

    const updateQuantity = (productId: number, delta: number) => {
        const updatedItems = data.items
            .map(item => {
                if (item.product_id === productId) {
                    const newQty = item.quantity + delta;
                    return newQty > 0 ? { ...item, quantity: newQty } : null;
                }
                return item;
            })
            .filter(Boolean) as CartItem[];

        updateCart(updatedItems);
    };

    const removeFromCart = (productId: number) => {
        const updatedItems = data.items.filter(item => item.product_id !== productId);
        updateCart(updatedItems);
    };

    const clearCart = () => {
        updateCart([]);
    };

    const updateCart = (newItems: CartItem[]) => {
        const total = newItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        setData(prev => ({
            ...prev,
            items: newItems,
            total_price: total
        }));
    };

    const handleCheckout = (e: React.FormEvent) => {
        e.preventDefault();
        if (data.items.length === 0) return;
        post(route('admin.pos.store'));
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
            
            <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Punto de Venta</h1>
                            <p className="text-sm text-slate-500">{filteredProducts.length} productos disponibles</p>
                        </div>
                    </div>

                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar producto por nombre..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-sm transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                            selectedCategory === null
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        Todos
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                selectedCategory === category.id
                                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => (
                        <div
                            key={product.id}
                            onClick={() => addToCart(product)}
                            className="group bg-white rounded-2xl border border-slate-200 p-3 flex flex-col justify-between hover:shadow-lg hover:border-amber-500/40 transition-all cursor-pointer relative overflow-hidden"
                        >
                            <div className="w-full h-36 bg-slate-100 rounded-xl overflow-hidden mb-3 relative">
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        Sin imagen
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col justify-between">
                                <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 mb-2 group-hover:text-amber-600 transition-colors">
                                    {product.name}
                                </h3>
                                
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <span className="font-bold text-slate-900 text-base">
                                        {formatMoney(product.price)}
                                    </span>
                                    <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-full lg:w-96 bg-white border-l border-slate-200 flex flex-col h-full shadow-lg">
                
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">Orden Actual</h2>
                    {data.items.length > 0 && (
                        <button
                            onClick={clearCart}
                            className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Vaciar
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {data.items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-12">
                            <ShoppingBag className="w-12 h-12 stroke-1" />
                            <p className="text-sm">El carrito está vacío</p>
                        </div>
                    ) : (
                        data.items.map((item) => (
                            <div
                                key={item.product_id}
                                className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col gap-2"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <span className="font-medium text-slate-800 text-sm leading-tight">
                                        {item.name}
                                    </span>
                                    <button
                                        onClick={() => removeFromCart(item.product_id)}
                                        className="text-slate-400 hover:text-red-500 transition-colors p-0.5"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between mt-1">
                                    <span className="font-bold text-amber-600 text-sm">
                                        {formatMoney(item.price * item.quantity)}
                                    </span>

                                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                                        <button
                                            onClick={() => updateQuantity(item.product_id, -1)}
                                            className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-xs font-bold w-5 text-center text-slate-800">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.product_id, 1)}
                                            className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                

                <form onSubmit={handleCheckout} className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4">

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Tipo de Entrega
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'takeaway', label: 'Retiro en Local' },
                                { id: 'delivery', label: 'Con Cadete' },
                            ].map((type) => {
                                const isSelected = data.delivery_type === type.id;
                                return (
                                    <button
                                        type="button"
                                        key={type.id}
                                        onClick={() => setData('delivery_type', type.id)}
                                        className={`flex items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                                            isSelected
                                                ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {type.label}
                                    </button>
                                );
                            })}
                        </div>

                        {data.delivery_type === 'delivery' && (
                            <input
                                type="text"
                                placeholder="Dirección de entrega..."
                                value={data.delivery_address}
                                onChange={(e) => setData('delivery_address', e.target.value)}
                                className="w-full mt-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Método de Pago
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'effective', label: 'Efectivo', icon: Banknote },
                                { id: 'card', label: 'Tarjeta', icon: CreditCard },
                                { id: 'transfer', label: 'Transfer.', icon: QrCode },
                            ].map((method) => {
                                const Icon = method.icon;
                                const isSelected = data.payment_method === method.id;
                                return (
                                    <button
                                        type="button"
                                        key={method.id}
                                        onClick={() => setData('payment_method', method.id)}
                                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium gap-1.5 transition-all ${
                                            isSelected
                                                ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {method.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <span className="text-sm font-medium text-slate-600">Total Orden</span>
                        <span className="text-2xl font-black text-slate-900">
                            {formatMoney(data.total_price)}
                        </span>
                    </div>

                    <button
                        type="submit"
                        disabled={processing || data.items.length === 0}
                        className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                        Cobrar Venta <ArrowRight className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}