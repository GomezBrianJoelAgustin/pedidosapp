import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Package, MapPin, CreditCard, Star, Lock, CheckCircle, XCircle } from 'lucide-react';
import FlashAlert from '@/components/flash-alert';
import { usePolling } from '@/hooks/use-polling';

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

    usePolling({ interval: 5000, enabled: true });

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, { label: string; className: string }> = {
            awaiting_approval: { label: 'Pendiente de Aprobación', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
            approved: { label: 'Aprobado', className: 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20' },
            preparing: { label: 'En Preparación', className: 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20' },
            ready: { label: order.delivery_type === 'takeaway' ? 'Listo para retirar' : 'Esperando Cadete', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
            out_for_delivery: { label: 'Enviando al Cadete', className: 'bg-sky-500/10 text-sky-500 border-sky-500/20' },
            at_location: { label: 'El Cadete Está Afuera', className: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
            delivered: { label: 'Entregado', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
            rejected: { label: 'Rechazado', className: 'bg-[#e63946]/10 text-[#e63946] border-[#e63946]/20' },
        };

        const badge = map[status] || { label: status, className: 'bg-white/5 text-muted-foreground border-border' };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}>
                {badge.label}
            </span>
        );
    };

    const getPaymentBadge = (paymentMethod: string, paymentStatus: string) => {
        const isRejected = paymentStatus === 'failed' || paymentStatus === 'rejected';

        if (paymentMethod !== 'effective') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20">
                    {paymentStatus === 'paid' ? 'Pagado' : isRejected ? 'Rechazado' : 'Pendiente'}
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

        if (isRejected) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-[#e63946]/10 text-[#e63946] border-[#e63946]/20">
                    Pago Rechazado
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
        <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 font-sans">
            <Head title={`Seguimiento del Pedido #${order.id}`} />
            <main className="max-w-2xl mx-auto space-y-6">
                <FlashAlert />

                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-border">
                        <div>
                            <h1 className="text-xl font-extrabold text-foreground">
                                Pedido #{order.id}
                            </h1>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(order.created_at).toLocaleString('es-AR')}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                            {getStatusBadge(order.status)}
                            {getPaymentBadge(order.payment_method, order.payment_status)}
                        </div>
                    </div>

                    <div className="space-y-2 mb-6">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Detalle
                        </p>
                        {order.items.map((item) => (
                            <div
                                key={item.id}
                                className="flex justify-between items-center text-sm py-1 border-b border-dashed border-border last:border-none"
                            >
                                <span className="text-foreground">
                                    <strong className="text-primary font-semibold">{item.quantity}x</strong>{' '}
                                    {item.product?.name || 'Producto'}
                                </span>
                                <span className="font-medium text-foreground">
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

                    {(order.delivery_type || order.delivery_address) && (
                        <div className="mb-4 p-3 bg-background border border-border rounded-xl space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                Datos de entrega
                            </p>
                            {order.delivery_type && (
                                <p className="text-sm text-foreground capitalize">
                                    <span className="text-muted-foreground">Tipo:</span> {order.delivery_type === 'takeaway' ? 'Retiro en local' : 'Envío a domicilio'}
                                </p>
                            )}
                            {order.delivery_address && (
                                <p className="text-sm text-foreground">
                                    <span className="text-muted-foreground">Dirección:</span> {order.delivery_address}
                                </p>
                            )}
                        </div>
                    )}

                    {order.status === 'delivered' && !review && canReview && !submitted && (
                        <form onSubmit={handleReviewSubmit} className="mb-4 p-4 bg-background border border-border rounded-2xl space-y-3">
                            <p className="text-xs font-bold text-muted-foreground uppercase">Calificá tu pedido</p>
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-semibold text-muted-foreground mr-1">Comida:</span>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setFoodRating(star)}
                                        className="p-1"
                                    >
                                        <Star
                                            className={`w-5 h-5 ${star <= foodRating ? 'text-primary fill-primary' : 'text-muted-foreground'}`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-semibold text-muted-foreground mr-1">Cadete:</span>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setDeliveryRating(star)}
                                        className="p-1"
                                    >
                                        <Star
                                            className={`w-5 h-5 ${star <= deliveryRating ? 'text-primary fill-primary' : 'text-muted-foreground'}`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Dejanos un comentario..."
                                rows={2}
                                className="w-full rounded-xl bg-background border border-border text-sm p-2"
                            />
                            <button
                                type="submit"
                                disabled={!foodRating}
                                className="px-4 py-2 text-sm font-bold bg-primary hover:bg-[#d46d2e] text-white rounded-xl disabled:opacity-50"
                            >
                                Enviar Reseña
                            </button>
                        </form>
                    )}

                    {order.status === 'delivered' && review && (
                        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <p className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider mb-1">
                                Tu reseña
                            </p>
                            <div className="flex items-center gap-1 mb-1">
                                <span className="text-xs text-muted-foreground">Comida:</span>
                                <span className="text-primary font-bold">{'★'.repeat(review.food_rating)}{'☆'.repeat(5 - review.food_rating)}</span>
                            </div>
                            {review.delivery_rating && (
                                <div className="flex items-center gap-1 mb-1">
                                    <span className="text-xs text-muted-foreground">Cadete:</span>
                                    <span className="text-primary font-bold">{'★'.repeat(review.delivery_rating)}{'☆'.repeat(5 - review.delivery_rating)}</span>
                                </div>
                            )}
                            {review.comment && (
                                <p className="text-xs text-muted-foreground italic">"{review.comment}"</p>
                            )}
                        </div>
                    )}

                    <div className="pt-4 border-t border-border flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Total</span>
                        <span className="text-xl font-bold text-foreground">
                            ${Number(order.total_price).toLocaleString('es-AR')}
                        </span>
                    </div>
                    <div className="mt-4">
                        <a
                            href="/"
                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-bold bg-white/5 hover:bg-white/10 text-foreground border border-border rounded-xl"
                        >
                            Volver al Inicio
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
}
