import { useState, useMemo, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import { ChefHat, Clock, Package, User, MapPin, CreditCard, Eye, CheckCircle, X, Filter, Search, ChevronRight, Bell, DollarSign } from 'lucide-react';
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
    orders: { data: Order[]; current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null; path: string } | Order[];
}

export default function KitchenIndex({ orders }: PageProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'preparing' | 'ready'>('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [modalDetail, setModalDetail] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const orderList = useMemo(() => {
        return Array.isArray(orders) ? orders : orders?.data || [];
    }, [orders]);

    const { refresh } = usePolling({
        interval: 5000,
        enabled: true,
        onNewOrder: () => {
            setToast('¡Nuevo pedido recibido!');
            setTimeout(() => setToast(null), 4000);
        },
    });

    useEffect(() => {
        if (!orders) return;
        const list = Array.isArray(orders) ? orders : orders?.data || [];
        if (list.length > orderList.length && orderList.length > 0) {
            setToast('¡Nuevo pedido recibido!');
            setTimeout(() => setToast(null), 4000);
        }
    }, [orders]);

    const filteredOrders = useMemo(() => {
        return orderList.filter((order) => {
            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
            const term = searchTerm.toLowerCase().trim();
            const matchesSearch =
                term === '' ||
                order.id.toString().includes(term) ||
                order.user?.name?.toLowerCase().includes(term) ||
                order.guest_name?.toLowerCase().includes(term) ||
                order.guest_phone?.toLowerCase().includes(term);

            return matchesStatus && matchesSearch;
        });
    }, [orderList, searchTerm, statusFilter]);

    const handleOpenDetail = (order: Order) => {
        setSelectedOrder(order);
        setModalDetail(true);
    };

    const updateStatus = (orderId: number, status: 'preparing' | 'ready') => {
        router.put(route('kitchen.orders.update', orderId), { status }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                if (selectedOrder?.id === orderId) {
                    setSelectedOrder({ ...selectedOrder, status });
                }
            },
        });
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
    };

    const getPaymentBadge = (paymentMethod: string, paymentStatus: string) => {
        if (paymentMethod !== 'effective') {
            return (
                <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    {paymentStatus === 'paid' ? 'Pagado' : paymentStatus === 'failed' ? 'Rechazado' : 'Pendiente'}
                </span>
            );
        }

        const isPaid = paymentStatus === 'paid';
        const isPending = paymentStatus === 'pending_payment' || paymentStatus === 'pay_later' || paymentStatus === 'pending';

        if (isPaid) {
            return (
                <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    Pago Completado
                </span>
            );
        }

        if (isPending) {
            return (
                <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    Paga Después
                </span>
            );
        }

        return (
            <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#e63946]/10 text-[#e63946] border-[#e63946]/20 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                {paymentStatus}
            </span>
        );
    };

    const statusBadge: Record<string, { label: string; className: string }> = {
        awaiting_approval: { label: 'Pendiente de Aprobación', className: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' },
        approved: { label: 'Aprobado', className: 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20' },
        preparing: { label: 'En Preparación', className: 'bg-[#e07a38]/10 text-[#e07a38] border-[#e07a38]/20' },
        ready: { label: 'Listo', className: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' },
        out_for_delivery: { label: 'Enviando al Cadete', className: 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20' },
        at_location: { label: 'El Cadete Está Afuera', className: 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20' },
        delivered: { label: 'Entregado', className: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' },
        rejected: { label: 'Rechazado', className: 'bg-[#e63946]/10 text-[#e63946] border-[#e63946]/20' },
    };

    const pendingCount = orderList.filter((o) => o.status === 'approved').length;
    const preparingCount = orderList.filter((o) => o.status === 'preparing').length;
    const readyCount = orderList.filter((o) => o.status === 'ready').length;

    return (
        <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 font-sans transition-colors duration-200">
            <div className="max-w-7xl mx-auto space-y-6">
                <FlashAlert />

                {toast && (
                    <div className="fixed top-4 right-4 z-50 bg-amber-500 text-white px-6 py-3 rounded-2xl shadow-lg shadow-amber-500/30 flex items-center gap-2 animate-bounce">
                        <Bell className="w-5 h-5" />
                        <span className="font-bold text-sm">{toast}</span>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-5 sm:p-6 rounded-3xl border border-border backdrop-blur-xl shadow-sm dark:shadow-none">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2 sm:gap-3">
                            <ChefHat className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500 dark:text-amber-400" /> Panel de Cocina
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">Gestiona los pedidos y su preparación</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-amber-100 dark:bg-amber-500/10 rounded-xl">
                            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pendientes</p>
                            <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{pendingCount}</p>
                        </div>
                    </div>
                    <div className="bg-[#d4af37]/5 border border-[#d4af37]/20 rounded-2xl p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-[#d4af37]/10 rounded-xl">
                            <ChefHat className="w-5 h-5 text-[#e07a38]" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[#e07a38] uppercase tracking-wider">En Preparación</p>
                            <p className="text-2xl font-black text-[#d4af37]">{preparingCount}</p>
                        </div>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl">
                            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Listos</p>
                            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{readyCount}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-4 rounded-3xl border border-border backdrop-blur-md">
                    <div className="md:col-span-2 relative flex items-center">
                        <Search className="w-5 h-5 absolute left-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por ID (#123), cliente, invitado..."
                            className="w-full pl-11 pr-10 py-3 bg-card border border-border rounded-2xl text-sm text-foreground placeholder-slate-400 dark:placeholder-slate-500 focus:border-amber-500 focus:ring-amber-500/30 transition-all shadow-sm"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-3 p-1 text-muted-foreground hover:text-foreground rounded-lg">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="relative flex items-center">
                        <Filter className="w-4 h-4 absolute left-4 text-muted-foreground pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full pl-10 pr-8 py-3 bg-card border border-border rounded-2xl text-sm text-foreground focus:border-amber-500 focus:ring-amber-500/30 transition-all shadow-sm font-medium"
                        >
                            <option value="all" className="dark:bg-[#0f0f11]">Todos los Estados</option>
                            <option value="approved" className="dark:bg-[#0f0f11]">Aprobado</option>
                            <option value="preparing" className="dark:bg-[#0f0f11]">En Preparación</option>
                            <option value="ready" className="dark:bg-[#0f0f11]">Listo</option>
                        </select>
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="bg-card border border-border rounded-3xl p-10 sm:p-16 text-center text-muted-foreground space-y-2">
                        <p className="font-semibold text-lg">No se encontraron pedidos</p>
                        <p className="text-xs">Intenta ajustar la búsqueda o los filtros aplicados.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {filteredOrders.map((order) => {
                            const badge = statusBadge[order.status] || statusBadge['awaiting_approval'];
                            return (
                                <div key={order.id} className="bg-card hover:dark:bg-white/[0.05] border border-border hover:border-slate-300 dark:hover:border-white/20 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-none transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between group">
                                    <div>
                                        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                                            <div>
                                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pedido</span>
                                                <h3 className="text-xl font-extrabold text-foreground">#{order.id}</h3>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Total</span>
                                                <span className="text-lg font-black text-amber-600 dark:text-amber-400">{formatMoney(order.total_price)}</span>
                                            </div>
                                        </div>

                                        <div className="mb-4 bg-card p-3 rounded-2xl border border-border">
                                            {order.user ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="p-1 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                                                        <User className="w-4 h-4" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-foreground truncate">{order.user.name}</p>
                                                        <span className="text-[10px] uppercase tracking-wider font-bold text-amber-500">Cliente Registrado</span>
                                                    </div>
                                                </div>
                                            ) : order.guest_name ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="p-1 bg-purple-500/10 text-purple-400 rounded-lg shrink-0">
                                                        <User className="w-4 h-4" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-foreground truncate">{order.guest_name}</p>
                                                        <span className="text-[10px] uppercase tracking-wider font-bold text-purple-400">Invitado</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">Sin datos de cliente</span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                 <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${statusBadge[order.status]?.className || statusBadge['awaiting_approval'].className}`}>
                                     {statusBadge[order.status]?.label || order.status}
                                 </span>
                                            {getPaymentBadge(order.payment_method, order.payment_status)}
                                        </div>

                                        <div className="text-xs text-muted-foreground space-y-2 mb-6">
                                            <p className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                {new Date(order.created_at).toLocaleString('es-AR')}
                                            </p>
                                            {order.delivery_type !== 'takeaway' && (
                                                <p className="flex items-center gap-2 truncate">
                                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                                    {order.delivery_address || 'Retiro en Local'}
                                                </p>
                                            )}
                                            <p className="flex items-center gap-2">
                                                <Package className="w-4 h-4 text-muted-foreground" />
                                                {order.items?.length || 0} ítem(s)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-4 border-t border-border">
                                        <button
                                            onClick={() => handleOpenDetail(order)}
                                            className="flex-1 py-2.5 px-3 bg-[#d4af37]/10 hover:bg-[#d4af37] text-[#d4af37] hover:text-white border border-[#d4af37]/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                        >
                                            <Eye className="w-4 h-4" /> Detalle
                                        </button>
                                        {order.status === 'approved' && (
                                            <button
                                                onClick={() => updateStatus(order.id, 'preparing')}
                                                className="flex-1 py-2.5 px-3 bg-[#d4af37]/10 hover:bg-[#d4af37] text-[#d4af37] hover:text-white border border-[#d4af37]/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                            >
                                                <ChefHat className="w-4 h-4" /> Aceptar
                                            </button>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button
                                                onClick={() => updateStatus(order.id, 'ready')}
                                                className="flex-1 py-2.5 px-3 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white border border-emerald-200 dark:border-emerald-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                            >
                                                <CheckCircle className="w-4 h-4" /> Listo
                                            </button>
                                        )}
                                        {order.status === 'ready' && (
                                            <span className="flex-1 py-2.5 px-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5">
                                                <CheckCircle className="w-4 h-4" />
                                                {order.delivery_type === 'takeaway' ? 'Listo para retirar' : 'Esperando Cadete'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {Array.isArray(orders) === false && orders.last_page > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <button
                        disabled={orders.current_page === 1}
                        onClick={() => window.location.href = `${orders.path}?page=${orders.current_page - 1}`}
                        className="px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Anterior
                    </button>
                    <span className="text-xs text-muted-foreground">
                        Página {orders.current_page} de {orders.last_page}
                    </span>
                    <button
                        disabled={orders.current_page === orders.last_page}
                        onClick={() => window.location.href = `${orders.path}?page=${orders.current_page + 1}`}
                        className="px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Siguiente
                    </button>
                </div>
            )}

            {modalDetail && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
                        <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between bg-card shrink-0">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-foreground">Detalle del Pedido #{selectedOrder.id}</h2>
                                <p className="text-xs text-muted-foreground">{new Date(selectedOrder.created_at).toLocaleString('es-AR')}</p>
                            </div>
                            <button onClick={() => setModalDetail(false)} className="text-muted-foreground hover:text-foreground p-2 rounded-xl bg-card">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-card p-4 rounded-2xl border border-border">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Cliente / Comprador</p>
                                    {selectedOrder.user ? (
                                        <div className="flex items-center gap-2">
                                            <span className="p-1 bg-amber-500/10 text-amber-500 rounded-lg">
                                                <User className="w-4 h-4" />
                                            </span>
                                            <p className="font-medium text-foreground">{selectedOrder.user.name}</p>
                                        </div>
                                    ) : selectedOrder.guest_name ? (
                                        <p className="font-medium text-foreground">{selectedOrder.guest_name} <span className="text-muted-foreground">({selectedOrder.guest_phone})</span></p>
                                    ) : (
                                        <span className="text-muted-foreground">Sin datos</span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Repartidor</p>
                                    <p className="font-medium text-foreground flex items-center gap-1.5 mt-1">
                                        <User className="w-4 h-4 text-muted-foreground" /> {selectedOrder.delivery?.name || 'Sin asignar'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Tipo Entrega</p>
                                    <p className="font-medium text-foreground capitalize mt-1">{selectedOrder.delivery_type}</p>
                                </div>
                                {selectedOrder.delivery_type !== 'takeaway' && (
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase">Dirección</p>
                                        <p className="font-medium text-foreground flex items-center gap-1.5 mt-1">
                                            <MapPin className="w-4 h-4 text-muted-foreground" /> {selectedOrder.delivery_address || 'Retiro en Local'}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Pago</p>
                                    <p className="font-medium text-foreground mt-1 capitalize">{selectedOrder.payment_method} ({selectedOrder.payment_status})</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">PIN de Validación</p>
                                    <p className="font-mono text-lg font-black text-muted-foreground mt-1 tracking-widest">••••</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">Solicitá el PIN al cliente al momento de la entrega.</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Ítems del Pedido
                                </h3>
                                <div className="border border-border rounded-2xl overflow-hidden overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-card text-xs font-semibold text-muted-foreground uppercase border-b border-border">
                                            <tr>
                                                <th className="py-3 px-4">Producto</th>
                                                <th className="py-3 px-4 text-center">Cant.</th>
                                                <th className="py-3 px-4 text-right">Precio Un.</th>
                                                <th className="py-3 px-4 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {selectedOrder.items?.map((item) => (
                                                <tr key={item.id} className="hover:bg-card">
                                                    <td className="py-3 px-4 font-medium text-foreground">
                                                        {item.product?.name || `Producto #${item.product_id}`}
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-muted-foreground">{item.quantity}</td>
                                                    <td className="py-3 px-4 text-right text-muted-foreground">{formatMoney(item.price)}</td>
                                                    <td className="py-3 px-4 text-right font-bold text-amber-600 dark:text-amber-400">
                                                        {formatMoney(item.price * item.quantity)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-border">
                                <span className="font-bold text-muted-foreground">Total a Pagar:</span>
                                <span className="text-2xl font-black text-foreground dark:text-amber-400">{formatMoney(selectedOrder.total_price)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

