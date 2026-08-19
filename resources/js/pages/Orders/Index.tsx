import { Link, useForm, router } from '@inertiajs/react';
import { 
    PlusCircle, Calendar, CreditCard, 
    Eye, Edit3, Trash2, X, MapPin, User, UserCheck, ShieldAlert, Package, ShoppingBag,
    Search, Filter 
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
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

interface Order {
    id: number;
    user_id?: number | null;
    delivery_id: number;
    status: string;
    delivery_type: string;
    delivery_address: string | null;
    payment_method: string;
    payment_status: string;
    payment_gateway_id: string | null;
    total_price: number;
    guest_name?: string | null;
    guest_phone?: string | null;
    guest_email?: string | null;
    created_at: string;
    items?: OrderItem[];
    user?: UserRelation | null;
    delivery?: UserRelation | null;
}

interface PageProps {
    orders: { data: Order[]; current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null; path: string } | Order[];
}

export default function OrdersIndex({ orders }: PageProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [modalShow, setModalShow] = useState(false);
    const [modalEdit, setModalEdit] = useState(false);
    const [modalDelete, setModalDelete] = useState(false);

    const { data, setData, put, processing } = useForm({
        status: '',
        payment_status: '',
        delivery_type: '',
        delivery_address: '',
    });

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
    };

    // Función inteligente para renderizar el cliente según su tipo
    const renderCustomerInfo = (order: Order) => {
        if (order.user) {
            return (
                <div className="flex items-center gap-2">
                    <span className="p-1 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                        <UserCheck className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{order.user.name}</p>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-amber-500">Cliente Registrado</span>
                    </div>
                </div>
            );
        }

        if (order.guest_name) {
            return (
                <div className="flex items-center gap-2">
                    <span className="p-1 bg-purple-500/10 text-purple-400 rounded-lg shrink-0">
                        <User className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{order.guest_name}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                            <span>Invitado</span>
                            {order.guest_phone && <span>• {order.guest_phone}</span>}
                        </div>
                    </div>
                </div>
            );
        }

        return <span className="text-muted-foreground">Sin datos de cliente</span>;
    };

    const filteredOrders = useMemo(() => {
        const orderList = Array.isArray(orders) ? orders : orders?.data || [];

        return orderList.filter((order) => {
            const matchesStatus = statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();
            const term = searchTerm.toLowerCase().trim();
            const matchesSearch = 
                term === '' ||
                order.id.toString().includes(term) ||
                order.user?.name?.toLowerCase().includes(term) ||
                order.guest_name?.toLowerCase().includes(term) ||
                order.guest_phone?.toLowerCase().includes(term) ||
                order.delivery_address?.toLowerCase().includes(term) ||
                order.payment_method?.toLowerCase().includes(term);

            return matchesStatus && matchesSearch;
        });
    }, [orders, searchTerm, statusFilter]);

    const handleOpenShow = (order: Order) => {
        setSelectedOrder(order);
        setModalShow(true);
    };

    const handleOpenEdit = (order: Order) => {
        setSelectedOrder(order);
        setData({
            status: order.status,
            payment_status: order.payment_status,
            delivery_type: order.delivery_type,
            delivery_address: order.delivery_address || '',
        });
        setModalEdit(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder) return;

        put(route('admin.orders.update', selectedOrder.id), {
            onSuccess: () => setModalEdit(false),
        });
    };

    const handleOpenDelete = (order: Order) => {
        setSelectedOrder(order);
        setModalDelete(true);
    };

    const handleDelete = () => {
        if (!selectedOrder) return;

        router.delete(route('admin.orders.destroy', selectedOrder.id), {
            onSuccess: () => setModalDelete(false),
        });
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 font-sans transition-colors duration-200">
            <div className="max-w-7xl mx-auto space-y-6">
                
                <FlashAlert />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-5 sm:p-6 rounded-3xl backdrop-blur-xl shadow-sm dark:shadow-none">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2 sm:gap-3">
                            <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8 text-primary dark:text-primary" /> Gestión de Órdenes
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">Control rápido de transacciones, estados y envíos</p>
                    </div>

                    <Link
                        href={route('admin.pos')}
                        className="px-5 sm:px-6 py-3 bg-gradient-to-r from-primary to-[#c56a28] hover:from-[#d46d2e] hover:to-[#b35d20] text-white dark:text-black font-bold rounded-2xl shadow-lg shadow-primary/25 dark:shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 hover:shadow-primary/40 w-full sm:w-auto"
                    >
                        <PlusCircle className="w-5 h-5" /> Nueva Venta
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card border border-border p-4 rounded-3xl backdrop-blur-md">
                    <div className="md:col-span-2 relative flex items-center">
                        <Search className="w-5 h-5 absolute left-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por ID (#123), cliente, invitado, dirección..."
                            className="w-full pl-11 pr-10 py-3 bg-background border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/30 transition-all shadow-sm"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')} 
                                className="absolute right-3 p-1 text-muted-foreground hover:text-foreground rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="relative flex items-center">
                        <Filter className="w-4 h-4 absolute left-4 text-muted-foreground pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-8 py-3 bg-background border border-border rounded-2xl text-sm text-foreground focus:border-primary focus:ring-primary/30 transition-all shadow-sm font-medium"
                        >
                            <option value="all" className="dark:bg-[#0f0f11]">Todos los Estados</option>
                            <option value="pending" className="dark:bg-[#0f0f11]">Pendiente</option>
                            <option value="preparing" className="dark:bg-[#0f0f11]">En Preparación</option>
                            <option value="ready" className="dark:bg-[#0f0f11]">Listo</option>
                            <option value="delivered" className="dark:bg-[#0f0f11]">Entregado</option>
                        </select>
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="bg-card border border-border rounded-3xl p-10 sm:p-16 text-center text-muted-foreground space-y-2">
                        <p className="font-semibold text-lg">No se encontraron órdenes</p>
                        <p className="text-xs">Intenta ajustar la búsqueda o los filtros aplicados.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {filteredOrders.map((order) => (
                            <div 
                                key={order.id} 
                                className="bg-card border border-border hover:border-white/10 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-none transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between group"
                            >
                                <div>
                                    <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                                        <div>
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Orden</span>
                                            <h3 className="text-xl font-extrabold text-foreground">#{order.id}</h3>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Total</span>
                                            <span className="text-lg font-black text-primary">{formatMoney(order.total_price)}</span>
                                        </div>
                                    </div>

                                    {/* Mostrar cliente en tarjeta */}
                                    <div className="mb-4 bg-background border border-border p-3 rounded-2xl">
                                        {renderCustomerInfo(order)}
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                                            order.status === 'ready' || order.status === 'delivered' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' :
                                            order.status === 'preparing' ? 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20' :
                                            order.status === 'pending' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' : 
                                            'bg-[#e63946]/10 text-[#e63946] border-[#e63946]/20'
                                        }`}>
                                            {order.status}
                                        </span>

                                        <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20 flex items-center gap-1">
                                            <CreditCard className="w-3.5 h-3.5" />
                                            {order.payment_method} ({order.payment_status})
                                        </span>
                                    </div>

                                    <div className="text-xs text-muted-foreground space-y-2 mb-6">
                                        <p className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            {new Date(order.created_at).toLocaleString('es-AR')}
                                        </p>
                                        <p className="flex items-center gap-2 truncate">
                                            <MapPin className="w-4 h-4 text-muted-foreground" />
                                            {order.delivery_address || 'Retiro en Local'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
                                    <button
                                        onClick={() => handleOpenShow(order)}
                                        className="py-2.5 px-2 sm:px-3 bg-[#d4af37]/10 text-[#d4af37] dark:text-[#d4af37] hover:bg-[#d4af37] hover:text-white border-[#d4af37]/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all active:scale-95"
                                    >
                                        <Eye className="w-4 h-4" /> <span className="hidden xs:inline">Detalle</span>
                                    </button>

                                    <button
                                        onClick={() => handleOpenEdit(order)}
                                        className="py-2.5 px-2 sm:px-3 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-white dark:hover:text-black border border-amber-200 dark:border-amber-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all active:scale-95"
                                    >
                                        <Edit3 className="w-4 h-4" /> <span className="hidden xs:inline">Editar</span>
                                    </button>

                                    <button
                                        onClick={() => handleOpenDelete(order)}
                                        className="py-2.5 px-2 sm:px-3 bg-[#e63946]/10 text-[#e63946] dark:text-[#e63946] hover:bg-[#e63946] hover:text-white border-[#e63946]/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all active:scale-95"
                                    >
                                        <Trash2 className="w-4 h-4" /> <span className="hidden xs:inline">Borrar</span>
                                    </button>
                                </div>
                            </div>
                        ))}
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

            {/* Modal de Detalle */}
            {modalShow && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
                        <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between bg-background/50 dark:bg-white/[0.02] shrink-0">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-foreground">Detalle de la Órden #{selectedOrder.id}</h2>
                                <p className="text-xs text-muted-foreground">{new Date(selectedOrder.created_at).toLocaleString('es-AR')}</p>
                            </div>
                            <button onClick={() => setModalShow(false)} className="text-muted-foreground hover:text-foreground p-2 rounded-xl bg-white/5">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 text-sm bg-background border border-border p-4 rounded-2xl">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Cliente / Comprador</p>
                                    {renderCustomerInfo(selectedOrder)}
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
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Dirección</p>
                                    <p className="font-medium text-foreground flex items-center gap-1.5 mt-1">
                                        <MapPin className="w-4 h-4 text-muted-foreground" /> {selectedOrder.delivery_address || 'Retiro en Local'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Ítems del Pedido
                                </h3>
                                <div className="border border-border rounded-2xl overflow-hidden overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-background text-xs font-semibold text-muted-foreground uppercase border-b border-border">
                                            <tr>
                                                <th className="py-3 px-4">Producto</th>
                                                <th className="py-3 px-4 text-center">Cant.</th>
                                                <th className="py-3 px-4 text-right">Precio Un.</th>
                                                <th className="py-3 px-4 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {selectedOrder.items?.map((item) => (
                                                <tr key={item.id} className="hover:bg-white/5">
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
                                    <span className="text-2xl font-black text-foreground">{formatMoney(selectedOrder.total_price)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Edición */}
            {modalEdit && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md overflow-hidden max-h-[92vh] flex flex-col">
                        <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between shrink-0">
                            <h2 className="text-lg font-bold text-foreground">Editar Órden #{selectedOrder.id}</h2>
                            <button onClick={() => setModalEdit(false)} className="text-muted-foreground hover:text-foreground p-2 rounded-xl bg-white/5">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Estado del Pedido</label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="w-full rounded-2xl bg-background border border-border text-foreground text-sm focus:border-primary focus:ring-primary/30"
                                >
                                    <option value="pending" className="dark:bg-[#0f0f11]">Pendiente</option>
                                    <option value="preparing" className="dark:bg-[#0f0f11]">En Preparación</option>
                                    <option value="ready" className="dark:bg-[#0f0f11]">Listo</option>
                                    <option value="delivered" className="dark:bg-[#0f0f11]">Entregado</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Estado del Pago</label>
                                <select
                                    value={data.payment_status}
                                    onChange={(e) => setData('payment_status', e.target.value)}
                                    className="w-full rounded-2xl bg-background border border-border text-foreground text-sm focus:border-primary focus:ring-primary/30"
                                >
                                    <option value="pending" className="dark:bg-[#0f0f11]">Pendiente</option>
                                    <option value="paid" className="dark:bg-[#0f0f11]">Pagado</option>
                                    <option value="failed" className="dark:bg-[#0f0f11]">Fallido</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Tipo de Entrega</label>
                                <select
                                    value={data.delivery_type}
                                    onChange={(e) => setData('delivery_type', e.target.value)}
                                    className="w-full rounded-2xl bg-background border border-border text-foreground text-sm focus:border-primary focus:ring-primary/30"
                                >
                                    <option value="takeaway" className="dark:bg-[#0f0f11]">Retiro en Local</option>
                                    <option value="delivery" className="dark:bg-[#0f0f11]">Envío a Domicilio</option>
                                </select>
                            </div>

                            {data.delivery_type === 'delivery' && (
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Dirección de Entrega</label>
                                    <input
                                        type="text"
                                        value={data.delivery_address}
                                        onChange={(e) => setData('delivery_address', e.target.value)}
                                    className="w-full rounded-2xl bg-background border border-border text-foreground text-sm focus:border-primary focus:ring-primary/30"
                                        placeholder="Calle 123..."
                                    />
                                </div>
                            )}

                            <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalEdit(false)}
                                    className="px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-white/5 rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2.5 text-sm font-bold bg-primary hover:bg-[#d46d2e] text-white dark:text-black rounded-xl shadow-lg shadow-primary/25 dark:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Eliminación */}
            {modalDelete && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm p-6 space-y-4">
                        <div className="flex items-center gap-3 text-[#e63946]">
                            <ShieldAlert className="w-7 h-7" />
                            <h3 className="text-lg font-bold text-foreground">¿Eliminar Órden?</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            ¿Estás seguro de eliminar la órden <strong className="text-foreground">#{selectedOrder.id}</strong>? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setModalDelete(false)}
                                className="px-4 py-2.5 sm:py-2 text-sm font-semibold text-muted-foreground hover:bg-white/5 rounded-xl"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2.5 sm:py-2 text-sm font-bold bg-[#e63946] hover:bg-[#d32f3f] text-white rounded-xl shadow-lg shadow-[#e63946]/25 dark:shadow-[#e63946]/20 transition-all active:scale-95"
                            >
                                Sí, Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}