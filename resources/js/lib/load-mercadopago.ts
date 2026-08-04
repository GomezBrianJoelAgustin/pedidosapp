let sdkPromise: Promise<void> | null = null;

export function loadMercadoPagoSdk(): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();
    if ((window as any).MercadoPago) return Promise.resolve();
    if (sdkPromise) return sdkPromise;

    sdkPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('No se pudo cargar el SDK de Mercado Pago'));
        document.head.appendChild(script);
    });

    return sdkPromise;
}