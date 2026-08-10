<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmación de Pedido #{{ $order->id }}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
        .container { max-width: 640px; margin: 0 auto; padding: 32px 16px; }
        .card { background: #ffffff; border-radius: 24px; padding: 32px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); border: 1px solid #e2e8f0; }
        .logo { font-size: 32px; text-align: center; margin-bottom: 8px; }
        .title { font-size: 22px; font-weight: 800; text-align: center; margin: 0 0 4px; color: #0f172a; }
        .subtitle { font-size: 14px; text-align: center; color: #64748b; margin: 0 0 24px; }
        .pin-box { background: #fef3c7; border: 2px dashed #f59e0b; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
        .pin-label { font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #b45309; margin-bottom: 8px; }
        .pin-code { font-size: 40px; font-weight: 900; letter-spacing: 0.3em; color: #92400e; font-family: 'Courier New', Courier, monospace; }
        .pin-note { font-size: 12px; color: #b45309; margin-top: 8px; }
        .section { margin: 20px 0; }
        .section-title { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; }
        .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 14px; }
        .item:last-child { border-bottom: none; }
        .total { display: flex; justify-content: space-between; font-weight: 800; font-size: 18px; padding-top: 12px; border-top: 2px solid #e2e8f0; margin-top: 12px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #dbeafe; color: #1e40af; }
        .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 32px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="logo">🥟</div>
            <h1 class="title">¡Gracias por tu pedido!</h1>
            <p class="subtitle">Pedido #{{ $order->id }} recibido correctamente</p>

            <div class="pin-box">
                <div class="pin-label">PIN de entrega</div>
                <div class="pin-code">{{ str_pad($pin, 4, '0', STR_PAD_LEFT) }}</div>
                <div class="pin-note">Dictá este código al cadete al momento de la entrega.</div>
            </div>

            <div class="section">
                <div class="section-title">Estado del pedido</div>
                <span class="badge">Pendiente de aprobación</span>
            </div>

            <div class="section">
                <div class="section-title">Detalle</div>
                @foreach($order->items as $item)
                    <div class="item">
                        <span>{{ $item->quantity }}x {{ $item->product->name ?? 'Producto' }}</span>
                        <span>${{ number_format($item->price * $item->quantity, 0, ',', '.') }}</span>
                    </div>
                @endforeach
                <div class="total">
                    <span>Total</span>
                    <span>${{ number_format($order->total_price, 0, ',', '.') }}</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Cliente</div>
                <div class="item">
                    <span>Nombre</span>
                    <span>{{ $order->user->name ?? $order->guest_name }}</span>
                </div>
                <div class="item">
                    <span>Email</span>
                    <span>{{ $order->user->email ?? $order->guest_email }}</span>
                </div>
                <div class="item">
                    <span>Entrega</span>
                    <span>{{ $order->delivery_type === 'delivery' ? 'Envío a domicilio' : 'Retiro en local' }}</span>
                </div>
            </div>

            <div class="footer">
                <p>Empanadas 360 · {{ now()->format('d/m/Y H:i') }}</p>
            </div>
        </div>
    </div>
</body>
</html>
