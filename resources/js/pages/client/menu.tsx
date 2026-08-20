import { Head, Link, useForm, usePage } from '@inertiajs/react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { loadMercadoPagoSdk } from '@/lib/load-mercadopago';
import {
    ShoppingBag,
    Trash2,
    Plus,
    Minus,
    X,
    Banknote,
    CreditCard,
    QrCode,
    ArrowRight,
    Search
} from 'lucide-react';

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image?: string;
    category_id: number;
    active: boolean;
}

interface Category {
    id: number;
    name: string;
    products: Product[];
}

interface CartItem {
    product_id: number;
    name: string;
    price: number;
    quantity: number;
}

interface UserProps {
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
}

interface PageProps {
    categories: Category[];
    user: UserProps;
    mercadoPagoPublicKey: string;
    errors: Record<string, string>;
}

export default function ClientMenu() {
    const { categories, user, mercadoPagoPublicKey } = usePage<PageProps>().props;

    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [phone, setPhone] = useState(user.phone || '');

    const form = useForm({
        items: [] as CartItem[],
        total_price: 0,
        phone: phone || '',
        payment_method: 'cash',
        payment_gateway_id: '',
        payment_gateway_status: '',
    });

    // Aplanamos todos los productos de las categorías para la búsqueda y filtrado general
    const allProducts = useMemo(() => categories.flatMap(cat => cat.products), [categories]);

    const filteredProducts = useMemo(() => {
        return allProducts.filter((product) => {
            const matchesCategory = selectedCategory === null || product.category_id === selectedCategory;
            const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [allProducts, selectedCategory, search]);

    const formatMoney = useCallback((amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
    }, []);

    const addToCart = useCallback((product: Product) => {
        const existingIndex = form.data.items.findIndex(item => item.product_id === product.id);
        const updatedItems = [...form.data.items];

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
    }, [form.data.items]);

    const updateQuantity = useCallback((productId: number, delta: number) => {
        const updatedItems = form.data.items
            .map(item => {
                if (item.product_id === productId) {
                    const newQty = item.quantity + delta;
                    return newQty > 0 ? { ...item, quantity: newQty } : null;
                }
                return item;
            })
            .filter(Boolean) as CartItem[];

        updateCart(updatedItems);
    }, [form.data.items]);

    const removeFromCart = useCallback((productId: number) => {
        const updatedItems = form.data.items.filter(item => item.product_id !== productId);
        updateCart(updatedItems);
    }, [form.data.items]);

    const updateCart = useCallback((newItems: CartItem[]) => {
        const total = newItems.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);
        form.setData(prev => ({
            ...prev,
            items: newItems,
            total_price: total
        }));
    }, [form.setData]);

    const clearCart = useCallback(() => {
        form.setData(prev => ({
            ...prev,
            items: [],
            total_price: 0,
        }));
    }, [form.setData]);

    const handleSubmitOrder = (
        e?: React.FormEvent,
        gatewayId?: string,
        gatewayStatus?: string
    ) => {
        if (e) e.preventDefault();

        if (form.data.items.length === 0) return;

        form.setData(prev => ({
            ...prev,
            phone: phone || prev.phone,
            payment_gateway_id: gatewayId || '',
            payment_gateway_status: gatewayStatus || '',
        }));

        form.post('/mi-cuenta/pedido', {
            onError: (errors) => {
                console.error('Errores de validación al crear el pedido:', errors);
            },
        });
    };

    // Efecto para inicializar el Brick de Mercado Pago si elige pagar con tarjeta
    useEffect(() => {
        if (form.data.payment_method === 'card' && mercadoPagoPublicKey && form.data.total_price > 0) {
            let brickController: any = null;

            loadMercadoPagoSdk()
                .then(() => {
                    const MercadoPago = (window as any).MercadoPago;
                    if (!MercadoPago) return;

                    const mp = new MercadoPago(mercadoPagoPublicKey);
                    const bricksBuilder = mp.bricks();

                    const renderPaymentBrick = async (builder: any) => {
                        const settings = {
                            initialization: {
                                amount: form.data.total_price,
                                payer: {
                                    email: user.email || 'comprador_123@gmail.com',
                                },
                            },
                            customization: {
                                paymentMethods: {
                                    creditCard: 'all',
                                    debitCard: 'all',
                                },
                                visual: {
                                    style: {
                                        theme: 'dark',
                                    },
                                },
                            },
                            callbacks: {
                                onReady: () => {},
                                onSubmit: ({ formData }: any) => {
                                    return new Promise<void>((resolve, reject) => {
                                        const xsrfToken = decodeURIComponent(
                                            document.cookie
                                                .split('; ')
                                                .find((row) => row.startsWith('XSRF-TOKEN='))
                                                ?.split('=')[1] || ''
                                        );

                                        fetch('/pagos/mercadopago', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-XSRF-TOKEN': xsrfToken,
                                            },
                                            body: JSON.stringify({
                                                ...formData,
                                                transaction_amount: form.data.total_price,
                                                payer: {
                                                    ...formData.payer,
                                                    email: user.email || 'comprador_123@gmail.com',
                                                },
                                            }),
                                        })
                                            .then(async (res) => {
                                                const data = await res.json();
                                                if (!res.ok) {
                                                    console.error('Error del servidor:', data);
                                                    throw new Error(data.message?.message || 'Error en el pago');
                                                }
                                                return data;
                                            })
                                            .then((data) => {
                                                if (data.status === 'approved' || data.status === 'in_process') {
                                                    handleSubmitOrder(undefined, String(data.id), data.status);
                                                    resolve();
                                                } else {
                                                    console.warn('Pago no aprobado:', data);
                                                    reject();
                                                }
                                            })
                                            .catch((err) => {
                                                console.error('Error en la petición de pago:', err);
                                                reject();
                                            });
                                    });
                                },
                                onError: (error: any) => {
                                    console.error('MercadoPago Error:', error);
                                },
                            },
                        };

                        brickController = await builder.create('payment', 'paymentBrick_container', settings);
                    };

                    renderPaymentBrick(bricksBuilder);
                })
                .catch((err) => console.error(err));

            return () => {
                if (brickController) {
                    brickController.unmount();
                }
            };
        }
    }, [form.data.payment_method, form.data.total_price, mercadoPagoPublicKey]);

    return (
        <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen bg-background font-sans text-foreground lg:overflow-hidden">
            <Head title="Hacer un Pedido" />

            <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Menú de Pedidos</h1>
                            <p className="text-sm text-muted-foreground">{filteredProducts.length} productos disponibles</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/mi-cuenta/dashboard"
                            className="text-sm text-amber-500 hover:text-amber-400 font-medium transition-colors whitespace-nowrap"
                        >
                            ← Volver a mis pedidos
                        </Link>
                    </div>
                </div>

                <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-2 pb-4 bg-background/90 dark:bg-background/80 backdrop-blur-xl space-y-3">
                    <div className="relative w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Buscar producto por nombre..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-sm transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer ${
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
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                                    selectedCategory === category.id
                                        ? 'bg-primary text-white dark:text-black shadow-md shadow-primary/20'
                                        : 'bg-card text-foreground border border-border hover:bg-white/5'
                                }`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {filteredProducts.map((product) => {
                        const inCart = form.data.items.find(item => item.product_id === product.id);

                        return (
                            <div
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="group bg-card rounded-2xl border border-border p-3 flex flex-col justify-between hover:shadow-xl dark:hover:shadow-none hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden active:scale-[0.98]"
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
                                    <div>
                                        <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-1 group-hover:text-primary dark:group-hover:text-primary transition-colors">
                                            {product.name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                                            {product.description}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-border">
                                        <span className="font-bold text-foreground text-sm sm:text-base">
                                            {formatMoney(product.price)}
                                        </span>
                                        <div
                                            className={`p-1.5 rounded-lg border transition-all ${
                                                inCart
                                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                                    : 'bg-background border-border text-foreground group-hover:bg-primary group-hover:text-white dark:group-hover:text-black'
                                            }`}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                {inCart && (
                                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                                        {inCart.quantity}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="w-full lg:w-96 bg-card border-t lg:border-t-0 lg:border-l border-border flex flex-col lg:h-full shadow-lg dark:shadow-none lg:overflow-y-auto">
                
                <div className="p-5 border-b border-border flex items-center justify-between shrink-0">
                    <h2 className="text-lg font-bold text-foreground">Orden Actual</h2>
                    {form.data.items.length > 0 && (
                        <button
                            type="button"
                            onClick={clearCart}
                            className="text-xs font-semibold text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Vaciar
                        </button>
                    )}
                </div>

                {form.errors.items && (
                    <div className="mx-4 mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs shrink-0">
                        {form.errors.items}
                    </div>
                )}

                <div className="p-4 space-y-3 shrink-0">
                    {form.data.items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2 py-8 lg:py-12">
                            <ShoppingBag className="w-10 h-10 lg:w-12 lg:h-12 stroke-1" />
                            <p className="text-sm">El carrito está vacío</p>
                        </div>
                    ) : (
                        form.data.items.map((item) => (
                            <div
                                key={item.product_id}
                                className="bg-background border border-border rounded-xl p-3 flex flex-col gap-2"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <span className="font-medium text-foreground text-sm leading-tight">
                                        {item.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeFromCart(item.product_id)}
                                        className="text-muted-foreground hover:text-[#e63946] dark:hover:text-[#e63946] transition-colors p-0.5 cursor-pointer"
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
                                            type="button"
                                            onClick={() => updateQuantity(item.product_id, -1)}
                                            className="p-1 hover:bg-white/5 rounded text-foreground transition-colors cursor-pointer"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-xs font-bold w-5 text-center text-foreground">
                                            {item.quantity}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => updateQuantity(item.product_id, 1)}
                                            className="p-1 hover:bg-white/5 rounded text-foreground transition-colors cursor-pointer"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <form onSubmit={(e) => handleSubmitOrder(e)} className="p-5 border-t border-border bg-background/50 dark:bg-white/[0.02] space-y-4 pb-12">

                    {!user.phone && (
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Teléfono de contacto *
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                placeholder="Ej: +54 3446 123456"
                                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Tipo de Entrega
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'takeaway', label: 'Retiro en Local' },
                                { id: 'delivery', label: 'Envío a Domicilio' },
                            ].map((type) => {
                                const isSelected = form.data.delivery_type === type.id;

                                return (
                                    <button
                                        type="button"
                                        key={type.id}
                                        onClick={() => form.setData('delivery_type', type.id as any)}
                                        className={`flex items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
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

                        {form.data.delivery_type === 'delivery' && (
                            <input
                                type="text"
                                placeholder="Dirección de entrega..."
                                value={form.data.delivery_address}
                                onChange={(e) => form.setData('delivery_address', e.target.value)}
                                required
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
                                const isSelected = form.data.payment_method === method.id;

                                return (
                                    <button
                                        type="button"
                                        key={method.id}
                                        onClick={() => form.setData('payment_method', method.id as any)}
                                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium gap-1.5 transition-all cursor-pointer ${
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

                    {form.data.payment_method === 'card' && (
                        <div id="paymentBrick_container" className="pt-2 min-h-[250px]"></div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                        <span className="text-sm font-medium text-muted-foreground">Total Orden</span>
                        <span className="text-2xl font-black text-foreground">
                            {formatMoney(form.data.total_price)}
                        </span>
                    </div>

                    {form.data.payment_method !== 'card' && (
                        <button
                            type="submit"
                            disabled={form.processing || form.data.items.length === 0 || (!user.phone && !phone)}
                            className="w-full py-3.5 bg-primary hover:bg-[#d46d2e] disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-black font-bold rounded-xl shadow-lg shadow-primary/25 dark:shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                        >
                            Confirmar Pedido <ArrowRight className="w-5 h-5" />
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}