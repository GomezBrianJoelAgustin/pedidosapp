import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { route } from 'ziggy-js';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Ziggy } from './ziggy'; 

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

window.route = (name?: any, params?: any, absolute?: boolean, config?: any) => 
    route(name, params, absolute, { ...Ziggy, ...config }) as any;

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    
    resolve: (name) => 
        resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')) as any,

layout: (name) => {
    const pageName = name.toLowerCase(); 
    
    switch (true) {
        case pageName === 'welcome':
            return null;
        case pageName === 'auth/login':
            return null;
        case pageName.startsWith('auth/'):
            return AuthLayout;
        case pageName.startsWith('settings/'):
            return SettingsLayout;
        default:
            return AppLayout;
    }
},
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#a855f7',
    },
});

initializeTheme();