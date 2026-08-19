import { useState, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';
import {
    Wallet, UserCheck, Clock, Package, MapPin, CreditCard,
    Eye, CheckCircle, CheckCircle2, X, XCircle, Search, DollarSign, Truck, ChevronRight, Bell, Lock, Filter
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

interface PaginatedOrders {
    data: Order[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    path: string;
}

interface Category {
    id: number;
    name: string;
    active: boolean;
}

interface Product2 {
    id: number;
    name: string;
    price: number;
    image?: string | null;
    active: boolean;
    category_id: number;
    category?: Category;
}

interface PageProps {
    awaitingApproval: PaginatedOrders | Order[];
    pendingAssignment: PaginatedOrders | Order[];
    pendingCashPayment: PaginatedOrders | Order[];
    recentOrders: Order[];
    rejectedOrders: PaginatedOrders | Order[];
    deliveryUsers: DeliveryUser[];
    categories: Category[];
    products: Product2[];
}

type TabKey = 'all' | 'awaiting_approval' | 'approved' | 'rejected' | 'preparing' | 'ready' | 'delivered' | 'out_for_delivery' | 'at_location';
type PaymentFilterKey = 'all' | 'cash_pending' | 'pay_later' | 'paid';

const STATUS_TABS: { key: TabKey; label: string; icon: typeof Clock }[] = [
    { key: 'all', label: 'Todos', icon: Clock },
    { key: 'awaiting_approval', label: 'Pendiente de aprobación', icon: Clock },
    { key: 'approved', label: 'Aprobado', icon: CheckCircle },
    { key: 'preparing', label: 'En preparación', icon: Package },
    { key: 'ready', label: 'Listo para retirar', icon: CheckCircle },
    { key: 'out_for_delivery', label: 'Enviando al cadete', icon: Truck },
    { key: 'delivered', label: 'Entregado', icon: CheckCircle },
];

const PAYMENT_TABS: { key: PaymentFilterKey; label: string; icon: typeof DollarSign }[] = [
    { key: 'all', label: 'Todos', icon: DollarSign },
    { key: 'cash_pending', label: 'Efectivo pendiente', icon: DollarSign },
    { key: 'pay_later', label: 'Paga después', icon: CreditCard },
    { key: 'paid', label: 'Paga ahora', icon: CreditCard },
];

type OrderWithSection = Order & { _section: string };

export default function CashierIndex({ awaitingApproval, pendingAssignment, pendingCashPayment, recentOrders, rejectedOrders, deliveryUsers, categories, products }: PageProps) {
    const [statusFilter, setStatusFilter] = useState<TabKey>('all');
    const [paymentFilter, setPaymentFilter] = useState<PaymentFilterKey>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [modalDetail, setModalDetail] = useState(false);
    const [modalAssign, setModalAssign] = useState(false);
    const [modalCash, setModalCash] = useState(false);
    const [modalReject, setModalReject] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [toast, setToast] = useState<string | null>(null);
    const [productSearch, setProductSearch] = useState('');
    const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase());
            const matchesCategory = productCategoryFilter === 'all' || String(product.category_id) === productCategoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [products, productSearch, productCategoryFilter]);

    const { refresh } = usePolling({
        interval: 5000,
        enabled: true,
        onNewOrder: () => {
            setToast('¡Nuevo pedido pendiente de aprobación!');
            setTimeout(() => setToast(null), 4000);
        },
    });

    const { data: assignData, setData: setAssignData, post: postAssign, processing: assignProcessing, reset: resetAssign } = useForm({
        delivery_id: '',
    });

    const { data: cashData, setData: setCashData, post: postCash, processing: cashProcessing, reset: resetCash } = useForm({
        payment_status: 'paid',
    });

    const renderPagination = (paginated: any) => {
        if (!paginated || typeof paginated !== 'object' || !paginated.last_page || paginated.last_page <= 1) return null;

        return (
            <div className="flex items-center justify-between pt-2">
                <button
                    disabled={paginated.current_page === 1}
                    onClick={() => window.location.href = `${paginated.path}?page=${paginated.current_page - 1}`}
                    className="px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Anterior
                </button>
                <span className="text-xs text-muted-foreground">
                    Página {paginated.current_page} de {paginated.last_page}
                </span>
                <button
                    disabled={paginated.current_page === paginated.last_page}
                    onClick={() => window.location.href = `${paginated.path}?page=${paginated.current_page + 1}`}
                    className="px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Siguiente
                </button>
            </div>
        );
    };

    const handleApprove = (order: Order) => {
        router.post(route('cashier.orders.approve', order.id), {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setSelectedOrder(null);
            },
        });
    };

    const handleReject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder) return;

        router.post(route('cashier.orders.reject', selectedOrder.id), {
            rejection_reason: rejectReason,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setModalReject(false);
                setRejectReason('');
                setSelectedOrder(null);
            },
        });
    };

    const getStatusBadgeLabel = (order: Order) => {
        if (order.status === 'ready') {
            return order.delivery_type === 'takeaway' ? 'Listo para retirar' : 'Esperando Cadete';
        }
        return statusBadge[order.status]?.label || order.status;
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
    };

    const getPaymentBadge = (paymentMethod: string, paymentStatus: string) => {
        const isRejected = paymentStatus === 'failed' || paymentStatus === 'rejected';

        if (paymentMethod !== 'effective') {
            return (
                <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    {paymentStatus === 'paid' ? 'Pagado' : isRejected ? 'Rechazado' : 'Pendiente'}
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

        if (isRejected) {
            return (
                <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#e63946]/10 text-[#e63946] border-[#e63946]/20 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    Pago Rechazado
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
            preserveScroll: true,
            preserveState: true,
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
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setModalCash(false);
                resetCash();
            },
        });
    };

    const [modalPin, setModalPin] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState<string | null>(null);
    const [modalPayment, setModalPayment] = useState(false);
    const [paymentForm, setPaymentForm] = useState({ payment_status: 'paid' });

    const handleOpenValidatePin = (order: Order) => {
        setSelectedOrder(order);
        setPinInput('');
        setPinError(null);
        setModalPin(true);
    };

    const handleValidatePin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder) return;

        router.post(route('cashier.orders.validate-pin', selectedOrder.id), {
            pin: pinInput,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setModalPin(false);
                setPinInput('');
                setPinError(null);
            },
            onError: (errors) => {
                setPinError(errors.pin || 'Error al validar el PIN.');
            },
        });
    };

    const handleOpenPayment = (order: Order) => {
        setSelectedOrder(order);
        setPaymentForm({ payment_status: order.payment_status === 'pending' ? 'pending_payment' : order.payment_status });
        setModalPayment(true);
    };

    const handleUpdatePayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder) return;

        router.post(route('cashier.orders.update-payment-status', selectedOrder.id), paymentForm, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setModalPayment(false);
            },
        });
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

    const isPendingAssignment = (order: Order) =>
        order.delivery_type === 'delivery' && !order.delivery_id && order.status === 'approved';

    const isPendingCash = (order: Order) =>
        order.payment_method === 'effective' && (order.payment_status === 'pending' || order.payment_status === 'pending_payment' || order.payment_status === 'pay_later');

    const normalize = (data: PaginatedOrders | Order[] | undefined): Order[] => {
        if (!data) return [];
        return Array.isArray(data) ? data : data.data;
    };

    const allOrders: OrderWithSection[] = useMemo(() => {
        const seen = new Set<number>();
        const result: OrderWithSection[] = [];

        const addSection = (orders: Order[], section: string) => {
            orders.forEach(order => {
                if (!seen.has(order.id)) {
                    seen.add(order.id);
                    result.push({ ...order, _section: section as OrderWithSection['_section'] });
                }
            });
        };

        addSection(normalize(awaitingApproval), 'awaitingApproval');
        addSection(normalize(pendingAssignment), 'pendingAssignment');
        addSection(normalize(pendingCashPayment), 'pendingCashPayment');
        addSection(recentOrders, 'recent');

        return result;
    }, [awaitingApproval, pendingAssignment, pendingCashPayment, recentOrders]);

    const filteredOrders = useMemo((): OrderWithSection[] => {
        const term = searchTerm.toLowerCase().trim();

        let list: OrderWithSection[] = allOrders;

        if (statusFilter !== 'all') {
            list = list.filter(order => order.status === statusFilter || order._section === statusFilter);
        }

        if (paymentFilter !== 'all') {
            if (paymentFilter === 'cash_pending') {
                list = list.filter(order => order.payment_method === 'effective' && order.payment_status === 'pending');
            } else if (paymentFilter === 'pay_later') {
                list = list.filter(order => order.payment_status === 'pending_payment' || order.payment_status === 'pay_later');
            } else if (paymentFilter === 'paid') {
                list = list.filter(order => order.payment_status === 'paid');
            }
        }

        if (term) {
            list = list.filter((order) => {
                const customerName = order.user?.name?.toLowerCase() || order.guest_name?.toLowerCase() || '';
                return (
                    order.id.toString().includes(term) ||
                    customerName.includes(term) ||
                    order.delivery_address?.toLowerCase().includes(term)
                );
            });
        }

        return list;
    }, [allOrders, statusFilter, paymentFilter, searchTerm]);

    const clearFilters = () => {
        setStatusFilter('all');
        setPaymentFilter('all');
        setSearchTerm('');
    };

    const hasActiveFilters = statusFilter !== 'all' || paymentFilter !== 'all' || searchTerm.trim().length > 0;
    const totalAvailable = allOrders.length;
    const showingCount = filteredOrders.length;

    const pendingAssignmentCount = allOrders.filter(isPendingAssignment).length;
    const pendingCashCount = allOrders.filter(isPendingCash).length;
    const awaitingApprovalCount = allOrders.filter(o => o._section === 'awaitingApproval').length;

    const OrderCard = ({ order }: { order: Order & { _section: string } }) => {
        const badge = statusBadge[order.status] || statusBadge['awaiting_approval'];
        const pendingAssignment = isPendingAssignment(order);
        const pendingCash = isPendingCash(order);
        const isRejected = order.status === 'rejected';

        return (
            <div
                className={`group rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-none transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between ${
                    isRejected
                        ? 'bg-[#e63946]/5 border border-[#e63946]/20 hover:border-[#e63946]/40'
                        : 'bg-card border border-border hover:border-border dark:hover:border-white/20'
                }`}
            >
                <div>
                    <div className={`flex items-center justify-between border-b pb-4 mb-4 ${isRejected ? 'border-border border-border' : 'border-border'}`}>
                        <div>
                            <span className={`text-xs font-semibold uppercase tracking-wider ${isRejected ? 'text-[#e63946]' : 'text-muted-foreground'}`}>
                                Pedido
                            </span>
                            <h3 className="text-xl font-extrabold text-foreground">#{order.id}</h3>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Total</span>
                            <span className={`text-lg font-black ${isRejected ? 'text-[#e63946]' : 'text-foreground'}`}>
                                {formatMoney(order.total_price)}
                            </span>
                        </div>
                    </div>

                    <div className={`mb-4 p-3 rounded-2xl border ${isRejected ? 'bg-card border-border' : 'bg-card border-border'}`}>
                        {order.user ? (
                            <div className="flex items-center gap-2">
                                <span className="p-1 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                                    <UserCheck className="w-4 h-4" />
                                </span>
                                <div className="min-w-0">
                                    <p className="font-medium text-foreground truncate">{order.user.name}</p>
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-amber-500">Cliente Registrado</span>
                                </div>
                            </div>
                        ) : order.guest_name ? (
                            <div className="flex items-center gap-2">
                                <span className="p-1 bg-purple-500/10 text-purple-400 rounded-lg shrink-0">
                                    <UserCheck className="w-4 h-4" />
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
                        <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${badge.className}`}>
                            {getStatusBadgeLabel(order)}
                        </span>
                        {getPaymentBadge(order.payment_method, order.payment_status)}
                        {pendingAssignment && (
                            <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20">
                                Sin cadete
                            </span>
                        )}
                        {pendingCash && !isRejected && (
                            <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20">
                                Efectivo pendiente
                            </span>
                        )}
                    </div>

                    <div className="text-xs text-muted-foreground space-y-2 mb-6">
                        {order.delivery_type !== 'takeaway' && (
                            <p className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                {order.delivery_address || 'Retiro en Local'}
                            </p>
                        )}
                        <p className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            {order.items?.length || 0} ítem(s)
                        </p>
                        {order.pin && (
                            <p className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-muted-foreground" />
                                <span className="font-mono font-black text-foreground tracking-widest">PIN: {order.pin}</span>
                            </p>
                        )}
                    </div>
                </div>

                <div className={`flex items-center gap-2 pt-4 ${isRejected ? 'border-t border-border border-border' : 'border-t border-border'}`}>
                    <button
                        onClick={() => { setSelectedOrder(order); setModalDetail(true); }}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                            isRejected
                                ? 'bg-card bg-[#e63946]/10 text-[#e63946] border border-[#e63946]/20 hover:bg-[#e63946]/20'
                                : 'bg-card text-foreground border border-border hover:bg-card'
                        }`}
                    >
                        <Eye className="w-4 h-4" />
                        {isRejected ? 'Ver Detalle' : 'Detalle'}
                    </button>
                    {order._section === 'awaitingApproval' && !isRejected && (
                        <>
                            <button
                                onClick={() => handleApprove(order)}
                                className="flex-1 py-2.5 px-3 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white border border-emerald-200 dark:border-emerald-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                            >
                                <CheckCircle className="w-4 h-4" /> Aceptar
                            </button>
                            <button
                                onClick={() => { setSelectedOrder(order); setModalReject(true); }}
                                className="flex-1 py-2.5 px-3 bg-[#e63946]/10 hover:bg-[#e63946] text-[#e63946] hover:text-white border border-[#e63946]/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                            >
                                <X className="w-4 h-4" /> Rechazar
                            </button>
                        </>
                    )}
                    {order._section === 'pendingAssignment' && order.delivery_type === 'delivery' && !isRejected && (
                        <button
                            onClick={() => handleOpenAssign(order)}
                            className="flex-1 py-2.5 px-3 bg-[#d4af37]/10 hover:bg-[#d4af37] text-[#d4af37] hover:text-white border border-[#d4af37]/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                            <Truck className="w-4 h-4" /> Asignar
                        </button>
                    )}
                    {order._section === 'pendingCashPayment' && !isRejected && (
                        <button
                            onClick={() => handleOpenCash(order)}
                            className="flex-1 py-2.5 px-3 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-600 text-amber-600 dark:text-amber-400 hover:text-white border border-amber-200 dark:border-amber-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                            <DollarSign className="w-4 h-4" /> Marcar Pagado
                        </button>
                    )}
                    {order._section === 'recent' && !isRejected && (
                        <>
                            {pendingAssignment && (
                                <button
                                    onClick={() => handleOpenAssign(order)}
                                    className="flex-1 py-2.5 px-3 bg-[#d4af37]/10 hover:bg-[#d4af37] text-[#d4af37] hover:text-white border border-[#d4af37]/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                >
                                    <Truck className="w-4 h-4" /> Asignar
                                </button>
                            )}
                            {pendingCash && (
                                <button
                                    onClick={() => handleOpenCash(order)}
                                    className="flex-1 py-2.5 px-3 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-600 text-amber-600 dark:text-amber-400 hover:text-white border border-amber-200 dark:border-amber-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                >
                                    <DollarSign className="w-4 h-4" /> Cobrar
                                </button>
                            )}
                            {order.delivery_type === 'takeaway' && order.status === 'ready' && (
                                <button
                                    onClick={() => handleOpenValidatePin(order)}
                                    className="flex-1 py-2.5 px-3 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white border border-emerald-200 dark:border-emerald-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                >
                                    <CheckCircle className="w-4 h-4" /> Entregar
                                </button>
                            )}
                        </>
                    )}
                    {isRejected && order.payment_method === 'effective' && order.payment_status !== 'paid' && (
                        <button
                            onClick={() => handleOpenPayment(order)}
                            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 cursor-pointer"
                        >
                            Cambiar Modalidad
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 font-sans transition-colors duration-200">
            <div className="max-w-7xl mx-auto space-y-6">
                <FlashAlert />

                {toast && (
                    <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center gap-2 animate-bounce">
                        <Bell className="w-5 h-5" />
                        <span className="font-bold text-sm">{toast}</span>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-5 sm:p-6 rounded-3xl border border-border backdrop-blur-xl shadow-sm dark:shadow-none">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2 sm:gap-3">
                            <Wallet className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-500 dark:text-emerald-400" /> Panel de Caja
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">Asigná cadetes y gestioná los pagos en efectivo</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por #pedido o nombre de cliente..."
                            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center bg-card border border-border rounded-2xl p-1 gap-1 overflow-x-auto">
                    {STATUS_TABS.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setStatusFilter(key)}
                            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                                statusFilter === key
                                    ? 'bg-foreground text-background shadow-md'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{label}</span>
                            <span className="sm:hidden">{label.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center bg-card border border-border rounded-2xl p-1 gap-1 overflow-x-auto">
                    {PAYMENT_TABS.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setPaymentFilter(key)}
                            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                                paymentFilter === key
                                    ? 'bg-foreground text-background shadow-md'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{label}</span>
                            <span className="sm:hidden">{label.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">
                        Mostrando <span className="font-bold text-foreground">{showingCount}</span> de <span className="font-bold text-foreground">{totalAvailable}</span> pedidos
                    </span>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-foreground border border-border rounded-xl transition-colors"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className={`rounded-2xl p-4 flex items-center gap-3 transition-all ${
                        awaitingApprovalCount > 0
                            ? 'bg-amber-100 dark:bg-amber-500/10 border-2 border-amber-300 dark:border-amber-500/30 shadow-lg shadow-amber-500/10'
                            : 'bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20'
                    }`}>
                        <div className={`p-2.5 rounded-xl transition-colors ${awaitingApprovalCount > 0 ? 'bg-amber-200 dark:bg-amber-500/20' : 'bg-amber-100 dark:bg-amber-500/10'}`}>
                            <Clock className={`w-5 h-5 ${awaitingApprovalCount > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-amber-600 dark:text-amber-400'}`} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pendientes de Aprobación</p>
                            <p className={`text-2xl font-black transition-colors ${awaitingApprovalCount > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-amber-700/70 dark:text-amber-300/70'}`}>
                                {awaitingApprovalCount}
                            </p>
                        </div>
                    </div>
                    <div className={`rounded-2xl p-4 flex items-center gap-3 transition-all ${
                        pendingAssignmentCount > 0
                            ? 'bg-[#d4af37]/10 border-2 border-[#d4af37]/40 shadow-lg shadow-[#d4af37]/10'
                            : 'bg-[#d4af37]/5 border border-[#d4af37]/15'
                    }`}>
                        <div className={`p-2.5 rounded-xl transition-colors ${pendingAssignmentCount > 0 ? 'bg-[#d4af37]/20' : 'bg-[#d4af37]/10'}`}>
                            <Truck className={`w-5 h-5 ${pendingAssignmentCount > 0 ? 'text-[#d4af37]' : 'text-[#e07a38]'}`} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[#e07a38] uppercase tracking-wider">Pendientes de Asignación</p>
                            <p className={`text-2xl font-black transition-colors ${pendingAssignmentCount > 0 ? 'text-[#d4af37]' : 'text-[#d4af37]/70'}`}>
                                {pendingAssignmentCount}
                            </p>
                        </div>
                    </div>
                    <div className={`rounded-2xl p-4 flex items-center gap-3 transition-all ${
                        pendingCashCount > 0
                            ? 'bg-amber-100 dark:bg-amber-500/10 border-2 border-amber-300 dark:border-amber-500/30 shadow-lg shadow-amber-500/10'
                            : 'bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20'
                    }`}>
                        <div className={`p-2.5 rounded-xl transition-colors ${pendingCashCount > 0 ? 'bg-amber-200 dark:bg-amber-500/20' : 'bg-amber-100 dark:bg-amber-500/10'}`}>
                            <DollarSign className={`w-5 h-5 ${pendingCashCount > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-amber-600 dark:text-amber-400'}`} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pagos en Efectivo Pendientes</p>
                            <p className={`text-2xl font-black transition-colors ${pendingCashCount > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-amber-700/70 dark:text-amber-300/70'}`}>
                                {pendingCashCount}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className="w-full flex items-center justify-between p-4 sm:p-6 text-left"
                    >
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            <span className="font-bold text-sm">Filtros avanzados</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-90' : ''}`} />
                    </button>
                    {showAdvancedFilters && (
                        <div className="p-4 sm:p-6 pt-0 sm:pt-0 border-t border-border">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                                <div className="relative flex-1 w-full">
                                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Buscar productos, platos o ítems..."
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        className="w-full bg-background border border-border text-foreground text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 focus:border-primary transition-all shadow-sm placeholder:text-muted-foreground"
                                    />
                                </div>
                                <div className="w-full sm:w-auto">
                                    <select
                                        value={productCategoryFilter}
                                        onChange={(e) => setProductCategoryFilter(e.target.value)}
                                        className="w-full sm:w-auto bg-background border border-border text-foreground text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
                                    >
                                        <option value="all" className="dark:bg-[#0f0f11]">Todas las categorías</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id} className="dark:bg-[#0f0f11]">
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {filteredProducts.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 mt-6">
                                    {filteredProducts.map((product) => (
                                        <div
                                            key={product.id}
                                            className="group relative bg-background border border-border rounded-2xl p-4 shadow-sm hover:shadow-xl dark:hover:shadow-none dark:hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                                        >
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                                        <Package className="w-4 h-4" />
                                                    </div>
                                                    {product.active ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                            <CheckCircle2 className="w-3 h-3" /> Activo
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-muted-foreground border border-border">
                                                            <XCircle className="w-3 h-3" /> Inactivo
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                                                        {product.name}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                                        {product.category?.name || 'Sin categoría'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-5 pt-4 border-t border-border flex items-center justify-end gap-1">
                                                <span className="text-base sm:text-lg font-extrabold text-primary shrink-0">
                                                    ${Number(product.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-background border border-border rounded-2xl p-8 sm:p-12 text-center shadow-sm mt-6">
                                    <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                    <h3 className="text-base font-semibold text-foreground">No se encontraron productos</h3>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Probá cambiando el filtro de búsqueda.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="bg-card border border-border rounded-3xl p-10 text-center text-muted-foreground space-y-2">
                        <p className="font-semibold text-lg">
                            {searchTerm
                                ? `No se encontraron resultados para "${searchTerm}"`
                                : statusFilter !== 'all'
                                    ? 'No hay pedidos con este estado'
                                    : paymentFilter !== 'all'
                                        ? 'No hay pagos con este estado'
                                        : 'No hay pedidos en esta sección'}
                        </p>
                        <p className="text-xs">
                            {searchTerm
                                ? 'Probá con otro término de búsqueda o limpia el filtro.'
                                : 'Los pedidos aparecerán aquí en cuanto lleguen al sistema.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {filteredOrders.map((order) => (
                            <OrderCard key={`${order._section}-${order.id}`} order={order} />
                        ))}
                    </div>
                )}

                {normalize(rejectedOrders).length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <X className="w-5 h-5 text-[#e63946]" />
                            <h2 className="text-lg font-bold text-foreground">Pedidos Rechazados</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {normalize(rejectedOrders).map((order) => (
                                <OrderCard key={`rejected-${order.id}`} order={{ ...order, _section: 'rejected' }} />
                            ))}
                        </div>
                        {renderPagination(rejectedOrders)}
                    </div>
                )}
            </div>

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
                                                <UserCheck className="w-4 h-4" />
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
                                        <UserCheck className="w-4 h-4 text-muted-foreground" /> {selectedOrder.delivery?.name || 'Sin asignar'}
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
                                    <p className="font-mono text-lg font-black text-foreground mt-1 tracking-widest">{selectedOrder.pin || '—'}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">Solicitá el PIN al cliente al momento de la entrega.</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Ítems del Pedido
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
                                                    <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
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
                                <span className="text-2xl font-black text-foreground dark:text-emerald-400">{formatMoney(selectedOrder.total_price)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {modalAssign && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm p-6 space-y-5">
                        <div className="flex items-center gap-3 text-[#e07a38]">
                            <div className="p-2.5 bg-[#d4af37]/10 rounded-xl">
                                <Truck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Asignar Cadete</h3>
                                <p className="text-xs text-muted-foreground">Pedido #{selectedOrder.id}</p>
                            </div>
                        </div>

                        <form onSubmit={handleAssign} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Seleccionar Cadete</label>
                                <select
                                    value={assignData.delivery_id}
                                    onChange={(e) => setAssignData('delivery_id', e.target.value)}
                                    className="w-full rounded-2xl bg-card border border-border text-foreground text-sm focus:border-[#e07a38] focus:ring-[#e07a38]/30"
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
                                    className="px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-card rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={assignProcessing || !assignData.delivery_id}
                                    className="px-5 py-2.5 text-sm font-bold bg-[#e07a38] hover:bg-[#e07a38]/80 text-white rounded-xl shadow-lg shadow-[#e07a38]/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Asignar Cadete
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modalReject && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm p-6 space-y-5">
                        <div className="flex items-center gap-3 text-[#e63946]">
                            <div className="p-2.5 bg-[#e63946]/10 rounded-xl">
                                <X className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Rechazar Pedido</h3>
                                <p className="text-xs text-muted-foreground">Pedido #{selectedOrder.id}</p>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Ingresá el motivo del rechazo (opcional). El pedido se marcará como rechazado.
                        </p>

                        <form onSubmit={handleReject} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Motivo del rechazo</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Ej: Productos agotados, fuera de horario..."
                                    rows={3}
                                    className="w-full rounded-2xl bg-card border border-border text-foreground text-sm focus:border-[#e63946] focus:ring-[#e63946]/30 p-3"
                                />
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setModalReject(false); setRejectReason(''); setSelectedOrder(null); }}
                                    className="px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-card rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 text-sm font-bold bg-[#e63946] hover:bg-[#e63946]/80 text-white rounded-xl shadow-lg shadow-[#e63946]/25 transition-all active:scale-95"
                                >
                                    Confirmar Rechazo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modalCash && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm p-6 space-y-5">
                        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                            <div className="p-2.5 bg-amber-100 dark:bg-amber-500/10 rounded-xl">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Marcar como Pagado</h3>
                                <p className="text-xs text-muted-foreground">Pedido #{selectedOrder.id}</p>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Confirmá que el pago en efectivo fue recibido. El pedido se marcará como pagado.
                        </p>

                        <form onSubmit={handleMarkCashPaid} className="space-y-4">
                            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setModalCash(false); resetCash(); }}
                                    className="px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-card rounded-xl"
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

            {modalPin && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm p-6 space-y-5">
                        <div className="flex items-center gap-3 text-[#e07a38]">
                            <div className="p-2.5 bg-[#e07a38]/10 rounded-xl">
                                <Lock className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Validar Entrega</h3>
                                <p className="text-xs text-muted-foreground">Pedido #{selectedOrder.id}</p>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Ingresá el PIN de 4 dígitos que te mostró el cliente para confirmar la entrega.
                        </p>

                        {pinError && (
                            <div className="p-3 bg-[#e63946]/10 border border-[#e63946]/30 text-[#e63946] rounded-xl text-sm">
                                {pinError}
                            </div>
                        )}

                        <form onSubmit={handleValidatePin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">PIN de 4 dígitos</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={4}
                                    value={pinInput}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                        setPinInput(val);
                                        setPinError(null);
                                    }}
                                    placeholder="0000"
                                    className="w-full text-center text-3xl font-mono tracking-[0.5em] rounded-2xl bg-card border border-border text-foreground focus:border-[#e07a38] focus:ring-[#e07a38]/30 py-4"
                                    autoFocus
                                />
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setModalPin(false); setPinInput(''); setPinError(null); }}
                                    className="px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-card rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={pinInput.length !== 4}
                                    className="px-5 py-2.5 text-sm font-bold bg-[#e07a38] hover:bg-[#e07a38]/80 text-white rounded-xl shadow-lg shadow-[#e07a38]/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirmar Entrega
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modalPayment && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm p-6 space-y-5">
                        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                            <div className="p-2.5 bg-amber-100 dark:bg-amber-500/10 rounded-xl">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Modalidad de Pago</h3>
                                <p className="text-xs text-muted-foreground">Pedido #{selectedOrder.id}</p>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Seleccioná cómo se abona este pedido.
                        </p>

                        <form onSubmit={handleUpdatePayment} className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Modalidad</label>
                                <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentForm.payment_status === 'paid' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-border hover:border-border'}`}>
                                    <input
                                        type="radio"
                                        name="payment_status"
                                        value="paid"
                                        checked={paymentForm.payment_status === 'paid'}
                                        onChange={(e) => setPaymentForm({ payment_status: e.target.value })}
                                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-border"
                                    />
                                    <div>
                                        <p className="text-sm font-bold text-foreground">Paga Ahora</p>
                                        <p className="text-xs text-muted-foreground">El pago ya fue recibido en el momento del pedido.</p>
                                    </div>
                                </label>
                                <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentForm.payment_status === 'pending_payment' ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'border-border hover:border-border'}`}>
                                    <input
                                        type="radio"
                                        name="payment_status"
                                        value="pending_payment"
                                        checked={paymentForm.payment_status === 'pending_payment'}
                                        onChange={(e) => setPaymentForm({ payment_status: e.target.value })}
                                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-border"
                                    />
                                    <div>
                                        <p className="text-sm font-bold text-foreground">Paga Después</p>
                                        <p className="text-xs text-muted-foreground">El pago se realizará al retirar/recibir el pedido.</p>
                                    </div>
                                </label>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalPayment(false)}
                                    className="px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-card rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-white rounded-xl shadow-lg shadow-amber-500/25 transition-all active:scale-95"
                                >
                                    Guardar Modalidad
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
