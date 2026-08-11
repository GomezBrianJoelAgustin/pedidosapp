import { useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';

interface UsePollingOptions {
    interval?: number;
    enabled?: boolean;
    onNewOrder?: () => void;
}

export function usePolling({ interval = 5000, enabled = true, onNewOrder }: UsePollingOptions = {}) {
    const previousCountRef = useRef<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const refresh = useCallback(() => {
        router.reload({ only: [], preserveScroll: true, preserveState: true });
    }, []);

    useEffect(() => {
        if (!enabled) return;

        timerRef.current = setInterval(() => {
            refresh();

            if (onNewOrder && previousCountRef.current !== null) {
                onNewOrder();
            }
        }, interval);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [enabled, interval, refresh, onNewOrder]);

    return { refresh };
}
