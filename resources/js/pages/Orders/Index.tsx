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
    }, [orderList, searchTerm, statusFilter]);


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
        <div className="min-h-screen bg-[#09090b] text-white p-6 font-sans transition-colors duration-200">
            <div className="max-w-7xl mx-auto space-y-6">
                
                <FlashAlert />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.03] p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                            <ShoppingBag className="w-8 h-8 text-amber-400" /> Gestión de Órdenes
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">Control rápido de transacciones, estados y envíos</p>
                    </div>

                    <Link
                        href={route('admin.pos')}
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95 hover:shadow-amber-500/30"
                    >
                        <PlusCircle className="w-5 h-5" /> Nueva Venta
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/[0.02] p-4 rounded-3xl border border-white/10 backdrop-blur-md">
                    <div className="md:col-span-2 relative flex items-center">
                        <Search className="w-5 h-5 absolute left-4 text-slate-500 pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por ID (#123), cliente, dirección..."
                            className="w-full pl-11 pr-10 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:ring-amber-500/30 transition-all"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')} 
                                className="absolute right-3 p-1 text-slate-500 hover:text-white rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="relative flex items-center">
                        <Filter className="w-4 h-4 absolute left-4 text-slate-500 pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:border-amber-500 focus:ring-amber-500/30 transition-all font-medium"
                        >
                            <option value="all" className="bg-[#0f0f11]">Todos los Estados</option>
                            <option value="pending" className="bg-[#0f0f11]">Pendiente</option>
                            <option value="processing" className="bg-[#0f0f11]">En Proceso</option>
                            <option value="completed" className="bg-[#0f0f11]">Completado</option>
                            <option value="cancelled" className="bg-[#0f0f11]">Cancelado</option>
                        </select>
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-16 text-center text-slate-500 space-y-2">
                        <p className="font-semibold text-lg">No se encontraron órdenes</p>
                        <p className="text-xs">Intenta ajustar la búsqueda o los filtros aplicados.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredOrders.map((order) => (
                            <div 
                                key={order.id} 
                                className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 rounded-3xl p-6 transition-all hover:-translate-y-1 flex flex-col justify-between group"
                            >
                                <div>
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                                        <div>
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Orden</span>
                                            <h3 className="text-xl font-extrabold text-white">#{order.id}</h3>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total</span>
                                            <span className="text-lg font-black text-amber-400">{formatMoney(order.total_price)}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                                            order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                            order.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                        }`}>
                                            {order.status}
                                        </span>

                                        <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                                            <CreditCard className="w-3.5 h-3.5" />
                                            {order.payment_method} ({order.payment_status})
                                        </span>
                                    </div>

                                    <div className="text-xs text-slate-400 space-y-2 mb-6">
                                        <p className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-slate-500" />
                                            {new Date(order.created_at).toLocaleString('es-AR')}
                                        </p>
                                        <p className="flex items-center gap-2 truncate">
                                            <MapPin className="w-4 h-4 text-slate-500" />
                                            {order.delivery_address || 'Retiro en Local'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10">
                                    <button
                                        onClick={() => handleOpenShow(order)}
                                        className="py-2.5 px-3 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                    >
                                        <Eye className="w-4 h-4" /> Detalle
                                    </button>

                                    <button
                                        onClick={() => handleOpenEdit(order)}
                                        className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                    >
                                        <Edit3 className="w-4 h-4" /> Editar
                                    </button>

                                    <button
                                        onClick={() => handleOpenDelete(order)}
                                        className="py-2.5 px-3 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                    >
                                        <Trash2 className="w-4 h-4" /> Borrar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {modalShow && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#0f0f11] border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                            <div>
                                <h2 className="text-xl font-bold text-white">Detalle de la Órden #{selectedOrder.id}</h2>
                                <p className="text-xs text-slate-500">{new Date(selectedOrder.created_at).toLocaleString('es-AR')}</p>
                            </div>
                            <button onClick={() => setModalShow(false)} className="text-slate-400 hover:text-white p-2 rounded-xl bg-white/5">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4 text-sm bg-white/5 p-4 rounded-2xl border border-white/10">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Cliente</p>
                                    <p className="font-medium text-slate-200 flex items-center gap-1.5 mt-1">
                                        <User className="w-4 h-4 text-slate-500" /> {selectedOrder.user?.name || `ID: ${selectedOrder.user_id}`}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Repartidor</p>
                                    <p className="font-medium text-slate-200 flex items-center gap-1.5 mt-1">
                                        <User className="w-4 h-4 text-slate-500" /> {selectedOrder.delivery?.name || `ID: ${selectedOrder.delivery_id}`}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Tipo Entrega</p>
                                    <p className="font-medium text-slate-200 capitalize mt-1">{selectedOrder.delivery_type}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Dirección</p>
                                    <p className="font-medium text-slate-200 flex items-center gap-1.5 mt-1">
                                        <MapPin className="w-4 h-4 text-slate-500" /> {selectedOrder.delivery_address || 'Retiro en Local'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-amber-400" /> Ítems del Pedido
                                </h3>
                                <div className="border border-white/10 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-white/5 text-xs font-semibold text-slate-400 uppercase border-b border-white/10">
                                            <tr>
                                                <th className="py-3 px-4">Producto</th>
                                                <th className="py-3 px-4 text-center">Cant.</th>
                                                <th className="py-3 px-4 text-right">Precio Un.</th>
                                                <th className="py-3 px-4 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            {selectedOrder.items?.map((item) => (
                                                <tr key={item.id} className="hover:bg-white/5">
                                                    <td className="py-3 px-4 font-medium text-slate-200">
                                                        {item.product?.name || `Producto #${item.product_id}`}
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-slate-400">{item.quantity}</td>
                                                    <td className="py-3 px-4 text-right text-slate-400">{formatMoney(item.price)}</td>
                                                    <td className="py-3 px-4 text-right font-bold text-amber-400">
                                                        {formatMoney(item.price * item.quantity)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-white/10">
                                <span className="font-bold text-slate-400">Total a Pagar:</span>
                                <span className="text-2xl font-black text-amber-400">{formatMoney(selectedOrder.total_price)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {modalEdit && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#0f0f11] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white">Editar Órden #{selectedOrder.id}</h2>
                            <button onClick={() => setModalEdit(false)} className="text-slate-400 hover:text-white p-2 rounded-xl bg-white/5">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Estado del Pedido</label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="w-full rounded-2xl bg-white/5 border-white/10 text-white text-sm focus:border-amber-500 focus:ring-amber-500/30"
                                >
                                    <option value="pending" className="bg-[#0f0f11]">Pendiente</option>
                                    <option value="processing" className="bg-[#0f0f11]">En Proceso</option>
                                    <option value="completed" className="bg-[#0f0f11]">Completado</option>
                                    <option value="cancelled" className="bg-[#0f0f11]">Cancelado</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Estado del Pago</label>
                                <select
                                    value={data.payment_status}
                                    onChange={(e) => setData('payment_status', e.target.value)}
                                    className="w-full rounded-2xl bg-white/5 border-white/10 text-white text-sm focus:border-amber-500 focus:ring-amber-500/30"
                                >
                                    <option value="pending" className="bg-[#0f0f11]">Pendiente</option>
                                    <option value="paid" className="bg-[#0f0f11]">Pagado</option>
                                    <option value="failed" className="bg-[#0f0f11]">Fallido</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo de Entrega</label>
                                <select
                                    value={data.delivery_type}
                                    onChange={(e) => setData('delivery_type', e.target.value)}
                                    className="w-full rounded-2xl bg-white/5 border-white/10 text-white text-sm focus:border-amber-500 focus:ring-amber-500/30"
                                >
                                    <option value="takeaway" className="bg-[#0f0f11]">Retiro en Local</option>
                                    <option value="delivery" className="bg-[#0f0f11]">Envío a Domicilio</option>
                                </select>
                            </div>

                            {data.delivery_type === 'delivery' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Dirección de Entrega</label>
                                    <input
                                        type="text"
                                        value={data.delivery_address}
                                        onChange={(e) => setData('delivery_address', e.target.value)}
                                        className="w-full rounded-2xl bg-white/5 border-white/10 text-white text-sm focus:border-amber-500 focus:ring-amber-500/30"
                                        placeholder="Calle 123..."
                                    />
                                </div>
                            )}

                            <div className="pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalEdit(false)}
                                    className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:bg-white/5 rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-black rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modalDelete && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#0f0f11] border border-white/10 rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                        <div className="flex items-center gap-3 text-rose-400">
                            <ShieldAlert className="w-7 h-7" />
                            <h3 className="text-lg font-bold text-white">¿Eliminar Órden?</h3>
                        </div>
                        <p className="text-sm text-slate-400">
                            ¿Estás seguro de eliminar la órden <strong className="text-slate-200">#{selectedOrder.id}</strong>? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setModalDelete(false)}
                                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-white/5 rounded-xl"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-600/20 transition-all active:scale-95"
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