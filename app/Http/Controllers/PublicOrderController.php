<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePublicOrderRequest;
use App\Models\Order;
use App\Models\OrderItem;
use App\Mail\OrderConfirmationMail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class PublicOrderController extends Controller
{
    public function store(StorePublicOrderRequest $request)
    {
        if ($request->user()) {
            return redirect()->route('client.menu')->with('info', 'Iniciá sesión como cliente para hacer un pedido desde tu cuenta.');
        }

        $validated = $request->validated();

        $paymentStatus = 'pending';

        if ($validated['payment_method'] === 'card') {
            $paymentStatus = match ($validated['payment_gateway_status'] ?? null) {
                'approved' => 'paid',
                'in_process' => 'pending',
                default => 'failed',
            };
        }

        $order = DB::transaction(function () use ($validated, $paymentStatus) {
            $order = Order::create([
                'user_id' => null,
                'delivery_id' => null,
                'guest_name' => $validated['guest_name'],
                'guest_phone' => $validated['guest_phone'],
                'guest_email' => $validated['guest_email'] ?? null,
                'status' => 'awaiting_approval',
                'pin' => str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT),
                'delivery_type' => $validated['delivery_type'],
                'delivery_address' => $validated['delivery_address'] ?? null,
                'payment_method' => $validated['payment_method'],
                'payment_status' => $paymentStatus,
                'payment_gateway_id' => $validated['payment_gateway_id'] ?? null,
                'total_price' => $validated['total_price'],
            ]);

            foreach ($validated['items'] as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                ]);
            }

            return $order;
        });

        if ($order->guest_email && $paymentStatus !== 'failed') {
            Mail::to($order->guest_email)->queue(new OrderConfirmationMail($order->load('items.product')));
        }

        $message = $paymentStatus === 'failed'
            ? 'El pago fue rechazado. Por favor intentá con otro medio de pago.'
            : "¡Gracias {$validated['guest_name']}! Tu pedido #{$order->id} fue recibido.";

        if ($paymentStatus === 'failed') {
            return redirect()->route('home')->with('error', $message);
        }

        return redirect()->route('public.order.track', ['token' => $order->tracking_token]);
    }
}