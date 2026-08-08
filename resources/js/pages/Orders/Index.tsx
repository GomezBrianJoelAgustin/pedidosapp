import { Link, useForm, router } from '@inertiajs/react';
import { 
    PlusCircle, Calendar, CreditCard, 
    Eye, Edit3, Trash2, X, MapPin, User, ShieldAlert, Package, ShoppingBag,
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
    user_id: number;
    delivery_id: number;
    status: string;
    delivery_type: string;
    delivery_address: string | null;
    payment_method: string;
    payment_status: string;
    payment_gateway_id: string | null;
    total_price: number;
    created_at: string;
    items?: OrderItem[];
    user?: UserRelation;
    delivery?: UserRelation;
}

interface PageProps {
    orders: { data: Order[] } | Order[];
}

export default function OrdersIndex({ orders }: PageProps) {
    const orderList = Array.isArray(orders) ? orders : orders?.data || [];

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

    const filteredOrders = useMemo(() => {
        const orderList = Array.isArray(orders) ? orders : orders?.data || [];

        return orderList.filter((order) => {
            const matchesStatus = statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();
            const term = searchTerm.toLowerCase().trim();
            const matchesSearch = 
                term === '' ||
                order.id.toString().includes(term) ||
                order.user?.name?.toLowerCase().includes(term) ||
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

        if (!selectedOrder) {
return;
}

        put(route('admin.orders.update', selectedOrder.id), {
            onSuccess: () => setModalEdit(false),
        });
    };

    const handleOpenDelete = (order: Order) => {
        setSelectedOrder(order);
        setModalDelete(true);
    };

    const handleDelete = () => {
        if (!selectedOrder) {
return;
}

        router.delete(route('admin.orders.destroy', selectedOrder.id), {
            onSuccess: () => setModalDelete(false),
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-800 dark:text-white p-4 sm:p-6 font-sans transition-colors duration-200">
            <div className="max-w-7xl mx-auto space-y-6">
                
                <FlashAlert />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 dark:bg-white/[0.03] p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-sm dark:shadow-none">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2 sm:gap-3">
                            <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500 dark:text-amber-400" /> Gestión de Órdenes
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Control rápido de transacciones, estados y envíos</p>
                    </div>

                    <Link
                        href={route('admin.pos')}
                        className="px-5 sm:px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white dark:text-black font-bold rounded-2xl shadow-lg shadow-amber-500/25 dark:shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 hover:shadow-amber-500/40 w-full sm:w-auto"
                    >
                        <PlusCircle className="w-5 h-5" /> Nueva Venta
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/60 dark:bg-white/[0.02] p-4 rounded-3xl border border-slate-200/80 dark:border-white/10 backdrop-blur-md">
                    <div className="md:col-span-2 relative flex items-center">
                        <Search className="w-5 h-5 absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por ID (#123), cliente, dirección..."
                            className="w-full pl-11 pr-10 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-amber-500 focus:ring-amber-500/30 transition-all shadow-sm"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')} 
                                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="relative flex items-center">
                        <Filter className="w-4 h-4 absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-8 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm text-slate-800 dark:text-white focus:border-amber-500 focus:ring-amber-500/30 transition-all shadow-sm font-medium"
                        >
                            <option value="all" className="dark:bg-[#0f0f11]">Todos los Estados</option>
                            <option value="pending" className="dark:bg-[#0f0f11]">Pendiente</option>
                            <option value="processing" className="dark:bg-[#0f0f11]">En Proceso</option>
                            <option value="completed" className="dark:bg-[#0f0f11]">Completado</option>
                            <option value="cancelled" className="dark:bg-[#0f0f11]">Cancelado</option>
                        </select>
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl p-10 sm:p-16 text-center text-slate-400 dark:text-slate-500 space-y-2">
                        <p className="font-semibold text-lg">No se encontraron órdenes</p>
                        <p className="text-xs">Intenta ajustar la búsqueda o los filtros aplicados.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {filteredOrders.map((order) => (
                            <div 
                                key={order.id} 
                                className="bg-white dark:bg-white/[0.03] hover:dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-none transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between group"
                            >
                                <div>
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4 mb-4">
                                        <div>
                                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Orden</span>
                                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">#{order.id}</h3>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total</span>
                                            <span className="text-lg font-black text-amber-600 dark:text-amber-400">{formatMoney(order.total_price)}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                                            order.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' :
                                            order.status === 'pending' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' : 
                                            'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                                        }`}>
                                            {order.status}
                                        </span>

                                        <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 flex items-center gap-1">
                                            <CreditCard className="w-3.5 h-3.5" />
                                            {order.payment_method} ({order.payment_status})
                                        </span>
                                    </div>

                                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2 mb-6">
                                        <p className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                            {new Date(order.created_at).toLocaleString('es-AR')}
                                        </p>
                                        <p className="flex items-center gap-2 truncate">
                                            <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                            {order.delivery_address || 'Retiro en Local'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 dark:border-white/10">
                                    <button
                                        onClick={() => handleOpenShow(order)}
                                        className="py-2.5 px-2 sm:px-3 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white border border-blue-200 dark:border-blue-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all active:scale-95"
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
                                        className="py-2.5 px-2 sm:px-3 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-200 dark:border-rose-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all active:scale-95"
                                    >
                                        <Trash2 className="w-4 h-4" /> <span className="hidden xs:inline">Borrar</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {modalShow && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white dark:bg-[#0f0f11] border-t sm:border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
                        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02] shrink-0">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Detalle de la Órden #{selectedOrder.id}</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(selectedOrder.created_at).toLocaleString('es-AR')}</p>
                            </div>
                            <button onClick={() => setModalShow(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-xl bg-slate-100 dark:bg-white/5">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200/60 dark:border-white/10">
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Cliente</p>
                                    <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-1">
                                        <User className="w-4 h-4 text-slate-400 dark:text-slate-500" /> {selectedOrder.user?.name || `ID: ${selectedOrder.user_id}`}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Repartidor</p>
                                    <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-1">
                                        <User className="w-4 h-4 text-slate-400 dark:text-slate-500" /> {selectedOrder.delivery?.name || `ID: ${selectedOrder.delivery_id}`}
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
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Ítems del Pedido
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
                                                    <td className="py-3 px-4 text-right font-bold text-amber-600 dark:text-amber-400">
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
                                <span className="text-2xl font-black text-slate-900 dark:text-amber-400">{formatMoney(selectedOrder.total_price)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {modalEdit && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white dark:bg-[#0f0f11] border-t sm:border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md overflow-hidden max-h-[92vh] flex flex-col">
                        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between shrink-0">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Editar Órden #{selectedOrder.id}</h2>
                            <button onClick={() => setModalEdit(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-xl bg-slate-100 dark:bg-white/5">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Estado del Pedido</label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="w-full rounded-2xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-sm focus:border-amber-500 focus:ring-amber-500/30"
                                >
                                    <option value="pending" className="dark:bg-[#0f0f11]">Pendiente</option>
                                    <option value="processing" className="dark:bg-[#0f0f11]">En Proceso</option>
                                    <option value="completed" className="dark:bg-[#0f0f11]">Completado</option>
                                    <option value="cancelled" className="dark:bg-[#0f0f11]">Cancelado</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Estado del Pago</label>
                                <select
                                    value={data.payment_status}
                                    onChange={(e) => setData('payment_status', e.target.value)}
                                    className="w-full rounded-2xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-sm focus:border-amber-500 focus:ring-amber-500/30"
                                >
                                    <option value="pending" className="dark:bg-[#0f0f11]">Pendiente</option>
                                    <option value="paid" className="dark:bg-[#0f0f11]">Pagado</option>
                                    <option value="failed" className="dark:bg-[#0f0f11]">Fallido</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tipo de Entrega</label>
                                <select
                                    value={data.delivery_type}
                                    onChange={(e) => setData('delivery_type', e.target.value)}
                                    className="w-full rounded-2xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-sm focus:border-amber-500 focus:ring-amber-500/30"
                                >
                                    <option value="takeaway" className="dark:bg-[#0f0f11]">Retiro en Local</option>
                                    <option value="delivery" className="dark:bg-[#0f0f11]">Envío a Domicilio</option>
                                </select>
                            </div>

                            {data.delivery_type === 'delivery' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Dirección de Entrega</label>
                                    <input
                                        type="text"
                                        value={data.delivery_address}
                                        onChange={(e) => setData('delivery_address', e.target.value)}
                                        className="w-full rounded-2xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-sm focus:border-amber-500 focus:ring-amber-500/30"
                                        placeholder="Calle 123..."
                                    />
                                </div>
                            )}

                            <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalEdit(false)}
                                    className="px-4 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-white dark:text-black rounded-xl shadow-lg shadow-amber-500/25 dark:shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modalDelete && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white dark:bg-[#0f0f11] border-t sm:border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm p-6 space-y-4">
                        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                            <ShieldAlert className="w-7 h-7" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">¿Eliminar Órden?</h3>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            ¿Estás seguro de eliminar la órden <strong className="text-slate-800 dark:text-slate-200">#{selectedOrder.id}</strong>? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setModalDelete(false)}
                                className="px-4 py-2.5 sm:py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2.5 sm:py-2 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-600/25 dark:shadow-rose-600/20 transition-all active:scale-95"
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