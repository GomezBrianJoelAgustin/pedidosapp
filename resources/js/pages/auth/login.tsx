import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
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
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 pt-6 sm:justify-center sm:pt-0 dark:bg-gray-900">
            <Head title="Log in" />

            <div className="mb-6">
                <Link href="/">
                    <svg className="h-20 w-20 fill-current text-amber-500" viewBox="0 0 62 65" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.18 13.62c.03-.13.1-.26.2-.35l14.85-13a.58.58 0 01.81.04.57.57 0 01.03.74L15.34 11h34.34a5.9 5.9 0 015.89 5.88v36.63a5.9 5.9 0 01-5.9 5.89H15.35A5.9 5.9 0 019.46 53.5V16.88c0-1.12.31-2.21.9-3.15l-5.18-.11zM15.35 13a3.88 3.88 0 00-3.89 3.88v36.63A3.88 3.88 0 0015.35 57.4h34.33a3.88 3.88 0 003.89-3.89V16.88A3.88 3.88 0 0049.68 13H15.35z"/>
                    </svg>
                </Link>
            </div>

            <div className="w-full overflow-hidden bg-white px-6 py-6 shadow-md sm:max-w-md sm:rounded-lg dark:bg-gray-800 border dark:border-gray-700">
                {status && (
                    <div className="mb-4 text-sm font-medium text-green-600 dark:text-green-400">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                    {/* EMAIL */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            autoFocus
                            autoComplete="username"
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setData('email', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2.5"
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                        )}
                    </div>

                    {/* PASSWORD */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            autoComplete="current-password"
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setData('password', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2.5"
                        />
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                        )}
                    </div>

                    {/* REMEMBER ME */}
                    <div className="block pt-2">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="remember"
                                checked={data.remember}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setData('remember', e.target.checked)}
                                className="rounded border-gray-300 text-amber-500 shadow-sm focus:ring-amber-500 dark:border-gray-700 dark:bg-gray-900"
                            />
                            <span className="ms-2 text-sm text-gray-600 dark:text-gray-400">
                                Recordarme
                            </span>
                        </label>
                    </div>

                    {/* BOTONES */}
                    <div className="mt-6 flex items-center justify-between pt-2">
                        {canResetPassword ? (
                            <Link
                                href={route('password.request')}
                                className="rounded-md text-sm text-gray-600 dark:text-gray-400 underline hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        ) : <div />}

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center rounded-md bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 transition-all"
                        >
                            Iniciar sesión
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}