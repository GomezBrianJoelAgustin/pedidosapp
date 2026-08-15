import { type PropsWithChildren } from 'react';

export default function PublicLayout({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 font-sans">
            {children}
        </div>
    );
}
