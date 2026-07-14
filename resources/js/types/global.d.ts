import type { route as ziggyRoute } from 'ziggy-js';
import type { Auth } from '@/types/auth';

declare global {
    var route: typeof ziggyRoute;
    
    interface Window {
        route: typeof ziggyRoute;
    }
}

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}