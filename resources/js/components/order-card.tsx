import { type ReactNode } from 'react';
import { CreditCard, Eye, ChefHat, CheckCircle, Truck, Lock, DollarSign, MapPin, Package, Clock } from 'lucide-react';

interface OrderItemLite {
    id: number;
    product_id: number;
    quantity: number;
    price: number;
    product?: { name?: string };
}

interface Order {
    id: number;
    status: string;
    delivery_type: string;
    payment_method: string;
    payment_status: string;
    total_price: number;
    pin?: string;
    guest_name?: string | null;
    guest_phone?: string | null;
    created_at: string;
    items?: OrderItemLite[];
    user?: { name?: string } | null;
    delivery?: { name?: string } | null;
    delivery_address?: string | null;
}

interface OrderCardProps {
    order: Order;
    accent?: 'clay' | 'ember' | 'gold' | 'ember-glow';
    header?: ReactNode;
    footer?: ReactNode;
    onClick?: () => void;
}

const accentClasses: Record<string, string> = {
    clay: 'border-clay/40 bg-clay/5',
    ember: 'border-ember/40 bg-ember/5',
    gold: 'border-gold/40 bg-gold/5',
    'ember-glow': 'border-ember/40 bg-ember/5 shadow-[0_0_25px_-8px_var(--ember-glow)]',
};

export default function OrderCard({ order, accent = 'clay', header, footer, onClick }: OrderCardProps) {
    const customer = order.user?.name || order.guest_name || 'Sin datos';
    const customerLabel = order.user ? 'Cliente Registrado' : order.guest_name ? 'Invitado' : 'Sin datos';
    const itemCount = order.items?.length || 0;
    const itemsPreview = order.items?.slice(0, 3).map(item => item.product?.name || `#${item.product_id}`).join(', ') || 'Sin items';
    const moreItems = itemCount > 3 ? ` +${itemCount - 3}` : '';

    const paymentBadge = () => {
        const isCard = order.payment_method === 'card';
        const isPaid = order.payment_status === 'paid';
        const isFailed = order.payment_status === 'failed';
        const isPending = order.payment_status === 'pending';

        if (isCard && isPaid) {
            return (
                <span className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <DollarSign className="w-3 h-3" />
                    Pagado
                </span>
            );
        }

        if (isCard && isFailed) {
            return (
                <span className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-300 border border-rose-500/20">
                    <DollarSign className="w-3 h-3" />
                    Rechazado
                </span>
            );
        }

        if (isCard && isPending) {
            return (
                <span className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    <DollarSign className="w-3 h-3" />
                    Pendiente
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-clay/10 text-clay-foreground border border-clay/20">
                <DollarSign className="w-3 h-3" />
                Efectivo
            </span>
        );
    };

    return (
        <div
            onClick={onClick}
            className={`group relative flex flex-col justify-between rounded-2xl border ${accentClasses[accent]} p-4 sm:p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer`}
        >
            <div>
                <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3 mb-3">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-warm-white/50">Pedido</p>
                        <p className="text-xl font-black text-warm-white">#{order.id}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-warm-white/50">Total</p>
                        <p className="text-lg font-black text-gold">
                            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(order.total_price)}
                        </p>
                    </div>
                </div>

                <div className="mb-3 rounded-xl bg-black/20 border border-white/5 p-3">
                    <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ember/10 text-ember">
                            <Eye className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-warm-white">{customer}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-warm-white/50">{customerLabel}</p>
                        </div>
                    </div>
                </div>

                <div className="mb-3 space-y-1.5 text-xs text-warm-white/70">
                    <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-warm-white/40" />
                        <span className="truncate">{new Date(order.created_at).toLocaleString('es-AR')}</span>
                    </div>
                    {order.delivery_type !== 'takeaway' && order.delivery_address && (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-warm-white/40" />
                            <span className="truncate">{order.delivery_address}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-warm-white/40" />
                        <span className="truncate">
                            {itemsPreview}{moreItems}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3">
                {paymentBadge()}
                {header}
                {footer}
            </div>
        </div>
    );
}
