import { useState, useMemo, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import {
    Truck, Package, User, MapPin, CreditCard,
    Eye, CheckCircle, X, Filter, Search, Lock, ChevronRight, Bell
} from 'lucide-react';
import FlashAlert from '@/components/flash-alert';
import { usePolling } from '@/hooks/use-polling';

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
    orders: { data: Order[] } | Order[];
}

export default function DeliveryIndex({ orders }: PageProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'delivered'>('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [modalDetail, setModalDetail] = useState(false);
    const [modalPin, setModalPin] = useState(false);
    const [pinError, setPinError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const { data: pinData, setData: setPinData, post: postPin, processing: pinProcessing, reset: resetPin } = useForm({
        pin: '',
    });

    const orderList = useMemo(() => {
        return Array.isArray(orders) ? orders : orders?.data || [];
    }, [orders]);

    const { refresh } = usePolling({
        interval: 5000,
        enabled: true,
        onNewOrder: () => {
            setToast('¡Nuevo pedido listo para entregar!');
            setTimeout(() => setToast(null), 4000);
        },
    });

    const filteredOrders = useMemo(() => {
        return orderList.filter((order) => {
            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
            const term = searchTerm.toLowerCase().trim();
            const matchesSearch =
                term === '' ||
                order.id.toString().includes(term) ||
                order.user?.name?.toLowerCase().includes(term) ||
                order.guest_name?.toLowerCase().includes(term) ||
                order.delivery_address?.toLowerCase().includes(term);

            return matchesStatus && matchesSearch;
        });
    }, [orderList, searchTerm, statusFilter]);

    const handleOpenDetail = (order: Order) => {
        setSelectedOrder(order);
        setModalDetail(true);
    };

    const handleOpenPin = (order: Order) => {
        setSelectedOrder(order);
        setPinError(null);
        setPinData('pin', '');
        setModalPin(true);
    };

    const handleValidatePin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder) return;

        postPin(route('delivery.orders.validate-pin', selectedOrder.id), {
            onSuccess: () => {
                setModalPin(false);
                resetPin();
            },
            onError: (errors) => {
                setPinError(errors.pin || 'Error al validar el PIN.');
            },
        });
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
    };

    const statusBadge: Record<string, { label: string; className: string }> = {
        awaiting_approval: { label: 'Pendiente de Aprobación', className: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' },
        approved: { label: 'Aprobado', className: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20' },
        preparing: { label: 'En Preparación', className: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20' },
        ready: { label: 'Listo para Entregar', className: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' },
        delivered: { label: 'Entregado', className: 'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20' },
        rejected: { label: 'Rechazado', className: 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20' },
    };

    const readyCount = orderList.filter((o) => o.status === 'ready').length;
    const deliveredCount = orderList.filter((o) => o.status === 'delivered').length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-800 dark:text-white p-4 sm:p-6 font-sans transition-colors duration-200">
            <div className="max-w-7xl mx-auto space-y-6">
                <FlashAlert />

                {toast && (
                    <div className="fixed top-4 right-4 z-50 bg-indigo-500 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center gap-2 animate-bounce">
                        <Bell className="w-5 h-5" />
                        <span className="font-bold text-sm">{toast}</span>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 dark:bg-white/[0.03] p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-sm dark:shadow-none">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2 sm:gap-3">
                            <Truck className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-500 dark:text-indigo-400" /> Panel de Cadetes
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Visualizá los pedidos listos y confirmá la entrega con PIN</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl">
                            <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Listos para Entregar</p>
                            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{readyCount}</p>
                        </div>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-500/5 border border-slate-200 dark:border-slate-500/20 rounded-2xl p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-500/10 rounded-xl">
                            <CheckCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Entregados</p>
                            <p className="text-2xl font-black text-slate-700 dark:text-slate-300">{deliveredCount}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/60 dark:bg-white/[0.02] p-4 rounded-3xl border border-slate-200/80 dark:border-white/10 backdrop-blur-md">
                    <div className="md:col-span-2 relative flex items-center">
                        <Search className="w-5 h-5 absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por ID (#123), cliente, dirección..."
                            className="w-full pl-11 pr-10 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-indigo-500/30 transition-all shadow-sm"
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
                            className="w-full pl-10 pr-8 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm text-slate-800 dark:text-white focus:border-indigo-500 focus:ring-indigo-500/30 transition-all shadow-sm font-medium"
                        >
                            <option value="all" className="dark:bg-[#0f0f11]">Todos los Estados</option>
                            <option value="ready" className="dark:bg-[#0f0f11]">Listo para Entregar</option>
                            <option value="delivered" className="dark:bg-[#0f0f11]">Entregado</option>
                        </select>
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl p-10 sm:p-16 text-center text-slate-400 dark:text-slate-500 space-y-2">
                        <p className="font-semibold text-lg">No se encontraron pedidos</p>
                        <p className="text-xs">Intenta ajustar la búsqueda o los filtros aplicados.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {filteredOrders.map((order) => {
                            const badge = statusBadge[order.status] || statusBadge['ready'];
                            return (
                                <div key={order.id} className="bg-white dark:bg-white/[0.03] hover:dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-none transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between group">
                                    <div>
                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4 mb-4">
                                            <div>
                                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pedido</span>
                                                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">#{order.id}</h3>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total</span>
                                                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{formatMoney(order.total_price)}</span>
                                            </div>
                                        </div>

                                        <div className="mb-4 bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-200/60 dark:border-white/5">
                                            {order.user ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="p-1 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                                                        <User className="w-4 h-4" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{order.user.name}</p>
                                                        <span className="text-[10px] uppercase tracking-wider font-bold text-amber-500">Cliente Registrado</span>
                                                    </div>
                                                </div>
                                            ) : order.guest_name ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="p-1 bg-purple-500/10 text-purple-400 rounded-lg shrink-0">
                                                        <User className="w-4 h-4" />
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
                                <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${statusBadge[order.status]?.className || statusBadge['awaiting_approval'].className}`}>
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
                                            onClick={() => handleOpenDetail(order)}
                                            className="flex-1 py-2.5 px-3 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white border border-blue-200 dark:border-blue-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                        >
                                            <Eye className="w-4 h-4" /> Detalle
                                        </button>
                                        {order.status === 'ready' && (
                                            <button
                                                onClick={() => handleOpenPin(order)}
                                                className="flex-1 py-2.5 px-3 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white border border-emerald-200 dark:border-emerald-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                            >
                                                <Lock className="w-4 h-4" /> Validar PIN
                                            </button>
                                        )}
                                        {order.status === 'delivered' && (
                                            <span className="flex-1 py-2.5 px-3 bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5">
                                                <CheckCircle className="w-4 h-4" /> Entregado
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
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
                                                <User className="w-4 h-4" />
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
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1">Repartidor Asignado</p>
                                    <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-1">
                                        <User className="w-4 h-4 text-slate-400 dark:text-slate-500" /> {selectedOrder.delivery?.name || 'Sin asignar'}
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
                                    <p className="font-mono text-lg font-black text-slate-400 dark:text-slate-600 mt-1 tracking-widest">••••</p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Solicitá el PIN al cliente al momento de la entrega.</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Ítems del Pedido
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
                                                    <td className="py-3 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
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
                                <span className="text-2xl font-black text-slate-900 dark:text-indigo-400">{formatMoney(selectedOrder.total_price)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {modalPin && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white dark:bg-[#0f0f11] border-t sm:border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm p-6 space-y-5">
                        <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-500/10 rounded-xl">
                                <Lock className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Validar Entrega</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Pedido #{selectedOrder.id}</p>
                            </div>
                        </div>

                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Ingresá el PIN de 4 dígitos que te mostró el cliente para confirmar la entrega.
                        </p>

                        {pinError && (
                            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-xl text-sm">
                                {pinError}
                            </div>
                        )}

                        <form onSubmit={handleValidatePin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">PIN de 4 dígitos</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={4}
                                    value={pinData.pin}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                        setPinData('pin', val);
                                        setPinError(null);
                                    }}
                                    placeholder="0000"
                                    className="w-full text-center text-3xl font-mono tracking-[0.5em] rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:border-indigo-500 focus:ring-indigo-500/30 py-4"
                                    autoFocus
                                />
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setModalPin(false); setPinError(null); }}
                                    className="px-4 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={pinProcessing || pinData.pin.length !== 4}
                                    className="px-5 py-2.5 text-sm font-bold bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirmar Entrega
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
