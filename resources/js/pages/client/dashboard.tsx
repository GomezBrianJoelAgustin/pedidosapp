import FlashAlert from '@/components/flash-alert';
import { Head, Link, usePage } from '@inertiajs/react';
import React from 'react';

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

interface Order {
    id: number;
    status: string;
    payment_status: string;
    total_price: number;
    created_at: string;
    items: OrderItem[];
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

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; class: string }> = {
            pending: { label: 'Pendiente', class: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
            in_progress: { label: 'En Preparación', class: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
            completed: { label: 'Completado', class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
            cancelled: { label: 'Cancelado', class: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
        };

        const config = statusMap[status] || {
            label: status,
            class: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.class}`}>
                {config.label}
            </span>
        );
    };

    const getPaymentBadge = (status: string) => {
        const isPaid = status === 'paid';
        return (
            <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    isPaid
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                }`}
            >
                {isPaid ? 'Pagado' : 'Pendiente de pago'}
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

                {orders.length === 0 ? (
                    <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-8 sm:p-12 text-center max-w-lg mx-auto my-12">
                        <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                            🥟
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            Todavía no hiciste ningún pedido
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            Echale un vistazo a nuestro menú y realizá tu primera compra en unos simples pasos.
                        </p>
                        <Link
                            href="/mi-cuenta/menu"
                            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition-all shadow-md shadow-amber-500/20"
                        >
                            Ver menú
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {orders.map((order) => (
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
                                            {getStatusBadge(order.status)}
                                            {getPaymentBadge(order.payment_status)}
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