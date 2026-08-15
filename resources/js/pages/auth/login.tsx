import { Head, Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle2 , Croissant} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';

interface LoginProps {
    status?: string;
    canResetPassword?: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, [reset]);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <div className="relative min-h-screen w-full bg-background text-foreground font-sans overflow-hidden flex items-center justify-center px-6 selection:bg-primary selection:text-white">
            <Head title="Iniciar sesión" />

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-gradient-to-b from-primary/25 via-white/5 to-transparent rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <Link href="/" className="mb-4 flex flex-col items-center gap-3">
                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            <Croissant className="w-7 h-7" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                            Empandas
                        </span>
                    </Link>
                    <h1 className="font-serif text-3xl font-normal text-white text-center">
                        Bienvenido de vuelta
                    </h1>
                    <p className="text-muted-foreground text-sm font-light mt-2 text-center">
                        Iniciá sesión para gestionar tus pedidos
                    </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-7 sm:p-8 backdrop-blur-md shadow-2xl shadow-black/40">
                    {status && (
                        <div className="mb-5 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium px-4 py-3 rounded-xl">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    autoFocus
                                    autoComplete="username"
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setData('email', e.target.value)}
                                    placeholder="tu@email.com"
                                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1.5 text-xs text-rose-400">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    autoComplete="current-password"
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-11 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-xs text-rose-400">{errors.password}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setData('remember', e.target.checked)}
                                    className="w-4 h-4 rounded bg-background border-border text-primary focus:ring-primary focus:ring-offset-0"
                                />
                                <span className="text-sm text-muted-foreground">Recordarme</span>
                            </label>

                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full mt-2 py-3.5 bg-primary hover:bg-[#d46d2e] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {processing ? 'Ingresando...' : 'Iniciar sesión'}
                            {!processing && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-6">
                    <Link href="/" className="hover:text-white transition-colors">
                        ← Volver al inicio
                    </Link>
                </p>
            </div>
        </div>
    );
}