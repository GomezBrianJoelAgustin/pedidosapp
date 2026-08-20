import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { ShoppingBag, Plus, Minus, X, Trash2, CheckCircle, Instagram, Facebook, MessageCircle, Music2, MapPin, Clock, Phone, Sparkles, ChefHat, Leaf, Flame, Star, ArrowRight, Sun, Moon, Search } from 'lucide-react';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import FlashAlert from '@/components/flash-alert';
import { loadMercadoPagoSdk } from '@/lib/load-mercadopago';
import { useAppearance } from '@/hooks/use-appearance';

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

interface Review {
    comment: string;
    food_rating: number;
    delivery_rating: number;
    user_name: string;
    created_at: string;
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
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [averageRating, setAverageRating] = useState<number | null>(null);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const { resolvedAppearance, updateAppearance } = useAppearance();

    const { data, setData, post, processing, errors, reset } = useForm({
        guest_name: '',
        guest_phone: '',
        payment_method: 'effective',
        delivery_type: 'takeaway',
        delivery_address: '',
        items: [] as CartItem[],
        total_price: 0,
    });

    const updateCart = useCallback((newItems: CartItem[]) => {
        const total = newItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        setData(prev => ({ ...prev, items: newItems, total_price: total }));
    }, [setData]);

    const formatMoney = useCallback((amount: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount),
    []);

    const addToCart = useCallback((product: Product) => {
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
    }, [data.items, updateCart]);

    const updateQuantity = useCallback((productId: number, delta: number) => {
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
    }, [data.items, updateCart]);

    const removeFromCart = useCallback((productId: number) => {
        updateCart(data.items.filter(item => item.product_id !== productId));
    }, [data.items, updateCart]);

    const clearCart = useCallback(() => {
        updateCart([]);
        localStorage.removeItem('guest_cart');
    }, [updateCart]);

    const openProductModal = async (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
        setLoadingReviews(true);

        try {
            const response = await fetch(`/products/${product.id}/reviews`);
            const data = await response.json();
            setReviews(data.reviews || []);
            setAverageRating(data.average);
        } catch (error) {
            console.error('Error loading reviews:', error);
            setReviews([]);
            setAverageRating(null);
        } finally {
            setLoadingReviews(false);
        }
    };

    const closeProductModal = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
        setReviews([]);
        setAverageRating(null);
    };

    const totalItems = useMemo(() => data.items.reduce((acc, item) => acc + item.quantity, 0), [data.items]);

    const allProducts = useMemo(() => menu.flatMap(category => category.products ?? []), [menu]);

    const filteredProducts = useMemo(() => {
        return allProducts.filter((product) => {
            const matchesCategory = selectedCategory === null || product.category_id === selectedCategory;
            const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [allProducts, selectedCategory, search]);

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

            <div className="relative bg-background text-foreground font-sans overflow-x-hidden selection:bg-amber-500 selection:text-white">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-amber-950/20 via-slate-900/10 to-transparent rounded-full blur-[120px] pointer-events-none dark:from-amber-900/20 dark:via-slate-800/10" />

                <div className="relative min-h-screen flex flex-col">
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-hero-bg"
                        style={{ backgroundImage: "url('/images/hero-bg.jfif')" }}
                    />
                    <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />

                    <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-border shrink-0">
                        <div className="flex items-center">
                            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-amber-200 via-white to-slate-200 bg-clip-text text-transparent dark:from-amber-300 dark:via-slate-200 dark:to-slate-300">
                                Empandas
                            </span>
                        </div>

                        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-muted-foreground">
                            <a href="#menu" className="hover:text-foreground transition-colors">Carta</a>
                            <a href="#nosotros" className="hover:text-foreground transition-colors">Nosotros</a>
                            <a href="#redes" className="hover:text-foreground transition-colors">Redes</a>
                        </nav>

                        <div className="flex items-center space-x-4">
                            {auth?.user ? (
                                <Link href={route('dashboard')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition">
                                    Panel
                                </Link>
                            ) : (
                                <>
                                    <Link href={route('login')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition">
                                        Iniciar sesión
                                    </Link>
                                    <Link href={route('register')} className="bg-primary text-primary-foreground text-xs md:text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-primary/90 transition shadow-lg shadow-primary/5">
                                        Registrarse
                                    </Link>
                                </>
                            )}
                            <button
                                onClick={() => updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark')}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition dark:bg-white/10 dark:hover:bg-white/20"
                                aria-label="Cambiar tema"
                            >
                                {resolvedAppearance === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>
                        </div>
                    </header>

                <section className="relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center justify-center flex-1">
                    <FlashAlert />
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 dark:bg-white/10 dark:border-white/20 text-xs font-medium text-amber-400 tracking-wide mb-8 backdrop-blur-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        ¡LAS MAS RICAS!
                    </div>

                    <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight leading-[1.1] text-white mb-6">
                        Dorado perfecto. <br />
                        <span className="font-sans italic font-light bg-gradient-to-r from-amber-200 via-slate-200 to-white bg-clip-text text-transparent dark:from-amber-200 dark:via-slate-200 dark:to-white">
                            Sabor inolvidable.
                        </span>
                    </h1>

                    <p className="max-w-xl text-muted-foreground dark:text-slate-400 text-base md:text-lg font-light leading-relaxed mb-10">
                        Empanadas artesanales hechas con ingredientes seleccionados, horneadas al momento. Directo a tu mesa.
                    </p>

                    <a href="#menu" className="bg-white text-black px-8 py-4 rounded-full font-semibold text-base hover:bg-slate-200 transition-all duration-300 shadow-xl shadow-white/5">
                        Ver Menú Completo
                    </a>
                </section>
            </div>

                <section id="menu" className="relative z-10 w-full bg-background dark:bg-[#14100c] py-20 border-t border-border">
                    <div className="max-w-7xl mx-auto px-6">
                        <h2 className="text-3xl font-serif text-foreground mb-10 text-center md:text-left">Nuestra Carta</h2>

                        {menu.length === 0 ? (
                            <div className="text-center py-12 text-foreground/60 rounded-2xl bg-card dark:bg-[#1c1611] border border-border dark:border-[#3d2c21]">
                                <p>Aún no hay productos cargados en el menú.</p>
                            </div>
                        ) : (
                            <>
                                <div className="sticky top-0 z-20 -mx-6 px-6 pt-2 pb-4 bg-background/90 dark:bg-background/80 backdrop-blur-xl space-y-3">
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
                                        {menu.map((category) => (
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

                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {filteredProducts.map((product) => {
                                        const inCart = data.items.find(item => item.product_id === product.id);

                                        return (
                                            <div
                                                key={product.id}
                                                onClick={() => openProductModal(product)}
                                                className="group relative bg-card dark:bg-[#1c1611] border border-border dark:border-[#3d2c21] hover:border-ember/50 transition-all duration-300 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-lg hover:shadow-black/50 hover:scale-[1.02] cursor-pointer"
                                            >
                                                <div className="aspect-square w-full bg-card/80 dark:bg-[#1c1611]/80 overflow-hidden relative">
                                                    {product.image ? (
                                                        <img
                                                            src={product.image}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-foreground/40 text-xs">
                                                            Sin imagen
                                                        </div>
                                                    )}
                                                    <span className="absolute bottom-2 right-2 font-mono text-gold font-bold bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs">
                                                        {formatMoney(Number(product.price))}
                                                    </span>
                                                </div>

                                                <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                                                    <h4 className="font-semibold text-foreground text-sm leading-tight group-hover:text-gold transition-colors line-clamp-2">
                                                        {product.name}
                                                    </h4>

                                                    <div className="flex items-center justify-between">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                addToCart(product);
                                                            }}
                                                            className={`p-2.5 rounded-full border transition-all duration-300 shadow-lg shadow-black/20 hover:scale-110 active:scale-95 ${
                                                                inCart
                                                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                                                    : 'border-gold/40 bg-card/90 dark:bg-[#1c1611]/90 text-gold hover:bg-gold hover:text-black'
                                                            }`}
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                        {inCart && (
                                                            <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-md">
                                                                {inCart.quantity}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    {isModalOpen && selectedProduct && (
                        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                            <div className="bg-card dark:bg-[#1c1611] border border-border dark:border-[#3d2c21] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                                <div className="relative">
                                    {selectedProduct.image ? (
                                        <img
                                            src={selectedProduct.image}
                                            alt={selectedProduct.name}
                                            className="w-full h-64 sm:h-80 object-cover rounded-t-3xl"
                                        />
                                    ) : (
                                        <div className="w-full h-64 sm:h-80 flex items-center justify-center text-foreground/40 text-xs bg-background">
                                            Sin imagen
                                        </div>
                                    )}
                                    <button
                                        onClick={closeProductModal}
                                        className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-foreground mb-1">{selectedProduct.name}</h3>
                                        <p className="text-xl font-black text-gold">{formatMoney(Number(selectedProduct.price))}</p>
                                    </div>

                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {selectedProduct.description || 'Sin descripción disponible.'}
                                    </p>

                                    <div className="border-t border-border pt-4">
                                        <h4 className="text-sm font-bold text-foreground mb-3">Reseñas</h4>
                                        {averageRating !== null && (
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-4 h-4 ${i < Math.round(averageRating) ? 'text-gold fill-current' : 'text-muted-foreground'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-sm font-bold text-foreground">{averageRating}</span>
                                                <span className="text-xs text-muted-foreground">({reviews.length} reseña{reviews.length !== 1 ? 's' : ''})</span>
                                            </div>
                                        )}
                                        {loadingReviews ? (
                                            <p className="text-xs text-muted-foreground">Cargando reseñas...</p>
                                        ) : reviews.length === 0 ? (
                                            <p className="text-xs text-muted-foreground">Aún no hay reseñas para este producto.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {reviews.map((review, index) => (
                                                    <div key={index} className="bg-background border border-border rounded-xl p-3">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs font-bold text-foreground">{review.user_name}</span>
                                                            <div className="flex items-center gap-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star
                                                                        key={i}
                                                                        className={`w-3 h-3 ${i < review.food_rating ? 'text-gold fill-current' : 'text-muted-foreground'}`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {review.comment && (
                                                            <p className="text-xs text-muted-foreground leading-relaxed">{review.comment}</p>
                                                        )}
                                                        <span className="text-[10px] text-muted-foreground">{review.created_at}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-border">
                                        <button
                                            onClick={closeProductModal}
                                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-xl transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                        <button
                                            onClick={() => {
                                                addToCart(selectedProduct);
                                                closeProductModal();
                                            }}
                                            className="px-6 py-2.5 bg-primary hover:bg-[#d46d2e] text-white dark:text-black font-bold rounded-xl shadow-lg shadow-primary/25 dark:shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Agregar al carrito
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

            <section className="relative z-10 w-full bg-background dark:bg-[#14100c] py-20 border-t border-border dark:border-[#3d2c21]">
                <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { emoji: '🥟', label: 'Masa casera', desc: 'Amasada a mano cada día' },
                            { emoji: '🔥', label: 'Horno a leña', desc: 'Cocción tradicional' },
                            { emoji: '🥩', label: 'Cortes premium', desc: 'Carne seleccionada' },
                            { emoji: '🧀', label: 'Quesos artesanales', desc: 'Rellenos generosos' },
                        ].map((item) => (
                            <div key={item.label} className="group bg-card dark:bg-[#1c1611] border border-border dark:border-[#3d2c21] hover:border-ember/50 transition-all duration-300 rounded-2xl p-6 text-center shadow-sm hover:shadow-lg hover:shadow-black/50 hover:scale-[1.02]">
                                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{item.emoji}</div>
                                <h3 className="font-semibold text-foreground text-sm mb-1">{item.label}</h3>
                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="nosotros" className="relative z-10 w-full bg-background dark:bg-[#14100c] py-20 border-t border-border dark:border-[#3d2c21]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card dark:bg-[#1c1611] border border-border dark:border-[#3d2c21] text-xs font-medium text-gold tracking-wide mb-6">
                                <ChefHat className="w-3.5 h-3.5 text-ember" />
                                NUESTRA HISTORIA
                            </div>
                            <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-6 leading-tight">
                                Pasión por la cocina, <br />
                                <span className="text-ember">tradición en cada bocado.</span>
                            </h2>
                            <p className="text-foreground/70 font-light leading-relaxed mb-6">
                                En Empandas, cada empanada es el resultado de años de dedicación y amor por la cocina argentina.
                                Seleccionamos los mejores ingredientes, amasamos la masa a mano y horneamos al momento para que
                                llegue a tu mesa con el sabor de lo auténtico.
                            </p>
                            <p className="text-foreground/70 font-light leading-relaxed mb-8">
                                Desde nuestros inicios, nuestro objetivo fue simple: ofrecer empanadas artesanales de calidad
                                superior, con recetas familiares que se transmiten de generación en generación.
                            </p>

                            <div className="grid grid-cols-3 gap-4 mb-8">
                                {[
                                    { value: '10+', label: 'Años de tradición' },
                                    { value: '15+', label: 'Variedades' },
                                    { value: '1000+', label: 'Clientes felices' },
                                ].map((stat) => (
                                    <div key={stat.label} className="bg-card dark:bg-[#1c1611] border border-border dark:border-[#3d2c21] rounded-xl p-4 text-center shadow-sm hover:shadow-md hover:shadow-black/50 transition-all duration-300 hover:scale-[1.02]">
                                        <div className="text-2xl font-bold text-gold">{stat.value}</div>
                                        <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {[
                                    { icon: Leaf, label: 'Ingredientes frescos' },
                                    { icon: Flame, label: 'Horneadas al momento' },
                                    { icon: Sparkles, label: 'Receta artesanal' },
                                ].map(({ icon: Icon, label }) => (
                                    <span key={label} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-card dark:bg-[#1c1611] border border-border dark:border-[#3d2c21] text-xs text-foreground/80">
                                        <Icon className="w-3.5 h-3.5 text-ember" />
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-br from-ember/20 to-transparent rounded-3xl blur-2xl pointer-events-none dark:from-ember/20" />
                            <div className="relative bg-card dark:bg-[#1c1611] border border-border dark:border-[#3d2c21] rounded-3xl overflow-hidden shadow-sm hover:shadow-lg hover:shadow-black/50 transition-all duration-300 hover:scale-[1.02]">
                                <div className="aspect-[4/3] bg-gradient-to-br from-clay via-charcoal to-background dark:from-[#3d2c21] dark:via-[#1c1611] dark:to-[#14100c] flex items-center justify-center">
                                    <div className="text-center p-8">
                                        <div className="text-7xl mb-4">🥟</div>
                                        <p className="text-foreground/80 font-serif text-xl italic">"El sabor de lo hecho con amor"</p>
                                        <div className="flex items-center justify-center gap-1 mt-4 text-gold">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-current" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="redes" className="relative z-10 w-full bg-background dark:bg-[#14100c] py-20 border-t border-border dark:border-[#3d2c21]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card dark:bg-[#1c1611] border border-border dark:border-[#3d2c21] text-xs font-medium text-gold tracking-wide mb-6">
                            <MessageCircle className="w-3.5 h-3.5" />
                            SEGUINOS
                        </div>
                        <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-4">Conectate con nosotros</h2>
                        <p className="text-foreground/70 font-light max-w-xl mx-auto">
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
                                className={`group bg-card dark:bg-[#1c1611] border border-border dark:border-[#3d2c21] rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-black/50 hover:scale-[1.02] ${color}`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <Icon className={`w-6 h-6 ${iconColor}`} />
                                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                                </div>
                                <h3 className="font-semibold text-foreground mb-1">{label}</h3>
                                <p className="text-sm text-muted-foreground">{handle}</p>
                            </a>
                        ))}
                    </div>

                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { icon: MapPin, title: 'Ubicación', desc: 'Av. Siempre Viva 123, Buenos Aires' },
                            { icon: Clock, title: 'Horarios', desc: 'Lun a Dom · 11:00 a 23:00 hs' },
                            { icon: Phone, title: 'Pedidos', desc: '+54 11 1234-5678' },
                        ].map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="bg-card dark:bg-[#1c1611] border border-border dark:border-[#3d2c21] rounded-2xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md hover:shadow-black/50 transition-all duration-300 hover:scale-[1.02]">
                                <div className="p-2.5 bg-ember/10 border border-ember/20 rounded-xl shrink-0 dark:bg-ember/10 dark:border-ember/20">
                                    <Icon className="w-5 h-5 text-ember" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-foreground text-sm mb-1">{title}</h4>
                                    <p className="text-sm text-muted-foreground">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="relative z-10 w-full border-t border-border dark:border-[#3d2c21] bg-background dark:bg-[#14100c] py-8 text-center text-xs text-muted-foreground">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <span className="text-sm font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent dark:from-white dark:via-slate-200 dark:to-slate-400">
                            Empandas
                        </span>
                        <p>© {new Date().getFullYear()} Empandas. Todos los derechos reservados.</p>
                        <div className="flex items-center gap-4">
                            <a href="#nosotros" className="hover:text-foreground transition-colors">Nosotros</a>
                            <a href="#redes" className="hover:text-foreground transition-colors">Redes</a>
                            <a href="#menu" className="hover:text-foreground transition-colors">Carta</a>
                        </div>
                    </div>
                </footer>
            </div>

            <button
                onClick={() => setCartOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-crimson hover:bg-crimson/90 text-white p-4 rounded-full shadow-lg shadow-crimson/30 transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gold text-gold-foreground text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                        {totalItems}
                    </span>
                )}
            </button>

            {cartOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
                    <div className="w-full sm:w-96 h-full bg-card dark:bg-[#0f0f11] border-l border-border dark:border-white/10 flex flex-col">
                        <div className="p-5 border-b border-border dark:border-white/10 flex items-center justify-between shrink-0">
                            <h2 className="text-lg font-bold text-foreground">Detalle del pedido</h2>
                            <div className="flex items-center gap-2">
                                <button onClick={clearCart} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg bg-secondary dark:bg-white/5">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button onClick={() => setCartOpen(false)} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg bg-secondary dark:bg-white/5">
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
                                    <p className="text-muted-foreground text-sm text-center py-12">El carrito está vacío</p>
                                ) : (
                                    data.items.map((item) => (
                                        <div key={item.product_id} className="bg-secondary/50 dark:bg-white/[0.03] border border-border dark:border-white/10 rounded-xl p-3 flex items-center justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-foreground truncate">{item.name}</h4>
                                                <span className="text-xs text-amber-400 font-bold">{formatMoney(item.price)}</span>
                                            </div>

                                            <div className="flex items-center gap-2 bg-secondary dark:bg-white/5 rounded-lg p-1 shrink-0">
                                                <button onClick={() => updateQuantity(item.product_id, -1)} className="p-1 hover:bg-secondary-foreground/10 dark:hover:bg-white/10 rounded text-muted-foreground">
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="text-xs font-bold w-5 text-center text-foreground">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.product_id, 1)} className="p-1 hover:bg-secondary-foreground/10 dark:hover:bg-white/10 rounded text-muted-foreground">
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>

                                            <button onClick={() => removeFromCart(item.product_id)} className="text-muted-foreground hover:text-crimson p-1 shrink-0">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {data.items.length > 0 && (
                                <form onSubmit={handleCheckout} className="p-5 border-t border-border dark:border-white/10 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Nombre del cliente"
                                        value={data.guest_name}
                                        onChange={(e) => setData('guest_name', e.target.value)}
                                        className="w-full px-3 py-2.5 bg-secondary dark:bg-white/5 border border-border dark:border-white/10 rounded-xl text-sm text-foreground dark:text-white placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none"
                                    />
                                    {errors.guest_name && <p className="text-destructive text-xs">{errors.guest_name}</p>}

                                    <input
                                        type="text"
                                        placeholder="Teléfono"
                                        value={data.guest_phone}
                                        onChange={(e) => setData('guest_phone', e.target.value)}
                                        className="w-full px-3 py-2.5 bg-secondary dark:bg-white/5 border border-border dark:border-white/10 rounded-xl text-sm text-foreground dark:text-white placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none"
                                    />
                                    {errors.guest_phone && <p className="text-destructive text-xs">{errors.guest_phone}</p>}

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
                                                        : 'bg-secondary dark:bg-white/5 text-foreground dark:text-slate-300 border border-border dark:border-white/10'
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
                                                className="w-full px-3 py-2.5 bg-secondary dark:bg-white/5 border border-border dark:border-white/10 rounded-xl text-sm text-foreground dark:text-white placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none"
                                            />
                                            {errors.delivery_address && <p className="text-destructive text-xs">{errors.delivery_address}</p>}
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
                                                        : 'bg-secondary dark:bg-white/5 text-foreground dark:text-slate-300 border border-border dark:border-white/10'
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
                                        <span className="text-sm text-muted-foreground dark:text-slate-400">Total</span>
                                        <span className="text-xl font-black text-foreground dark:text-white">{formatMoney(data.total_price)}</span>
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
