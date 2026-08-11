import FlashAlert from '@/components/flash-alert';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Search, X, Filter, Star } from 'lucide-react';
import { usePolling } from '@/hooks/use-polling';

interface Product {
    id: number;
    name: string;
}

interface OrderItem {
    id: number;
    quantity: number;
    price: number;
    product: Product;
}

interface Review {
    id: number;
    food_rating: number;
    delivery_rating?: number;
    comment?: string;
}

interface Order {
    id: number;
    status: string;
    payment_status: string;
    total_price: number;
    pin: string;
    created_at: string;
    items: OrderItem[];
    delivery_type?: string;
    review?: Review | null;
}

interface User {
    id: number;
    name: string;
    email: string;
    roles?: Array<{ name: string }>;
}

interface PageProps {
    auth: {
        user: User;
    };
    orders: Order[];
}

export default function ClientDashboard() {
    const { auth, orders } = usePage<PageProps>().props;
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'awaiting_approval' | 'approved' | 'preparing' | 'ready' | 'out_for_delivery' | 'at_location' | 'delivered' | 'rejected'>('all');

    usePolling({ interval: 5000, enabled: true });

    const filteredOrders = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return orders.filter((order) => {
            const matchesSearch = term === '' || order.id.toString().includes(term);
            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [orders, searchTerm, statusFilter]);

    const getStatusBadge = (status: string, deliveryType?: string) => {
        let label = status;
        let className = 'bg-slate-500/10 text-slate-500 border-slate-500/20';

        if (status === 'awaiting_approval') {
            label = 'Pendiente de Aprobación';
            className = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        } else if (status === 'approved') {
            label = 'Aprobado';
            className = 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        } else if (status === 'preparing') {
            label = 'En Preparación';
            className = 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        } else if (status === 'ready') {
            label = deliveryType === 'takeaway' ? 'Listo para retirar' : 'Esperando Cadete';
            className = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        } else if (status === 'out_for_delivery') {
            label = 'Enviando al Cadete';
            className = 'bg-sky-500/10 text-sky-500 border-sky-500/20';
        } else if (status === 'at_location') {
            label = 'El Cadete Está Afuera';
            className = 'bg-orange-500/10 text-orange-500 border-orange-500/20';
        } else if (status === 'delivered') {
            label = 'Entregado';
            className = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        } else if (status === 'rejected') {
            label = 'Rechazado';
            className = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
        }

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
                {label}
            </span>
        );
    };

    const getPaymentBadge = (paymentMethod: string, status: string) => {
        const isPaid = status === 'paid';
        const isFailed = status === 'failed';
        const isPending = status === 'pending_payment' || status === 'pay_later' || status === 'pending';

        if (paymentMethod !== 'effective') {
            if (isPaid) {
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        Pagado
                    </span>
                );
            }
            if (isFailed) {
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-rose-500/10 text-rose-500 border-rose-500/20">
                        Rechazado
                    </span>
                );
            }
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-amber-500/10 text-amber-500 border-amber-500/20">
                    Pendiente de pago
                </span>
            );
        }

        if (isPaid) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    Pago Completado
                </span>
            );
        }

        if (isPending) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-amber-500/10 text-amber-500 border-amber-500/20">
                    Paga Después
                </span>
            );
        }

        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-rose-500/10 text-rose-500 border-rose-500/20">
                {status}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 transition-colors duration-200">
            <Head title="Mi Cuenta - Empanadas 360" />
                <FlashAlert />
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            ¡Hola, <span className="text-amber-500">{auth.user.name}</span>!
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Revisá el historial de tus pedidos y su estado en tiempo real.
                        </p>
                    </div>

                    <Link
                        href="/mi-cuenta/menu"
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95 text-center"
                    >
                        Hacer un nuevo pedido
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/60 dark:bg-white/[0.02] p-4 rounded-3xl border border-slate-200/80 dark:border-white/10 backdrop-blur-md mb-6">
                    <div className="md:col-span-2 relative flex items-center">
                        <Search className="w-5 h-5 absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por número de pedido..."
                            className="w-full pl-11 pr-10 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-amber-500 focus:ring-amber-500/30 transition-all shadow-sm"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="relative flex items-center">
                        <Filter className="w-4 h-4 absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full pl-10 pr-8 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm text-slate-800 dark:text-white focus:border-amber-500 focus:ring-amber-500/30 transition-all shadow-sm font-medium"
                        >
                            <option value="all" className="dark:bg-[#0f0f11]">Todos los Estados</option>
                            <option value="awaiting_approval" className="dark:bg-[#0f0f11]">Pendiente de Aprobación</option>
                            <option value="approved" className="dark:bg-[#0f0f11]">Aprobado</option>
                            <option value="preparing" className="dark:bg-[#0f0f11]">En Preparación</option>
                            <option value="ready" className="dark:bg-[#0f0f11]">Listo</option>
                            <option value="out_for_delivery" className="dark:bg-[#0f0f11]">Viajando al Destino</option>
                            <option value="at_location" className="dark:bg-[#0f0f11]">El Cadete Está Afuera</option>
                            <option value="delivered" className="dark:bg-[#0f0f11]">Entregado</option>
                            <option value="rejected" className="dark:bg-[#0f0f11]">Rechazado</option>
                        </select>
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-8 sm:p-12 text-center max-w-lg mx-auto my-12">
                        <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                            🥟
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            No se encontraron pedidos
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            Intenta ajustar la búsqueda o los filtros aplicados.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {filteredOrders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-5 sm:p-6 flex flex-col justify-between shadow-sm hover:border-slate-300 dark:hover:border-white/20 transition-all"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-white/5">
                                        <div>
                                            <span className="font-bold text-lg text-slate-900 dark:text-white">
                                                Pedido #{order.id}
                                            </span>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                {formatDate(order.created_at)}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            {getStatusBadge(order.status, order.delivery_type)}
                                            {getPaymentBadge(order.payment_method, order.payment_status)}
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                            Detalle
                                        </p>
                                        {order.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex justify-between items-center text-sm py-1 border-b border-dashed border-slate-100 dark:border-white/5 last:border-none"
                                            >
                                                <span className="text-slate-700 dark:text-slate-300">
                                                    <strong className="text-amber-500 font-semibold">{item.quantity}x</strong>{' '}
                                                    {item.product?.name || 'Producto'}
                                                </span>
                                                <span className="font-medium text-slate-900 dark:text-slate-200">
                                                    ${Number(item.price * item.quantity).toLocaleString('es-AR')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {order.status === 'delivered' && !order.review ? (
                                        <ReviewForm orderId={order.id} />
                                    ) : order.review ? (
                                        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
                                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                                                Tu reseña
                                            </p>
                                            <div className="flex items-center gap-1 mb-1">
                                                <span className="text-xs text-slate-600 dark:text-slate-300">Comida:</span>
                                                <span className="text-amber-500 font-bold">{'★'.repeat(order.review.food_rating)}{'☆'.repeat(5 - order.review.food_rating)}</span>
                                            </div>
                                            {order.review.delivery_rating && (
                                                <div className="flex items-center gap-1 mb-1">
                                                    <span className="text-xs text-slate-600 dark:text-slate-300">Cadete:</span>
                                                    <span className="text-amber-500 font-bold">{'★'.repeat(order.review.delivery_rating)}{'☆'.repeat(5 - order.review.delivery_rating)}</span>
                                                </div>
                                            )}
                                            {order.review.comment && (
                                                <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{order.review.comment}"</p>
                                            )}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total</span>
                                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                                        ${Number(order.total_price).toLocaleString('es-AR')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
    return (
        <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">{label}</span>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    className="p-1"
                >
                    <Star
                        className={`w-5 h-5 ${star <= value ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-600'}`}
                    />
                </button>
            ))}
        </div>
    );
}

interface ReviewFormProps {
    orderId: number;
}

function ReviewForm({ orderId }: ReviewFormProps) {
    const [foodRating, setFoodRating] = useState(0);
    const [deliveryRating, setDeliveryRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!foodRating) return;

        router.post(
            route('client.orders.review', orderId),
            { food_rating: foodRating, delivery_rating: deliveryRating || undefined, comment: comment || undefined },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setSubmitted(true),
            }
        );
    };

    if (submitted) {
        return (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">¡Gracias por tu reseña!</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl space-y-3">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Calificá tu pedido</p>
            <StarRating value={foodRating} onChange={setFoodRating} label="Comida" />
            <StarRating value={deliveryRating} onChange={setDeliveryRating} label="Cadete" />
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Dejanos un comentario..."
                rows={2}
                className="w-full rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm p-2"
            />
            <button
                type="submit"
                disabled={!foodRating}
                className="px-4 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-white rounded-xl disabled:opacity-50"
            >
                Enviar Reseña
            </button>
        </form>
    );
}