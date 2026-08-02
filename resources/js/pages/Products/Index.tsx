import { Head, useForm } from '@inertiajs/react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, Package, Image as ImageIcon, Eye, ShieldAlert } from 'lucide-react';
import React, { useState } from 'react';
import FlashAlert from '@/components/flash-alert';


interface Category {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    description: string | null;
    price: number;
    image?: string | null;
    active: boolean;
    category_id: number;
    category?: Category;
}

interface Props {
    products: Product[];
    categories: Category[];
}

export default function Index({ products = [], categories = [] }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        description: '',
        price: '',
        category_id: '',
        image: '',
        active: true,
    });

    const openCreateModal = () => {
        setEditingProduct(null);
        reset();
        clearErrors();
        if (categories.length > 0) {
            setData('category_id', String(categories[0].id));
        }
        setIsModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setData({
            name: product.name,
            description: product.description || '',
            price: String(product.price),
            category_id: String(product.category_id),
            image: product.image || '',
            active: product.active,
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        reset();
    };

    const closeShowModal = () => {
        setViewingProduct(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProduct) {
            put(route('admin.products.update', editingProduct.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('admin.products.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = () => {
        if (!deletingProduct) return;
        destroy(route('admin.products.destroy', deletingProduct.id), {
            onSuccess: () => setDeletingProduct(null),
        });
    };

    const filteredProducts = products.filter((prod) => {
        const matchesSearch = prod.name.toLowerCase().includes(search.toLowerCase()) ||
            (prod.description && prod.description.toLowerCase().includes(search.toLowerCase()));

        const matchesCategory = selectedCategory === 'all' || String(prod.category_id) === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    return (
        <>
            <Head title="Gestión de Productos" />

            <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white p-4 sm:p-6 lg:p-10 transition-colors duration-200">
                <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

                    <FlashAlert />

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                                Productos
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Administrá la carta, precios y disponibilidad de tus productos.
                            </p>
                        </div>

                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 dark:text-black font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg shadow-amber-500/20 active:scale-95 text-sm w-full sm:w-auto"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            Nuevo Producto
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
                        <div className="relative flex-1 sm:max-w-md">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                            <input
                                type="text"
                                placeholder="Buscar producto por nombre..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/30 focus:border-amber-500 transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                        </div>

                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/30 focus:border-amber-500 transition-all shadow-sm"
                        >
                            <option value="all" className="dark:bg-[#0f0f11]">Todas las categorías</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id} className="dark:bg-[#0f0f11]">
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="group relative bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-none dark:hover:border-amber-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="relative h-40 sm:h-44 w-full bg-slate-100 dark:bg-white/5 overflow-hidden flex items-center justify-center">
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Sin+Imagen';
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-600">
                                                    <ImageIcon className="w-8 h-8" />
                                                    <span className="text-xs">Sin imagen</span>
                                                </div>
                                            )}

                                            <div className="absolute top-3 right-3">
                                                {product.active ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/90 text-white backdrop-blur-md shadow-sm">
                                                        <CheckCircle2 className="w-3 h-3" /> Activo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900/80 text-slate-300 backdrop-blur-md shadow-sm">
                                                        <XCircle className="w-3 h-3" /> Pausado
                                                    </span>
                                                )}
                                            </div>

                                            {product.category && (
                                                <div className="absolute bottom-3 left-3">
                                                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-950/70 text-amber-400 border border-amber-500/20 backdrop-blur-md">
                                                        {product.category.name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4 sm:p-5 space-y-2">
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                                    {product.name}
                                                </h3>
                                                <span className="text-base sm:text-lg font-extrabold text-amber-600 dark:text-amber-400 shrink-0">
                                                    ${Number(product.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                {product.description || 'Sin descripción disponible.'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 px-5 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-1 bg-slate-50/50 dark:bg-white/[0.02]">
                                        <button
                                            onClick={() => openEditModal(product)}
                                            className="p-2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-200/60 dark:hover:bg-white/5 rounded-lg transition-colors"
                                            title="Editar producto"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeletingProduct(product)}
                                            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-white/5 rounded-lg transition-colors"
                                            title="Eliminar producto"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setViewingProduct(product)}
                                            className="p-2 text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-slate-200/60 dark:hover:bg-white/5 rounded-lg transition-colors"
                                            title="Ver detalle del producto"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                    ) : (
                        <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl p-8 sm:p-12 text-center shadow-sm">
                            <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No se encontraron productos</h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                Probá cambiando el filtro de búsqueda o crea un nuevo producto.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#0f0f11] border-t sm:border border-slate-200 dark:border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 shadow-2xl relative transition-all max-h-[92vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">
                            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                                    Nombre del Producto
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/30 focus:border-amber-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    placeholder="Ej. Helado de Super Dulce de Leche 1kg"
                                />
                                {errors.name && <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                                        Categoría
                                    </label>
                                    <select
                                        value={data.category_id}
                                        onChange={(e) => setData('category_id', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/30 focus:border-amber-500"
                                    >
                                        <option value="" disabled className="dark:bg-[#0f0f11]">Seleccionar</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id} className="dark:bg-[#0f0f11]">
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.category_id && <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">{errors.category_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                                        Precio ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.price}
                                        onChange={(e) => setData('price', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/30 focus:border-amber-500"
                                        placeholder="0.00"
                                    />
                                    {errors.price && <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">{errors.price}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                                    URL de Imagen (Opcional)
                                </label>
                                <input
                                    type="text"
                                    value={data.image}
                                    onChange={(e) => setData('image', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/30 focus:border-amber-500"
                                    placeholder="https://ejemplo.com/imagen.jpg"
                                />
                                {errors.image && <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">{errors.image}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                                    Descripción
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/30 focus:border-amber-500 resize-none"
                                    placeholder="Detalles del producto..."
                                />
                                {errors.description && <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">{errors.description}</p>}
                            </div>

                            <div className="flex items-center gap-3 pt-1">
                                <input
                                    type="checkbox"
                                    id="product_active"
                                    checked={data.active}
                                    onChange={(e) => setData('active', e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 dark:border-white/20 dark:bg-white/5 text-amber-500 focus:ring-amber-500"
                                />
                                <label htmlFor="product_active" className="text-sm text-slate-700 dark:text-slate-300 font-medium cursor-pointer select-none">
                                    Producto disponible para venta
                                </label>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-5 border-t border-slate-100 dark:border-white/10">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2.5 sm:py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 dark:text-black font-semibold px-4 py-2.5 sm:py-2 rounded-xl text-sm transition-all shadow-md shadow-amber-500/10 disabled:opacity-50"
                                >
                                    {processing ? 'Guardando...' : editingProduct ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewingProduct && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#0f0f11] border-t sm:border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg overflow-hidden shadow-2xl relative transition-all max-h-[92vh] flex flex-col">

                        <button
                            onClick={closeShowModal}
                            className="absolute top-3 right-3 z-10 p-2 bg-slate-950/50 hover:bg-slate-950/80 text-white rounded-full backdrop-blur-md transition-colors"
                        >
                            <XCircle className="w-5 h-5" />
                        </button>

                        <div className="relative h-52 sm:h-64 w-full bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
                            {viewingProduct.image ? (
                                <img
                                    src={viewingProduct.image}
                                    alt={viewingProduct.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                                    <ImageIcon className="w-12 h-12" />
                                    <span className="text-xs">Sin imagen disponible</span>
                                </div>
                            )}

                            {viewingProduct.category && (
                                <span className="absolute bottom-4 left-4 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-950/80 text-amber-400 border border-amber-500/30 backdrop-blur-md">
                                    {viewingProduct.category.name}
                                </span>
                            )}
                        </div>

                        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">

                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                                        {viewingProduct.name}
                                    </h2>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">ID del Producto: #{viewingProduct.id}</p>
                                </div>

                                {viewingProduct.active ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20 shrink-0">
                                        <XCircle className="w-3.5 h-3.5" /> Pausado
                                    </span>
                                )}
                            </div>

                            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/10 flex justify-between items-center">
                                <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">Precio de Venta</span>
                                <span className="text-xl sm:text-2xl font-black text-amber-500 dark:text-amber-400">
                                    ${Number(viewingProduct.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 mb-2">Descripción</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-white/[0.02] p-4 rounded-xl border border-slate-100 dark:border-white/10">
                                    {viewingProduct.description || 'Este producto no cuenta con una descripción detallada cargada.'}
                                </p>
                            </div>

                            <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-white/10">
                                <button
                                    onClick={() => {
                                        const prod = viewingProduct;
                                        closeShowModal();
                                        openEditModal(prod);
                                    }}
                                    className="inline-flex items-center gap-2 bg-slate-100 dark:bg-white/5 hover:bg-amber-500 hover:text-slate-950 dark:hover:text-black text-slate-700 dark:text-slate-200 font-semibold px-4 py-2.5 rounded-xl transition-all text-xs"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    Editar Producto
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {deletingProduct && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#0f0f11] border-t sm:border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                            <ShieldAlert className="w-7 h-7" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">¿Eliminar Producto?</h3>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            ¿Estás seguro de eliminar <strong className="text-slate-800 dark:text-slate-200">{deletingProduct.name}</strong>? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setDeletingProduct(null)}
                                className="px-4 py-2.5 sm:py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={processing}
                                className="px-4 py-2.5 sm:py-2 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-600/20 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {processing ? 'Eliminando...' : 'Sí, Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}