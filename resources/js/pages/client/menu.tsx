import { Head, Link, useForm, usePage } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
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
    ArrowRight 
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

    // Aplanamos todos los productos de las categorías para la búsqueda y filtrado general
    const allProducts = categories.flatMap(cat => cat.products);

    const filteredProducts = allProducts.filter((product) => {
        const matchesCategory = selectedCategory === null || product.category_id === selectedCategory;
        const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const form = useForm({
        payment_method: 'effective',
        delivery_type: 'takeaway',
        delivery_address: user.address || '',
        phone: user.phone || '',
        items: [] as CartItem[],
        total_price: 0,
        payment_gateway_id: '',
        payment_gateway_status: '',
    });

    const addToCart = (product: Product) => {
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
    };

    const updateQuantity = (productId: number, delta: number) => {
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
    };

    const removeFromCart = (productId: number) => {
        const updatedItems = form.data.items.filter(item => item.product_id !== productId);
        updateCart(updatedItems);
    };

    const clearCart = () => {
        updateCart([]);
    };

    const updateCart = (newItems: CartItem[]) => {
        const total = newItems.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);
        form.setData(prev => ({
            ...prev,
            items: newItems,
            total_price: total
        }));
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
    };

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
        <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen bg-slate-50 dark:bg-[#09090b] font-sans text-slate-800 dark:text-white lg:overflow-hidden">
            <Head title="Hacer un Pedido" />

            <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Menú de Pedidos</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{filteredProducts.length} productos disponibles</p>
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

                <div className="relative w-full">
                    <input
                        type="text"
                        placeholder="Buscar producto por nombre..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 shadow-sm transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                            selectedCategory === null
                                ? 'bg-amber-500 text-white dark:text-black shadow-md shadow-amber-500/20'
                                : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'
                        }`}
                    >
                        Todos
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                                selectedCategory === category.id
                                    ? 'bg-amber-500 text-white dark:text-black shadow-md shadow-amber-500/20'
                                    : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'
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
                            className="group bg-white dark:bg-white/[0.03] rounded-2xl border border-slate-200 dark:border-white/10 p-3 flex flex-col justify-between hover:shadow-lg dark:hover:shadow-none hover:border-amber-500/40 transition-all cursor-pointer relative overflow-hidden active:scale-95"
                        >
                            <div className="w-full h-28 sm:h-36 bg-slate-100 dark:bg-white/5 rounded-xl overflow-hidden mb-3 relative">
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs text-center px-2">
                                        Sin imagen
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-semibold text-slate-800 dark:text-white text-sm line-clamp-2 mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                        {product.name}
                                    </h3>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1 mb-2">
                                        {product.description}
                                    </p>
                                </div>
                                
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/10">
                                    <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                                        {formatMoney(product.price)}
                                    </span>
                                    <div className="p-1.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-lg group-hover:bg-amber-500 group-hover:text-white dark:group-hover:text-black transition-colors">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-full lg:w-96 bg-white dark:bg-white/[0.03] border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-white/10 flex flex-col lg:h-full shadow-lg dark:shadow-none lg:overflow-y-auto">
                
                <div className="p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between shrink-0">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Orden Actual</h2>
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
                        <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-2 py-8 lg:py-12">
                            <ShoppingBag className="w-10 h-10 lg:w-12 lg:h-12 stroke-1" />
                            <p className="text-sm">El carrito está vacío</p>
                        </div>
                    ) : (
                        form.data.items.map((item) => (
                            <div
                                key={item.product_id}
                                className="bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-xl p-3 flex flex-col gap-2"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <span className="font-medium text-slate-800 dark:text-slate-200 text-sm leading-tight">
                                        {item.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeFromCart(item.product_id)}
                                        className="text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors p-0.5 cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between mt-1">
                                    <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                                        {formatMoney(item.price * item.quantity)}
                                    </span>

                                    <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-1">
                                        <button
                                            type="button"
                                            onClick={() => updateQuantity(item.product_id, -1)}
                                            className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-xs font-bold w-5 text-center text-slate-800 dark:text-white">
                                            {item.quantity}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => updateQuantity(item.product_id, 1)}
                                            className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <form onSubmit={(e) => handleSubmitOrder(e)} className="p-5 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] space-y-4 pb-12">

                    {!user.phone && (
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Teléfono de contacto *
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                placeholder="Ej: +54 3446 123456"
                                className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
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
                                                ? 'bg-amber-500 border-amber-500 text-white dark:text-black shadow-sm'
                                                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
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
                                className="w-full mt-2 px-3 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
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
                                                ? 'bg-amber-500 border-amber-500 text-white dark:text-black shadow-sm'
                                                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
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
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Orden</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {formatMoney(form.data.total_price)}
                        </span>
                    </div>

                    {form.data.payment_method !== 'card' && (
                        <button
                            type="submit"
                            disabled={form.processing || form.data.items.length === 0 || (!user.phone && !phone)}
                            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-black font-bold rounded-xl shadow-lg shadow-amber-500/25 dark:shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                        >
                            Confirmar Pedido <ArrowRight className="w-5 h-5" />
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}