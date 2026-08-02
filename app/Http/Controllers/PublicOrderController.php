<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePublicOrderRequest;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;

class PublicOrderController extends Controller
{
    public function store(StorePublicOrderRequest $request)
    {
        $validated = $request->validated();

        $order = DB::transaction(function () use ($validated) {
            $order = Order::create([
                'user_id' => null,
                'delivery_id' => null,
                'guest_name' => $validated['guest_name'],
                'guest_phone' => $validated['guest_phone'],
                'status' => 'pending',
                'delivery_type' => $validated['delivery_type'],
                'delivery_address' => $validated['delivery_address'] ?? null,
                'payment_method' => $validated['payment_method'],
                'payment_status' => 'pending',
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

        return redirect()->route('home')->with('success', "¡Gracias {$validated['guest_name']}! Tu pedido #{$order->id} fue recibido.");
    }
}