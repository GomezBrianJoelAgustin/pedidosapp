import { Head, useForm } from '@inertiajs/react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, Layers, Tag } from 'lucide-react';
import React, { useState } from 'react';

interface Category {
    id: number;
    name: string;
    description: string | null;
    active: boolean;
}

interface Props {
    categories: Category[];
}

export default function Index({ categories }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [search, setSearch] = useState('');

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

            <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 p-6 sm:p-10 transition-colors duration-200">
                <div className="max-w-7xl mx-auto space-y-8">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                                <Layers className="w-6 h-6 text-amber-500" />
                                Categorías
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Administrá las categorías para organizar el catálogo de tu negocio.
                            </p>
                        </div>

                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg shadow-amber-500/20 active:scale-95 text-sm"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            Nueva Categoría
                        </button>
                    </div>

                    <div className="relative max-w-md">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                    </div>

                    {filteredCategories.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {filteredCategories.map((cat) => (
                                <div
                                    key={cat.id}
                                    className="group relative bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-xl dark:hover:shadow-slate-900/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between backdrop-blur-sm"
                                >
                                    <div className="space-y-3">
                                        {/* HEADER CARD: ICONO Y ESTADO */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                <Tag className="w-4 h-4" />
                                            </div>
                                            
                                            {cat.active ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                    <CheckCircle2 className="w-3 h-3" /> Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                    <XCircle className="w-3 h-3" /> Inactivo
                                                </span>
                                            )}
                                        </div>

                                        {/* NOMBRE Y DESCRIPCIÓN */}
                                        <div>
                                            <h3 className="font-semibold text-lg text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                                {cat.name}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                                {cat.description || 'Sin descripción asignada.'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* FOOTER CARD: ACCIONES */}
                                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => openEditModal(cat)}
                                            className="p-2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                            title="Editar categoría"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cat.id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                            title="Eliminar categoría"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
                            <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No se encontraron categorías</h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                Intenta cambiar el término de búsqueda o crea una nueva categoría.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative transition-all">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">
                            {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    placeholder="Ej. Bebidas, Postres..."
                                />
                                {errors.name && (
                                    <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">{errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                                    Descripción (Opcional)
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    placeholder="Breve descripción..."
                                />
                                {errors.description && (
                                    <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">{errors.description}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-3 pt-1">
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={data.active}
                                    onChange={(e) => setData('active', e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                                />
                                <label htmlFor="active" className="text-sm text-slate-700 dark:text-slate-300 font-medium cursor-pointer select-none">
                                    Categoría activa
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-md shadow-amber-500/10 disabled:opacity-50"
                                >
                                    {processing ? 'Guardando...' : editingCategory ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}