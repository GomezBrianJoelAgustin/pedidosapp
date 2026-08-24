import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, Layers, Tag, Eye, PackageX, ImageIcon, Package, ShieldAlert, Power } from 'lucide-react';import React, { useState } from 'react';
import FlashAlert from '@/components/flash-alert';

interface Category {
    id: number;
    name: string;
    description: string | null;
    active: boolean;
    products?: Product[];
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
    categories: { data: Category[]; current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null; path: string };
    products: Product[];
}

export default function Index({ categories, products = [] }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [search, setSearch] = useState('');
    const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
    const [togglingId, setTogglingId] = useState<number | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        description: '',
    });

    const openCreateModal = () => {
        setEditingCategory(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        setData({
            name: category.name,
            description: category.description || '',
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        reset();
    };

    const closeShowModal = () => {
        setViewingCategory(null);
    };

    const categoryProducts = viewingCategory?.products && viewingCategory.products.length > 0
        ? viewingCategory.products
        : products.filter(
            (product) => String(product.category_id) === String(viewingCategory?.id)
        );

    const handleOpenShowModal = (category: Category) => {
        setViewingCategory(category);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingCategory) {
            put(route('admin.categories.update', editingCategory.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('admin.categories.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = () => {
        if (!deletingCategory) {
 return;
 }

        destroy(route('admin.categories.destroy', deletingCategory.id), {
            onSuccess: () => setDeletingCategory(null),
        });
    };

    const handleToggleActive = (category: Category) => {
        setTogglingId(category.id);
        router.patch(route('admin.categories.toggle', category.id), {}, {
            onFinish: () => setTogglingId(null),
        });
    };

    const filteredCategories = categories.data.filter((cat) =>
        cat.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <Head title="Gestión de Categorías" />

            <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-10 transition-colors duration-200">
                <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

                    <FlashAlert />

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
                                <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                                Categorías
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Administrá las categorías para organizar el catálogo de tu negocio.
                            </p>
                        </div>

                        <button
                            onClick={openCreateModal}
                                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-[#d46d2e] text-white dark:text-black font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg shadow-primary/20 active:scale-95 text-sm w-full sm:w-auto"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            Nueva Categoría
                        </button>
                    </div>

                    <div className="relative w-full sm:max-w-md">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-background border border-border text-foreground text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 focus:border-primary transition-all shadow-sm placeholder:text-muted-foreground"
                        />
                    </div>

                    {filteredCategories.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                            {filteredCategories.map((cat) => (
                                <div
                                    key={cat.id}
                                    className="group relative bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-xl dark:hover:shadow-none dark:hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between backdrop-blur-sm"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                                <Tag className="w-4 h-4" />
                                            </div>

                                            {cat.active ? (
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
                                                {cat.name}
                                            </h3>
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                                {cat.description || 'Sin descripción asignada.'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-border flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => handleToggleActive(cat)}
                                            disabled={togglingId === cat.id}
                                            className={`p-2 rounded-lg transition-colors ${
                                                cat.active
                                                    ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                                                    : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            title={cat.active ? 'Desactivar categoría' : 'Activar categoría'}
                                        >
                                            <Power className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => openEditModal(cat)}
                                            className="p-2 text-muted-foreground hover:text-primary dark:hover:text-primary hover:bg-white/5 rounded-lg transition-colors"
                                            title="Editar categoría"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeletingCategory(cat)}
                                            className="p-2 text-muted-foreground hover:text-[#e63946] dark:hover:text-[#e63946] hover:bg-white/5 rounded-lg transition-colors"
                                            title="Eliminar categoría"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleOpenShowModal(cat)}
                                            className="p-2 text-muted-foreground hover:text-sky-500 dark:hover:text-sky-400 hover:bg-white/5 rounded-lg transition-colors"
                                            title="Ver productos de esta categoría"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center shadow-sm">
                            <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                            <h3 className="text-base font-semibold text-foreground">No se encontraron categorías</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Intenta cambiar el término de búsqueda o crea una nueva categoría.
                            </p>
                        </div>
                    )}

                    {categories.last_page > 1 && (
                        <div className="flex items-center justify-between pt-2">
                            <button
                                disabled={categories.current_page === 1}
                                onClick={() => setSearch('')}
                                className="px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Anterior
                            </button>
                            <span className="text-xs text-muted-foreground">
                                Página {categories.current_page} de {categories.last_page}
                            </span>
                            <button
                                disabled={categories.current_page === categories.last_page}
                                onClick={() => setSearch('')}
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
                            {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground"
                                    placeholder="Ej. Bebidas, Postres..."
                                />
                                {errors.name && (
                                    <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">{errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                                    Descripción (Opcional)
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 focus:border-primary transition-colors resize-none placeholder:text-muted-foreground"
                                    placeholder="Breve descripción..."
                                />
                                {errors.description && (
                                    <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">{errors.description}</p>
                                )}
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
                                    {processing ? 'Guardando...' : editingCategory ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewingCategory && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl w-full sm:max-w-xl overflow-hidden shadow-2xl relative transition-all max-h-[92vh] flex flex-col">

                        <button
                            onClick={closeShowModal}
                                className="absolute top-4 right-4 z-10 p-2 bg-white/5 hover:bg-white/10 text-foreground rounded-full transition-colors"
                        >
                            <XCircle className="w-5 h-5" />
                            <span className="sr-only">Cerrar</span>
                        </button>

                        <div className="p-5 sm:p-6 border-b border-border pr-14">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                                    <Tag className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight truncate">
                                            {viewingCategory.name}
                                        </h2>
                                        {viewingCategory.active ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                                                <CheckCircle2 className="w-3 h-3" /> Activo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 text-muted-foreground border border-border shrink-0">
                                                <XCircle className="w-3 h-3" /> Inactivo
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">ID de Categoría: #{viewingCategory.id}</p>
                                </div>
                            </div>

                            <div className="mt-4 bg-background border border-border p-3.5 rounded-xl">
                                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block mb-1">
                                    Descripción
                                </span>
                                <p className="text-sm text-foreground">
                                    {viewingCategory.description || 'Esta categoría no cuenta con una descripción asignada.'}
                                </p>
                            </div>
                        </div>

                        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Package className="w-4 h-4 text-amber-500" />
                                    Productos vinculados ({categoryProducts.length})
                                </h3>
                            </div>

                            {categoryProducts.length > 0 ? (
                                <div className="space-y-2.5">
                                    {categoryProducts.map((product) => (
                                        <div
                                            key={product.id}
                                            className="flex items-center justify-between gap-2 p-3 rounded-xl bg-background border border-border hover:border-white/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                {product.image ? (
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                            className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                                                    />
                                                ) : (
                                                            <div className="w-10 h-10 rounded-lg bg-white/5 border border-border flex items-center justify-center text-muted-foreground shrink-0">
                                                        <ImageIcon className="w-5 h-5" />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                            <h4 className="text-sm font-semibold text-foreground truncate">
                                                        {product.name}
                                                    </h4>
                                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                                        {product.description || 'Sin descripción'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right flex items-center gap-3 shrink-0">
                                                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                                                    ${Number(product.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                </span>
                                                {product.active ? (
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Producto activo" />
                                                ) : (
                                                    <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600" title="Producto inactivo" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center bg-background/50 border border-dashed border-border rounded-2xl">
                                    <PackageX className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-xs font-medium text-muted-foreground">
                                        No hay productos vinculados a esta categoría.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-border bg-background/50 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    const cat = viewingCategory;
                                    closeShowModal();
                                    openEditModal(cat);
                                }}
                                className="inline-flex items-center gap-2 bg-white/5 hover:bg-primary hover:text-white text-foreground font-semibold px-4 py-2 rounded-xl transition-all text-xs"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                                Editar Categoría
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deletingCategory && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center gap-3 text-[#e63946]">
                            <ShieldAlert className="w-7 h-7" />
                            <h3 className="text-lg font-bold text-foreground">¿Eliminar Categoría?</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            ¿Estás seguro de eliminar <strong className="text-foreground">{deletingCategory.name}</strong>? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setDeletingCategory(null)}
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