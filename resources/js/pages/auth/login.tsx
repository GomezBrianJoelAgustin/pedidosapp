import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import Checkbox from '@/components/checkbox';
import InputLabel from '@/components/input-label';
import PrimaryButton from '@/components/primary-button';
import TextInput from '@/components/text-input';

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
                    {/* SVG del Logo clásico de Laravel */}
                    <svg className="h-20 w-20 fill-current text-red-500" viewBox="0 0 62 65" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.18 13.62c.03-.13.1-.26.2-.35l14.85-13a.58.58 0 01.81.04.57.57 0 01.03.74L15.34 11h34.34a5.9 5.9 0 015.89 5.88v36.63a5.9 5.9 0 01-5.9 5.89H15.35A5.9 5.9 0 019.46 53.5V16.88c0-1.12.31-2.21.9-3.15l-5.18-.11zM15.35 13a3.88 3.88 0 00-3.89 3.88v36.63A3.88 3.88 0 0015.35 57.4h34.33a3.88 3.88 0 003.89-3.89V16.88A3.88 3.88 0 0049.68 13H15.35z"/>
                    </svg>
                </Link>
            </div>

            <div className="w-full overflow-hidden bg-white px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg dark:bg-gray-800">
                {status && (
                    <div className="mb-4 text-sm font-medium text-green-600 dark:text-green-400">
                        {status}
                    </div>
                )}

                <form onSubmit={submit}>
                    <div>
                        <InputLabel htmlFor="email" value="Email" />

                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full"
                            autoComplete="username"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                        />

                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="password" value="Password" />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                        />

                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="mt-4 block">
                        <label className="flex items-center">
                            <Checkbox
                                name="remember"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                            />
                            <span className="ms-2 text-sm text-gray-600 dark:text-gray-400">
                                Remember me
                            </span>
                        </label>
                    </div>

                    <div className="mt-4 flex items-center justify-end">
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-100 dark:focus:ring-offset-gray-800"
                            >
                                Forgot your password?
                            </Link>
                        )}

                        <PrimaryButton className="ms-4" disabled={processing}>
                            Log in
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </div>
    );
}