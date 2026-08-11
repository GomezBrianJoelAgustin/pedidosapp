import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Package, MapPin, CreditCard, Star, Lock, CheckCircle, XCircle } from 'lucide-react';
import FlashAlert from '@/components/flash-alert';

interface OrderItem {
    id: number;
    quantity: number;
    price: number;
    product: {
        name: string;
    };
}

interface Order {
    id: number;
    status: string;
    payment_method: string;
    payment_status: string;
    pin: string;
    delivery_type: string;
    delivery_address: string | null;
    total_price: number;
    created_at: string;
    items: OrderItem[];
    review?: {
        food_rating: number;
        delivery_rating?: number;
        comment?: string;
    } | null;
}

interface Review {
    id: number;
    food_rating: number;
    delivery_rating?: number;
    comment?: string;
}

interface PageProps {
    order: Order;
    review: Review | null;
    canReview: boolean;
}

export default function PublicTracking({ order, review, canReview }: PageProps) {
    const [foodRating, setFoodRating] = useState(0);
    const [deliveryRating, setDeliveryRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (order?.id) {
            localStorage.setItem('active_guest_order', String(order.id));
        }
    }, [order?.id]);

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, { label: string; className: string }> = {
            awaiting_approval: { label: 'Pendiente de Aprobación', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
            approved: { label: 'Aprobado', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
            preparing: { label: 'En Preparación', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
            ready: { label: order.delivery_type === 'takeaway' ? 'Listo para retirar' : 'Esperando Cadete', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
            out_for_delivery: { label: 'Enviando al Cadete', className: 'bg-sky-500/10 text-sky-500 border-sky-500/20' },
            at_location: { label: 'El Cadete Está Afuera', className: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
            delivered: { label: 'Entregado', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
            rejected: { label: 'Rechazado', className: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
        };

        const badge = map[status] || { label: status, className: 'bg-slate-500/10 text-slate-500 border-slate-500/20' };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}>
                {badge.label}
            </span>
        );
    };

    const getPaymentBadge = (paymentMethod: string, paymentStatus: string) => {
        if (paymentMethod !== 'effective') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
                    {paymentStatus === 'paid' ? 'Pagado' : paymentStatus === 'failed' ? 'Rechazado' : 'Pendiente'}
                </span>
            );
        }

        if (paymentStatus === 'paid') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    Pago Completado
                </span>
            );
        }

        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-amber-500/10 text-amber-500 border-amber-500/20">
                Paga Después
            </span>
        );
    };

    const handleReviewSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!foodRating) return;

        router.post(
            route('public.orders.review', order.id),
            { food_rating: foodRating, delivery_rating: deliveryRating || undefined, comment: comment || undefined },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setSubmitted(true),
            }
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 p-4 sm:p-6 font-sans">
            <Head title={`Seguimiento del Pedido #${order.id}`} />
            <main className="max-w-2xl mx-auto space-y-6">
                <FlashAlert />

                <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-white/5">
                        <div>
                            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                                Pedido #{order.id}
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {new Date(order.created_at).toLocaleString('es-AR')}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                            {getStatusBadge(order.status)}
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

                    {order.pin && order.status !== 'delivered' && (
                        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                                PIN de entrega
                            </p>
                            <p className="text-2xl font-black text-amber-700 dark:text-amber-300 tracking-[0.2em] text-center">
                                {order.pin}
                            </p>
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 text-center">
                                Dictá este código al cadete al momento de la entrega.
                            </p>
                        </div>
                    )}

                    {order.status === 'delivered' && !review && canReview && !submitted && (
                        <form onSubmit={handleReviewSubmit} className="mb-4 p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl space-y-3">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Calificá tu pedido</p>
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Comida:</span>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setFoodRating(star)}
                                        className="p-1"
                                    >
                                        <Star
                                            className={`w-5 h-5 ${star <= foodRating ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-600'}`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Cadete:</span>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setDeliveryRating(star)}
                                        className="p-1"
                                    >
                                        <Star
                                            className={`w-5 h-5 ${star <= deliveryRating ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-600'}`}
                                        />
                                    </button>
                                ))}
                            </div>
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
                    )}

                    {order.status === 'delivered' && review && (
                        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                                Tu reseña
                            </p>
                            <div className="flex items-center gap-1 mb-1">
                                <span className="text-xs text-slate-600 dark:text-slate-300">Comida:</span>
                                <span className="text-amber-500 font-bold">{'★'.repeat(review.food_rating)}{'☆'.repeat(5 - review.food_rating)}</span>
                            </div>
                            {review.delivery_rating && (
                                <div className="flex items-center gap-1 mb-1">
                                    <span className="text-xs text-slate-600 dark:text-slate-300">Cadete:</span>
                                    <span className="text-amber-500 font-bold">{'★'.repeat(review.delivery_rating)}{'☆'.repeat(5 - review.delivery_rating)}</span>
                                </div>
                            )}
                            {review.comment && (
                                <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{review.comment}"</p>
                            )}
                        </div>
                    )}

                    <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total</span>
                        <span className="text-xl font-bold text-slate-900 dark:text-white">
                            ${Number(order.total_price).toLocaleString('es-AR')}
                        </span>
                    </div>
                    <div className="mt-4">
                        <a
                            href="/"
                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-bold bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-xl"
                        >
                            Volver al Inicio
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
}
