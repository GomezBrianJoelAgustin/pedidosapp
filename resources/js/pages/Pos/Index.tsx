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
        const updatedItems = [...data.items];

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

        if (data.items.length === 0) {
return;
}

        post(route('admin.pos.store'));
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen bg-background font-sans text-foreground lg:overflow-hidden">

            <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Punto de Venta</h1>
                            <p className="text-sm text-muted-foreground">{filteredProducts.length} productos disponibles</p>
                        </div>
                    </div>

                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar producto por nombre..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-sm transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                            selectedCategory === null
                                ? 'bg-primary text-white dark:text-black shadow-md shadow-primary/20'
                                : 'bg-card text-foreground border border-border hover:bg-white/5'
                        }`}
                    >
                        Todos
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                                selectedCategory === category.id
                                    ? 'bg-primary text-white dark:text-black shadow-md shadow-primary/20'
                                    : 'bg-card text-foreground border border-border hover:bg-white/5'
                            }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {filteredProducts.map((product) => (
                        <div
                            key={product.id}
                            onClick={() => addToCart(product)}
                            className="group bg-card rounded-2xl border border-border p-3 flex flex-col justify-between hover:shadow-lg dark:hover:shadow-none hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden active:scale-95"
                        >
                            <div className="w-full h-28 sm:h-36 bg-background border border-border rounded-xl overflow-hidden mb-3 relative">
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center px-2">
                                        Sin imagen
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col justify-between">
                                <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-2 group-hover:text-primary dark:group-hover:text-primary transition-colors">
                                    {product.name}
                                </h3>
                                
                                <div className="flex items-center justify-between pt-2 border-t border-border">
                                    <span className="font-bold text-foreground text-sm sm:text-base">
                                        {formatMoney(product.price)}
                                    </span>
                                    <div className="p-1.5 bg-background border border-border text-foreground rounded-lg group-hover:bg-primary group-hover:text-white dark:group-hover:text-black transition-colors">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-full lg:w-96 bg-card border-t lg:border-t-0 lg:border-l border-border flex flex-col lg:h-full shadow-lg dark:shadow-none">
                
                <div className="p-5 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground">Orden Actual</h2>
                    {data.items.length > 0 && (
                        <button
                            onClick={clearCart}
                            className="text-xs font-semibold text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Vaciar
                        </button>
                    )}
                </div>

                <div className="max-h-64 lg:max-h-none lg:flex-1 overflow-y-auto p-4 space-y-3">
                    {data.items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 py-8 lg:py-12">
                            <ShoppingBag className="w-10 h-10 lg:w-12 lg:h-12 stroke-1" />
                            <p className="text-sm">El carrito está vacío</p>
                        </div>
                    ) : (
                        data.items.map((item) => (
                            <div
                                key={item.product_id}
                                className="bg-background border border-border rounded-xl p-3 flex flex-col gap-2"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <span className="font-medium text-foreground text-sm leading-tight">
                                        {item.name}
                                    </span>
                                    <button
                                        onClick={() => removeFromCart(item.product_id)}
                                        className="text-muted-foreground hover:text-[#e63946] dark:hover:text-[#e63946] transition-colors p-0.5"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between mt-1">
                                    <span className="font-bold text-primary text-sm">
                                        {formatMoney(item.price * item.quantity)}
                                    </span>

                                    <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-1">
                                        <button
                                            onClick={() => updateQuantity(item.product_id, -1)}
                                            className="p-1 hover:bg-white/5 rounded text-foreground transition-colors"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-xs font-bold w-5 text-center text-foreground">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.product_id, 1)}
                                            className="p-1 hover:bg-white/5 rounded text-foreground transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <form onSubmit={handleCheckout} className="p-5 border-t border-border bg-background/50 dark:bg-white/[0.02] space-y-4">

                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
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
                                                ? 'bg-primary border-primary text-white dark:text-black shadow-sm'
                                                : 'bg-card border-border text-foreground hover:bg-white/5'
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
                                className="w-full mt-2 px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
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
                                                ? 'bg-primary border-primary text-white dark:text-black shadow-sm'
                                                : 'bg-card border-border text-foreground hover:bg-white/5'
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
                        <span className="text-sm font-medium text-muted-foreground">Total Orden</span>
                        <span className="text-2xl font-black text-foreground">
                            {formatMoney(data.total_price)}
                        </span>
                    </div>

                    <button
                        type="submit"
                        disabled={processing || data.items.length === 0}
                        className="w-full py-3.5 bg-primary hover:bg-[#d46d2e] disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-black font-bold rounded-xl shadow-lg shadow-primary/25 dark:shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                        Cobrar Venta <ArrowRight className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}