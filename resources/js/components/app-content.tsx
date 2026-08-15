import * as React from 'react';
import { SidebarInset } from '@/components/ui/sidebar';
import type { AppVariant } from '@/types';

type Props = React.ComponentProps<'main'> & {
    variant?: AppVariant;
};

export function AppContent({ variant = 'sidebar', children, ...props }: Props) {
    if (variant === 'sidebar') {
        return (
            <div className="flex min-h-screen flex-1 flex-col bg-background text-foreground">
                {children}
            </div>
        );
    }

    return (
        <main
            className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 rounded-xl bg-background p-4 sm:p-6"
            {...props}
        >
            {children}
        </main>
    );
}
