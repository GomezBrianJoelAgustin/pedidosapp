import { Head, useForm } from '@inertiajs/react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, Layers, Tag, Eye, PackageX, ImageIcon, Package } from 'lucide-react';
import React, { useState } from 'react';
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
    categories: Category[];
    products: Product[];
}

export default function Index({ categories = [], products = [] }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [search, setSearch] = useState('');
    const [viewingCategory, setViewingCategory] = useState<Category | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        description: '',
        active: true,
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
            active: category.active,
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

    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de eliminar esta categoría?')) {
            destroy(route('admin.categories.destroy', id));
        }
    };

    const filteredCategories = categories.filter((cat) =>
        cat.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <Head title="Gestión de Categorías" />

            <div className="min-h-screen bg-[#09090b] text-white p-6 sm:p-10 transition-colors duration-200">
                <div className="max-w-7xl mx-auto space-y-8">

                    <FlashAlert />

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                                <Layers className="w-6 h-6 text-amber-500" />
                                Categorías
                            </h1>
                            <p className="text-sm text-slate-400 mt-1">
                                Administrá las categorías para organizar el catálogo de tu negocio.
                            </p>
                        </div>

                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg shadow-amber-500/20 active:scale-95 text-sm"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            Nueva Categoría
                        </button>
                    </div>

                    <div className="relative max-w-md">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all placeholder:text-slate-500"
                        />
                    </div>

                    {filteredCategories.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {filteredCategories.map((cat) => (
                                <div
                                    key={cat.id}
                                    className="group relative bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:border-amber-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between backdrop-blur-sm"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                <Tag className="w-4 h-4" />
                                            </div>

                                            {cat.active ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    <CheckCircle2 className="w-3 h-3" /> Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-slate-400 border border-white/10">
                                                    <XCircle className="w-3 h-3" /> Inactivo
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="font-semibold text-lg text-white group-hover:text-amber-400 transition-colors">
                                                {cat.name}
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                                {cat.description || 'Sin descripción asignada.'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => openEditModal(cat)}
                                            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors"
                                            title="Editar categoría"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cat.id)}
                                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
                                            title="Eliminar categoría"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleOpenShowModal(cat)}
                                            className="p-2 text-slate-400 hover:text-sky-400 hover:bg-white/5 rounded-lg transition-colors"
                                            title="Ver productos de esta categoría"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-12 text-center">
                            <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                            <h3 className="text-base font-semibold text-slate-300">No se encontraron categorías</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Intenta cambiar el término de búsqueda o crea una nueva categoría.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#0f0f11] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative transition-all">
                        <h2 className="text-xl font-bold text-white mb-5">
                            {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors placeholder:text-slate-500"
                                    placeholder="Ej. Bebidas, Postres..."
                                />
                                {errors.name && (
                                    <p className="text-xs text-rose-400 mt-1">{errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                                    Descripción (Opcional)
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors resize-none placeholder:text-slate-500"
                                    placeholder="Breve descripción..."
                                />
                                {errors.description && (
                                    <p className="text-xs text-rose-400 mt-1">{errors.description}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-3 pt-1">
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={data.active}
                                    onChange={(e) => setData('active', e.target.checked)}
                                    className="w-4 h-4 rounded bg-white/5 border-white/20 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                                />
                                <label htmlFor="active" className="text-sm text-slate-300 font-medium cursor-pointer select-none">
                                    Categoría activa
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-md shadow-amber-500/10 disabled:opacity-50"
                                >
                                    {processing ? 'Guardando...' : editingCategory ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewingCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#0f0f11] border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative transition-all max-h-[90vh] flex flex-col">

                        <button
                            onClick={closeShowModal}
                            className="absolute top-4 right-4 z-10 p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-full transition-colors"
                        >
                            <XCircle className="w-5 h-5" />
                            <span className="sr-only">Cerrar</span>
                        </button>

                        <div className="p-6 border-b border-white/10 pr-14">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    <Tag className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-bold text-white tracking-tight">
                                            {viewingCategory.name}
                                        </h2>
                                        {viewingCategory.active ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                <CheckCircle2 className="w-3 h-3" /> Activo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 text-slate-400 border border-white/10">
                                                <XCircle className="w-3 h-3" /> Inactivo
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">ID de Categoría: #{viewingCategory.id}</p>
                                </div>
                            </div>

                            <div className="mt-4 bg-white/5 p-3.5 rounded-xl border border-white/10">
                                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                                    Descripción
                                </span>
                                <p className="text-sm text-slate-300">
                                    {viewingCategory.description || 'Esta categoría no cuenta con una descripción asignada.'}
                                </p>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4 flex-1">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <Package className="w-4 h-4 text-amber-500" />
                                    Productos vinculados ({categoryProducts.length})
                                </h3>
                            </div>

                            {categoryProducts.length > 0 ? (
                                <div className="space-y-2.5">
                                    {categoryProducts.map((product) => (
                                        <div
                                            key={product.id}
                                            className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                {product.image ? (
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-10 h-10 rounded-lg object-cover border border-white/10"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-slate-500">
                                                        <ImageIcon className="w-5 h-5" />
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="text-sm font-semibold text-slate-200">
                                                        {product.name}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 line-clamp-1">
                                                        {product.description || 'Sin descripción'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right flex items-center gap-3">
                                                <span className="text-sm font-bold text-amber-400">
                                                    ${Number(product.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                </span>
                                                {product.active ? (
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Producto activo" />
                                                ) : (
                                                    <span className="w-2 h-2 rounded-full bg-slate-600" title="Producto inactivo" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                                    <PackageX className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                    <p className="text-xs font-medium text-slate-400">
                                        No hay productos vinculados a esta categoría.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    const cat = viewingCategory;
                                    closeShowModal();
                                    openEditModal(cat);
                                }}
                                className="inline-flex items-center gap-2 bg-white/5 hover:bg-amber-500 hover:text-black text-slate-200 font-semibold px-4 py-2 rounded-xl transition-all text-xs"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                                Editar Categoría
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}