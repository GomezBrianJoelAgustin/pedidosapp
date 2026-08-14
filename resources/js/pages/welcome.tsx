import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { ShoppingBag, Plus, Minus, X, Trash2, CheckCircle, Instagram, Facebook, MessageCircle, Music2, MapPin, Clock, Phone, Sparkles, ChefHat, Leaf, Flame, Star, ArrowRight } from 'lucide-react';
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

export default function Welcome({ auth, menu = [], mercadopagoPublicKey }: Props) {
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

    const updateCart = (newItems: CartItem[]) => {
        const total = newItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        setData(prev => ({ ...prev, items: newItems, total_price: total }));
    };

    const formatMoney = (amount: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);

    useEffect(() => {
        const savedCart = localStorage.getItem('guest_cart');
        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart);
                if (parsed?.items?.length) {
                    updateCart(parsed.items);
                }
            } catch {
                // ignore
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('guest_cart', JSON.stringify({ items: data.items, total_price: data.total_price }));
    }, [data.items, data.total_price]);

    useEffect(() => {
        const path = window.location.pathname;
        if (path === '/' || path === '/home') {
            localStorage.removeItem('guest_cart');
            reset();
        }
    }, []);

    useEffect(() => {
        const path = window.location.pathname;
        if (path === '/' || path === '/home') {
            localStorage.removeItem('guest_cart');
            reset();
        }
    }, []);

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

    const clearCart = () => {
        updateCart([]);
        localStorage.removeItem('guest_cart');
    };

    const totalItems = data.items.reduce((acc, item) => acc + item.quantity, 0);

    const handleCheckout = (e: React.FormEvent) => {
        e.preventDefault();

        if (data.items.length === 0) {
            return;
        }

        post(route('public.orders.store'), data, {
            onSuccess: (page) => {
                console.log('[checkout] onSuccess page.props:', page.props);
                reset();
                setCartOpen(false);
                setPaymentError(null);
                localStorage.removeItem('guest_cart');

                const token = page.props?.order?.tracking_token;
                console.log('[checkout] tracking_token from response:', token);
                if (token) {
                    localStorage.setItem('active_guest_order', token);
                    console.log('[checkout] navigating to tracking:', route('public.order.track', token));
                    router.visit(route('public.order.track', token));
                    return;
                }

                console.log('[checkout] no token found, navigating home');
                router.visit(route('home'));
            },
            onError: (errors) => {
                console.error('[checkout] onError:', errors);
                const messages = Object.values(errors || {}).flat().join(' ');
                setPaymentError(messages || 'No se pudo crear el pedido. Revisá los datos e intentá de nuevo.');
            },
        });
    };

    useEffect(() => {
        if (data.payment_method !== 'card' || !mercadopagoPublicKey || data.total_price <= 0) {
            return;
        }

        let cancelled = false;

        loadMercadoPagoSdk().then(() => {
            if (cancelled || !brickContainerRef.current) {
                return;
            }

            const mp = new (window as any).MercadoPago(mercadopagoPublicKey, { locale: 'es-AR' });
            const bricksBuilder = mp.bricks();

            if (brickControllerRef.current && typeof brickControllerRef.current.unmount === 'function') {
                brickControllerRef.current.unmount();
            }

            bricksBuilder.create('payment', 'payment-brick-container', {
                initialization: {
                    amount: data.total_price,
                    payer: {},
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

                        const cleanPayer = { ...formData.payer };
                        delete cleanPayer.entityType;
                        delete cleanPayer.identification;

                        const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                        const cookieToken = decodeURIComponent(
                            document.cookie
                                .split('; ')
                                .find((row) => row.startsWith('XSRF-TOKEN='))
                                ?.split('=')[1] || ''
                        );
                        const xsrfToken = metaToken || cookieToken;

                        return fetch(paymentUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': xsrfToken,
                            },
                            body: JSON.stringify({
                                ...formData,
                                payer: cleanPayer,
                            }),
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
                                    payment_method: data.payment_method,
                                    delivery_type: data.delivery_type,
                                    delivery_address: data.delivery_address,
                                    items: data.items,
                                    total_price: data.total_price,
                                    payment_gateway_id: String(result.id),
                                    payment_gateway_status: result.status,
                                }, {
                                    onSuccess: (page) => {
                                        reset();
                                        setCartOpen(false);
                                        setPaymentError(null);
                                        localStorage.removeItem('guest_cart');

                                        const token = page.props?.order?.tracking_token;
                                        if (token) {
                                            localStorage.setItem('active_guest_order', token);
                                            router.visit(route('public.order.track', token));
                                            return;
                                        }

                                        router.visit(route('home'));
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
            }).then((controller: any) => {
                brickControllerRef.current = controller;
            });
        });

        return () => {
            cancelled = true;
            if (brickControllerRef.current && typeof brickControllerRef.current.unmount === 'function') {
                brickControllerRef.current.unmount();
            }
        };
    }, [data.payment_method, data.total_price, mercadopagoPublicKey]);

    return (
        <>
            <Head title="Bienvenidos" />

            <div className="relative bg-[#09090b] text-[#f8fafc] font-sans overflow-x-hidden selection:bg-amber-500 selection:text-white">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-amber-950/20 via-slate-900/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

                <div className="relative min-h-screen flex flex-col">
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: "url('/images/hero-bg.jfif')" }}
                    />
                    <div className="absolute inset-0 bg-black/40" />

                    <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-white/5 shrink-0">
                        <div className="flex items-center">
                            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-amber-200 via-white to-slate-200 bg-clip-text text-transparent">
                                Empandas
                            </span>
                        </div>

                        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
                            <a href="#menu" className="hover:text-white transition-colors">Carta</a>
                            <a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a>
                            <a href="#redes" className="hover:text-white transition-colors">Redes</a>
                        </nav>

                        <div className="flex items-center space-x-4">
                            {auth?.user ? (
                                <Link href={route('dashboard')} className="text-sm font-medium text-slate-300 hover:text-white transition">
                                    Panel
                                </Link>
                            ) : (
                                <>
                                    <Link href={route('login')} className="text-sm font-medium text-slate-300 hover:text-white transition">
                                        Iniciar sesión
                                    </Link>
                                    <Link href={route('register')} className="bg-white text-black text-xs md:text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-slate-200 transition shadow-lg shadow-white/5">
                                        Registrarse
                                    </Link>
                                </>
                            )}
                        </div>
                    </header>

                <section className="relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center justify-center flex-1">
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
            </div>

                <section id="menu" className="relative z-10 max-w-6xl mx-auto px-6 py-20 border-t border-[#3d2c21]">
                    <h2 className="text-3xl font-serif text-[#f5f0eb] mb-10 text-center md:text-left">Nuestra Carta</h2>

                    {menu.length === 0 ? (
                        <div className="text-center py-12 text-[#f5f0eb]/60 rounded-2xl bg-[#1c1611] border border-[#3d2c21]">
                            <p>Aún no hay productos cargados en el menú.</p>
                        </div>
                    ) : (
                        menu.map((category) => (
                            <div key={category.id} className="mb-14">
                                <h3 className="text-xl font-medium text-[#d4af37] mb-6 tracking-wide border-b border-[#d4af37]/10 pb-2">
                                    {category.name}
                                </h3>

                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {category.products?.map((product) => (
                                        <div
                                            key={product.id}
                                            className="group relative bg-[#1c1611] border border-[#3d2c21] hover:border-[#d4af37]/40 transition-all duration-300 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md hover:shadow-[#d4af37]/10"
                                        >
                                            <div className="aspect-square w-full bg-[#1c1611]/80 overflow-hidden relative">
                                                {product.image ? (
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[#f5f0eb]/40 text-xs">
                                                        Sin imagen
                                                    </div>
                                                )}
                                                <span className="absolute bottom-2 right-2 font-mono text-[#d4af37] font-bold bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs">
                                                    {formatMoney(Number(product.price))}
                                                </span>
                                            </div>

                                            <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                                                <h4 className="font-semibold text-[#f5f0eb] text-sm leading-tight group-hover:text-[#d4af37] transition-colors line-clamp-2">
                                                    {product.name}
                                                </h4>

                                                <button
                                                    onClick={() => addToCart(product)}
                                                    className="self-start p-2.5 rounded-full border border-[#d4af37]/40 bg-[#1c1611]/90 text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-all duration-300 shadow-lg shadow-black/20 hover:shadow-[#d4af37]/30"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </section>

                <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { emoji: '🥟', label: 'Masa casera', desc: 'Amasada a mano cada día' },
                            { emoji: '🔥', label: 'Horno a leña', desc: 'Cocción tradicional' },
                            { emoji: '🥩', label: 'Cortes premium', desc: 'Carne seleccionada' },
                            { emoji: '🧀', label: 'Quesos artesanales', desc: 'Rellenos generosos' },
                        ].map((item) => (
                            <div key={item.label} className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-amber-500/30 transition-all duration-300 rounded-2xl p-6 text-center">
                                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{item.emoji}</div>
                                <h3 className="font-semibold text-white text-sm mb-1">{item.label}</h3>
                                <p className="text-xs text-slate-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="nosotros" className="relative z-10 max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-amber-400 tracking-wide mb-6 backdrop-blur-md">
                                <ChefHat className="w-3.5 h-3.5" />
                                NUESTRA HISTORIA
                            </div>
                            <h2 className="text-3xl md:text-4xl font-serif text-white mb-6 leading-tight">
                                Pasión por la cocina, <br />
                                <span className="text-amber-400">tradición en cada bocado.</span>
                            </h2>
                            <p className="text-slate-400 font-light leading-relaxed mb-6">
                                En Empandas, cada empanada es el resultado de años de dedicación y amor por la cocina argentina.
                                Seleccionamos los mejores ingredientes, amasamos la masa a mano y horneamos al momento para que
                                llegue a tu mesa con el sabor de lo auténtico.
                            </p>
                            <p className="text-slate-400 font-light leading-relaxed mb-8">
                                Desde nuestros inicios, nuestro objetivo fue simple: ofrecer empanadas artesanales de calidad
                                superior, con recetas familiares que se transmiten de generación en generación.
                            </p>

                            <div className="grid grid-cols-3 gap-4 mb-8">
                                {[
                                    { value: '10+', label: 'Años de tradición' },
                                    { value: '15+', label: 'Variedades' },
                                    { value: '1000+', label: 'Clientes felices' },
                                ].map((stat) => (
                                    <div key={stat.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-center">
                                        <div className="text-2xl font-bold text-amber-400">{stat.value}</div>
                                        <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {[
                                    { icon: Leaf, label: 'Ingredientes frescos' },
                                    { icon: Flame, label: 'Horneadas al momento' },
                                    { icon: Sparkles, label: 'Receta artesanal' },
                                ].map(({ icon: Icon, label }) => (
                                    <span key={label} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
                                        <Icon className="w-3.5 h-3.5 text-amber-400" />
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/20 to-transparent rounded-3xl blur-2xl pointer-events-none" />
                            <div className="relative bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden">
                                <div className="aspect-[4/3] bg-gradient-to-br from-amber-900/40 via-slate-900 to-slate-950 flex items-center justify-center">
                                    <div className="text-center p-8">
                                        <div className="text-7xl mb-4">🥟</div>
                                        <p className="text-slate-300 font-serif text-xl italic">"El sabor de lo hecho con amor"</p>
                                        <div className="flex items-center justify-center gap-1 mt-4 text-amber-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-current" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="redes" className="relative z-10 max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-amber-400 tracking-wide mb-6 backdrop-blur-md">
                            <MessageCircle className="w-3.5 h-3.5" />
                            SEGUINOS
                        </div>
                        <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">Conectate con nosotros</h2>
                        <p className="text-slate-400 font-light max-w-xl mx-auto">
                            Seguí nuestras novedades, promociones y el detrás de escena de nuestras empanadas.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { icon: Instagram, label: 'Instagram', handle: '@empandas', color: 'hover:border-pink-500/40 hover:bg-pink-500/5', iconColor: 'text-pink-400' },
                            { icon: Facebook, label: 'Facebook', handle: '/empandas', color: 'hover:border-blue-500/40 hover:bg-blue-500/5', iconColor: 'text-blue-400' },
                            { icon: MessageCircle, label: 'WhatsApp', handle: '+54 11 1234-5678', color: 'hover:border-emerald-500/40 hover:bg-emerald-500/5', iconColor: 'text-emerald-400' },
                            { icon: Music2, label: 'TikTok', handle: '@empandas', color: 'hover:border-cyan-500/40 hover:bg-cyan-500/5', iconColor: 'text-cyan-400' },
                        ].map(({ icon: Icon, label, handle, color, iconColor }) => (
                            <a
                                key={label}
                                href="#"
                                className={`group bg-white/[0.03] border border-white/10 rounded-2xl p-6 transition-all duration-300 ${color}`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <Icon className={`w-6 h-6 ${iconColor}`} />
                                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                </div>
                                <h3 className="font-semibold text-white mb-1">{label}</h3>
                                <p className="text-sm text-slate-500">{handle}</p>
                            </a>
                        ))}
                    </div>

                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { icon: MapPin, title: 'Ubicación', desc: 'Av. Siempre Viva 123, Buenos Aires' },
                            { icon: Clock, title: 'Horarios', desc: 'Lun a Dom · 11:00 a 23:00 hs' },
                            { icon: Phone, title: 'Pedidos', desc: '+54 11 1234-5678' },
                        ].map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex items-start gap-4">
                                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl shrink-0">
                                    <Icon className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white text-sm mb-1">{title}</h4>
                                    <p className="text-sm text-slate-500">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <footer className="relative z-10 border-t border-white/5 bg-black/40 py-8 text-center text-xs text-slate-600">
                    <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <span className="text-sm font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                            Empandas
                        </span>
                        <p>© {new Date().getFullYear()} Empandas. Todos los derechos reservados.</p>
                        <div className="flex items-center gap-4">
                            <a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a>
                            <a href="#redes" className="hover:text-white transition-colors">Redes</a>
                            <a href="#menu" className="hover:text-white transition-colors">Carta</a>
                        </div>
                    </div>
                </footer>
            </div>

            <button
                onClick={() => setCartOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-[#e63946] hover:bg-[#e63946]/90 text-white p-4 rounded-full shadow-lg shadow-[#e63946]/30 transition-all active:scale-95"
            >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#d4af37] text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                        {totalItems}
                    </span>
                )}
            </button>

            {cartOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
                    <div className="w-full sm:w-96 h-full bg-[#0f0f11] border-l border-white/10 flex flex-col">
                        <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
                            <h2 className="text-lg font-bold text-white">Detalle del pedido</h2>
                            <div className="flex items-center gap-2">
                                <button onClick={clearCart} className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-white/5">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button onClick={() => setCartOpen(false)} className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-white/5">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
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
                                        <div key={item.product_id} className="bg-white/[0.03] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-white truncate">{item.name}</h4>
                                                <span className="text-xs text-amber-400 font-bold">{formatMoney(item.price)}</span>
                                            </div>

                                            <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1 shrink-0">
                                                <button onClick={() => updateQuantity(item.product_id, -1)} className="p-1 hover:bg-white/10 rounded text-slate-300">
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="text-xs font-bold w-5 text-center text-white">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.product_id, 1)} className="p-1 hover:bg-white/10 rounded text-slate-300">
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>

                                            <button onClick={() => removeFromCart(item.product_id)} className="text-slate-500 hover:text-red-400 p-1 shrink-0">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {data.items.length > 0 && (
                                <form onSubmit={handleCheckout} className="p-5 border-t border-white/10 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Nombre del cliente"
                                        value={data.guest_name}
                                        onChange={(e) => setData('guest_name', e.target.value)}
                                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                                    />
                                    {errors.guest_name && <p className="text-red-400 text-xs">{errors.guest_name}</p>}

                                    <input
                                        type="text"
                                        placeholder="Teléfono"
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

                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'effective', label: 'Efectivo' },
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
                                        <div ref={brickContainerRef} id="payment-brick-container" />
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
