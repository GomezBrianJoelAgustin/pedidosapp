import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, Package, Image as ImageIcon, Eye, ShieldAlert, Power } from 'lucide-react';
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
    products: { data: Product[]; current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null; path: string };
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
        if (!deletingProduct) {
 return;
 }

        destroy(route('admin.products.destroy', deletingProduct.id), {
            onSuccess: () => setDeletingProduct(null),
        });
    };

    const [togglingId, setTogglingId] = useState<number | null>(null);

    const handleToggleActive = (product: Product) => {
        setTogglingId(product.id);
        router.patch(route('admin.products.toggle', product.id), {}, {
            onFinish: () => setTogglingId(null),
        });
    };

    const filteredProducts = products.data.filter((prod) => {
        const matchesSearch = prod.name.toLowerCase().includes(search.toLowerCase()) ||
            (prod.description && prod.description.toLowerCase().includes(search.toLowerCase()));

        const matchesCategory = selectedCategory === 'all' || String(prod.category_id) === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    return (
        <>
            <Head title="Gestión de Productos" />

            <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-10 transition-colors duration-200">
                <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

                    <FlashAlert />

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
                                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                                Productos
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Administrá la carta, precios y disponibilidad de tus productos.
                            </p>
                        </div>

                        <button
                            onClick={openCreateModal}
                                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-[#d46d2e] text-white dark:text-black font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg shadow-primary/20 active:scale-95 text-sm w-full sm:w-auto"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            Nuevo Producto
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
                        <div className="relative flex-1 sm:max-w-md">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar producto por nombre..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-background border border-border text-foreground text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 focus:border-primary transition-all shadow-sm placeholder:text-muted-foreground"
                            />
                        </div>

                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                                className="bg-background border border-border text-foreground text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
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
                                    className="group relative bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-none dark:hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="relative h-40 sm:h-44 w-full bg-background border border-border overflow-hidden flex items-center justify-center">
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
                                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
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
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/5 text-muted-foreground border border-border backdrop-blur-md shadow-sm">
                                                        <XCircle className="w-3 h-3" /> Pausado
                                                    </span>
                                                )}
                                            </div>

                                            {product.category && (
                                                <div className="absolute bottom-3 left-3">
                                                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-black/70 text-primary border border-primary/20 backdrop-blur-md">
                                                        {product.category.name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4 sm:p-5 space-y-2">
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors">
                                                    {product.name}
                                                </h3>
                                                <span className="text-base sm:text-lg font-extrabold text-primary shrink-0">
                                                    ${Number(product.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                {product.description || 'Sin descripción disponible.'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 px-5 border-t border-border flex items-center justify-end gap-1 bg-background/50 dark:bg-white/[0.02]">
                                        <button
                                            onClick={() => handleToggleActive(product)}
                                            disabled={togglingId === product.id}
                                            className={`p-2 rounded-lg transition-colors ${
                                                product.active
                                                    ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                                                    : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            title={product.active ? 'Desactivar producto' : 'Activar producto'}
                                        >
                                            <Power className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => openEditModal(product)}
                                            className="p-2 text-muted-foreground hover:text-primary dark:hover:text-primary hover:bg-white/5 rounded-lg transition-colors"
                                            title="Editar producto"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeletingProduct(product)}
                                            className="p-2 text-muted-foreground hover:text-[#e63946] dark:hover:text-[#e63946] hover:bg-white/5 rounded-lg transition-colors"
                                            title="Eliminar producto"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setViewingProduct(product)}
                                            className="p-2 text-muted-foreground hover:text-sky-500 dark:hover:text-sky-400 hover:bg-white/5 rounded-lg transition-colors"
                                            title="Ver detalle del producto"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                    ) : (
                        <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center shadow-sm">
                            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                            <h3 className="text-base font-semibold text-foreground">No se encontraron productos</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Probá cambiando el filtro de búsqueda o crea un nuevo producto.
                            </p>
                        </div>
                    )}

                    {products.last_page > 1 && (
                        <div className="flex items-center justify-between pt-2">
                            <button
                                disabled={products.current_page === 1}
                                onClick={() => window.location.href = `${products.path}?page=${products.current_page - 1}`}
                                className="px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Anterior
                            </button>
                            <span className="text-xs text-muted-foreground">
                                Página {products.current_page} de {products.last_page}
                            </span>
                            <button
                                disabled={products.current_page === products.last_page}
                                onClick={() => window.location.href = `${products.path}?page=${products.current_page + 1}`}
                                className="px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-card border-t sm:border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 shadow-2xl relative transition-all max-h-[92vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-foreground mb-5">
                            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                                    Nombre del Producto
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground"
                                    placeholder="Ej. Helado de Super Dulce de Leche 1kg"
                                />
                                {errors.name && <p className="text-xs text-[#e63946] mt-1">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                                        Categoría
                                    </label>
                                    <select
                                        value={data.category_id}
                                        onChange={(e) => setData('category_id', e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 focus:border-primary"
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
                                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                                        Precio ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.price}
                                        onChange={(e) => setData('price', e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 focus:border-primary"
                                        placeholder="0.00"
                                    />
                                    {errors.price && <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">{errors.price}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                                    URL de Imagen (Opcional)
                                </label>
                                <input
                                    type="text"
                                    value={data.image}
                                    onChange={(e) => setData('image', e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 focus:border-primary"
                                    placeholder="https://ejemplo.com/imagen.jpg"
                                />
                                {errors.image && <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">{errors.image}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                                    Descripción
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 focus:border-primary resize-none"
                                    placeholder="Detalles del producto..."
                                />
                                {errors.description && <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">{errors.description}</p>}
                            </div>

                                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-5 border-t border-border">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2.5 sm:py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-primary hover:bg-[#d46d2e] text-white dark:text-black font-semibold px-4 py-2.5 sm:py-2 rounded-xl text-sm transition-all shadow-md shadow-primary/10 disabled:opacity-50"
                                >
                                    {processing ? 'Guardando...' : editingProduct ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewingProduct && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg overflow-hidden shadow-2xl relative transition-all max-h-[92vh] flex flex-col">

                        <button
                            onClick={closeShowModal}
                                className="absolute top-3 right-3 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors"
                        >
                            <XCircle className="w-5 h-5" />
                        </button>

                            <div className="relative h-52 sm:h-64 w-full bg-background border border-border flex items-center justify-center overflow-hidden shrink-0">
                            {viewingProduct.image ? (
                                <img
                                    src={viewingProduct.image}
                                    alt={viewingProduct.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <ImageIcon className="w-12 h-12" />
                                    <span className="text-xs">Sin imagen disponible</span>
                                </div>
                            )}

                            {viewingProduct.category && (
                                <span className="absolute bottom-4 left-4 px-3 py-1 rounded-xl text-xs font-semibold bg-black/80 text-primary border border-primary/30 backdrop-blur-md">
                                    {viewingProduct.category.name}
                                </span>
                            )}
                        </div>

                        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">

                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight truncate">
                                        {viewingProduct.name}
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-1">ID del Producto: #{viewingProduct.id}</p>
                                </div>

                                {viewingProduct.active ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-muted-foreground border border-border shrink-0">
                                        <XCircle className="w-3.5 h-3.5" /> Pausado
                                    </span>
                                )}
                            </div>

                            <div className="bg-background border border-border p-4 rounded-2xl flex justify-between items-center">
                                <span className="text-xs uppercase font-semibold text-muted-foreground">Precio de Venta</span>
                                <span className="text-xl sm:text-2xl font-black text-primary">
                                    ${Number(viewingProduct.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Descripción</h3>
                                <p className="text-sm text-foreground leading-relaxed bg-background/50 dark:bg-white/[0.02] p-4 rounded-xl border border-border">
                                    {viewingProduct.description || 'Este producto no cuenta con una descripción detallada cargada.'}
                                </p>
                            </div>

                                <div className="pt-2 flex justify-end gap-3 border-t border-border">
                                    <button
                                        onClick={() => {
                                            const prod = viewingProduct;
                                            closeShowModal();
                                            openEditModal(prod);
                                        }}
                                        className="inline-flex items-center gap-2 bg-white/5 hover:bg-primary hover:text-white text-foreground font-semibold px-4 py-2.5 rounded-xl transition-all text-xs"
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
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center gap-3 text-[#e63946]">
                            <ShieldAlert className="w-7 h-7" />
                            <h3 className="text-lg font-bold text-foreground">¿Eliminar Producto?</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            ¿Estás seguro de eliminar <strong className="text-foreground">{deletingProduct.name}</strong>? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setDeletingProduct(null)}
                                className="px-4 py-2.5 sm:py-2 text-sm font-semibold text-muted-foreground hover:bg-white/5 rounded-xl"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={processing}
                                className="px-4 py-2.5 sm:py-2 text-sm font-bold bg-[#e63946] hover:bg-[#d32f3f] text-white rounded-xl shadow-lg shadow-[#e63946]/20 transition-all active:scale-95 disabled:opacity-50"
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