import { useState, useMemo, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import { ChefHat, Clock, Package, User, MapPin, CreditCard, Eye, CheckCircle, X, Filter, Search, ChevronRight, Bell, DollarSign } from 'lucide-react';
import FlashAlert from '@/components/flash-alert';
import { usePolling } from '@/hooks/use-polling';
import OrderCard from '@/components/order-card';

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

const columns = [
    { key: 'approved', label: 'Pendientes', accent: 'gold' as const },
    { key: 'preparing', label: 'En Preparación', accent: 'ember' as const },
    { key: 'ready', label: 'Listos', accent: 'clay' as const },
];

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

    return (
        <div className="min-h-screen bg-forge text-warm-white p-3 sm:p-6 font-sans">
            <div className="max-w-[1600px] mx-auto space-y-6">
                <FlashAlert />

                {toast && (
                    <div className="fixed top-4 right-4 z-50 bg-ember text-white px-6 py-3 rounded-2xl shadow-lg shadow-ember/30 flex items-center gap-2 animate-bounce">
                        <Bell className="w-5 h-5" />
                        <span className="font-bold text-sm">{toast}</span>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-clay/10 border border-clay/20 p-5 sm:p-6 rounded-3xl">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-warm-white flex items-center gap-2 sm:gap-3">
                            <ChefHat className="w-7 h-7 sm:w-8 sm:h-8 text-gold" /> Panel de Cocina
                        </h1>
                        <p className="text-sm text-warm-white/60 mt-1">Gestiona los pedidos y su preparación</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {columns.map((column) => {
                        const count = filteredOrders.filter((o) => o.status === column.key).length;
                        return (
                            <div key={column.key} className="bg-clay/5 border border-clay/20 rounded-2xl p-4 flex items-center gap-3">
                                <div className="p-2.5 bg-ember/10 rounded-xl">
                                    <Clock className="w-5 h-5 text-ember" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-warm-white/60 uppercase tracking-wider">{column.label}</p>
                                    <p className="text-2xl font-black text-warm-white">{count}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-clay/5 p-4 rounded-3xl border border-clay/20">
                    <div className="md:col-span-2 relative flex items-center">
                        <Search className="w-5 h-5 absolute left-4 text-warm-white/40 pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por ID (#123), cliente, invitado..."
                            className="w-full pl-11 pr-10 py-3 bg-black/20 border border-clay/20 rounded-2xl text-sm text-warm-white placeholder:text-warm-white/40 focus:border-gold focus:ring-gold/30 transition-all shadow-sm"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-3 p-1 text-warm-white/40 hover:text-warm-white rounded-lg">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="relative flex items-center">
                        <Filter className="w-4 h-4 absolute left-4 text-warm-white/40 pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full pl-10 pr-8 py-3 bg-black/20 border border-clay/20 rounded-2xl text-sm text-warm-white focus:border-gold focus:ring-gold/30 transition-all shadow-sm font-medium"
                        >
                            <option value="all" className="dark:bg-[#0f0f11]">Todos los Estados</option>
                            <option value="approved" className="dark:bg-[#0f0f11]">Aprobado</option>
                            <option value="preparing" className="dark:bg-[#0f0f11]">En Preparación</option>
                            <option value="ready" className="dark:bg-[#0f0f11]">Listo</option>
                        </select>
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="bg-clay/5 border border-clay/20 rounded-3xl p-10 sm:p-16 text-center text-warm-white/50 space-y-2">
                        <p className="font-semibold text-lg">No se encontraron pedidos</p>
                        <p className="text-xs">Intenta ajustar la búsqueda o los filtros aplicados.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {columns.map((column) => {
                            const columnOrders = filteredOrders.filter((o) => o.status === column.key);
                            return (
                                <div key={column.key} className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-sm font-bold uppercase tracking-wider text-warm-white/70">{column.label}</h2>
                                        <span className="text-xs font-bold text-warm-white/40">{columnOrders.length}</span>
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        {columnOrders.map((order) => (
                                            <OrderCard
                                                key={order.id}
                                                order={order}
                                                accent={column.accent}
                                                header={
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenDetail(order);
                                                            }}
                                                            className="flex-1 py-2.5 px-3 bg-clay/10 hover:bg-clay/20 text-warm-white border border-clay/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                                        >
                                                            <Eye className="w-4 h-4" /> Detalle
                                                        </button>
                                                        {order.status === 'approved' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    updateStatus(order.id, 'preparing');
                                                                }}
                                                                className="flex-1 py-2.5 px-3 bg-ember/10 hover:bg-ember/20 text-ember border border-ember/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                                            >
                                                                <ChefHat className="w-4 h-4" /> Aceptar
                                                            </button>
                                                        )}
                                                        {order.status === 'preparing' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    updateStatus(order.id, 'ready');
                                                                }}
                                                                className="flex-1 py-2.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                                            >
                                                                <CheckCircle className="w-4 h-4" /> Listo
                                                            </button>
                                                        )}
                                                        {order.status === 'ready' && (
                                                            <span className="flex-1 py-2.5 px-3 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5">
                                                                <CheckCircle className="w-4 h-4" />
                                                                {order.delivery_type === 'takeaway' ? 'Listo para retirar' : 'Esperando Cadete'}
                                                            </span>
                                                        )}
                                                    </>
                                                }
                                                onClick={() => handleOpenDetail(order)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {modalDetail && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-forge border-t sm:border border-clay/20 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
                        <div className="p-5 sm:p-6 border-b border-clay/10 flex items-center justify-between bg-clay/5 shrink-0">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-warm-white">Detalle del Pedido #{selectedOrder.id}</h2>
                                <p className="text-xs text-warm-white/50">{new Date(selectedOrder.created_at).toLocaleString('es-AR')}</p>
                            </div>
                            <button onClick={() => setModalDetail(false)} className="text-warm-white/40 hover:text-warm-white p-2 rounded-xl bg-clay/10">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-black/20 p-4 rounded-2xl border border-clay/10">
                                <div>
                                    <p className="text-xs font-semibold text-warm-white/50 uppercase mb-1">Cliente / Comprador</p>
                                    {selectedOrder.user ? (
                                        <div className="flex items-center gap-2">
                                            <span className="p-1 bg-ember/10 text-ember rounded-lg">
                                                <User className="w-4 h-4" />
                                            </span>
                                            <p className="font-medium text-warm-white">{selectedOrder.user.name}</p>
                                        </div>
                                    ) : selectedOrder.guest_name ? (
                                        <p className="font-medium text-warm-white">{selectedOrder.guest_name} <span className="text-warm-white/50">({selectedOrder.guest_phone})</span></p>
                                    ) : (
                                        <span className="text-warm-white/50">Sin datos</span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-warm-white/50 uppercase mb-1">Repartidor</p>
                                    <p className="font-medium text-warm-white flex items-center gap-1.5 mt-1">
                                        <User className="w-4 h-4 text-warm-white/50" /> {selectedOrder.delivery?.name || 'Sin asignar'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-warm-white/50 uppercase">Tipo Entrega</p>
                                    <p className="font-medium text-warm-white capitalize mt-1">{selectedOrder.delivery_type}</p>
                                </div>
                                {selectedOrder.delivery_type !== 'takeaway' && (
                                    <div>
                                        <p className="text-xs font-semibold text-warm-white/50 uppercase">Dirección</p>
                                        <p className="font-medium text-warm-white flex items-center gap-1.5 mt-1">
                                            <MapPin className="w-4 h-4 text-warm-white/50" /> {selectedOrder.delivery_address || 'Retiro en Local'}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs font-semibold text-warm-white/50 uppercase">Pago</p>
                                    <p className="font-medium text-warm-white mt-1 capitalize">{selectedOrder.payment_method} ({selectedOrder.payment_status})</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-warm-white/50 uppercase">PIN de Validación</p>
                                    <p className="font-mono text-lg font-black text-warm-white/40 mt-1 tracking-widest">••••</p>
                                    <p className="text-[10px] text-warm-white/40 mt-1">Solicitá el PIN al cliente al momento de la entrega.</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-warm-white mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-gold" /> Ítems del Pedido
                                </h3>
                                <div className="border border-clay/10 rounded-2xl overflow-hidden overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-clay/5 text-xs font-semibold text-warm-white/50 uppercase border-b border-clay/10">
                                            <tr>
                                                <th className="py-3 px-4">Producto</th>
                                                <th className="py-3 px-4 text-center">Cant.</th>
                                                <th className="py-3 px-4 text-right">Precio Un.</th>
                                                <th className="py-3 px-4 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-clay/10">
                                            {selectedOrder.items?.map((item) => (
                                                <tr key={item.id} className="hover:bg-clay/5">
                                                    <td className="py-3 px-4 font-medium text-warm-white">
                                                        {item.product?.name || `Producto #${item.product_id}`}
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-warm-white/60">{item.quantity}</td>
                                                    <td className="py-3 px-4 text-right text-warm-white/60">{formatMoney(item.price)}</td>
                                                    <td className="py-3 px-4 text-right font-bold text-gold">
                                                        {formatMoney(item.price * item.quantity)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-clay/10">
                                <span className="font-bold text-warm-white/60">Total a Pagar:</span>
                                <span className="text-2xl font-black text-gold">{formatMoney(selectedOrder.total_price)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
