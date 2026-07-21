import { Head, Link } from '@inertiajs/react';
import React from 'react';

interface Product {
    id: number;
    name: string;
    description?: string;
    price: number | string;
}

interface Category {
    id: number;
    name: string;
    products?: Product[];
}

interface Props {
    auth?: {
        user?: any;
    };
    menu?: Category[];
}

export default function Welcome({ auth, menu = [] }: Props) {
    return (
        <>
            <Head title="Bienvenidos | Empandas" />

            <div className="relative min-h-screen bg-[#09090b] text-[#f8fafc] font-sans overflow-x-hidden selection:bg-amber-500 selection:text-white">
                
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-amber-950/20 via-slate-900/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

                <header className="relative z-10 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                            Empandas
                        </span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <a href="#menu" className="hover:text-white transition-colors">Carta</a>
                        <a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a>
                        <a href="#redes" className="hover:text-white transition-colors">Redes</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        {auth?.user ? (
                            <Link
                                href={route('dashboard')}
                                className="text-sm font-medium text-slate-400 hover:text-white transition"
                            >
                                Panel
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="text-sm font-medium text-slate-400 hover:text-white transition"
                                >
                                    Iniciar sesión
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="bg-white text-black text-xs md:text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-slate-200 transition shadow-lg shadow-white/5"
                                >
                                    Pedir Ahora
                                </Link>
                            </>
                        )}
                    </div>
                </header>

                <section className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-16 text-center flex flex-col items-center justify-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-amber-400 tracking-wide mb-8 backdrop-blur-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        ¡LAS MAS RICAS!
                    </div>

                    <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight leading-[1.1] text-white mb-6">
                        Dorado perfecto. <br />
                        <span className="font-sans italic font-light bg-gradient-to-r from-amber-200 via-slate-200 to-white bg-clip-text text-transparent">
                            Sabor inolvidable.
                        </span>
                    </h1>

                    <p className="max-w-xl text-slate-400 text-base md:text-lg font-light leading-relaxed mb-10">
                        Empanadas artesanales hechas con ingredientes seleccionados, horneadas al momento. Directo a tu mesa.
                    </p>

                    <a
                        href="#menu"
                        className="bg-white text-black px-8 py-4 rounded-full font-semibold text-base hover:bg-slate-200 transition-all duration-300 shadow-xl shadow-white/5"
                    >
                        Ver Menú Completo
                    </a>
                </section>

                <section id="menu" className="relative z-10 max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
                    <h2 className="text-3xl font-serif text-white mb-10 text-center md:text-left">Nuestra Carta</h2>

                    {menu.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 rounded-2xl bg-white/[0.02] border border-white/5">
                            <p>Aún no hay productos cargados en el menú.</p>
                            <p className="text-xs text-slate-600 mt-2">Corré un seeder o agregalos desde el panel de control.</p>
                        </div>
                    ) : (
                        menu.map((category) => (
                            <div key={category.id} className="mb-14">
                                <h3 className="text-xl font-medium text-amber-400 mb-6 tracking-wide border-b border-amber-500/10 pb-2">
                                    {category.name}
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {category.products?.map((product) => (
                                        <div 
                                            key={product.id}
                                            className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-amber-500/30 transition-all duration-300 rounded-2xl p-5 flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                    <h4 className="font-semibold text-white text-lg group-hover:text-amber-300 transition-colors">
                                                        {product.name}
                                                    </h4>
                                                    <span className="font-mono text-amber-400 font-bold bg-amber-400/10 px-2.5 py-1 rounded-lg text-sm">
                                                        ${Number(product.price).toLocaleString()}
                                                    </span>
                                                </div>
                                                {product.description && (
                                                    <p className="text-slate-400 text-sm font-light leading-relaxed mb-4">
                                                        {product.description}
                                                    </p>
                                                )}
                                            </div>

                                            <button className="mt-4 w-full bg-white/5 hover:bg-white text-slate-300 hover:text-black py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-300">
                                                + Agregar al pedido
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </section>

                <footer className="relative z-10 border-t border-white/5 bg-black/40 py-8 text-center text-xs text-slate-600">
                    © {new Date().getFullYear()} Empanadas. Todos los derechos reservados.
                </footer>
            </div>
        </>
    );
}