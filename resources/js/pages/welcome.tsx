import { Head, Link, useForm, usePage, router  } from '@inertiajs/react';
import { ShoppingBag, Plus, Minus, X, CheckCircle } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import FlashAlert from '@/components/flash-alert';  
import { loadMercadoPagoSdk } from '@/lib/load-mercadopago';



interface Product {
    id: number;
    name: string;
    description?: string;
    price: number | string;
    image?: string;
}

interface Category {
    id: number;
    name: string;
    products?: Product[];
}

interface CartItem {
    product_id: number;
    name: string;
    price: number;
    quantity: number;
}

interface Props {
    auth?: { user?: any };
    menu?: Category[];
    mercadopagoPublicKey?: string;
}

export default function Welcome({ auth, menu = [] , mercadopagoPublicKey  }: Props) {
    const [guestEmail, setGuestEmail] = useState('');
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const brickContainerRef = useRef<HTMLDivElement>(null);
    const brickControllerRef = useRef<any>(null);
    const { flash } = usePage().props as any;
    const [cartOpen, setCartOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        guest_name: '',
        guest_phone: '',
        payment_method: 'effective',
        delivery_type: 'takeaway',
        delivery_address: '',
        items: [] as CartItem[],
        total_price: 0,
    });

    const formatMoney = (amount: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);

    const updateCart = (newItems: CartItem[]) => {
        const total = newItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        setData(prev => ({ ...prev, items: newItems, total_price: total }));
    };

    const addToCart = (product: Product) => {
        const existingIndex = data.items.findIndex(item => item.product_id === product.id);
        const updated = [...data.items];

        if (existingIndex > -1) {
            updated[existingIndex].quantity += 1;
        } else {
            updated.push({
                product_id: product.id,
                name: product.name,
                price: Number(product.price),
                quantity: 1,
            });
        }
        updateCart(updated);
        setCartOpen(true);
    };

    const updateQuantity = (productId: number, delta: number) => {
        const updated = data.items
            .map(item => {
                if (item.product_id === productId) {
                    const newQty = item.quantity + delta;
                    return newQty > 0 ? { ...item, quantity: newQty } : null;
                }
                return item;
            })
            .filter(Boolean) as CartItem[];
        updateCart(updated);
    };

    const removeFromCart = (productId: number) => {
        updateCart(data.items.filter(item => item.product_id !== productId));
    };

    const totalItems = data.items.reduce((acc, item) => acc + item.quantity, 0);

    const handleCheckout = (e: React.FormEvent) => {
        e.preventDefault();
        if (data.items.length === 0) return;
        post(route('public.orders.store'), {
            onSuccess: () => {
                reset();
                setCartOpen(false);
            },
        });
    };

    useEffect(() => {
        if (data.payment_method !== 'card' || !mercadopagoPublicKey || !guestEmail || data.total_price <= 0) {
            return;
        }

        let cancelled = false;

        loadMercadoPagoSdk().then(() => {
            if (cancelled || !brickContainerRef.current) return;

            const mp = new (window as any).MercadoPago(mercadopagoPublicKey, { locale: 'es-AR' });
            const bricksBuilder = mp.bricks();

            if (brickControllerRef.current) {
                brickControllerRef.current.unmount();
            }

            bricksBuilder.create('payment', 'payment-brick-container', {
                initialization: {
                    amount: data.total_price,
                    payer: { 
                        email: guestEmail, 
                        entityType: 'individual',
                    },
                },
                customization: {
                    paymentMethods: {
                        creditCard: 'all',
                        debitCard: 'all',
                        prepaid_card: 'all',
                    },
                    visual: {
                        style: {
                            theme: 'dark',
                        },
                    },
                },
                callbacks: {
                    onReady: () => {},
                    onError: (error: any) => {
                        console.error(error);
                        setPaymentError('Ocurrió un error al cargar el formulario de pago.');
                    },
                    onSubmit: ({ formData }: any) => {
    setPaymentProcessing(true);
    setPaymentError(null);

    let paymentUrl: string;
    try {
        paymentUrl = route('mercadopago.process');
    } catch (err) {
        console.error('Error resolviendo la ruta de Mercado Pago:', err);
        setPaymentError('Error de configuración. Contactá al administrador.');
        setPaymentProcessing(false);
        return Promise.reject(err);
    }

    return fetch(paymentUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
        },
        body: JSON.stringify(formData),
    })
        .then(async (res) => {
            if (!res.ok) {
                const text = await res.text();
                console.error('Respuesta no OK de mercadopago.process:', res.status, text);
                throw new Error(`Error del servidor (${res.status})`);
            }
            return res.json();
        })
    .then((result) => {
        console.log('Resultado de Mercado Pago:', result);
        if (result.status === 'rejected') {
            setPaymentError(`El pago fue rechazado (${result.status_detail}). Probá con otra tarjeta.`);
            setPaymentProcessing(false);
            return;
        }

        router.post(route('public.orders.store'), {
            guest_name: data.guest_name,
            guest_phone: data.guest_phone,
            guest_email: guestEmail,
            payment_method: data.payment_method,
            delivery_type: data.delivery_type,
            delivery_address: data.delivery_address,
            items: data.items,
            total_price: data.total_price,
            payment_gateway_id: String(result.id),
            payment_gateway_status: result.status,
        }, {
            onSuccess: () => {
                reset();
                setCartOpen(false);
            },
            onError: (errors) => {
                console.error('Error al crear la orden:', errors);
                setPaymentError('El pago se acreditó pero hubo un error al registrar el pedido. Contactanos con tu comprobante.');
            },
            onFinish: () => setPaymentProcessing(false),
        });
    })
        .catch((err) => {
            console.error(err);
            setPaymentError('No se pudo procesar el pago. Intentá de nuevo.');
            setPaymentProcessing(false);
        });
},
                },
            });

            brickControllerRef.current = bricksBuilder;
        });

        return () => {
            cancelled = true;
        };
    }, [data.payment_method, guestEmail, data.total_price, mercadopagoPublicKey]);

    return (
        <>
            <Head title="Bienvenidos" />

            <div className="relative min-h-screen bg-[#09090b] text-[#f8fafc] font-sans overflow-x-hidden selection:bg-amber-500 selection:text-white">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-amber-950/20 via-slate-900/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

                <header className="relative z-10 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-white/5">
                    <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                        Empandas
                    </span>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <a href="#menu" className="hover:text-white transition-colors">Carta</a>
                        <a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a>
                        <a href="#redes" className="hover:text-white transition-colors">Redes</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        {auth?.user ? (
                            <Link href={route('dashboard')} className="text-sm font-medium text-slate-400 hover:text-white transition">
                                Panel
                            </Link>
                        ) : (
                            <>
                                <Link href={route('login')} className="text-sm font-medium text-slate-400 hover:text-white transition">
                                    Iniciar sesión
                                </Link>
                                <Link href={route('register')} className="bg-white text-black text-xs md:text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-slate-200 transition shadow-lg shadow-white/5">
                                    Registrarse
                                </Link>
                            </>
                        )}
                    </div>
                </header>

                <section className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-16 text-center flex flex-col items-center justify-center">
                    <FlashAlert />
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-amber-400 tracking-wide mb-8 backdrop-blur-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        ¡LAS MAS RICAS!
                    </div>

                    <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight leading-[1.1] text-white mb-6">
                        Dorado perfecto. <br />
                        <span className="font-sans italic font-light bg-gradient-to-r from-amber-200 via-slate-200 to-white bg-clip-text text-transparent">
                            Sabor inolvidable.
                        </span>
                    </h1>

                    <p className="max-w-xl text-slate-400 text-base md:text-lg font-light leading-relaxed mb-10">
                        Empanadas artesanales hechas con ingredientes seleccionados, horneadas al momento. Directo a tu mesa.
                    </p>

                    <a href="#menu" className="bg-white text-black px-8 py-4 rounded-full font-semibold text-base hover:bg-slate-200 transition-all duration-300 shadow-xl shadow-white/5">
                        Ver Menú Completo
                    </a>
                </section>

                <section id="menu" className="relative z-10 max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
                    <h2 className="text-3xl font-serif text-white mb-10 text-center md:text-left">Nuestra Carta</h2>

                    {menu.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 rounded-2xl bg-white/[0.02] border border-white/5">
                            <p>Aún no hay productos cargados en el menú.</p>
                        </div>
                    ) : (
                        menu.map((category) => (
                            <div key={category.id} className="mb-14">
                                <h3 className="text-xl font-medium text-amber-400 mb-6 tracking-wide border-b border-amber-500/10 pb-2">
                                    {category.name}
                                </h3>

                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {category.products?.map((product) => (
                                        <div
                                            key={product.id}
                                            className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-amber-500/30 transition-all duration-300 rounded-2xl overflow-hidden flex flex-col"
                                        >
                                            <div className="aspect-square w-full bg-white/5 overflow-hidden relative">
                                                {product.image ? (
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                                                        Sin imagen
                                                    </div>
                                                )}
                                                <span className="absolute bottom-2 right-2 font-mono text-amber-300 font-bold bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs">
                                                    {formatMoney(Number(product.price))}
                                                </span>
                                            </div>

                                            <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                                                <h4 className="font-semibold text-white text-sm leading-tight group-hover:text-amber-300 transition-colors line-clamp-2">
                                                    {product.name}
                                                </h4>

                                                <button
                                                    onClick={() => addToCart(product)}
                                                    className="w-full bg-white/5 hover:bg-amber-500 text-slate-300 hover:text-black py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-300 flex items-center justify-center gap-1"
                                                >
                                                    <Plus className="w-3.5 h-3.5" /> Agregar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </section>

                <footer className="relative z-10 border-t border-white/5 bg-black/40 py-8 text-center text-xs text-slate-600">
                    © {new Date().getFullYear()} Empanadas. Todos los derechos reservados.
                </footer>
            </div>

            {totalItems > 0 && !cartOpen && (
                <button
                    onClick={() => setCartOpen(true)}
                    className="fixed bottom-6 right-6 z-40 bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-3.5 rounded-full shadow-2xl shadow-amber-500/30 flex items-center gap-2 transition-all active:scale-95"
                >
                    <ShoppingBag className="w-5 h-5" />
                    {totalItems} {totalItems === 1 ? 'ítem' : 'ítems'} · {formatMoney(data.total_price)}
                </button>
            )}

            {cartOpen && (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
        <div className="w-full sm:w-96 h-full bg-[#0f0f11] border-l border-white/10 flex flex-col">
            <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
                <h2 className="text-lg font-bold text-white">Tu Pedido</h2>
                <button onClick={() => setCartOpen(false)} className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-white/5">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {flash?.success && (
                    <div className="m-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4" /> {flash.success}
                    </div>
                )}

                <div className="p-4 space-y-3">
                    {data.items.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-12">El carrito está vacío</p>
                    ) : (
                        data.items.map((item) => (
                            <div key={item.product_id} className="bg-white/[0.03] border border-white/10 rounded-xl p-3 flex flex-col gap-2">
                                <div className="flex justify-between items-start gap-2">
                                    <span className="text-sm font-medium text-white">{item.name}</span>
                                    <button onClick={() => removeFromCart(item.product_id)} className="text-slate-500 hover:text-red-400">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-amber-400 font-bold text-sm">
                                        {formatMoney(item.price * item.quantity)}
                                    </span>
                                    <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
                                        <button onClick={() => updateQuantity(item.product_id, -1)} className="p-1 hover:bg-white/10 rounded text-slate-300">
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-xs font-bold w-5 text-center text-white">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.product_id, 1)} className="p-1 hover:bg-white/10 rounded text-slate-300">
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {data.items.length > 0 && (
                    <form onSubmit={handleCheckout} className="p-5 border-t border-white/10 space-y-3">
                        <input
                            type="text"
                            placeholder="Tu nombre"
                            value={data.guest_name}
                            onChange={(e) => setData('guest_name', e.target.value)}
                            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                        />
                        {errors.guest_name && <p className="text-red-400 text-xs">{errors.guest_name}</p>}

                        <input
                            type="text"
                            placeholder="Teléfono de contacto"
                            value={data.guest_phone}
                            onChange={(e) => setData('guest_phone', e.target.value)}
                            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                        />
                        {errors.guest_phone && <p className="text-red-400 text-xs">{errors.guest_phone}</p>}

                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'takeaway', label: 'Retiro' },
                                { id: 'delivery', label: 'Cadete' },
                            ].map((type) => (
                                <button
                                    type="button"
                                    key={type.id}
                                    onClick={() => setData('delivery_type', type.id)}
                                    className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                                        data.delivery_type === type.id
                                            ? 'bg-amber-500 text-black'
                                            : 'bg-white/5 text-slate-300 border border-white/10'
                                    }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>

                        {data.delivery_type === 'delivery' && (
                            <>
                                <input
                                    type="text"
                                    placeholder="Dirección de entrega"
                                    value={data.delivery_address}
                                    onChange={(e) => setData('delivery_address', e.target.value)}
                                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                                />
                                {errors.delivery_address && <p className="text-red-400 text-xs">{errors.delivery_address}</p>}
                            </>
                        )}

                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'effective', label: 'Efectivo' },
                                { id: 'transfer', label: 'Transferencia' },
                                { id: 'card', label: 'Tarjeta' },
                            ].map((method) => (
                                <button
                                    type="button"
                                    key={method.id}
                                    onClick={() => setData('payment_method', method.id)}
                                    className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                                        data.payment_method === method.id
                                            ? 'bg-amber-500 text-black'
                                            : 'bg-white/5 text-slate-300 border border-white/10'
                                    }`}
                                >
                                    {method.label}
                                </button>
                            ))}
                        </div>

                        {data.payment_method === 'card' && (
                            <div className="space-y-3">
                                <input
                                    type="email"
                                    placeholder="Tu email (para el comprobante de pago)"
                                    value={guestEmail}
                                    onChange={(e) => setGuestEmail(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                                />
                                <div ref={brickContainerRef} id="payment-brick-container" />
                                {paymentError && (
                                    <p className="text-rose-400 text-xs">{paymentError}</p>
                                )}
                                {paymentProcessing && (
                                    <p className="text-amber-400 text-xs text-center">Procesando pago...</p>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-2">
                            <span className="text-sm text-slate-400">Total</span>
                            <span className="text-xl font-black text-white">{formatMoney(data.total_price)}</span>
                        </div>

                        {data.payment_method !== 'card' && (
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-xl transition-all active:scale-[0.98]"
                            >
                                Confirmar Pedido
                            </button>
                        )}
                    </form>
                )}
            </div>
        </div>
    </div>
)}
        </>
    );
}