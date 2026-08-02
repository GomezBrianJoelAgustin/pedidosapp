import { usePage } from '@inertiajs/react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function FlashAlert() {
    const { flash } = usePage().props as any;

    if (!flash?.success && !flash?.error) return null;

    return (
        <>
            {flash.success && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl shadow-sm flex items-center gap-3 mb-6">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{flash.success}</span>
                </div>
            )}

            {flash.error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 p-4 rounded-2xl shadow-sm flex items-center gap-3 mb-6">
                    <XCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{flash.error}</span>
                </div>
            )}
        </>
    );
}