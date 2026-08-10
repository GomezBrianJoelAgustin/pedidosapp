import { useState, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';
import {
    Wallet, UserCheck, Clock, Package, MapPin, CreditCard,
    Eye, CheckCircle, X, Filter, Search, DollarSign, Truck, ChevronRight
} from 'lucide-react';
import FlashAlert from '@/components/flash-alert';

interface Product {
    id: number;
    name: string;
}

interface OrderItem {
    id: number;
    product_id: number;
    quantity: number;
    price: number;
    product?: Product;
}

interface UserRelation {
    id: number;
    name: string;
    email?: string;
}

interface DeliveryUser {
    id: number;
    name: string;
    email: string;
}

interface Order {
    id: number;
    user_id?: number | null;
    delivery_id: number;
    status: string;
    delivery_type: string;
    delivery_address: string | null;
    payment_method: string;
    payment_status: string;
    total_price: number;
    pin?: string;
    guest_name?: string | null;
    guest_phone?: string | null;
    created_at: string;
    items?: OrderItem[];
    user?: UserRelation | null;
    delivery?: UserRelation | null;
}

interface PageProps {
    pendingAssignment: Order[];
    pendingCashPayment: Order[];
    recentOrders: Order[];
    deliveryUsers: DeliveryUser[];
}

export default function CashierIndex({ pendingAssignment, pendingCashPayment, recentOrders, deliveryUsers }: PageProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [modalDetail, setModalDetail] = useState(false);
    const [modalAssign, setModalAssign] = useState(false);
    const [modalCash, setModalCash] = useState(false);

    const { data: assignData, setData: setAssignData, post: postAssign, processing: assignProcessing, reset: resetAssign } = useForm({
        delivery_id: '',
    });

    const { data: cashData, setData: setCashData, post: postCash, processing: cashProcessing, reset: resetCash } = useForm({
        payment_status: 'paid',
    });

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
    };

    const handleOpenAssign = (order: Order) => {
        setSelectedOrder(order);
        setAssignData('delivery_id', order.delivery_id?.toString() || '');
        setModalAssign(true);
    };

    const handleOpenCash = (order: Order) => {
        setSelectedOrder(order);
        setCashData('payment_status', 'paid');
        setModalCash(true);
    };

    const handleAssign = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder) return;

        postAssign(route('cashier.orders.assign-delivery', selectedOrder.id), {
            onSuccess: () => {
                setModalAssign(false);
                resetAssign();
            },
        });
    };

    const handleMarkCashPaid = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder) return;

        postCash(route('cashier.orders.mark-cash-paid', selectedOrder.id), {
            onSuccess: () => {
                setModalCash(false);
                resetCash();
            },
        });
    };

    const filteredRecentOrders = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return recentOrders;

        return recentOrders.filter((order) => {
            return (
                order.id.toString().includes(term) ||
                order.user?.name?.toLowerCase().includes(term) ||
                order.guest_name?.toLowerCase().includes(term) ||
                order.delivery_address?.toLowerCase().includes(term)
            );
        });
    }, [recentOrders, searchTerm]);

    const statusBadge: Record<string, { label: string; className: string }> = {
        pending: { label: 'Pendiente', className: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' },
        preparing: { label: 'En Preparación', className: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20' },
        ready: { label: 'Listo', className: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' },
        delivered: { label: 'Entregado', className: 'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20' },
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-800 dark:text-white p-4 sm:p-6 font-sans transition-colors duration-200">
            <div className="max-w-7xl mx-auto space-y-6">
                <FlashAlert />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 dark:bg-white/[0.03] p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-sm dark:shadow-none">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2 sm:gap-3">
                            <Wallet className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-500 dark:text-emerald-400" /> Panel de Caja
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Asigná cadetes y gestioná los pagos en efectivo</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-500/10 rounded-xl">
                            <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Pendientes de Asignación</p>
                            <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{pendingAssignment.length}</p>
                        </div>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-amber-100 dark:bg-amber-500/10 rounded-xl">
                            <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pagos en Efectivo Pendientes</p>
                            <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{pendingCashPayment.length}</p>
                        </div>
                    </div>
                </div>

                {pendingAssignment.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pedidos sin cadete asignado</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {pendingAssignment.map((order) => (
                                <div key={`assign-${order.id}`} className="bg-white dark:bg-white/[0.03] hover:dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-none transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4 mb-4">
                                            <div>
                                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pedido</span>
                                                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">#{order.id}</h3>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total</span>
                                                <span className="text-lg font-black text-blue-600 dark:text-blue-400">{formatMoney(order.total_price)}</span>
                                            </div>
                                        </div>

                                        <div className="mb-4 bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-200/60 dark:border-white/5">
                                            {order.user ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="p-1 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                                                        <UserCheck className="w-4 h-4" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{order.user.name}</p>
                                                        <span className="text-[10px] uppercase tracking-wider font-bold text-amber-500">Cliente Registrado</span>
                                                    </div>
                                                </div>
                                            ) : order.guest_name ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="p-1 bg-purple-500/10 text-purple-400 rounded-lg shrink-0">
                                                        <UserCheck className="w-4 h-4" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{order.guest_name}</p>
                                                        <span className="text-[10px] uppercase tracking-wider font-bold text-purple-400">Invitado</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-sm">Sin datos de cliente</span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${statusBadge[order.status]?.className || statusBadge['pending'].className}`}>
                                                {statusBadge[order.status]?.label || order.status}
                                            </span>
                                            <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 flex items-center gap-1">
                                                <CreditCard className="w-3.5 h-3.5" />
                                                {order.payment_method} ({order.payment_status})
                                            </span>
                                        </div>

                                        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2 mb-6">
                                            <p className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                                {order.delivery_address || 'Retiro en Local'}
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <Package className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                                {order.items?.length || 0} ítem(s)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-white/10">
                                        <button
                                            onClick={() => { setSelectedOrder(order); setModalDetail(true); }}
                                            className="flex-1 py-2.5 px-3 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white border border-blue-200 dark:border-blue-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                        >
                                            <Eye className="w-4 h-4" /> Detalle
                                        </button>
                                        <button
                                            onClick={() => handleOpenAssign(order)}
                                            className="flex-1 py-2.5 px-3 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white border border-emerald-200 dark:border-emerald-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                        >
                                            <Truck className="w-4 h-4" /> Asignar Cadete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {pendingCashPayment.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pagos en efectivo pendientes</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {pendingCashPayment.map((order) => (
                                <div key={`cash-${order.id}`} className="bg-white dark:bg-white/[0.03] hover:dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-none transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4 mb-4">
                                            <div>
                                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pedido</span>
                                                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">#{order.id}</h3>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total</span>
                                                <span className="text-lg font-black text-amber-600 dark:text-amber-400">{formatMoney(order.total_price)}</span>
                                            </div>
                                        </div>

                                        <div className="mb-4 bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-200/60 dark:border-white/5">
                                            {order.user ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="p-1 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                                                        <UserCheck className="w-4 h-4" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{order.user.name}</p>
                                                        <span className="text-[10px] uppercase tracking-wider font-bold text-amber-500">Cliente Registrado</span>
                                                    </div>
                                                </div>
                                            ) : order.guest_name ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="p-1 bg-purple-500/10 text-purple-400 rounded-lg shrink-0">
                                                        <UserCheck className="w-4 h-4" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{order.guest_name}</p>
                                                        <span className="text-[10px] uppercase tracking-wider font-bold text-purple-400">Invitado</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-sm">Sin datos de cliente</span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${statusBadge[order.status]?.className || statusBadge['pending'].className}`}>
                                                {statusBadge[order.status]?.label || order.status}
                                            </span>
                                            <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 flex items-center gap-1">
                                                <DollarSign className="w-3.5 h-3.5" />
                                                Efectivo - Pendiente
                                            </span>
                                        </div>

                                        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2 mb-6">
                                            <p className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                                {order.delivery_address || 'Retiro en Local'}
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <Package className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                                {order.items?.length || 0} ítem(s)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-white/10">
                                        <button
                                            onClick={() => { setSelectedOrder(order); setModalDetail(true); }}
                                            className="flex-1 py-2.5 px-3 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white border border-blue-200 dark:border-blue-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                        >
                                            <Eye className="w-4 h-4" /> Detalle
                                        </button>
                                        <button
                                            onClick={() => handleOpenCash(order)}
                                            className="flex-1 py-2.5 px-3 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-600 text-amber-600 dark:text-amber-400 hover:text-white border border-amber-200 dark:border-amber-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                        >
                                            <DollarSign className="w-4 h-4" /> Marcar Pagado
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pedidos Recientes</h2>
                    </div>
                    {filteredRecentOrders.length === 0 ? (
                        <div className="bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl p-10 text-center text-slate-400 dark:text-slate-500 space-y-2">
                            <p className="font-semibold text-lg">No hay pedidos recientes</p>
                            <p className="text-xs">Los pedidos aparecerán aquí una vez que se creen.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {filteredRecentOrders.map((order) => {
                                const badge = statusBadge[order.status] || statusBadge['pending'];
                                const isPendingAssignment = order.delivery_type === 'delivery' && !order.delivery_id;
                                const isPendingCash = order.payment_method === 'effective' && order.payment_status === 'pending';

                                return (
                                    <div key={`recent-${order.id}`} className="bg-white dark:bg-white/[0.03] hover:dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-none transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4 mb-4">
                                                <div>
                                                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pedido</span>
                                                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">#{order.id}</h3>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total</span>
                                                    <span className="text-lg font-black text-slate-600 dark:text-slate-400">{formatMoney(order.total_price)}</span>
                                                </div>
                                            </div>

                                            <div className="mb-4 bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-200/60 dark:border-white/5">
                                                {order.user ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="p-1 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                                                            <UserCheck className="w-4 h-4" />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{order.user.name}</p>
                                                            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-500">Cliente Registrado</span>
                                                        </div>
                                                    </div>
                                                ) : order.guest_name ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="p-1 bg-purple-500/10 text-purple-400 rounded-lg shrink-0">
                                                            <UserCheck className="w-4 h-4" />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{order.guest_name}</p>
                                                            <span className="text-[10px] uppercase tracking-wider font-bold text-purple-400">Invitado</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-sm">Sin datos de cliente</span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-4">
                                                <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${badge.className}`}>
                                                    {badge.label}
                                                </span>
                                                {isPendingAssignment && (
                                                    <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20">
                                                        Sin cadete
                                                    </span>
                                                )}
                                                {isPendingCash && (
                                                    <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20">
                                                        Efectivo pendiente
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2 mb-6">
                                                <p className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                                    {order.delivery_address || 'Retiro en Local'}
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                                    {order.items?.length || 0} ítem(s)
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-white/10">
                                            <button
                                                onClick={() => { setSelectedOrder(order); setModalDetail(true); }}
                                                className="flex-1 py-2.5 px-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                            >
                                                <Eye className="w-4 h-4" /> Detalle
                                            </button>
                                            {isPendingAssignment && (
                                                <button
                                                    onClick={() => handleOpenAssign(order)}
                                                    className="flex-1 py-2.5 px-3 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white border border-blue-200 dark:border-blue-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                                >
                                                    <Truck className="w-4 h-4" /> Asignar
                                                </button>
                                            )}
                                            {isPendingCash && (
                                                <button
                                                    onClick={() => handleOpenCash(order)}
                                                    className="flex-1 py-2.5 px-3 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-600 text-amber-600 dark:text-amber-400 hover:text-white border border-amber-200 dark:border-amber-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                                >
                                                    <DollarSign className="w-4 h-4" /> Cobrar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {modalDetail && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white dark:bg-[#0f0f11] border-t sm:border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
                        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02] shrink-0">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Detalle del Pedido #{selectedOrder.id}</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(selectedOrder.created_at).toLocaleString('es-AR')}</p>
                            </div>
                            <button onClick={() => setModalDetail(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-xl bg-slate-100 dark:bg-white/5">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200/60 dark:border-white/10">
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1">Cliente / Comprador</p>
                                    {selectedOrder.user ? (
                                        <div className="flex items-center gap-2">
                                            <span className="p-1 bg-amber-500/10 text-amber-500 rounded-lg">
                                                <UserCheck className="w-4 h-4" />
                                            </span>
                                            <p className="font-medium text-slate-800 dark:text-slate-200">{selectedOrder.user.name}</p>
                                        </div>
                                    ) : selectedOrder.guest_name ? (
                                        <p className="font-medium text-slate-800 dark:text-slate-200">{selectedOrder.guest_name} <span className="text-slate-400">({selectedOrder.guest_phone})</span></p>
                                    ) : (
                                        <span className="text-slate-400">Sin datos</span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1">Repartidor</p>
                                    <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-1">
                                        <UserCheck className="w-4 h-4 text-slate-400 dark:text-slate-500" /> {selectedOrder.delivery?.name || 'Sin asignar'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Tipo Entrega</p>
                                    <p className="font-medium text-slate-800 dark:text-slate-200 capitalize mt-1">{selectedOrder.delivery_type}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Dirección</p>
                                    <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-1">
                                        <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" /> {selectedOrder.delivery_address || 'Retiro en Local'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Pago</p>
                                    <p className="font-medium text-slate-800 dark:text-slate-200 mt-1 capitalize">{selectedOrder.payment_method} ({selectedOrder.payment_status})</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">PIN de Validación</p>
                                    <p className="font-mono text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-widest">{selectedOrder.pin || '----'}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Ítems del Pedido
                                </h3>
                                <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 dark:bg-white/5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-white/10">
                                            <tr>
                                                <th className="py-3 px-4">Producto</th>
                                                <th className="py-3 px-4 text-center">Cant.</th>
                                                <th className="py-3 px-4 text-right">Precio Un.</th>
                                                <th className="py-3 px-4 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                            {selectedOrder.items?.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                                                        {item.product?.name || `Producto #${item.product_id}`}
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-slate-500 dark:text-slate-400">{item.quantity}</td>
                                                    <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400">{formatMoney(item.price)}</td>
                                                    <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                        {formatMoney(item.price * item.quantity)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-white/10">
                                <span className="font-bold text-slate-500 dark:text-slate-400">Total a Pagar:</span>
                                <span className="text-2xl font-black text-slate-900 dark:text-emerald-400">{formatMoney(selectedOrder.total_price)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {modalAssign && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white dark:bg-[#0f0f11] border-t sm:border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm p-6 space-y-5">
                        <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                            <div className="p-2.5 bg-blue-100 dark:bg-blue-500/10 rounded-xl">
                                <Truck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Asignar Cadete</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Pedido #{selectedOrder.id}</p>
                            </div>
                        </div>

                        <form onSubmit={handleAssign} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Seleccionar Cadete</label>
                                <select
                                    value={assignData.delivery_id}
                                    onChange={(e) => setAssignData('delivery_id', e.target.value)}
                                    className="w-full rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-sm focus:border-blue-500 focus:ring-blue-500/30"
                                >
                                    <option value="">Seleccioná un cadete...</option>
                                    {deliveryUsers.map((user) => (
                                        <option key={user.id} value={user.id} className="dark:bg-[#0f0f11]">
                                            {user.name} ({user.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setModalAssign(false); resetAssign(); }}
                                    className="px-4 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={assignProcessing || !assignData.delivery_id}
                                    className="px-5 py-2.5 text-sm font-bold bg-blue-500 hover:bg-blue-400 text-white rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Asignar Cadete
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modalCash && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white dark:bg-[#0f0f11] border-t sm:border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm p-6 space-y-5">
                        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                            <div className="p-2.5 bg-amber-100 dark:bg-amber-500/10 rounded-xl">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Marcar como Pagado</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Pedido #{selectedOrder.id}</p>
                            </div>
                        </div>

                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Confirmá que el pago en efectivo fue recibido. El pedido se marcará como pagado.
                        </p>

                        <form onSubmit={handleMarkCashPaid} className="space-y-4">
                            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setModalCash(false); resetCash(); }}
                                    className="px-4 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={cashProcessing}
                                    className="px-5 py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-white rounded-xl shadow-lg shadow-amber-500/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirmar Pago
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
